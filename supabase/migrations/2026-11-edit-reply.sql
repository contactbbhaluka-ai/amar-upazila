-- আগে schema.sql চালিয়ে থাকলে: পোস্ট এডিট, মন্তব্য এডিট, উত্তর, @মেনশন ও অ্যাপ নিয়ন্ত্রণ সেটিংয়ের জন্য শুধু এই ফাইলটা SQL Editor-এ চালান।
-- (নতুন করে সেটআপ করলে লাগবে না; schema.sql-এ সব আছে। একাধিকবার চালালেও সমস্যা নেই।)
alter table public.posts add column if not exists edited_at timestamptz;
alter table public.comments add column if not exists parent_id bigint references public.comments(id) on delete cascade;
alter table public.comments add column if not exists edited_at timestamptz;
create index if not exists comments_parent_id_idx on public.comments(parent_id);
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in ('like','comment','share','tag','friend_request','friend_accept','follow','group_request','group_approved','reply','mention'));

create or replace function public.notify(to_user uuid, from_user uuid, kind text, post bigint default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if to_user is null or to_user = from_user or public.is_blocked(to_user, from_user) then return; end if;
  -- একই কাজের পুরনো নোটিফিকেশন থাকলে নতুনটা দিয়ে বদলাই (বারবার লাইক/আনলাইকে ভিড় না হয়)
  delete from public.notifications
   where user_id = to_user and actor_id = from_user and type = kind and post_id is not distinct from post and kind not in ('comment','reply');
  insert into public.notifications (user_id, actor_id, type, post_id) values (to_user, from_user, kind, post);
end $$;
revoke all on function public.notify(uuid, uuid, text, bigint) from public, anon, authenticated;

create or replace function public.on_social_event()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'likes' then
    -- পেইজের পোস্টে লাইক হলে পেইজের মালিক পায় (posts.user_id = মালিক)
    perform public.notify((select user_id from public.posts where id = new.post_id), new.user_id, 'like', new.post_id);
  elsif tg_table_name = 'comments' then
    -- উত্তর হলে মূল মন্তব্যকারী "reply" পান; পোস্টের মালিক "comment" পান (একই মানুষ হলে একটাই)
    declare post_owner uuid := (select user_id from public.posts where id = new.post_id);
            parent_owner uuid := (select user_id from public.comments where id = new.parent_id);
    begin
      if parent_owner is not null then perform public.notify(parent_owner, new.user_id, 'reply', new.post_id); end if;
      if parent_owner is distinct from post_owner then perform public.notify(post_owner, new.user_id, 'comment', new.post_id); end if;
    end;
  elsif tg_table_name = 'follows' then
    perform public.notify(new.followee_id, new.follower_id, 'follow');
  elsif tg_table_name = 'post_tags' then
    perform public.notify(new.user_id, (select user_id from public.posts where id = new.post_id), 'tag', new.post_id);
  elsif tg_table_name = 'posts' then
    perform public.notify((select user_id from public.posts where id = new.shared_post_id), new.user_id, 'share', new.shared_post_id);
  elsif tg_table_name = 'friendships' then
    if tg_op = 'INSERT' then
      perform public.notify(new.addressee, new.requester, 'friend_request');
    elsif new.status = 'accepted' and old.status = 'pending' then
      perform public.notify(new.requester, new.addressee, 'friend_accept');
      delete from public.notifications where user_id = new.addressee and actor_id = new.requester and type = 'friend_request';
    end if;
  end if;
  return null;
end $$;

create or replace function public.pin_comment(p_post bigint, p_comment bigint)
returns void language plpgsql security definer set search_path = public as $$
declare owner uuid; gid bigint;
begin
  select user_id, group_id into owner, gid from public.posts where id = p_post;
  if owner is null then raise exception 'post not found'; end if;
  if owner <> auth.uid() and not (gid is not null and public.is_group_admin(gid)) and not public.is_admin() then
    raise exception 'only post owner can pin';
  end if;
  if p_comment is not null and not exists (select 1 from public.comments where id = p_comment and post_id = p_post and parent_id is null) then
    raise exception 'comment not on this post';
  end if;
  update public.posts set pinned_comment_id = p_comment where id = p_post;
end $$;

-- পোস্ট এডিট: শুধু পোস্টের মালিক লেখা, ধরন, ছবি, প্রাইভেসি ও ট্যাগ বদলাতে পারেন।
-- নতুন ছবি শুধু নিজের ফোল্ডার থেকে; ট্যাগ শুধু বন্ধুদের; পেইজ/গ্রুপের পোস্ট সবসময় পাবলিক।
-- (আগে schema চালিয়ে থাকলে শুধু এই অংশ ও নিচের alter লাইনটা SQL Editor-এ চালালেই হবে)
create or replace function public.edit_post(p_id bigint, p_body text, p_category text, p_images text[], p_privacy text, p_tags uuid[])
returns void language plpgsql security definer set search_path = public as $$
declare p public.posts; pat text;
begin
  select * into p from public.posts where id = p_id for update;
  if p.id is null or p.user_id is distinct from auth.uid() then raise exception 'not allowed'; end if;
  p_images := coalesce(p_images, '{}'); p_tags := coalesce(p_tags, '{}');
  pat := '^https://[^/?#]+/storage/v1/object/public/media/' || auth.uid()::text || '/[^/?#]+$';
  if exists (select 1 from unnest(p_images) u where not (u = any(p.image_urls) or u = p.image_url or u ~ pat)) then
    raise exception 'invalid image';
  end if;
  update public.posts set body = coalesce(p_body, ''), category = p_category,
    image_urls = p_images, image_url = p_images[1],
    privacy = case when p.page_id is null and p.group_id is null then coalesce(p_privacy, p.privacy) else 'public' end,
    edited_at = now()
  where id = p_id;
  if p.page_id is null and p.group_id is null then
    delete from public.post_tags where post_id = p_id and not (user_id = any(p_tags));
    insert into public.post_tags(post_id, user_id)
      select p_id, t from unnest(p_tags) t
      where public.are_friends(auth.uid(), t) and not public.is_blocked(auth.uid(), t)
      on conflict do nothing;
  end if;
end $$;
revoke all on function public.edit_post(bigint, text, text, text[], text, uuid[]) from public, anon;
grant execute on function public.edit_post(bigint, text, text, text[], text, uuid[]) to authenticated;

-- মন্তব্য এডিট: শুধু যিনি লিখেছেন
create or replace function public.edit_comment(p_id bigint, p_body text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.comments set body = btrim(p_body), edited_at = now() where id = p_id and user_id = auth.uid();
  if not found then raise exception 'not allowed'; end if;
end $$;
revoke all on function public.edit_comment(bigint, text) from public, anon;
grant execute on function public.edit_comment(bigint, text) to authenticated;

-- উত্তর শুধু একই পোস্টের মূল মন্তব্যে দেওয়া যায় (উত্তরের উত্তর মূল মন্তব্যের নিচেই যায়)
create or replace function public.reply_parent_ok(p_parent bigint, p_post bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select p_parent is null or exists (select 1 from public.comments where id = p_parent and post_id = p_post and parent_id is null);
$$;

drop policy if exists "comments insert" on public.comments;
create policy "comments insert" on public.comments for insert to authenticated with check (user_id = auth.uid() and public.can_see_post(post_id) and like_count = 0 and reactions = '{}'::jsonb
  and edited_at is null and public.reply_parent_ok(parent_id, post_id));



-- ---------- @মেনশন (পোস্ট ও মন্তব্যে) ----------
-- নির্দিষ্ট একজন মানুষ পোস্টটি দেখতে পারেন কিনা (নোটিফিকেশন পাঠানোর আগে যাচাই)
create or replace function public.user_sees_post(uid uuid, pid bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.posts p where p.id = pid
    and not public.is_blocked(uid, p.user_id)
    and (p.group_id is null
         or exists (select 1 from public.groups g where g.id = p.group_id and g.privacy = 'public')
         or exists (select 1 from public.group_members m where m.group_id = p.group_id and m.user_id = uid and m.status = 'active'))
    and (p.privacy = 'public' or p.user_id = uid or (p.privacy = 'friends' and public.are_friends(uid, p.user_id))));
$$;
create table if not exists public.post_mentions (
  post_id  bigint not null references public.posts(id) on delete cascade,
  user_id  uuid not null references public.profiles(id) on delete cascade,
  primary key (post_id, user_id)
);
create table if not exists public.comment_mentions (
  comment_id bigint not null references public.comments(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  primary key (comment_id, user_id)
);
create index if not exists post_mentions_user_idx on public.post_mentions(user_id);
create index if not exists comment_mentions_user_idx on public.comment_mentions(user_id);
alter table public.post_mentions enable row level security;
alter table public.comment_mentions enable row level security;
drop policy if exists "pm read" on public.post_mentions;
drop policy if exists "pm insert" on public.post_mentions;
drop policy if exists "pm delete" on public.post_mentions;
drop policy if exists "cmm read" on public.comment_mentions;
drop policy if exists "cmm insert" on public.comment_mentions;
drop policy if exists "cmm delete" on public.comment_mentions;
create policy "pm read" on public.post_mentions for select using (public.can_see_post(post_id));
create policy "pm insert" on public.post_mentions for insert to authenticated
  with check (user_id <> auth.uid() and not public.is_blocked(auth.uid(), user_id)
    and exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid()));
create policy "pm delete" on public.post_mentions for delete to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid()));
create policy "cmm read" on public.comment_mentions for select
  using (exists (select 1 from public.comments c where c.id = comment_id and public.can_see_post(c.post_id)));
create policy "cmm insert" on public.comment_mentions for insert to authenticated
  with check (user_id <> auth.uid() and not public.is_blocked(auth.uid(), user_id)
    and exists (select 1 from public.comments c where c.id = comment_id and c.user_id = auth.uid()));
create policy "cmm delete" on public.comment_mentions for delete to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.comments c where c.id = comment_id and c.user_id = auth.uid()));
-- মেনশন হলে নোটিফিকেশন, তবে শুধু যদি তিনি পোস্টটি দেখতে পারেন
create or replace function public.on_mention()
returns trigger language plpgsql security definer set search_path = public as $$
declare pid bigint; actor uuid;
begin
  if tg_table_name = 'post_mentions' then
    select id, user_id into pid, actor from public.posts where id = new.post_id;
  else
    select post_id, user_id into pid, actor from public.comments where id = new.comment_id;
  end if;
  if public.user_sees_post(new.user_id, pid) then perform public.notify(new.user_id, actor, 'mention', pid); end if;
  return null;
