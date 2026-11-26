-- আগে schema.sql চালিয়ে থাকলে এবাউটের প্রাইভেসির জন্য শুধু এই ফাইলটা চালান (বারবার চালালেও সমস্যা নেই)।
-- ---------- এবাউটের প্রাইভেসি: কাজ, শিক্ষা, যোগাযোগ (মোবাইল), সোশ্যাল লিংক ----------
-- এই তথ্য আলাদা টেবিলে, যেটা সরাসরি শুধু মালিক পড়তে পারে।
-- অন্যরা পায় শুধু profile_about() দিয়ে, মালিকের সেটিং মেনে (পাবলিক / বন্ধুরা / শুধু আমি)।
create table if not exists public.profile_details (
  user_id                uuid primary key references public.profiles(id) on delete cascade,
  works                  jsonb not null default '[]'::jsonb check (public.valid_works(works)),
  educations             jsonb not null default '[]'::jsonb check (public.valid_educations(educations)),
  social                 jsonb not null default '{}'::jsonb check (public.valid_social(social)),
  works_visibility       text not null default 'public'  check (works_visibility in ('public','friends','only_me')),
  educations_visibility  text not null default 'public'  check (educations_visibility in ('public','friends','only_me')),
  contact_visibility     text not null default 'only_me' check (contact_visibility in ('public','friends','only_me')),
  social_visibility      text not null default 'public'  check (social_visibility in ('public','friends','only_me'))
);
alter table public.profile_details enable row level security;
drop policy if exists "details own read" on public.profile_details;
drop policy if exists "details own insert" on public.profile_details;
drop policy if exists "details own update" on public.profile_details;
create policy "details own read"   on public.profile_details for select using (user_id = auth.uid());
create policy "details own insert" on public.profile_details for insert to authenticated with check (user_id = auth.uid());
create policy "details own update" on public.profile_details for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- আগে প্রোফাইল টেবিলে রাখা কাজ/শিক্ষা/সোশ্যাল লিংক নতুন টেবিলে সরানো
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'works') then
    insert into public.profile_details (user_id, works, educations, social)
      select id, works, educations, social from public.profiles
       where works <> '[]' or educations <> '[]' or social <> '{}'
      on conflict (user_id) do update set works = excluded.works, educations = excluded.educations, social = excluded.social;
    alter table public.profiles drop constraint if exists profiles_works_valid;
    alter table public.profiles drop constraint if exists profiles_educations_valid;
    alter table public.profiles drop constraint if exists profiles_social_valid;
    alter table public.profiles drop column works, drop column educations, drop column social;
  end if;
end $$;

create schema if not exists private;
-- কেউ (এখন যিনি দেখছেন) মালিকের এই সেটিংয়ের তথ্য দেখতে পারবেন কিনা
create or replace function private.can_view(owner uuid, vis text)
returns boolean language sql stable security definer set search_path = public as $$
  select owner = auth.uid() or public.is_admin()
      or ((auth.uid() is null or not private.is_blocked(auth.uid(), owner))
          and (vis = 'public' or (vis = 'friends' and private.are_friends(auth.uid(), owner))));
$$;
create or replace function public.profile_about(uid uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'works',      case when private.can_view(p.id, coalesce(d.works_visibility, 'public'))      then coalesce(d.works, '[]'::jsonb) end,
    'educations', case when private.can_view(p.id, coalesce(d.educations_visibility, 'public')) then coalesce(d.educations, '[]'::jsonb) end,
    'social',     case when private.can_view(p.id, coalesce(d.social_visibility, 'public'))     then coalesce(d.social, '{}'::jsonb) end,
    'phone',      case when private.can_view(p.id, coalesce(d.contact_visibility, 'only_me'))   then pp.phone end)
  from public.profiles p
  left join public.profile_details d on d.user_id = p.id
  left join public.profile_private pp on pp.user_id = p.id
  where p.id = uid;
$$;
grant execute on function public.profile_about(uuid) to anon, authenticated;

-- ---------- সম্পর্কের অবস্থা, ধর্ম, সংগঠন/ক্লাব ----------
-- সম্পর্ক ও ধর্ম শুরুতে "শুধু আমি"; সংগঠন শুরুতে পাবলিক
create or replace function public.valid_orgs(j jsonb)
returns boolean language sql immutable as $$
  select jsonb_typeof(j) = 'array' and jsonb_array_length(j) <= 5
     and not exists (select 1 from jsonb_array_elements(j) e where case
       when jsonb_typeof(e) <> 'object' then true
       when exists (select 1 from jsonb_object_keys(e) k where k not in ('name','role')) then true
       when jsonb_typeof(e->'name') is distinct from 'string' then true
       when char_length(e->>'name') not between 1 and 80 then true
       when e ? 'role' and (jsonb_typeof(e->'role') <> 'string' or char_length(e->>'role') > 40) then true
       else false end);
$$;
alter table public.profile_details add column if not exists relationship text
  check (relationship in ('single','married','engaged','divorced','widowed'));
alter table public.profile_details add column if not exists relationship_visibility text not null default 'only_me' check (relationship_visibility in ('public','friends','only_me'));
alter table public.profile_details add column if not exists religion text
  check (religion in ('islam','hindu','buddhist','christian','other'));
alter table public.profile_details add column if not exists religion_visibility text not null default 'only_me' check (religion_visibility in ('public','friends','only_me'));
alter table public.profile_details add column if not exists orgs jsonb not null default '[]'::jsonb;
alter table public.profile_details add column if not exists orgs_visibility text not null default 'public' check (orgs_visibility in ('public','friends','only_me'));
do $$ begin
  alter table public.profile_details add constraint profile_details_orgs_valid check (public.valid_orgs(orgs));
exception when duplicate_object then null; end $$;

create or replace function public.profile_about(uid uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'works',        case when private.can_view(p.id, coalesce(d.works_visibility, 'public'))          then coalesce(d.works, '[]'::jsonb) end,
    'educations',   case when private.can_view(p.id, coalesce(d.educations_visibility, 'public'))     then coalesce(d.educations, '[]'::jsonb) end,
    'social',       case when private.can_view(p.id, coalesce(d.social_visibility, 'public'))         then coalesce(d.social, '{}'::jsonb) end,
    'phone',        case when private.can_view(p.id, coalesce(d.contact_visibility, 'only_me'))       then pp.phone end,
    'birth_year',   case when private.can_view(p.id, coalesce(d.birth_visibility, 'only_me'))         then d.birth_year end,
    'birth_date',   case when private.can_view(p.id, coalesce(d.birth_visibility, 'only_me'))         then d.birth_date end,
    'relationship', case when private.can_view(p.id, coalesce(d.relationship_visibility, 'only_me'))  then d.relationship end,
    'religion',     case when private.can_view(p.id, coalesce(d.religion_visibility, 'only_me'))      then d.religion end,
    'orgs',         case when private.can_view(p.id, coalesce(d.orgs_visibility, 'public'))           then coalesce(d.orgs, '[]'::jsonb) end)
  from public.profiles p
  left join public.profile_details d on d.user_id = p.id
  left join public.profile_private pp on pp.user_id = p.id
  where p.id = uid;
$$;
grant execute on function public.profile_about(uuid) to anon, authenticated;
