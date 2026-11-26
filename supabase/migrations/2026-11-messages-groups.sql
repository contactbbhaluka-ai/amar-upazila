-- =====================================================================
--  মেসেজ (৩): "না পড়া" চিহ্ন, গ্রুপে যোগ দেওয়ার লিংক/QR (অ্যাডমিনের অনুমোদনসহ),
--  শুধু অ্যাডমিনরা মেসেজ পাঠাতে পারবেন এমন গ্রুপ, অ্যাডমিন বানানো
-- =====================================================================
alter table public.conv_settings add column if not exists marked_unread boolean not null default false;
alter table public.chats add column if not exists join_code text unique;
alter table public.chats add column if not exists join_approval boolean not null default true;
alter table public.chats add column if not exists admins_only boolean not null default false;

create table if not exists public.chat_join_requests (
  chat_id bigint not null references public.chats(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (chat_id, user_id)
);
create index if not exists chat_join_requests_user_idx on public.chat_join_requests (user_id);
alter table public.chat_join_requests enable row level security;
drop policy if exists "chat join req read" on public.chat_join_requests;
create policy "chat join req read" on public.chat_join_requests for select using (user_id = auth.uid() or private.is_chat_admin(chat_id, auth.uid()));

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type = any (array[
  'like','comment','share','tag','friend_request','friend_accept','follow','group_request','group_approved',
  'reply','mention','verify_ok','verify_no','boost_ok','boost_no','milestone','follower_milestone','weekly','page_admin',
  'event_reminder','blood_request','chat_mention','chat_join_request','chat_join_ok']));

create or replace function private.messages_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare k text; dis boolean;
begin
  new.edited_at := null; new.pinned_at := null;
  -- শুধু অ্যাডমিনরা লিখতে পারেন এমন গ্রুপ
  if new.chat_id is not null and exists (select 1 from public.chats c where c.id = new.chat_id and c.admins_only)
     and not private.is_chat_admin(new.chat_id, new.sender_id) then raise exception 'admins only'; end if;
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

-- যোগ দেওয়ার লিংক: সদস্যরা দেখতে পারেন, নতুন করে বানাতে (আগেরটা বাতিল) পারেন শুধু অ্যাডমিন
create or replace function public.chat_invite(p_chat bigint, p_reset boolean default false)
returns text language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if not private.is_chat_member(p_chat, auth.uid()) then raise exception 'not allowed'; end if;
  if p_reset and not private.is_chat_admin(p_chat, auth.uid()) then raise exception 'not allowed'; end if;
  select join_code into c from public.chats where id = p_chat;
  if c is null or p_reset then
    c := left(replace(gen_random_uuid()::text, '-', ''), 12);
    update public.chats set join_code = c where id = p_chat;
  end if;
  return c;
end $$;

-- লিংক খুললে গ্রুপের ছোট পরিচয় (সদস্য না হলেও)
create or replace function public.chat_by_code(p_code text)
returns table(id bigint, name text, about text, members int, is_member boolean, pending boolean, approval boolean)
language sql stable security definer set search_path = public as $$
  select c.id, c.name, c.about, (select count(*) from public.chat_members m where m.chat_id = c.id)::int,
         private.is_chat_member(c.id, auth.uid()),
         exists (select 1 from public.chat_join_requests r where r.chat_id = c.id and r.user_id = auth.uid()),
         c.join_approval
    from public.chats c where auth.uid() is not null and c.join_code = p_code;
$$;

-- যোগ দিন: অনুমোদন লাগলে অনুরোধ যায় (অ্যাডমিনরা নোটিফিকেশন পান), না লাগলে সরাসরি সদস্য
create or replace function public.join_chat(p_code text)
returns text language plpgsql security definer set search_path = public as $$
declare c public.chats;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  select * into c from public.chats where join_code = p_code;
  if c.id is null then raise exception 'invalid link'; end if;
  if private.is_chat_member(c.id, auth.uid()) then return 'member'; end if;
  if exists (select 1 from public.chat_members m where m.chat_id = c.id and m.role = 'admin' and private.is_blocked(m.user_id, auth.uid())) then raise exception 'not allowed'; end if;
  if (select count(*) from public.chat_members where chat_id = c.id) >= 50 then raise exception 'members max 50'; end if;
  if c.join_approval then
    insert into public.chat_join_requests(chat_id, user_id) values (c.id, auth.uid()) on conflict do nothing;
    if found then
      insert into public.notifications(user_id, actor_id, type, meta)
      select m.user_id, auth.uid(), 'chat_join_request', jsonb_build_object('chat_id', c.id, 'chat', c.name)
        from public.chat_members m where m.chat_id = c.id and m.role = 'admin';
    end if;
    return 'pending';
  end if;
  insert into public.chat_members(chat_id, user_id) values (c.id, auth.uid()) on conflict do nothing;
  return 'joined';
end $$;

