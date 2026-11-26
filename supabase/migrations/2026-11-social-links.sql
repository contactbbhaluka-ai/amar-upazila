-- আগে schema.sql চালিয়ে থাকলে সোশ্যাল লিংকের জন্য শুধু এই ফাইলটা চালান (বারবার চালালেও সমস্যা নেই)।
-- ---------- সোশ্যাল লিংক (Facebook, WhatsApp, TikTok, YouTube, Instagram) ----------
-- প্রতিটা লিংক শুধু নিজের সাইটের হতে পারে (যেমন facebook ঘরে শুধু facebook.com), যাতে ছদ্মবেশী ক্ষতিকর লিংক না দেওয়া যায়
create or replace function public.valid_social(s jsonb)
returns boolean language sql immutable as $$
  select jsonb_typeof(s) = 'object'
     and not exists (
       select 1 from jsonb_each(s) e
        where e.key not in ('facebook','whatsapp','tiktok','youtube','instagram')
           or jsonb_typeof(e.value) <> 'string'
           or char_length(e.value #>> '{}') > 200
           or (e.value #>> '{}') ~ '[\s<>"''\\]'
           or not ((e.value #>> '{}') ~ case e.key
                when 'facebook'  then '^https://(www\.|m\.|web\.)?(facebook\.com|fb\.com)/.+'
                when 'instagram' then '^https://(www\.)?instagram\.com/.+'
                when 'tiktok'    then '^https://(www\.|vm\.|vt\.)?tiktok\.com/.+'
                when 'youtube'   then '^https://(www\.|m\.)?(youtube\.com|youtu\.be)/.+'
                when 'whatsapp'  then '^https://wa\.me/[0-9]{8,15}$'
              end));
$$;
alter table public.profiles add column if not exists social jsonb not null default '{}'::jsonb;
do $$ begin
  alter table public.profiles add constraint profiles_social_valid check (public.valid_social(social));
exception when duplicate_object then null; end $$;
