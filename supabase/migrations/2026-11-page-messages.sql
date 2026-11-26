-- =====================================================================
--  পেইজে মেসেজ ও অটো মেসেজ
--  • যে কেউ পেইজকে মেসেজ পাঠাতে পারেন; পেইজের মালিক পেইজের নামে উত্তর দেন
--  • মালিক অটো মেসেজ চালু রাখলে কেউ মেসেজ পাঠালেই সাথে সাথে সেটা উত্তর হিসেবে যায়
--    (একই মানুষকে ২৪ ঘণ্টায় একবার; পেইজ নিজে উত্তর দিয়ে থাকলে আর যায় না)
-- =====================================================================

alter table public.messages add column if not exists page_id bigint references public.pages(id) on delete cascade;
alter table public.messages add column if not exists is_auto boolean not null default false;
create index if not exists messages_page_idx on public.messages(page_id, created_at desc);

alter table public.pages add column if not exists auto_reply text check (char_length(auto_reply) <= 1000);
alter table public.pages add column if not exists auto_reply_on boolean not null default false;

drop policy if exists "messages send" on public.messages;
create policy "messages send" on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and read_at is null and is_auto = false and not public.is_blocked(sender_id, recipient_id)
    and (page_id is null or exists (select 1 from public.pages pg where pg.id = messages.page_id and pg.owner_id in (messages.sender_id, messages.recipient_id))));

-- কথোপকথনের তালিকা: সাধারণ মেসেজ, পেইজকে পাঠানো মেসেজ, আর নিজের পেইজে আসা মেসেজ
drop function if exists public.my_conversations();
create or replace function public.my_conversations()
returns table (partner_id uuid, page_id bigint, as_page boolean, page_name text, name text, avatar_url text, last_body text, last_at timestamptz, last_mine boolean, unread bigint)
language sql stable security invoker set search_path = public as $$
  with m as (
    select case when sender_id = auth.uid() then recipient_id else sender_id end as partner, page_id,
           body, created_at, sender_id = auth.uid() as mine,
           (recipient_id = auth.uid() and read_at is null) as un
      from public.messages
     where auth.uid() in (sender_id, recipient_id)
  ), last as (
    select distinct on (partner, coalesce(page_id, 0)) partner, page_id, body, created_at, mine from m order by partner, coalesce(page_id, 0), created_at desc
  )
  select l.partner, l.page_id, coalesce(pg.owner_id = auth.uid(), false), pg.name,
         case when l.page_id is not null and pg.owner_id <> auth.uid() then pg.name else p.name end,
         case when l.page_id is not null and pg.owner_id <> auth.uid() then pg.avatar_url else p.avatar_url end,
         l.body, l.created_at, l.mine,
         (select count(*) from m where m.partner = l.partner and m.page_id is not distinct from l.page_id and m.un)
    from last l join public.profiles p on p.id = l.partner left join public.pages pg on pg.id = l.page_id
   order by l.created_at desc;
$$;

create or replace function public.mark_read2(partner uuid, p_page bigint default null)
returns void language sql security definer set search_path = public as $$
  update public.messages set read_at = now()
   where recipient_id = auth.uid() and sender_id = partner and page_id is not distinct from p_page and read_at is null;
$$;
revoke all on function public.mark_read2(uuid, bigint) from public, anon;
grant execute on function public.mark_read2(uuid, bigint) to authenticated;

create or replace function public.on_page_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare pg public.pages;
begin
  if new.page_id is null or new.is_auto then return null; end if;
  select * into pg from public.pages where id = new.page_id;
  if not found or pg.owner_id <> new.recipient_id or not pg.auto_reply_on or coalesce(trim(pg.auto_reply), '') = '' then return null; end if;
  if exists (select 1 from public.messages where page_id = new.page_id and sender_id = pg.owner_id and recipient_id = new.sender_id
              and created_at > now() - interval '24 hours') then return null; end if;
  insert into public.messages (sender_id, recipient_id, body, page_id, is_auto) values (pg.owner_id, new.sender_id, pg.auto_reply, new.page_id, true);
  return null;
exception when others then return null;
end $$;
revoke all on function public.on_page_message() from public, anon, authenticated;
drop trigger if exists page_auto_reply on public.messages;
create trigger page_auto_reply after insert on public.messages for each row execute function public.on_page_message();
