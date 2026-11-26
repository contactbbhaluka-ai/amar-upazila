-- =====================================================================
--  মুছে ফেলার অনুরোধের ৩০ দিন প্রোফাইল লুকানো (ফেসবুকের মতো):
--  পোস্ট, স্টোরি, মন্তব্য, তালিকা ও সাজেশনে দেখা যাবে না; প্রোফাইল খুললে "দেখা যাচ্ছে না"
-- =====================================================================
create or replace function private.is_deactivated(u uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select u is distinct from auth.uid() and not public.is_admin()
     and exists (select 1 from public.profiles where id = u and delete_requested_at is not null);
$$;
grant execute on function private.is_deactivated(uuid) to public;

create or replace function private.profile_hidden(owner uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select owner is distinct from auth.uid() and not public.is_admin()
     and exists (select 1 from public.profiles where id = owner
                  and (delete_requested_at is not null or (locked and not coalesce(private.are_friends(owner, auth.uid()), false))));
$$;

create or replace function public.profile_about(uid uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if private.is_deactivated(uid) then return jsonb_build_object('locked', true, 'gone', true); end if;
  if private.profile_hidden(uid) then return jsonb_build_object('locked', true); end if;
  return private.profile_about_full(uid);
end $$;

-- তাদের মন্তব্যও লুকানো
drop policy if exists "comments read" on public.comments;
create policy "comments read" on public.comments for select using (public.can_see_post(post_id) and not private.is_deactivated(user_id));

-- সাজেশনে না আসা
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
     where c.u not in (select u from excl where u is not null) and p.delete_requested_at is null
  )
  select u, mutual, same_area, school, is_new from scored
   where auth.uid() is not null
   order by mutual desc, (school is not null) desc, same_area desc, created_at desc
   limit least(greatest(p_limit, 1), 100);
$$;

create or replace function public.area_people(p_union bigint default null, p_upazila text default null, p_limit int default 60)
returns table(id uuid, mutual int, same_area boolean, school text, is_new boolean)
language sql stable security definer set search_path = public as $$
  with mine as (
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
    select p.id, p.created_at from public.profiles p
     where auth.uid() is not null and (p_union is not null or p_upazila is not null)
       and (p_union is null or p.union_id = p_union) and (p_upazila is null or (p.union_id is null and p.upazila = p_upazila))
       and p.id not in (select u from excl where u is not null) and p.delete_requested_at is null
     order by p.created_at desc limit 400
  )
  select c.id,
         (select count(*) from mine m where private.are_friends(m.f, c.id))::int m,
         true,
         (select e->>'school' from public.profile_details pd, jsonb_array_elements(pd.educations) e
           where pd.user_id = c.id and lower(btrim(e->>'school')) in (select s from my_schools) and private.can_view(c.id, pd.educations_visibility) limit 1),
         c.created_at > now() - interval '7 days'
    from cand c
   order by m desc, c.created_at desc
   limit least(greatest(p_limit, 1), 100);
$$;
