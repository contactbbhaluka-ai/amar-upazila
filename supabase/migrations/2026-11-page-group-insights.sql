-- =====================================================================
--  পেইজ ও গ্রুপের ড্যাশবোর্ড
--  • পেইজ: শুধু পেইজের মালিক দেখেন; গ্রুপ: শুধু গ্রুপ অ্যাডমিন দেখেন
--  • পোস্টের দর্শক, ভিউ, উৎস, সেরা সময়, সেরা পোস্ট
--  • পেইজ: ফলোয়ার বাড়া/কমা ও পেইজ ভিজিট
--  • গ্রুপ: সদস্য যোগ/ছাড়া, সক্রিয় সদস্য, অপেক্ষমাণ অনুরোধ ও গ্রুপ ভিজিট
-- =====================================================================

create table if not exists public.ent_visits (
  kind    text not null check (kind in ('page','group')),
  ent_id  bigint not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  day     date not null default ((now() at time zone 'Asia/Dhaka')::date),
  primary key (kind, ent_id, user_id, day)
);
create index if not exists ent_visits_day on public.ent_visits(kind, ent_id, day);
alter table public.ent_visits enable row level security;

create table if not exists public.ent_events (
  id      bigint generated always as identity primary key,
  kind    text not null check (kind in ('page','group')),
  ent_id  bigint not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  event   text not null check (event in ('join','leave')),
  at      timestamptz not null default now()
);
create index if not exists ent_events_ent on public.ent_events(kind, ent_id, at);
alter table public.ent_events enable row level security;

