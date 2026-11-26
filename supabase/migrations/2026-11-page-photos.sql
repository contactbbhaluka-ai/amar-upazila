-- =====================================================================
--  পেইজের কভার ছবি, প্রোফাইল ছবির পোস্ট ও ছবির অ্যালবাম
-- =====================================================================
alter table public.pages add column if not exists cover_url text check (char_length(cover_url) <= 500);
alter table public.albums add column if not exists page_id bigint references public.pages(id) on delete cascade;
create index if not exists albums_page_idx on public.albums(page_id, created_at desc);

-- পেইজের অ্যালবাম শুধু পেইজের মালিক তৈরি করতে পারেন
drop policy if exists "albums insert" on public.albums;
create policy "albums insert" on public.albums for insert to authenticated
  with check (user_id = auth.uid() and (page_id is null or exists (select 1 from public.pages pg where pg.id = page_id and pg.owner_id = auth.uid())));

-- পোস্ট: পেইজের নামেও প্রোফাইল/কভার ছবির পোস্ট করা যায়; অ্যালবাম আর পোস্ট একই জায়গার (প্রোফাইল বা একই পেইজ) হতে হবে
drop policy if exists "posts insert" on public.posts;
create policy "posts insert" on public.posts for insert to authenticated
  with check (user_id = auth.uid() and like_count = 0 and comment_count = 0 and reactions = '{}'::jsonb and share_count = 0 and save_count = 0 and pinned_comment_id is null
    and (shared_post_id is null or public.can_share_post(shared_post_id))
    and (page_id is null or exists (select 1 from public.pages pg where pg.id = posts.page_id and pg.owner_id = auth.uid()))
    and (group_id is null or public.is_group_member(group_id))
    and (album_id is null or exists (select 1 from public.albums a where a.id = posts.album_id and a.user_id = auth.uid() and a.page_id is not distinct from posts.page_id))
    and (kind = 'normal' or (group_id is null and shared_post_id is null)));

-- অ্যালবামের ছবি পেইজের পোস্টেও হতে পারে (গ্রুপে নয়)
alter table public.posts drop constraint if exists posts_album_scope;
alter table public.posts add constraint posts_album_scope check (album_id is null or group_id is null);
