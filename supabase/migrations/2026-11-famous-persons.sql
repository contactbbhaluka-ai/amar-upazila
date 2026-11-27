-- প্রসিদ্ধ ব্যক্তি: পরিচিতি, জীবনকাল ও YouTube ভিডিও; beautifulbhaluka.com থেকে ৬ জনের তথ্য
alter table public.services add column if not exists videos text[] not null default '{}' check (cardinality(videos) <= 10);
alter table public.services add column if not exists tagline text check (tagline is null or char_length(tagline) <= 120);
alter table public.services add column if not exists life text check (life is null or char_length(life) <= 80);
-- (তথ্য, ছবি ও ভিডিও import-wp ফাংশন দিয়ে আনা হয়েছে; নতুন প্রজেক্টে অ্যাপের "＋ যোগ করুন" থেকে যোগ করুন)
