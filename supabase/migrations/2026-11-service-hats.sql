-- ইউনিয়নের হাট-বাজার ও হাটবার
alter table public.services add column if not exists hats jsonb not null default '[]'::jsonb;
comment on column public.services.hats is 'হাট-বাজার ও হাটবার: [{n: নাম, d: [0-6 দিন, 0=রবিবার], t: নোট}]';
