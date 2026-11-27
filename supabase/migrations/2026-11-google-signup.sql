-- Google দিয়ে অ্যাকাউন্ট: Google-এর নাম/ছবি নেওয়া হয় না, সাইনআপের সব ধাপ পূরণ না করা পর্যন্ত needs_setup = true
alter table public.profiles add column if not exists needs_setup boolean not null default false;

create or replace function public.handle_new_user()
 returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare bd date; oauth boolean := coalesce(new.raw_app_meta_data->>'provider', 'email') not in ('email', 'phone');
begin
  if oauth then
    insert into public.profiles (id, name, needs_setup) values (new.id, 'নতুন সদস্য', true);
    return new;
  end if;
  insert into public.profiles (id, name, union_id, district, upazila, blood_group, last_donated, gender)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), 'নতুন সদস্য'),
    nullif(new.raw_user_meta_data->>'union_id', '')::bigint,
    nullif(left(new.raw_user_meta_data->>'district', 40), ''),
    nullif(left(new.raw_user_meta_data->>'upazila', 40), ''),
    case when new.raw_user_meta_data->>'blood_group' in ('A+','A-','B+','B-','AB+','AB-','O+','O-') then new.raw_user_meta_data->>'blood_group' end,
    case when (new.raw_user_meta_data->>'last_donated') ~ '^\d{4}-\d{2}-\d{2}$' and (new.raw_user_meta_data->>'last_donated')::date <= current_date then (new.raw_user_meta_data->>'last_donated')::date end,
    case when new.raw_user_meta_data->>'gender' in ('male','female','other') then new.raw_user_meta_data->>'gender' end
  );
  if (new.raw_user_meta_data->>'phone') ~ '^01[3-9][0-9]{8}$' then
    insert into public.profile_private (user_id, phone) values (new.id, new.raw_user_meta_data->>'phone');
  end if;
  if (new.raw_user_meta_data->>'birth_date') ~ '^\d{4}-\d{2}-\d{2}$' then
    begin
      bd := (new.raw_user_meta_data->>'birth_date')::date;
      if bd >= date '1920-01-01' and bd <= (current_date - interval '13 years')::date then
        insert into public.profile_details (user_id, birth_date) values (new.id, bd) on conflict (user_id) do update set birth_date = excluded.birth_date;
      end if;
    exception when others then null;
    end;
  end if;
  return new;
end $function$;
