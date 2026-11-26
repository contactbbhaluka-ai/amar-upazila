-- আগে schema.sql চালিয়ে থাকলে কভার ফটো ও অ্যালবামের জন্য শুধু এই ফাইলটা চালান (বারবার চালালেও সমস্যা নেই)।
-- ---------- কভার ফটো ও ফটো অ্যালবাম ----------
alter table public.profiles add column if not exists cover_url text check (char_length(cover_url) <= 500);

create table if not exists public.albums (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  privacy     text not null default 'public' check (privacy in ('public','friends','only_me')),
  created_at  timestamptz not null default now()
);
create index if not exists albums_user_idx on public.albums(user_id, created_at desc);

-- পোস্টের ধরন: সাধারণ / প্রোফাইল ছবি বদল / কভার ছবি বদল; আর কোন অ্যালবামের
alter table public.posts add column if not exists kind text not null default 'normal' check (kind in ('normal','avatar','cover'));
alter table public.posts add column if not exists album_id bigint references public.albums(id) on delete set null;
create index if not exists posts_album_idx on public.posts(album_id) where album_id is not null;
create index if not exists posts_user_kind_idx on public.posts(user_id, kind) where kind <> 'normal';
do $$ begin
  alter table public.posts add constraint posts_album_scope check (album_id is null or (page_id is null and group_id is null));
exception when duplicate_object then null; end $$;

alter table public.albums enable row level security;
drop policy if exists "albums read" on public.albums;
drop policy if exists "albums insert" on public.albums;
drop policy if exists "albums update" on public.albums;
drop policy if exists "albums delete" on public.albums;
create policy "albums read" on public.albums for select using (public.post_visible(user_id, null, privacy));
create policy "albums insert" on public.albums for insert to authenticated with check (user_id = auth.uid());
create policy "albums update" on public.albums for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "albums delete" on public.albums for delete using (user_id = auth.uid() or public.is_admin());

-- অ্যালবামের প্রাইভেসি বদলালে ভেতরের সব ছবির পোস্টও একই প্রাইভেসি পায় (ফেসবুকের মতো)
create or replace function public.sync_album_privacy()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.privacy is distinct from old.privacy then
    update public.posts set privacy = new.privacy where album_id = new.id;
  end if;
  return null;
end $$;
revoke all on function public.sync_album_privacy() from public, anon, authenticated;
drop trigger if exists album_privacy_sync on public.albums;
create trigger album_privacy_sync after update on public.albums for each row execute function public.sync_album_privacy();

-- পোস্ট তৈরি: অ্যালবাম শুধু নিজের, আর প্রোফাইল/কভার ছবির পোস্ট শুধু নিজের টাইমলাইনে
drop policy if exists "posts insert" on public.posts;
create policy "posts insert" on public.posts for insert to authenticated
  with check (user_id = auth.uid() and like_count = 0 and comment_count = 0 and reactions = '{}'::jsonb and share_count = 0 and save_count = 0 and pinned_comment_id is null
    and (shared_post_id is null or public.can_share_post(shared_post_id))
    and (page_id is null or exists (select 1 from public.pages pg where pg.id = page_id and pg.owner_id = auth.uid()))
    and (group_id is null or public.is_group_member(group_id))
    and (album_id is null or exists (select 1 from public.albums a where a.id = album_id and a.user_id = auth.uid()))
    and (kind = 'normal' or (page_id is null and group_id is null and shared_post_id is null)));
