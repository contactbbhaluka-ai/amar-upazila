-- পুশ নোটিফিকেশন (Android, FCM): অ্যাপ বন্ধ থাকলেও ফোনে নোটিফিকেশন
-- ট্রিগার নতুন নোটিফিকেশন/মেসেজে pg_net দিয়ে এজ ফাংশন send-push ডাকে (supabase/functions/send-push)
create table if not exists public.push_tokens (
  token text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null default 'android',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists push_tokens_user on public.push_tokens (user_id);
alter table public.push_tokens enable row level security;
drop policy if exists "push own read" on public.push_tokens;
create policy "push own read" on public.push_tokens for select using (user_id = auth.uid());

create or replace function public.register_push(p_token text, p_platform text default 'android') returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or length(coalesce(p_token, '')) < 20 or length(p_token) > 4096 then return; end if;
  insert into public.push_tokens (token, user_id, platform) values (p_token, auth.uid(), left(coalesce(p_platform, 'android'), 20))
  on conflict (token) do update set user_id = excluded.user_id, platform = excluded.platform, updated_at = now();
  delete from public.push_tokens where user_id = auth.uid() and token not in (select token from public.push_tokens where user_id = auth.uid() order by updated_at desc limit 10);
end $$;
create or replace function public.unregister_push(p_token text) returns void
language sql security definer set search_path = public as $$
  delete from public.push_tokens where token = p_token and (user_id = auth.uid() or auth.uid() is null) $$;
revoke all on function public.register_push(text, text) from public;
revoke all on function public.unregister_push(text) from public;
grant execute on function public.register_push(text, text) to authenticated;
grant execute on function public.unregister_push(text) to authenticated, anon;

create table if not exists private.push_cfg (id int primary key default 1 check (id = 1), url text not null, secret text not null);
insert into private.push_cfg (id, url, secret) values (1, 'https://iudrayavoselywnlwdrh.supabase.co/functions/v1/send-push', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
on conflict (id) do nothing;
create table if not exists private.push_log (user_id uuid not null, k text not null, at timestamptz not null default now());
create index if not exists push_log_k on private.push_log (user_id, k, at);

create or replace function public.push_secret_ok(p text) returns boolean
language sql stable security definer set search_path = public, private as $$
  select exists (select 1 from private.push_cfg where id = 1 and secret = p) $$;
revoke all on function public.push_secret_ok(text) from public, anon, authenticated;
grant execute on function public.push_secret_ok(text) to service_role;

create or replace function private.push_send(p jsonb) returns void
language plpgsql security definer set search_path = public, private as $$
declare c record;
begin
  select * into c from private.push_cfg where id = 1; if c is null then return; end if;
  perform net.http_post(url := c.url, body := p, headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', c.secret), timeout_milliseconds := 8000);
exception when others then null;
end $$;

create or replace function private.on_notif_push() returns trigger
language plpgsql security definer set search_path = public, private as $$
declare v_k text := new.type || ':' || coalesce(new.actor_id::text, '') || ':' || coalesce(new.post_id::text, '') || ':' || coalesce(new.group_id::text, '');
begin
  if not exists (select 1 from public.push_tokens t where t.user_id = new.user_id) then return null; end if;
  if new.type not in ('comment', 'reply', 'announce', 'blood_request', 'login_alert', 'area_alert')
     and exists (select 1 from private.push_log l where l.user_id = new.user_id and l.k = v_k and l.at > now() - interval '10 minutes') then return null; end if;
  insert into private.push_log (user_id, k) values (new.user_id, v_k);
  delete from private.push_log l where l.at < now() - interval '1 day';
  perform private.push_send(jsonb_build_object('kind', 'notif', 'id', new.id));
  return null;
exception when others then return null;
end $$;
drop trigger if exists notif_push on public.notifications;
create trigger notif_push after insert on public.notifications for each row execute function private.on_notif_push();

create or replace function private.on_message_push() returns trigger
language plpgsql security definer set search_path = public, private as $$
begin
  if new.is_auto or new.deleted_at is not null or new.page_id is not null then return null; end if;
  if new.chat_id is null and (new.recipient_id is null or not exists (select 1 from public.push_tokens t where t.user_id = new.recipient_id)) then return null; end if;
  perform private.push_send(jsonb_build_object('kind', 'msg', 'id', new.id));
  return null;
exception when others then return null;
end $$;
drop trigger if exists message_push on public.messages;
create trigger message_push after insert on public.messages for each row execute function private.on_message_push();
