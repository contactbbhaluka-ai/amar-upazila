-- =====================================================================
--  নোটিফিকেশন (৩): সকালের মনে করানো (জন্মদিন, বন্ধুত্বের বার্ষিকী), আরও মাইলফলক,
--  শেয়ারের সাথে লেখা, উপজেলার জরুরি ঘোষণা, এলাকার সতর্কবার্তা
-- =====================================================================
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type = any (array[
  'like','comment','share','tag','friend_request','friend_accept','follow','group_request','group_approved',
  'reply','mention','verify_ok','verify_no','boost_ok','boost_no','milestone','follower_milestone','weekly','page_admin',
  'event_reminder','blood_request','chat_mention','chat_join_request','chat_join_ok',
  'birthday','friend_anniv','announce','area_alert']));

-- শেয়ার করে কিছু লিখলে সেই লেখাও নোটিফিকেশনে
create or replace function public.on_social_event()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'likes' then
    perform public.notify((select user_id from public.posts where id = new.post_id), new.user_id, 'like', new.post_id);
  elsif tg_table_name = 'comments' then
    declare post_owner uuid := (select user_id from public.posts where id = new.post_id);
            parent_owner uuid := (select user_id from public.comments where id = new.parent_id);
    begin
      if parent_owner is not null then perform public.notify(parent_owner, new.user_id, 'reply', new.post_id); end if;
      if parent_owner is distinct from post_owner then perform public.notify(post_owner, new.user_id, 'comment', new.post_id); end if;
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
end $$;

-- মাইলফলক: পোস্টে ১০/৫০/১০০/৫০০/১০০০ রিয়্যাক্ট
create or replace function private.react_milestone()
returns trigger language plpgsql security definer set search_path = public as $$
declare th int; u uuid;
begin
  foreach th in array array[10, 50, 100, 500, 1000] loop
    if new.like_count >= th and coalesce(old.like_count, 0) < th then
      for u in select new.user_id where new.page_id is null
               union select owner_id from public.pages where id = new.page_id
               union select user_id from public.page_admins where page_id = new.page_id loop
        if u is not null and not exists (select 1 from public.notifications where user_id = u and type = 'milestone' and post_id = new.id and meta->>'kind' = 'reacts' and (meta->>'n')::int = th) then
          insert into public.notifications (user_id, actor_id, type, post_id, meta) values (u, u, 'milestone', new.id, jsonb_build_object('kind', 'reacts', 'n', th));
        end if;
      end loop;
    end if;
  end loop;
  return null;
exception when others then return null;
end $$;
drop trigger if exists react_milestone on public.posts;
create trigger react_milestone after update of like_count on public.posts for each row when (new.like_count > coalesce(old.like_count, 0)) execute function private.react_milestone();

-- মাইলফলক: ১০/৫০/১০০/৫০০/১০০০ জন বন্ধু
create or replace function private.friend_milestone()
returns trigger language plpgsql security definer set search_path = public as $$
declare u uuid; n int;
begin
  if not (new.status = 'accepted' and old.status is distinct from 'accepted') then return null; end if;
  foreach u in array array[new.requester, new.addressee] loop
    select count(*) into n from public.friendships where status = 'accepted' and u in (requester, addressee);
    if n in (10, 50, 100, 500, 1000) and not exists (select 1 from public.notifications where user_id = u and type = 'milestone' and meta->>'kind' = 'friends' and (meta->>'n')::int = n) then
      insert into public.notifications (user_id, actor_id, type, meta) values (u, u, 'milestone', jsonb_build_object('kind', 'friends', 'n', n));
    end if;
  end loop;
  return null;
exception when others then return null;
end $$;
drop trigger if exists friend_milestone on public.friendships;
create trigger friend_milestone after update on public.friendships for each row execute function private.friend_milestone();

