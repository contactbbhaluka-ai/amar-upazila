-- ইউনিয়ন পরিষদের চেয়ারম্যান-সদস্যদের তালিকা: [{r: পদ, n: নাম, w: ওয়ার্ড, p: মোবাইল}]
alter table public.services add column if not exists council jsonb not null default '[]' check (jsonb_typeof(council) = 'array' and jsonb_array_length(council) <= 60);
