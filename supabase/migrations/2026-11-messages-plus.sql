-- =====================================================================
--  মেসেজ (বড় আপডেট): ছবি, ভয়েস, উত্তর, মুছে ফেলা, রিয়্যাক্ট, দেখেছেন,
--  মেসেজ রিকোয়েস্ট, মিউট/চ্যাট মুছা, অনলাইন চিহ্ন, গ্রুপ চ্যাট
-- =====================================================================

-- ---------- গ্রুপ চ্যাট
create table if not exists public.chats (
  id bigserial primary key,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists public.chat_members (
  chat_id bigint not null references public.chats(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  last_read_at timestamptz not null default now(),
  primary key (chat_id, user_id)
);
create index if not exists chat_members_user_idx on public.chat_members (user_id);

create or replace function private.is_chat_member(p_chat bigint, u uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.chat_members where chat_id = p_chat and user_id = u);
$$;
create or replace function private.is_chat_admin(p_chat bigint, u uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.chat_members where chat_id = p_chat and user_id = u and role = 'admin');
$$;

alter table public.chats enable row level security;
alter table public.chat_members enable row level security;
drop policy if exists "chats read" on public.chats;
create policy "chats read" on public.chats for select using (private.is_chat_member(id, auth.uid()));
drop policy if exists "chat members read" on public.chat_members;
create policy "chat members read" on public.chat_members for select using (private.is_chat_member(chat_id, auth.uid()));
-- পরিবর্তন শুধু নিচের ফাংশন দিয়ে

-- ---------- মেসেজের নতুন কলাম
alter table public.messages alter column recipient_id drop not null;
alter table public.messages add column if not exists chat_id bigint references public.chats(id) on delete cascade;
alter table public.messages add column if not exists image_path text;
alter table public.messages add column if not exists voice_path text;
alter table public.messages add column if not exists voice_secs smallint check (voice_secs is null or voice_secs between 1 and 180);
alter table public.messages add column if not exists reply_to bigint references public.messages(id) on delete set null;
alter table public.messages add column if not exists deleted_at timestamptz;
create index if not exists messages_chat_idx on public.messages (chat_id, created_at) where chat_id is not null;

alter table public.messages drop constraint if exists messages_body_check;
alter table public.messages add constraint messages_body_check check (char_length(body) <= 2000
  and (char_length(body) >= 1 or image_path is not null or voice_path is not null or deleted_at is not null));
alter table public.messages drop constraint if exists messages_target_check;
alter table public.messages add constraint messages_target_check check ((chat_id is null) = (recipient_id is not null));
alter table public.messages drop constraint if exists messages_paths_check;
alter table public.messages add constraint messages_paths_check check (
  (image_path is null or char_length(image_path) <= 200) and (voice_path is null or char_length(voice_path) <= 200));

drop policy if exists "messages read" on public.messages;
create policy "messages read" on public.messages for select using (
  auth.uid() = sender_id or auth.uid() = recipient_id
  or (page_id is not null and private.is_page_staff(page_id, auth.uid()))
  or (chat_id is not null and private.is_chat_member(chat_id, auth.uid())));

drop policy if exists "messages send" on public.messages;
create policy "messages send" on public.messages for insert with check (
  sender_id = auth.uid() and read_at is null and is_auto = false and deleted_at is null and (
    (chat_id is null and recipient_id is not null and not is_blocked(sender_id, recipient_id)
      and (page_id is null or private.is_page_staff(page_id, sender_id)
           or exists (select 1 from public.pages pg where pg.id = messages.page_id and pg.owner_id = messages.recipient_id)))
    or (chat_id is not null and recipient_id is null and page_id is null and private.is_chat_member(chat_id, auth.uid()))
  ));

-- নিজের পাঠানো মেসেজ সবার জন্য মুছে ফেলা (লেখা/ছবি/ভয়েস মুছে যায়, "মুছে ফেলা হয়েছে" থাকে)
create or replace function public.unsend_message(p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.messages set deleted_at = now(), body = '', image_path = null, voice_path = null, voice_secs = null
   where id = p_id and sender_id = auth.uid() and deleted_at is null;
  if not found then raise exception 'not allowed'; end if;
  delete from public.message_reactions where message_id = p_id;
end $$;

-- ---------- রিয়্যাক্ট
create table if not exists public.message_reactions (
  message_id bigint not null references public.messages(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  emoji text not null check (emoji in ('❤️','😂','😮','😢','😡','👍')),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);
alter table public.message_reactions enable row level security;
drop policy if exists "msg rx read" on public.message_reactions;
create policy "msg rx read" on public.message_reactions for select using (exists (select 1 from public.messages m where m.id = message_id));
drop policy if exists "msg rx write" on public.message_reactions;
create policy "msg rx write" on public.message_reactions for insert with check (user_id = auth.uid() and exists (select 1 from public.messages m where m.id = message_id and m.deleted_at is null));
drop policy if exists "msg rx update" on public.message_reactions;
create policy "msg rx update" on public.message_reactions for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "msg rx delete" on public.message_reactions;
create policy "msg rx delete" on public.message_reactions for delete using (user_id = auth.uid());

-- ---------- শুধু নিজের জন্য মুছা
create table if not exists public.message_hidden (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  message_id bigint not null references public.messages(id) on delete cascade,
  primary key (user_id, message_id)
);
alter table public.message_hidden enable row level security;
drop policy if exists "msg hidden own" on public.message_hidden;
create policy "msg hidden own" on public.message_hidden for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- কথোপকথনের সেটিং: মিউট, রিকোয়েস্ট গ্রহণ, চ্যাট মুছা
-- key: 'u:<partner>' (সাধারণ), 'p:<page>:<partner>' (পেইজ), 'g:<chat>' (গ্রুপ)
create table if not exists public.conv_settings (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  key text not null check (char_length(key) <= 100),
  muted boolean not null default false,
  accepted boolean not null default false,
  cleared_at timestamptz,
  primary key (user_id, key)
);
alter table public.conv_settings enable row level security;
drop policy if exists "conv settings own" on public.conv_settings;
create policy "conv settings own" on public.conv_settings for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- অনলাইন চিহ্ন (আলাদা টেবিল, সরাসরি পড়া যায় না)
create table if not exists public.presence (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  last_seen timestamptz not null default now(),
  show_active boolean not null default true
);
alter table public.presence enable row level security;

create or replace function public.touch_presence()
returns void language sql security definer set search_path = public as $$
  insert into public.presence(user_id, last_seen) select auth.uid(), now() where auth.uid() is not null
  on conflict (user_id) do update set last_seen = now();
$$;
create or replace function public.set_show_active(p_on boolean)
returns void language sql security definer set search_path = public as $$
  insert into public.presence(user_id, show_active) select auth.uid(), p_on where auth.uid() is not null
  on conflict (user_id) do update set show_active = p_on;
$$;
create or replace function public.my_show_active()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select show_active from public.presence where user_id = auth.uid()), true);
$$;
-- শুধু বন্ধু বা যাদের সঙ্গে কথা হয়েছে; দুজনেরই "সক্রিয় দেখান" চালু থাকতে হবে
create or replace function public.presence_of(p_ids uuid[])
returns table(user_id uuid, last_seen timestamptz)
language sql stable security definer set search_path = public as $$
  select pr.user_id, pr.last_seen from public.presence pr
   where pr.user_id = any(p_ids[1:200]) and pr.show_active and pr.user_id <> auth.uid()
     and public.my_show_active()
     and not private.is_blocked(auth.uid(), pr.user_id)
     and (private.are_friends(auth.uid(), pr.user_id)
          or exists (select 1 from public.messages m where (m.sender_id = auth.uid() and m.recipient_id = pr.user_id) or (m.sender_id = pr.user_id and m.recipient_id = auth.uid()))
          or exists (select 1 from public.chat_members a join public.chat_members b on a.chat_id = b.chat_id where a.user_id = auth.uid() and b.user_id = pr.user_id));
$$;

-- ---------- গ্রুপ চ্যাটের কাজ
create or replace function public.create_chat(p_name text, p_members uuid[])
returns bigint language plpgsql security definer set search_path = public as $$
declare cid bigint; u uuid;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  if cardinality(p_members) < 1 or cardinality(p_members) > 49 then raise exception 'members 1-49'; end if;
  insert into public.chats(name, created_by) values (btrim(p_name), auth.uid()) returning id into cid;
  insert into public.chat_members(chat_id, user_id, role) values (cid, auth.uid(), 'admin');
  foreach u in array p_members loop
    if u <> auth.uid() and private.are_friends(auth.uid(), u) and not private.is_blocked(auth.uid(), u) then
      insert into public.chat_members(chat_id, user_id) values (cid, u) on conflict do nothing;
    end if;
  end loop;
  return cid;
end $$;

create or replace function public.add_chat_members(p_chat bigint, p_members uuid[])
returns void language plpgsql security definer set search_path = public as $$
declare u uuid;
begin
  if not private.is_chat_member(p_chat, auth.uid()) then raise exception 'not allowed'; end if;
  if (select count(*) from public.chat_members where chat_id = p_chat) + cardinality(p_members) > 50 then raise exception 'members max 50'; end if;
  foreach u in array p_members loop
    if private.are_friends(auth.uid(), u) and not private.is_blocked(auth.uid(), u) then
      insert into public.chat_members(chat_id, user_id) values (p_chat, u) on conflict do nothing;
    end if;
  end loop;
end $$;

create or replace function public.remove_chat_member(p_chat bigint, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_user <> auth.uid() and not private.is_chat_admin(p_chat, auth.uid()) then raise exception 'not allowed'; end if;
  delete from public.chat_members where chat_id = p_chat and user_id = p_user;
  -- কেউ না থাকলে গ্রুপ মুছে যায়; অ্যাডমিন না থাকলে সবচেয়ে পুরোনো সদস্য অ্যাডমিন
  if not exists (select 1 from public.chat_members where chat_id = p_chat) then delete from public.chats where id = p_chat; return; end if;
  if not exists (select 1 from public.chat_members where chat_id = p_chat and role = 'admin') then
    update public.chat_members set role = 'admin' where chat_id = p_chat and user_id = (select user_id from public.chat_members where chat_id = p_chat order by joined_at limit 1);
  end if;
end $$;

create or replace function public.rename_chat(p_chat bigint, p_name text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not private.is_chat_member(p_chat, auth.uid()) then raise exception 'not allowed'; end if;
  update public.chats set name = btrim(p_name) where id = p_chat;
end $$;

create or replace function public.mark_chat_read(p_chat bigint)
returns void language sql security definer set search_path = public as $$
  update public.chat_members set last_read_at = now() where chat_id = p_chat and user_id = auth.uid();
$$;

-- ---------- ইনবক্স: সাধারণ, পেইজ ও গ্রুপ কথোপকথন একসাথে
create or replace function private.msg_label(body text, img text, voice text, del timestamptz)
returns text language sql immutable as $$
  select case when del is not null then '🚫 মেসেজটি মুছে ফেলা হয়েছে'
              when voice is not null then '🎤 ভয়েস মেসেজ'
              when img is not null and coalesce(body, '') = '' then '📷 ছবি'
              when img is not null then '📷 ' || body
              else body end;
$$;

create or replace function public.my_conversations()
returns table(partner_id uuid, page_id bigint, as_page boolean, page_name text, name text, avatar_url text, last_body text, last_at timestamptz, last_mine boolean, unread bigint)
language sql stable security definer set search_path = public as $$
  with mp as (select id from public.pages where owner_id = auth.uid() union select page_id from public.page_admins where user_id = auth.uid()),
  m as (
    select case when x.page_id in (select id from mp) then (case when private.is_page_staff(x.page_id, x.sender_id) then x.recipient_id else x.sender_id end)
                when x.page_id is not null then (select owner_id from public.pages where id = x.page_id)
                when x.sender_id = auth.uid() then x.recipient_id else x.sender_id end as partner,
           x.page_id, private.msg_label(x.body, x.image_path, x.voice_path, x.deleted_at) body, x.created_at,
           case when x.page_id in (select id from mp) then private.is_page_staff(x.page_id, x.sender_id) else x.sender_id = auth.uid() end as mine,
           case when x.page_id in (select id from mp) then not private.is_page_staff(x.page_id, x.sender_id) and x.read_at is null
                else x.recipient_id = auth.uid() and x.read_at is null end as un
      from public.messages x
     where x.chat_id is null and (auth.uid() in (x.sender_id, x.recipient_id) or x.page_id in (select id from mp))
       and not exists (select 1 from public.message_hidden h where h.user_id = auth.uid() and h.message_id = x.id)
  ), last as (
    select distinct on (partner, coalesce(page_id, 0)) partner, page_id, body, created_at, mine from m where partner is not null order by partner, coalesce(page_id, 0), created_at desc
  )
  select l.partner, l.page_id, coalesce(l.page_id in (select id from mp), false), pg.name,
         case when l.page_id is not null and l.page_id not in (select id from mp) then pg.name else p.name end,
         case when l.page_id is not null and l.page_id not in (select id from mp) then pg.avatar_url else p.avatar_url end,
         l.body, l.created_at, l.mine,
         (select count(*) from m where m.partner = l.partner and m.page_id is not distinct from l.page_id and m.un)
    from last l join public.profiles p on p.id = l.partner left join public.pages pg on pg.id = l.page_id
   order by l.created_at desc;
$$;

create or replace function public.my_inbox()
returns table(kind text, partner_id uuid, page_id bigint, chat_id bigint, as_page boolean, page_name text, name text, avatar_url text,
              last_body text, last_at timestamptz, last_mine boolean, unread bigint, muted boolean, request boolean, members int)
language sql stable security definer set search_path = public as $$
  with st as (select key, muted, accepted, cleared_at from public.conv_settings where user_id = auth.uid()),
  dm as (
    select c.*, case when c.page_id is null then 'u:' || c.partner_id else 'p:' || c.page_id || ':' || c.partner_id end k
      from public.my_conversations() c
  ), grp as (
    select c.id, c.name, c.created_at, cm.last_read_at,
           (select count(*) from public.chat_members x where x.chat_id = c.id)::int n
      from public.chat_members cm join public.chats c on c.id = cm.chat_id where cm.user_id = auth.uid()
  )
  select case when d.page_id is null then 'dm' else 'page' end, d.partner_id, d.page_id, null::bigint, d.as_page, d.page_name, d.name, d.avatar_url,
         d.last_body, d.last_at, d.last_mine, d.unread, coalesce(s.muted, false),
         d.page_id is null and not coalesce(s.accepted, false) and not private.are_friends(auth.uid(), d.partner_id)
           and not exists (select 1 from public.messages mm where mm.sender_id = auth.uid() and mm.recipient_id = d.partner_id and mm.page_id is null),
         2
    from dm d left join st s on s.key = d.k
   where s.cleared_at is null or d.last_at > s.cleared_at
  union all
  select 'group', null, null, g.id, false, null, g.name, null,
         coalesce(private.msg_label(lm.body, lm.image_path, lm.voice_path, lm.deleted_at), 'গ্রুপ তৈরি হয়েছে'),
         coalesce(lm.created_at, g.created_at), coalesce(lm.sender_id = auth.uid(), false),
         (select count(*) from public.messages m where m.chat_id = g.id and m.sender_id <> auth.uid() and m.created_at > g.last_read_at
             and not exists (select 1 from public.message_hidden h where h.user_id = auth.uid() and h.message_id = m.id)),
         coalesce(s.muted, false), false, g.n
    from grp g
    left join lateral (select body, image_path, voice_path, deleted_at, created_at, sender_id from public.messages m
                        where m.chat_id = g.id and not exists (select 1 from public.message_hidden h where h.user_id = auth.uid() and h.message_id = m.id)
                        order by created_at desc limit 1) lm on true
    left join st s on s.key = 'g:' || g.id
   where s.cleared_at is null or coalesce(lm.created_at, g.created_at) > s.cleared_at
  order by 10 desc;
$$;

-- ব্যাজে শুধু সাধারণ ইনবক্সের না-পড়া (মিউট আর রিকোয়েস্ট বাদ)
create or replace function public.my_unread()
returns bigint language sql stable security definer set search_path = public as $$
  select coalesce(sum(unread), 0)::bigint from public.my_inbox() where not as_page and not muted and not request;
$$;

-- ---------- ছবি ও ভয়েসের জন্য প্রাইভেট স্টোরেজ
-- ফোল্ডার: d_<ছোট-uuid>_<বড়-uuid> (দুজনের চ্যাট), p_<page>_<user> (পেইজ), g_<chat> (গ্রুপ)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat', 'chat', false, 3145728, array['image/webp','image/jpeg','image/png','audio/webm','audio/ogg','audio/mp4','audio/mpeg','audio/aac'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create or replace function private.chat_path_ok(p_name text)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare f text := split_part(p_name, '/', 1); parts text[];
begin
  if auth.uid() is null then return false; end if;
  if f like 'd\_%' then
    parts := string_to_array(substr(f, 3), '_');
    return array_length(parts, 1) = 2 and auth.uid()::text in (parts[1], parts[2]);
  elsif f like 'p\_%' then
    parts := string_to_array(substr(f, 3), '_');
    return array_length(parts, 1) = 2 and (auth.uid()::text = parts[2] or private.is_page_staff(parts[1]::bigint, auth.uid()));
  elsif f like 'g\_%' then
    return private.is_chat_member(substr(f, 3)::bigint, auth.uid());
  end if;
  return false;
exception when others then return false;
end $$;

drop policy if exists "chat files read" on storage.objects;
create policy "chat files read" on storage.objects for select using (bucket_id = 'chat' and private.chat_path_ok(name));
drop policy if exists "chat files upload" on storage.objects;
create policy "chat files upload" on storage.objects for insert with check (bucket_id = 'chat' and private.chat_path_ok(name));
drop policy if exists "chat files delete own" on storage.objects;
create policy "chat files delete own" on storage.objects for delete using (bucket_id = 'chat' and owner = auth.uid());

-- রিয়েলটাইম: রিয়্যাক্ট বদলালেও চ্যাট হালনাগাদ
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'message_reactions') then
    alter publication supabase_realtime add table public.message_reactions;
  end if;
end $$;
