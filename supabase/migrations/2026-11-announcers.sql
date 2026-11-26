-- =====================================================================
--  ঘোষণাকারী: পুরো অ্যাডমিন না বানিয়ে নির্দিষ্ট কাউকে (উপজেলা প্রশাসন, ইউনিয়ন পরিষদ,
--  ফায়ার সার্ভিস…) শুধু জরুরি ঘোষণা পাঠানোর অনুমতি দেওয়া
-- =====================================================================
create table if not exists public.announcers (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 2 and 60),   -- যেমন "উপজেলা প্রশাসন"
  union_id bigint references public.unions(id) on delete cascade,           -- খালি = পুরো উপজেলায় পাঠাতে পারবেন
  added_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.announcers enable row level security;
drop policy if exists "announcers read" on public.announcers;
create policy "announcers read" on public.announcers for select using (user_id = auth.uid() or public.is_admin());

alter table public.announcements add column if not exists sender_title text;
drop policy if exists "announcements admin read" on public.announcements;
create policy "announcements admin read" on public.announcements for select using (public.is_admin() or admin_id = auth.uid());

-- অ্যাডমিন: অনুমতি দেওয়া / বদলানো / তুলে নেওয়া
create or replace function public.admin_set_announcer(p_user uuid, p_title text, p_union bigint default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  insert into public.announcers (user_id, title, union_id, added_by) values (p_user, btrim(p_title), p_union, auth.uid())
  on conflict (user_id) do update set title = excluded.title, union_id = excluded.union_id, added_by = excluded.added_by;
end $$;
create or replace function public.admin_remove_announcer(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  delete from public.announcers where user_id = p_user;
end $$;
create or replace function public.announcers_list()
returns table(user_id uuid, name text, avatar_url text, title text, union_id bigint, union_name text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  return query select a.user_id, p.name, p.avatar_url, a.title, a.union_id, u.name
    from public.announcers a join public.profiles p on p.id = a.user_id left join public.unions u on u.id = a.union_id order by a.created_at;
end $$;

-- ঘোষণা পাঠানো: অ্যাডমিন (যেকোনো জায়গায়) বা ঘোষণাকারী (নিজের এলাকায়); প্রত্যেকে দিনে সর্বোচ্চ ৫টি
create or replace function public.admin_broadcast(p_text text, p_union bigint default null)
returns int language plpgsql security definer set search_path = public as $$
declare aid bigint; n int; adm boolean := public.is_admin(); a public.announcers; ttl text;
begin
  select * into a from public.announcers where user_id = auth.uid();
  if not adm and a.user_id is null then raise exception 'not allowed'; end if;
  if not adm and a.union_id is not null and p_union is distinct from a.union_id then raise exception 'union only'; end if;
  if char_length(btrim(coalesce(p_text, ''))) < 5 then raise exception 'too short'; end if;
  if (select count(*) from public.announcements where admin_id = auth.uid() and created_at > now() - interval '24 hours') >= 5 then raise exception 'announce limit'; end if;
  ttl := coalesce(a.title, null);
  insert into public.announcements (admin_id, body, union_id, sender_title) values (auth.uid(), btrim(p_text), p_union, ttl) returning id into aid;
  insert into public.notifications (user_id, actor_id, type, meta)
  select p.id, auth.uid(), 'announce', jsonb_build_object('text', btrim(p_text), 'aid', aid, 'union', (select name from public.unions where id = p_union), 'from', ttl)
    from public.profiles p
   where p.id <> auth.uid()
     and (case when p_union is null then p.union_id is not null or p.upazila = 'ভালুকা' else p.union_id = p_union end);
  get diagnostics n = row_count;
  update public.announcements set recipients = n where id = aid;
  return n;
end $$;
revoke all on function public.admin_broadcast(text, bigint) from public, anon;
grant execute on function public.admin_broadcast(text, bigint) to authenticated;
