-- একটি সেবার একাধিক নম্বর (পদবি/নামসহ) ও ইমেইল — থানা, ইউনিয়ন, প্রশাসন ইত্যাদির জন্য
alter table public.services add column if not exists phones jsonb not null default '[]' check (jsonb_typeof(phones) = 'array' and jsonb_array_length(phones) <= 30);
alter table public.services add column if not exists email text check (email is null or (char_length(email) <= 120 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'));
-- (উপজেলা, পৌরসভা, ১১টি ইউনিয়ন, প্রশাসন, থানা, ফায়ার সার্ভিস ও এম্বুলেন্সের তথ্য beautifulbhaluka.com ও সরকারি/সংবাদ সূত্র থেকে আনা হয়েছে)
