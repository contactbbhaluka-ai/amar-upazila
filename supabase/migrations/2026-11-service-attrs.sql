-- ক্যাটাগরিভিত্তিক বাড়তি তথ্য
alter table public.services add column if not exists attrs jsonb not null default '{}'::jsonb;
comment on column public.services.attrs is 'ক্যাটাগরিভিত্তিক বাড়তি তথ্য (যেমন ডাক্তারের বিশেষজ্ঞতা, ভিজিট; হোটেলের রুম, ভাড়া)';
