-- =====================================================================
--  মেসেজ (২): এডিট, ফরওয়ার্ড, পিন ও সেভ, গ্রুপে @উল্লেখ, গ্রুপ পোল,
--  গ্রুপের ছবি ও বিবরণ, চ্যাটের থিম ও ডাকনাম, স্টিকার, লোকেশন,
--  ২৪ ঘণ্টায় মুছে যাওয়া মেসেজ
-- =====================================================================
alter table public.messages add column if not exists edited_at timestamptz;
alter table public.messages add column if not exists forwarded boolean not null default false;
alter table public.messages add column if not exists pinned_at timestamptz;
alter table public.messages add column if not exists sticker text;
alter table public.messages add column if not exists loc jsonb;
alter table public.messages add column if not exists poll jsonb;
alter table public.messages add column if not exists mentions uuid[];
alter table public.messages add column if not exists expires_at timestamptz;
create index if not exists messages_expires_idx on public.messages (expires_at) where expires_at is not null;

alter table public.messages drop constraint if exists messages_sticker_check;
alter table public.messages add constraint messages_sticker_check check (sticker is null or sticker ~ '^[a-z0-9_]{2,30}$');
alter table public.messages drop constraint if exists messages_loc_check;
alter table public.messages add constraint messages_loc_check check (loc is null or (jsonb_typeof(loc->'lat') = 'number' and jsonb_typeof(loc->'lng') = 'number'
  and (loc->>'lat')::float between -90 and 90 and (loc->>'lng')::float between -180 and 180 and char_length(loc::text) <= 300));
alter table public.messages drop constraint if exists messages_poll_check;
alter table public.messages add constraint messages_poll_check check (poll is null or (chat_id is not null and jsonb_typeof(poll->'options') = 'array'
  and jsonb_array_length(poll->'options') between 2 and 6 and char_length(poll::text) <= 1500));
alter table public.messages drop constraint if exists messages_mentions_check;
alter table public.messages add constraint messages_mentions_check check (mentions is null or cardinality(mentions) <= 20);

alter table public.messages drop constraint if exists messages_body_check;
alter table public.messages add constraint messages_body_check check (char_length(body) <= 2000
  and (char_length(body) >= 1 or image_path is not null or voice_path is not null or deleted_at is not null
       or sticker is not null or loc is not null or poll is not null));

-- পড়া যায় শুধু মেয়াদ না পেরোনো মেসেজ
drop policy if exists "messages read" on public.messages;
create policy "messages read" on public.messages for select using (
  (expires_at is null or expires_at > now()) and (
  auth.uid() = sender_id or auth.uid() = recipient_id
  or (page_id is not null and private.is_page_staff(page_id, auth.uid()))
  or (chat_id is not null and private.is_chat_member(chat_id, auth.uid()))));

-- পাঠানোর সময়: এডিট/পিন নয়, মেয়াদ ও স্টিকার যাচাই
create or replace function private.messages_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare k text; dis boolean;
begin
  new.edited_at := null; new.pinned_at := null;
  if new.poll is not null then
    new.poll := jsonb_build_object('q', left(coalesce(new.poll->>'q', ''), 200),
      'options', (select jsonb_agg(left(x, 80)) from jsonb_array_elements_text(new.poll->'options') x));
  end if;
  if new.loc is not null then
    new.loc := jsonb_build_object('lat', round(((new.loc->>'lat')::numeric), 5), 'lng', round(((new.loc->>'lng')::numeric), 5));
  end if;
  -- মুছে যাওয়া মেসেজ চালু থাকলে ২৪ ঘণ্টার মেয়াদ (ছবি/ভয়েস তখন নয়)
  k := case when new.chat_id is not null then 'g_' || new.chat_id
            when new.page_id is not null then null
            else 'd_' || least(new.sender_id::text, new.recipient_id::text) || '_' || greatest(new.sender_id::text, new.recipient_id::text) end;
  select disappear into dis from public.conv_shared where key = k;
  if coalesce(dis, false) then
    if new.image_path is not null or new.voice_path is not null then raise exception 'disappearing: no media'; end if;
    new.expires_at := now() + interval '24 hours';
  else
    new.expires_at := null;
  end if;
  -- উল্লেখ শুধু গ্রুপের সদস্যদের
  if new.mentions is not null then
    if new.chat_id is null then new.mentions := null;
    else new.mentions := (select array_agg(distinct m) from unnest(new.mentions) m where private.is_chat_member(new.chat_id, m) and m <> new.sender_id);
    end if;
  end if;
  return new;