create or replace function public.ent_visit(p_kind text, p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or p_kind not in ('page','group') then return; end if;
  if p_kind = 'page' and not exists (select 1 from public.pages where id = p_id and owner_id <> auth.uid()) then return; end if;
  if p_kind = 'group' and (not exists (select 1 from public.groups where id = p_id) or public.is_group_admin(p_id)) then return; end if;
  insert into public.ent_visits (kind, ent_id, user_id) values (p_kind, p_id, auth.uid()) on conflict do nothing;
end $$;

-- পেইজ ফলো/আনফলো ও গ্রুপে যোগ/ছাড়ার ইতিহাস
create or replace function public.on_ent_event()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'page_follows' then
    if tg_op = 'INSERT' then insert into public.ent_events (kind, ent_id, user_id, event) values ('page', new.page_id, new.user_id, 'join');
    elsif exists (select 1 from public.pages where id = old.page_id) and exists (select 1 from public.profiles where id = old.user_id) then
      insert into public.ent_events (kind, ent_id, user_id, event) values ('page', old.page_id, old.user_id, 'leave');
    end if;
  else
    if tg_op = 'INSERT' and new.status = 'active' then insert into public.ent_events (kind, ent_id, user_id, event) values ('group', new.group_id, new.user_id, 'join');
    elsif tg_op = 'UPDATE' and old.status = 'pending' and new.status = 'active' then insert into public.ent_events (kind, ent_id, user_id, event) values ('group', new.group_id, new.user_id, 'join');
    elsif tg_op = 'DELETE' and old.status = 'active' and exists (select 1 from public.groups where id = old.group_id) and exists (select 1 from public.profiles where id = old.user_id) then
      insert into public.ent_events (kind, ent_id, user_id, event) values ('group', old.group_id, old.user_id, 'leave');
    end if;
  end if;
  return null;
exception when others then return null;
end $$;
revoke all on function public.on_ent_event() from public, anon, authenticated;
drop trigger if exists ent_event on public.page_follows;
create trigger ent_event after insert or delete on public.page_follows for each row execute function public.on_ent_event();
drop trigger if exists ent_event on public.group_members;
create trigger ent_event after insert or update of status or delete on public.group_members for each row execute function public.on_ent_event();

create or replace function public.ent_insights(p_kind text, p_id bigint, p_days int default 7)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare days int := case when p_days >= 30 then 30 else 7 end;
        today date := (now() at time zone 'Asia/Dhaka')::date; since date; r jsonb; ids bigint[];
begin
  if auth.uid() is null then raise exception 'লগইন করুন'; end if;
  if p_kind = 'page' then
    if not (exists (select 1 from public.pages where id = p_id and owner_id = auth.uid()) or public.is_admin()) then raise exception 'শুধু পেইজের মালিক দেখতে পারেন'; end if;
    select coalesce(array_agg(id), '{}') into ids from public.posts where page_id = p_id;
  elsif p_kind = 'group' then
    if not (public.is_group_admin(p_id) or public.is_admin()) then raise exception 'শুধু গ্রুপ অ্যাডমিন দেখতে পারেন'; end if;
    select coalesce(array_agg(id), '{}') into ids from public.posts where group_id = p_id;
  else raise exception 'ভুল ধরন';
  end if;
  since := today - (days - 1);
  with v as (
    select v.*, case when p_kind = 'page' then exists (select 1 from public.page_follows f where f.page_id = p_id and f.user_id = v.user_id)
                     else exists (select 1 from public.group_members m where m.group_id = p_id and m.user_id = v.user_id and m.status = 'active') end as close
      from public.post_views v where v.post_id = any (ids) and (v.first_at at time zone 'Asia/Dhaka')::date >= since)
  select jsonb_build_object(
    'days', days,
    'people', (select count(distinct user_id) from v),
    'views', (select coalesce(sum(n), 0) from public.post_view_days where post_id = any (ids) and day >= since),
    'close', (select count(distinct user_id) from v where close),
    'others', (select count(distinct user_id) from v where not close),
    'posts', (select count(*) from public.posts where id = any (ids) and (created_at at time zone 'Asia/Dhaka')::date >= since),
    'sources', (select coalesce(jsonb_object_agg(s, n), '{}') from (select coalesce(source, 'other') s, count(*) n from v group by 1) x),
    'daily', (select jsonb_agg(jsonb_build_object('day', g::date, 'n', coalesce((select sum(n) from public.post_view_days d where d.day = g::date and d.post_id = any (ids)), 0)) order by g)
                from generate_series(since, today, interval '1 day') g),
    'hours', (select jsonb_agg(coalesce(c, 0) order by h) from generate_series(0, 23) h
                left join (select extract(hour from first_at at time zone 'Asia/Dhaka')::int hh, count(*) c
                             from public.post_views where post_id = any (ids) and first_at > now() - interval '30 days' group by 1) x on x.hh = h),
    'top', (select coalesce(jsonb_agg(t order by (t->>'people')::int desc), '[]') from (
              select jsonb_build_object('id', p.id, 'body', left(p.body, 80), 'image', coalesce(p.image_urls[1], p.image_url), 'created_at', p.created_at,
                       'people', (select count(*) from v where v.post_id = p.id), 'views', (select coalesce(sum(n), 0) from public.post_view_days d where d.post_id = p.id and d.day >= since)) t
                from public.posts p where p.id = any (ids) and exists (select 1 from v where v.post_id = p.id)
               order by (select count(*) from v where v.post_id = p.id) desc limit 5) x),
    'visits', (select count(*) from public.ent_visits where kind = p_kind and ent_id = p_id and day >= since),
    'visitors', (select count(distinct user_id) from public.ent_visits where kind = p_kind and ent_id = p_id and day >= since),
    'visits_daily', (select jsonb_agg(jsonb_build_object('day', g::date, 'n',
                       (select count(*) from public.ent_visits e where e.kind = p_kind and e.ent_id = p_id and e.day = g::date)) order by g)
                     from generate_series(since, today, interval '1 day') g),
    'followers', case when p_kind = 'page' then (select count(*) from public.page_follows where page_id = p_id)
                      else (select count(*) from public.group_members where group_id = p_id and status = 'active') end,
    'gained', (select count(*) from (
                 select user_id, (at at time zone 'Asia/Dhaka')::date d from public.ent_events where kind = p_kind and ent_id = p_id and event = 'join'
                 union select user_id, (created_at at time zone 'Asia/Dhaka')::date from public.page_follows where p_kind = 'page' and page_id = p_id) x where d >= since),
    'lost', (select count(*) from public.ent_events where kind = p_kind and ent_id = p_id and event = 'leave' and (at at time zone 'Asia/Dhaka')::date >= since),
    'follow_daily', (select jsonb_agg(jsonb_build_object('day', g::date,
                       'plus', (select count(*) from (
                                  select user_id, (at at time zone 'Asia/Dhaka')::date d from public.ent_events where kind = p_kind and ent_id = p_id and event = 'join'
                                  union select user_id, (created_at at time zone 'Asia/Dhaka')::date from public.page_follows where p_kind = 'page' and page_id = p_id) x where d = g::date),
                       'minus', (select count(*) from public.ent_events e where e.kind = p_kind and e.ent_id = p_id and e.event = 'leave' and (e.at at time zone 'Asia/Dhaka')::date = g::date)) order by g)
                     from generate_series(since, today, interval '1 day') g),
    'pending', case when p_kind = 'group' then (select count(*) from public.group_members where group_id = p_id and status = 'pending') end,
    'active_members', case when p_kind = 'group' then (select count(distinct u) from (
                         select user_id u from public.posts where group_id = p_id and (created_at at time zone 'Asia/Dhaka')::date >= since
                         union select c.user_id from public.comments c join public.posts p on p.id = c.post_id where p.group_id = p_id and (c.created_at at time zone 'Asia/Dhaka')::date >= since) x) end)
  into r;
  return r;
end $$;

revoke all on function public.ent_visit(text, bigint) from public, anon;
revoke all on function public.ent_insights(text, bigint, int) from public, anon;
grant execute on function public.ent_visit(text, bigint) to authenticated;
grant execute on function public.ent_insights(text, bigint, int) to authenticated;

-- প্রোফাইলের ফলোয়ার বৃদ্ধি: পরে আনফলো করলেও "নতুন ফলো" হিসাবে থাকে
create or replace function public.my_growth(p_days int default 7)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); days int := case when p_days >= 30 then 30 else 7 end;
        today date := (now() at time zone 'Asia/Dhaka')::date; since date;