-- অপেক্ষমাণ অনুরোধ (শুধু অ্যাডমিন)
create or replace function public.chat_join_list(p_chat bigint)
returns table(user_id uuid, name text, avatar_url text, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not private.is_chat_admin(p_chat, auth.uid()) then raise exception 'not allowed'; end if;
  return query select r.user_id, p.name, p.avatar_url, r.created_at
    from public.chat_join_requests r join public.profiles p on p.id = r.user_id where r.chat_id = p_chat order by r.created_at;
end $$;

create or replace function public.decide_chat_join(p_chat bigint, p_user uuid, p_ok boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not private.is_chat_admin(p_chat, auth.uid()) then raise exception 'not allowed'; end if;
  delete from public.chat_join_requests where chat_id = p_chat and user_id = p_user;
  if not found then raise exception 'not found'; end if;
  if p_ok then
    if (select count(*) from public.chat_members where chat_id = p_chat) >= 50 then raise exception 'members max 50'; end if;
    insert into public.chat_members(chat_id, user_id) values (p_chat, p_user) on conflict do nothing;
    insert into public.notifications(user_id, actor_id, type, meta)
    values (p_user, auth.uid(), 'chat_join_ok', jsonb_build_object('chat_id', p_chat, 'chat', (select name from public.chats where id = p_chat)));
  end if;
end $$;

-- গ্রুপের নিয়ম: শুধু অ্যাডমিন লিখবেন / যোগ দিতে অনুমোদন লাগবে
create or replace function public.set_chat_options(p_chat bigint, p_admins_only boolean, p_approval boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not private.is_chat_admin(p_chat, auth.uid()) then raise exception 'not allowed'; end if;
  update public.chats set admins_only = coalesce(p_admins_only, admins_only), join_approval = coalesce(p_approval, join_approval) where id = p_chat;
end $$;

-- অ্যাডমিন বানানো / সরানো (শেষ অ্যাডমিনকে সরানো যায় না)
create or replace function public.set_chat_admin(p_chat bigint, p_user uuid, p_on boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not private.is_chat_admin(p_chat, auth.uid()) then raise exception 'not allowed'; end if;
  if not private.is_chat_member(p_chat, p_user) then raise exception 'not found'; end if;
  if not p_on and (select count(*) from public.chat_members where chat_id = p_chat and role = 'admin') <= 1 then raise exception 'last admin'; end if;
  update public.chat_members set role = case when p_on then 'admin' else 'member' end where chat_id = p_chat and user_id = p_user;
end $$;

-- ইনবক্স: "না পড়া" চিহ্ন দেওয়া চ্যাট না-পড়া দেখায়
create or replace function public.my_inbox()
returns table(kind text, partner_id uuid, page_id bigint, chat_id bigint, as_page boolean, page_name text, name text, avatar_url text,
              last_body text, last_at timestamptz, last_mine boolean, unread bigint, muted boolean, request boolean, members int)
language sql stable security definer set search_path = public as $$
  with st as (select key, muted, accepted, cleared_at, marked_unread from public.conv_settings where user_id = auth.uid()),
  dm as (
    select c.*, case when c.page_id is null then 'u:' || c.partner_id else 'p:' || c.page_id || ':' || c.partner_id end k
      from public.my_conversations() c
  ), grp as (
    select c.id, c.name, c.photo_path, c.created_at, cm.last_read_at,
           (select count(*) from public.chat_members x where x.chat_id = c.id)::int n
      from public.chat_members cm join public.chats c on c.id = cm.chat_id where cm.user_id = auth.uid()
  )
  select case when d.page_id is null then 'dm' else 'page' end, d.partner_id, d.page_id, null::bigint, d.as_page, d.page_name, d.name, d.avatar_url,
         d.last_body, d.last_at, d.last_mine, case when coalesce(s.marked_unread, false) and d.unread = 0 then 1 else d.unread end, coalesce(s.muted, false),
         d.page_id is null and not coalesce(s.accepted, false) and not private.are_friends(auth.uid(), d.partner_id)
           and not exists (select 1 from public.messages mm where mm.sender_id = auth.uid() and mm.recipient_id = d.partner_id and mm.page_id is null),
         2
    from dm d left join st s on s.key = d.k
   where s.cleared_at is null or d.last_at > s.cleared_at
  union all
  select 'group', null, null, g.id, false, null, g.name, g.photo_path,
         coalesce(private.msg_label(lm.body, lm.image_path, lm.voice_path, lm.deleted_at), 'গ্রুপ তৈরি হয়েছে'),
         coalesce(lm.created_at, g.created_at), coalesce(lm.sender_id = auth.uid(), false),
         greatest((select count(*) from public.messages m where m.chat_id = g.id and m.sender_id <> auth.uid() and m.created_at > g.last_read_at
             and not exists (select 1 from public.message_hidden h where h.user_id = auth.uid() and h.message_id = m.id)), case when coalesce(s.marked_unread, false) then 1 else 0 end),
         coalesce(s.muted, false), false, g.n
    from grp g
    left join lateral (select body, image_path, voice_path, deleted_at, created_at, sender_id from public.messages m
                        where m.chat_id = g.id and not exists (select 1 from public.message_hidden h where h.user_id = auth.uid() and h.message_id = m.id)
                        order by created_at desc limit 1) lm on true
    left join st s on s.key = 'g:' || g.id
   where s.cleared_at is null or coalesce(lm.created_at, g.created_at) > s.cleared_at
  order by 10 desc;
$$;
