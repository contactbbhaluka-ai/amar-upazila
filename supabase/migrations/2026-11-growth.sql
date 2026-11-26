-- =====================================================================
--  গড়ের সাথে তুলনা, প্রোফাইল ভিজিট, ফলোয়ার বৃদ্ধি, সাপ্তাহিক রিপোর্ট ও মাইলফলক
-- =====================================================================

-- নোটিফিকেশনে সংখ্যা রাখার জায়গা (যেমন কতজন দেখেছেন)
alter table public.notifications add column if not exists meta jsonb;
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in
  ('like','comment','share','tag','friend_request','friend_accept','follow','group_request','group_approved','reply','mention',
   'verify_ok','verify_no','boost_ok','boost_no','milestone','follower_milestone','weekly'));

-- ---------- প্রোফাইল ভিজিট (একজন দিনে একবার গোনা)
create table if not exists public.profile_visits (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  day        date not null default ((now() at time zone 'Asia/Dhaka')::date),
  primary key (profile_id, user_id, day)
);
create index if not exists profile_visits_day on public.profile_visits(profile_id, day);
alter table public.profile_visits enable row level security;

create or replace function public.profile_visit(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or p_user is null or p_user = auth.uid() or private.is_blocked(p_user, auth.uid()) then return; end if;
  insert into public.profile_visits (profile_id, user_id) values (p_user, auth.uid()) on conflict do nothing;
end $$;

-- ---------- ফলো/আনফলোর ইতিহাস ও ফলোয়ার মাইলফলক
create table if not exists public.follow_events (
  id          bigint generated always as identity primary key,
  followee_id uuid not null references public.profiles(id) on delete cascade,
  follower_id uuid not null references public.profiles(id) on delete cascade,
  kind        text not null check (kind in ('follow','unfollow')),
  at          timestamptz not null default now()
);
create index if not exists follow_events_followee on public.follow_events(followee_id, at);
alter table public.follow_events enable row level security;

create or replace function public.on_follow_event()
returns trigger language plpgsql security definer set search_path = public as $$
declare n int; m int;
begin
  if tg_op = 'INSERT' then
    insert into public.follow_events (followee_id, follower_id, kind) values (new.followee_id, new.follower_id, 'follow');
    select count(*) into n from public.follows where followee_id = new.followee_id;
    foreach m in array array[10, 50, 100, 500, 1000, 5000, 10000] loop
      if n = m and not exists (select 1 from public.notifications where user_id = new.followee_id and type = 'follower_milestone' and (meta->>'n')::int = m) then
        insert into public.notifications (user_id, actor_id, type, meta) values (new.followee_id, new.followee_id, 'follower_milestone', jsonb_build_object('n', m));
      end if;
    end loop;
  else
    -- অ্যাকাউন্ট মুছে গেলে (cascade) ইতিহাস লেখার দরকার নেই
    if exists (select 1 from public.profiles where id = old.followee_id) and exists (select 1 from public.profiles where id = old.follower_id) then
      insert into public.follow_events (followee_id, follower_id, kind) values (old.followee_id, old.follower_id, 'unfollow');
    end if;
  end if;
  return null;
exception when others then return null;
end $$;
revoke all on function public.on_follow_event() from public, anon, authenticated;
drop trigger if exists follow_event on public.follows;
create trigger follow_event after insert or delete on public.follows for each row execute function public.on_follow_event();

-- ---------- পোস্ট দেখার মাইলফলক (১০০, ৫০০, ১০০০… জন)
create or replace function public.on_post_view_milestone()
returns trigger language plpgsql security definer set search_path = public as $$
declare n int; owner uuid; m int;
begin
  select count(*) into n from public.post_views where post_id = new.post_id;
  if n not in (100, 500, 1000, 5000, 10000) then return null; end if;
  select user_id into owner from public.posts where id = new.post_id;
  m := n;
  if owner is not null and not exists (select 1 from public.notifications where user_id = owner and type = 'milestone' and post_id = new.post_id and (meta->>'n')::int = m) then
    insert into public.notifications (user_id, actor_id, type, post_id, meta) values (owner, owner, 'milestone', new.post_id, jsonb_build_object('n', m));
  end if;
  return null;
exception when others then return null;
end $$;
revoke all on function public.on_post_view_milestone() from public, anon, authenticated;
drop trigger if exists post_view_milestone on public.post_views;
create trigger post_view_milestone after insert on public.post_views for each row execute function public.on_post_view_milestone();

-- ---------- সাপ্তাহিক রিপোর্ট: প্রতি শুক্রবার থেকে নতুন সপ্তাহ; অ্যাপ খুললে আগের সপ্তাহের রিপোর্ট একবার তৈরি হয়
create or replace function public.ensure_weekly_report()
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); today date := (now() at time zone 'Asia/Dhaka')::date;
        wk_start date; ppl int; prev int; vis int; fol int;
