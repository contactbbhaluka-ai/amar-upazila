-- =====================================================================
--  পেইজের মেসেজ শুধু পেইজে: ব্যক্তিগত মেসেজের তালিকা ও সংখ্যায় নিজের পেইজের মেসেজ দেখায় না
-- =====================================================================
create or replace function public.my_unread()
returns bigint language sql stable security invoker set search_path = public as $$
  select coalesce(sum(unread), 0)::bigint from public.my_conversations() where not as_page;
$$;
create or replace function public.my_page_unread()
returns table (page_id bigint, unread bigint) language sql stable security invoker set search_path = public as $$
  select page_id, coalesce(sum(unread), 0)::bigint from public.my_conversations() where as_page group by page_id;
$$;
grant execute on function public.my_unread() to authenticated;
grant execute on function public.my_page_unread() to authenticated;

-- my_conversations ভেতরে private স্কিমার ফাংশন ডাকে, তাই security definer (WHERE শর্তে শুধু নিজের/নিজের পেইজের মেসেজ)
alter function public.my_conversations() security definer;
alter function public.my_conversations() set search_path = public;
revoke all on function public.my_conversations() from public, anon;
grant execute on function public.my_conversations() to authenticated;
