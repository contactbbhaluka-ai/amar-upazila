-- হাট বাজার: হাটবার, হাটের সময়, কী পাওয়া যায়, মৌসুমি হাটের সময়কাল
alter table public.services add column if not exists hat_days smallint[] not null default '{}';
alter table public.services add column if not exists hat_time text check (hat_time in ('morning','afternoon','evening','allday'));
alter table public.services add column if not exists goods text[] not null default '{}';
alter table public.services add column if not exists season_from date;
alter table public.services add column if not exists season_to date;
comment on column public.services.hat_days is 'হাটবার: ০=রবিবার … ৬=শনিবার; খালি = প্রতিদিন';
