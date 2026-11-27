-- সেবা ডিরেক্টরির উপরের ব্যানার স্লাইডার (অ্যাডমিন দেন, সবাই দেখেন)
create table if not exists public.dir_banners (
  id         bigint generated always as identity primary key,
  title      text not null default '' check (char_length(title) <= 80),
  subtitle   text not null default '' check (char_length(subtitle) <= 140),
  image_url  text check (image_url is null or char_length(image_url) <= 500),
  color      text not null default 'green' check (color in ('green','blue','red','orange','purple','teal')),
  link       text not null default '' check (char_length(link) <= 300),
  sort       int not null default 0,
  active     boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
alter table public.dir_banners enable row level security;
drop policy if exists "dir banners read" on public.dir_banners;
drop policy if exists "dir banners admin" on public.dir_banners;
create policy "dir banners read" on public.dir_banners for select using (active or public.is_admin());
create policy "dir banners admin" on public.dir_banners for all to authenticated using (public.is_admin()) with check (public.is_admin());
