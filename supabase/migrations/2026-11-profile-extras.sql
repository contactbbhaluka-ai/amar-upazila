-- =====================================================================
--  প্রোফাইল: রক্ত দিতে প্রস্তুত, জীবনের ঘটনা, মিউচুয়াল বন্ধু
-- =====================================================================
-- রক্ত দিতে প্রস্তুত: ব্যবহারকারী নিজে চালু করেন; শেষ রক্তদানের ৯০ দিনের মধ্যে অ্যাপ "প্রস্তুত" দেখায় না
alter table public.profiles add column if not exists donor_ready boolean not null default false;

-- জীবনের ঘটনা: পোস্টের সঙ্গে ধরন ও তারিখ
alter table public.posts add column if not exists life_event text;
alter table public.posts add column if not exists life_date date;
alter table public.posts drop constraint if exists posts_life_event_check;
alter table public.posts add constraint posts_life_event_check check (life_event is null or life_event in
  ('job','study','graduate','marriage','baby','home','business','hajj','travel','other'));
alter table public.posts drop constraint if exists posts_life_date_check;
alter table public.posts add constraint posts_life_date_check check (life_date is null or (life_date >= date '1920-01-01' and life_date <= current_date + 366));
create index if not exists posts_life_idx on public.posts (user_id, life_date desc) where life_event is not null;

-- মিউচুয়াল বন্ধু: সংখ্যা ও প্রথম কয়েকজন (দুজনেরই বন্ধু, তাই আপনি তাদের আগেই চেনেন)
create or replace function public.mutual_friends(uid uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  with mine as (
    select case when requester = auth.uid() then addressee else requester end x from public.friendships
     where status = 'accepted' and auth.uid() in (requester, addressee)
  ), theirs as (
    select case when requester = uid then addressee else requester end x from public.friendships
     where status = 'accepted' and uid in (requester, addressee)
  ), m as (
    select p.id, p.name, p.avatar_url from mine join theirs using (x) join public.profiles p on p.id = mine.x
     where auth.uid() is not null and uid <> auth.uid() and not private.is_blocked(auth.uid(), p.id)
  )
  select jsonb_build_object('count', (select count(*) from m),
    'list', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'avatar', avatar_url)) from (select * from m order by name limit 3) t), '[]'::jsonb));
$$;

-- ব্লাড ব্যাংক: "রক্ত দিতে প্রস্তুত" ডোনার আগে
drop function if exists public.blood_donors(text, text);
create function public.blood_donors(p_group text default null, p_upazila text default null)
returns table(id uuid, manual_id bigint, name text, avatar_url text, blood_group text, union_id bigint, union_name text, upazila text, district text, phone text, last_donated date, added_by uuid, added_by_name text, donor_ready boolean)
language sql stable security definer set search_path = public as $$
  select * from (
    select p.id, null::bigint, p.name, p.avatar_url, p.blood_group, p.union_id, u.name, p.upazila, p.district,
           case when auth.uid() is not null or public.setting_on('public_donor_phone') then pp.phone end, p.last_donated, null::uuid, null::text,
           p.donor_ready and (p.last_donated is null or p.last_donated <= current_date - 90)
      from public.profiles p
      left join public.unions u on u.id = p.union_id
      left join public.profile_private pp on pp.user_id = p.id
     where p.blood_group is not null and p.donor_visible
       and (auth.uid() is null or not public.is_blocked(auth.uid(), p.id))
    union all
    select null::uuid, m.id, m.name, null, m.blood_group, m.union_id, u.name, m.upazila, m.district,
           case when auth.uid() is not null or public.setting_on('public_donor_phone') then m.phone end, m.last_donated, m.created_by, c.name, false
      from public.manual_donors m
      join public.profiles c on c.id = m.created_by
      left join public.unions u on u.id = m.union_id
     where auth.uid() is null or not public.is_blocked(auth.uid(), m.created_by)
  ) d (id, manual_id, name, avatar_url, blood_group, union_id, union_name, upazila, district, phone, last_donated, added_by, added_by_name, donor_ready)
  where (p_group is null or d.blood_group = p_group)
    and (p_upazila is null or d.upazila = p_upazila)
  order by d.donor_ready desc, (d.last_donated is null or d.last_donated <= current_date - 90) desc, d.blood_group, d.name
  limit 1000;
$$;
grant execute on function public.blood_donors(text, text) to anon, authenticated;
