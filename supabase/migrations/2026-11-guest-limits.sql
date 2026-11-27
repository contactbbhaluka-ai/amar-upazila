-- লগইন ছাড়া (anon) কেউ সব ব্যবহারকারীর লিঙ্গ, ব্লাড গ্রুপ ও রক্তদানের তথ্য একসাথে টেনে নিতে পারবে না
revoke select on public.profiles from anon;
grant select (id, name, union_id, district, upazila, avatar_url, bio, role, created_at, cover_url, friends_visibility, followers_visibility, following_visibility, username, verified, verified_until, locked, pinned_post_id, friend_req_from, delete_requested_at) on public.profiles to anon;

-- স্টোরি শুধু লগইন করা সদস্যরা দেখবেন
drop policy if exists "stories read" on public.stories;
create policy "stories read" on public.stories for select using (
  auth.uid() is not null and expires_at > now()
  and (user_id = auth.uid() or (private.can_view(user_id, privacy) and not private.profile_hidden(user_id))));
