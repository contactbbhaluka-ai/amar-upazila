-- =====================================================================
--  নিউজফিড: জরুরি পোস্ট (সমাধান চিহ্ন), পোল, অনুষ্ঠান (যাব + রিমাইন্ডার),
--  রঙিন ব্যাকগ্রাউন্ড, লিংক প্রিভিউ, ২৪ ঘণ্টার স্টোরি (পরে চিরতরে মুছে যায়)
-- =====================================================================
alter table public.posts add column if not exists bg text;
alter table public.posts add column if not exists poll text[];
alter table public.posts add column if not exists event_at timestamptz;
alter table public.posts add column if not exists event_place text;
alter table public.posts add column if not exists link jsonb;
alter table public.posts add column if not exists resolved_at timestamptz;

alter table public.posts drop constraint if exists posts_bg_check;
alter table public.posts add constraint posts_bg_check check (bg is null or bg in ('g1','g2','g3','g4','g5','g6','g7','g8'));
alter table public.posts drop constraint if exists posts_poll_check;
alter table public.posts add constraint posts_poll_check check (poll is null or cardinality(poll) between 2 and 4);
alter table public.posts drop constraint if exists posts_event_place_check;
alter table public.posts add constraint posts_event_place_check check (event_place is null or char_length(event_place) <= 120);

-- নতুন পোস্টে: সমাধান চিহ্ন দেওয়া যায় না, পোলের অপশন ও লিংকের তথ্য যাচাই
create or replace function private.posts_extras_guard()
returns trigger language plpgsql set search_path = public as $$
declare o text;
begin
  if tg_op = 'INSERT' then new.resolved_at := null; end if;
  if new.poll is not null then
    if tg_op = 'UPDATE' and old.poll is distinct from new.poll then raise exception 'poll locked'; end if;
    foreach o in array new.poll loop
      if o is null or char_length(btrim(o)) = 0 or char_length(o) > 80 then raise exception 'bad poll option'; end if;
    end loop;
  end if;
  if new.link is not null then
    if jsonb_typeof(new.link) <> 'object'
       or coalesce(new.link->>'url', '') !~ '^https?://'
       or char_length(new.link::text) > 2000
       or (new.link ? 'image' and coalesce(new.link->>'image', '') !~ '^https://') then
      raise exception 'bad link';
    end if;
    new.link := jsonb_strip_nulls(jsonb_build_object('url', new.link->>'url', 'title', left(new.link->>'title', 200),
      'desc', left(new.link->>'desc', 300), 'image', new.link->>'image', 'site', left(new.link->>'site', 80)));
  end if;
  return new;
end $$;
drop trigger if exists posts_extras_guard on public.posts;
create trigger posts_extras_guard before insert or update on public.posts for each row execute function private.posts_extras_guard();

-- পোস্ট দেখার অনুমতি (RLS-এর মতোই)
create or replace function private.post_ok(p_post bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.posts p where p.id = p_post
    and public.post_visible(p.user_id, p.group_id, p.privacy)
    and (p.page_id is not null or p.group_id is not null or not private.profile_hidden(p.user_id)));
$$;

