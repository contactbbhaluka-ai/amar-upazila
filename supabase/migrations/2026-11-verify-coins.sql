-- =====================================================================
--  ভেরিফাইড ব্যাজ ও কয়েন ওয়ালেট (ধাপ ১)
--  • পাবলিক ফিগার: আবেদন করে ফ্রিতে "অথেনটিক" ব্লু ব্যাজ (এডমিন অনুমোদন দেন)
--  • যে কেউ: কয়েন খরচ করে ব্যাজ নিতে পারেন (নির্দিষ্ট দিনের জন্য, এডমিন অনুমোদন দেন)
--  • পোস্ট, কমেন্ট, লাইক, শেয়ার করলে কয়েন জমা হয় (দিনে সর্বোচ্চ সীমা আছে)
--  • কয়েন শুধু অ্যাপের ভেতরে খরচ করা যায়, তোলা যায় না
-- =====================================================================

-- প্রোফাইলে ব্যাজ (সবাই দেখে); নিজে বদলানো যাবে না
alter table public.profiles add column if not exists verified text check (verified in ('authentic','paid'));
alter table public.profiles add column if not exists verified_until timestamptz;

create or replace function public.guard_profile_badge()
returns trigger language plpgsql set search_path = public as $$
begin
  if (new.verified is distinct from old.verified or new.verified_until is distinct from old.verified_until)
     and coalesce(current_setting('app.badge_ok', true), '') <> 'on' and not public.is_admin() then
    new.verified := old.verified; new.verified_until := old.verified_until;
  end if;
  return new;
end $$;
drop trigger if exists guard_profile_badge on public.profiles;
create trigger guard_profile_badge before update on public.profiles for each row execute function public.guard_profile_badge();
revoke all on function public.guard_profile_badge() from public, anon, authenticated;

-- ওয়ালেট: নিজের ব্যালান্স শুধু নিজে দেখে
create table if not exists public.wallets (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  coins      int not null default 0 check (coins >= 0),
  updated_at timestamptz not null default now()
);
alter table public.wallets enable row level security;
drop policy if exists "wallet own read" on public.wallets;
create policy "wallet own read" on public.wallets for select using (user_id = auth.uid() or public.is_admin());

-- কয়েনের হিসাব (কোথা থেকে এলো / কোথায় গেলো)
create table if not exists public.coin_ledger (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  amount     int not null,
  reason     text not null check (reason in ('post','comment','like','share','badge','refund','admin')),
  ref        text,
  created_at timestamptz not null default now()
);
create index if not exists coin_ledger_user on public.coin_ledger(user_id, created_at desc);
-- একই পোস্টে লাইক-আনলাইক করে বারবার কয়েন নেওয়া যাবে না
create unique index if not exists coin_ledger_once on public.coin_ledger(user_id, reason, ref) where reason in ('post','comment','like','share');
alter table public.coin_ledger enable row level security;
drop policy if exists "ledger own read" on public.coin_ledger;
create policy "ledger own read" on public.coin_ledger for select using (user_id = auth.uid() or public.is_admin());

-- নিয়মগুলো এডমিন বদলাতে পারেন
insert into public.app_settings (key, value) values
  ('earn_post', '5'), ('earn_comment', '2'), ('earn_like', '1'), ('earn_share', '3'),
  ('earn_daily_cap', '50'), ('badge_price', '500'), ('badge_days', '30')
on conflict (key) do nothing;

