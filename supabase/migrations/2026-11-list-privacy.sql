-- আগে schema.sql চালিয়ে থাকলে বন্ধু/ফলো তালিকার প্রাইভেসির জন্য শুধু এই ফাইলটা চালান (বারবার চালালেও সমস্যা নেই)।
-- ---------- বন্ধু ও ফলো তালিকার প্রাইভেসি ----------
-- কারা দেখবে: public (সবাই) / friends (বন্ধুরা) / only_me (শুধু আমি)। সংখ্যা সবসময় সবাই দেখে।
alter table public.profiles add column if not exists friends_visibility text not null default 'public' check (friends_visibility in ('public','friends','only_me'));
alter table public.profiles add column if not exists follows_visibility text not null default 'public' check (follows_visibility in ('public','friends','only_me'));

create schema if not exists private;
-- ভেতরের হিসাবের জন্য (যেকোনো দুজন); বাইরে থেকে ডাকা যায় না
create or replace function private.are_friends(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select a is not null and b is not null and exists (select 1 from public.friendships
    where status = 'accepted' and ((requester = a and addressee = b) or (requester = b and addressee = a)));
$$;
-- বাইরে থেকে শুধু নিজের সাথে কারও বন্ধুত্ব যাচাই করা যায়
create or replace function public.are_friends(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and auth.uid() in (a, b) and private.are_friends(a, b);
$$;
create or replace function private.user_sees_post(uid uuid, pid bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.posts p where p.id = pid
    and not private.is_blocked(uid, p.user_id)
    and (p.group_id is null
         or exists (select 1 from public.groups g where g.id = p.group_id and g.privacy = 'public')
         or exists (select 1 from public.group_members m where m.group_id = p.group_id and m.user_id = uid and m.status = 'active'))
    and (p.privacy = 'public' or p.user_id = uid or (p.privacy = 'friends' and private.are_friends(uid, p.user_id))));
$$;

-- টেবিল থেকে সরাসরি শুধু নিজের বন্ধুত্ব/ফলো পড়া যায়; অন্যের তালিকা শুধু list_people() দিয়ে
drop policy if exists "friends read" on public.friendships;
create policy "friends read" on public.friendships for select using (auth.uid() in (requester, addressee));
drop policy if exists "follows read" on public.follows;
create policy "follows read" on public.follows for select using (auth.uid() in (follower_id, followee_id));

-- সংখ্যা: সবাই দেখতে পারে
create or replace function public.profile_counts(uid uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'friends', (select count(*) from public.friendships where status = 'accepted' and uid in (requester, addressee)),
    'followers', (select count(*) from public.follows where followee_id = uid),
    'following', (select count(*) from public.follows where follower_id = uid));
$$;
grant execute on function public.profile_counts(uuid) to anon, authenticated;

-- তালিকা: মালিকের সেটিং মেনে। kind = friends / followers / following
create or replace function public.list_people(uid uuid, kind text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare vis text; ok boolean; ids uuid[];
begin
  select case when kind = 'friends' then friends_visibility else follows_visibility end into vis from public.profiles where id = uid;
  if vis is null then return jsonb_build_object('allowed', false, 'ids', '[]'::jsonb); end if;
  ok := uid = auth.uid() or public.is_admin() or vis = 'public' or (vis = 'friends' and private.are_friends(auth.uid(), uid));
  if not ok then return jsonb_build_object('allowed', false, 'visibility', vis, 'ids', '[]'::jsonb); end if;
  if kind = 'friends' then
    select array_agg(x order by t desc) into ids from (
      select case when requester = uid then addressee else requester end x, created_at t from public.friendships
       where status = 'accepted' and uid in (requester, addressee)) s
     where auth.uid() is null or not private.is_blocked(auth.uid(), x);
  elsif kind = 'followers' then
    select array_agg(follower_id order by created_at desc) into ids from public.follows
     where followee_id = uid and (auth.uid() is null or not private.is_blocked(auth.uid(), follower_id));
  elsif kind = 'following' then
    select array_agg(followee_id order by created_at desc) into ids from public.follows
     where follower_id = uid and (auth.uid() is null or not private.is_blocked(auth.uid(), followee_id));
  else raise exception 'bad kind';
  end if;
  return jsonb_build_object('allowed', true, 'visibility', vis, 'ids', to_jsonb(coalesce(ids, '{}')));
end $$;
grant execute on function public.list_people(uuid, text) to anon, authenticated;
