-- আগে schema.sql চালিয়ে থাকলে লিঙ্গ ও ইউজারনেমের জন্য শুধু এই ফাইলটা চালান (বারবার চালালেও সমস্যা নেই)।
-- ---------- লিঙ্গ ও ইউজারনেম ----------
-- লিঙ্গ: male / female / other; খালি = বলতে চান না
alter table public.profiles add column if not exists gender text check (gender in ('male','female','other'));
-- ইউজারনেম: ছোট হাতের ইংরেজি অক্ষর, সংখ্যা, _ ও . (৩–২০ অক্ষর), প্রত্যেকের আলাদা
alter table public.profiles add column if not exists username text
  check (username ~ '^[a-z0-9_.]{3,20}$' and username !~ '^\.|\.$|\.\.');
create unique index if not exists profiles_username_key on public.profiles (lower(username)) where username is not null;

-- সাইনআপে দেওয়া লিঙ্গও প্রোফাইলে বসানো
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, union_id, district, upazila, blood_group, last_donated, gender)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), 'নতুন সদস্য'),
    nullif(new.raw_user_meta_data->>'union_id', '')::bigint,
    nullif(left(new.raw_user_meta_data->>'district', 40), ''),
    nullif(left(new.raw_user_meta_data->>'upazila', 40), ''),
    case when new.raw_user_meta_data->>'blood_group' in ('A+','A-','B+','B-','AB+','AB-','O+','O-')
         then new.raw_user_meta_data->>'blood_group' end,
    case when (new.raw_user_meta_data->>'last_donated') ~ '^\d{4}-\d{2}-\d{2}$'
          and (new.raw_user_meta_data->>'last_donated')::date <= current_date
         then (new.raw_user_meta_data->>'last_donated')::date end,
    case when new.raw_user_meta_data->>'gender' in ('male','female','other') then new.raw_user_meta_data->>'gender' end
  );
  if (new.raw_user_meta_data->>'phone') ~ '^01[3-9][0-9]{8}$' then
    insert into public.profile_private (user_id, phone) values (new.id, new.raw_user_meta_data->>'phone');
  end if;
  return new;
end $$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- ---------- জন্মসাল (কারা দেখবে বেছে নেওয়া যায়; শুরুতে শুধু আমি) ----------
alter table public.profile_details add column if not exists birth_year int check (birth_year between 1920 and 2030);
alter table public.profile_details add column if not exists birth_visibility text not null default 'only_me' check (birth_visibility in ('public','friends','only_me'));

create or replace function public.profile_about(uid uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'works',      case when private.can_view(p.id, coalesce(d.works_visibility, 'public'))      then coalesce(d.works, '[]'::jsonb) end,
    'educations', case when private.can_view(p.id, coalesce(d.educations_visibility, 'public')) then coalesce(d.educations, '[]'::jsonb) end,
    'social',     case when private.can_view(p.id, coalesce(d.social_visibility, 'public'))     then coalesce(d.social, '{}'::jsonb) end,
    'phone',      case when private.can_view(p.id, coalesce(d.contact_visibility, 'only_me'))   then pp.phone end,
    'birth_year', case when private.can_view(p.id, coalesce(d.birth_visibility, 'only_me'))     then d.birth_year end)
  from public.profiles p
  left join public.profile_details d on d.user_id = p.id
  left join public.profile_private pp on pp.user_id = p.id
  where p.id = uid;
$$;
grant execute on function public.profile_about(uuid) to anon, authenticated;

-- সাইনআপে দেওয়া জন্মসালও সেভ (বয়স অন্তত ১৩ হলে)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare byear int;
begin
  insert into public.profiles (id, name, union_id, district, upazila, blood_group, last_donated, gender)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), 'নতুন সদস্য'),
    nullif(new.raw_user_meta_data->>'union_id', '')::bigint,
    nullif(left(new.raw_user_meta_data->>'district', 40), ''),
    nullif(left(new.raw_user_meta_data->>'upazila', 40), ''),
    case when new.raw_user_meta_data->>'blood_group' in ('A+','A-','B+','B-','AB+','AB-','O+','O-')
         then new.raw_user_meta_data->>'blood_group' end,
    case when (new.raw_user_meta_data->>'last_donated') ~ '^\d{4}-\d{2}-\d{2}$'
          and (new.raw_user_meta_data->>'last_donated')::date <= current_date
         then (new.raw_user_meta_data->>'last_donated')::date end,
    case when new.raw_user_meta_data->>'gender' in ('male','female','other') then new.raw_user_meta_data->>'gender' end
  );
  if (new.raw_user_meta_data->>'phone') ~ '^01[3-9][0-9]{8}$' then
    insert into public.profile_private (user_id, phone) values (new.id, new.raw_user_meta_data->>'phone');
  end if;
  if (new.raw_user_meta_data->>'birth_year') ~ '^\d{4}$' then
    byear := (new.raw_user_meta_data->>'birth_year')::int;
    if byear >= 1920 and extract(year from current_date)::int - byear >= 13 then
      insert into public.profile_details (user_id, birth_year) values (new.id, byear) on conflict (user_id) do update set birth_year = excluded.birth_year;
    end if;
  end if;
  return new;
end $$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
