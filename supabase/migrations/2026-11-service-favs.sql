-- সেবা ডিরেক্টরি: প্রিয় সেবা ও কতবার কল হয়েছে (জনপ্রিয় সেবা দেখাতে)
alter table public.services add column if not exists call_count int not null default 0;
create table if not exists public.service_favs (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  service_id bigint not null references public.services(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, service_id)
);
alter table public.service_favs enable row level security;
drop policy if exists "svcfav read" on public.service_favs;
drop policy if exists "svcfav insert" on public.service_favs;
drop policy if exists "svcfav delete" on public.service_favs;
create policy "svcfav read" on public.service_favs for select using (user_id = auth.uid());
create policy "svcfav insert" on public.service_favs for insert to authenticated with check (user_id = auth.uid());
create policy "svcfav delete" on public.service_favs for delete using (user_id = auth.uid());
-- কল বাটনে চাপলে গোনা (শুধু সংখ্যা বাড়ে, আর কিছু বদলানো যায় না)
create or replace function public.service_called(sid bigint) returns void
language sql security definer set search_path = public as $$
  update public.services set call_count = call_count + 1 where id = sid;
$$;
revoke all on function public.service_called(bigint) from public;
grant execute on function public.service_called(bigint) to anon, authenticated;
