-- =====================================================================
--  অ্যাকাউন্ট মুছে ফেলা: অনুরোধের ৩০ দিন পর স্থায়ীভাবে মুছে যায়;
--  এর মধ্যে আবার লগইন করলে অনুরোধ বাতিল
-- =====================================================================
alter table public.profiles add column if not exists delete_requested_at timestamptz;

create or replace function public.request_account_deletion()
returns timestamptz language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  update public.profiles set delete_requested_at = now() where id = auth.uid();
  return now() + interval '30 days';
end $$;

create or replace function public.cancel_account_deletion()
returns boolean language plpgsql security definer set search_path = public as $$
declare was boolean;
begin
  select delete_requested_at is not null into was from public.profiles where id = auth.uid();
  update public.profiles set delete_requested_at = null where id = auth.uid() and delete_requested_at is not null;
  return coalesce(was, false);
end $$;
revoke all on function public.request_account_deletion() from public, anon;
revoke all on function public.cancel_account_deletion() from public, anon;
grant execute on function public.request_account_deletion() to authenticated;
grant execute on function public.cancel_account_deletion() to authenticated;

-- প্রতিদিন: ৩০ দিন পেরোনো অনুরোধের অ্যাকাউন্ট মুছে ফেলা (প্রোফাইল, পোস্ট, মেসেজ সব সাথে মুছে যায়)
create or replace function private.purge_deleted_accounts()
returns void language sql security definer set search_path = public as $$
  delete from auth.users where id in (select id from public.profiles where delete_requested_at < now() - interval '30 days');
$$;
select cron.unschedule('purge-deleted-accounts') where exists (select 1 from cron.job where jobname = 'purge-deleted-accounts');
select cron.schedule('purge-deleted-accounts', '23 3 * * *', 'select private.purge_deleted_accounts()');