end $$;
drop trigger if exists messages_before_insert on public.messages;
create trigger messages_before_insert before insert on public.messages for each row execute function private.messages_before_insert();

-- @উল্লেখ: নোটিফিকেশন
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type = any (array[
  'like','comment','share','tag','friend_request','friend_accept','follow','group_request','group_approved',
  'reply','mention','verify_ok','verify_no','boost_ok','boost_no','milestone','follower_milestone','weekly','page_admin',
  'event_reminder','blood_request','chat_mention']));
create or replace function private.messages_after_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.mentions is not null and cardinality(new.mentions) > 0 then
    insert into public.notifications(user_id, actor_id, type, meta)
    select m, new.sender_id, 'chat_mention', jsonb_build_object('chat_id', new.chat_id, 'chat', (select name from public.chats where id = new.chat_id), 'text', left(new.body, 80))
      from unnest(new.mentions) m;
  end if;
  return new;
end $$;
drop trigger if exists messages_after_insert on public.messages;
create trigger messages_after_insert after insert on public.messages for each row execute function private.messages_after_insert();

-- এডিট: পাঠানোর ১৫ মিনিটের মধ্যে, নিজের লেখা মেসেজ
create or replace function public.edit_message(p_id bigint, p_body text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if char_length(btrim(coalesce(p_body, ''))) = 0 or char_length(p_body) > 2000 then raise exception 'bad body'; end if;
  update public.messages set body = btrim(p_body), edited_at = now()
   where id = p_id and sender_id = auth.uid() and deleted_at is null and sticker is null and poll is null and loc is null
     and created_at > now() - interval '15 minutes';
  if not found then raise exception 'edit window over'; end if;
end $$;

-- পিন: চ্যাটের যেকোনো সদস্য (সবার জন্য)
create or replace function public.pin_message(p_id bigint, p_on boolean)
returns void language plpgsql security definer set search_path = public as $$
declare m public.messages;
begin
  select * into m from public.messages where id = p_id;
  if m.id is null or m.deleted_at is not null then raise exception 'not found'; end if;
  if not (auth.uid() in (m.sender_id, m.recipient_id) or (m.chat_id is not null and private.is_chat_member(m.chat_id, auth.uid()))
          or (m.page_id is not null and private.is_page_staff(m.page_id, auth.uid()))) then raise exception 'not allowed'; end if;
  update public.messages set pinned_at = case when p_on then now() end where id = p_id;
end $$;

-- নিজের জন্য সেভ
create table if not exists public.message_saved (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  message_id bigint not null references public.messages(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, message_id)
);
alter table public.message_saved enable row level security;
drop policy if exists "msg saved own" on public.message_saved;
create policy "msg saved own" on public.message_saved for all using (user_id = auth.uid()) with check (user_id = auth.uid() and exists (select 1 from public.messages m where m.id = message_id));

-- গ্রুপ পোল
create table if not exists public.chat_poll_votes (
  message_id bigint not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  opt smallint not null,
  primary key (message_id, user_id)
);
alter table public.chat_poll_votes enable row level security;
drop policy if exists "chat poll read" on public.chat_poll_votes;
create policy "chat poll read" on public.chat_poll_votes for select using (exists (select 1 from public.messages m where m.id = message_id));
create or replace function public.vote_chat_poll(p_id bigint, p_opt int)
returns void language plpgsql security definer set search_path = public as $$
declare n int; c bigint;
begin
  select jsonb_array_length(poll->'options'), chat_id into n, c from public.messages where id = p_id and poll is not null and deleted_at is null;
  if n is null or not private.is_chat_member(c, auth.uid()) then raise exception 'not allowed'; end if;
  if p_opt is null or p_opt < 0 then delete from public.chat_poll_votes where message_id = p_id and user_id = auth.uid(); return; end if;
  if p_opt >= n then raise exception 'bad option'; end if;
  insert into public.chat_poll_votes(message_id, user_id, opt) values (p_id, auth.uid(), p_opt)
    on conflict (message_id, user_id) do update set opt = excluded.opt;
end $$;
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'chat_poll_votes') then
    alter publication supabase_realtime add table public.chat_poll_votes;
  end if;
end $$;

