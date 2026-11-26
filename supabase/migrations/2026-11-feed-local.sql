-- =====================================================================
--  নিউজফিড (২): রক্তের অনুরোধে ডোনারদের নোটিফিকেশন, আলোচিত হ্যাশট্যাগ, বন্ধুদের জন্মদিন
-- =====================================================================
alter table public.posts add column if not exists blood_group text;
alter table public.posts drop constraint if exists posts_blood_group_check;
alter table public.posts add constraint posts_blood_group_check
  check (blood_group is null or blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-'));

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type = any (array[
  'like','comment','share','tag','friend_request','friend_accept','follow','group_request','group_approved',
  'reply','mention','verify_ok','verify_no','boost_ok','boost_no','milestone','follower_milestone','weekly','page_admin',
  'event_reminder','blood_request']));

-- রক্তের অনুরোধ: একই গ্রুপের, একই উপজেলার (না থাকলে জেলার) ডোনারদের জানানো।
-- শর্ত: ডোনার তালিকায় দৃশ্যমান, শেষ রক্তদান ৯০ দিনের বেশি আগে বা অজানা, ব্লক নেই।
-- অপব্যবহার ঠেকাতে একজন ২৪ ঘণ্টায় সর্বোচ্চ ৩ বার; শুধু পাবলিক পোস্টে (যাতে ডোনার পোস্টটা দেখতে পান)।
create or replace function private.blood_request_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare me_p record;
begin
  if new.blood_group is null or new.privacy <> 'public' or new.group_id is not null or new.page_id is not null then return new; end if;
  if (select count(*) from public.posts where user_id = new.user_id and blood_group is not null and id <> new.id and created_at > now() - interval '24 hours') >= 3 then
    return new;
  end if;
  select upazila, district into me_p from public.profiles where id = new.user_id;
  insert into public.notifications(user_id, actor_id, type, post_id, meta)
  select d.id, new.user_id, 'blood_request', new.id, jsonb_build_object('bg', new.blood_group)
    from public.profiles d
   where d.id <> new.user_id and d.blood_group = new.blood_group and coalesce(d.donor_visible, true)
     and (d.last_donated is null or d.last_donated < current_date - 90)
     and ((me_p.upazila is not null and d.upazila = me_p.upazila) or (me_p.upazila is null and me_p.district is not null and d.district = me_p.district))
     and not private.is_blocked(d.id, new.user_id)
   limit 300;
  return new;
end $$;
drop trigger if exists blood_request_notify on public.posts;
create trigger blood_request_notify after insert on public.posts for each row execute function private.blood_request_notify();

-- আলোচিত হ্যাশট্যাগ (গত ৭ দিনের পাবলিক পোস্ট থেকে)
create or replace function public.trending_tags()
returns table(tag text, n bigint)
language sql stable security definer set search_path = public as $$
  select lower(m[1]) tag, count(distinct p.id) n
    from public.posts p, regexp_matches(p.body, '(?:^|[\s(])#([^\s#.,!?।:;()\[\]{}"''<>/\\]{2,40})', 'g') m
   where p.created_at > now() - interval '7 days' and p.privacy = 'public' and p.group_id is null
   group by 1 order by 2 desc, 1 limit 8;
$$;

-- আজ (ঢাকার সময়) যে বন্ধুদের জন্মদিন — জন্মতারিখ যাদের দেখার অনুমতি আছে শুধু তাদের
create or replace function public.friends_birthdays()
returns table(id uuid, name text, avatar_url text)
language sql stable security definer set search_path = public as $$
  with today as (select (now() at time zone 'Asia/Dhaka')::date d)
  select p.id, p.name, p.avatar_url
    from public.friendships f
    join public.profiles p on p.id = case when f.requester = auth.uid() then f.addressee else f.requester end
    join public.profile_details pd on pd.user_id = p.id, today
   where f.status = 'accepted' and auth.uid() in (f.requester, f.addressee)
     and pd.birth_date is not null
     and extract(month from pd.birth_date) = extract(month from today.d) and extract(day from pd.birth_date) = extract(day from today.d)
     and private.can_view(p.id, coalesce(pd.birth_visibility, 'only_me'))
   limit 20;
$$;
