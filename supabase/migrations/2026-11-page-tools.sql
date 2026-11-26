-- =====================================================================
--  পেইজ: একাধিক অ্যাডমিন, পিন করা পোস্ট, মেসেজে প্রশ্নের তৈরি উত্তর, ঠিকানা ও ম্যাপ
--  • অ্যাডমিনরা পেইজের নামে পোস্ট, মেসেজের উত্তর, পোস্ট পিন ও ড্যাশবোর্ড দেখতে পারেন
--  • পেইজ এডিট, মুছে ফেলা, ব্যাজ, অ্যাডমিন যোগ/বাদ, অটো মেসেজ ও প্রশ্ন-উত্তর শুধু মালিক
-- =====================================================================

create table if not exists public.page_admins (
  page_id    bigint not null references public.pages(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  added_by   uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (page_id, user_id)
);
alter table public.page_admins enable row level security;
drop policy if exists "page admins read" on public.page_admins;
create policy "page admins read" on public.page_admins for select using (true);   -- কে কোন পেইজের অ্যাডমিন তা গোপন নয়

alter table public.pages add column if not exists pinned_post_id bigint references public.posts(id) on delete set null;
alter table public.pages add column if not exists faqs jsonb not null default '[]'::jsonb;
alter table public.pages add column if not exists address text check (char_length(address) <= 200);
alter table public.pages add column if not exists lat double precision check (lat between -90 and 90);
alter table public.pages add column if not exists lng double precision check (lng between -180 and 180);

create or replace function public.valid_faqs(j jsonb)
returns boolean language sql immutable set search_path = public as $$
  select jsonb_typeof(j) = 'array' and jsonb_array_length(j) <= 4 and not exists (
    select 1 from jsonb_array_elements(j) e
     where jsonb_typeof(e) <> 'object' or char_length(coalesce(e->>'q', '')) not between 1 and 80 or char_length(coalesce(e->>'a', '')) not between 1 and 1000);
$$;
do $$ begin
  alter table public.pages add constraint pages_faqs_valid check (public.valid_faqs(faqs));
exception when duplicate_object then null; end $$;

-- পেইজের "স্টাফ" = মালিক বা অ্যাডমিন
create or replace function private.is_page_staff(p_page bigint, u uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select u is not null and p_page is not null and (exists (select 1 from public.pages where id = p_page and owner_id = u)
      or exists (select 1 from public.page_admins where page_id = p_page and user_id = u));
$$;
create or replace function public.is_page_staff(p_page bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select private.is_page_staff(p_page, auth.uid());
$$;
revoke all on function public.is_page_staff(bigint) from public, anon;
grant execute on function public.is_page_staff(bigint) to authenticated;

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in
  ('like','comment','share','tag','friend_request','friend_accept','follow','group_request','group_approved','reply','mention',
   'verify_ok','verify_no','boost_ok','boost_no','milestone','follower_milestone','weekly','page_admin'));

-- অ্যাডমিন যোগ/বাদ (শুধু মালিক)
create or replace function public.add_page_admin(p_page bigint, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare pname text;
begin
  select name into pname from public.pages where id = p_page and owner_id = auth.uid();
  if not found then raise exception 'শুধু পেইজের মালিক অ্যাডমিন যোগ করতে পারেন'; end if;
  if p_user = auth.uid() then raise exception 'আপনি তো মালিক'; end if;
  if (select count(*) from public.page_admins where page_id = p_page) >= 10 then raise exception 'সর্বোচ্চ ১০ জন অ্যাডমিন রাখা যায়'; end if;
  if private.is_blocked(auth.uid(), p_user) then raise exception 'এই ব্যক্তিকে যোগ করা যাবে না'; end if;
  insert into public.page_admins (page_id, user_id, added_by) values (p_page, p_user, auth.uid()) on conflict do nothing;
  if found then
    insert into public.notifications (user_id, actor_id, type, meta) values (p_user, auth.uid(), 'page_admin', jsonb_build_object('page', pname, 'page_id', p_page));
  end if;
end $$;
create or replace function public.remove_page_admin(p_page bigint, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  -- মালিক যে কাউকে বাদ দিতে পারেন; অ্যাডমিন নিজে চাইলে সরে যেতে পারেন
  if not (exists (select 1 from public.pages where id = p_page and owner_id = auth.uid()) or p_user = auth.uid()) then raise exception 'অনুমতি নেই'; end if;
  delete from public.page_admins where page_id = p_page and user_id = p_user;
end $$;

-- পোস্ট পিন (মালিক বা অ্যাডমিন); null দিলে পিন সরে যায়
create or replace function public.pin_page_post(p_page bigint, p_post bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not private.is_page_staff(p_page, auth.uid()) then raise exception 'অনুমতি নেই'; end if;
  if p_post is not null and not exists (select 1 from public.posts where id = p_post and page_id = p_page) then raise exception 'এই পেইজের পোস্ট নয়'; end if;
  update public.pages set pinned_post_id = p_post where id = p_page;
end $$;

-- পেইজের নামে পোস্ট: মালিক বা অ্যাডমিন
drop policy if exists "posts insert" on public.posts;
create policy "posts insert" on public.posts for insert to authenticated
  with check (user_id = auth.uid() and like_count = 0 and comment_count = 0 and reactions = '{}'::jsonb and share_count = 0 and save_count = 0 and pinned_comment_id is null
    and (shared_post_id is null or public.can_share_post(shared_post_id))
    and (page_id is null or private.is_page_staff(posts.page_id, auth.uid()))
    and (group_id is null or public.is_group_member(group_id))
    and (album_id is null or exists (select 1 from public.albums a where a.id = posts.album_id and (a.user_id = auth.uid() or (a.page_id is not null and private.is_page_staff(a.page_id, auth.uid()))) and a.page_id is not distinct from posts.page_id))
    and (kind = 'normal' or (group_id is null and shared_post_id is null)));

-- পেইজের মেসেজ: অ্যাডমিনরাও পড়তে ও পেইজের নামে উত্তর দিতে পারেন
drop policy if exists "messages read" on public.messages;
create policy "messages read" on public.messages for select
  using (auth.uid() in (sender_id, recipient_id) or (page_id is not null and private.is_page_staff(page_id, auth.uid())));
drop policy if exists "messages send" on public.messages;
create policy "messages send" on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and read_at is null and is_auto = false and not public.is_blocked(sender_id, recipient_id)
    and (page_id is null or private.is_page_staff(messages.page_id, messages.sender_id)
         or exists (select 1 from public.pages pg where pg.id = messages.page_id and pg.owner_id = messages.recipient_id)));

-- কথোপকথন: পেইজের ক্ষেত্রে গ্রাহক এক দিকে, পেইজ (মালিক/অ্যাডমিন যে-ই উত্তর দিক) অন্য দিকে
drop function if exists public.my_conversations();
create or replace function public.my_conversations()
returns table (partner_id uuid, page_id bigint, as_page boolean, page_name text, name text, avatar_url text, last_body text, last_at timestamptz, last_mine boolean, unread bigint)
language sql stable security invoker set search_path = public as $$
  with mp as (select id from public.pages where owner_id = auth.uid() union select page_id from public.page_admins where user_id = auth.uid()),
  m as (
    select case when x.page_id in (select id from mp) then (case when private.is_page_staff(x.page_id, x.sender_id) then x.recipient_id else x.sender_id end)
                when x.page_id is not null then (select owner_id from public.pages where id = x.page_id)
                when x.sender_id = auth.uid() then x.recipient_id else x.sender_id end as partner,
           x.page_id, x.body, x.created_at,
           case when x.page_id in (select id from mp) then private.is_page_staff(x.page_id, x.sender_id) else x.sender_id = auth.uid() end as mine,
           case when x.page_id in (select id from mp) then not private.is_page_staff(x.page_id, x.sender_id) and x.read_at is null
                else x.recipient_id = auth.uid() and x.read_at is null end as un
      from public.messages x
     where auth.uid() in (x.sender_id, x.recipient_id) or x.page_id in (select id from mp)
  ), last as (
    select distinct on (partner, coalesce(page_id, 0)) partner, page_id, body, created_at, mine from m where partner is not null order by partner, coalesce(page_id, 0), created_at desc
  )
  select l.partner, l.page_id, coalesce(l.page_id in (select id from mp), false), pg.name,
         case when l.page_id is not null and l.page_id not in (select id from mp) then pg.name else p.name end,
         case when l.page_id is not null and l.page_id not in (select id from mp) then pg.avatar_url else p.avatar_url end,
         l.body, l.created_at, l.mine,
         (select count(*) from m where m.partner = l.partner and m.page_id is not distinct from l.page_id and m.un)
    from last l join public.profiles p on p.id = l.partner left join public.pages pg on pg.id = l.page_id
   order by l.created_at desc;
$$;
grant execute on function public.my_conversations() to authenticated;

-- না-পড়া মেসেজের মোট সংখ্যা (নিজের ও যেসব পেইজ চালান)
create or replace function public.my_unread()
returns bigint language sql stable security invoker set search_path = public as $$
  select coalesce(sum(unread), 0)::bigint from public.my_conversations();
$$;
grant execute on function public.my_unread() to authenticated;

create or replace function public.mark_read2(partner uuid, p_page bigint default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_page is not null and private.is_page_staff(p_page, auth.uid()) then
    update public.messages set read_at = now() where page_id = p_page and sender_id = partner and read_at is null;
  elsif p_page is not null then
    update public.messages set read_at = now() where page_id = p_page and recipient_id = auth.uid() and read_at is null;
  else
    update public.messages set read_at = now() where page_id is null and recipient_id = auth.uid() and sender_id = partner and read_at is null;
  end if;
end $$;

create or replace function public.on_page_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare pg public.pages;
begin
  if new.page_id is null or new.is_auto or coalesce(current_setting('app.skip_auto', true), '') = 'on' then return null; end if;
  if private.is_page_staff(new.page_id, new.sender_id) then return null; end if;   -- পেইজের নিজের উত্তর
  select * into pg from public.pages where id = new.page_id;
  if not found or not pg.auto_reply_on or coalesce(trim(pg.auto_reply), '') = '' then return null; end if;
  if exists (select 1 from public.messages m where m.page_id = new.page_id and m.recipient_id = new.sender_id
              and private.is_page_staff(new.page_id, m.sender_id) and m.created_at > now() - interval '24 hours') then return null; end if;
  insert into public.messages (sender_id, recipient_id, body, page_id, is_auto) values (pg.owner_id, new.sender_id, pg.auto_reply, new.page_id, true);
  return null;
exception when others then return null;
end $$;

-- প্রশ্নের তৈরি উত্তর: গ্রাহক প্রশ্নে চাপলে প্রশ্ন ও উত্তর দুটোই কথোপকথনে যায়
create or replace function public.ask_page_faq(p_page bigint, p_idx int)
returns void language plpgsql security definer set search_path = public as $$
declare pg public.pages; item jsonb;
begin
  if auth.uid() is null then raise exception 'লগইন করুন'; end if;
  select * into pg from public.pages where id = p_page;
  if not found then raise exception 'পেইজ পাওয়া যায়নি'; end if;
  if private.is_page_staff(p_page, auth.uid()) then raise exception 'নিজের পেইজে প্রশ্ন করা যায় না'; end if;
  if private.is_blocked(pg.owner_id, auth.uid()) then raise exception 'মেসেজ পাঠানো যাবে না'; end if;
  item := pg.faqs -> p_idx;
  if item is null then raise exception 'প্রশ্ন পাওয়া যায়নি'; end if;
  perform set_config('app.skip_auto', 'on', true);
  insert into public.messages (sender_id, recipient_id, body, page_id) values (auth.uid(), pg.owner_id, item->>'q', p_page);
  insert into public.messages (sender_id, recipient_id, body, page_id, is_auto, created_at) values (pg.owner_id, auth.uid(), item->>'a', p_page, true, now() + interval '1 millisecond');
  perform set_config('app.skip_auto', '', true);
end $$;

revoke all on function public.add_page_admin(bigint, uuid) from public, anon;
revoke all on function public.remove_page_admin(bigint, uuid) from public, anon;
revoke all on function public.pin_page_post(bigint, bigint) from public, anon;
revoke all on function public.ask_page_faq(bigint, int) from public, anon;
revoke all on function public.mark_read2(uuid, bigint) from public, anon;
grant execute on function public.add_page_admin(bigint, uuid) to authenticated;
grant execute on function public.remove_page_admin(bigint, uuid) to authenticated;
grant execute on function public.pin_page_post(bigint, bigint) to authenticated;
grant execute on function public.ask_page_faq(bigint, int) to authenticated;
grant execute on function public.mark_read2(uuid, bigint) to authenticated;

-- ড্যাশবোর্ড: পেইজের অ্যাডমিনরাও দেখতে পারেন
create or replace function public.ent_insights(p_kind text, p_id bigint, p_days int default 7)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare days int := case when p_days >= 30 then 30 else 7 end;
        today date := (now() at time zone 'Asia/Dhaka')::date; since date; r jsonb; ids bigint[];
begin
  if auth.uid() is null then raise exception 'লগইন করুন'; end if;
  if p_kind = 'page' then
    if not (private.is_page_staff(p_id, auth.uid()) or public.is_admin()) then raise exception 'শুধু পেইজের মালিক ও অ্যাডমিনরা দেখতে পারেন'; end if;
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