-- গ্রুপের ছবি ও বিবরণ
alter table public.chats add column if not exists about text check (about is null or char_length(about) <= 300);
alter table public.chats add column if not exists photo_path text check (photo_path is null or photo_path like 'g\_%');
create or replace function public.update_chat(p_chat bigint, p_name text, p_about text, p_photo text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not private.is_chat_member(p_chat, auth.uid()) then raise exception 'not allowed'; end if;
  if p_photo is not null and p_photo <> '' and split_part(p_photo, '/', 1) <> 'g_' || p_chat then raise exception 'bad photo'; end if;
  update public.chats set name = coalesce(nullif(btrim(p_name), ''), name), about = nullif(btrim(coalesce(p_about, '')), ''),
         photo_path = case when p_photo = '' then null when p_photo is null then photo_path else p_photo end
   where id = p_chat;
end $$;

-- দুজনের বা গ্রুপের যৌথ সেটিং: থিম রং, ডাকনাম, মুছে যাওয়া মেসেজ
-- key = স্টোরেজ ফোল্ডারের মতো: d_<a>_<b>, g_<chat>
create table if not exists public.conv_shared (
  key text primary key check (key ~ '^(d_[0-9a-f-]{36}_[0-9a-f-]{36}|g_[0-9]+)$'),
  theme text check (theme is null or theme in ('green','blue','purple','pink','red','orange','teal','black')),
  nicknames jsonb not null default '{}'::jsonb check (char_length(nicknames::text) <= 3000),
  disappear boolean not null default false,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.conv_shared enable row level security;
drop policy if exists "conv shared read" on public.conv_shared;
create policy "conv shared read" on public.conv_shared for select using (private.chat_path_ok(key || '/x'));
create or replace function public.set_conv_shared(p_key text, p_theme text, p_nick_user uuid, p_nick text, p_disappear boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not private.chat_path_ok(p_key || '/x') then raise exception 'not allowed'; end if;
  insert into public.conv_shared(key) values (p_key) on conflict do nothing;
  update public.conv_shared set
    theme = case when p_theme is null then theme when p_theme = '' then null else p_theme end,
    nicknames = case when p_nick_user is null then nicknames
                     when coalesce(btrim(p_nick), '') = '' then nicknames - p_nick_user::text
                     else nicknames || jsonb_build_object(p_nick_user::text, left(btrim(p_nick), 30)) end,
    disappear = coalesce(p_disappear, disappear), updated_by = auth.uid(), updated_at = now()
   where key = p_key;
end $$;

-- মেয়াদ পেরোনো মেসেজ মুছে ফেলা (প্রতি ১০ মিনিটে)
create or replace function private.purge_messages()
returns void language sql security definer set search_path = public as $$
  delete from public.messages where expires_at is not null and expires_at <= now();
$$;
do $$ begin
  perform cron.unschedule(jobid) from cron.job where jobname = 'purge-messages';
  perform cron.schedule('purge-messages', '*/10 * * * *', 'select private.purge_messages()');
end $$;

-- ইনবক্সে নতুন ধরনের মেসেজের লেবেল
create or replace function private.msg_label(body text, img text, voice text, del timestamptz)
returns text language sql immutable as $$
  select case when del is not null then '🚫 মেসেজটি মুছে ফেলা হয়েছে'
              when voice is not null then '🎤 ভয়েস মেসেজ'
              when img is not null and coalesce(body, '') = '' then '📷 ছবি'
              when img is not null then '📷 ' || body
              when coalesce(body, '') = '' then '✨ স্টিকার / লোকেশন / পোল'
              else body end;
$$;

-- গ্রুপের ছবি ইনবক্সে দেখাতে (avatar_url = chat বাকেটের পাথ)
create or replace function public.my_inbox()
returns table(kind text, partner_id uuid, page_id bigint, chat_id bigint, as_page boolean, page_name text, name text, avatar_url text,
              last_body text, last_at timestamptz, last_mine boolean, unread bigint, muted boolean, request boolean, members int)
language sql stable security definer set search_path = public as $$
  with st as (select key, muted, accepted, cleared_at from public.conv_settings where user_id = auth.uid()),
  dm as (
    select c.*, case when c.page_id is null then 'u:' || c.partner_id else 'p:' || c.page_id || ':' || c.partner_id end k
      from public.my_conversations() c
  ), grp as (
    select c.id, c.name, c.photo_path, c.created_at, cm.last_read_at,
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
  select 'group', null, null, g.id, false, null, g.name, g.photo_path,
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
