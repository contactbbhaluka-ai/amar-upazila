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
