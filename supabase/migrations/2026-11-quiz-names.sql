-- কুইজ: বিকল্পে উপাধি বাদ দিয়ে মূল নাম (যাতে "ভাষা সৈনিক …" দেখে উত্তর ধরা না পড়ে)
create or replace function public.famous_core_name(n text) returns text language sql immutable set search_path = public as $$
  select btrim(regexp_replace(n, '^((ভাষা সৈনিক|বীর মুক্তিযোদ্ধা|মুক্তিযোদ্ধা|অধ্যাপক|অধ্যাপিকা|ডক্টর|ডা|মেজর|কর্নেল|ক্যাপ্টেন|মরহুম|মরহুমা|শহীদ|আলহাজ্ব|এডভোকেট|অ্যাডভোকেট)[.:ঃ]?\s+)+', ''))
$$;
create or replace function public.famous_quiz_start() returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); d date := (now() at time zone 'Asia/Dhaka')::date; qs jsonb := '[]'; ans bigint[] := '{}'; r record; opts jsonb; done record;
begin
  if uid is null then raise exception 'লগইন করুন'; end if;
  select * into done from public.quiz_sessions where user_id = uid and day = d;
  if found and done.score is not null then return jsonb_build_object('done', true, 'score', done.score, 'total', cardinality(done.answers)); end if;
  for r in select id, name, tagline, address from public.services
           where category = 'famous' and verified and (coalesce(tagline, '') <> '' or coalesce(address, '') <> '') order by random() limit 5 loop
    select jsonb_agg(jsonb_build_object('id', o.id, 'name', public.famous_core_name(o.name)) order by random()) into opts from (
      (select id, name from public.services where id = r.id)
      union all (select id, name from (select id, name from public.services where category = 'famous' and verified and id <> r.id order by random() limit 3) z)
    ) o;
    qs := qs || jsonb_build_object('q', case when coalesce(r.tagline, '') <> '' and (coalesce(r.address, '') = '' or random() < 0.6)
            then 'কার পরিচিতি: “' || r.tagline || '”?' else 'কার জন্মস্থান ' || r.address || '?' end, 'options', opts);
    ans := ans || r.id;
  end loop;
  if cardinality(ans) < 3 then return jsonb_build_object('error', 'কুইজের জন্য যথেষ্ট তথ্য নেই'); end if;
  insert into public.quiz_sessions (user_id, day, answers) values (uid, d, ans)
    on conflict (user_id, day) do update set answers = excluded.answers, created_at = now() where public.quiz_sessions.score is null;
  return jsonb_build_object('questions', qs);
end $$;
revoke execute on function public.famous_quiz_start() from public, anon;
grant execute on function public.famous_quiz_start() to authenticated;
