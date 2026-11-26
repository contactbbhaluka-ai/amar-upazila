-- =====================================================================
--  পোস্টের ধরন: আগে থেকে কিছু বাছাই থাকবে না (খালি রাখা যায়), নতুন ধরন যোগ
-- =====================================================================
alter table public.posts alter column category drop not null;
alter table public.posts drop constraint if exists posts_category_check;
alter table public.posts add constraint posts_category_check check (category is null or category in (
  'খবর','সাহায্য চাই','হারানো-প্রাপ্তি','কেনা-বেচা','অনুষ্ঠান','প্রশ্ন',
  'গান','কবিতা','গল্প','শুভেচ্ছা','চাকরি','শিক্ষা','খেলাধুলা','কৃষি','স্বাস্থ্য','ধর্ম','রান্না','ভ্রমণ'));
