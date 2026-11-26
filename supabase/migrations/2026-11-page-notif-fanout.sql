-- =====================================================================
--  পেইজের পোস্টে রিয়্যাক্ট/মন্তব্য/শেয়ার আর দেখার মাইলফলক: পেইজের মালিক ও সব অ্যাডমিন নোটিফিকেশন পান
--  (আগে শুধু যিনি পোস্ট করেছেন তিনি পেতেন)
-- =====================================================================
create or replace function private.notify_one(to_user uuid, from_user uuid, kind text, post bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if to_user is null or to_user = from_user or private.is_blocked(to_user, from_user) then return; end if;
  delete from public.notifications
   where user_id = to_user and actor_id = from_user and type = kind and post_id is not distinct from post and kind not in ('comment','reply');
  insert into public.notifications (user_id, actor_id, type, post_id) values (to_user, from_user, kind, post);
end $$;
revoke all on function private.notify_one(uuid, uuid, text, bigint) from public, anon, authenticated;

create or replace function public.notify(to_user uuid, from_user uuid, kind text, post bigint default null)
returns void language plpgsql security definer set search_path = public as $$
declare pg bigint; u uuid;
begin
  if post is not null and kind in ('like','comment','share') then select page_id into pg from public.posts where id = post; end if;
  if pg is null then perform private.notify_one(to_user, from_user, kind, post); return; end if;
  for u in select owner_id from public.pages where id = pg union select user_id from public.page_admins where page_id = pg loop
    perform private.notify_one(u, from_user, kind, post);
  end loop;
end $$;
revoke all on function public.notify(uuid, uuid, text, bigint) from public, anon, authenticated;

create or replace function public.on_post_view_milestone()
returns trigger language plpgsql security definer set search_path = public as $$
declare n int; owner uuid; pg bigint; m int; u uuid;
begin
  select count(*) into n from public.post_views where post_id = new.post_id;
  if n not in (100, 500, 1000, 5000, 10000) then return null; end if;
  select user_id, page_id into owner, pg from public.posts where id = new.post_id;
  m := n;
  for u in select owner where pg is null
           union select owner_id from public.pages where id = pg
           union select user_id from public.page_admins where page_id = pg loop
    if u is not null and not exists (select 1 from public.notifications where user_id = u and type = 'milestone' and post_id = new.post_id and (meta->>'n')::int = m) then
      insert into public.notifications (user_id, actor_id, type, post_id, meta) values (u, u, 'milestone', new.post_id, jsonb_build_object('n', m));
    end if;
  end loop;
  return null;
exception when others then return null;
end $$;
