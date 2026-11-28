-- নোটিফিকেশন থেকেই মেসেজের উত্তর (অ্যাপ না খুলে)
-- send-push প্রতিটি মেসেজ-নোটিফিকেশনের সাথে একটা এককালীন গোপন টোকেন পাঠায় (৩ দিন মেয়াদ, শুধু ওই কথোপকথনের জন্য)।
-- ফোনের নোটিফিকেশনে উত্তর লিখলে অ্যাপ টোকেন আর লেখা push_reply-তে পাঠায়; লগইন সেশন লাগে না।
create table if not exists public.push_reply_tokens (
  token text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  conv text not null,                    -- 'u:<uuid>' (একান্ত চ্যাট) বা 'g:<chat id>' (গ্রুপ চ্যাট)
  exp timestamptz not null default now() + interval '3 days',
  uses int not null default 0
);
create index if not exists push_reply_tokens_exp on public.push_reply_tokens (exp);
alter table public.push_reply_tokens enable row level security;   -- কোনো পলিসি নেই: শুধু সার্ভার (service_role) ও নিচের ফাংশন

create or replace function public.push_reply(p_token text, p_text text default null, p_action text default 'reply') returns jsonb
language plpgsql security definer set search_path = public, private as $$
declare t public.push_reply_tokens; v_txt text := btrim(coalesce(p_text, '')); v_partner uuid; v_chat bigint; v_name text;
begin
  select * into t from public.push_reply_tokens where token = p_token and exp > now() for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'expired'); end if;
  if t.uses >= 30 then return jsonb_build_object('ok', false, 'error', 'limit'); end if;
  update public.push_reply_tokens set uses = uses + 1 where token = t.token;
  if t.conv like 'u:%' then v_partner := substr(t.conv, 3)::uuid; else v_chat := substr(t.conv, 3)::bigint; end if;

  if p_action = 'reply' then
    if v_txt = '' or length(v_txt) > 2000 then return jsonb_build_object('ok', false, 'error', 'text'); end if;
    if v_partner is not null then
      if public.is_blocked(t.user_id, v_partner) then return jsonb_build_object('ok', false, 'error', 'blocked'); end if;
      insert into public.messages (sender_id, recipient_id, body) values (t.user_id, v_partner, v_txt);
    else
      if not private.is_chat_member(v_chat, t.user_id) then return jsonb_build_object('ok', false, 'error', 'member'); end if;
      insert into public.messages (sender_id, chat_id, body) values (t.user_id, v_chat, v_txt);
    end if;
  elsif p_action <> 'read' then
    return jsonb_build_object('ok', false, 'error', 'action');
  end if;

  -- উত্তর দিলে বা "পড়েছি" চাপলে কথোপকথন পড়া হয়েছে
  if v_partner is not null then
    update public.messages set read_at = now() where page_id is null and recipient_id = t.user_id and sender_id = v_partner and read_at is null;
  else
    update public.chat_members set last_read_at = now() where chat_id = v_chat and user_id = t.user_id;
  end if;
  select name into v_name from public.profiles where id = t.user_id;
  return jsonb_build_object('ok', true, 'me', coalesce(v_name, 'আপনি'));
end $$;
revoke all on function public.push_reply(text, text, text) from public;
grant execute on function public.push_reply(text, text, text) to anon, authenticated;
