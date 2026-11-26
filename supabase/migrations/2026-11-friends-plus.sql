-- =====================================================================
--  বন্ধু (২): সাজেশনের কারণ ও সরানো, সহপাঠী, আশেপাশের নতুন মানুষ, পাঠানো রিকোয়েস্ট,
--  সব গ্রহণ, ক্লোজ ফ্রেন্ড, বন্ধুর তালিকা, ৩০ দিন বিরতি, বন্ধুত্বের বার্ষিকী,
--  জন্মদিনের তালিকা, কে রিকোয়েস্ট পাঠাতে পারবে, ভুয়া অ্যাকাউন্টের সতর্কতা
-- =====================================================================

-- কবে বন্ধু হয়েছেন (বার্ষিকীর জন্য)
alter table public.friendships add column if not exists accepted_at timestamptz;
update public.friendships set accepted_at = created_at where status = 'accepted' and accepted_at is null;
create or replace function private.friendship_accepted()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' then new.accepted_at := now(); end if;
  return new;
end $$;
drop trigger if exists friendship_accepted on public.friendships;
create trigger friendship_accepted before update on public.friendships for each row execute function private.friendship_accepted();

-- ক্লোজ ফ্রেন্ড ও বিরতি (শুধু নিজে দেখেন)
create table if not exists public.friend_marks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  other_id uuid not null references public.profiles(id) on delete cascade,
  close boolean not null default false,
  snooze_until timestamptz,
  primary key (user_id, other_id),
  check (user_id <> other_id)
);
create index if not exists friend_marks_close_idx on public.friend_marks (other_id) where close;
alter table public.friend_marks enable row level security;
drop policy if exists "friend marks own" on public.friend_marks;
create policy "friend marks own" on public.friend_marks for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- বন্ধুর তালিকা (পরিবার, অফিস…)
create table if not exists public.friend_lists (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
create table if not exists public.friend_list_members (
  list_id bigint not null references public.friend_lists(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  primary key (list_id, member_id)
);
alter table public.friend_lists enable row level security;
alter table public.friend_list_members enable row level security;
drop policy if exists "friend lists own" on public.friend_lists;
create policy "friend lists own" on public.friend_lists for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "friend list members own" on public.friend_list_members;
create policy "friend list members own" on public.friend_list_members for all
  using (exists (select 1 from public.friend_lists l where l.id = list_id and l.user_id = auth.uid()))
  with check (exists (select 1 from public.friend_lists l where l.id = list_id and l.user_id = auth.uid()));
create or replace function private.friend_lists_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.friend_lists where user_id = new.user_id) >= 20 then raise exception 'lists max 20'; end if;
  return new;
end $$;
drop trigger if exists friend_lists_limit on public.friend_lists;
create trigger friend_lists_limit before insert on public.friend_lists for each row execute function private.friend_lists_limit();

-- সাজেশন থেকে সরানো
create table if not exists public.friend_suggest_hidden (
  user_id uuid not null references public.profiles(id) on delete cascade,
  other_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, other_id)
);
alter table public.friend_suggest_hidden enable row level security;
drop policy if exists "suggest hidden own" on public.friend_suggest_hidden;
create policy "suggest hidden own" on public.friend_suggest_hidden for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- কে ফ্রেন্ড রিকোয়েস্ট পাঠাতে পারবে: সবাই / মিউচুয়াল বন্ধু থাকলে / নিজের উপজেলার মানুষ
alter table public.profiles add column if not exists friend_req_from text not null default 'everyone';
alter table public.profiles drop constraint if exists profiles_friend_req_from_check;
alter table public.profiles add constraint profiles_friend_req_from_check check (friend_req_from in ('everyone', 'mutual', 'upazila'));
create or replace function private.can_friend_req(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select case (select friend_req_from from public.profiles where id = b)
    when 'mutual' then exists (select 1 from public.friendships x where x.status = 'accepted' and a in (x.requester, x.addressee)
                                  and private.are_friends(case when x.requester = a then x.addressee else x.requester end, b))
    when 'upazila' then exists (select 1 from public.profiles pa, public.profiles pb where pa.id = a and pb.id = b
                                  and ((pa.union_id is not null and pb.union_id is not null) or (pa.upazila is not null and pa.upazila = pb.upazila)))
    else true end;
$$;
grant execute on function private.can_friend_req(uuid, uuid) to public;
drop policy if exists "friends request" on public.friendships;
create policy "friends request" on public.friendships for insert to authenticated
  with check (requester = auth.uid() and status = 'pending' and not public.is_blocked(requester, addressee) and private.can_friend_req(requester, addressee));
-- রিকোয়েস্ট না গেলে কারণ দেখাতে
create or replace function public.friend_req_rule(uid uuid)
returns text language sql stable security definer set search_path = public as $$
  select friend_req_from from public.profiles where id = uid and auth.uid() is not null;
$$;

-- সব রিকোয়েস্ট একসাথে গ্রহণ
create or replace function public.accept_all_friends()
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  with up as (
    update public.friendships set status = 'accepted'
     where addressee = auth.uid() and status = 'pending' and not public.is_blocked(requester, addressee)
    returning requester
  ), fo as (
    insert into public.follows (follower_id, followee_id) select auth.uid(), requester from up on conflict do nothing
  )
  select count(*) into n from up;
  return n;
end $$;
revoke all on function public.accept_all_friends() from public, anon;
grant execute on function public.accept_all_friends() to authenticated;

-- কয়েকজনের তথ্য: মিউচুয়াল বন্ধু, অ্যাকাউন্ট কবে খোলা, কবে থেকে বন্ধু, পোস্ট সংখ্যা (ভুয়া অ্যাকাউন্ট বোঝাতে)
create or replace function public.friend_meta(p_ids uuid[])
returns table(id uuid, mutual int, joined_at timestamptz, friends_since timestamptz, posts int)
language sql stable security definer set search_path = public as $$
  with mine as (
    select case when requester = auth.uid() then addressee else requester end f
      from public.friendships where status = 'accepted' and auth.uid() in (requester, addressee)
  )
  select p.id,
         (select count(*) from mine m where private.are_friends(m.f, p.id))::int,
         p.created_at,
         (select coalesce(x.accepted_at, x.created_at) from public.friendships x where x.status = 'accepted'
             and least(x.requester, x.addressee) = least(auth.uid(), p.id) and greatest(x.requester, x.addressee) = greatest(auth.uid(), p.id)),
         (select count(*) from public.posts po where po.user_id = p.id and po.page_id is null and po.group_id is null and po.privacy = 'public')::int
    from public.profiles p
   where auth.uid() is not null and p.id = any (p_ids[1:200]);
$$;

-- পরিচিত হতে পারেন: মিউচুয়াল বন্ধু, একই স্কুল/কলেজ, একই ইউনিয়ন, নতুন যোগ দেওয়া — কারণসহ
create or replace function public.friend_suggestions(p_limit int default 40)
returns table(id uuid, mutual int, same_area boolean, school text, is_new boolean)
language sql stable security definer set search_path = public as $$
  with mep as (select union_id, upazila from public.profiles where id = auth.uid()),
  mine as (
    select case when requester = auth.uid() then addressee else requester end f
      from public.friendships where status = 'accepted' and auth.uid() in (requester, addressee)
  ),
  excl as (
    select case when requester = auth.uid() then addressee else requester end u from public.friendships where auth.uid() in (requester, addressee)
    union select other_id from public.friend_suggest_hidden where user_id = auth.uid()
    union select blocked_id from public.blocks where blocker_id = auth.uid()
    union select blocker_id from public.blocks where blocked_id = auth.uid()
    union select auth.uid()
  ),
  my_schools as (
    select distinct lower(btrim(e->>'school')) s from public.profile_details pd, jsonb_array_elements(pd.educations) e where pd.user_id = auth.uid()
  ),
  cand as (
    select case when x.requester = m.f then x.addressee else x.requester end u
      from mine m join public.friendships x on x.status = 'accepted' and m.f in (x.requester, x.addressee)
    union
    select * from (select p.id from public.profiles p, mep
                    where (mep.union_id is not null and p.union_id = mep.union_id) or (mep.union_id is null and mep.upazila is not null and p.upazila = mep.upazila)
                    order by p.created_at desc limit 300) a
    union
    select pd.user_id from public.profile_details pd, jsonb_array_elements(pd.educations) e
     where lower(btrim(e->>'school')) in (select s from my_schools) and private.can_view(pd.user_id, pd.educations_visibility)
  ),
  scored as (
    select c.u,
           (select count(*) from mine m where private.are_friends(m.f, c.u))::int mutual,
           coalesce((mep.union_id is not null and p.union_id = mep.union_id) or (mep.union_id is null and p.upazila = mep.upazila), false) same_area,
           (select e->>'school' from public.profile_details pd, jsonb_array_elements(pd.educations) e
             where pd.user_id = c.u and lower(btrim(e->>'school')) in (select s from my_schools) and private.can_view(c.u, pd.educations_visibility) limit 1) school,
           p.created_at > now() - interval '7 days' is_new, p.created_at
      from cand c join public.profiles p on p.id = c.u, mep
     where c.u not in (select u from excl where u is not null)
  )
  select u, mutual, same_area, school, is_new from scored
   where auth.uid() is not null
   order by mutual desc, (school is not null) desc, same_area desc, created_at desc
   limit least(greatest(p_limit, 1), 100);
$$;

-- এই সপ্তাহে নিজের ইউনিয়ন/উপজেলা থেকে কতজন যোগ দিয়েছেন
create or replace function public.new_near_me()
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from public.profiles p, (select union_id, upazila from public.profiles where id = auth.uid()) m
   where p.id <> auth.uid() and p.created_at > now() - interval '7 days'
     and ((m.union_id is not null and p.union_id = m.union_id) or (m.union_id is null and m.upazila is not null and p.upazila = m.upazila));
$$;

-- সামনের জন্মদিন (আজ থেকে p_days দিনের মধ্যে), বন্ধুর গোপনীয়তা মেনে
create or replace function public.friends_birthdays_upcoming(p_days int default 31)
returns table(id uuid, name text, avatar_url text, next_date date, days int)
language sql stable security definer set search_path = public as $$
  with today as (select (now() at time zone 'Asia/Dhaka')::date d),
  b as (
    select p.id, p.name, p.avatar_url, pd.birth_date bd, today.d
      from public.friendships f
      join public.profiles p on p.id = case when f.requester = auth.uid() then f.addressee else f.requester end
      join public.profile_details pd on pd.user_id = p.id, today
     where f.status = 'accepted' and auth.uid() in (f.requester, f.addressee)
       and pd.birth_date is not null and private.can_view(p.id, coalesce(pd.birth_visibility, 'only_me'))
  ),
  n as (
    select b.*, (bd + make_interval(years => (extract(year from d) - extract(year from bd))::int))::date nb from b
  ),
  n2 as (
    select id, name, avatar_url, case when nb < d then (bd + make_interval(years => (extract(year from d) - extract(year from bd))::int + 1))::date else nb end nd, d from n
  )
  select id, name, avatar_url, nd, (nd - d)::int from n2
   where nd - d <= least(greatest(p_days, 0), 366) order by nd - d, name limit 100;
$$;

-- আজ বন্ধুত্বের বার্ষিকী (কমপক্ষে ১ বছর)
create or replace function public.friend_anniversaries()
returns table(id uuid, name text, avatar_url text, years int)
language sql stable security definer set search_path = public as $$
  with today as (select (now() at time zone 'Asia/Dhaka')::date d)
  select p.id, p.name, p.avatar_url,
         (extract(year from today.d) - extract(year from (f.accepted_at at time zone 'Asia/Dhaka')))::int
    from public.friendships f
    join public.profiles p on p.id = case when f.requester = auth.uid() then f.addressee else f.requester end, today
   where f.status = 'accepted' and auth.uid() in (f.requester, f.addressee) and f.accepted_at is not null
     and to_char(f.accepted_at at time zone 'Asia/Dhaka', 'MM-DD') = to_char(today.d, 'MM-DD')
     and (f.accepted_at at time zone 'Asia/Dhaka')::date <= today.d - interval '1 year'
   limit 20;
$$;

-- ক্লোজ ফ্রেন্ডদের জন্য পোস্ট: প্রাইভেসি 'close'
alter table public.posts drop constraint if exists posts_privacy_check;
alter table public.posts add constraint posts_privacy_check check (privacy in ('public', 'friends', 'close', 'only_me'));
create or replace function public.post_visible(p_user uuid, p_group bigint, p_privacy text)
returns boolean language sql stable security definer set search_path = public as $$
  select (p_group is null or public.can_see_group(p_group))
     and (p_privacy = 'public' or p_user = auth.uid() or public.is_admin()
          or (p_privacy = 'friends' and public.are_friends(auth.uid(), p_user))
          or (p_privacy = 'close' and public.are_friends(auth.uid(), p_user)
              and exists (select 1 from public.friend_marks fm where fm.user_id = p_user and fm.other_id = auth.uid() and fm.close)));
$$;