create or replace function private.setting_int(k text, d int)
returns int language sql stable security definer set search_path = public as $$
  select coalesce((select (value #>> '{}')::int from public.app_settings where key = k), d);
$$;

-- কয়েন যোগ/বিয়োগ (ভেতরের কাজ)
create or replace function private.add_coins(uid uuid, amt int, why text, r text)
returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  insert into public.coin_ledger (user_id, amount, reason, ref) values (uid, amt, why, r) on conflict do nothing;
  get diagnostics n = row_count;
  if n = 0 then return false; end if;
  insert into public.wallets (user_id, coins) values (uid, greatest(amt, 0))
    on conflict (user_id) do update set coins = public.wallets.coins + amt, updated_at = now();
  return true;
end $$;

-- কাজ করলে আয় (দিনে সর্বোচ্চ সীমা পর্যন্ত)
create or replace function private.earn(uid uuid, why text, r text)
returns void language plpgsql security definer set search_path = public as $$
declare amt int; cap int; today int;
begin
  if uid is null then return; end if;
  amt := private.setting_int('earn_' || why, 0);
  if amt <= 0 then return; end if;
  cap := private.setting_int('earn_daily_cap', 50);
  select coalesce(sum(amount), 0) into today from public.coin_ledger
   where user_id = uid and reason in ('post','comment','like','share')
     and created_at >= date_trunc('day', now() at time zone 'Asia/Dhaka') at time zone 'Asia/Dhaka';
  if today >= cap then return; end if;
  perform private.add_coins(uid, least(amt, cap - today), why, r);
end $$;

create or replace function public.on_earn_event()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  if tg_table_name = 'posts' then
    if new.shared_post_id is not null then
      select user_id into owner from public.posts where id = new.shared_post_id;
      if owner is distinct from new.user_id then perform private.earn(new.user_id, 'share', new.shared_post_id::text); end if;
    elsif new.kind = 'normal' then
      perform private.earn(new.user_id, 'post', new.id::text);
    end if;
  elsif tg_table_name = 'comments' then
    select user_id into owner from public.posts where id = new.post_id;
    if owner is distinct from new.user_id and char_length(trim(new.body)) >= 3 then
      perform private.earn(new.user_id, 'comment', new.post_id::text || ':' || new.id::text);
    end if;
  elsif tg_table_name = 'likes' then
    select user_id into owner from public.posts where id = new.post_id;
    if owner is distinct from new.user_id then perform private.earn(new.user_id, 'like', new.post_id::text); end if;
  end if;
  return null;
exception when others then return null;  -- কয়েনের কোনো সমস্যায় আসল কাজ আটকাবে না
end $$;
revoke all on function public.on_earn_event() from public, anon, authenticated;
drop trigger if exists earn_post on public.posts;
create trigger earn_post after insert on public.posts for each row execute function public.on_earn_event();
drop trigger if exists earn_comment on public.comments;
create trigger earn_comment after insert on public.comments for each row execute function public.on_earn_event();
drop trigger if exists earn_like on public.likes;
create trigger earn_like after insert on public.likes for each row execute function public.on_earn_event();

-- ব্যাজের আবেদন
create table if not exists public.verify_requests (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  kind        text not null check (kind in ('public_figure','paid')),
  full_name   text not null check (char_length(full_name) between 2 and 80),
  category    text check (char_length(category) <= 40),
  links       text check (char_length(links) <= 500),
  note        text check (char_length(note) <= 500),
  status      text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  admin_note  text check (char_length(admin_note) <= 300),
  coins_held  int not null default 0,
  created_at  timestamptz not null default now(),
  decided_at  timestamptz,
  decided_by  uuid references public.profiles(id) on delete set null
);
create unique index if not exists verify_one_pending on public.verify_requests(user_id) where status = 'pending';
alter table public.verify_requests enable row level security;
drop policy if exists "verify own read" on public.verify_requests;
create policy "verify own read" on public.verify_requests for select using (user_id = auth.uid() or public.is_admin());

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in
  ('like','comment','share','tag','friend_request','friend_accept','follow','group_request','group_approved','reply','mention','verify_ok','verify_no'));

create or replace function public.request_verification(p_kind text, p_name text, p_category text, p_links text, p_note text)
returns bigint language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); price int := 0; bal int; rid bigint; v text; vu timestamptz;
begin
  if me is null then raise exception 'লগইন করুন'; end if;
  select verified, verified_until into v, vu from public.profiles where id = me;
  if v = 'authentic' then raise exception 'আপনার অ্যাকাউন্ট আগেই ভেরিফাইড'; end if;
  if exists (select 1 from public.verify_requests where user_id = me and status = 'pending') then
    raise exception 'আপনার একটি আবেদন এখনো বিবেচনাধীন';
  end if;
  if p_kind = 'paid' then
    price := private.setting_int('badge_price', 500);
    select coins into bal from public.wallets where user_id = me for update;
    if coalesce(bal, 0) < price then raise exception 'যথেষ্ট কয়েন নেই (দরকার %)', price; end if;
  elsif p_kind <> 'public_figure' then raise exception 'ভুল আবেদন';
  end if;
  insert into public.verify_requests (user_id, kind, full_name, category, links, note, coins_held)
  values (me, p_kind, trim(p_name), nullif(trim(p_category), ''), nullif(trim(p_links), ''), nullif(trim(p_note), ''), price)
  returning id into rid;
  if price > 0 then perform private.add_coins(me, -price, 'badge', rid::text); end if;
  return rid;
end $$;

create or replace function public.cancel_verification(p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare r public.verify_requests;
begin
  select * into r from public.verify_requests where id = p_id and user_id = auth.uid() and status = 'pending' for update;
  if not found then raise exception 'আবেদন পাওয়া যায়নি'; end if;
  update public.verify_requests set status = 'cancelled', decided_at = now() where id = p_id;
  if r.coins_held > 0 then perform private.add_coins(r.user_id, r.coins_held, 'refund', p_id::text); end if;
end $$;

create or replace function public.decide_verification(p_id bigint, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare r public.verify_requests; days int;
begin
  if not public.is_admin() then raise exception 'শুধু অ্যাডমিন'; end if;
  select * into r from public.verify_requests where id = p_id and status = 'pending' for update;
  if not found then raise exception 'আবেদন পাওয়া যায়নি'; end if;
  update public.verify_requests set status = case when p_approve then 'approved' else 'rejected' end,
    admin_note = nullif(trim(p_note), ''), decided_at = now(), decided_by = auth.uid() where id = p_id;
  if p_approve then
    perform set_config('app.badge_ok', 'on', true);
    if r.kind = 'public_figure' then
      update public.profiles set verified = 'authentic', verified_until = null where id = r.user_id;
    else
      days := private.setting_int('badge_days', 30);
      update public.profiles set verified = 'paid',
        verified_until = greatest(now(), coalesce(case when verified = 'paid' then verified_until end, now())) + make_interval(days => days)
       where id = r.user_id;
    end if;
    perform set_config('app.badge_ok', '', true);
  elsif r.coins_held > 0 then
    perform private.add_coins(r.user_id, r.coins_held, 'refund', p_id::text);
  end if;
  insert into public.notifications (user_id, actor_id, type) values (r.user_id, auth.uid(), case when p_approve then 'verify_ok' else 'verify_no' end);
end $$;

-- অ্যাডমিন সরাসরি ব্যাজ দিতে/সরাতে পারেন
create or replace function public.admin_set_badge(p_user uuid, p_verified text, p_days int default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'শুধু অ্যাডমিন'; end if;
  if p_verified is not null and p_verified not in ('authentic','paid') then raise exception 'ভুল ব্যাজ'; end if;
  perform set_config('app.badge_ok', 'on', true);
  update public.profiles set verified = p_verified,
    verified_until = case when p_verified = 'paid' then now() + make_interval(days => coalesce(p_days, 30)) end
   where id = p_user;
  perform set_config('app.badge_ok', '', true);
end $$;

-- অ্যাডমিন কাউকে কয়েন দিতে/কাটতে পারেন
create or replace function public.admin_adjust_coins(p_user uuid, p_amount int, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare bal int;
begin
  if not public.is_admin() then raise exception 'শুধু অ্যাডমিন'; end if;
  select coalesce((select coins from public.wallets where user_id = p_user), 0) into bal;
  if bal + p_amount < 0 then raise exception 'ব্যালান্স শূন্যের নিচে যাবে'; end if;
  perform private.add_coins(p_user, p_amount, 'admin', coalesce(p_note, '') || ' #' || extract(epoch from clock_timestamp())::text);
end $$;

revoke all on function public.request_verification(text, text, text, text, text) from public, anon;
revoke all on function public.cancel_verification(bigint) from public, anon;
revoke all on function public.decide_verification(bigint, boolean, text) from public, anon;
revoke all on function public.admin_set_badge(uuid, text, int) from public, anon;
revoke all on function public.admin_adjust_coins(uuid, int, text) from public, anon;
grant execute on function public.request_verification(text, text, text, text, text) to authenticated;
grant execute on function public.cancel_verification(bigint) to authenticated;
grant execute on function public.decide_verification(bigint, boolean, text) to authenticated;
grant execute on function public.admin_set_badge(uuid, text, int) to authenticated;
grant execute on function public.admin_adjust_coins(uuid, int, text) to authenticated;
revoke all on function private.add_coins(uuid, int, text, text) from public, anon, authenticated;
revoke all on function private.earn(uuid, text, text) from public, anon, authenticated;
revoke all on function private.setting_int(text, int) from public, anon, authenticated;