end $$;
drop trigger if exists notify_post_mention on public.post_mentions;
drop trigger if exists notify_comment_mention on public.comment_mentions;
create trigger notify_post_mention after insert on public.post_mentions for each row execute function public.on_mention();
create trigger notify_comment_mention after insert on public.comment_mentions for each row execute function public.on_mention();

-- অ্যাপ নিয়ন্ত্রণ (অ্যাডমিন ড্যাশবোর্ড)
insert into public.app_settings (key, value) values
  ('feature_blood', 'true'), ('feature_groups', 'true'), ('feature_pages', 'true'),
  ('announcement', '""'), ('min_app_version', '0'), ('latest_app_version', '0')
on conflict (key) do nothing;   -- ফিচার চালু/বন্ধ, ঘোষণা ও অ্যাপ ভার্সন (অ্যাডমিন ড্যাশবোর্ড থেকে বদলানো যায়)


-- =====================================================================
--  নিরাপত্তা আরও শক্ত করা (Supabase Security Advisor অনুযায়ী)
--  • কে কাকে ব্লক করেছে তা শুধু দুই পক্ষ জানতে পারে
--  • ভেতরের হিসাবের ফাংশনগুলো "private" স্কিমায়, বাইরে থেকে ডাকা যায় না
--  • ট্রিগার ফাংশন সরাসরি ডাকা যায় না
-- =====================================================================
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.is_blocked(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a));
$$;
create or replace function public.is_blocked(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and auth.uid() in (a, b) and private.is_blocked(a, b);
$$;
create or replace function private.user_sees_post(uid uuid, pid bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.posts p where p.id = pid
    and not private.is_blocked(uid, p.user_id)
    and (p.group_id is null
         or exists (select 1 from public.groups g where g.id = p.group_id and g.privacy = 'public')
         or exists (select 1 from public.group_members m where m.group_id = p.group_id and m.user_id = uid and m.status = 'active'))
    and (p.privacy = 'public' or p.user_id = uid or (p.privacy = 'friends' and public.are_friends(uid, p.user_id))));
$$;
create or replace function public.on_mention()
returns trigger language plpgsql security definer set search_path = public as $$
declare pid bigint; actor uuid;
begin
  if tg_table_name = 'post_mentions' then
    select id, user_id into pid, actor from public.posts where id = new.post_id;
  else
    select post_id, user_id into pid, actor from public.comments where id = new.comment_id;
  end if;
  if private.user_sees_post(new.user_id, pid) then perform public.notify(new.user_id, actor, 'mention', pid); end if;
  return null;
end $$;
drop function if exists public.user_sees_post(uuid, bigint);
create or replace function public.notify(to_user uuid, from_user uuid, kind text, post bigint default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if to_user is null or to_user = from_user or private.is_blocked(to_user, from_user) then return; end if;
  delete from public.notifications
   where user_id = to_user and actor_id = from_user and type = kind and post_id is not distinct from post and kind not in ('comment','reply');
  insert into public.notifications (user_id, actor_id, type, post_id) values (to_user, from_user, kind, post);
end $$;
revoke all on function public.notify(uuid, uuid, text, bigint) from public, anon, authenticated;
create or replace function public.join_group(gid bigint)
returns text language plpgsql security definer set search_path = public as $$
declare p text; st text;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select privacy into p from public.groups where id = gid;
  if p is null then raise exception 'group not found'; end if;
  st := case when p = 'public' then 'active' else 'pending' end;
  insert into public.group_members (group_id, user_id, role, status) values (gid, auth.uid(), 'member', st)
    on conflict (group_id, user_id) do nothing;
  if st = 'pending' then
    insert into public.notifications (user_id, actor_id, type, group_id)
      select m.user_id, auth.uid(), 'group_request', gid from public.group_members m
       where m.group_id = gid and m.role = 'admin' and m.status = 'active' and not private.is_blocked(m.user_id, auth.uid());
  end if;
  return st;
end $$;
revoke all on function public.join_group(bigint) from public, anon;
grant execute on function public.join_group(bigint) to authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.bump_group_counts() from public, anon, authenticated;
revoke all on function public.bump_saves() from public, anon, authenticated;
revoke all on function public.bump_comment_reacts() from public, anon, authenticated;
revoke all on function public.bump_shares() from public, anon, authenticated;
revoke all on function public.bump_counts() from public, anon, authenticated;
revoke all on function public.on_block() from public, anon, authenticated;
revoke all on function public.on_group_created() from public, anon, authenticated;
revoke all on function public.on_social_event() from public, anon, authenticated;
revoke all on function public.on_mention() from public, anon, authenticated;