-- সকালের মনে করানো (প্রতিদিন ঢাকা সময় সকাল ৮টা ৭ মিনিটে): আজ কার জন্মদিন, কার সাথে বন্ধুত্বের বার্ষিকী
create or replace function private.morning_reminders()
returns void language plpgsql security definer set search_path = public as $$
declare d date := (now() at time zone 'Asia/Dhaka')::date;
begin
  -- জন্মদিন: প্রত্যেকের জন্য একটা নোটিফিকেশন (প্রথম জন actor, বাকিদের নাম meta-তে)
  insert into public.notifications (user_id, actor_id, type, meta)
  select x.uid, (array_agg(x.fid order by x.fname))[1], 'birthday',
         jsonb_build_object('count', count(*), 'names', (array_agg(x.fname order by x.fname))[1:3], 'day', d)
    from (
      select case when f.requester = p.id then f.addressee else f.requester end uid, p.id fid, p.name fname
        from public.profile_details pd join public.profiles p on p.id = pd.user_id
        join public.friendships f on f.status = 'accepted' and p.id in (f.requester, f.addressee)
       where pd.birth_date is not null and coalesce(pd.birth_visibility, 'only_me') in ('public', 'friends')
         and extract(month from pd.birth_date) = extract(month from d) and extract(day from pd.birth_date) = extract(day from d)
    ) x
   where not private.is_blocked(x.uid, x.fid)
     and not exists (select 1 from public.notifications n where n.user_id = x.uid and n.type = 'birthday' and n.meta->>'day' = d::text)
   group by x.uid;
  -- বন্ধুত্বের বার্ষিকী (কমপক্ষে ১ বছর): দুজনেই পান
  insert into public.notifications (user_id, actor_id, type, meta)
  select a.u, a.o, 'friend_anniv', jsonb_build_object('years', a.y, 'day', d)
    from (
      select f.requester u, f.addressee o, (extract(year from d) - extract(year from (f.accepted_at at time zone 'Asia/Dhaka')))::int y, f.accepted_at
        from public.friendships f where f.status = 'accepted' and f.accepted_at is not null
      union all
      select f.addressee, f.requester, (extract(year from d) - extract(year from (f.accepted_at at time zone 'Asia/Dhaka')))::int, f.accepted_at
        from public.friendships f where f.status = 'accepted' and f.accepted_at is not null
    ) a
   where a.y >= 1 and to_char(a.accepted_at at time zone 'Asia/Dhaka', 'MM-DD') = to_char(d, 'MM-DD')
     and not exists (select 1 from public.notifications n where n.user_id = a.u and n.actor_id = a.o and n.type = 'friend_anniv' and n.meta->>'day' = d::text);
end $$;
select cron.unschedule('morning-reminders') where exists (select 1 from cron.job where jobname = 'morning-reminders');
select cron.schedule('morning-reminders', '7 2 * * *', 'select private.morning_reminders()');

-- উপজেলার জরুরি ঘোষণা (শুধু অ্যাডমিন; দিনে সর্বোচ্চ ৫টি)
create table if not exists public.announcements (
  id bigserial primary key,
  admin_id uuid references public.profiles(id) on delete set null,
  body text not null check (char_length(btrim(body)) between 5 and 500),
  union_id bigint references public.unions(id) on delete set null,
  recipients int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.announcements enable row level security;
drop policy if exists "announcements admin read" on public.announcements;
create policy "announcements admin read" on public.announcements for select using (public.is_admin());
create or replace function public.admin_broadcast(p_text text, p_union bigint default null)
returns int language plpgsql security definer set search_path = public as $$
declare aid bigint; n int;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  if char_length(btrim(coalesce(p_text, ''))) < 5 then raise exception 'too short'; end if;
  if (select count(*) from public.announcements where created_at > now() - interval '24 hours') >= 5 then raise exception 'announce limit'; end if;
  insert into public.announcements (admin_id, body, union_id) values (auth.uid(), btrim(p_text), p_union) returning id into aid;
  insert into public.notifications (user_id, actor_id, type, meta)
  select p.id, auth.uid(), 'announce', jsonb_build_object('text', btrim(p_text), 'aid', aid, 'union', (select name from public.unions where id = p_union))
    from public.profiles p
   where p.id <> auth.uid()
     and (case when p_union is null then p.union_id is not null or p.upazila = 'ভালুকা' else p.union_id = p_union end);
  get diagnostics n = row_count;
  update public.announcements set recipients = n where id = aid;
  return n;
end $$;
revoke all on function public.admin_broadcast(text, bigint) from public, anon;
grant execute on function public.admin_broadcast(text, bigint) to authenticated;

-- এলাকার সতর্কবার্তা: নিজের ইউনিয়নে কেউ "হারানো-প্রাপ্তি" বা "সাহায্য চাই" পোস্ট দিলে
-- (রক্তের অনুরোধে ডোনাররা আলাদা নোটিফিকেশন পান, তাই সেটা বাদ; একজন দিনে সর্বোচ্চ ৩টি পোস্টে)
create or replace function private.area_alert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.category, '') not in ('হারানো-প্রাপ্তি', 'সাহায্য চাই') or new.group_id is not null or new.page_id is not null
     or new.privacy <> 'public' or new.union_id is null or new.shared_post_id is not null
     or (new.category = 'সাহায্য চাই' and new.blood_group is not null) then return null; end if;
  if (select count(distinct post_id) from public.notifications where actor_id = new.user_id and type = 'area_alert' and created_at > now() - interval '24 hours') >= 3 then return null; end if;
  insert into public.notifications (user_id, actor_id, type, post_id, meta)
  select p.id, new.user_id, 'area_alert', new.id, jsonb_build_object('cat', new.category, 'union', (select name from public.unions where id = new.union_id))
    from public.profiles p
   where p.union_id = new.union_id and p.id <> new.user_id and not private.is_blocked(p.id, new.user_id)
   limit 5000;
  return null;
exception when others then return null;
end $$;
drop trigger if exists area_alert on public.posts;
create trigger area_alert after insert on public.posts for each row execute function private.area_alert();
