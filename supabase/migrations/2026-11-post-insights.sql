-- =====================================================================
--  পোস্টের বিস্তারিত হিসাব ও প্রোফাইল ড্যাশবোর্ড
--  • কোথা থেকে দেখেছেন (হোম ফিড, প্রোফাইল, শেয়ার, গ্রুপ, বুস্ট…)
--  • প্রতিদিনের ভিউ (৭ দিনের গ্রাফ)
--  • পোস্ট থেকে প্রোফাইলে যাওয়া, ছবি খোলা, "আরও দেখুন" চাপা
--  • কোন এলাকা, লিঙ্গ ও বয়সের মানুষ দেখেছেন (অন্তত ১০ জন হলে)
--  • সব পোস্ট মিলিয়ে ড্যাশবোর্ড ও পোস্ট করার সেরা সময়
--  সব কিছু শুধু পোস্টকারী দেখেন; কে কে দেখেছেন তা কখনো দেখানো হয় না
-- =====================================================================

alter table public.post_views add column if not exists source text
  check (source in ('feed','boost','profile','share','group','page','post','search','saved','other'));

create table if not exists public.post_view_days (
  post_id bigint not null references public.posts(id) on delete cascade,
  day     date not null,
  n       int not null default 0,
  primary key (post_id, day)
);
alter table public.post_view_days enable row level security;

create table if not exists public.post_clicks (
  post_id    bigint not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  kind       text not null check (kind in ('profile','photo','more')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, kind)
);
alter table public.post_clicks enable row level security;

-- দেখা গোনা (উৎস সহ)। একজন দিনে একবার; প্রতিদিনের হিসাবও বাড়ে
create or replace function public.post_seen2(p_ids bigint[], p_src text[])
returns void language plpgsql security definer set search_path = public as $$
declare today date := (now() at time zone 'Asia/Dhaka')::date; me uuid := auth.uid();
begin
  if me is null or p_ids is null then return; end if;
  with t as (
    select distinct on (x.id) x.id,
           case when x.src in ('feed','boost','profile','share','group','page','post','search','saved') then x.src else 'other' end as src
      from unnest(p_ids[1:30], (coalesce(p_src, '{}'::text[]))[1:30]) as x(id, src) where x.id is not null),
  up as (
    insert into public.post_views (post_id, user_id, was_close, source)
    select p.id, me, (private.are_friends(p.user_id, me) or exists (select 1 from public.follows f where f.follower_id = me and f.followee_id = p.user_id)), t.src
      from t join public.posts p on p.id = t.id
     where p.user_id <> me and public.post_visible(p.user_id, p.group_id, p.privacy)
    on conflict (post_id, user_id) do update set times = public.post_views.times + 1, last_day = excluded.last_day
     where public.post_views.last_day < today
    returning post_id)
  insert into public.post_view_days (post_id, day, n)
  select post_id, today, count(*) from up group by post_id
  on conflict (post_id, day) do update set n = public.post_view_days.n + excluded.n;
end $$;

-- পুরনো অ্যাপের জন্য আগের নামটাও কাজ করে
create or replace function public.post_seen(p_ids bigint[])
returns void language sql security definer set search_path = public as $$
  select public.post_seen2(p_ids, null);
$$;

