-- আগে schema.sql চালিয়ে থাকলে কাজ ও শিক্ষার বিস্তারিত তথ্যের জন্য শুধু এই ফাইলটা চালান (বারবার চালালেও সমস্যা নেই)।
-- ---------- কাজ ও শিক্ষা: একাধিক কর্মস্থল (নাম, পদবি) ও শিক্ষাপ্রতিষ্ঠান (অবস্থা, পাশের সন, বিষয়/গ্রুপ) ----------
-- works:      [{ "place": "কর্মস্থল", "title": "পদবি" }]                      সর্বোচ্চ ৩টি
-- educations: [{ "school": "প্রতিষ্ঠান", "status": "passed|running", "year": 2020, "subject": "বিজ্ঞান" }]  সর্বোচ্চ ৫টি
create or replace function public.valid_works(j jsonb)
returns boolean language sql immutable as $$
  select jsonb_typeof(j) = 'array' and jsonb_array_length(j) <= 3
     and not exists (select 1 from jsonb_array_elements(j) e where case
       when jsonb_typeof(e) <> 'object' then true
       when exists (select 1 from jsonb_object_keys(e) k where k not in ('place','title')) then true
       when jsonb_typeof(e->'place') is distinct from 'string' then true
       when char_length(e->>'place') not between 1 and 80 then true
       when e ? 'title' and (jsonb_typeof(e->'title') <> 'string' or char_length(e->>'title') > 60) then true
       else false end);
$$;
create or replace function public.valid_educations(j jsonb)
returns boolean language sql immutable as $$
  select jsonb_typeof(j) = 'array' and jsonb_array_length(j) <= 5
     and not exists (select 1 from jsonb_array_elements(j) e where case
       when jsonb_typeof(e) <> 'object' then true
       when exists (select 1 from jsonb_object_keys(e) k where k not in ('school','status','year','subject')) then true
       when jsonb_typeof(e->'school') is distinct from 'string' then true
       when char_length(e->>'school') not between 1 and 80 then true
       when e ? 'status' and (e->>'status') not in ('passed','running') then true
       when e ? 'year' and jsonb_typeof(e->'year') <> 'number' then true
       when e ? 'year' and (e->>'year')::numeric not between 1950 and 2040 then true
       when e ? 'subject' and (jsonb_typeof(e->'subject') <> 'string' or char_length(e->>'subject') > 60) then true
       else false end);
$$;
alter table public.profiles add column if not exists works jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists educations jsonb not null default '[]'::jsonb;
do $$ begin
  alter table public.profiles add constraint profiles_works_valid check (public.valid_works(works));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.profiles add constraint profiles_educations_valid check (public.valid_educations(educations));
exception when duplicate_object then null; end $$;
-- আগের এক-লাইনের "কাজ"/"শিক্ষা" থাকলে নতুন তালিকায় তুলে পুরনো ঘর সরানো
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'work') then
    update public.profiles set works = jsonb_build_array(jsonb_build_object('place', left(work, 80))) where coalesce(work, '') <> '' and works = '[]';
    update public.profiles set educations = jsonb_build_array(jsonb_build_object('school', left(education, 80), 'status', 'passed')) where coalesce(education, '') <> '' and educations = '[]';
    alter table public.profiles drop column work;
    alter table public.profiles drop column education;
  end if;
end $$;