begin
  if me is null then return; end if;
  wk_start := today - ((extract(dow from today)::int - 5 + 7) % 7);   -- এই সপ্তাহের শুক্রবার
  if exists (select 1 from public.notifications where user_id = me and type = 'weekly' and (meta->>'week') = wk_start::text) then return; end if;
  select count(distinct v.user_id) into ppl from public.post_views v join public.posts p on p.id = v.post_id
   where p.user_id = me and (v.first_at at time zone 'Asia/Dhaka')::date between wk_start - 7 and wk_start - 1;
  select count(distinct v.user_id) into prev from public.post_views v join public.posts p on p.id = v.post_id
   where p.user_id = me and (v.first_at at time zone 'Asia/Dhaka')::date between wk_start - 14 and wk_start - 8;
  select count(*) into vis from public.profile_visits where profile_id = me and day between wk_start - 7 and wk_start - 1;
  select count(*) into fol from public.follows where followee_id = me and (created_at at time zone 'Asia/Dhaka')::date between wk_start - 7 and wk_start - 1;
  if ppl = 0 and vis = 0 and fol = 0 then return; end if;   -- কিছু না ঘটলে রিপোর্ট পাঠাই না
  insert into public.notifications (user_id, actor_id, type, meta)
  values (me, me, 'weekly', jsonb_build_object('week', wk_start, 'people', ppl, 'prev', prev, 'visits', vis, 'followers', fol));
end $$;

-- ---------- পোস্টের হিসাবে গড়ের সাথে তুলনা
create or replace function public.post_avg_people(p_id bigint)
returns numeric language sql stable security definer set search_path = public as $$
  select avg(c) from (
    select (select count(*) from public.post_views v where v.post_id = p.id) c
      from public.posts p
     where p.user_id = (select user_id from public.posts where id = p_id) and p.id <> p_id
       and p.user_id = auth.uid()
     order by p.created_at desc limit 20) x;
$$;

-- ---------- ড্যাশবোর্ডে প্রোফাইল ভিজিট ও ফলোয়ার বৃদ্ধি
create or replace function public.my_growth(p_days int default 7)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); days int := case when p_days >= 30 then 30 else 7 end;
        today date := (now() at time zone 'Asia/Dhaka')::date; since date;
begin
  if me is null then raise exception 'লগইন করুন'; end if;
  since := today - (days - 1);
  return jsonb_build_object(
    'visits', (select count(*) from public.profile_visits where profile_id = me and day >= since),
    'visitors', (select count(distinct user_id) from public.profile_visits where profile_id = me and day >= since),
    'visits_daily', (select jsonb_agg(jsonb_build_object('day', g::date, 'n',
                       (select count(*) from public.profile_visits pv where pv.profile_id = me and pv.day = g::date)) order by g)
                     from generate_series(since, today, interval '1 day') g),
    'followers', (select count(*) from public.follows where followee_id = me),
    'gained', (select count(*) from public.follows where followee_id = me and (created_at at time zone 'Asia/Dhaka')::date >= since),
    'lost', (select count(*) from public.follow_events where followee_id = me and kind = 'unfollow' and (at at time zone 'Asia/Dhaka')::date >= since),
    'follow_daily', (select jsonb_agg(jsonb_build_object('day', g::date,
                       'plus', (select count(*) from public.follows f where f.followee_id = me and (f.created_at at time zone 'Asia/Dhaka')::date = g::date),
                       'minus', (select count(*) from public.follow_events e where e.followee_id = me and e.kind = 'unfollow' and (e.at at time zone 'Asia/Dhaka')::date = g::date)) order by g)
                     from generate_series(since, today, interval '1 day') g));
end $$;

revoke all on function public.profile_visit(uuid) from public, anon;
revoke all on function public.ensure_weekly_report() from public, anon;
revoke all on function public.post_avg_people(bigint) from public, anon;
revoke all on function public.my_growth(int) from public, anon;
grant execute on function public.profile_visit(uuid) to authenticated;
grant execute on function public.ensure_weekly_report() to authenticated;
grant execute on function public.post_avg_people(bigint) to authenticated;
grant execute on function public.my_growth(int) to authenticated;
