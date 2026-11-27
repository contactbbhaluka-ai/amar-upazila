-- হাট বাজার: হাট বন্ধ/দিন বদলের নোটিশ ও আজকের দাম
create table if not exists public.hat_notices (
  id bigint generated always as identity primary key,
  service_id bigint not null references public.services(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('closed','moved')),
  on_date date not null,
  new_date date,
  note text check (char_length(note) <= 200),
  created_at timestamptz not null default now(),
  check (kind = 'closed' or new_date is not null)
);
create index if not exists hat_notices_svc on public.hat_notices(service_id, on_date);
alter table public.hat_notices enable row level security;
drop policy if exists "hat notices read" on public.hat_notices;
create policy "hat notices read" on public.hat_notices for select using (true);
drop policy if exists "hat notices insert own" on public.hat_notices;
create policy "hat notices insert own" on public.hat_notices for insert to authenticated
  with check (user_id = auth.uid() and on_date >= (now() at time zone 'Asia/Dhaka')::date and on_date <= (now() at time zone 'Asia/Dhaka')::date + 60);
drop policy if exists "hat notices delete own or admin" on public.hat_notices;
create policy "hat notices delete own or admin" on public.hat_notices for delete using (user_id = auth.uid() or public.is_admin());
create or replace function public.hat_notice_limit() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from hat_notices where user_id = new.user_id and created_at > now() - interval '1 day') >= 5 then
    raise exception 'দিনে সর্বোচ্চ ৫টি নোটিশ দেওয়া যায়' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists hat_notices_limit on public.hat_notices;
create trigger hat_notices_limit before insert on public.hat_notices for each row execute function public.hat_notice_limit();

create table if not exists public.hat_prices (
  id bigint generated always as identity primary key,
  service_id bigint not null references public.services(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  item text not null check (item in ('rice_coarse','rice_fine','paddy','potato','onion','garlic','chili','lentil','oil','egg','broiler','rui','beef')),
  price numeric(10,2) not null check (price > 0 and price < 1000000),
  created_at timestamptz not null default now()
);
create index if not exists hat_prices_svc on public.hat_prices(service_id, created_at desc);
create index if not exists hat_prices_time on public.hat_prices(created_at desc);
alter table public.hat_prices enable row level security;
drop policy if exists "hat prices read" on public.hat_prices;
create policy "hat prices read" on public.hat_prices for select using (true);
drop policy if exists "hat prices delete own or admin" on public.hat_prices;
create policy "hat prices delete own or admin" on public.hat_prices for delete using (user_id = auth.uid() or public.is_admin());
-- দাম জমা শুধু এই ফাংশন দিয়ে: যাচাই, একই জিনিস ৩ ঘণ্টায় একবার, দিনে প্রথম ৩ বার জমায় ২ কয়েন করে
alter table public.coin_ledger drop constraint if exists coin_ledger_reason_check;
alter table public.coin_ledger add constraint coin_ledger_reason_check check (reason in ('post','comment','like','share','badge','boost','refund','admin','quiz','price'));
create or replace function public.hat_price_add(p_service bigint, p_items jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); d date := (now() at time zone 'Asia/Dhaka')::date; it jsonb; n int := 0; done int; coins int := 0; pr numeric;
begin
  if uid is null then raise exception 'লগইন করুন'; end if;
  if not exists (select 1 from services where id = p_service and category = 'shop' and verified) then raise exception 'হাট পাওয়া যায়নি'; end if;
  for it in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) limit 20 loop
    pr := nullif(it->>'price', '')::numeric;
    continue when pr is null or pr <= 0 or pr >= 1000000;
    continue when (it->>'item') not in ('rice_coarse','rice_fine','paddy','potato','onion','garlic','chili','lentil','oil','egg','broiler','rui','beef');
    continue when exists (select 1 from hat_prices where user_id = uid and service_id = p_service and item = it->>'item' and created_at > now() - interval '3 hours');
    insert into hat_prices (service_id, user_id, item, price) values (p_service, uid, it->>'item', round(pr, 2));
    n := n + 1;
  end loop;
  if n > 0 then
    select count(*) into done from coin_ledger where user_id = uid and reason = 'price' and created_at >= (d::timestamp at time zone 'Asia/Dhaka');
    if done < 3 and private.add_coins(uid, 2, 'price', 'price:' || p_service || ':' || extract(epoch from now())::bigint) then coins := 2; end if;
  end if;
  return jsonb_build_object('saved', n, 'coins', coins);
end $$;
revoke all on function public.hat_price_add(bigint, jsonb) from public, anon;
grant execute on function public.hat_price_add(bigint, jsonb) to authenticated;
