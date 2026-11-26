-- সেবা ডিরেক্টরি: কোন ক্যাটাগরি কতবার খোলা হয়েছে ("জনপ্রিয় ক্যাটাগরি" দেখাতে; কে খুলেছে তা রাখা হয় না)
create table if not exists public.service_cat_visits (
  category   text primary key check (category ~ '^[a-z]{2,20}$'),
  visits     bigint not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.service_cat_visits enable row level security;
drop policy if exists "svc cat visits read" on public.service_cat_visits;
create policy "svc cat visits read" on public.service_cat_visits for select using (true);
create or replace function public.svc_cat_visit(c text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if c !~ '^[a-z]{2,20}$' then return; end if;
  insert into public.service_cat_visits (category, visits) values (c, 1)
  on conflict (category) do update set visits = service_cat_visits.visits + 1, updated_at = now();
end $$;
revoke all on function public.svc_cat_visit(text) from public;
grant execute on function public.svc_cat_visit(text) to anon, authenticated;
