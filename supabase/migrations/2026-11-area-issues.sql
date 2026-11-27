-- ইউনিয়নের এলাকার সমস্যা (ভাঙা রাস্তা, ড্রেন, বাতি ইত্যাদি) ও "আমিও দেখেছি" সমর্থন
create table if not exists public.area_issues (
  id bigint generated always as identity primary key,
  service_id bigint not null references public.services(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  kind text not null default 'other' check (kind in ('road','drain','light','water','waste','other')),
  title text not null check (char_length(title) between 3 and 120),
  body text check (char_length(body) <= 1000),
  place text check (char_length(place) <= 120),
  image_url text,
  lat double precision, lng double precision,
  status text not null default 'open' check (status in ('open','resolved')),
  support_count int not null default 0,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists area_issues_svc on public.area_issues(service_id, status, created_at desc);
create table if not exists public.area_issue_votes (
  issue_id bigint not null references public.area_issues(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (issue_id, user_id)
);
alter table public.area_issues enable row level security;
alter table public.area_issue_votes enable row level security;
drop policy if exists "issues read" on public.area_issues;
create policy "issues read" on public.area_issues for select using (true);
drop policy if exists "issues insert own" on public.area_issues;
create policy "issues insert own" on public.area_issues for insert with check (user_id = auth.uid() and status = 'open' and support_count = 0);
drop policy if exists "issues admin update" on public.area_issues;
create policy "issues admin update" on public.area_issues for update using (is_admin());
drop policy if exists "issues delete own or admin" on public.area_issues;
create policy "issues delete own or admin" on public.area_issues for delete using (user_id = auth.uid() or is_admin());
drop policy if exists "issue votes read" on public.area_issue_votes;
create policy "issue votes read" on public.area_issue_votes for select using (true);
drop policy if exists "issue votes insert own" on public.area_issue_votes;
create policy "issue votes insert own" on public.area_issue_votes for insert with check (user_id = auth.uid());
drop policy if exists "issue votes delete own" on public.area_issue_votes;
create policy "issue votes delete own" on public.area_issue_votes for delete using (user_id = auth.uid());
-- সমর্থন গণনা ও দিনে সর্বোচ্চ ৫টি সমস্যা
create or replace function public.area_issue_vote_count() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update area_issues set support_count = (select count(*) from area_issue_votes where issue_id = coalesce(new.issue_id, old.issue_id)) where id = coalesce(new.issue_id, old.issue_id);
  return null;
end $$;
drop trigger if exists area_issue_votes_count on public.area_issue_votes;
create trigger area_issue_votes_count after insert or delete on public.area_issue_votes for each row execute function public.area_issue_vote_count();
create or replace function public.area_issue_limit() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from area_issues where user_id = new.user_id and created_at > now() - interval '1 day') >= 5 then
    raise exception 'দিনে সর্বোচ্চ ৫টি সমস্যা জানানো যায়' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists area_issues_limit on public.area_issues;
create trigger area_issues_limit before insert on public.area_issues for each row execute function public.area_issue_limit();
create or replace function public.area_issue_resolved_at() returns trigger language plpgsql as $$
begin new.resolved_at := case when new.status = 'resolved' then coalesce(new.resolved_at, now()) else null end; return new; end $$;
drop trigger if exists area_issues_resolved on public.area_issues;
create trigger area_issues_resolved before update on public.area_issues for each row execute function public.area_issue_resolved_at();
alter function public.area_issue_resolved_at() set search_path = public;
