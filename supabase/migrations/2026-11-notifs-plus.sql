-- =====================================================================
--  নোটিফিকেশন (২): না-পড়া করা, পোস্টের নোটিফিকেশন বন্ধ, কোন ধরন পাবেন তার সেটিং,
--  ৬০ দিনের পুরোনো নোটিফিকেশন নিজে থেকে মুছে যাওয়া
-- =====================================================================
-- একটা নোটিফিকেশন আবার "না পড়া" করা (শুধু নিজেরটা)
create or replace function public.mark_notification_unread(p_id bigint)
returns void language sql security definer set search_path = public as $$
  update public.notifications set read = false where id = p_id and user_id = auth.uid();
$$;

-- কোন পোস্টের নোটিফিকেশন বন্ধ
create table if not exists public.notif_mutes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id bigint not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
alter table public.notif_mutes enable row level security;
drop policy if exists "notif mutes own" on public.notif_mutes;
create policy "notif mutes own" on public.notif_mutes for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- কোন ধরনের নোটিফিকেশন বন্ধ রাখা (off = বন্ধ ধরনগুলোর তালিকা)
create table if not exists public.notif_prefs (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  off text[] not null default '{}' check (cardinality(off) <= 40),
  updated_at timestamptz not null default now()
);
alter table public.notif_prefs enable row level security;
drop policy if exists "notif prefs own" on public.notif_prefs;
create policy "notif prefs own" on public.notif_prefs for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- নোটিফিকেশন তৈরির আগে: বন্ধ করা ধরন বা বন্ধ করা পোস্ট হলে তৈরিই হবে না
create or replace function private.notif_filter()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.notif_prefs p where p.user_id = new.user_id and new.type = any (p.off)) then return null; end if;
  if new.post_id is not null and exists (select 1 from public.notif_mutes m where m.user_id = new.user_id and m.post_id = new.post_id) then return null; end if;
  return new;
end $$;
drop trigger if exists notif_filter on public.notifications;
create trigger notif_filter before insert on public.notifications for each row execute function private.notif_filter();

-- ৬০ দিনের পুরোনো নোটিফিকেশন মুছে ফেলা (প্রতিদিন রাত ৩টা ১৭ মিনিটে, ঢাকা সময়ে ৯টা ১৭)
create or replace function private.purge_notifications()
returns void language sql security definer set search_path = public as $$
  delete from public.notifications where created_at < now() - interval '60 days';
$$;
select cron.unschedule('purge-notifications') where exists (select 1 from cron.job where jobname = 'purge-notifications');
select cron.schedule('purge-notifications', '17 3 * * *', 'select private.purge_notifications()');
