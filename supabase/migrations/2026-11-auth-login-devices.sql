-- ইমেইল / মোবাইল / ইউজারনেম দিয়ে লগইন, ডিভাইসের তালিকা, নতুন ডিভাইসে লগইনের নোটিফিকেশন
create table if not exists public.login_attempts (ident text not null, at timestamptz not null default now());
create index if not exists login_attempts_ident_at on public.login_attempts (ident, at);
alter table public.login_attempts enable row level security;

-- পাসওয়ার্ড মিললে তবেই ইমেইল ফেরত দেয়; ১৫ মিনিটে ৮ বার ভুল হলে আটকায়
create or replace function public.login_lookup(p_ident text, p_pw text) returns text
language plpgsql security definer set search_path = public, extensions, auth as $$
declare k text := lower(btrim(coalesce(p_ident, ''))); ph text; em text; n int;
begin
  if length(k) < 3 or length(coalesce(p_pw, '')) < 6 then return null; end if;
  select count(*) into n from public.login_attempts where ident = k and at > now() - interval '15 minutes';
  if n >= 8 then raise exception 'too_many_attempts'; end if;
  ph := regexp_replace(translate(k, '০১২৩৪৫৬৭৮৯', '0123456789'), '\D', '', 'g');
  if ph like '8801%' then ph := substr(ph, 3); end if;
  select u.email into em from auth.users u
   where u.encrypted_password is not null and u.encrypted_password <> ''
     and (u.id in (select p.id from public.profiles p where lower(p.username) = ltrim(k, '@'))
          or (ph ~ '^01[3-9][0-9]{8}$' and u.id in (select q.user_id from public.profile_private q
                where right(regexp_replace(translate(coalesce(q.phone, ''), '০১২৩৪৫৬৭৮৯', '0123456789'), '\D', '', 'g'), 11) = ph)))
     and u.encrypted_password = extensions.crypt(p_pw, u.encrypted_password)
   order by u.last_sign_in_at desc nulls last limit 1;
  if em is null then
    insert into public.login_attempts (ident) values (k);
    delete from public.login_attempts where at < now() - interval '1 day';
  end if;
  return em;
end $$;
revoke all on function public.login_lookup(text, text) from public;
grant execute on function public.login_lookup(text, text) to anon, authenticated;

create or replace function public.my_sessions() returns table (id uuid, created_at timestamptz, last_at timestamptz, user_agent text, current boolean)
language sql stable security definer set search_path = public, auth as $$
  select s.id, s.created_at, coalesce(s.refreshed_at at time zone 'UTC', s.updated_at, s.created_at), coalesce(s.user_agent, ''),
         s.id::text = coalesce(auth.jwt() ->> 'session_id', '')
    from auth.sessions s where s.user_id = auth.uid() order by 3 desc nulls last limit 30 $$;
revoke all on function public.my_sessions() from public;
grant execute on function public.my_sessions() to authenticated;

create or replace function public.end_session(p_id uuid) returns void
language sql security definer set search_path = public, auth as $$
  delete from auth.sessions where id = p_id and user_id = auth.uid() and id::text <> coalesce(auth.jwt() ->> 'session_id', '') $$;
revoke all on function public.end_session(uuid) from public;
grant execute on function public.end_session(uuid) to authenticated;

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type = any (array['like','comment','share','tag','friend_request','friend_accept','follow','group_request','group_approved','reply','mention','verify_ok','verify_no','boost_ok','boost_no','milestone','follower_milestone','weekly','page_admin','event_reminder','blood_request','chat_mention','chat_join_request','chat_join_ok','birthday','friend_anniv','announce','area_alert','login_alert']));

create table if not exists public.known_devices (user_id uuid not null references public.profiles(id) on delete cascade, ua_hash text not null, first_at timestamptz not null default now(), primary key (user_id, ua_hash));
alter table public.known_devices enable row level security;

create or replace function public.on_new_session() returns trigger
language plpgsql security definer set search_path = public, extensions, auth as $$
declare h text := md5(coalesce(new.user_agent, '')); first boolean;
begin
  if not exists (select 1 from public.profiles where id = new.user_id) then return new; end if;
  select not exists (select 1 from public.known_devices where user_id = new.user_id) into first;
  insert into public.known_devices (user_id, ua_hash) values (new.user_id, h) on conflict do nothing;
  if found and not first then
    insert into public.notifications (user_id, actor_id, type, meta)
    values (new.user_id, new.user_id, 'login_alert', jsonb_build_object('ua', left(coalesce(new.user_agent, ''), 300), 'at', now()));
  end if;
  return new;
exception when others then return new;
end $$;
drop trigger if exists on_auth_session_created on auth.sessions;
create trigger on_auth_session_created after insert on auth.sessions for each row execute function public.on_new_session();
