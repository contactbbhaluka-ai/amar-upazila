-- =====================================================================
--  পোস্ট বুস্ট / বিজ্ঞাপন (ধাপ ২): কয়েন দিয়ে নিজের পোস্ট বেশি মানুষের কাছে পৌঁছানো
--  • নিজের পাবলিক পোস্ট বুস্ট করা যায়; দিন × দৈনিক দাম কয়েন লাগে
--  • পুরো উপজেলা বা নির্দিষ্ট ইউনিয়নের মানুষকে দেখানো যায়
--  • অ্যাডমিন অনুমোদন দিলে চালু হয়; বাতিল বা প্রত্যাখ্যান হলে কয়েন ফেরত
--  • হোম ফিডে "স্পন্সরড" লেখা সহ দেখায়; কতজন দেখেছেন (রিচ) গোনা হয়
-- =====================================================================

create table if not exists public.boosts (
  id          bigint generated always as identity primary key,
  post_id     bigint not null references public.posts(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  days        int not null check (days between 1 and 30),
  coins       int not null check (coins >= 0),
  union_id    bigint references public.unions(id) on delete set null,   -- খালি = পুরো উপজেলা
  status      text not null default 'pending' check (status in ('pending','active','rejected','cancelled','stopped')),
  admin_note  text check (char_length(admin_note) <= 300),
  starts_at   timestamptz,
  ends_at     timestamptz,
  reach       int not null default 0,
  created_at  timestamptz not null default now(),
  decided_at  timestamptz,
  decided_by  uuid references public.profiles(id) on delete set null
);
create index if not exists boosts_live on public.boosts(status, ends_at);
create index if not exists boosts_user on public.boosts(user_id, created_at desc);
alter table public.boosts enable row level security;
drop policy if exists "boosts own read" on public.boosts;
create policy "boosts own read" on public.boosts for select using (user_id = auth.uid() or public.is_admin());

-- একই মানুষ দিনে একবার দেখলে একবারই গোনা
create table if not exists public.boost_views (
  boost_id bigint not null references public.boosts(id) on delete cascade,
  user_id  uuid not null references public.profiles(id) on delete cascade,
  day      date not null default ((now() at time zone 'Asia/Dhaka')::date),
  primary key (boost_id, user_id, day)
);
alter table public.boost_views enable row level security;

insert into public.app_settings (key, value) values ('boost_price_day', '50'), ('feature_boost', 'true')
on conflict (key) do nothing;

alter table public.coin_ledger drop constraint if exists coin_ledger_reason_check;
alter table public.coin_ledger add constraint coin_ledger_reason_check check (reason in ('post','comment','like','share','badge','boost','refund','admin'));

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in
  ('like','comment','share','tag','friend_request','friend_accept','follow','group_request','group_approved','reply','mention','verify_ok','verify_no','boost_ok','boost_no'));

create or replace function public.request_boost(p_post bigint, p_days int, p_union bigint default null)
returns bigint language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); p public.posts; price int; bal int; bid bigint;
begin
  if me is null then raise exception 'লগইন করুন'; end if;
  if p_days is null or p_days < 1 or p_days > 30 then raise exception 'বুস্ট ১ থেকে ৩০ দিনের জন্য করা যায়'; end if;
  select * into p from public.posts where id = p_post;
  if not found or p.user_id <> me then raise exception 'শুধু নিজের পোস্ট বুস্ট করা যায়'; end if;
  if p.privacy <> 'public' or p.group_id is not null then raise exception 'শুধু পাবলিক পোস্ট বুস্ট করা যায়'; end if;
  if exists (select 1 from public.boosts where post_id = p_post and (status = 'pending' or (status = 'active' and ends_at > now()))) then
    raise exception 'এই পোস্টের একটি বুস্ট আগে থেকেই চলছে বা অপেক্ষায় আছে';
  end if;
  if p_union is not null and not exists (select 1 from public.unions where id = p_union) then raise exception 'ইউনিয়ন পাওয়া যায়নি'; end if;
  price := p_days * private.setting_int('boost_price_day', 50);
  select coins into bal from public.wallets where user_id = me for update;
  if coalesce(bal, 0) < price then raise exception 'যথেষ্ট কয়েন নেই (দরকার %)', price; end if;
  insert into public.boosts (post_id, user_id, days, coins, union_id) values (p_post, me, p_days, price, p_union) returning id into bid;
  perform private.add_coins(me, -price, 'boost', bid::text);
  return bid;
