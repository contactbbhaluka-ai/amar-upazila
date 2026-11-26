-- =====================================================================
--  প্রোফাইলে পোস্ট পিন: নিজের প্রোফাইলের একটি পোস্ট সবার উপরে
-- =====================================================================
alter table public.profiles add column if not exists pinned_post_id bigint references public.posts(id) on delete set null;

-- শুধু নিজের প্রোফাইলের (পেইজ/গ্রুপের নয়) পোস্ট পিন করা যায়
create or replace function private.profile_pin_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.pinned_post_id is not null and new.pinned_post_id is distinct from old.pinned_post_id
     and not exists (select 1 from public.posts where id = new.pinned_post_id and user_id = new.id and page_id is null and group_id is null) then
    raise exception 'not allowed';
  end if;
  return new;
end $$;
drop trigger if exists profile_pin_guard on public.profiles;
create trigger profile_pin_guard before update of pinned_post_id on public.profiles for each row execute function private.profile_pin_guard();

create or replace function public.pin_profile_post(p_post bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  update public.profiles set pinned_post_id = p_post where id = auth.uid();
end $$;