begin
  if me is null then raise exception 'লগইন করুন'; end if;
  since := today - (days - 1);
  return (with fj as (
      select follower_id, (at at time zone 'Asia/Dhaka')::date d from public.follow_events where followee_id = me and kind = 'follow'
      union select follower_id, (created_at at time zone 'Asia/Dhaka')::date from public.follows where followee_id = me)
    select jsonb_build_object(
    'visits', (select count(*) from public.profile_visits where profile_id = me and day >= since),
    'visitors', (select count(distinct user_id) from public.profile_visits where profile_id = me and day >= since),
    'visits_daily', (select jsonb_agg(jsonb_build_object('day', g::date, 'n',
                       (select count(*) from public.profile_visits pv where pv.profile_id = me and pv.day = g::date)) order by g)
                     from generate_series(since, today, interval '1 day') g),
    'followers', (select count(*) from public.follows where followee_id = me),
    'gained', (select count(*) from fj where d >= since),
    'lost', (select count(*) from public.follow_events where followee_id = me and kind = 'unfollow' and (at at time zone 'Asia/Dhaka')::date >= since),
    'follow_daily', (select jsonb_agg(jsonb_build_object('day', g::date,
                       'plus', (select count(*) from fj where fj.d = g::date),
                       'minus', (select count(*) from public.follow_events e where e.followee_id = me and e.kind = 'unfollow' and (e.at at time zone 'Asia/Dhaka')::date = g::date)) order by g)
                     from generate_series(since, today, interval '1 day') g)));
end $$;