end $$;

-- অপেক্ষায় থাকলে বাতিল (পুরো কয়েন ফেরত); চালু থাকলে বন্ধ (বাকি দিনের কয়েন ফেরত)
create or replace function public.cancel_boost(p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare b public.boosts; back int := 0; left_days int;
begin
  select * into b from public.boosts where id = p_id and user_id = auth.uid() for update;
  if not found then raise exception 'বুস্ট পাওয়া যায়নি'; end if;
  if b.status = 'pending' then
    update public.boosts set status = 'cancelled', decided_at = now() where id = p_id; back := b.coins;
  elsif b.status = 'active' and b.ends_at > now() then
    left_days := floor(extract(epoch from (b.ends_at - now())) / 86400)::int;
    back := least(b.coins, left_days * (b.coins / b.days));
    update public.boosts set status = 'stopped', ends_at = now() where id = p_id;
  else raise exception 'এই বুস্ট আর বন্ধ করা যায় না';
  end if;
  if back > 0 then perform private.add_coins(b.user_id, back, 'refund', 'boost:' || p_id::text); end if;
end $$;

create or replace function public.decide_boost(p_id bigint, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare b public.boosts;
begin
  if not public.is_admin() then raise exception 'শুধু অ্যাডমিন'; end if;
  select * into b from public.boosts where id = p_id and status = 'pending' for update;
  if not found then raise exception 'বুস্ট পাওয়া যায়নি'; end if;
  if p_approve then
    update public.boosts set status = 'active', starts_at = now(), ends_at = now() + make_interval(days => b.days),
      admin_note = nullif(trim(p_note), ''), decided_at = now(), decided_by = auth.uid() where id = p_id;
  else
    update public.boosts set status = 'rejected', admin_note = nullif(trim(p_note), ''), decided_at = now(), decided_by = auth.uid() where id = p_id;
    if b.coins > 0 then perform private.add_coins(b.user_id, b.coins, 'refund', 'boost:' || p_id::text); end if;
  end if;
  insert into public.notifications (user_id, actor_id, type, post_id) values (b.user_id, auth.uid(), case when p_approve then 'boost_ok' else 'boost_no' end, b.post_id);
end $$;

-- ফিডে দেখানোর জন্য চালু বুস্ট (দর্শকের এলাকা ও ব্লক মেনে, এলোমেলো ক্রমে)
create or replace function public.active_boosts(p_limit int default 3)
returns table (boost_id bigint, post_id bigint) language sql stable security definer set search_path = public as $$
  select b.id, b.post_id
    from public.boosts b join public.posts p on p.id = b.post_id
   where b.status = 'active' and b.starts_at <= now() and b.ends_at > now()
     and p.privacy = 'public' and p.group_id is null
     and (auth.uid() is null or (p.user_id <> auth.uid() and not private.is_blocked(p.user_id, auth.uid())))
     and (b.union_id is null or b.union_id = (select union_id from public.profiles where id = auth.uid()))
     and public.setting_on('feature_boost')
   order by random()
   limit least(greatest(coalesce(p_limit, 3), 1), 5);
$$;

-- দেখা হলে রিচ গোনা (একজন দিনে একবার)
create or replace function public.boost_seen(p_ids bigint[])
returns void language plpgsql security definer set search_path = public as $$
declare bid bigint; n int;
begin
  if auth.uid() is null or p_ids is null then return; end if;
  foreach bid in array p_ids[1:5] loop
    insert into public.boost_views (boost_id, user_id)
      select b.id, auth.uid() from public.boosts b where b.id = bid and b.status = 'active' and b.ends_at > now() and b.user_id <> auth.uid()
    on conflict do nothing;
    get diagnostics n = row_count;
    if n > 0 then update public.boosts set reach = reach + 1 where id = bid; end if;
  end loop;
end $$;

revoke all on function public.request_boost(bigint, int, bigint) from public, anon;
revoke all on function public.cancel_boost(bigint) from public, anon;
revoke all on function public.decide_boost(bigint, boolean, text) from public, anon;
revoke all on function public.boost_seen(bigint[]) from public, anon;
grant execute on function public.request_boost(bigint, int, bigint) to authenticated;
grant execute on function public.cancel_boost(bigint) to authenticated;
grant execute on function public.decide_boost(bigint, boolean, text) to authenticated;
grant execute on function public.boost_seen(bigint[]) to authenticated;
grant execute on function public.active_boosts(int) to anon, authenticated;