create or replace function public.post_click(p_post bigint, p_kind text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or p_kind not in ('profile','photo','more') then return; end if;
  insert into public.post_clicks (post_id, user_id, kind)
  select p.id, auth.uid(), p_kind from public.posts p
   where p.id = p_post and p.user_id <> auth.uid() and public.post_visible(p.user_id, p.group_id, p.privacy)
  on conflict do nothing;
end $$;

create or replace function public.post_stats(p_id bigint)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare p public.posts; r jsonb; today date := (now() at time zone 'Asia/Dhaka')::date; ppl int;
begin
  select * into p from public.posts where id = p_id;
  if not found then raise exception 'পোস্ট পাওয়া যায়নি'; end if;
  if p.user_id is distinct from auth.uid() and not public.is_admin() then raise exception 'শুধু পোস্টকারী দেখতে পারেন'; end if;
  select count(*) into ppl from public.post_views where post_id = p_id;
  with v as (
    select v.*, coalesce(v.was_close, private.are_friends(p.user_id, v.user_id)
             or exists (select 1 from public.follows f where f.follower_id = v.user_id and f.followee_id = p.user_id)) as close,
           pr.gender, pr.upazila, u.name as union_name, d.birth_date
      from public.post_views v
      join public.profiles pr on pr.id = v.user_id
      left join public.unions u on u.id = pr.union_id
      left join public.profile_details d on d.user_id = v.user_id
     where v.post_id = p_id)
  select jsonb_build_object(
    'people', count(*),
    'views', coalesce(sum(times), 0),
    'today', count(*) filter (where last_day = today),
    'close', count(*) filter (where close),
    'others', count(*) filter (where not close),
    'new_followers', count(*) filter (where not close and exists (select 1 from public.follows f
                       where f.follower_id = v.user_id and f.followee_id = p.user_id and f.created_at >= v.first_at)),
    'sources', (select coalesce(jsonb_object_agg(s, n), '{}') from (select coalesce(source, 'other') s, count(*) n from v group by 1) x),
    'areas', (select coalesce(jsonb_agg(jsonb_build_object('name', a, 'n', n) order by n desc), '[]') from
               (select coalesce(union_name, upazila, 'অজানা') a, count(*) n from v group by 1 order by 2 desc limit 6) x),
    'genders', case when ppl >= 10 then (select coalesce(jsonb_object_agg(g, n), '{}') from (select coalesce(gender, 'unknown') g, count(*) n from v group by 1) x) end,
    'ages', case when ppl >= 10 then (select coalesce(jsonb_object_agg(b, n), '{}') from (
               select case when birth_date is null then 'unknown'
                           when age(birth_date) < interval '18 years' then '13-17'
                           when age(birth_date) < interval '25 years' then '18-24'
                           when age(birth_date) < interval '35 years' then '25-34'
                           when age(birth_date) < interval '45 years' then '35-44'
                           else '45+' end b, count(*) n from v group by 1) x) end,
    'boost_reach', (select coalesce(sum(reach), 0) from public.boosts where post_id = p_id))
  into r from v;
  r := r || jsonb_build_object(
    'daily', (select jsonb_agg(jsonb_build_object('day', g::date, 'n', coalesce(d.n, 0)) order by g)
                from generate_series(today - 6, today, interval '1 day') g
                left join public.post_view_days d on d.post_id = p_id and d.day = g::date),
    'clicks', (select jsonb_build_object(
                 'profile', count(*) filter (where kind = 'profile'),
                 'photo', count(*) filter (where kind = 'photo'),
                 'more', count(*) filter (where kind = 'more')) from public.post_clicks where post_id = p_id));
  return r;
end $$;

-- সব পোস্ট মিলিয়ে নিজের ড্যাশবোর্ড (৭ বা ৩০ দিন)
create or replace function public.my_insights(p_days int default 7)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); days int := case when p_days >= 30 then 30 else 7 end;
        today date := (now() at time zone 'Asia/Dhaka')::date; since date; r jsonb;
begin
  if me is null then raise exception 'লগইন করুন'; end if;
  since := today - (days - 1);
  with mine as (select id from public.posts where user_id = me),
  v as (select v.*, coalesce(v.was_close, private.are_friends(me, v.user_id)
              or exists (select 1 from public.follows f where f.follower_id = v.user_id and f.followee_id = me)) as close
          from public.post_views v where v.post_id in (select id from mine) and (v.first_at at time zone 'Asia/Dhaka')::date >= since)
  select jsonb_build_object(
    'days', days,
    'people', (select count(distinct user_id) from v),
    'views', (select coalesce(sum(n), 0) from public.post_view_days where post_id in (select id from mine) and day >= since),
    'close', (select count(distinct user_id) from v where close),
    'others', (select count(distinct user_id) from v where not close),
    'new_followers', (select count(*) from public.follows where followee_id = me and (created_at at time zone 'Asia/Dhaka')::date >= since),
    'posts', (select count(*) from public.posts where user_id = me and (created_at at time zone 'Asia/Dhaka')::date >= since),
    'sources', (select coalesce(jsonb_object_agg(s, n), '{}') from (select coalesce(source, 'other') s, count(*) n from v group by 1) x),
    'daily', (select jsonb_agg(jsonb_build_object('day', g::date, 'n', coalesce((select sum(n) from public.post_view_days d where d.day = g::date and d.post_id in (select id from mine)), 0)) order by g)
                from generate_series(since, today, interval '1 day') g),
    'hours', (select jsonb_agg(coalesce(c, 0) order by h) from generate_series(0, 23) h
                left join (select extract(hour from first_at at time zone 'Asia/Dhaka')::int hh, count(*) c
                             from public.post_views where post_id in (select id from mine) and first_at > now() - interval '30 days' group by 1) x on x.hh = h),
    'top', (select coalesce(jsonb_agg(t order by (t->>'people')::int desc), '[]') from (
              select jsonb_build_object('id', p.id, 'body', left(p.body, 80), 'image', coalesce(p.image_urls[1], p.image_url), 'created_at', p.created_at,
                       'people', (select count(*) from v where v.post_id = p.id), 'views', (select coalesce(sum(n), 0) from public.post_view_days d where d.post_id = p.id and d.day >= since)) t
                from public.posts p where p.user_id = me and exists (select 1 from v where v.post_id = p.id)
               order by (select count(*) from v where v.post_id = p.id) desc limit 5) x))
  into r;
  return r;
end $$;

revoke all on function public.post_seen2(bigint[], text[]) from public, anon;
revoke all on function public.post_click(bigint, text) from public, anon;
revoke all on function public.my_insights(int) from public, anon;
grant execute on function public.post_seen2(bigint[], text[]) to authenticated;
grant execute on function public.post_click(bigint, text) to authenticated;
grant execute on function public.my_insights(int) to authenticated;

-- আগের দেখাগুলো থেকে প্রতিদিনের হিসাব পূরণ
insert into public.post_view_days (post_id, day, n)
select post_id, (first_at at time zone 'Asia/Dhaka')::date, count(*) from public.post_views group by 1, 2
on conflict do nothing;
