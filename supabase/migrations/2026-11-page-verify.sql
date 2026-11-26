-- =====================================================================
--  পেইজের ভেরিফাইড ব্যাজ
--  • পরিচিত প্রতিষ্ঠান/ব্র্যান্ড: ফ্রিতে আবেদন; অথবা কয়েন দিয়ে মেয়াদি ব্যাজ
--  • শুধু পেইজের মালিক আবেদন করতে পারেন; অ্যাডমিন অনুমোদন দেন
--  (পোস্ট বুস্ট পেইজের পোস্টেও আগে থেকেই চলে, কারণ পেইজের পোস্টের মালিক = পেইজের মালিক)
-- =====================================================================

alter table public.pages add column if not exists verified text check (verified in ('authentic','paid'));
alter table public.pages add column if not exists verified_until timestamptz;

create or replace function public.guard_page_badge()
returns trigger language plpgsql set search_path = public as $$
begin
  if (new.verified is distinct from old.verified or new.verified_until is distinct from old.verified_until)
     and coalesce(current_setting('app.badge_ok', true), '') <> 'on' and not public.is_admin() then
    new.verified := old.verified; new.verified_until := old.verified_until;
  end if;
  return new;
end $$;
drop trigger if exists guard_page_badge on public.pages;
create trigger guard_page_badge before update on public.pages for each row execute function public.guard_page_badge();
revoke all on function public.guard_page_badge() from public, anon, authenticated;

alter table public.verify_requests add column if not exists page_id bigint references public.pages(id) on delete cascade;
drop index if exists public.verify_one_pending;
create unique index if not exists verify_one_pending2 on public.verify_requests(user_id, coalesce(page_id, 0)) where status = 'pending';

drop function if exists public.request_verification(text, text, text, text, text);
create or replace function public.request_verification(p_kind text, p_name text, p_category text, p_links text, p_note text, p_page bigint default null)
returns bigint language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); price int := 0; bal int; rid bigint; v text;
begin
  if me is null then raise exception 'লগইন করুন'; end if;
  if p_page is not null then
    select verified into v from public.pages where id = p_page and owner_id = me;
    if not found then raise exception 'শুধু পেইজের মালিক আবেদন করতে পারেন'; end if;
  else
    select verified into v from public.profiles where id = me;
  end if;
  if v = 'authentic' then raise exception 'আগেই ভেরিফাইড'; end if;
  if exists (select 1 from public.verify_requests where user_id = me and page_id is not distinct from p_page and status = 'pending') then
    raise exception 'একটি আবেদন এখনো বিবেচনাধীন';
  end if;
  if p_kind = 'paid' then
    price := private.setting_int('badge_price', 500);
    select coins into bal from public.wallets where user_id = me for update;
    if coalesce(bal, 0) < price then raise exception 'যথেষ্ট কয়েন নেই (দরকার %)', price; end if;
  elsif p_kind <> 'public_figure' then raise exception 'ভুল আবেদন';
  end if;
  insert into public.verify_requests (user_id, page_id, kind, full_name, category, links, note, coins_held)
  values (me, p_page, p_kind, trim(p_name), nullif(trim(p_category), ''), nullif(trim(p_links), ''), nullif(trim(p_note), ''), price)
  returning id into rid;
  if price > 0 then perform private.add_coins(me, -price, 'badge', rid::text); end if;
  return rid;
end $$;

create or replace function public.decide_verification(p_id bigint, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare r public.verify_requests; days int; pname text;
begin
  if not public.is_admin() then raise exception 'শুধু অ্যাডমিন'; end if;
  select * into r from public.verify_requests where id = p_id and status = 'pending' for update;
  if not found then raise exception 'আবেদন পাওয়া যায়নি'; end if;
  update public.verify_requests set status = case when p_approve then 'approved' else 'rejected' end,
    admin_note = nullif(trim(p_note), ''), decided_at = now(), decided_by = auth.uid() where id = p_id;
  days := private.setting_int('badge_days', 30);
  if p_approve then
    perform set_config('app.badge_ok', 'on', true);
    if r.page_id is not null then
      update public.pages set verified = case when r.kind = 'public_figure' then 'authentic' else 'paid' end,
        verified_until = case when r.kind = 'public_figure' then null
                              else greatest(now(), coalesce(case when verified = 'paid' then verified_until end, now())) + make_interval(days => days) end
       where id = r.page_id;
    elsif r.kind = 'public_figure' then
      update public.profiles set verified = 'authentic', verified_until = null where id = r.user_id;
    else
      update public.profiles set verified = 'paid',
        verified_until = greatest(now(), coalesce(case when verified = 'paid' then verified_until end, now())) + make_interval(days => days)
       where id = r.user_id;
    end if;
    perform set_config('app.badge_ok', '', true);
  elsif r.coins_held > 0 then
    perform private.add_coins(r.user_id, r.coins_held, 'refund', p_id::text);
  end if;
  select name into pname from public.pages where id = r.page_id;
  insert into public.notifications (user_id, actor_id, type, meta)
  values (r.user_id, auth.uid(), case when p_approve then 'verify_ok' else 'verify_no' end, case when pname is not null then jsonb_build_object('page', pname) end);
end $$;

create or replace function public.admin_set_page_badge(p_page bigint, p_verified text, p_days int default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'শুধু অ্যাডমিন'; end if;
  if p_verified is not null and p_verified not in ('authentic','paid') then raise exception 'ভুল ব্যাজ'; end if;
  perform set_config('app.badge_ok', 'on', true);
  update public.pages set verified = p_verified,
    verified_until = case when p_verified = 'paid' then now() + make_interval(days => coalesce(p_days, 30)) end
   where id = p_page;
  perform set_config('app.badge_ok', '', true);
end $$;

revoke all on function public.request_verification(text, text, text, text, text, bigint) from public, anon;
revoke all on function public.admin_set_page_badge(bigint, text, int) from public, anon;
grant execute on function public.request_verification(text, text, text, text, text, bigint) to authenticated;
grant execute on function public.admin_set_page_badge(bigint, text, int) to authenticated;
