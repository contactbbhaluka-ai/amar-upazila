-- পেইজের মেসেজেও পুশ নোটিফিকেশন ও নোটিফিকেশন থেকে উত্তর/👍/পড়েছি
-- টোকেনের conv: 'p:<page id>:<গ্রাহকের uuid>'। পেইজের অ্যাডমিন হলে উত্তর যায় পেইজের নামে গ্রাহকের কাছে, গ্রাহক হলে পেইজের কাছে।
create or replace function private.on_message_push() returns trigger
language plpgsql security definer set search_path = public, private as $$
begin
  if new.is_auto or new.deleted_at is not null then return null; end if;
  if new.chat_id is null and new.page_id is null and (new.recipient_id is null or not exists (select 1 from public.push_tokens t where t.user_id = new.recipient_id)) then return null; end if;
  perform private.push_send(jsonb_build_object('kind', 'msg', 'id', new.id));
  return null;
exception when others then return null;
end $$;

create or replace function public.push_reply(p_token text, p_text text default null, p_action text default 'reply', p_mid bigint default null) returns jsonb
language plpgsql security definer set search_path = public, private as $$
declare t public.push_reply_tokens; v_txt text := btrim(coalesce(p_text, '')); v_partner uuid; v_chat bigint; v_post bigint; v_page bigint; v_cust uuid; v_staff boolean; v_owner uuid;
        v_name text; v_kind text; p record;
begin
  select * into t from public.push_reply_tokens where token = p_token and exp > now() for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'expired'); end if;
  if t.uses >= 30 then return jsonb_build_object('ok', false, 'error', 'limit'); end if;
  update public.push_reply_tokens set uses = uses + 1 where token = t.token;
  v_kind := left(t.conv, 1);
  if v_kind in ('u', 'f') then v_partner := substr(t.conv, 3)::uuid;
  elsif v_kind = 'g' then v_chat := substr(t.conv, 3)::bigint;
  elsif v_kind = 'b' then v_post := substr(t.conv, 3)::bigint;
  elsif v_kind = 'p' then
    v_page := split_part(t.conv, ':', 2)::bigint; v_cust := split_part(t.conv, ':', 3)::uuid;
    v_staff := private.is_page_staff(v_page, t.user_id);
    select owner_id into v_owner from public.pages where id = v_page;
    if v_owner is null or (not v_staff and t.user_id <> v_cust) then return jsonb_build_object('ok', false, 'error', 'gone'); end if;
  end if;
  select name into v_name from public.profiles where id = t.user_id;

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

  if p_action = 'reply' then
    if v_txt = '' or length(v_txt) > 2000 then return jsonb_build_object('ok', false, 'error', 'text'); end if;
    if v_page is not null then
      if v_staff then insert into public.messages (sender_id, recipient_id, body, page_id) values (t.user_id, v_cust, v_txt, v_page);
      else insert into public.messages (sender_id, recipient_id, body, page_id) values (t.user_id, v_owner, v_txt, v_page); end if;
    elsif v_partner is not null then
      if public.is_blocked(t.user_id, v_partner) then return jsonb_build_object('ok', false, 'error', 'blocked'); end if;
      insert into public.messages (sender_id, recipient_id, body) values (t.user_id, v_partner, v_txt);
    else
      if not private.is_chat_member(v_chat, t.user_id) then return jsonb_build_object('ok', false, 'error', 'member'); end if;
      insert into public.messages (sender_id, chat_id, body) values (t.user_id, v_chat, v_txt);
    end if;
  elsif p_action = 'react' then
    if v_txt not in ('👍', '❤️', '😂', '😮', '😢', '😡') or p_mid is null then return jsonb_build_object('ok', false, 'error', 'react'); end if;
    if not exists (select 1 from public.messages m where m.id = p_mid and m.deleted_at is null and
        ((v_page is not null and m.page_id = v_page and v_cust in (m.sender_id, m.recipient_id))
         or (v_partner is not null and m.sender_id = v_partner and m.recipient_id = t.user_id and m.page_id is null)
         or (v_chat is not null and m.chat_id = v_chat and private.is_chat_member(v_chat, t.user_id)))) then
      return jsonb_build_object('ok', false, 'error', 'react'); end if;
    insert into public.message_reactions (message_id, user_id, emoji) values (p_mid, t.user_id, v_txt)
    on conflict (message_id, user_id) do update set emoji = excluded.emoji;
  elsif p_action <> 'read' then
    return jsonb_build_object('ok', false, 'error', 'action');
  end if;

  if v_page is not null then
    if v_staff then update public.messages set read_at = now() where page_id = v_page and sender_id = v_cust and read_at is null;
    else update public.messages set read_at = now() where page_id = v_page and recipient_id = v_cust and read_at is null; end if;
  elsif v_partner is not null then
    update public.messages set read_at = now() where page_id is null and recipient_id = t.user_id and sender_id = v_partner and read_at is null;
  else
    update public.chat_members set last_read_at = now() where chat_id = v_chat and user_id = t.user_id;
  end if;
  return jsonb_build_object('ok', true, 'me', coalesce(v_name, 'আপনি'));
end $$;
revoke all on function public.push_reply(text, text, text, bigint) from public;
grant execute on function public.push_reply(text, text, text, bigint) to anon, authenticated;
