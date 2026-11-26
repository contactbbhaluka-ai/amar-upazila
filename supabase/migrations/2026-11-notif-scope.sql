-- =====================================================================
--  পেইজ হিসেবে থাকলে শুধু পেইজের নোটিফিকেশন; নিজের প্রোফাইলে পেইজেরগুলো বাদ
-- =====================================================================
create or replace function public.mark_notifications_read_ids(p_ids bigint[])
returns void language sql security definer set search_path = public as $$
  update public.notifications set read = true where user_id = auth.uid() and not read and id = any (p_ids);
$$;
revoke all on function public.mark_notifications_read_ids(bigint[]) from public, anon;
grant execute on function public.mark_notifications_read_ids(bigint[]) to authenticated;

-- পেইজের ব্যাজের নোটিফিকেশনে পেইজের id-ও রাখা
do $$ declare d text; begin
  select pg_get_functiondef('public.decide_verification(bigint,boolean,text)'::regprocedure) into d;
  d := replace(d, $q$jsonb_build_object('page', pname)$q$, $q$jsonb_build_object('page', pname, 'page_id', r.page_id)$q$);
  if position($q$'page_id', r.page_id$q$ in d) = 0 then raise exception 'patch failed'; end if;
  execute d;
end $$;
