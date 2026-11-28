-- নোটিফিকেশনের বোতাম (অ্যাপ না খুলে): মেসেজে উত্তর/👍/পড়েছি, ফ্রেন্ড রিকোয়েস্ট গ্রহণ/মুছুন, রক্তের অনুরোধে "আমি দিতে পারব"
-- টোকেনের conv: 'u:<uuid>' একান্ত চ্যাট, 'g:<id>' গ্রুপ চ্যাট, 'f:<uuid>' ফ্রেন্ড রিকোয়েস্ট, 'b:<post id>' রক্তের অনুরোধ
drop function if exists public.push_reply(text, text, text);
create or replace function public.push_reply(p_token text, p_text text default null, p_action text default 'reply', p_mid bigint default null) returns jsonb
language plpgsql security definer set search_path = public, private as $$
declare t public.push_reply_tokens; v_txt text := btrim(coalesce(p_text, '')); v_partner uuid; v_chat bigint; v_post bigint; v_name text; v_kind text; p record;
begin
  select * into t from public.push_reply_tokens where token = p_token and exp > now() for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'expired'); end if;
  if t.uses >= 30 then return jsonb_build_object('ok', false, 'error', 'limit'); end if;
  update public.push_reply_tokens set uses = uses + 1 where token = t.token;
  v_kind := left(t.conv, 1);
  if v_kind in ('u', 'f') then v_partner := substr(t.conv, 3)::uuid;
  elsif v_kind = 'g' then v_chat := substr(t.conv, 3)::bigint;
  elsif v_kind = 'b' then v_post := substr(t.conv, 3)::bigint; end if;
  select name into v_name from public.profiles where id = t.user_id;

  -- ফ্রেন্ড রিকোয়েস্ট
  if v_kind = 'f' then
    if p_action = 'accept' then
      update public.friendships set status = 'accepted' where requester = v_partner and addressee = t.user_id and status = 'pending';
      if not found then return jsonb_build_object('ok', false, 'error', 'gone'); end if;
      insert into public.follows (follower_id, followee_id) values (t.user_id, v_partner) on conflict do nothing;
    elsif p_action = 'decline' then
      delete from public.friendships where requester = v_partner and addressee = t.user_id and status = 'pending';
    else return jsonb_build_object('ok', false, 'error', 'action'); end if;
    update public.push_reply_tokens set exp = now() where token = t.token;
    update public.notifications set read = true where user_id = t.user_id and actor_id = v_partner and type = 'friend_request';
    return jsonb_build_object('ok', true, 'me', coalesce(v_name, 'আপনি'));
  end if;

  -- রক্তের অনুরোধ: যিনি পোস্ট দিয়েছেন তাকে মেসেজ যায়
  if v_kind = 'b' then
    if p_action <> 'donate' then return jsonb_build_object('ok', false, 'error', 'action'); end if;
    select id, user_id, blood_group into p from public.posts where id = v_post;
    if p.id is null then return jsonb_build_object('ok', false, 'error', 'gone'); end if;
    if public.is_blocked(t.user_id, p.user_id) then return jsonb_build_object('ok', false, 'error', 'blocked'); end if;
    insert into public.messages (sender_id, recipient_id, body)
    values (t.user_id, p.user_id, '🩸 আপনার ' || coalesce(p.blood_group, '') || ' রক্তের অনুরোধ দেখেছি। আমি রক্ত দিতে পারব, যোগাযোগ করুন।');
    update public.push_reply_tokens set exp = now() where token = t.token;
    update public.notifications set read = true where user_id = t.user_id and post_id = v_post and type = 'blood_request';
    return jsonb_build_object('ok', true, 'me', coalesce(v_name, 'আপনি'));
  end if;

  -- মেসেজ
  if p_action = 'reply' then
    if v_txt = '' or length(v_txt) > 2000 then return jsonb_build_object('ok', false, 'error', 'text'); end if;
    if v_partner is not null then
      if public.is_blocked(t.user_id, v_partner) then return jsonb_build_object('ok', false, 'error', 'blocked'); end if;
      insert into public.messages (sender_id, recipient_id, body) values (t.user_id, v_partner, v_txt);
    else
      if not private.is_chat_member(v_chat, t.user_id) then return jsonb_build_object('ok', false, 'error', 'member'); end if;
      insert into public.messages (sender_id, chat_id, body) values (t.user_id, v_chat, v_txt);
    end if;
  elsif p_action = 'react' then
    if v_txt not in ('👍', '❤️', '😂', '😮', '😢', '😡') or p_mid is null then return jsonb_build_object('ok', false, 'error', 'react'); end if;
    if not exists (select 1 from public.messages m where m.id = p_mid and m.deleted_at is null and
        ((v_partner is not null and m.sender_id = v_partner and m.recipient_id = t.user_id and m.page_id is null)
         or (v_chat is not null and m.chat_id = v_chat and private.is_chat_member(v_chat, t.user_id)))) then
      return jsonb_build_object('ok', false, 'error', 'react'); end if;
    insert into public.message_reactions (message_id, user_id, emoji) values (p_mid, t.user_id, v_txt)
    on conflict (message_id, user_id) do update set emoji = excluded.emoji;
  elsif p_action <> 'read' then
    return jsonb_build_object('ok', false, 'error', 'action');
  end if;

  if v_partner is not null then
    update public.messages set read_at = now() where page_id is null and recipient_id = t.user_id and sender_id = v_partner and read_at is null;
  else
    update public.chat_members set last_read_at = now() where chat_id = v_chat and user_id = t.user_id;
  end if;
  return jsonb_build_object('ok', true, 'me', coalesce(v_name, 'আপনি'));
end $$;
revoke all on function public.push_reply(text, text, text, bigint) from public;
grant execute on function public.push_reply(text, text, text, bigint) to anon, authenticated;

-- অ্যাপ আইকনের সংখ্যা: না-পড়া নোটিফিকেশন + না-পড়া একান্ত মেসেজ (শুধু সার্ভার)
create or replace function public.push_badge(p_users uuid[]) returns table(user_id uuid, n int)
language sql stable security definer set search_path = public as $$
  select u, (select count(*) from public.notifications x where x.user_id = u and not x.read)::int
          + (select count(*) from public.messages m where m.recipient_id = u and m.read_at is null and m.page_id is null and m.deleted_at is null and not m.is_auto)::int
    from unnest(p_users) u $$;
revoke all on function public.push_badge(uuid[]) from public, anon, authenticated;
grant execute on function public.push_badge(uuid[]) to service_role;

-- একই পোস্টে কতজন (একসাথে গুছিয়ে দেখানোর জন্য, শুধু সার্ভার)
create or replace function public.push_group_count(p_user uuid, p_post bigint, p_type text) returns int
language sql stable security definer set search_path = public as $$
  select count(distinct actor_id)::int from public.notifications
   where user_id = p_user and post_id = p_post and type = p_type and not read and created_at > now() - interval '2 days' $$;
revoke all on function public.push_group_count(uuid, bigint, text) from public, anon, authenticated;
grant execute on function public.push_group_count(uuid, bigint, text) to service_role;
