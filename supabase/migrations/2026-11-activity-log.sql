-- আমার কার্যকলাপ: কখন রিয়্যাক্ট দিয়েছেন তা দেখাতে likes-এ সময় যোগ
-- (আগের রিয়্যাক্টগুলোর সময় হবে এই মাইগ্রেশন চালানোর সময়)
alter table public.likes add column if not exists created_at timestamptz not null default now();
create index if not exists likes_user_time_idx on public.likes (user_id, created_at desc);
create index if not exists comments_user_time_idx on public.comments (user_id, created_at desc);
create index if not exists posts_user_shared_idx on public.posts (user_id, created_at desc) where shared_post_id is not null;
