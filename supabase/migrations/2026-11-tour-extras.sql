-- দর্শনীয় স্থান: ধরন, সুবিধা, যাতায়াত, ভালো সময়, রেটিং ও রিভিউ
alter table public.services add column if not exists subtype text check (subtype is null or char_length(subtype) <= 30);
alter table public.services add column if not exists amenities text[] not null default '{}' check (cardinality(amenities) <= 20);
alter table public.services add column if not exists how_to_go text check (how_to_go is null or char_length(how_to_go) <= 3000);
alter table public.services add column if not exists best_time text check (best_time is null or char_length(best_time) <= 300);
alter table public.services add column if not exists rating_avg numeric(2,1) not null default 0;
alter table public.services add column if not exists rating_count int not null default 0;

create table if not exists public.service_reviews (
  id bigint generated always as identity primary key,
  service_id bigint not null references public.services(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  rating smallint not null check (rating between 1 and 5),
  body text check (body is null or char_length(body) <= 1000),
  created_at timestamptz not null default now(),
  unique (service_id, user_id)
);
create index if not exists service_reviews_svc on public.service_reviews(service_id, created_at desc);
alter table public.service_reviews enable row level security;
drop policy if exists "reviews read" on public.service_reviews;
create policy "reviews read" on public.service_reviews for select using (true);
drop policy if exists "reviews insert own" on public.service_reviews;
create policy "reviews insert own" on public.service_reviews for insert with check (user_id = auth.uid());
drop policy if exists "reviews update own" on public.service_reviews;
create policy "reviews update own" on public.service_reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "reviews delete own or admin" on public.service_reviews;
create policy "reviews delete own or admin" on public.service_reviews for delete using (user_id = auth.uid() or public.is_admin());

create or replace function public.service_rating_sync() returns trigger language plpgsql security definer set search_path = public as $$
declare sid bigint := coalesce(new.service_id, old.service_id);
begin
  update public.services s set rating_count = x.c, rating_avg = coalesce(round(x.a, 1), 0)
  from (select count(*) c, avg(rating) a from public.service_reviews where service_id = sid) x where s.id = sid;
  return null;
end $$;
revoke execute on function public.service_rating_sync() from public, anon, authenticated;
drop trigger if exists service_reviews_sync on public.service_reviews;
create trigger service_reviews_sync after insert or update or delete on public.service_reviews for each row execute function public.service_rating_sync();

-- আগের দর্শনীয় স্থানগুলোর ধরন
update public.services set subtype = case
  when name ~ 'রিসোর্ট' then 'resort' when name ~ 'পার্ক' then 'park'
  when name ~ 'উদ্যান|বন|কুমির' then 'nature' else 'other' end
where category = 'tour' and subtype is null;
