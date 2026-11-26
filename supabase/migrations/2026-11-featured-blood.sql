-- =====================================================================
--  প্রোফাইলে রক্তদানের তথ্য শুরুতে দেখায় না; "প্রোফাইলে কী দেখাবে"-তে বেছে নিলে দেখায়
-- =====================================================================
alter table public.profile_details drop constraint if exists profile_details_featured_check;
alter table public.profile_details add constraint profile_details_featured_check
  check (featured <@ array['works','educations','addr','gender','birth','relationship','religion','orgs','phone','social','joined','blood']::text[]);
