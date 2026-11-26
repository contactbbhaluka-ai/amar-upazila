-- =====================================================================
--  পেইজ হিসেবে চলা (ফেসবুকের মতো প্রোফাইল বদল): পেইজের নামে মন্তব্য
--  (পোস্ট ও মেসেজ পেইজের নামে আগেই করা যেত)
-- =====================================================================
alter table public.comments add column if not exists page_id bigint references public.pages(id) on delete cascade;

drop policy if exists "comments insert" on public.comments;
create policy "comments insert" on public.comments for insert to authenticated
  with check (user_id = auth.uid() and public.can_see_post(post_id) and like_count = 0 and reactions = '{}'::jsonb
    and edited_at is null and public.reply_parent_ok(parent_id, post_id)
    and (page_id is null or private.is_page_staff(comments.page_id, auth.uid())));
