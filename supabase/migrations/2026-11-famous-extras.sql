-- প্রসিদ্ধ ব্যক্তি: টাইমলাইন, তথ্য বক্স, সম্মাননা, উক্তি, জন্ম/মৃত্যুবার্ষিকী, সমাধি, সম্পর্কিত, পরিবারের যাচাই,
-- শ্রদ্ধাঞ্জলি, প্রস্তাব/তথ্য পাঠানো, কুইজ
alter table public.services add column if not exists timeline jsonb not null default '[]' check (jsonb_typeof(timeline) = 'array' and jsonb_array_length(timeline) <= 40);
alter table public.services add column if not exists facts jsonb not null default '[]' check (jsonb_typeof(facts) = 'array' and jsonb_array_length(facts) <= 20);
alter table public.services add column if not exists honors text[] not null default '{}' check (cardinality(honors) <= 20);
alter table public.services add column if not exists quote text check (quote is null or char_length(quote) <= 500);
alter table public.services add column if not exists born_md text check (born_md is null or born_md ~ '^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$');
alter table public.services add column if not exists died_md text check (died_md is null or died_md ~ '^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$');
alter table public.services add column if not exists burial text check (burial is null or char_length(burial) <= 300);
alter table public.services add column if not exists burial_lat double precision;
alter table public.services add column if not exists burial_lng double precision;
alter table public.services add column if not exists related bigint[] not null default '{}' check (cardinality(related) <= 20);
alter table public.services add column if not exists family_verified text check (family_verified is null or char_length(family_verified) <= 120);
alter table public.services add column if not exists tribute_count int not null default 0;

-- 🌹 শ্রদ্ধাঞ্জলি: এক অ্যাকাউন্ট থেকে একবার
create table if not exists public.service_tributes (
  service_id bigint not null references public.services(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (service_id, user_id)
);
alter table public.service_tributes enable row level security;
drop policy if exists "tributes read own" on public.service_tributes;
create policy "tributes read own" on public.service_tributes for select using (user_id = auth.uid());
drop policy if exists "tributes insert own" on public.service_tributes;
create policy "tributes insert own" on public.service_tributes for insert with check (user_id = auth.uid());
drop policy if exists "tributes delete own" on public.service_tributes;
create policy "tributes delete own" on public.service_tributes for delete using (user_id = auth.uid());
create or replace function public.service_tribute_sync() returns trigger language plpgsql security definer set search_path = public as $$
declare sid bigint := coalesce(new.service_id, old.service_id);
begin
  update public.services set tribute_count = (select count(*) from public.service_tributes where service_id = sid) where id = sid;
  return null;
end $$;
revoke execute on function public.service_tribute_sync() from public, anon, authenticated;
drop trigger if exists service_tributes_sync on public.service_tributes;
create trigger service_tributes_sync after insert or delete on public.service_tributes for each row execute function public.service_tribute_sync();

-- 📝 প্রস্তাব: নতুন নাম, ছবি/তথ্য পাঠানো, পরিবারের যাচাই — অ্যাডমিন অনুমোদন দিলে যোগ হয়
create table if not exists public.service_suggestions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  kind text not null check (kind in ('new', 'media', 'family')),
  service_id bigint references public.services(id) on delete cascade,
  category text not null default 'famous' check (char_length(category) <= 30),
  payload jsonb not null default '{}' check (pg_column_size(payload) <= 30000),
  images text[] not null default '{}' check (cardinality(images) <= 8),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);
create index if not exists service_suggestions_pending on public.service_suggestions(status, created_at desc);
alter table public.service_suggestions enable row level security;
drop policy if exists "sugg read own or admin" on public.service_suggestions;
create policy "sugg read own or admin" on public.service_suggestions for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "sugg insert own" on public.service_suggestions;
create policy "sugg insert own" on public.service_suggestions for insert with check (user_id = auth.uid() and status = 'pending');
drop policy if exists "sugg admin update" on public.service_suggestions;
create policy "sugg admin update" on public.service_suggestions for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "sugg admin delete" on public.service_suggestions;
create policy "sugg admin delete" on public.service_suggestions for delete using (public.is_admin());
-- একজন একদিনে সর্বোচ্চ ১০টি প্রস্তাব
create or replace function public.service_sugg_limit() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.service_suggestions where user_id = new.user_id and created_at > now() - interval '1 day') >= 10 then
    raise exception 'আজ অনেকগুলো প্রস্তাব পাঠিয়েছেন, কাল আবার চেষ্টা করুন';
  end if;
  return new;
end $$;
revoke execute on function public.service_sugg_limit() from public, anon, authenticated;
drop trigger if exists service_sugg_limit on public.service_suggestions;
create trigger service_sugg_limit before insert on public.service_suggestions for each row execute function public.service_sugg_limit();

-- 🧠 কুইজ: প্রশ্ন সার্ভার দেয় ও উত্তর মেলায়; দিনে একবার কয়েন
alter table public.coin_ledger drop constraint if exists coin_ledger_reason_check;
alter table public.coin_ledger add constraint coin_ledger_reason_check check (reason = any (array['post','comment','like','share','badge','boost','refund','admin','quiz']));
create table if not exists public.quiz_sessions (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default (now() at time zone 'Asia/Dhaka')::date,
  answers bigint[] not null,
  score int,
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);
alter table public.quiz_sessions enable row level security;
drop policy if exists "quiz read own" on public.quiz_sessions;
create policy "quiz read own" on public.quiz_sessions for select using (user_id = auth.uid());

create or replace function public.famous_quiz_start() returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); d date := (now() at time zone 'Asia/Dhaka')::date; qs jsonb := '[]'; ans bigint[] := '{}'; r record; opts jsonb; done record;
begin
  if uid is null then raise exception 'লগইন করুন'; end if;
  select * into done from public.quiz_sessions where user_id = uid and day = d;
  if found and done.score is not null then return jsonb_build_object('done', true, 'score', done.score, 'total', cardinality(done.answers)); end if;
  for r in select id, name, tagline, address from public.services
           where category = 'famous' and verified and (coalesce(tagline, '') <> '' or coalesce(address, '') <> '') order by random() limit 5 loop
    select jsonb_agg(jsonb_build_object('id', o.id, 'name', o.name) order by random()) into opts from (
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

create or replace function public.famous_quiz_submit(p_answers bigint[]) returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); d date := (now() at time zone 'Asia/Dhaka')::date; s record; sc int := 0; i int; coins int := 0;
begin
  if uid is null then raise exception 'লগইন করুন'; end if;
  select * into s from public.quiz_sessions where user_id = uid and day = d for update;
  if not found then raise exception 'আগে কুইজ শুরু করুন'; end if;
  if s.score is not null then return jsonb_build_object('score', s.score, 'total', cardinality(s.answers), 'coins', 0, 'answers', s.answers); end if;
  for i in 1 .. cardinality(s.answers) loop if p_answers[i] = s.answers[i] then sc := sc + 1; end if; end loop;
  update public.quiz_sessions set score = sc where user_id = uid and day = d;
  if sc > 0 and private.add_coins(uid, sc * 2, 'quiz', 'famous:' || d::text) then coins := sc * 2; end if;
  return jsonb_build_object('score', sc, 'total', cardinality(s.answers), 'coins', coins, 'answers', s.answers);
end $$;
revoke execute on function public.famous_quiz_submit(bigint[]) from public, anon;
grant execute on function public.famous_quiz_submit(bigint[]) to authenticated;
