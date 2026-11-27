-- সেবার বিস্তারিত লেখা ও ছবির গ্যালারি (ওয়েবসাইট বন্ধ হলেও অ্যাপে সব থাকবে)
alter table public.services add column if not exists details text check (details is null or char_length(details) <= 20000);
alter table public.services add column if not exists images text[] not null default '{}' check (cardinality(images) <= 12);
