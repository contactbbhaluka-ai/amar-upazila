-- =====================================================================
--  পোস্ট কতজন দেখেছেন (শুধু পোস্টকারী ও অ্যাডমিন দেখেন)
--  • ফিডে পোস্ট অন্তত ১ সেকেন্ড স্ক্রিনে থাকলে "দেখা" ধরা হয়
--  • একজন মানুষ = একবার গোনা (কতজন); প্রতিদিন প্রথমবার দেখলে মোট দেখা +১
--  • নিজের পোস্ট নিজে দেখলে গোনা হয় না
-- =====================================================================

create table if not exists public.post_views (
  post_id   bigint not null references public.posts(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  times     int not null default 1,
  first_at  timestamptz not null default now(),
  last_day  date not null default ((now() at time zone 'Asia/Dhaka')::date),
  primary key (post_id, user_id)
);
create index if not exists post_views_post on public.post_views(post_id, first_at);
alter table public.post_views enable row level security;   -- সরাসরি কেউ পড়তে/লিখতে পারে না, শুধু নিচের ফাংশন দিয়ে

create or replace function public.post_seen(p_ids bigint[])
returns void language plpgsql security definer set search_path = public as $$
declare today date := (now() at time zone 'Asia/Dhaka')::date;
begin
  if auth.uid() is null or p_ids is null then return; end if;
  insert into public.post_views (post_id, user_id)
  select p.id, auth.uid() from public.posts p
   where p.id = any (p_ids[1:30]) and p.user_id <> auth.uid() and public.post_visible(p.user_id, p.group_id, p.privacy)
  on conflict (post_id, user_id) do update set times = public.post_views.times + 1, last_day = excluded.last_day
   where public.post_views.last_day < today;
end $$;

-- পোস্টের হিসাব: শুধু পোস্টকারী (পেইজের পোস্টে পেইজের মালিক) বা অ্যাডমিন
create or replace function public.post_stats(p_id bigint)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare p public.posts; r jsonb;
begin
  select * into p from public.posts where id = p_id;
  if not found then raise exception 'পোস্ট পাওয়া যায়নি'; end if;
  if p.user_id is distinct from auth.uid() and not public.is_admin() then raise exception 'শুধু পোস্টকারী দেখতে পারেন'; end if;
  select jsonb_build_object(
    'people', count(*),
    'views', coalesce(sum(times), 0),
    'today', count(*) filter (where last_day = (now() at time zone 'Asia/Dhaka')::date),
    'boost_reach', (select coalesce(sum(reach), 0) from public.boosts where post_id = p_id))
  into r from public.post_views where post_id = p_id;
  return r;
end $$;

revoke all on function public.post_seen(bigint[]) from public, anon;
revoke all on function public.post_stats(bigint) from public, anon;
grant execute on function public.post_seen(bigint[]) to authenticated;
grant execute on function public.post_stats(bigint) to authenticated;

-- ফিডে নিজের পোস্টের চোখ-বাটনে মোট ভিউ দেখানোর জন্য (একসাথে অনেকগুলো পোস্টের)
create or replace function public.post_view_counts(p_ids bigint[])
returns table (post_id bigint, views bigint) language sql stable security definer set search_path = public as $$
  select v.post_id, sum(v.times)::bigint
    from public.post_views v join public.posts p on p.id = v.post_id
   where v.post_id = any (p_ids[1:100]) and p.user_id = auth.uid()
   group by v.post_id;
$$;
revoke all on function public.post_view_counts(bigint[]) from public, anon;
grant execute on function public.post_view_counts(bigint[]) to authenticated;

-- দেখার সময় দর্শক বন্ধু বা ফলোয়ার ছিলেন কিনা (পরে ফলো করলে "নতুন ফলোয়ার" হিসেবে গোনা যায়)
alter table public.post_views add column if not exists was_close boolean;

create or replace function public.post_seen(p_ids bigint[])
returns void language plpgsql security definer set search_path = public as $$
declare today date := (now() at time zone 'Asia/Dhaka')::date; me uuid := auth.uid();
begin
  if me is null or p_ids is null then return; end if;
  insert into public.post_views (post_id, user_id, was_close)
  select p.id, me, (private.are_friends(p.user_id, me) or exists (select 1 from public.follows f where f.follower_id = me and f.followee_id = p.user_id))
    from public.posts p
   where p.id = any (p_ids[1:30]) and p.user_id <> me and public.post_visible(p.user_id, p.group_id, p.privacy)
  on conflict (post_id, user_id) do update set times = public.post_views.times + 1, last_day = excluded.last_day
   where public.post_views.last_day < today;
end $$;

create or replace function public.post_stats(p_id bigint)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare p public.posts; r jsonb;
begin
  select * into p from public.posts where id = p_id;
  if not found then raise exception 'পোস্ট পাওয়া যায়নি'; end if;
  if p.user_id is distinct from auth.uid() and not public.is_admin() then raise exception 'শুধু পোস্টকারী দেখতে পারেন'; end if;
  with v as (
    select v.*, coalesce(v.was_close, private.are_friends(p.user_id, v.user_id)
             or exists (select 1 from public.follows f where f.follower_id = v.user_id and f.followee_id = p.user_id)) as close
      from public.post_views v where v.post_id = p_id)
  select jsonb_build_object(
    'people', count(*),
    'views', coalesce(sum(times), 0),
    'today', count(*) filter (where last_day = (now() at time zone 'Asia/Dhaka')::date),
    'close', count(*) filter (where close),
    'others', count(*) filter (where not close),
    'new_followers', count(*) filter (where not close and exists (select 1 from public.follows f
                       where f.follower_id = v.user_id and f.followee_id = p.user_id and f.created_at >= v.first_at)),
    'boost_reach', (select coalesce(sum(reach), 0) from public.boosts where post_id = p_id))
  into r from v;
  return r;
end $$;
