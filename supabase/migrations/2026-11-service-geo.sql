-- সেবা ডিরেক্টরি: ম্যাপে অবস্থান (কাছের সেবা দূরত্বসহ দেখাতে)
alter table public.services add column if not exists lat double precision check (lat between -90 and 90);
alter table public.services add column if not exists lng double precision check (lng between -180 and 180);
