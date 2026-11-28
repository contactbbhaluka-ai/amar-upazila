-- মন্তব্য/রিপ্লাই/মেনশনের নোটিফিকেশনে মন্তব্যের আইডি (cid), থ্রেডের মূল মন্তব্য (pid) ও লেখা (text):
-- নোটিফিকেশন থেকেই উত্তর ও রিয়্যাক্ট দেওয়ার জন্য
create or replace function public.on_mention()
 returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare pid bigint; actor uuid; c record;
begin
  if tg_table_name = 'post_mentions' then
    select id, user_id into pid, actor from public.posts where id = new.post_id;
  else
    select id, post_id, user_id, parent_id, body into c from public.comments where id = new.comment_id;
    pid := c.post_id; actor := c.user_id;
  end if;
  if private.user_sees_post(new.user_id, pid) then
    perform public.notify(new.user_id, actor, 'mention', pid);
    if tg_table_name = 'comment_mentions' then
      update public.notifications set meta = coalesce(meta, '{}'::jsonb) || jsonb_build_object('cid', c.id, 'pid', coalesce(c.parent_id, c.id), 'text', left(btrim(coalesce(c.body, '')), 120))
       where user_id = new.user_id and actor_id = actor and type = 'mention' and post_id = pid and created_at > now() - interval '1 minute';
    end if;
  end if;
  return null;
end $function$;

create or replace function public.on_social_event()
 returns trigger language plpgsql security definer set search_path to 'public' as $function$
begin
  if tg_table_name = 'likes' then
    perform public.notify((select user_id from public.posts where id = new.post_id), new.user_id, 'like', new.post_id);
  elsif tg_table_name = 'comments' then
    declare post_owner uuid := (select user_id from public.posts where id = new.post_id);
            parent_owner uuid := (select user_id from public.comments where id = new.parent_id);
    begin
      if parent_owner is not null then perform public.notify(parent_owner, new.user_id, 'reply', new.post_id); end if;
      if parent_owner is distinct from post_owner then perform public.notify(post_owner, new.user_id, 'comment', new.post_id); end if;
      update public.notifications set meta = coalesce(meta, '{}'::jsonb) || jsonb_build_object('cid', new.id, 'pid', coalesce(new.parent_id, new.id), 'text', left(btrim(coalesce(new.body, '')), 120))
       where actor_id = new.user_id and type in ('reply', 'comment') and post_id = new.post_id and created_at > now() - interval '1 minute';
    end;
  elsif tg_table_name = 'follows' then
    perform public.notify(new.followee_id, new.follower_id, 'follow');
  elsif tg_table_name = 'post_tags' then
    perform public.notify(new.user_id, (select user_id from public.posts where id = new.post_id), 'tag', new.post_id);
  elsif tg_table_name = 'posts' then
    perform public.notify((select user_id from public.posts where id = new.shared_post_id), new.user_id, 'share', new.shared_post_id);
    if btrim(coalesce(new.body, '')) <> '' then
      update public.notifications set meta = jsonb_build_object('text', left(btrim(new.body), 100), 'share_id', new.id)
       where actor_id = new.user_id and type = 'share' and post_id = new.shared_post_id and created_at > now() - interval '1 minute';
    end if;
  elsif tg_table_name = 'friendships' then
    if tg_op = 'INSERT' then
      perform public.notify(new.addressee, new.requester, 'friend_request');
    elsif new.status = 'accepted' and old.status = 'pending' then
      perform public.notify(new.requester, new.addressee, 'friend_accept');
      delete from public.notifications where user_id = new.addressee and actor_id = new.requester and type = 'friend_request';
    end if;
  end if;
  return null;
end $function$;