-- ---------- সমাধান হয়েছে
create or replace function public.resolve_post(p_post bigint, p_on boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.posts set resolved_at = case when p_on then now() end
   where id = p_post and (user_id = auth.uid() or public.is_admin()
     or (page_id is not null and private.is_page_staff(page_id, auth.uid())));
  if not found then raise exception 'not allowed'; end if;
end $$;

-- ---------- পোল
create table if not exists public.poll_votes (
  post_id bigint not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  opt smallint not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.poll_votes enable row level security;
drop policy if exists "poll votes own" on public.poll_votes;
create policy "poll votes own" on public.poll_votes for select using (user_id = auth.uid());

create or replace function public.vote_poll(p_post bigint, p_opt int)
returns void language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  if not private.post_ok(p_post) then raise exception 'not allowed'; end if;
  select cardinality(poll) into n from public.posts where id = p_post;
  if n is null then raise exception 'no poll'; end if;
  if p_opt is null or p_opt < 0 then
    delete from public.poll_votes where post_id = p_post and user_id = auth.uid(); return;
  end if;
  if p_opt >= n then raise exception 'bad option'; end if;
  insert into public.poll_votes(post_id, user_id, opt) values (p_post, auth.uid(), p_opt)
    on conflict (post_id, user_id) do update set opt = excluded.opt, created_at = now();
end $$;

-- ---------- অনুষ্ঠান: যাব
create table if not exists public.event_going (
  post_id bigint not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reminded boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.event_going enable row level security;
drop policy if exists "event going own" on public.event_going;
create policy "event going own" on public.event_going for select using (user_id = auth.uid());

create or replace function public.set_going(p_post bigint, p_on boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  if not private.post_ok(p_post) then raise exception 'not allowed'; end if;
  if not exists (select 1 from public.posts where id = p_post and event_at is not null) then raise exception 'no event'; end if;
  if p_on then
    insert into public.event_going(post_id, user_id) values (p_post, auth.uid()) on conflict do nothing;
  else
    delete from public.event_going where post_id = p_post and user_id = auth.uid();
  end if;
end $$;

-- পোল ও অনুষ্ঠানের হিসাব একসাথে (ফিডের যত পোস্ট)
create or replace function public.post_extras(p_ids bigint[])
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_object_agg(p.id, jsonb_build_object(
    'votes', (select coalesce(jsonb_agg(coalesce(c.n, 0) order by i.i), '[]'::jsonb)
                from generate_series(0, coalesce(cardinality(p.poll), 0) - 1) i(i)
                left join (select opt, count(*) n from public.poll_votes where post_id = p.id group by opt) c on c.opt = i.i),
    'my', (select opt from public.poll_votes where post_id = p.id and user_id = auth.uid()),
    'going', (select count(*) from public.event_going where post_id = p.id),
    'me_going', exists (select 1 from public.event_going where post_id = p.id and user_id = auth.uid())
  )), '{}'::jsonb)
  from public.posts p
  where p.id = any(p_ids[1:60]) and (p.poll is not null or p.event_at is not null) and private.post_ok(p.id);
$$;

-- নোটিফিকেশনের নতুন ধরন
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type = any (array[
  'like','comment','share','tag','friend_request','friend_accept','follow','group_request','group_approved',
  'reply','mention','verify_ok','verify_no','boost_ok','boost_no','milestone','follower_milestone','weekly','page_admin',
  'event_reminder']));

-- অনুষ্ঠানের আগের দিন রিমাইন্ডার (প্রতি ঘণ্টায় চলে)
create or replace function private.event_reminders()
returns void language plpgsql security definer set search_path = public as $$
begin
  with due as (
    update public.event_going g set reminded = true
      from public.posts p
     where p.id = g.post_id and not g.reminded and p.event_at > now() and p.event_at <= now() + interval '24 hours'
    returning g.user_id, g.post_id, p.user_id author, p.event_at, p.event_place
  )
  insert into public.notifications(user_id, actor_id, type, post_id, meta)
  select user_id, author, 'event_reminder', post_id, jsonb_build_object('at', event_at, 'place', event_place) from due;
end $$;

-- ---------- স্টোরি: ২৪ ঘণ্টা পর সার্ভার থেকে চিরতরে মুছে যায়
-- ছবি আলাদা স্টোরেজে রাখা হয় না, এই সারির ভেতরেই (ছোট WebP); সারি মুছলেই ছবিও মুছে যায়
create table if not exists public.stories (
  id bigserial primary key,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('text','photo')),
  body text check (char_length(body) <= 250),
  bg text check (bg is null or bg in ('g1','g2','g3','g4','g5','g6','g7','g8')),
  image text check (image is null or (image like 'data:image/%' and char_length(image) <= 400000)),
  privacy text not null default 'public' check (privacy in ('public','friends')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours',
  check ((kind = 'text' and char_length(btrim(coalesce(body, ''))) > 0 and image is null) or (kind = 'photo' and image is not null))
);
create index if not exists stories_live_idx on public.stories (expires_at);
create index if not exists stories_user_idx on public.stories (user_id, created_at desc);
alter table public.stories enable row level security;
drop policy if exists "stories read" on public.stories;
create policy "stories read" on public.stories for select using (
  expires_at > now() and (user_id = auth.uid() or (private.can_view(user_id, privacy) and not private.profile_hidden(user_id))));
drop policy if exists "stories insert" on public.stories;
create policy "stories insert" on public.stories for insert with check (
  user_id = auth.uid() and created_at > now() - interval '1 minute' and expires_at <= now() + interval '24 hours 1 minute');
drop policy if exists "stories delete" on public.stories;
create policy "stories delete" on public.stories for delete using (user_id = auth.uid() or public.is_admin());

-- একসাথে সর্বোচ্চ ১৫টি চালু স্টোরি
create or replace function private.stories_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.created_at := now(); new.expires_at := now() + interval '24 hours';
  if (select count(*) from public.stories where user_id = new.user_id and expires_at > now()) >= 15 then
    raise exception 'story limit';
  end if;
  return new;
end $$;
drop trigger if exists stories_limit on public.stories;
create trigger stories_limit before insert on public.stories for each row execute function private.stories_limit();

create table if not exists public.story_views (
  story_id bigint not null references public.stories(id) on delete cascade,
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (story_id, viewer_id)
);
alter table public.story_views enable row level security;   -- সরাসরি পড়া/লেখা নেই, শুধু নিচের ফাংশন

create or replace function public.story_seen(p_ids bigint[])
returns void language sql security definer set search_path = public as $$
  insert into public.story_views(story_id, viewer_id)
  select s.id, auth.uid() from public.stories s
   where s.id = any(p_ids[1:50]) and auth.uid() is not null and s.user_id <> auth.uid() and s.expires_at > now()
     and private.can_view(s.user_id, s.privacy) and not private.profile_hidden(s.user_id)
  on conflict do nothing;
$$;

create or replace function public.story_viewers(p_story bigint)
returns table(user_id uuid, name text, avatar_url text, seen_at timestamptz)
language sql stable security definer set search_path = public as $$
  select v.viewer_id, pr.name, pr.avatar_url, v.created_at
    from public.story_views v join public.stories s on s.id = v.story_id join public.profiles pr on pr.id = v.viewer_id
   where v.story_id = p_story and s.user_id = auth.uid()
   order by v.created_at desc limit 500;
$$;

create or replace function public.my_story_view_counts()
returns table(story_id bigint, views bigint)
language sql stable security definer set search_path = public as $$
  select s.id, count(v.viewer_id) from public.stories s left join public.story_views v on v.story_id = s.id
   where s.user_id = auth.uid() and s.expires_at > now() group by s.id;
$$;

create or replace function private.purge_stories()
returns void language sql security definer set search_path = public as $$
  delete from public.stories where expires_at <= now();
$$;

-- নির্ধারিত কাজ: প্রতি ১০ মিনিটে মেয়াদোত্তীর্ণ স্টোরি মুছে ফেলা, প্রতি ঘণ্টায় অনুষ্ঠানের রিমাইন্ডার
create extension if not exists pg_cron;
do $$ begin
  perform cron.unschedule(jobid) from cron.job where jobname in ('purge-stories', 'event-reminders');
  perform cron.schedule('purge-stories', '*/10 * * * *', 'select private.purge_stories()');
  perform cron.schedule('event-reminders', '7 * * * *', 'select private.event_reminders()');
end $$;
