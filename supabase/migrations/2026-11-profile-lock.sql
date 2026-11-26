-- =====================================================================
--  প্রোফাইল লক: লক করলে বন্ধু ছাড়া কেউ প্রোফাইলের পোস্ট, ছবি/অ্যালবাম,
--  বিস্তারিত (About) ও বন্ধু/ফলোয়ার তালিকা দেখতে পারবে না।
--  নাম, প্রোফাইল ছবি ও কভার আগের মতো সবাই দেখবে।
-- =====================================================================
alter table public.profiles add column if not exists locked boolean not null default false;

create or replace function private.profile_hidden(owner uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = owner and locked)
     and owner is distinct from auth.uid()
     and not coalesce(private.are_friends(owner, auth.uid()), false)
     and not public.is_admin();
$$;
-- RLS নীতিতে লাগে বলে execute থাকছে; private স্কিমায় usage নেই বলে সরাসরি ডাকা যায় না
grant execute on function private.profile_hidden(uuid) to public;

-- পোস্ট: পেইজ/গ্রুপের পোস্ট লকের আওতায় নয়
drop policy if exists "posts read" on public.posts;
create policy "posts read" on public.posts for select using (
  public.post_visible(user_id, group_id, privacy)
  and (posts.page_id is not null or posts.group_id is not null or not private.profile_hidden(posts.user_id))
);

drop policy if exists "albums read" on public.albums;
create policy "albums read" on public.albums for select using (
  public.post_visible(user_id, null::bigint, privacy)
  and (albums.page_id is not null or not private.profile_hidden(albums.user_id))
);

-- About: পুরোনো ফাংশনটি private-এ সরিয়ে উপরে লকের পাহারা
do $$ begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'private' and p.proname = 'profile_about_full') then
    alter function public.profile_about(uuid) rename to profile_about_full;
    alter function public.profile_about_full(uuid) set schema private;
  end if;
end $$;
revoke all on function private.profile_about_full(uuid) from public, anon, authenticated;

create or replace function public.profile_about(uid uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if private.profile_hidden(uid) then return jsonb_build_object('locked', true); end if;
  return private.profile_about_full(uid);
end $$;
grant execute on function public.profile_about(uuid) to anon, authenticated;

-- বন্ধু/ফলোয়ার/ফলোয়িং তালিকা
do $$ declare d text; begin
  d := pg_get_functiondef('public.list_people(uuid,text)'::regprocedure);
  if position('profile_hidden' in d) = 0 then
    d := replace(d, 'into vis from public.profiles where id = uid;',
      'into vis from public.profiles where id = uid;
  if private.profile_hidden(uid) then return jsonb_build_object(''allowed'', false, ''visibility'', ''locked'', ''ids'', ''[]''::jsonb); end if;');
    execute d;
  end if;
end $$;
