-- =====================================================================
--  আমার উপজেলা — Supabase ডেটাবেস স্কিমা
--  ব্যবহার: Supabase Dashboard → SQL Editor → New query → পুরোটা পেস্ট করে Run
--  একবারই চালাতে হবে। আবার চালালে আগের টেবিলগুলো থাকলে error দেবে।
-- =====================================================================

-- ---------- ১. এলাকা ----------
create table public.upazilas (
  id          bigint generated always as identity primary key,
  name        text not null,
  district    text not null,
  created_at  timestamptz not null default now()
);

create table public.unions (
  id          bigint generated always as identity primary key,
  upazila_id  bigint not null references public.upazilas(id) on delete cascade,
  name        text not null,
  sort        int not null default 0
);
create index on public.unions(upazila_id);

-- ---------- ২. ইউজার প্রোফাইল ----------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 2 and 40),
  union_id    bigint references public.unions(id) on delete set null,
  district    text check (char_length(district) <= 40),     -- জেলা
  upazila     text check (char_length(upazila) <= 40),      -- উপজেলা (ভালুকা হলে union_id-ও থাকে)
  blood_group text check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),  -- খালি = জানা নেই
  donor_visible boolean not null default true,              -- ব্লাড ব্যাংকে দেখাবে কিনা
  last_donated date,                                        -- সর্বশেষ রক্তদানের তারিখ (খালি = কখনো দেননি / মনে নেই)
  avatar_url  text check (char_length(avatar_url) <= 500),
  bio         text check (char_length(bio) <= 160),
  role        text not null default 'user' check (role in ('user','admin')),
  created_at  timestamptz not null default now()
);
create index on public.profiles(union_id);
create index on public.profiles(blood_group) where blood_group is not null;

-- মোবাইল নম্বর আলাদা টেবিলে, যাতে শুধু নিজে দেখতে পারে
-- (ব্লাড ব্যাংকে শুধু লগইন করা ব্যবহারকারীরা ডোনারের নম্বর দেখেন, blood_donors() দিয়ে)
create table public.profile_private (
  user_id  uuid primary key references public.profiles(id) on delete cascade,
  phone    text check (phone ~ '^01[3-9][0-9]{8}$')
);

-- সাইনআপের সময় দেওয়া নাম ও ইউনিয়ন দিয়ে স্বয়ংক্রিয়ভাবে প্রোফাইল তৈরি
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, union_id, district, upazila, blood_group, last_donated)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), 'নতুন সদস্য'),
    nullif(new.raw_user_meta_data->>'union_id', '')::bigint,
    nullif(left(new.raw_user_meta_data->>'district', 40), ''),
    nullif(left(new.raw_user_meta_data->>'upazila', 40), ''),
    case when new.raw_user_meta_data->>'blood_group' in ('A+','A-','B+','B-','AB+','AB-','O+','O-')
         then new.raw_user_meta_data->>'blood_group' end,
    case when (new.raw_user_meta_data->>'last_donated') ~ '^\d{4}-\d{2}-\d{2}$'
          and (new.raw_user_meta_data->>'last_donated')::date <= current_date
         then (new.raw_user_meta_data->>'last_donated')::date end
  );
  if (new.raw_user_meta_data->>'phone') ~ '^01[3-9][0-9]{8}$' then
    insert into public.profile_private (user_id, phone) values (new.id, new.raw_user_meta_data->>'phone');
  end if;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- অ্যাডমিন কিনা যাচাই (RLS-এ ব্যবহারের জন্য)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------- ২ক. পেইজ ও গ্রুপ ----------
create table public.pages (
  id              bigint generated always as identity primary key,
  owner_id        uuid not null references public.profiles(id) on delete cascade,
  name            text not null check (char_length(name) between 2 and 60),
  category        text not null check (char_length(category) between 2 and 40),
  about           text check (char_length(about) <= 300),
  phone           text check (char_length(phone) <= 20),
  avatar_url      text check (char_length(avatar_url) <= 500),
  follower_count  int not null default 0,
  created_at      timestamptz not null default now()
);
create index on public.pages(owner_id);

create table public.page_follows (
  page_id     bigint not null references public.pages(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (page_id, user_id)
);
create index on public.page_follows(user_id);

create table public.groups (
  id            bigint generated always as identity primary key,
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  name          text not null check (char_length(name) between 2 and 60),
  about         text check (char_length(about) <= 300),
  privacy       text not null default 'public' check (privacy in ('public','private')),
  avatar_url    text check (char_length(avatar_url) <= 500),
  member_count  int not null default 0,
  created_at    timestamptz not null default now()
);

create table public.group_members (
  group_id    bigint not null references public.groups(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        text not null default 'member' check (role in ('admin','member')),
  status      text not null default 'active' check (status in ('active','pending')),
  created_at  timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index on public.group_members(user_id, status);

create or replace function public.is_group_admin(gid bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.group_members where group_id = gid and user_id = auth.uid() and role = 'admin' and status = 'active');
$$;
create or replace function public.is_group_member(gid bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.group_members where group_id = gid and user_id = auth.uid() and status = 'active');
$$;
-- পাবলিক গ্রুপ সবাই দেখে; প্রাইভেট গ্রুপের পোস্ট শুধু সদস্যরা
create or replace function public.can_see_group(gid bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.groups where id = gid and privacy = 'public') or public.is_group_member(gid) or public.is_admin();
$$;

-- গ্রুপ তৈরি করলে তৈরিকারী স্বয়ংক্রিয়ভাবে অ্যাডমিন
create or replace function public.on_group_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.group_members (group_id, user_id, role, status) values (new.id, new.owner_id, 'admin', 'active');
  return null;
end $$;
create trigger group_owner_admin after insert on public.groups for each row execute function public.on_group_created();

-- সদস্য ও ফলোয়ার সংখ্যা স্বয়ংক্রিয়ভাবে হালনাগাদ
create or replace function public.bump_group_counts()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'page_follows' then
    update public.pages set follower_count = (select count(*) from public.page_follows where page_id = coalesce(new.page_id, old.page_id))
     where id = coalesce(new.page_id, old.page_id);
  else
    update public.groups set member_count = (select count(*) from public.group_members where group_id = coalesce(new.group_id, old.group_id) and status = 'active')
     where id = coalesce(new.group_id, old.group_id);
  end if;
  return null;
end $$;
create trigger page_follow_count after insert or delete on public.page_follows for each row execute function public.bump_group_counts();
create trigger group_member_count after insert or update or delete on public.group_members for each row execute function public.bump_group_counts();

-- ---------- ৩. পোস্ট, মন্তব্য, লাইক ----------
create table public.posts (
  id             bigint generated always as identity primary key,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  union_id       bigint references public.unions(id) on delete set null,
  page_id        bigint references public.pages(id) on delete cascade,   -- পেইজের নামে পোস্ট
  group_id       bigint references public.groups(id) on delete cascade,  -- গ্রুপের ভেতরের পোস্ট
  shared_post_id bigint references public.posts(id) on delete set null,  -- অন্য পোস্ট শেয়ার করলে
  share_count    int not null default 0,
  save_count     int not null default 0,
  pinned_comment_id bigint,                                               -- পোস্টের মালিকের পিন করা কমেন্ট
  category       text not null check (category in ('খবর','সাহায্য চাই','হারানো-প্রাপ্তি','কেনা-বেচা','অনুষ্ঠান','প্রশ্ন')),
  body           text not null default '' check (char_length(body) <= 1000),
  image_url      text check (char_length(image_url) <= 500),            -- প্রথম ছবি (পুরনো ব্যবস্থার সঙ্গে মিল রাখতে)
  image_urls     text[] not null default '{}' check (cardinality(image_urls) <= 10),  -- সর্বোচ্চ ১০টি ছবি
  privacy        text not null default 'public' check (privacy in ('public','friends','only_me')),  -- কারা দেখবে
  like_count     int not null default 0,              -- মোট রিয়্যাক্ট
  reactions      jsonb not null default '{}'::jsonb,  -- ধরন অনুযায়ী রিয়্যাক্ট সংখ্যা, যেমন {"like":3,"love":1}
  comment_count  int not null default 0,
  created_at     timestamptz not null default now(),
  edited_at      timestamptz,                         -- শেষবার এডিট করার সময় ("সম্পাদিত" দেখাতে)
  check (char_length(body) > 0 or image_url is not null or cardinality(image_urls) > 0 or shared_post_id is not null),
  check (page_id is null or group_id is null),
  check ((page_id is null and group_id is null) or privacy = 'public')   -- পেইজ ও গ্রুপের পোস্টে আলাদা প্রাইভেসি নেই
);
create index on public.posts(created_at desc);
create index on public.posts(user_id, created_at desc);
create index on public.posts(page_id, created_at desc);
create index on public.posts(group_id, created_at desc);

create or replace function public.can_see_post(pid bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.posts where id = pid and (group_id is null or public.can_see_group(group_id)));
$$;
-- প্রাইভেট গ্রুপের পোস্ট বাইরে শেয়ার করা যায় না
create or replace function public.can_share_post(pid bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.posts p left join public.groups g on g.id = p.group_id
                  where p.id = pid and p.privacy = 'public' and (p.group_id is null or g.privacy = 'public'));
$$;

create table public.saved_posts (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  post_id     bigint not null references public.posts(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, post_id)
);
-- কতজন সেভ করেছেন (কে করেছেন তা গোপন থাকে)
create or replace function public.bump_saves()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.posts set save_count = greatest(save_count + (case when tg_op = 'INSERT' then 1 else -1 end), 0)
   where id = coalesce(new.post_id, old.post_id);
  return null;
end $$;
create trigger post_saves after insert or delete on public.saved_posts for each row execute function public.bump_saves();
create index on public.posts(union_id, created_at desc);

create table public.comments (
  id          bigint generated always as identity primary key,
  post_id     bigint not null references public.posts(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 300),
  like_count  int not null default 0,
  reactions   jsonb not null default '{}'::jsonb,
  parent_id   bigint references public.comments(id) on delete cascade,   -- উত্তর হলে মূল মন্তব্যের id (এক ধাপ)
  edited_at   timestamptz,                                               -- এডিট করলে সময়
  created_at  timestamptz not null default now()
);
create index on public.comments(post_id, created_at);
create index on public.comments(parent_id);
alter table public.posts add constraint posts_pinned_comment_fk foreign key (pinned_comment_id) references public.comments(id) on delete set null;

-- কমেন্টে রিয়্যাক্ট
create table public.comment_likes (
  comment_id  bigint not null references public.comments(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  reaction    text not null default 'like' check (reaction in ('like','love','haha','wow','sad','angry')),
  primary key (comment_id, user_id)
);
create or replace function public.bump_comment_reacts()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.comments set like_count = like_count + 1,
      reactions = jsonb_set(reactions, array[new.reaction], to_jsonb(coalesce((reactions->>new.reaction)::int, 0) + 1)) where id = new.comment_id;
  elsif tg_op = 'DELETE' then
    update public.comments set like_count = greatest(like_count - 1, 0),
      reactions = jsonb_set(reactions, array[old.reaction], to_jsonb(greatest(coalesce((reactions->>old.reaction)::int, 0) - 1, 0))) where id = old.comment_id;
  elsif new.reaction <> old.reaction then
    update public.comments set reactions = jsonb_set(jsonb_set(reactions,
        array[old.reaction], to_jsonb(greatest(coalesce((reactions->>old.reaction)::int, 0) - 1, 0))),
        array[new.reaction], to_jsonb(coalesce((reactions->>new.reaction)::int, 0) + 1)) where id = new.comment_id;
  end if;
  return null;
end $$;
create trigger comment_reacts after insert or update or delete on public.comment_likes for each row execute function public.bump_comment_reacts();

-- শেয়ার সংখ্যা
create or replace function public.bump_shares()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and new.shared_post_id is not null then
    update public.posts set share_count = share_count + 1 where id = new.shared_post_id;
  elsif tg_op = 'DELETE' and old.shared_post_id is not null then
    update public.posts set share_count = greatest(share_count - 1, 0) where id = old.shared_post_id;
  end if;
  return null;
end $$;
create trigger post_shares after insert or delete on public.posts for each row execute function public.bump_shares();

-- রিয়্যাক্ট (একজন একটি পোস্টে একটিই রিয়্যাক্ট দিতে পারেন, বদলানো যায়)
create table public.likes (
  post_id   bigint not null references public.posts(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  reaction  text not null default 'like' check (reaction in ('like','love','haha','wow','sad','angry')),
  primary key (post_id, user_id)
);

-- লাইক ও মন্তব্যের সংখ্যা স্বয়ংক্রিয়ভাবে হালনাগাদ
create or replace function public.bump_counts()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'likes' then
    if tg_op = 'INSERT' then
      update public.posts set like_count = like_count + 1,
        reactions = jsonb_set(reactions, array[new.reaction], to_jsonb(coalesce((reactions->>new.reaction)::int, 0) + 1))
       where id = new.post_id;
    elsif tg_op = 'DELETE' then
      update public.posts set like_count = greatest(like_count - 1, 0),
        reactions = jsonb_set(reactions, array[old.reaction], to_jsonb(greatest(coalesce((reactions->>old.reaction)::int, 0) - 1, 0)))
       where id = old.post_id;
    elsif new.reaction <> old.reaction then
      update public.posts set reactions = jsonb_set(jsonb_set(reactions,
          array[old.reaction], to_jsonb(greatest(coalesce((reactions->>old.reaction)::int, 0) - 1, 0))),
          array[new.reaction], to_jsonb(coalesce((reactions->>new.reaction)::int, 0) + 1))
       where id = new.post_id;
    end if;
  else
    update public.posts set comment_count = comment_count + (case when tg_op = 'INSERT' then 1 else -1 end)
      where id = coalesce(new.post_id, old.post_id);
  end if;
  return null;
end $$;

create trigger likes_count    after insert or update or delete on public.likes for each row execute function public.bump_counts();
create trigger comments_count after insert or delete on public.comments for each row execute function public.bump_counts();

-- ---------- ৩ক. ব্লক, বন্ধুত্ব, ফলো ----------
create table public.blocks (
  blocker_id  uuid not null references public.profiles(id) on delete cascade,
  blocked_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- দুইজনের যেকোনো একজন অন্যজনকে ব্লক করেছে কিনা
create or replace function public.is_blocked(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a));
$$;

create table public.friendships (
  requester   uuid not null references public.profiles(id) on delete cascade,
  addressee   uuid not null references public.profiles(id) on delete cascade,
  status      text not null default 'pending' check (status in ('pending','accepted')),
  created_at  timestamptz not null default now(),
  primary key (requester, addressee),
  check (requester <> addressee)
);
-- একই দুইজনের মধ্যে একটাই সম্পর্ক (যে দিক থেকেই রিকোয়েস্ট যাক)
create unique index friendships_pair on public.friendships (least(requester, addressee), greatest(requester, addressee));
create index on public.friendships(addressee, status);

create or replace function public.are_friends(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select a is not null and b is not null and exists (select 1 from public.friendships
    where status = 'accepted' and ((requester = a and addressee = b) or (requester = b and addressee = a)));
$$;

-- পোস্ট কে দেখতে পারবে: গ্রুপের নিয়ম + পোস্টের প্রাইভেসি (পাবলিক / বন্ধুরা / শুধু আমি)
create or replace function public.post_visible(p_user uuid, p_group bigint, p_privacy text)
returns boolean language sql stable security definer set search_path = public as $$
  select (p_group is null or public.can_see_group(p_group))
     and (p_privacy = 'public' or p_user = auth.uid() or public.is_admin()
          or (p_privacy = 'friends' and public.are_friends(auth.uid(), p_user)));
$$;
create or replace function public.can_see_post(pid bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.posts where id = pid and public.post_visible(user_id, group_id, privacy));
$$;

-- পোস্টে ট্যাগ করা বন্ধু
create table public.post_tags (
  post_id  bigint not null references public.posts(id) on delete cascade,
  user_id  uuid not null references public.profiles(id) on delete cascade,
  primary key (post_id, user_id)
);
create index on public.post_tags(user_id);

create table public.follows (
  follower_id  uuid not null references public.profiles(id) on delete cascade,
  followee_id  uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index on public.follows(followee_id);

-- ফ্রেন্ড রিকোয়েস্ট গ্রহণ (শুধু যাকে পাঠানো হয়েছে সে-ই পারবে)
create or replace function public.accept_friend(from_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.friendships set status = 'accepted'
   where requester = from_user and addressee = auth.uid() and status = 'pending';
  if not found then raise exception 'no pending request'; end if;
  insert into public.follows (follower_id, followee_id) values (auth.uid(), from_user) on conflict do nothing;
end $$;
revoke all on function public.accept_friend(uuid) from public, anon;
grant execute on function public.accept_friend(uuid) to authenticated;

-- ব্লক করলে দুজনের বন্ধুত্ব ও ফলো মুছে যায়
create or replace function public.on_block()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.friendships
   where (requester = new.blocker_id and addressee = new.blocked_id) or (requester = new.blocked_id and addressee = new.blocker_id);
  delete from public.follows
   where (follower_id = new.blocker_id and followee_id = new.blocked_id) or (follower_id = new.blocked_id and followee_id = new.blocker_id);
  return new;
end $$;
create trigger blocks_cleanup after insert on public.blocks for each row execute function public.on_block();

-- অ্যাপের সেটিংস (অ্যাডমিন ড্যাশবোর্ড থেকে বদলানো যায়)
create table public.app_settings (
  key         text primary key,
  value       jsonb not null,
  updated_by  uuid references public.profiles(id) on delete set null,
  updated_at  timestamptz not null default now()
);
insert into public.app_settings (key, value) values ('public_donor_phone', 'false');  -- লগইন ছাড়া ডোনারের নম্বর দেখানো
insert into public.app_settings (key, value) values
  ('feature_blood', 'true'), ('feature_groups', 'true'), ('feature_pages', 'true'),
  ('announcement', '""'), ('min_app_version', '0'), ('latest_app_version', '0')
on conflict (key) do nothing;   -- ফিচার চালু/বন্ধ, ঘোষণা ও অ্যাপ ভার্সন (অ্যাডমিন ড্যাশবোর্ড থেকে বদলানো যায়)

create or replace function public.setting_on(k text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select value = 'true'::jsonb from public.app_settings where key = k), false);
$$;

-- অ্যাডমিন ড্যাশবোর্ডের সংখ্যা
create or replace function public.admin_stats()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not admin'; end if;
  return jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'donors', (select count(*) from public.profiles where blood_group is not null and donor_visible),
    'manual_donors', (select count(*) from public.manual_donors),
    'posts', (select count(*) from public.posts),
    'pending_services', (select count(*) from public.services where not verified),
    'open_reports', (select count(*) from public.reports where not resolved));
end $$;
revoke all on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated;

-- হাতে যোগ করা ডোনার: অ্যাপে অ্যাকাউন্ট নেই এমন কারও ডোনার প্রোফাইল, যোগকারী নিজে পরিচালনা করেন
create table public.manual_donors (
  id            bigint generated always as identity primary key,
  created_by    uuid not null references public.profiles(id) on delete cascade,
  name          text not null check (char_length(name) between 2 and 40),
  district      text check (char_length(district) <= 40),
  upazila       text check (char_length(upazila) <= 40),
  union_id      bigint references public.unions(id) on delete set null,
  phone         text not null check (phone ~ '^01[3-9][0-9]{8}$'),
  blood_group   text not null check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  last_donated  date,
  created_at    timestamptz not null default now(),
  unique (created_by, phone)
);
create index on public.manual_donors(blood_group);

-- ব্লাড ব্যাংক: (১) ব্লাড গ্রুপ দেওয়া ও "ডোনার তালিকায় দেখান" চালু থাকা সব অ্যাকাউন্ট
--               (২) হাতে যোগ করা ডোনার
-- ফোন নম্বর লগইন করা ব্যবহারকারীরা পান; অ্যাডমিন "public_donor_phone" চালু করলে সবাই
create or replace function public.blood_donors(p_group text default null, p_upazila text default null)
returns table (id uuid, manual_id bigint, name text, avatar_url text, blood_group text, union_id bigint, union_name text,
               upazila text, district text, phone text, last_donated date, added_by uuid, added_by_name text)
language sql stable security definer set search_path = public as $$
  select * from (
    select p.id, null::bigint, p.name, p.avatar_url, p.blood_group, p.union_id, u.name, p.upazila, p.district,
           case when auth.uid() is not null or public.setting_on('public_donor_phone') then pp.phone end, p.last_donated, null::uuid, null::text
      from public.profiles p
      left join public.unions u on u.id = p.union_id
      left join public.profile_private pp on pp.user_id = p.id
     where p.blood_group is not null and p.donor_visible
       and (auth.uid() is null or not public.is_blocked(auth.uid(), p.id))
    union all
    select null::uuid, m.id, m.name, null, m.blood_group, m.union_id, u.name, m.upazila, m.district,
           case when auth.uid() is not null or public.setting_on('public_donor_phone') then m.phone end, m.last_donated, m.created_by, c.name
      from public.manual_donors m
      join public.profiles c on c.id = m.created_by
      left join public.unions u on u.id = m.union_id
     where auth.uid() is null or not public.is_blocked(auth.uid(), m.created_by)
  ) d (id, manual_id, name, avatar_url, blood_group, union_id, union_name, upazila, district, phone, last_donated, added_by, added_by_name)
  where (p_group is null or d.blood_group = p_group)
    and (p_upazila is null or d.upazila = p_upazila)
  order by (d.last_donated is null or d.last_donated <= current_date - 90) desc, d.blood_group, d.name
  limit 1000;
$$;
grant execute on function public.blood_donors(text, text) to anon, authenticated;

-- ---------- ৩খ. মেসেজ ----------
create table public.messages (
  id            bigint generated always as identity primary key,
  sender_id     uuid not null references public.profiles(id) on delete cascade,
  recipient_id  uuid not null references public.profiles(id) on delete cascade,
  body          text not null check (char_length(body) between 1 and 2000),
  read_at       timestamptz,
  created_at    timestamptz not null default now(),
  check (sender_id <> recipient_id)
);
create index on public.messages(sender_id, recipient_id, created_at desc);
create index on public.messages(recipient_id, read_at);

-- আমার সব কথোপকথনের তালিকা (প্রতিজনের শেষ মেসেজ ও না-পড়া সংখ্যা)
create or replace function public.my_conversations()
returns table (partner_id uuid, name text, avatar_url text, last_body text, last_at timestamptz, last_mine boolean, unread bigint)
language sql stable security invoker set search_path = public as $$
  with m as (
    select case when sender_id = auth.uid() then recipient_id else sender_id end as partner,
           body, created_at, sender_id = auth.uid() as mine,
           (recipient_id = auth.uid() and read_at is null) as un
      from public.messages
     where auth.uid() in (sender_id, recipient_id)
  ), last as (
    select distinct on (partner) partner, body, created_at, mine from m order by partner, created_at desc
  )
  select p.id, p.name, p.avatar_url, l.body, l.created_at, l.mine,
         (select count(*) from m where m.partner = l.partner and m.un)
    from last l join public.profiles p on p.id = l.partner
   order by l.created_at desc;
$$;

-- কারও মেসেজ পড়া হয়েছে হিসেবে চিহ্নিত করা
create or replace function public.mark_read(partner uuid)
returns void language sql security definer set search_path = public as $$
  update public.messages set read_at = now()
   where recipient_id = auth.uid() and sender_id = partner and read_at is null;
$$;
revoke all on function public.mark_read(uuid) from public, anon;
grant execute on function public.mark_read(uuid) to authenticated;

-- ---------- ৩গ. নোটিফিকেশন ----------
-- লাইক, মন্তব্য, ফ্রেন্ড রিকোয়েস্ট, রিকোয়েস্ট গ্রহণ ও ফলো হলে স্বয়ংক্রিয়ভাবে তৈরি হয়
create table public.notifications (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,  -- যে পাবে
  actor_id    uuid not null references public.profiles(id) on delete cascade,  -- যে করেছে
  type        text not null check (type in ('like','comment','share','tag','friend_request','friend_accept','follow','group_request','group_approved','reply','mention')),
  post_id     bigint references public.posts(id) on delete cascade,
  group_id    bigint references public.groups(id) on delete cascade,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index on public.notifications(user_id, created_at desc);

create or replace function public.notify(to_user uuid, from_user uuid, kind text, post bigint default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if to_user is null or to_user = from_user or public.is_blocked(to_user, from_user) then return; end if;
  -- একই কাজের পুরনো নোটিফিকেশন থাকলে নতুনটা দিয়ে বদলাই (বারবার লাইক/আনলাইকে ভিড় না হয়)
  delete from public.notifications
   where user_id = to_user and actor_id = from_user and type = kind and post_id is not distinct from post and kind not in ('comment','reply');
  insert into public.notifications (user_id, actor_id, type, post_id) values (to_user, from_user, kind, post);
end $$;
revoke all on function public.notify(uuid, uuid, text, bigint) from public, anon, authenticated;

create or replace function public.on_social_event()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'likes' then
    -- পেইজের পোস্টে লাইক হলে পেইজের মালিক পায় (posts.user_id = মালিক)
    perform public.notify((select user_id from public.posts where id = new.post_id), new.user_id, 'like', new.post_id);
  elsif tg_table_name = 'comments' then
    -- উত্তর হলে মূল মন্তব্যকারী "reply" পান; পোস্টের মালিক "comment" পান (একই মানুষ হলে একটাই)
    declare post_owner uuid := (select user_id from public.posts where id = new.post_id);
            parent_owner uuid := (select user_id from public.comments where id = new.parent_id);
    begin
      if parent_owner is not null then perform public.notify(parent_owner, new.user_id, 'reply', new.post_id); end if;
      if parent_owner is distinct from post_owner then perform public.notify(post_owner, new.user_id, 'comment', new.post_id); end if;
    end;
  elsif tg_table_name = 'follows' then
    perform public.notify(new.followee_id, new.follower_id, 'follow');
  elsif tg_table_name = 'post_tags' then
    perform public.notify(new.user_id, (select user_id from public.posts where id = new.post_id), 'tag', new.post_id);
  elsif tg_table_name = 'posts' then
    perform public.notify((select user_id from public.posts where id = new.shared_post_id), new.user_id, 'share', new.shared_post_id);
  elsif tg_table_name = 'friendships' then
    if tg_op = 'INSERT' then
      perform public.notify(new.addressee, new.requester, 'friend_request');
    elsif new.status = 'accepted' and old.status = 'pending' then
      perform public.notify(new.requester, new.addressee, 'friend_accept');
      delete from public.notifications where user_id = new.addressee and actor_id = new.requester and type = 'friend_request';
    end if;
  end if;
  return null;
end $$;
create trigger notify_like    after insert on public.likes    for each row execute function public.on_social_event();
create trigger notify_comment after insert on public.comments for each row execute function public.on_social_event();
create trigger notify_follow  after insert on public.follows  for each row execute function public.on_social_event();
create trigger notify_friend  after insert or update on public.friendships for each row execute function public.on_social_event();
create trigger notify_share   after insert on public.posts for each row when (new.shared_post_id is not null) execute function public.on_social_event();
create trigger notify_tag     after insert on public.post_tags for each row execute function public.on_social_event();

create or replace function public.mark_notifications_read()
returns void language sql security definer set search_path = public as $$
  update public.notifications set read = true where user_id = auth.uid() and not read;
$$;
revoke all on function public.mark_notifications_read() from public, anon;
grant execute on function public.mark_notifications_read() to authenticated;

-- ---------- কমেন্ট পিন (পোস্টের মালিক বা গ্রুপ অ্যাডমিন) ----------
create or replace function public.pin_comment(p_post bigint, p_comment bigint)
returns void language plpgsql security definer set search_path = public as $$
declare owner uuid; gid bigint;
begin
  select user_id, group_id into owner, gid from public.posts where id = p_post;
  if owner is null then raise exception 'post not found'; end if;
  if owner <> auth.uid() and not (gid is not null and public.is_group_admin(gid)) and not public.is_admin() then
    raise exception 'only post owner can pin';
  end if;
  if p_comment is not null and not exists (select 1 from public.comments where id = p_comment and post_id = p_post and parent_id is null) then
    raise exception 'comment not on this post';
  end if;
  update public.posts set pinned_comment_id = p_comment where id = p_post;
end $$;
revoke all on function public.pin_comment(bigint, bigint) from public, anon;
grant execute on function public.pin_comment(bigint, bigint) to authenticated;

-- পোস্ট এডিট: শুধু পোস্টের মালিক লেখা, ধরন, ছবি, প্রাইভেসি ও ট্যাগ বদলাতে পারেন।
-- নতুন ছবি শুধু নিজের ফোল্ডার থেকে; ট্যাগ শুধু বন্ধুদের; পেইজ/গ্রুপের পোস্ট সবসময় পাবলিক।
-- (আগে schema চালিয়ে থাকলে শুধু এই অংশ ও নিচের alter লাইনটা SQL Editor-এ চালালেই হবে)
alter table public.posts add column if not exists edited_at timestamptz;
create or replace function public.edit_post(p_id bigint, p_body text, p_category text, p_images text[], p_privacy text, p_tags uuid[])
returns void language plpgsql security definer set search_path = public as $$
declare p public.posts; pat text;
begin
  select * into p from public.posts where id = p_id for update;
  if p.id is null or p.user_id is distinct from auth.uid() then raise exception 'not allowed'; end if;
  p_images := coalesce(p_images, '{}'); p_tags := coalesce(p_tags, '{}');
  pat := '^https://[^/?#]+/storage/v1/object/public/media/' || auth.uid()::text || '/[^/?#]+$';
  if exists (select 1 from unnest(p_images) u where not (u = any(p.image_urls) or u = p.image_url or u ~ pat)) then
    raise exception 'invalid image';
  end if;
  update public.posts set body = coalesce(p_body, ''), category = p_category,
    image_urls = p_images, image_url = p_images[1],
    privacy = case when p.page_id is null and p.group_id is null then coalesce(p_privacy, p.privacy) else 'public' end,
    edited_at = now()
  where id = p_id;
  if p.page_id is null and p.group_id is null then
    delete from public.post_tags where post_id = p_id and not (user_id = any(p_tags));
    insert into public.post_tags(post_id, user_id)
      select p_id, t from unnest(p_tags) t
      where public.are_friends(auth.uid(), t) and not public.is_blocked(auth.uid(), t)
      on conflict do nothing;
  end if;
end $$;
revoke all on function public.edit_post(bigint, text, text, text[], text, uuid[]) from public, anon;
grant execute on function public.edit_post(bigint, text, text, text[], text, uuid[]) to authenticated;

-- মন্তব্য এডিট: শুধু যিনি লিখেছেন
create or replace function public.edit_comment(p_id bigint, p_body text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.comments set body = btrim(p_body), edited_at = now() where id = p_id and user_id = auth.uid();
  if not found then raise exception 'not allowed'; end if;
end $$;
revoke all on function public.edit_comment(bigint, text) from public, anon;
grant execute on function public.edit_comment(bigint, text) to authenticated;

-- উত্তর শুধু একই পোস্টের মূল মন্তব্যে দেওয়া যায় (উত্তরের উত্তর মূল মন্তব্যের নিচেই যায়)
create or replace function public.reply_parent_ok(p_parent bigint, p_post bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select p_parent is null or exists (select 1 from public.comments where id = p_parent and post_id = p_post and parent_id is null);
$$;

-- ---------- @মেনশন (পোস্ট ও মন্তব্যে) ----------
-- নির্দিষ্ট একজন মানুষ পোস্টটি দেখতে পারেন কিনা (নোটিফিকেশন পাঠানোর আগে যাচাই)
create or replace function public.user_sees_post(uid uuid, pid bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.posts p where p.id = pid
    and not public.is_blocked(uid, p.user_id)
    and (p.group_id is null
         or exists (select 1 from public.groups g where g.id = p.group_id and g.privacy = 'public')
         or exists (select 1 from public.group_members m where m.group_id = p.group_id and m.user_id = uid and m.status = 'active'))
    and (p.privacy = 'public' or p.user_id = uid or (p.privacy = 'friends' and public.are_friends(uid, p.user_id))));
$$;
create table if not exists public.post_mentions (
  post_id  bigint not null references public.posts(id) on delete cascade,
  user_id  uuid not null references public.profiles(id) on delete cascade,
  primary key (post_id, user_id)
);
create table if not exists public.comment_mentions (
  comment_id bigint not null references public.comments(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  primary key (comment_id, user_id)
);
create index if not exists post_mentions_user_idx on public.post_mentions(user_id);
create index if not exists comment_mentions_user_idx on public.comment_mentions(user_id);
alter table public.post_mentions enable row level security;
alter table public.comment_mentions enable row level security;
drop policy if exists "pm read" on public.post_mentions;
drop policy if exists "pm insert" on public.post_mentions;
drop policy if exists "pm delete" on public.post_mentions;
drop policy if exists "cmm read" on public.comment_mentions;
drop policy if exists "cmm insert" on public.comment_mentions;
drop policy if exists "cmm delete" on public.comment_mentions;
create policy "pm read" on public.post_mentions for select using (public.can_see_post(post_id));
create policy "pm insert" on public.post_mentions for insert to authenticated
  with check (user_id <> auth.uid() and not public.is_blocked(auth.uid(), user_id)
    and exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid()));
create policy "pm delete" on public.post_mentions for delete to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid()));
create policy "cmm read" on public.comment_mentions for select
  using (exists (select 1 from public.comments c where c.id = comment_id and public.can_see_post(c.post_id)));
create policy "cmm insert" on public.comment_mentions for insert to authenticated
  with check (user_id <> auth.uid() and not public.is_blocked(auth.uid(), user_id)
    and exists (select 1 from public.comments c where c.id = comment_id and c.user_id = auth.uid()));
create policy "cmm delete" on public.comment_mentions for delete to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.comments c where c.id = comment_id and c.user_id = auth.uid()));
-- মেনশন হলে নোটিফিকেশন, তবে শুধু যদি তিনি পোস্টটি দেখতে পারেন
create or replace function public.on_mention()
returns trigger language plpgsql security definer set search_path = public as $$
declare pid bigint; actor uuid;
begin
  if tg_table_name = 'post_mentions' then
    select id, user_id into pid, actor from public.posts where id = new.post_id;
  else
    select post_id, user_id into pid, actor from public.comments where id = new.comment_id;
  end if;
  if public.user_sees_post(new.user_id, pid) then perform public.notify(new.user_id, actor, 'mention', pid); end if;
  return null;
end $$;
drop trigger if exists notify_post_mention on public.post_mentions;
drop trigger if exists notify_comment_mention on public.comment_mentions;
create trigger notify_post_mention after insert on public.post_mentions for each row execute function public.on_mention();
create trigger notify_comment_mention after insert on public.comment_mentions for each row execute function public.on_mention();


-- ---------- ৩ঘ. গ্রুপে যোগদান ও অনুমোদন ----------
-- পাবলিক গ্রুপে সঙ্গে সঙ্গে সদস্য; প্রাইভেট গ্রুপে অ্যাডমিনের অনুমোদন লাগে
create or replace function public.join_group(gid bigint)
returns text language plpgsql security definer set search_path = public as $$
declare p text; st text;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select privacy into p from public.groups where id = gid;
  if p is null then raise exception 'group not found'; end if;
  st := case when p = 'public' then 'active' else 'pending' end;
  insert into public.group_members (group_id, user_id, role, status) values (gid, auth.uid(), 'member', st)
    on conflict (group_id, user_id) do nothing;
  if st = 'pending' then
    insert into public.notifications (user_id, actor_id, type, group_id)
      select m.user_id, auth.uid(), 'group_request', gid from public.group_members m
       where m.group_id = gid and m.role = 'admin' and m.status = 'active' and not public.is_blocked(m.user_id, auth.uid());
  end if;
  return st;
end $$;

create or replace function public.approve_member(gid bigint, uid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_group_admin(gid) then raise exception 'not group admin'; end if;
  update public.group_members set status = 'active' where group_id = gid and user_id = uid and status = 'pending';
  if not found then raise exception 'no pending request'; end if;
  insert into public.notifications (user_id, actor_id, type, group_id) values (uid, auth.uid(), 'group_approved', gid);
  delete from public.notifications where group_id = gid and actor_id = uid and type = 'group_request';
end $$;
revoke all on function public.join_group(bigint) from public, anon;
revoke all on function public.approve_member(bigint, uuid) from public, anon;
grant execute on function public.join_group(bigint) to authenticated;
grant execute on function public.approve_member(bigint, uuid) to authenticated;

-- ---------- ৪. সেবা ডিরেক্টরি ----------
create table public.services (
  id          bigint generated always as identity primary key,
  upazila_id  bigint not null references public.upazilas(id) on delete cascade,
  union_id    bigint references public.unions(id) on delete set null,
  category    text not null check (category in ('health','gov','edu','police','doc','fix','bus','bank','shop')),
  name        text not null check (char_length(name) between 2 and 80),
  address     text not null check (char_length(address) <= 120),
  phone       text not null check (char_length(phone) <= 20),
  hours       text check (char_length(hours) <= 60),
  verified    boolean not null default false,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index on public.services(upazila_id, category);

-- ---------- ৫. রিপোর্ট (Play Store-এর নিয়ম অনুযায়ী আপত্তিকর কনটেন্ট রিপোর্ট) ----------
create table public.reports (
  id           bigint generated always as identity primary key,
  reporter_id  uuid not null references public.profiles(id) on delete cascade,
  target_type  text not null check (target_type in ('post','comment','service','user')),
  target_id    text not null,
  reason       text not null check (char_length(reason) between 1 and 300),
  resolved     boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ---------- ৬. নিজের অ্যাকাউন্ট মুছে ফেলা (Play Store-এর বাধ্যতামূলক শর্ত) ----------
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- =====================================================================
--  নিরাপত্তার নিয়ম (Row Level Security)
-- =====================================================================
alter table public.upazilas enable row level security;
alter table public.unions   enable row level security;
alter table public.profiles enable row level security;
alter table public.posts    enable row level security;
alter table public.comments enable row level security;
alter table public.likes    enable row level security;
alter table public.services enable row level security;
alter table public.reports  enable row level security;
alter table public.blocks      enable row level security;
alter table public.friendships enable row level security;
alter table public.follows     enable row level security;
alter table public.messages    enable row level security;
alter table public.notifications enable row level security;
alter table public.pages         enable row level security;
alter table public.page_follows  enable row level security;
alter table public.groups        enable row level security;
alter table public.group_members enable row level security;
alter table public.saved_posts   enable row level security;
alter table public.profile_private enable row level security;
alter table public.manual_donors enable row level security;
alter table public.app_settings enable row level security;

-- সেটিংস: সবাই পড়তে পারে, শুধু অ্যাডমিন বদলাতে পারেন
create policy "settings read"   on public.app_settings for select using (true);
create policy "settings admin"  on public.app_settings for update using (public.is_admin()) with check (public.is_admin());
create policy "settings admin insert" on public.app_settings for insert to authenticated with check (public.is_admin());

-- হাতে যোগ করা ডোনার: শুধু যিনি যোগ করেছেন তিনিই দেখতে (সম্পূর্ণ তথ্য), এডিট ও মুছতে পারেন; অ্যাপ অ্যাডমিন মুছতে পারেন
-- (সবাই ব্লাড ব্যাংকে দেখে blood_donors() দিয়ে)
create policy "manual own read"   on public.manual_donors for select using (created_by = auth.uid() or public.is_admin());
create policy "manual own insert" on public.manual_donors for insert to authenticated with check (created_by = auth.uid());
create policy "manual own update" on public.manual_donors for update using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "manual own delete" on public.manual_donors for delete using (created_by = auth.uid() or public.is_admin());

-- মোবাইল নম্বর: শুধু নিজে দেখা ও বদলানো যায়
create policy "private own read"   on public.profile_private for select using (user_id = auth.uid());
create policy "private own insert" on public.profile_private for insert to authenticated with check (user_id = auth.uid());
create policy "private own update" on public.profile_private for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- পেইজ: সবাই দেখে, যে কেউ তৈরি করতে পারে, শুধু মালিক বদলাতে/মুছতে পারে
create policy "pages read"   on public.pages for select using (true);
create policy "pages insert" on public.pages for insert to authenticated with check (owner_id = auth.uid() and follower_count = 0);
create policy "pages update" on public.pages for update using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = (select p.owner_id from public.pages p where p.id = pages.id));
create policy "pages delete" on public.pages for delete using (owner_id = auth.uid() or public.is_admin());
create policy "page follows read"   on public.page_follows for select using (true);
create policy "page follows insert" on public.page_follows for insert to authenticated with check (user_id = auth.uid());
create policy "page follows delete" on public.page_follows for delete using (user_id = auth.uid());

-- গ্রুপ: নাম ও বিবরণ সবাই দেখে (প্রাইভেট হলেও), মালিক বদলাতে/মুছতে পারে
create policy "groups read"   on public.groups for select using (true);
create policy "groups insert" on public.groups for insert to authenticated with check (owner_id = auth.uid() and member_count = 0);
create policy "groups update" on public.groups for update using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = (select g.owner_id from public.groups g where g.id = groups.id));
create policy "groups delete" on public.groups for delete using (owner_id = auth.uid() or public.is_admin());

-- সদস্য তালিকা: যোগদান হয় শুধু join_group() দিয়ে; নিজে বের হওয়া যায়, অ্যাডমিন বাদ দিতে পারে
create policy "members read" on public.group_members for select
  using ((status = 'active' and public.can_see_group(group_id)) or user_id = auth.uid() or public.is_group_admin(group_id));
create policy "members leave or remove" on public.group_members for delete
  using ((user_id = auth.uid() and not exists (select 1 from public.groups g where g.id = group_id and g.owner_id = auth.uid()))
      or (public.is_group_admin(group_id) and not exists (select 1 from public.groups g where g.id = group_id and g.owner_id = user_id)));

-- সেভ করা পোস্ট: শুধু নিজের
create policy "saved own read"   on public.saved_posts for select using (user_id = auth.uid());
create policy "saved own insert" on public.saved_posts for insert to authenticated with check (user_id = auth.uid() and public.can_see_post(post_id));
create policy "saved own delete" on public.saved_posts for delete using (user_id = auth.uid());

-- ট্যাগ: পোস্টের মালিক শুধু নিজের বন্ধুদের ট্যাগ করতে পারেন; ট্যাগ হওয়া মানুষ নিজেকে সরাতে পারেন
alter table public.post_tags enable row level security;
create policy "tags read"   on public.post_tags for select using (public.can_see_post(post_id));
create policy "tags insert" on public.post_tags for insert to authenticated
  with check (exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid()) and public.are_friends(auth.uid(), user_id));
create policy "tags delete" on public.post_tags for delete
  using (user_id = auth.uid() or exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid()));

-- নোটিফিকেশন: শুধু নিজেরটা দেখা ও মোছা যায় (তৈরি হয় শুধু ট্রিগার দিয়ে)
create policy "notif own read"   on public.notifications for select using (user_id = auth.uid());
create policy "notif own delete" on public.notifications for delete using (user_id = auth.uid());

-- ব্লক: শুধু নিজের ব্লক তালিকা দেখা ও বদলানো যায়
create policy "blocks own read"   on public.blocks for select using (blocker_id = auth.uid());
create policy "blocks own insert" on public.blocks for insert to authenticated with check (blocker_id = auth.uid());
create policy "blocks own delete" on public.blocks for delete using (blocker_id = auth.uid());

-- বন্ধুত্ব: গৃহীত বন্ধুত্ব সবাই দেখে (বন্ধু সংখ্যা দেখানোর জন্য), অপেক্ষমাণ রিকোয়েস্ট শুধু দুই পক্ষ দেখে
create policy "friends read" on public.friendships for select
  using (status = 'accepted' or auth.uid() in (requester, addressee));
create policy "friends request" on public.friendships for insert to authenticated
  with check (requester = auth.uid() and status = 'pending' and not public.is_blocked(requester, addressee));
create policy "friends remove" on public.friendships for delete using (auth.uid() in (requester, addressee));

-- ফলো
create policy "follows read"   on public.follows for select using (true);
create policy "follows insert" on public.follows for insert to authenticated
  with check (follower_id = auth.uid() and not public.is_blocked(follower_id, followee_id));
create policy "follows delete" on public.follows for delete using (follower_id = auth.uid());

-- মেসেজ: শুধু প্রেরক ও প্রাপক দেখতে পারে; ব্লক থাকলে পাঠানো যায় না
create policy "messages read" on public.messages for select using (auth.uid() in (sender_id, recipient_id));
create policy "messages send" on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and read_at is null and not public.is_blocked(sender_id, recipient_id));

-- এলাকা: সবাই দেখতে পারে, শুধু অ্যাডমিন বদলাতে পারে
create policy "areas read"   on public.upazilas for select using (true);
create policy "areas admin"  on public.upazilas for all using (public.is_admin()) with check (public.is_admin());
create policy "unions read"  on public.unions   for select using (true);
create policy "unions admin" on public.unions   for all using (public.is_admin()) with check (public.is_admin());

-- প্রোফাইল: সবাই নাম দেখতে পারে, নিজেরটা বদলাতে পারে (role নিজে বদলানো যাবে না)
create policy "profiles read"   on public.profiles for select using (true);
create policy "profiles update" on public.profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select p.role from public.profiles p where p.id = auth.uid()));

-- পোস্ট: প্রাইভেট গ্রুপের পোস্ট শুধু সদস্যরা দেখে; পেইজের নামে শুধু পেইজের মালিক, গ্রুপে শুধু সদস্য পোস্ট করতে পারে
create policy "posts read"   on public.posts for select using (public.post_visible(user_id, group_id, privacy));
create policy "posts insert" on public.posts for insert to authenticated
  with check (user_id = auth.uid() and like_count = 0 and comment_count = 0 and reactions = '{}'::jsonb and share_count = 0 and save_count = 0 and pinned_comment_id is null
    and (shared_post_id is null or public.can_share_post(shared_post_id))
    and (page_id is null or exists (select 1 from public.pages pg where pg.id = page_id and pg.owner_id = auth.uid()))
    and (group_id is null or public.is_group_member(group_id)));
create policy "posts delete" on public.posts for delete
  using (user_id = auth.uid() or public.is_admin() or (group_id is not null and public.is_group_admin(group_id)));

-- মন্তব্য
create policy "comments read"   on public.comments for select using (public.can_see_post(post_id));
create policy "comments insert" on public.comments for insert to authenticated with check (user_id = auth.uid() and public.can_see_post(post_id) and like_count = 0 and reactions = '{}'::jsonb
  and edited_at is null and public.reply_parent_ok(parent_id, post_id));
-- নিজের কমেন্ট, পোস্টের মালিক বা অ্যাডমিন কমেন্ট মুছতে পারেন
create policy "comments delete" on public.comments for delete
  using (user_id = auth.uid() or public.is_admin() or exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid()));

alter table public.comment_likes enable row level security;
create policy "comment likes read"   on public.comment_likes for select using (exists (select 1 from public.comments c where c.id = comment_id and public.can_see_post(c.post_id)));
create policy "comment likes insert" on public.comment_likes for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.comments c where c.id = comment_id and public.can_see_post(c.post_id)));
create policy "comment likes update" on public.comment_likes for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "comment likes delete" on public.comment_likes for delete using (user_id = auth.uid());

-- লাইক
create policy "likes read"   on public.likes for select using (public.can_see_post(post_id));
create policy "likes insert" on public.likes for insert to authenticated with check (user_id = auth.uid() and public.can_see_post(post_id));
create policy "likes update" on public.likes for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "likes delete" on public.likes for delete using (user_id = auth.uid());

-- সেবা: যাচাইকৃত গুলো সবাই দেখে; নিজের জমা দেওয়াটা জমাদাতা দেখে; অ্যাডমিন সব দেখে ও যাচাই করে
create policy "services read" on public.services for select
  using (verified or created_by = auth.uid() or public.is_admin());
create policy "services insert" on public.services for insert to authenticated
  with check (created_by = auth.uid() and verified = false);
create policy "services admin update" on public.services for update using (public.is_admin()) with check (public.is_admin());
create policy "services admin delete" on public.services for delete using (public.is_admin());

-- রিপোর্ট: লগইন করা যে কেউ করতে পারে, শুধু অ্যাডমিন দেখে
create policy "reports insert" on public.reports for insert to authenticated with check (reporter_id = auth.uid());
create policy "reports admin"  on public.reports for select using (public.is_admin());
create policy "reports admin update" on public.reports for update using (public.is_admin());

-- =====================================================================
--  ছবি রাখার জায়গা (Storage) — পোস্টের ছবি ও প্রোফাইল ছবি
--  প্রত্যেকে শুধু নিজের ফোল্ডারে (ইউজার id) আপলোড/মুছতে পারে; সর্বোচ্চ ৫ MB
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "media read" on storage.objects for select using (bucket_id = 'media');
create policy "media upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

-- নতুন মেসেজ সঙ্গে সঙ্গে দেখানোর জন্য (Realtime)
alter publication supabase_realtime add table public.messages, public.notifications;

-- =====================================================================
--  ভালুকা উপজেলা: ১টি পৌরসভা ও ১১টি ইউনিয়ন
--  সেবা ডিরেক্টরির ফোন নম্বরগুলো নমুনা — আসল নম্বর দিয়ে বদলে নিন (Table Editor → services)
-- =====================================================================
insert into public.upazilas (name, district) values ('ভালুকা', 'ময়মনসিংহ');

insert into public.unions (upazila_id, name, sort) values
  (1, 'ভালুকা পৌরসভা', 1),
  (1, 'উথুরা ইউনিয়ন', 2), (1, 'কাচিনা ইউনিয়ন', 3), (1, 'ডাকাতিয়া ইউনিয়ন', 4),
  (1, 'ধীতপুর ইউনিয়ন', 5), (1, 'বিরুনিয়া ইউনিয়ন', 6), (1, 'ভরাডোবা ইউনিয়ন', 7),
  (1, 'ভালুকা ইউনিয়ন', 8), (1, 'মল্লিকবাড়ী ইউনিয়ন', 9), (1, 'মেদুয়ারী ইউনিয়ন', 10),
  (1, 'রাজৈ ইউনিয়ন', 11), (1, 'হবিরবাড়ী ইউনিয়ন', 12);

insert into public.services (upazila_id, category, name, address, phone, hours, verified) values
  (1, 'health', 'উপজেলা স্বাস্থ্য কমপ্লেক্স', 'হাসপাতাল রোড, সদর', '01700-000001', 'জরুরি বিভাগ ২৪ ঘণ্টা', true),
  (1, 'gov',    'উপজেলা নির্বাহী অফিসারের কার্যালয়', 'উপজেলা পরিষদ চত্বর', '01700-000002', 'রবি–বৃহস্পতি, সকাল ৯টা–বিকাল ৫টা', true),
  (1, 'gov',    'সহকারী কমিশনার (ভূমি) অফিস', 'উপজেলা পরিষদ চত্বর', '01700-000003', 'রবি–বৃহস্পতি, সকাল ৯টা–বিকাল ৫টা', true),
  (1, 'police', 'থানা', 'থানা মোড়, সদর', '01700-000004', '২৪ ঘণ্টা', true),
  (1, 'police', 'ফায়ার সার্ভিস ও সিভিল ডিফেন্স স্টেশন', 'বাসস্ট্যান্ডের পাশে', '01700-000005', '২৪ ঘণ্টা', true),
  (1, 'edu',    'সরকারি পাইলট উচ্চ বিদ্যালয়', 'স্কুল রোড, সদর', '01700-000006', 'শনি–বৃহস্পতি', true),
  (1, 'bus',    'উপজেলা–জেলা সদর বাস কাউন্টার', 'কেন্দ্রীয় বাসস্ট্যান্ড', '01700-000010', 'ভোর ৬টা থেকে প্রতি ৩০ মিনিটে', true),
  (1, 'gov',    'উপজেলা কৃষি অফিস', 'উপজেলা পরিষদ চত্বর', '01700-000013', 'রবি–বৃহস্পতি, সকাল ৯টা–বিকাল ৫টা', true);

-- =====================================================================
--  নিরাপত্তা আরও শক্ত করা (Supabase Security Advisor অনুযায়ী)
--  • কে কাকে ব্লক করেছে তা শুধু দুই পক্ষ জানতে পারে
--  • ভেতরের হিসাবের ফাংশনগুলো "private" স্কিমায়, বাইরে থেকে ডাকা যায় না
--  • ট্রিগার ফাংশন সরাসরি ডাকা যায় না
-- =====================================================================
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.is_blocked(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a));
$$;
create or replace function public.is_blocked(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and auth.uid() in (a, b) and private.is_blocked(a, b);
$$;
create or replace function private.user_sees_post(uid uuid, pid bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.posts p where p.id = pid
    and not private.is_blocked(uid, p.user_id)
    and (p.group_id is null
         or exists (select 1 from public.groups g where g.id = p.group_id and g.privacy = 'public')
         or exists (select 1 from public.group_members m where m.group_id = p.group_id and m.user_id = uid and m.status = 'active'))
    and (p.privacy = 'public' or p.user_id = uid or (p.privacy = 'friends' and public.are_friends(uid, p.user_id))));
$$;
create or replace function public.on_mention()
returns trigger language plpgsql security definer set search_path = public as $$
declare pid bigint; actor uuid;
begin
  if tg_table_name = 'post_mentions' then
    select id, user_id into pid, actor from public.posts where id = new.post_id;
  else
    select post_id, user_id into pid, actor from public.comments where id = new.comment_id;
  end if;
  if private.user_sees_post(new.user_id, pid) then perform public.notify(new.user_id, actor, 'mention', pid); end if;
  return null;
end $$;
drop function if exists public.user_sees_post(uuid, bigint);
create or replace function public.notify(to_user uuid, from_user uuid, kind text, post bigint default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if to_user is null or to_user = from_user or private.is_blocked(to_user, from_user) then return; end if;
  delete from public.notifications
   where user_id = to_user and actor_id = from_user and type = kind and post_id is not distinct from post and kind not in ('comment','reply');
  insert into public.notifications (user_id, actor_id, type, post_id) values (to_user, from_user, kind, post);
end $$;
revoke all on function public.notify(uuid, uuid, text, bigint) from public, anon, authenticated;
create or replace function public.join_group(gid bigint)
returns text language plpgsql security definer set search_path = public as $$
declare p text; st text;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select privacy into p from public.groups where id = gid;
  if p is null then raise exception 'group not found'; end if;
  st := case when p = 'public' then 'active' else 'pending' end;
  insert into public.group_members (group_id, user_id, role, status) values (gid, auth.uid(), 'member', st)
    on conflict (group_id, user_id) do nothing;
  if st = 'pending' then
    insert into public.notifications (user_id, actor_id, type, group_id)
      select m.user_id, auth.uid(), 'group_request', gid from public.group_members m
       where m.group_id = gid and m.role = 'admin' and m.status = 'active' and not private.is_blocked(m.user_id, auth.uid());
  end if;
  return st;
end $$;
revoke all on function public.join_group(bigint) from public, anon;
grant execute on function public.join_group(bigint) to authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.bump_group_counts() from public, anon, authenticated;
revoke all on function public.bump_saves() from public, anon, authenticated;
revoke all on function public.bump_comment_reacts() from public, anon, authenticated;
revoke all on function public.bump_shares() from public, anon, authenticated;
revoke all on function public.bump_counts() from public, anon, authenticated;
revoke all on function public.on_block() from public, anon, authenticated;
revoke all on function public.on_group_created() from public, anon, authenticated;
revoke all on function public.on_social_event() from public, anon, authenticated;
revoke all on function public.on_mention() from public, anon, authenticated;

-- ---------- কভার ফটো ও ফটো অ্যালবাম ----------
alter table public.profiles add column if not exists cover_url text check (char_length(cover_url) <= 500);

create table if not exists public.albums (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  privacy     text not null default 'public' check (privacy in ('public','friends','only_me')),
  created_at  timestamptz not null default now()
);
create index if not exists albums_user_idx on public.albums(user_id, created_at desc);

-- পোস্টের ধরন: সাধারণ / প্রোফাইল ছবি বদল / কভার ছবি বদল; আর কোন অ্যালবামের
alter table public.posts add column if not exists kind text not null default 'normal' check (kind in ('normal','avatar','cover'));
alter table public.posts add column if not exists album_id bigint references public.albums(id) on delete set null;
create index if not exists posts_album_idx on public.posts(album_id) where album_id is not null;
create index if not exists posts_user_kind_idx on public.posts(user_id, kind) where kind <> 'normal';
do $$ begin
  alter table public.posts add constraint posts_album_scope check (album_id is null or (page_id is null and group_id is null));
exception when duplicate_object then null; end $$;

alter table public.albums enable row level security;
drop policy if exists "albums read" on public.albums;
drop policy if exists "albums insert" on public.albums;
drop policy if exists "albums update" on public.albums;
drop policy if exists "albums delete" on public.albums;
create policy "albums read" on public.albums for select using (public.post_visible(user_id, null, privacy));
create policy "albums insert" on public.albums for insert to authenticated with check (user_id = auth.uid());
create policy "albums update" on public.albums for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "albums delete" on public.albums for delete using (user_id = auth.uid() or public.is_admin());

-- অ্যালবামের প্রাইভেসি বদলালে ভেতরের সব ছবির পোস্টও একই প্রাইভেসি পায় (ফেসবুকের মতো)
create or replace function public.sync_album_privacy()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.privacy is distinct from old.privacy then
    update public.posts set privacy = new.privacy where album_id = new.id;
  end if;
  return null;
end $$;
revoke all on function public.sync_album_privacy() from public, anon, authenticated;
drop trigger if exists album_privacy_sync on public.albums;
create trigger album_privacy_sync after update on public.albums for each row execute function public.sync_album_privacy();

-- পোস্ট তৈরি: অ্যালবাম শুধু নিজের, আর প্রোফাইল/কভার ছবির পোস্ট শুধু নিজের টাইমলাইনে
drop policy if exists "posts insert" on public.posts;
create policy "posts insert" on public.posts for insert to authenticated
  with check (user_id = auth.uid() and like_count = 0 and comment_count = 0 and reactions = '{}'::jsonb and share_count = 0 and save_count = 0 and pinned_comment_id is null
    and (shared_post_id is null or public.can_share_post(shared_post_id))
    and (page_id is null or exists (select 1 from public.pages pg where pg.id = page_id and pg.owner_id = auth.uid()))
    and (group_id is null or public.is_group_member(group_id))
    and (album_id is null or exists (select 1 from public.albums a where a.id = album_id and a.user_id = auth.uid()))
    and (kind = 'normal' or (page_id is null and group_id is null and shared_post_id is null)));

-- ---------- বন্ধু ও ফলো তালিকার প্রাইভেসি ----------
-- কারা দেখবে: public (সবাই) / friends (বন্ধুরা) / only_me (শুধু আমি)। সংখ্যা সবসময় সবাই দেখে।
alter table public.profiles add column if not exists friends_visibility text not null default 'public' check (friends_visibility in ('public','friends','only_me'));
alter table public.profiles add column if not exists follows_visibility text not null default 'public' check (follows_visibility in ('public','friends','only_me'));

create schema if not exists private;
-- ভেতরের হিসাবের জন্য (যেকোনো দুজন); বাইরে থেকে ডাকা যায় না
create or replace function private.are_friends(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select a is not null and b is not null and exists (select 1 from public.friendships
    where status = 'accepted' and ((requester = a and addressee = b) or (requester = b and addressee = a)));
$$;
-- বাইরে থেকে শুধু নিজের সাথে কারও বন্ধুত্ব যাচাই করা যায়
create or replace function public.are_friends(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and auth.uid() in (a, b) and private.are_friends(a, b);
$$;
create or replace function private.user_sees_post(uid uuid, pid bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.posts p where p.id = pid
    and not private.is_blocked(uid, p.user_id)
    and (p.group_id is null
         or exists (select 1 from public.groups g where g.id = p.group_id and g.privacy = 'public')
         or exists (select 1 from public.group_members m where m.group_id = p.group_id and m.user_id = uid and m.status = 'active'))
    and (p.privacy = 'public' or p.user_id = uid or (p.privacy = 'friends' and private.are_friends(uid, p.user_id))));
$$;

-- টেবিল থেকে সরাসরি শুধু নিজের বন্ধুত্ব/ফলো পড়া যায়; অন্যের তালিকা শুধু list_people() দিয়ে
drop policy if exists "friends read" on public.friendships;
create policy "friends read" on public.friendships for select using (auth.uid() in (requester, addressee));
drop policy if exists "follows read" on public.follows;
create policy "follows read" on public.follows for select using (auth.uid() in (follower_id, followee_id));

-- সংখ্যা: সবাই দেখতে পারে
create or replace function public.profile_counts(uid uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'friends', (select count(*) from public.friendships where status = 'accepted' and uid in (requester, addressee)),
    'followers', (select count(*) from public.follows where followee_id = uid),
    'following', (select count(*) from public.follows where follower_id = uid));
$$;
grant execute on function public.profile_counts(uuid) to anon, authenticated;

-- তালিকা: মালিকের সেটিং মেনে। kind = friends / followers / following
create or replace function public.list_people(uid uuid, kind text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare vis text; ok boolean; ids uuid[];
begin
  select case when kind = 'friends' then friends_visibility else follows_visibility end into vis from public.profiles where id = uid;
  if vis is null then return jsonb_build_object('allowed', false, 'ids', '[]'::jsonb); end if;
  ok := uid = auth.uid() or public.is_admin() or vis = 'public' or (vis = 'friends' and private.are_friends(auth.uid(), uid));
  if not ok then return jsonb_build_object('allowed', false, 'visibility', vis, 'ids', '[]'::jsonb); end if;
  if kind = 'friends' then
    select array_agg(x order by t desc) into ids from (
      select case when requester = uid then addressee else requester end x, created_at t from public.friendships
       where status = 'accepted' and uid in (requester, addressee)) s
     where auth.uid() is null or not private.is_blocked(auth.uid(), x);
  elsif kind = 'followers' then
    select array_agg(follower_id order by created_at desc) into ids from public.follows
     where followee_id = uid and (auth.uid() is null or not private.is_blocked(auth.uid(), follower_id));
  elsif kind = 'following' then
    select array_agg(followee_id order by created_at desc) into ids from public.follows
     where follower_id = uid and (auth.uid() is null or not private.is_blocked(auth.uid(), followee_id));
  else raise exception 'bad kind';
  end if;
  return jsonb_build_object('allowed', true, 'visibility', vis, 'ids', to_jsonb(coalesce(ids, '{}')));
end $$;
grant execute on function public.list_people(uuid, text) to anon, authenticated;

-- ---------- ফলোয়ার ও ফলো করছেন তালিকার প্রাইভেসি আলাদা ----------
alter table public.profiles add column if not exists followers_visibility text not null default 'public' check (followers_visibility in ('public','friends','only_me'));
alter table public.profiles add column if not exists following_visibility text not null default 'public' check (following_visibility in ('public','friends','only_me'));
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'follows_visibility') then
    update public.profiles set followers_visibility = follows_visibility, following_visibility = follows_visibility;
    alter table public.profiles drop column follows_visibility;
  end if;
end $$;

create or replace function public.list_people(uid uuid, kind text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare vis text; ok boolean; ids uuid[];
begin
  select case kind when 'friends' then friends_visibility when 'followers' then followers_visibility when 'following' then following_visibility end
    into vis from public.profiles where id = uid;
  if vis is null then return jsonb_build_object('allowed', false, 'ids', '[]'::jsonb); end if;
  ok := uid = auth.uid() or public.is_admin() or vis = 'public' or (vis = 'friends' and private.are_friends(auth.uid(), uid));
  if not ok then return jsonb_build_object('allowed', false, 'visibility', vis, 'ids', '[]'::jsonb); end if;
  if kind = 'friends' then
    select array_agg(x order by t desc) into ids from (
      select case when requester = uid then addressee else requester end x, created_at t from public.friendships
       where status = 'accepted' and uid in (requester, addressee)) s
     where auth.uid() is null or not private.is_blocked(auth.uid(), x);
  elsif kind = 'followers' then
    select array_agg(follower_id order by created_at desc) into ids from public.follows
     where followee_id = uid and (auth.uid() is null or not private.is_blocked(auth.uid(), follower_id));
  else
    select array_agg(followee_id order by created_at desc) into ids from public.follows
     where follower_id = uid and (auth.uid() is null or not private.is_blocked(auth.uid(), followee_id));
  end if;
  return jsonb_build_object('allowed', true, 'visibility', vis, 'ids', to_jsonb(coalesce(ids, '{}')));
end $$;
grant execute on function public.list_people(uuid, text) to anon, authenticated;

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

-- ---------- এবাউট: কাজ ও শিক্ষা ----------
alter table public.profiles add column if not exists work text check (char_length(work) <= 80);
alter table public.profiles add column if not exists education text check (char_length(education) <= 80);

-- ---------- কাজ ও শিক্ষা: একাধিক কর্মস্থল (নাম, পদবি) ও শিক্ষাপ্রতিষ্ঠান (অবস্থা, পাশের সন, বিষয়/গ্রুপ) ----------
-- works:      [{ "place": "কর্মস্থল", "title": "পদবি" }]                      সর্বোচ্চ ৩টি
-- educations: [{ "school": "প্রতিষ্ঠান", "status": "passed|running", "year": 2020, "subject": "বিজ্ঞান" }]  সর্বোচ্চ ৫টি
create or replace function public.valid_works(j jsonb)
returns boolean language sql immutable as $$
  select jsonb_typeof(j) = 'array' and jsonb_array_length(j) <= 3
     and not exists (select 1 from jsonb_array_elements(j) e where case
       when jsonb_typeof(e) <> 'object' then true
       when exists (select 1 from jsonb_object_keys(e) k where k not in ('place','title')) then true
       when jsonb_typeof(e->'place') is distinct from 'string' then true
       when char_length(e->>'place') not between 1 and 80 then true
       when e ? 'title' and (jsonb_typeof(e->'title') <> 'string' or char_length(e->>'title') > 60) then true
       else false end);
$$;
create or replace function public.valid_educations(j jsonb)
returns boolean language sql immutable as $$
  select jsonb_typeof(j) = 'array' and jsonb_array_length(j) <= 5
     and not exists (select 1 from jsonb_array_elements(j) e where case
       when jsonb_typeof(e) <> 'object' then true
       when exists (select 1 from jsonb_object_keys(e) k where k not in ('school','status','year','subject')) then true
       when jsonb_typeof(e->'school') is distinct from 'string' then true
       when char_length(e->>'school') not between 1 and 80 then true
       when e ? 'status' and (e->>'status') not in ('passed','running') then true
       when e ? 'year' and jsonb_typeof(e->'year') <> 'number' then true
       when e ? 'year' and (e->>'year')::numeric not between 1950 and 2040 then true
       when e ? 'subject' and (jsonb_typeof(e->'subject') <> 'string' or char_length(e->>'subject') > 60) then true
       else false end);
$$;
alter table public.profiles add column if not exists works jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists educations jsonb not null default '[]'::jsonb;
do $$ begin
  alter table public.profiles add constraint profiles_works_valid check (public.valid_works(works));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.profiles add constraint profiles_educations_valid check (public.valid_educations(educations));
exception when duplicate_object then null; end $$;
-- আগের এক-লাইনের "কাজ"/"শিক্ষা" থাকলে নতুন তালিকায় তুলে পুরনো ঘর সরানো
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'work') then
    update public.profiles set works = jsonb_build_array(jsonb_build_object('place', left(work, 80))) where coalesce(work, '') <> '' and works = '[]';
    update public.profiles set educations = jsonb_build_array(jsonb_build_object('school', left(education, 80), 'status', 'passed')) where coalesce(education, '') <> '' and educations = '[]';
    alter table public.profiles drop column work;
    alter table public.profiles drop column education;
  end if;
end $$;

-- ---------- এবাউটের প্রাইভেসি: কাজ, শিক্ষা, যোগাযোগ (মোবাইল), সোশ্যাল লিংক ----------
-- এই তথ্য আলাদা টেবিলে, যেটা সরাসরি শুধু মালিক পড়তে পারে।
-- অন্যরা পায় শুধু profile_about() দিয়ে, মালিকের সেটিং মেনে (পাবলিক / বন্ধুরা / শুধু আমি)।
create table if not exists public.profile_details (
  user_id                uuid primary key references public.profiles(id) on delete cascade,
  works                  jsonb not null default '[]'::jsonb check (public.valid_works(works)),
  educations             jsonb not null default '[]'::jsonb check (public.valid_educations(educations)),
  social                 jsonb not null default '{}'::jsonb check (public.valid_social(social)),
  works_visibility       text not null default 'public'  check (works_visibility in ('public','friends','only_me')),
  educations_visibility  text not null default 'public'  check (educations_visibility in ('public','friends','only_me')),
  contact_visibility     text not null default 'only_me' check (contact_visibility in ('public','friends','only_me')),
  social_visibility      text not null default 'public'  check (social_visibility in ('public','friends','only_me'))
);
alter table public.profile_details enable row level security;
drop policy if exists "details own read" on public.profile_details;
drop policy if exists "details own insert" on public.profile_details;
drop policy if exists "details own update" on public.profile_details;
create policy "details own read"   on public.profile_details for select using (user_id = auth.uid());
create policy "details own insert" on public.profile_details for insert to authenticated with check (user_id = auth.uid());
create policy "details own update" on public.profile_details for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- আগে প্রোফাইল টেবিলে রাখা কাজ/শিক্ষা/সোশ্যাল লিংক নতুন টেবিলে সরানো
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'works') then
    insert into public.profile_details (user_id, works, educations, social)
      select id, works, educations, social from public.profiles
       where works <> '[]' or educations <> '[]' or social <> '{}'
      on conflict (user_id) do update set works = excluded.works, educations = excluded.educations, social = excluded.social;
    alter table public.profiles drop constraint if exists profiles_works_valid;
    alter table public.profiles drop constraint if exists profiles_educations_valid;
    alter table public.profiles drop constraint if exists profiles_social_valid;
    alter table public.profiles drop column works, drop column educations, drop column social;
  end if;
end $$;

create schema if not exists private;
-- কেউ (এখন যিনি দেখছেন) মালিকের এই সেটিংয়ের তথ্য দেখতে পারবেন কিনা
create or replace function private.can_view(owner uuid, vis text)
returns boolean language sql stable security definer set search_path = public as $$
  select owner = auth.uid() or public.is_admin()
      or ((auth.uid() is null or not private.is_blocked(auth.uid(), owner))
          and (vis = 'public' or (vis = 'friends' and private.are_friends(auth.uid(), owner))));
$$;
create or replace function public.profile_about(uid uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'works',      case when private.can_view(p.id, coalesce(d.works_visibility, 'public'))      then coalesce(d.works, '[]'::jsonb) end,
    'educations', case when private.can_view(p.id, coalesce(d.educations_visibility, 'public')) then coalesce(d.educations, '[]'::jsonb) end,
    'social',     case when private.can_view(p.id, coalesce(d.social_visibility, 'public'))     then coalesce(d.social, '{}'::jsonb) end,
    'phone',      case when private.can_view(p.id, coalesce(d.contact_visibility, 'only_me'))   then pp.phone end)
  from public.profiles p
  left join public.profile_details d on d.user_id = p.id
  left join public.profile_private pp on pp.user_id = p.id
  where p.id = uid;
$$;
grant execute on function public.profile_about(uuid) to anon, authenticated;

-- ---------- লিঙ্গ ও ইউজারনেম ----------
-- লিঙ্গ: male / female / other; খালি = বলতে চান না
alter table public.profiles add column if not exists gender text check (gender in ('male','female','other'));
-- ইউজারনেম: ছোট হাতের ইংরেজি অক্ষর, সংখ্যা, _ ও . (৩–২০ অক্ষর), প্রত্যেকের আলাদা
alter table public.profiles add column if not exists username text
  check (username ~ '^[a-z0-9_.]{3,20}$' and username !~ '^\.|\.$|\.\.');
create unique index if not exists profiles_username_key on public.profiles (lower(username)) where username is not null;

-- সাইনআপে দেওয়া লিঙ্গও প্রোফাইলে বসানো
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, union_id, district, upazila, blood_group, last_donated, gender)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), 'নতুন সদস্য'),
    nullif(new.raw_user_meta_data->>'union_id', '')::bigint,
    nullif(left(new.raw_user_meta_data->>'district', 40), ''),
    nullif(left(new.raw_user_meta_data->>'upazila', 40), ''),
    case when new.raw_user_meta_data->>'blood_group' in ('A+','A-','B+','B-','AB+','AB-','O+','O-')
         then new.raw_user_meta_data->>'blood_group' end,
    case when (new.raw_user_meta_data->>'last_donated') ~ '^\d{4}-\d{2}-\d{2}$'
          and (new.raw_user_meta_data->>'last_donated')::date <= current_date
         then (new.raw_user_meta_data->>'last_donated')::date end,
    case when new.raw_user_meta_data->>'gender' in ('male','female','other') then new.raw_user_meta_data->>'gender' end
  );
  if (new.raw_user_meta_data->>'phone') ~ '^01[3-9][0-9]{8}$' then
    insert into public.profile_private (user_id, phone) values (new.id, new.raw_user_meta_data->>'phone');
  end if;
  return new;
end $$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- ---------- জন্মসাল (কারা দেখবে বেছে নেওয়া যায়; শুরুতে শুধু আমি) ----------
alter table public.profile_details add column if not exists birth_year int check (birth_year between 1920 and 2030);
alter table public.profile_details add column if not exists birth_visibility text not null default 'only_me' check (birth_visibility in ('public','friends','only_me'));

create or replace function public.profile_about(uid uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'works',      case when private.can_view(p.id, coalesce(d.works_visibility, 'public'))      then coalesce(d.works, '[]'::jsonb) end,
    'educations', case when private.can_view(p.id, coalesce(d.educations_visibility, 'public')) then coalesce(d.educations, '[]'::jsonb) end,
    'social',     case when private.can_view(p.id, coalesce(d.social_visibility, 'public'))     then coalesce(d.social, '{}'::jsonb) end,
    'phone',      case when private.can_view(p.id, coalesce(d.contact_visibility, 'only_me'))   then pp.phone end,
    'birth_year', case when private.can_view(p.id, coalesce(d.birth_visibility, 'only_me'))     then d.birth_year end)
  from public.profiles p
  left join public.profile_details d on d.user_id = p.id
  left join public.profile_private pp on pp.user_id = p.id
  where p.id = uid;
$$;
grant execute on function public.profile_about(uuid) to anon, authenticated;

-- সাইনআপে দেওয়া জন্মসালও সেভ (বয়স অন্তত ১৩ হলে)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare byear int;
begin
  insert into public.profiles (id, name, union_id, district, upazila, blood_group, last_donated, gender)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), 'নতুন সদস্য'),
    nullif(new.raw_user_meta_data->>'union_id', '')::bigint,
    nullif(left(new.raw_user_meta_data->>'district', 40), ''),
    nullif(left(new.raw_user_meta_data->>'upazila', 40), ''),
    case when new.raw_user_meta_data->>'blood_group' in ('A+','A-','B+','B-','AB+','AB-','O+','O-')
         then new.raw_user_meta_data->>'blood_group' end,
    case when (new.raw_user_meta_data->>'last_donated') ~ '^\d{4}-\d{2}-\d{2}$'
          and (new.raw_user_meta_data->>'last_donated')::date <= current_date
         then (new.raw_user_meta_data->>'last_donated')::date end,
    case when new.raw_user_meta_data->>'gender' in ('male','female','other') then new.raw_user_meta_data->>'gender' end
  );
  if (new.raw_user_meta_data->>'phone') ~ '^01[3-9][0-9]{8}$' then
    insert into public.profile_private (user_id, phone) values (new.id, new.raw_user_meta_data->>'phone');
  end if;
  if (new.raw_user_meta_data->>'birth_year') ~ '^\d{4}$' then
    byear := (new.raw_user_meta_data->>'birth_year')::int;
    if byear >= 1920 and extract(year from current_date)::int - byear >= 13 then
      insert into public.profile_details (user_id, birth_year) values (new.id, byear) on conflict (user_id) do update set birth_year = excluded.birth_year;
    end if;
  end if;
  return new;
end $$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- ---------- জন্মতারিখ (দিন, মাস, সাল) ----------
alter table public.profile_details add column if not exists birth_date date check (birth_date >= date '1920-01-01');
-- বয়স অন্তত ১৩ বছর (অ্যাপের নিয়ম); তারিখ থাকলে সালও মিলিয়ে রাখা
create or replace function public.check_birth_date()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.birth_date is not null then
    if new.birth_date > (current_date - interval '13 years')::date then raise exception 'বয়স অন্তত ১৩ বছর হতে হবে'; end if;
    new.birth_year := extract(year from new.birth_date)::int;
  end if;
  return new;
end $$;
drop trigger if exists profile_details_birth on public.profile_details;
create trigger profile_details_birth before insert or update on public.profile_details for each row execute function public.check_birth_date();

create or replace function public.profile_about(uid uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'works',      case when private.can_view(p.id, coalesce(d.works_visibility, 'public'))      then coalesce(d.works, '[]'::jsonb) end,
    'educations', case when private.can_view(p.id, coalesce(d.educations_visibility, 'public')) then coalesce(d.educations, '[]'::jsonb) end,
    'social',     case when private.can_view(p.id, coalesce(d.social_visibility, 'public'))     then coalesce(d.social, '{}'::jsonb) end,
    'phone',      case when private.can_view(p.id, coalesce(d.contact_visibility, 'only_me'))   then pp.phone end,
    'birth_year', case when private.can_view(p.id, coalesce(d.birth_visibility, 'only_me'))     then d.birth_year end,
    'birth_date', case when private.can_view(p.id, coalesce(d.birth_visibility, 'only_me'))     then d.birth_date end)
  from public.profiles p
  left join public.profile_details d on d.user_id = p.id
  left join public.profile_private pp on pp.user_id = p.id
  where p.id = uid;
$$;
grant execute on function public.profile_about(uuid) to anon, authenticated;

-- সাইনআপে দেওয়া জন্মতারিখ সেভ (বয়স অন্তত ১৩ হলে)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare bd date;
begin
  insert into public.profiles (id, name, union_id, district, upazila, blood_group, last_donated, gender)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), 'নতুন সদস্য'),
    nullif(new.raw_user_meta_data->>'union_id', '')::bigint,
    nullif(left(new.raw_user_meta_data->>'district', 40), ''),
    nullif(left(new.raw_user_meta_data->>'upazila', 40), ''),
    case when new.raw_user_meta_data->>'blood_group' in ('A+','A-','B+','B-','AB+','AB-','O+','O-')
         then new.raw_user_meta_data->>'blood_group' end,
    case when (new.raw_user_meta_data->>'last_donated') ~ '^\d{4}-\d{2}-\d{2}$'
          and (new.raw_user_meta_data->>'last_donated')::date <= current_date
         then (new.raw_user_meta_data->>'last_donated')::date end,
    case when new.raw_user_meta_data->>'gender' in ('male','female','other') then new.raw_user_meta_data->>'gender' end
  );
  if (new.raw_user_meta_data->>'phone') ~ '^01[3-9][0-9]{8}$' then
    insert into public.profile_private (user_id, phone) values (new.id, new.raw_user_meta_data->>'phone');
  end if;
  if (new.raw_user_meta_data->>'birth_date') ~ '^\d{4}-\d{2}-\d{2}$' then
    begin
      bd := (new.raw_user_meta_data->>'birth_date')::date;
      if bd >= date '1920-01-01' and bd <= (current_date - interval '13 years')::date then
        insert into public.profile_details (user_id, birth_date) values (new.id, bd) on conflict (user_id) do update set birth_date = excluded.birth_date;
      end if;
    exception when others then null;   -- ভুল তারিখ হলে বাদ, সাইনআপ আটকাবে না
    end;
  end if;
  return new;
end $$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- ---------- সম্পর্কের অবস্থা, ধর্ম, সংগঠন/ক্লাব ----------
-- সম্পর্ক ও ধর্ম শুরুতে "শুধু আমি"; সংগঠন শুরুতে পাবলিক
create or replace function public.valid_orgs(j jsonb)
returns boolean language sql immutable as $$
  select jsonb_typeof(j) = 'array' and jsonb_array_length(j) <= 5
     and not exists (select 1 from jsonb_array_elements(j) e where case
       when jsonb_typeof(e) <> 'object' then true
       when exists (select 1 from jsonb_object_keys(e) k where k not in ('name','role')) then true
       when jsonb_typeof(e->'name') is distinct from 'string' then true
       when char_length(e->>'name') not between 1 and 80 then true
       when e ? 'role' and (jsonb_typeof(e->'role') <> 'string' or char_length(e->>'role') > 40) then true
       else false end);
$$;
alter table public.profile_details add column if not exists relationship text
  check (relationship in ('single','married','engaged','divorced','widowed'));
alter table public.profile_details add column if not exists relationship_visibility text not null default 'only_me' check (relationship_visibility in ('public','friends','only_me'));
alter table public.profile_details add column if not exists religion text
  check (religion in ('islam','hindu','buddhist','christian','other'));
alter table public.profile_details add column if not exists religion_visibility text not null default 'only_me' check (religion_visibility in ('public','friends','only_me'));
alter table public.profile_details add column if not exists orgs jsonb not null default '[]'::jsonb;
alter table public.profile_details add column if not exists orgs_visibility text not null default 'public' check (orgs_visibility in ('public','friends','only_me'));
do $$ begin
  alter table public.profile_details add constraint profile_details_orgs_valid check (public.valid_orgs(orgs));
exception when duplicate_object then null; end $$;

create or replace function public.profile_about(uid uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'works',        case when private.can_view(p.id, coalesce(d.works_visibility, 'public'))          then coalesce(d.works, '[]'::jsonb) end,
    'educations',   case when private.can_view(p.id, coalesce(d.educations_visibility, 'public'))     then coalesce(d.educations, '[]'::jsonb) end,
    'social',       case when private.can_view(p.id, coalesce(d.social_visibility, 'public'))         then coalesce(d.social, '{}'::jsonb) end,
    'phone',        case when private.can_view(p.id, coalesce(d.contact_visibility, 'only_me'))       then pp.phone end,
    'birth_year',   case when private.can_view(p.id, coalesce(d.birth_visibility, 'only_me'))         then d.birth_year end,
    'birth_date',   case when private.can_view(p.id, coalesce(d.birth_visibility, 'only_me'))         then d.birth_date end,
    'relationship', case when private.can_view(p.id, coalesce(d.relationship_visibility, 'only_me'))  then d.relationship end,
    'religion',     case when private.can_view(p.id, coalesce(d.religion_visibility, 'only_me'))      then d.religion end,
    'orgs',         case when private.can_view(p.id, coalesce(d.orgs_visibility, 'public'))           then coalesce(d.orgs, '[]'::jsonb) end)
  from public.profiles p
  left join public.profile_details d on d.user_id = p.id
  left join public.profile_private pp on pp.user_id = p.id
  where p.id = uid;
$$;
grant execute on function public.profile_about(uuid) to anon, authenticated;

-- ---------- প্রোফাইলের "পরিচিতি" কার্ডে কোন কোন বিষয় দেখাবে (ফেসবুকের মতো) ----------
-- শুধু কোন বিষয় দেখাবে তার তালিকা; আসল তথ্য তবুও প্রাইভেসি মেনেই আসে
alter table public.profile_details add column if not exists featured text[] not null default '{works,educations,addr,social,joined}'
  check (featured <@ array['works','educations','addr','gender','birth','relationship','religion','orgs','phone','social','joined']::text[]);

create or replace function public.profile_about(uid uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'works',        case when private.can_view(p.id, coalesce(d.works_visibility, 'public'))          then coalesce(d.works, '[]'::jsonb) end,
    'educations',   case when private.can_view(p.id, coalesce(d.educations_visibility, 'public'))     then coalesce(d.educations, '[]'::jsonb) end,
    'social',       case when private.can_view(p.id, coalesce(d.social_visibility, 'public'))         then coalesce(d.social, '{}'::jsonb) end,
    'phone',        case when private.can_view(p.id, coalesce(d.contact_visibility, 'only_me'))       then pp.phone end,
    'birth_year',   case when private.can_view(p.id, coalesce(d.birth_visibility, 'only_me'))         then d.birth_year end,
    'birth_date',   case when private.can_view(p.id, coalesce(d.birth_visibility, 'only_me'))         then d.birth_date end,
    'relationship', case when private.can_view(p.id, coalesce(d.relationship_visibility, 'only_me'))  then d.relationship end,
    'religion',     case when private.can_view(p.id, coalesce(d.religion_visibility, 'only_me'))      then d.religion end,
    'orgs',         case when private.can_view(p.id, coalesce(d.orgs_visibility, 'public'))           then coalesce(d.orgs, '[]'::jsonb) end,
    'featured',     to_jsonb(coalesce(d.featured, '{works,educations,addr,social,joined}'::text[])))
  from public.profiles p
  left join public.profile_details d on d.user_id = p.id
  left join public.profile_private pp on pp.user_id = p.id
  where p.id = uid;
$$;
grant execute on function public.profile_about(uuid) to anon, authenticated;

-- =====================================================================
--  ভেরিফাইড ব্যাজ ও কয়েন ওয়ালেট (ধাপ ১)
--  • পাবলিক ফিগার: আবেদন করে ফ্রিতে "অথেনটিক" ব্লু ব্যাজ (এডমিন অনুমোদন দেন)
--  • যে কেউ: কয়েন খরচ করে ব্যাজ নিতে পারেন (নির্দিষ্ট দিনের জন্য, এডমিন অনুমোদন দেন)
--  • পোস্ট, কমেন্ট, লাইক, শেয়ার করলে কয়েন জমা হয় (দিনে সর্বোচ্চ সীমা আছে)
--  • কয়েন শুধু অ্যাপের ভেতরে খরচ করা যায়, তোলা যায় না
-- =====================================================================

-- প্রোফাইলে ব্যাজ (সবাই দেখে); নিজে বদলানো যাবে না
alter table public.profiles add column if not exists verified text check (verified in ('authentic','paid'));
alter table public.profiles add column if not exists verified_until timestamptz;

create or replace function public.guard_profile_badge()
returns trigger language plpgsql set search_path = public as $$
begin
  if (new.verified is distinct from old.verified or new.verified_until is distinct from old.verified_until)
     and coalesce(current_setting('app.badge_ok', true), '') <> 'on' and not public.is_admin() then
    new.verified := old.verified; new.verified_until := old.verified_until;
  end if;
  return new;
end $$;
drop trigger if exists guard_profile_badge on public.profiles;
create trigger guard_profile_badge before update on public.profiles for each row execute function public.guard_profile_badge();
revoke all on function public.guard_profile_badge() from public, anon, authenticated;

-- ওয়ালেট: নিজের ব্যালান্স শুধু নিজে দেখে
create table if not exists public.wallets (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  coins      int not null default 0 check (coins >= 0),
  updated_at timestamptz not null default now()
);
alter table public.wallets enable row level security;
drop policy if exists "wallet own read" on public.wallets;
create policy "wallet own read" on public.wallets for select using (user_id = auth.uid() or public.is_admin());

-- কয়েনের হিসাব (কোথা থেকে এলো / কোথায় গেলো)
create table if not exists public.coin_ledger (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  amount     int not null,
  reason     text not null check (reason in ('post','comment','like','share','badge','refund','admin')),
  ref        text,
  created_at timestamptz not null default now()
);
create index if not exists coin_ledger_user on public.coin_ledger(user_id, created_at desc);
-- একই পোস্টে লাইক-আনলাইক করে বারবার কয়েন নেওয়া যাবে না
create unique index if not exists coin_ledger_once on public.coin_ledger(user_id, reason, ref) where reason in ('post','comment','like','share');
alter table public.coin_ledger enable row level security;
drop policy if exists "ledger own read" on public.coin_ledger;
create policy "ledger own read" on public.coin_ledger for select using (user_id = auth.uid() or public.is_admin());

-- নিয়মগুলো এডমিন বদলাতে পারেন
insert into public.app_settings (key, value) values
  ('earn_post', '5'), ('earn_comment', '2'), ('earn_like', '1'), ('earn_share', '3'),
  ('earn_daily_cap', '50'), ('badge_price', '500'), ('badge_days', '30')
on conflict (key) do nothing;

create or replace function private.setting_int(k text, d int)
returns int language sql stable security definer set search_path = public as $$
  select coalesce((select (value #>> '{}')::int from public.app_settings where key = k), d);
$$;

-- কয়েন যোগ/বিয়োগ (ভেতরের কাজ)
create or replace function private.add_coins(uid uuid, amt int, why text, r text)
returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  insert into public.coin_ledger (user_id, amount, reason, ref) values (uid, amt, why, r) on conflict do nothing;
  get diagnostics n = row_count;
  if n = 0 then return false; end if;
  insert into public.wallets (user_id, coins) values (uid, greatest(amt, 0))
    on conflict (user_id) do update set coins = public.wallets.coins + amt, updated_at = now();
  return true;
end $$;

-- কাজ করলে আয় (দিনে সর্বোচ্চ সীমা পর্যন্ত)
create or replace function private.earn(uid uuid, why text, r text)
returns void language plpgsql security definer set search_path = public as $$
declare amt int; cap int; today int;
begin
  if uid is null then return; end if;
  amt := private.setting_int('earn_' || why, 0);
  if amt <= 0 then return; end if;
  cap := private.setting_int('earn_daily_cap', 50);
  select coalesce(sum(amount), 0) into today from public.coin_ledger
   where user_id = uid and reason in ('post','comment','like','share')
     and created_at >= date_trunc('day', now() at time zone 'Asia/Dhaka') at time zone 'Asia/Dhaka';
  if today >= cap then return; end if;
  perform private.add_coins(uid, least(amt, cap - today), why, r);
end $$;

create or replace function public.on_earn_event()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  if tg_table_name = 'posts' then
    if new.shared_post_id is not null then
      select user_id into owner from public.posts where id = new.shared_post_id;
      if owner is distinct from new.user_id then perform private.earn(new.user_id, 'share', new.shared_post_id::text); end if;
    elsif new.kind = 'normal' then
      perform private.earn(new.user_id, 'post', new.id::text);
    end if;
  elsif tg_table_name = 'comments' then
    select user_id into owner from public.posts where id = new.post_id;
    if owner is distinct from new.user_id and char_length(trim(new.body)) >= 3 then
      perform private.earn(new.user_id, 'comment', new.post_id::text || ':' || new.id::text);
    end if;
  elsif tg_table_name = 'likes' then
    select user_id into owner from public.posts where id = new.post_id;
    if owner is distinct from new.user_id then perform private.earn(new.user_id, 'like', new.post_id::text); end if;
  end if;
  return null;
exception when others then return null;  -- কয়েনের কোনো সমস্যায় আসল কাজ আটকাবে না
end $$;
revoke all on function public.on_earn_event() from public, anon, authenticated;
drop trigger if exists earn_post on public.posts;
create trigger earn_post after insert on public.posts for each row execute function public.on_earn_event();
drop trigger if exists earn_comment on public.comments;
create trigger earn_comment after insert on public.comments for each row execute function public.on_earn_event();
drop trigger if exists earn_like on public.likes;
create trigger earn_like after insert on public.likes for each row execute function public.on_earn_event();

-- ব্যাজের আবেদন
create table if not exists public.verify_requests (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  kind        text not null check (kind in ('public_figure','paid')),
  full_name   text not null check (char_length(full_name) between 2 and 80),
  category    text check (char_length(category) <= 40),
  links       text check (char_length(links) <= 500),
  note        text check (char_length(note) <= 500),
  status      text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  admin_note  text check (char_length(admin_note) <= 300),
  coins_held  int not null default 0,
  created_at  timestamptz not null default now(),
  decided_at  timestamptz,
  decided_by  uuid references public.profiles(id) on delete set null
);
create unique index if not exists verify_one_pending on public.verify_requests(user_id) where status = 'pending';
alter table public.verify_requests enable row level security;
drop policy if exists "verify own read" on public.verify_requests;
create policy "verify own read" on public.verify_requests for select using (user_id = auth.uid() or public.is_admin());

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in
  ('like','comment','share','tag','friend_request','friend_accept','follow','group_request','group_approved','reply','mention','verify_ok','verify_no'));

create or replace function public.request_verification(p_kind text, p_name text, p_category text, p_links text, p_note text)
returns bigint language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); price int := 0; bal int; rid bigint; v text; vu timestamptz;
begin
  if me is null then raise exception 'লগইন করুন'; end if;
  select verified, verified_until into v, vu from public.profiles where id = me;
  if v = 'authentic' then raise exception 'আপনার অ্যাকাউন্ট আগেই ভেরিফাইড'; end if;
  if exists (select 1 from public.verify_requests where user_id = me and status = 'pending') then
    raise exception 'আপনার একটি আবেদন এখনো বিবেচনাধীন';
  end if;
  if p_kind = 'paid' then
    price := private.setting_int('badge_price', 500);
    select coins into bal from public.wallets where user_id = me for update;
    if coalesce(bal, 0) < price then raise exception 'যথেষ্ট কয়েন নেই (দরকার %)', price; end if;
  elsif p_kind <> 'public_figure' then raise exception 'ভুল আবেদন';
  end if;
  insert into public.verify_requests (user_id, kind, full_name, category, links, note, coins_held)
  values (me, p_kind, trim(p_name), nullif(trim(p_category), ''), nullif(trim(p_links), ''), nullif(trim(p_note), ''), price)
  returning id into rid;
  if price > 0 then perform private.add_coins(me, -price, 'badge', rid::text); end if;
  return rid;
end $$;

create or replace function public.cancel_verification(p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare r public.verify_requests;
begin
  select * into r from public.verify_requests where id = p_id and user_id = auth.uid() and status = 'pending' for update;
  if not found then raise exception 'আবেদন পাওয়া যায়নি'; end if;
  update public.verify_requests set status = 'cancelled', decided_at = now() where id = p_id;
  if r.coins_held > 0 then perform private.add_coins(r.user_id, r.coins_held, 'refund', p_id::text); end if;
end $$;

create or replace function public.decide_verification(p_id bigint, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare r public.verify_requests; days int;
begin
  if not public.is_admin() then raise exception 'শুধু অ্যাডমিন'; end if;
  select * into r from public.verify_requests where id = p_id and status = 'pending' for update;
  if not found then raise exception 'আবেদন পাওয়া যায়নি'; end if;
  update public.verify_requests set status = case when p_approve then 'approved' else 'rejected' end,
    admin_note = nullif(trim(p_note), ''), decided_at = now(), decided_by = auth.uid() where id = p_id;
  if p_approve then
    perform set_config('app.badge_ok', 'on', true);
    if r.kind = 'public_figure' then
      update public.profiles set verified = 'authentic', verified_until = null where id = r.user_id;
    else
      days := private.setting_int('badge_days', 30);
      update public.profiles set verified = 'paid',
        verified_until = greatest(now(), coalesce(case when verified = 'paid' then verified_until end, now())) + make_interval(days => days)
       where id = r.user_id;
    end if;
    perform set_config('app.badge_ok', '', true);
  elsif r.coins_held > 0 then
    perform private.add_coins(r.user_id, r.coins_held, 'refund', p_id::text);
  end if;
  insert into public.notifications (user_id, actor_id, type) values (r.user_id, auth.uid(), case when p_approve then 'verify_ok' else 'verify_no' end);
end $$;

-- অ্যাডমিন সরাসরি ব্যাজ দিতে/সরাতে পারেন
create or replace function public.admin_set_badge(p_user uuid, p_verified text, p_days int default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'শুধু অ্যাডমিন'; end if;
  if p_verified is not null and p_verified not in ('authentic','paid') then raise exception 'ভুল ব্যাজ'; end if;
  perform set_config('app.badge_ok', 'on', true);
  update public.profiles set verified = p_verified,
    verified_until = case when p_verified = 'paid' then now() + make_interval(days => coalesce(p_days, 30)) end
   where id = p_user;
  perform set_config('app.badge_ok', '', true);
end $$;

-- অ্যাডমিন কাউকে কয়েন দিতে/কাটতে পারেন
create or replace function public.admin_adjust_coins(p_user uuid, p_amount int, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare bal int;
begin
  if not public.is_admin() then raise exception 'শুধু অ্যাডমিন'; end if;
  select coalesce((select coins from public.wallets where user_id = p_user), 0) into bal;
  if bal + p_amount < 0 then raise exception 'ব্যালান্স শূন্যের নিচে যাবে'; end if;
  perform private.add_coins(p_user, p_amount, 'admin', coalesce(p_note, '') || ' #' || extract(epoch from clock_timestamp())::text);
end $$;

revoke all on function public.request_verification(text, text, text, text, text) from public, anon;
revoke all on function public.cancel_verification(bigint) from public, anon;
revoke all on function public.decide_verification(bigint, boolean, text) from public, anon;
revoke all on function public.admin_set_badge(uuid, text, int) from public, anon;
revoke all on function public.admin_adjust_coins(uuid, int, text) from public, anon;
grant execute on function public.request_verification(text, text, text, text, text) to authenticated;
grant execute on function public.cancel_verification(bigint) to authenticated;
grant execute on function public.decide_verification(bigint, boolean, text) to authenticated;
grant execute on function public.admin_set_badge(uuid, text, int) to authenticated;
grant execute on function public.admin_adjust_coins(uuid, int, text) to authenticated;
revoke all on function private.add_coins(uuid, int, text, text) from public, anon, authenticated;
revoke all on function private.earn(uuid, text, text) from public, anon, authenticated;
revoke all on function private.setting_int(text, int) from public, anon, authenticated;

-- =====================================================================
--  পোস্ট বুস্ট / বিজ্ঞাপন (ধাপ ২): কয়েন দিয়ে নিজের পোস্ট বেশি মানুষের কাছে পৌঁছানো
--  • নিজের পাবলিক পোস্ট বুস্ট করা যায়; দিন × দৈনিক দাম কয়েন লাগে
--  • পুরো উপজেলা বা নির্দিষ্ট ইউনিয়নের মানুষকে দেখানো যায়
--  • অ্যাডমিন অনুমোদন দিলে চালু হয়; বাতিল বা প্রত্যাখ্যান হলে কয়েন ফেরত
--  • হোম ফিডে "স্পন্সরড" লেখা সহ দেখায়; কতজন দেখেছেন (রিচ) গোনা হয়
-- =====================================================================

create table if not exists public.boosts (
  id          bigint generated always as identity primary key,
  post_id     bigint not null references public.posts(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  days        int not null check (days between 1 and 30),
  coins       int not null check (coins >= 0),
  union_id    bigint references public.unions(id) on delete set null,   -- খালি = পুরো উপজেলা
  status      text not null default 'pending' check (status in ('pending','active','rejected','cancelled','stopped')),
  admin_note  text check (char_length(admin_note) <= 300),
  starts_at   timestamptz,
  ends_at     timestamptz,
  reach       int not null default 0,
  created_at  timestamptz not null default now(),
  decided_at  timestamptz,
  decided_by  uuid references public.profiles(id) on delete set null
);
create index if not exists boosts_live on public.boosts(status, ends_at);
create index if not exists boosts_user on public.boosts(user_id, created_at desc);
alter table public.boosts enable row level security;
drop policy if exists "boosts own read" on public.boosts;
create policy "boosts own read" on public.boosts for select using (user_id = auth.uid() or public.is_admin());

-- একই মানুষ দিনে একবার দেখলে একবারই গোনা
create table if not exists public.boost_views (
  boost_id bigint not null references public.boosts(id) on delete cascade,
  user_id  uuid not null references public.profiles(id) on delete cascade,
  day      date not null default ((now() at time zone 'Asia/Dhaka')::date),
  primary key (boost_id, user_id, day)
);
alter table public.boost_views enable row level security;

insert into public.app_settings (key, value) values ('boost_price_day', '50'), ('feature_boost', 'true')
on conflict (key) do nothing;

alter table public.coin_ledger drop constraint if exists coin_ledger_reason_check;
alter table public.coin_ledger add constraint coin_ledger_reason_check check (reason in ('post','comment','like','share','badge','boost','refund','admin'));

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in
  ('like','comment','share','tag','friend_request','friend_accept','follow','group_request','group_approved','reply','mention','verify_ok','verify_no','boost_ok','boost_no'));

create or replace function public.request_boost(p_post bigint, p_days int, p_union bigint default null)
returns bigint language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); p public.posts; price int; bal int; bid bigint;
begin
  if me is null then raise exception 'লগইন করুন'; end if;
  if p_days is null or p_days < 1 or p_days > 30 then raise exception 'বুস্ট ১ থেকে ৩০ দিনের জন্য করা যায়'; end if;
  select * into p from public.posts where id = p_post;
  if not found or p.user_id <> me then raise exception 'শুধু নিজের পোস্ট বুস্ট করা যায়'; end if;
  if p.privacy <> 'public' or p.group_id is not null then raise exception 'শুধু পাবলিক পোস্ট বুস্ট করা যায়'; end if;
  if exists (select 1 from public.boosts where post_id = p_post and (status = 'pending' or (status = 'active' and ends_at > now()))) then
    raise exception 'এই পোস্টের একটি বুস্ট আগে থেকেই চলছে বা অপেক্ষায় আছে';
  end if;
  if p_union is not null and not exists (select 1 from public.unions where id = p_union) then raise exception 'ইউনিয়ন পাওয়া যায়নি'; end if;
  price := p_days * private.setting_int('boost_price_day', 50);
  select coins into bal from public.wallets where user_id = me for update;
  if coalesce(bal, 0) < price then raise exception 'যথেষ্ট কয়েন নেই (দরকার %)', price; end if;
  insert into public.boosts (post_id, user_id, days, coins, union_id) values (p_post, me, p_days, price, p_union) returning id into bid;
  perform private.add_coins(me, -price, 'boost', bid::text);
  return bid;
end $$;

-- অপেক্ষায় থাকলে বাতিল (পুরো কয়েন ফেরত); চালু থাকলে বন্ধ (বাকি দিনের কয়েন ফেরত)
create or replace function public.cancel_boost(p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare b public.boosts; back int := 0; left_days int;
begin
  select * into b from public.boosts where id = p_id and user_id = auth.uid() for update;
  if not found then raise exception 'বুস্ট পাওয়া যায়নি'; end if;
  if b.status = 'pending' then
    update public.boosts set status = 'cancelled', decided_at = now() where id = p_id; back := b.coins;
  elsif b.status = 'active' and b.ends_at > now() then
    left_days := floor(extract(epoch from (b.ends_at - now())) / 86400)::int;
    back := least(b.coins, left_days * (b.coins / b.days));
    update public.boosts set status = 'stopped', ends_at = now() where id = p_id;
  else raise exception 'এই বুস্ট আর বন্ধ করা যায় না';
  end if;
  if back > 0 then perform private.add_coins(b.user_id, back, 'refund', 'boost:' || p_id::text); end if;
end $$;

create or replace function public.decide_boost(p_id bigint, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare b public.boosts;
begin
  if not public.is_admin() then raise exception 'শুধু অ্যাডমিন'; end if;
  select * into b from public.boosts where id = p_id and status = 'pending' for update;
  if not found then raise exception 'বুস্ট পাওয়া যায়নি'; end if;
  if p_approve then
    update public.boosts set status = 'active', starts_at = now(), ends_at = now() + make_interval(days => b.days),
      admin_note = nullif(trim(p_note), ''), decided_at = now(), decided_by = auth.uid() where id = p_id;
  else
    update public.boosts set status = 'rejected', admin_note = nullif(trim(p_note), ''), decided_at = now(), decided_by = auth.uid() where id = p_id;
    if b.coins > 0 then perform private.add_coins(b.user_id, b.coins, 'refund', 'boost:' || p_id::text); end if;
  end if;
  insert into public.notifications (user_id, actor_id, type, post_id) values (b.user_id, auth.uid(), case when p_approve then 'boost_ok' else 'boost_no' end, b.post_id);
end $$;

-- ফিডে দেখানোর জন্য চালু বুস্ট (দর্শকের এলাকা ও ব্লক মেনে, এলোমেলো ক্রমে)
create or replace function public.active_boosts(p_limit int default 3)
returns table (boost_id bigint, post_id bigint) language sql stable security definer set search_path = public as $$
  select b.id, b.post_id
    from public.boosts b join public.posts p on p.id = b.post_id
   where b.status = 'active' and b.starts_at <= now() and b.ends_at > now()
     and p.privacy = 'public' and p.group_id is null
     and (auth.uid() is null or (p.user_id <> auth.uid() and not private.is_blocked(p.user_id, auth.uid())))
     and (b.union_id is null or b.union_id = (select union_id from public.profiles where id = auth.uid()))
     and public.setting_on('feature_boost')
   order by random()
   limit least(greatest(coalesce(p_limit, 3), 1), 5);
$$;

-- দেখা হলে রিচ গোনা (একজন দিনে একবার)
create or replace function public.boost_seen(p_ids bigint[])
returns void language plpgsql security definer set search_path = public as $$
declare bid bigint; n int;
begin
  if auth.uid() is null or p_ids is null then return; end if;
  foreach bid in array p_ids[1:5] loop
    insert into public.boost_views (boost_id, user_id)
      select b.id, auth.uid() from public.boosts b where b.id = bid and b.status = 'active' and b.ends_at > now() and b.user_id <> auth.uid()
    on conflict do nothing;
    get diagnostics n = row_count;
    if n > 0 then update public.boosts set reach = reach + 1 where id = bid; end if;
  end loop;
end $$;

revoke all on function public.request_boost(bigint, int, bigint) from public, anon;
revoke all on function public.cancel_boost(bigint) from public, anon;
revoke all on function public.decide_boost(bigint, boolean, text) from public, anon;
revoke all on function public.boost_seen(bigint[]) from public, anon;
grant execute on function public.request_boost(bigint, int, bigint) to authenticated;
grant execute on function public.cancel_boost(bigint) to authenticated;
grant execute on function public.decide_boost(bigint, boolean, text) to authenticated;
grant execute on function public.boost_seen(bigint[]) to authenticated;
grant execute on function public.active_boosts(int) to anon, authenticated;

-- =====================================================================
--  পোস্ট কতজন দেখেছেন (শুধু পোস্টকারী ও অ্যাডমিন দেখেন)
--  • ফিডে পোস্ট অন্তত ১ সেকেন্ড স্ক্রিনে থাকলে "দেখা" ধরা হয়
--  • একজন মানুষ = একবার গোনা (কতজন); প্রতিদিন প্রথমবার দেখলে মোট দেখা +১
--  • নিজের পোস্ট নিজে দেখলে গোনা হয় না
-- =====================================================================

create table if not exists public.post_views (
  post_id   bigint not null references public.posts(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  times     int not null default 1,
  first_at  timestamptz not null default now(),
  last_day  date not null default ((now() at time zone 'Asia/Dhaka')::date),
  primary key (post_id, user_id)
);
create index if not exists post_views_post on public.post_views(post_id, first_at);
alter table public.post_views enable row level security;   -- সরাসরি কেউ পড়তে/লিখতে পারে না, শুধু নিচের ফাংশন দিয়ে

create or replace function public.post_seen(p_ids bigint[])
returns void language plpgsql security definer set search_path = public as $$
declare today date := (now() at time zone 'Asia/Dhaka')::date;
begin
  if auth.uid() is null or p_ids is null then return; end if;
  insert into public.post_views (post_id, user_id)
  select p.id, auth.uid() from public.posts p
   where p.id = any (p_ids[1:30]) and p.user_id <> auth.uid() and public.post_visible(p.user_id, p.group_id, p.privacy)
  on conflict (post_id, user_id) do update set times = public.post_views.times + 1, last_day = excluded.last_day
   where public.post_views.last_day < today;
end $$;

-- পোস্টের হিসাব: শুধু পোস্টকারী (পেইজের পোস্টে পেইজের মালিক) বা অ্যাডমিন
create or replace function public.post_stats(p_id bigint)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare p public.posts; r jsonb;
begin
  select * into p from public.posts where id = p_id;
  if not found then raise exception 'পোস্ট পাওয়া যায়নি'; end if;
  if p.user_id is distinct from auth.uid() and not public.is_admin() then raise exception 'শুধু পোস্টকারী দেখতে পারেন'; end if;
  select jsonb_build_object(
    'people', count(*),
    'views', coalesce(sum(times), 0),
    'today', count(*) filter (where last_day = (now() at time zone 'Asia/Dhaka')::date),
    'boost_reach', (select coalesce(sum(reach), 0) from public.boosts where post_id = p_id))
  into r from public.post_views where post_id = p_id;
  return r;
end $$;

revoke all on function public.post_seen(bigint[]) from public, anon;
revoke all on function public.post_stats(bigint) from public, anon;
grant execute on function public.post_seen(bigint[]) to authenticated;
grant execute on function public.post_stats(bigint) to authenticated;

-- ফিডে নিজের পোস্টের চোখ-বাটনে মোট ভিউ দেখানোর জন্য (একসাথে অনেকগুলো পোস্টের)
create or replace function public.post_view_counts(p_ids bigint[])
returns table (post_id bigint, views bigint) language sql stable security definer set search_path = public as $$
  select v.post_id, sum(v.times)::bigint
    from public.post_views v join public.posts p on p.id = v.post_id
   where v.post_id = any (p_ids[1:100]) and p.user_id = auth.uid()
   group by v.post_id;
$$;
revoke all on function public.post_view_counts(bigint[]) from public, anon;
grant execute on function public.post_view_counts(bigint[]) to authenticated;

-- দেখার সময় দর্শক বন্ধু বা ফলোয়ার ছিলেন কিনা (পরে ফলো করলে "নতুন ফলোয়ার" হিসেবে গোনা যায়)
alter table public.post_views add column if not exists was_close boolean;

create or replace function public.post_seen(p_ids bigint[])
returns void language plpgsql security definer set search_path = public as $$
declare today date := (now() at time zone 'Asia/Dhaka')::date; me uuid := auth.uid();
begin
  if me is null or p_ids is null then return; end if;
  insert into public.post_views (post_id, user_id, was_close)
  select p.id, me, (private.are_friends(p.user_id, me) or exists (select 1 from public.follows f where f.follower_id = me and f.followee_id = p.user_id))
    from public.posts p
   where p.id = any (p_ids[1:30]) and p.user_id <> me and public.post_visible(p.user_id, p.group_id, p.privacy)
  on conflict (post_id, user_id) do update set times = public.post_views.times + 1, last_day = excluded.last_day
   where public.post_views.last_day < today;
end $$;

create or replace function public.post_stats(p_id bigint)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare p public.posts; r jsonb;
begin
  select * into p from public.posts where id = p_id;
  if not found then raise exception 'পোস্ট পাওয়া যায়নি'; end if;
  if p.user_id is distinct from auth.uid() and not public.is_admin() then raise exception 'শুধু পোস্টকারী দেখতে পারেন'; end if;
  with v as (
    select v.*, coalesce(v.was_close, private.are_friends(p.user_id, v.user_id)
             or exists (select 1 from public.follows f where f.follower_id = v.user_id and f.followee_id = p.user_id)) as close
      from public.post_views v where v.post_id = p_id)
  select jsonb_build_object(
    'people', count(*),
    'views', coalesce(sum(times), 0),
    'today', count(*) filter (where last_day = (now() at time zone 'Asia/Dhaka')::date),
    'close', count(*) filter (where close),
    'others', count(*) filter (where not close),
    'new_followers', count(*) filter (where not close and exists (select 1 from public.follows f
                       where f.follower_id = v.user_id and f.followee_id = p.user_id and f.created_at >= v.first_at)),
    'boost_reach', (select coalesce(sum(reach), 0) from public.boosts where post_id = p_id))
  into r from v;
  return r;
end $$;

-- =====================================================================
--  পোস্টের বিস্তারিত হিসাব ও প্রোফাইল ড্যাশবোর্ড
--  • কোথা থেকে দেখেছেন (হোম ফিড, প্রোফাইল, শেয়ার, গ্রুপ, বুস্ট…)
--  • প্রতিদিনের ভিউ (৭ দিনের গ্রাফ)
--  • পোস্ট থেকে প্রোফাইলে যাওয়া, ছবি খোলা, "আরও দেখুন" চাপা
--  • কোন এলাকা, লিঙ্গ ও বয়সের মানুষ দেখেছেন (অন্তত ১০ জন হলে)
--  • সব পোস্ট মিলিয়ে ড্যাশবোর্ড ও পোস্ট করার সেরা সময়
--  সব কিছু শুধু পোস্টকারী দেখেন; কে কে দেখেছেন তা কখনো দেখানো হয় না
-- =====================================================================

alter table public.post_views add column if not exists source text
  check (source in ('feed','boost','profile','share','group','page','post','search','saved','other'));

create table if not exists public.post_view_days (
  post_id bigint not null references public.posts(id) on delete cascade,
  day     date not null,
  n       int not null default 0,
  primary key (post_id, day)
);
alter table public.post_view_days enable row level security;

create table if not exists public.post_clicks (
  post_id    bigint not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  kind       text not null check (kind in ('profile','photo','more')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, kind)
);
alter table public.post_clicks enable row level security;

-- দেখা গোনা (উৎস সহ)। একজন দিনে একবার; প্রতিদিনের হিসাবও বাড়ে
create or replace function public.post_seen2(p_ids bigint[], p_src text[])
returns void language plpgsql security definer set search_path = public as $$
declare today date := (now() at time zone 'Asia/Dhaka')::date; me uuid := auth.uid();
begin
  if me is null or p_ids is null then return; end if;
  with t as (
    select distinct on (x.id) x.id,
           case when x.src in ('feed','boost','profile','share','group','page','post','search','saved') then x.src else 'other' end as src
      from unnest(p_ids[1:30], (coalesce(p_src, '{}'::text[]))[1:30]) as x(id, src) where x.id is not null),
  up as (
    insert into public.post_views (post_id, user_id, was_close, source)
    select p.id, me, (private.are_friends(p.user_id, me) or exists (select 1 from public.follows f where f.follower_id = me and f.followee_id = p.user_id)), t.src
      from t join public.posts p on p.id = t.id
     where p.user_id <> me and public.post_visible(p.user_id, p.group_id, p.privacy)
    on conflict (post_id, user_id) do update set times = public.post_views.times + 1, last_day = excluded.last_day
     where public.post_views.last_day < today
    returning post_id)
  insert into public.post_view_days (post_id, day, n)
  select post_id, today, count(*) from up group by post_id
  on conflict (post_id, day) do update set n = public.post_view_days.n + excluded.n;
end $$;

-- পুরনো অ্যাপের জন্য আগের নামটাও কাজ করে
create or replace function public.post_seen(p_ids bigint[])
returns void language sql security definer set search_path = public as $$
  select public.post_seen2(p_ids, null);
$$;

create or replace function public.post_click(p_post bigint, p_kind text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or p_kind not in ('profile','photo','more') then return; end if;
  insert into public.post_clicks (post_id, user_id, kind)
  select p.id, auth.uid(), p_kind from public.posts p
   where p.id = p_post and p.user_id <> auth.uid() and public.post_visible(p.user_id, p.group_id, p.privacy)
  on conflict do nothing;
end $$;

create or replace function public.post_stats(p_id bigint)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare p public.posts; r jsonb; today date := (now() at time zone 'Asia/Dhaka')::date; ppl int;
begin
  select * into p from public.posts where id = p_id;
  if not found then raise exception 'পোস্ট পাওয়া যায়নি'; end if;
  if p.user_id is distinct from auth.uid() and not public.is_admin() then raise exception 'শুধু পোস্টকারী দেখতে পারেন'; end if;
  select count(*) into ppl from public.post_views where post_id = p_id;
  with v as (
    select v.*, coalesce(v.was_close, private.are_friends(p.user_id, v.user_id)
             or exists (select 1 from public.follows f where f.follower_id = v.user_id and f.followee_id = p.user_id)) as close,
           pr.gender, pr.upazila, u.name as union_name, d.birth_date
      from public.post_views v
      join public.profiles pr on pr.id = v.user_id
      left join public.unions u on u.id = pr.union_id
      left join public.profile_details d on d.user_id = v.user_id
     where v.post_id = p_id)
  select jsonb_build_object(
    'people', count(*),
    'views', coalesce(sum(times), 0),
    'today', count(*) filter (where last_day = today),
    'close', count(*) filter (where close),
    'others', count(*) filter (where not close),
    'new_followers', count(*) filter (where not close and exists (select 1 from public.follows f
                       where f.follower_id = v.user_id and f.followee_id = p.user_id and f.created_at >= v.first_at)),
    'sources', (select coalesce(jsonb_object_agg(s, n), '{}') from (select coalesce(source, 'other') s, count(*) n from v group by 1) x),
    'areas', (select coalesce(jsonb_agg(jsonb_build_object('name', a, 'n', n) order by n desc), '[]') from
               (select coalesce(union_name, upazila, 'অজানা') a, count(*) n from v group by 1 order by 2 desc limit 6) x),
    'genders', case when ppl >= 10 then (select coalesce(jsonb_object_agg(g, n), '{}') from (select coalesce(gender, 'unknown') g, count(*) n from v group by 1) x) end,
    'ages', case when ppl >= 10 then (select coalesce(jsonb_object_agg(b, n), '{}') from (
               select case when birth_date is null then 'unknown'
                           when age(birth_date) < interval '18 years' then '13-17'
                           when age(birth_date) < interval '25 years' then '18-24'
                           when age(birth_date) < interval '35 years' then '25-34'
                           when age(birth_date) < interval '45 years' then '35-44'
                           else '45+' end b, count(*) n from v group by 1) x) end,
    'boost_reach', (select coalesce(sum(reach), 0) from public.boosts where post_id = p_id))
  into r from v;
  r := r || jsonb_build_object(
    'daily', (select jsonb_agg(jsonb_build_object('day', g::date, 'n', coalesce(d.n, 0)) order by g)
                from generate_series(today - 6, today, interval '1 day') g
                left join public.post_view_days d on d.post_id = p_id and d.day = g::date),
    'clicks', (select jsonb_build_object(
                 'profile', count(*) filter (where kind = 'profile'),
                 'photo', count(*) filter (where kind = 'photo'),
                 'more', count(*) filter (where kind = 'more')) from public.post_clicks where post_id = p_id));
  return r;
end $$;

-- সব পোস্ট মিলিয়ে নিজের ড্যাশবোর্ড (৭ বা ৩০ দিন)
create or replace function public.my_insights(p_days int default 7)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); days int := case when p_days >= 30 then 30 else 7 end;
        today date := (now() at time zone 'Asia/Dhaka')::date; since date; r jsonb;
begin
  if me is null then raise exception 'লগইন করুন'; end if;
  since := today - (days - 1);
  with mine as (select id from public.posts where user_id = me),
  v as (select v.*, coalesce(v.was_close, private.are_friends(me, v.user_id)
              or exists (select 1 from public.follows f where f.follower_id = v.user_id and f.followee_id = me)) as close
          from public.post_views v where v.post_id in (select id from mine) and (v.first_at at time zone 'Asia/Dhaka')::date >= since)
  select jsonb_build_object(
    'days', days,
    'people', (select count(distinct user_id) from v),
    'views', (select coalesce(sum(n), 0) from public.post_view_days where post_id in (select id from mine) and day >= since),
    'close', (select count(distinct user_id) from v where close),
    'others', (select count(distinct user_id) from v where not close),
    'new_followers', (select count(*) from public.follows where followee_id = me and (created_at at time zone 'Asia/Dhaka')::date >= since),
    'posts', (select count(*) from public.posts where user_id = me and (created_at at time zone 'Asia/Dhaka')::date >= since),
    'sources', (select coalesce(jsonb_object_agg(s, n), '{}') from (select coalesce(source, 'other') s, count(*) n from v group by 1) x),
    'daily', (select jsonb_agg(jsonb_build_object('day', g::date, 'n', coalesce((select sum(n) from public.post_view_days d where d.day = g::date and d.post_id in (select id from mine)), 0)) order by g)
                from generate_series(since, today, interval '1 day') g),
    'hours', (select jsonb_agg(coalesce(c, 0) order by h) from generate_series(0, 23) h
                left join (select extract(hour from first_at at time zone 'Asia/Dhaka')::int hh, count(*) c
                             from public.post_views where post_id in (select id from mine) and first_at > now() - interval '30 days' group by 1) x on x.hh = h),
    'top', (select coalesce(jsonb_agg(t order by (t->>'people')::int desc), '[]') from (
              select jsonb_build_object('id', p.id, 'body', left(p.body, 80), 'image', coalesce(p.image_urls[1], p.image_url), 'created_at', p.created_at,
                       'people', (select count(*) from v where v.post_id = p.id), 'views', (select coalesce(sum(n), 0) from public.post_view_days d where d.post_id = p.id and d.day >= since)) t
                from public.posts p where p.user_id = me and exists (select 1 from v where v.post_id = p.id)
               order by (select count(*) from v where v.post_id = p.id) desc limit 5) x))
  into r;
  return r;
end $$;

revoke all on function public.post_seen2(bigint[], text[]) from public, anon;
revoke all on function public.post_click(bigint, text) from public, anon;
revoke all on function public.my_insights(int) from public, anon;
grant execute on function public.post_seen2(bigint[], text[]) to authenticated;
grant execute on function public.post_click(bigint, text) to authenticated;
grant execute on function public.my_insights(int) to authenticated;

-- আগের দেখাগুলো থেকে প্রতিদিনের হিসাব পূরণ
insert into public.post_view_days (post_id, day, n)
select post_id, (first_at at time zone 'Asia/Dhaka')::date, count(*) from public.post_views group by 1, 2
on conflict do nothing;

-- =====================================================================
--  গড়ের সাথে তুলনা, প্রোফাইল ভিজিট, ফলোয়ার বৃদ্ধি, সাপ্তাহিক রিপোর্ট ও মাইলফলক
-- =====================================================================

-- নোটিফিকেশনে সংখ্যা রাখার জায়গা (যেমন কতজন দেখেছেন)
alter table public.notifications add column if not exists meta jsonb;
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in
  ('like','comment','share','tag','friend_request','friend_accept','follow','group_request','group_approved','reply','mention',
   'verify_ok','verify_no','boost_ok','boost_no','milestone','follower_milestone','weekly'));

-- ---------- প্রোফাইল ভিজিট (একজন দিনে একবার গোনা)
create table if not exists public.profile_visits (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  day        date not null default ((now() at time zone 'Asia/Dhaka')::date),
  primary key (profile_id, user_id, day)
);
create index if not exists profile_visits_day on public.profile_visits(profile_id, day);
alter table public.profile_visits enable row level security;

create or replace function public.profile_visit(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or p_user is null or p_user = auth.uid() or private.is_blocked(p_user, auth.uid()) then return; end if;
  insert into public.profile_visits (profile_id, user_id) values (p_user, auth.uid()) on conflict do nothing;
end $$;

-- ---------- ফলো/আনফলোর ইতিহাস ও ফলোয়ার মাইলফলক
create table if not exists public.follow_events (
  id          bigint generated always as identity primary key,
  followee_id uuid not null references public.profiles(id) on delete cascade,
  follower_id uuid not null references public.profiles(id) on delete cascade,
  kind        text not null check (kind in ('follow','unfollow')),
  at          timestamptz not null default now()
);
create index if not exists follow_events_followee on public.follow_events(followee_id, at);
alter table public.follow_events enable row level security;

create or replace function public.on_follow_event()
returns trigger language plpgsql security definer set search_path = public as $$
declare n int; m int;
begin
  if tg_op = 'INSERT' then
    insert into public.follow_events (followee_id, follower_id, kind) values (new.followee_id, new.follower_id, 'follow');
    select count(*) into n from public.follows where followee_id = new.followee_id;
    foreach m in array array[10, 50, 100, 500, 1000, 5000, 10000] loop
      if n = m and not exists (select 1 from public.notifications where user_id = new.followee_id and type = 'follower_milestone' and (meta->>'n')::int = m) then
        insert into public.notifications (user_id, actor_id, type, meta) values (new.followee_id, new.followee_id, 'follower_milestone', jsonb_build_object('n', m));
      end if;
    end loop;
  else
    -- অ্যাকাউন্ট মুছে গেলে (cascade) ইতিহাস লেখার দরকার নেই
    if exists (select 1 from public.profiles where id = old.followee_id) and exists (select 1 from public.profiles where id = old.follower_id) then
      insert into public.follow_events (followee_id, follower_id, kind) values (old.followee_id, old.follower_id, 'unfollow');
    end if;
  end if;
  return null;
exception when others then return null;
end $$;
revoke all on function public.on_follow_event() from public, anon, authenticated;
drop trigger if exists follow_event on public.follows;
create trigger follow_event after insert or delete on public.follows for each row execute function public.on_follow_event();

-- ---------- পোস্ট দেখার মাইলফলক (১০০, ৫০০, ১০০০… জন)
create or replace function public.on_post_view_milestone()
returns trigger language plpgsql security definer set search_path = public as $$
declare n int; owner uuid; m int;
begin
  select count(*) into n from public.post_views where post_id = new.post_id;
  if n not in (100, 500, 1000, 5000, 10000) then return null; end if;
  select user_id into owner from public.posts where id = new.post_id;
  m := n;
  if owner is not null and not exists (select 1 from public.notifications where user_id = owner and type = 'milestone' and post_id = new.post_id and (meta->>'n')::int = m) then
    insert into public.notifications (user_id, actor_id, type, post_id, meta) values (owner, owner, 'milestone', new.post_id, jsonb_build_object('n', m));
  end if;
  return null;
exception when others then return null;
end $$;
revoke all on function public.on_post_view_milestone() from public, anon, authenticated;
drop trigger if exists post_view_milestone on public.post_views;
create trigger post_view_milestone after insert on public.post_views for each row execute function public.on_post_view_milestone();

-- ---------- সাপ্তাহিক রিপোর্ট: প্রতি শুক্রবার থেকে নতুন সপ্তাহ; অ্যাপ খুললে আগের সপ্তাহের রিপোর্ট একবার তৈরি হয়
create or replace function public.ensure_weekly_report()
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); today date := (now() at time zone 'Asia/Dhaka')::date;
        wk_start date; ppl int; prev int; vis int; fol int;
begin
  if me is null then return; end if;
  wk_start := today - ((extract(dow from today)::int - 5 + 7) % 7);   -- এই সপ্তাহের শুক্রবার
  if exists (select 1 from public.notifications where user_id = me and type = 'weekly' and (meta->>'week') = wk_start::text) then return; end if;
  select count(distinct v.user_id) into ppl from public.post_views v join public.posts p on p.id = v.post_id
   where p.user_id = me and (v.first_at at time zone 'Asia/Dhaka')::date between wk_start - 7 and wk_start - 1;
  select count(distinct v.user_id) into prev from public.post_views v join public.posts p on p.id = v.post_id
   where p.user_id = me and (v.first_at at time zone 'Asia/Dhaka')::date between wk_start - 14 and wk_start - 8;
  select count(*) into vis from public.profile_visits where profile_id = me and day between wk_start - 7 and wk_start - 1;
  select count(*) into fol from public.follows where followee_id = me and (created_at at time zone 'Asia/Dhaka')::date between wk_start - 7 and wk_start - 1;
  if ppl = 0 and vis = 0 and fol = 0 then return; end if;   -- কিছু না ঘটলে রিপোর্ট পাঠাই না
  insert into public.notifications (user_id, actor_id, type, meta)
  values (me, me, 'weekly', jsonb_build_object('week', wk_start, 'people', ppl, 'prev', prev, 'visits', vis, 'followers', fol));
end $$;

-- ---------- পোস্টের হিসাবে গড়ের সাথে তুলনা
create or replace function public.post_avg_people(p_id bigint)
returns numeric language sql stable security definer set search_path = public as $$
  select avg(c) from (
    select (select count(*) from public.post_views v where v.post_id = p.id) c
      from public.posts p
     where p.user_id = (select user_id from public.posts where id = p_id) and p.id <> p_id
       and p.user_id = auth.uid()
     order by p.created_at desc limit 20) x;
$$;

-- ---------- ড্যাশবোর্ডে প্রোফাইল ভিজিট ও ফলোয়ার বৃদ্ধি
create or replace function public.my_growth(p_days int default 7)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); days int := case when p_days >= 30 then 30 else 7 end;
        today date := (now() at time zone 'Asia/Dhaka')::date; since date;
begin
  if me is null then raise exception 'লগইন করুন'; end if;
  since := today - (days - 1);
  return jsonb_build_object(
    'visits', (select count(*) from public.profile_visits where profile_id = me and day >= since),
    'visitors', (select count(distinct user_id) from public.profile_visits where profile_id = me and day >= since),
    'visits_daily', (select jsonb_agg(jsonb_build_object('day', g::date, 'n',
                       (select count(*) from public.profile_visits pv where pv.profile_id = me and pv.day = g::date)) order by g)
                     from generate_series(since, today, interval '1 day') g),
    'followers', (select count(*) from public.follows where followee_id = me),
    'gained', (select count(*) from public.follows where followee_id = me and (created_at at time zone 'Asia/Dhaka')::date >= since),
    'lost', (select count(*) from public.follow_events where followee_id = me and kind = 'unfollow' and (at at time zone 'Asia/Dhaka')::date >= since),
    'follow_daily', (select jsonb_agg(jsonb_build_object('day', g::date,
                       'plus', (select count(*) from public.follows f where f.followee_id = me and (f.created_at at time zone 'Asia/Dhaka')::date = g::date),
                       'minus', (select count(*) from public.follow_events e where e.followee_id = me and e.kind = 'unfollow' and (e.at at time zone 'Asia/Dhaka')::date = g::date)) order by g)
                     from generate_series(since, today, interval '1 day') g));
end $$;

revoke all on function public.profile_visit(uuid) from public, anon;
revoke all on function public.ensure_weekly_report() from public, anon;
revoke all on function public.post_avg_people(bigint) from public, anon;
revoke all on function public.my_growth(int) from public, anon;
grant execute on function public.profile_visit(uuid) to authenticated;
grant execute on function public.ensure_weekly_report() to authenticated;
grant execute on function public.post_avg_people(bigint) to authenticated;
grant execute on function public.my_growth(int) to authenticated;

-- =====================================================================
--  পেইজ ও গ্রুপের ড্যাশবোর্ড
--  • পেইজ: শুধু পেইজের মালিক দেখেন; গ্রুপ: শুধু গ্রুপ অ্যাডমিন দেখেন
--  • পোস্টের দর্শক, ভিউ, উৎস, সেরা সময়, সেরা পোস্ট
--  • পেইজ: ফলোয়ার বাড়া/কমা ও পেইজ ভিজিট
--  • গ্রুপ: সদস্য যোগ/ছাড়া, সক্রিয় সদস্য, অপেক্ষমাণ অনুরোধ ও গ্রুপ ভিজিট
-- =====================================================================

create table if not exists public.ent_visits (
  kind    text not null check (kind in ('page','group')),
  ent_id  bigint not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  day     date not null default ((now() at time zone 'Asia/Dhaka')::date),
  primary key (kind, ent_id, user_id, day)
);
create index if not exists ent_visits_day on public.ent_visits(kind, ent_id, day);
alter table public.ent_visits enable row level security;

create table if not exists public.ent_events (
  id      bigint generated always as identity primary key,
  kind    text not null check (kind in ('page','group')),
  ent_id  bigint not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  event   text not null check (event in ('join','leave')),
  at      timestamptz not null default now()
);
create index if not exists ent_events_ent on public.ent_events(kind, ent_id, at);
alter table public.ent_events enable row level security;

create or replace function public.ent_visit(p_kind text, p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or p_kind not in ('page','group') then return; end if;
  if p_kind = 'page' and not exists (select 1 from public.pages where id = p_id and owner_id <> auth.uid()) then return; end if;
  if p_kind = 'group' and (not exists (select 1 from public.groups where id = p_id) or public.is_group_admin(p_id)) then return; end if;
  insert into public.ent_visits (kind, ent_id, user_id) values (p_kind, p_id, auth.uid()) on conflict do nothing;
end $$;

-- পেইজ ফলো/আনফলো ও গ্রুপে যোগ/ছাড়ার ইতিহাস
create or replace function public.on_ent_event()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'page_follows' then
    if tg_op = 'INSERT' then insert into public.ent_events (kind, ent_id, user_id, event) values ('page', new.page_id, new.user_id, 'join');
    elsif exists (select 1 from public.pages where id = old.page_id) and exists (select 1 from public.profiles where id = old.user_id) then
      insert into public.ent_events (kind, ent_id, user_id, event) values ('page', old.page_id, old.user_id, 'leave');
    end if;
  else
    if tg_op = 'INSERT' and new.status = 'active' then insert into public.ent_events (kind, ent_id, user_id, event) values ('group', new.group_id, new.user_id, 'join');
    elsif tg_op = 'UPDATE' and old.status = 'pending' and new.status = 'active' then insert into public.ent_events (kind, ent_id, user_id, event) values ('group', new.group_id, new.user_id, 'join');
    elsif tg_op = 'DELETE' and old.status = 'active' and exists (select 1 from public.groups where id = old.group_id) and exists (select 1 from public.profiles where id = old.user_id) then
      insert into public.ent_events (kind, ent_id, user_id, event) values ('group', old.group_id, old.user_id, 'leave');
    end if;
  end if;
  return null;
exception when others then return null;
end $$;
revoke all on function public.on_ent_event() from public, anon, authenticated;
drop trigger if exists ent_event on public.page_follows;
create trigger ent_event after insert or delete on public.page_follows for each row execute function public.on_ent_event();
drop trigger if exists ent_event on public.group_members;
create trigger ent_event after insert or update of status or delete on public.group_members for each row execute function public.on_ent_event();

create or replace function public.ent_insights(p_kind text, p_id bigint, p_days int default 7)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare days int := case when p_days >= 30 then 30 else 7 end;
        today date := (now() at time zone 'Asia/Dhaka')::date; since date; r jsonb; ids bigint[];
begin
  if auth.uid() is null then raise exception 'লগইন করুন'; end if;
  if p_kind = 'page' then
    if not (exists (select 1 from public.pages where id = p_id and owner_id = auth.uid()) or public.is_admin()) then raise exception 'শুধু পেইজের মালিক দেখতে পারেন'; end if;
    select coalesce(array_agg(id), '{}') into ids from public.posts where page_id = p_id;
  elsif p_kind = 'group' then
    if not (public.is_group_admin(p_id) or public.is_admin()) then raise exception 'শুধু গ্রুপ অ্যাডমিন দেখতে পারেন'; end if;
    select coalesce(array_agg(id), '{}') into ids from public.posts where group_id = p_id;
  else raise exception 'ভুল ধরন';
  end if;
  since := today - (days - 1);
  with v as (
    select v.*, case when p_kind = 'page' then exists (select 1 from public.page_follows f where f.page_id = p_id and f.user_id = v.user_id)
                     else exists (select 1 from public.group_members m where m.group_id = p_id and m.user_id = v.user_id and m.status = 'active') end as close
      from public.post_views v where v.post_id = any (ids) and (v.first_at at time zone 'Asia/Dhaka')::date >= since)
  select jsonb_build_object(
    'days', days,
    'people', (select count(distinct user_id) from v),
    'views', (select coalesce(sum(n), 0) from public.post_view_days where post_id = any (ids) and day >= since),
    'close', (select count(distinct user_id) from v where close),
    'others', (select count(distinct user_id) from v where not close),
    'posts', (select count(*) from public.posts where id = any (ids) and (created_at at time zone 'Asia/Dhaka')::date >= since),
    'sources', (select coalesce(jsonb_object_agg(s, n), '{}') from (select coalesce(source, 'other') s, count(*) n from v group by 1) x),
    'daily', (select jsonb_agg(jsonb_build_object('day', g::date, 'n', coalesce((select sum(n) from public.post_view_days d where d.day = g::date and d.post_id = any (ids)), 0)) order by g)
                from generate_series(since, today, interval '1 day') g),
    'hours', (select jsonb_agg(coalesce(c, 0) order by h) from generate_series(0, 23) h
                left join (select extract(hour from first_at at time zone 'Asia/Dhaka')::int hh, count(*) c
                             from public.post_views where post_id = any (ids) and first_at > now() - interval '30 days' group by 1) x on x.hh = h),
    'top', (select coalesce(jsonb_agg(t order by (t->>'people')::int desc), '[]') from (
              select jsonb_build_object('id', p.id, 'body', left(p.body, 80), 'image', coalesce(p.image_urls[1], p.image_url), 'created_at', p.created_at,
                       'people', (select count(*) from v where v.post_id = p.id), 'views', (select coalesce(sum(n), 0) from public.post_view_days d where d.post_id = p.id and d.day >= since)) t
                from public.posts p where p.id = any (ids) and exists (select 1 from v where v.post_id = p.id)
               order by (select count(*) from v where v.post_id = p.id) desc limit 5) x),
    'visits', (select count(*) from public.ent_visits where kind = p_kind and ent_id = p_id and day >= since),
    'visitors', (select count(distinct user_id) from public.ent_visits where kind = p_kind and ent_id = p_id and day >= since),
    'visits_daily', (select jsonb_agg(jsonb_build_object('day', g::date, 'n',
                       (select count(*) from public.ent_visits e where e.kind = p_kind and e.ent_id = p_id and e.day = g::date)) order by g)
                     from generate_series(since, today, interval '1 day') g),
    'followers', case when p_kind = 'page' then (select count(*) from public.page_follows where page_id = p_id)
                      else (select count(*) from public.group_members where group_id = p_id and status = 'active') end,
    'gained', (select count(*) from (
                 select user_id, (at at time zone 'Asia/Dhaka')::date d from public.ent_events where kind = p_kind and ent_id = p_id and event = 'join'
                 union select user_id, (created_at at time zone 'Asia/Dhaka')::date from public.page_follows where p_kind = 'page' and page_id = p_id) x where d >= since),
    'lost', (select count(*) from public.ent_events where kind = p_kind and ent_id = p_id and event = 'leave' and (at at time zone 'Asia/Dhaka')::date >= since),
    'follow_daily', (select jsonb_agg(jsonb_build_object('day', g::date,
                       'plus', (select count(*) from (
                                  select user_id, (at at time zone 'Asia/Dhaka')::date d from public.ent_events where kind = p_kind and ent_id = p_id and event = 'join'
                                  union select user_id, (created_at at time zone 'Asia/Dhaka')::date from public.page_follows where p_kind = 'page' and page_id = p_id) x where d = g::date),
                       'minus', (select count(*) from public.ent_events e where e.kind = p_kind and e.ent_id = p_id and e.event = 'leave' and (e.at at time zone 'Asia/Dhaka')::date = g::date)) order by g)
                     from generate_series(since, today, interval '1 day') g),
    'pending', case when p_kind = 'group' then (select count(*) from public.group_members where group_id = p_id and status = 'pending') end,
    'active_members', case when p_kind = 'group' then (select count(distinct u) from (
                         select user_id u from public.posts where group_id = p_id and (created_at at time zone 'Asia/Dhaka')::date >= since
                         union select c.user_id from public.comments c join public.posts p on p.id = c.post_id where p.group_id = p_id and (c.created_at at time zone 'Asia/Dhaka')::date >= since) x) end)
  into r;
  return r;
end $$;

revoke all on function public.ent_visit(text, bigint) from public, anon;
revoke all on function public.ent_insights(text, bigint, int) from public, anon;
grant execute on function public.ent_visit(text, bigint) to authenticated;
grant execute on function public.ent_insights(text, bigint, int) to authenticated;

-- প্রোফাইলের ফলোয়ার বৃদ্ধি: পরে আনফলো করলেও "নতুন ফলো" হিসাবে থাকে
create or replace function public.my_growth(p_days int default 7)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); days int := case when p_days >= 30 then 30 else 7 end;
        today date := (now() at time zone 'Asia/Dhaka')::date; since date;
begin
  if me is null then raise exception 'লগইন করুন'; end if;
  since := today - (days - 1);
  return (with fj as (
      select follower_id, (at at time zone 'Asia/Dhaka')::date d from public.follow_events where followee_id = me and kind = 'follow'
      union select follower_id, (created_at at time zone 'Asia/Dhaka')::date from public.follows where followee_id = me)
    select jsonb_build_object(
    'visits', (select count(*) from public.profile_visits where profile_id = me and day >= since),
    'visitors', (select count(distinct user_id) from public.profile_visits where profile_id = me and day >= since),
    'visits_daily', (select jsonb_agg(jsonb_build_object('day', g::date, 'n',
                       (select count(*) from public.profile_visits pv where pv.profile_id = me and pv.day = g::date)) order by g)
                     from generate_series(since, today, interval '1 day') g),
    'followers', (select count(*) from public.follows where followee_id = me),
    'gained', (select count(*) from fj where d >= since),
    'lost', (select count(*) from public.follow_events where followee_id = me and kind = 'unfollow' and (at at time zone 'Asia/Dhaka')::date >= since),
    'follow_daily', (select jsonb_agg(jsonb_build_object('day', g::date,
                       'plus', (select count(*) from fj where fj.d = g::date),
                       'minus', (select count(*) from public.follow_events e where e.followee_id = me and e.kind = 'unfollow' and (e.at at time zone 'Asia/Dhaka')::date = g::date)) order by g)
                     from generate_series(since, today, interval '1 day') g)));
end $$;

-- =====================================================================
--  পেইজের ভেরিফাইড ব্যাজ
--  • পরিচিত প্রতিষ্ঠান/ব্র্যান্ড: ফ্রিতে আবেদন; অথবা কয়েন দিয়ে মেয়াদি ব্যাজ
--  • শুধু পেইজের মালিক আবেদন করতে পারেন; অ্যাডমিন অনুমোদন দেন
--  (পোস্ট বুস্ট পেইজের পোস্টেও আগে থেকেই চলে, কারণ পেইজের পোস্টের মালিক = পেইজের মালিক)
-- =====================================================================

alter table public.pages add column if not exists verified text check (verified in ('authentic','paid'));
alter table public.pages add column if not exists verified_until timestamptz;

create or replace function public.guard_page_badge()
returns trigger language plpgsql set search_path = public as $$
begin
  if (new.verified is distinct from old.verified or new.verified_until is distinct from old.verified_until)
     and coalesce(current_setting('app.badge_ok', true), '') <> 'on' and not public.is_admin() then
    new.verified := old.verified; new.verified_until := old.verified_until;
  end if;
  return new;
end $$;
drop trigger if exists guard_page_badge on public.pages;
create trigger guard_page_badge before update on public.pages for each row execute function public.guard_page_badge();
revoke all on function public.guard_page_badge() from public, anon, authenticated;

alter table public.verify_requests add column if not exists page_id bigint references public.pages(id) on delete cascade;
drop index if exists public.verify_one_pending;
create unique index if not exists verify_one_pending2 on public.verify_requests(user_id, coalesce(page_id, 0)) where status = 'pending';

drop function if exists public.request_verification(text, text, text, text, text);
create or replace function public.request_verification(p_kind text, p_name text, p_category text, p_links text, p_note text, p_page bigint default null)
returns bigint language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); price int := 0; bal int; rid bigint; v text;
begin
  if me is null then raise exception 'লগইন করুন'; end if;
  if p_page is not null then
    select verified into v from public.pages where id = p_page and owner_id = me;
    if not found then raise exception 'শুধু পেইজের মালিক আবেদন করতে পারেন'; end if;
  else
    select verified into v from public.profiles where id = me;
  end if;
  if v = 'authentic' then raise exception 'আগেই ভেরিফাইড'; end if;
  if exists (select 1 from public.verify_requests where user_id = me and page_id is not distinct from p_page and status = 'pending') then
    raise exception 'একটি আবেদন এখনো বিবেচনাধীন';
  end if;
  if p_kind = 'paid' then
    price := private.setting_int('badge_price', 500);
    select coins into bal from public.wallets where user_id = me for update;
    if coalesce(bal, 0) < price then raise exception 'যথেষ্ট কয়েন নেই (দরকার %)', price; end if;
  elsif p_kind <> 'public_figure' then raise exception 'ভুল আবেদন';
  end if;
  insert into public.verify_requests (user_id, page_id, kind, full_name, category, links, note, coins_held)
  values (me, p_page, p_kind, trim(p_name), nullif(trim(p_category), ''), nullif(trim(p_links), ''), nullif(trim(p_note), ''), price)
  returning id into rid;
  if price > 0 then perform private.add_coins(me, -price, 'badge', rid::text); end if;
  return rid;
end $$;

create or replace function public.decide_verification(p_id bigint, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare r public.verify_requests; days int; pname text;
begin
  if not public.is_admin() then raise exception 'শুধু অ্যাডমিন'; end if;
  select * into r from public.verify_requests where id = p_id and status = 'pending' for update;
  if not found then raise exception 'আবেদন পাওয়া যায়নি'; end if;
  update public.verify_requests set status = case when p_approve then 'approved' else 'rejected' end,
    admin_note = nullif(trim(p_note), ''), decided_at = now(), decided_by = auth.uid() where id = p_id;
  days := private.setting_int('badge_days', 30);
  if p_approve then
    perform set_config('app.badge_ok', 'on', true);
    if r.page_id is not null then
      update public.pages set verified = case when r.kind = 'public_figure' then 'authentic' else 'paid' end,
        verified_until = case when r.kind = 'public_figure' then null
                              else greatest(now(), coalesce(case when verified = 'paid' then verified_until end, now())) + make_interval(days => days) end
       where id = r.page_id;
    elsif r.kind = 'public_figure' then
      update public.profiles set verified = 'authentic', verified_until = null where id = r.user_id;
    else
      update public.profiles set verified = 'paid',
        verified_until = greatest(now(), coalesce(case when verified = 'paid' then verified_until end, now())) + make_interval(days => days)
       where id = r.user_id;
    end if;
    perform set_config('app.badge_ok', '', true);
  elsif r.coins_held > 0 then
    perform private.add_coins(r.user_id, r.coins_held, 'refund', p_id::text);
  end if;
  select name into pname from public.pages where id = r.page_id;
  insert into public.notifications (user_id, actor_id, type, meta)
  values (r.user_id, auth.uid(), case when p_approve then 'verify_ok' else 'verify_no' end, case when pname is not null then jsonb_build_object('page', pname) end);
end $$;

create or replace function public.admin_set_page_badge(p_page bigint, p_verified text, p_days int default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'শুধু অ্যাডমিন'; end if;
  if p_verified is not null and p_verified not in ('authentic','paid') then raise exception 'ভুল ব্যাজ'; end if;
  perform set_config('app.badge_ok', 'on', true);
  update public.pages set verified = p_verified,
    verified_until = case when p_verified = 'paid' then now() + make_interval(days => coalesce(p_days, 30)) end
   where id = p_page;
  perform set_config('app.badge_ok', '', true);
end $$;

revoke all on function public.request_verification(text, text, text, text, text, bigint) from public, anon;
revoke all on function public.admin_set_page_badge(bigint, text, int) from public, anon;
grant execute on function public.request_verification(text, text, text, text, text, bigint) to authenticated;
grant execute on function public.admin_set_page_badge(bigint, text, int) to authenticated;

-- =====================================================================
--  পেইজের কভার ছবি, প্রোফাইল ছবির পোস্ট ও ছবির অ্যালবাম
-- =====================================================================
alter table public.pages add column if not exists cover_url text check (char_length(cover_url) <= 500);
alter table public.albums add column if not exists page_id bigint references public.pages(id) on delete cascade;
create index if not exists albums_page_idx on public.albums(page_id, created_at desc);

-- পেইজের অ্যালবাম শুধু পেইজের মালিক তৈরি করতে পারেন
drop policy if exists "albums insert" on public.albums;
create policy "albums insert" on public.albums for insert to authenticated
  with check (user_id = auth.uid() and (page_id is null or exists (select 1 from public.pages pg where pg.id = page_id and pg.owner_id = auth.uid())));

-- পোস্ট: পেইজের নামেও প্রোফাইল/কভার ছবির পোস্ট করা যায়; অ্যালবাম আর পোস্ট একই জায়গার (প্রোফাইল বা একই পেইজ) হতে হবে
drop policy if exists "posts insert" on public.posts;
create policy "posts insert" on public.posts for insert to authenticated
  with check (user_id = auth.uid() and like_count = 0 and comment_count = 0 and reactions = '{}'::jsonb and share_count = 0 and save_count = 0 and pinned_comment_id is null
    and (shared_post_id is null or public.can_share_post(shared_post_id))
    and (page_id is null or exists (select 1 from public.pages pg where pg.id = posts.page_id and pg.owner_id = auth.uid()))
    and (group_id is null or public.is_group_member(group_id))
    and (album_id is null or exists (select 1 from public.albums a where a.id = posts.album_id and a.user_id = auth.uid() and a.page_id is not distinct from posts.page_id))
    and (kind = 'normal' or (group_id is null and shared_post_id is null)));
-- অ্যালবামের ছবি পেইজের পোস্টেও হতে পারে (গ্রুপে নয়)
alter table public.posts drop constraint if exists posts_album_scope;
alter table public.posts add constraint posts_album_scope check (album_id is null or group_id is null);


-- =====================================================================
--  পেইজে মেসেজ ও অটো মেসেজ
--  • যে কেউ পেইজকে মেসেজ পাঠাতে পারেন; পেইজের মালিক পেইজের নামে উত্তর দেন
--  • মালিক অটো মেসেজ চালু রাখলে কেউ মেসেজ পাঠালেই সাথে সাথে সেটা উত্তর হিসেবে যায়
--    (একই মানুষকে ২৪ ঘণ্টায় একবার; পেইজ নিজে উত্তর দিয়ে থাকলে আর যায় না)
-- =====================================================================

alter table public.messages add column if not exists page_id bigint references public.pages(id) on delete cascade;
alter table public.messages add column if not exists is_auto boolean not null default false;
create index if not exists messages_page_idx on public.messages(page_id, created_at desc);

alter table public.pages add column if not exists auto_reply text check (char_length(auto_reply) <= 1000);
alter table public.pages add column if not exists auto_reply_on boolean not null default false;

drop policy if exists "messages send" on public.messages;
create policy "messages send" on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and read_at is null and is_auto = false and not public.is_blocked(sender_id, recipient_id)
    and (page_id is null or exists (select 1 from public.pages pg where pg.id = messages.page_id and pg.owner_id in (messages.sender_id, messages.recipient_id))));

-- কথোপকথনের তালিকা: সাধারণ মেসেজ, পেইজকে পাঠানো মেসেজ, আর নিজের পেইজে আসা মেসেজ
drop function if exists public.my_conversations();
create or replace function public.my_conversations()
returns table (partner_id uuid, page_id bigint, as_page boolean, page_name text, name text, avatar_url text, last_body text, last_at timestamptz, last_mine boolean, unread bigint)
language sql stable security invoker set search_path = public as $$
  with m as (
    select case when sender_id = auth.uid() then recipient_id else sender_id end as partner, page_id,
           body, created_at, sender_id = auth.uid() as mine,
           (recipient_id = auth.uid() and read_at is null) as un
      from public.messages
     where auth.uid() in (sender_id, recipient_id)
  ), last as (
    select distinct on (partner, coalesce(page_id, 0)) partner, page_id, body, created_at, mine from m order by partner, coalesce(page_id, 0), created_at desc
  )
  select l.partner, l.page_id, coalesce(pg.owner_id = auth.uid(), false), pg.name,
         case when l.page_id is not null and pg.owner_id <> auth.uid() then pg.name else p.name end,
         case when l.page_id is not null and pg.owner_id <> auth.uid() then pg.avatar_url else p.avatar_url end,
         l.body, l.created_at, l.mine,
         (select count(*) from m where m.partner = l.partner and m.page_id is not distinct from l.page_id and m.un)
    from last l join public.profiles p on p.id = l.partner left join public.pages pg on pg.id = l.page_id
   order by l.created_at desc;
$$;

create or replace function public.mark_read2(partner uuid, p_page bigint default null)
returns void language sql security definer set search_path = public as $$
  update public.messages set read_at = now()
   where recipient_id = auth.uid() and sender_id = partner and page_id is not distinct from p_page and read_at is null;
$$;
revoke all on function public.mark_read2(uuid, bigint) from public, anon;
grant execute on function public.mark_read2(uuid, bigint) to authenticated;

create or replace function public.on_page_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare pg public.pages;
begin
  if new.page_id is null or new.is_auto then return null; end if;
  select * into pg from public.pages where id = new.page_id;
  if not found or pg.owner_id <> new.recipient_id or not pg.auto_reply_on or coalesce(trim(pg.auto_reply), '') = '' then return null; end if;
  if exists (select 1 from public.messages where page_id = new.page_id and sender_id = pg.owner_id and recipient_id = new.sender_id
              and created_at > now() - interval '24 hours') then return null; end if;
  insert into public.messages (sender_id, recipient_id, body, page_id, is_auto) values (pg.owner_id, new.sender_id, pg.auto_reply, new.page_id, true);
  return null;
exception when others then return null;
end $$;
revoke all on function public.on_page_message() from public, anon, authenticated;
drop trigger if exists page_auto_reply on public.messages;
create trigger page_auto_reply after insert on public.messages for each row execute function public.on_page_message();

-- =====================================================================
--  পেইজ: একাধিক অ্যাডমিন, পিন করা পোস্ট, মেসেজে প্রশ্নের তৈরি উত্তর, ঠিকানা ও ম্যাপ
--  • অ্যাডমিনরা পেইজের নামে পোস্ট, মেসেজের উত্তর, পোস্ট পিন ও ড্যাশবোর্ড দেখতে পারেন
--  • পেইজ এডিট, মুছে ফেলা, ব্যাজ, অ্যাডমিন যোগ/বাদ, অটো মেসেজ ও প্রশ্ন-উত্তর শুধু মালিক
-- =====================================================================

create table if not exists public.page_admins (
  page_id    bigint not null references public.pages(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  added_by   uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (page_id, user_id)
);
alter table public.page_admins enable row level security;
drop policy if exists "page admins read" on public.page_admins;
create policy "page admins read" on public.page_admins for select using (true);   -- কে কোন পেইজের অ্যাডমিন তা গোপন নয়

alter table public.pages add column if not exists pinned_post_id bigint references public.posts(id) on delete set null;
alter table public.pages add column if not exists faqs jsonb not null default '[]'::jsonb;
alter table public.pages add column if not exists address text check (char_length(address) <= 200);
alter table public.pages add column if not exists lat double precision check (lat between -90 and 90);
alter table public.pages add column if not exists lng double precision check (lng between -180 and 180);

create or replace function public.valid_faqs(j jsonb)
returns boolean language sql immutable set search_path = public as $$
  select jsonb_typeof(j) = 'array' and jsonb_array_length(j) <= 4 and not exists (
    select 1 from jsonb_array_elements(j) e
     where jsonb_typeof(e) <> 'object' or char_length(coalesce(e->>'q', '')) not between 1 and 80 or char_length(coalesce(e->>'a', '')) not between 1 and 1000);
$$;
do $$ begin
  alter table public.pages add constraint pages_faqs_valid check (public.valid_faqs(faqs));
exception when duplicate_object then null; end $$;

-- পেইজের "স্টাফ" = মালিক বা অ্যাডমিন
create or replace function private.is_page_staff(p_page bigint, u uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select u is not null and p_page is not null and (exists (select 1 from public.pages where id = p_page and owner_id = u)
      or exists (select 1 from public.page_admins where page_id = p_page and user_id = u));
$$;
create or replace function public.is_page_staff(p_page bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select private.is_page_staff(p_page, auth.uid());
$$;
revoke all on function public.is_page_staff(bigint) from public, anon;
grant execute on function public.is_page_staff(bigint) to authenticated;

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in
  ('like','comment','share','tag','friend_request','friend_accept','follow','group_request','group_approved','reply','mention',
   'verify_ok','verify_no','boost_ok','boost_no','milestone','follower_milestone','weekly','page_admin'));

-- অ্যাডমিন যোগ/বাদ (শুধু মালিক)
create or replace function public.add_page_admin(p_page bigint, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare pname text;
begin
  select name into pname from public.pages where id = p_page and owner_id = auth.uid();
  if not found then raise exception 'শুধু পেইজের মালিক অ্যাডমিন যোগ করতে পারেন'; end if;
  if p_user = auth.uid() then raise exception 'আপনি তো মালিক'; end if;
  if (select count(*) from public.page_admins where page_id = p_page) >= 10 then raise exception 'সর্বোচ্চ ১০ জন অ্যাডমিন রাখা যায়'; end if;
  if private.is_blocked(auth.uid(), p_user) then raise exception 'এই ব্যক্তিকে যোগ করা যাবে না'; end if;
  insert into public.page_admins (page_id, user_id, added_by) values (p_page, p_user, auth.uid()) on conflict do nothing;
  if found then
    insert into public.notifications (user_id, actor_id, type, meta) values (p_user, auth.uid(), 'page_admin', jsonb_build_object('page', pname, 'page_id', p_page));
  end if;
end $$;
create or replace function public.remove_page_admin(p_page bigint, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  -- মালিক যে কাউকে বাদ দিতে পারেন; অ্যাডমিন নিজে চাইলে সরে যেতে পারেন
  if not (exists (select 1 from public.pages where id = p_page and owner_id = auth.uid()) or p_user = auth.uid()) then raise exception 'অনুমতি নেই'; end if;
  delete from public.page_admins where page_id = p_page and user_id = p_user;
end $$;

-- পোস্ট পিন (মালিক বা অ্যাডমিন); null দিলে পিন সরে যায়
create or replace function public.pin_page_post(p_page bigint, p_post bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not private.is_page_staff(p_page, auth.uid()) then raise exception 'অনুমতি নেই'; end if;
  if p_post is not null and not exists (select 1 from public.posts where id = p_post and page_id = p_page) then raise exception 'এই পেইজের পোস্ট নয়'; end if;
  update public.pages set pinned_post_id = p_post where id = p_page;
end $$;

-- পেইজের নামে পোস্ট: মালিক বা অ্যাডমিন
drop policy if exists "posts insert" on public.posts;
create policy "posts insert" on public.posts for insert to authenticated
  with check (user_id = auth.uid() and like_count = 0 and comment_count = 0 and reactions = '{}'::jsonb and share_count = 0 and save_count = 0 and pinned_comment_id is null
    and (shared_post_id is null or public.can_share_post(shared_post_id))
    and (page_id is null or private.is_page_staff(posts.page_id, auth.uid()))
    and (group_id is null or public.is_group_member(group_id))
    and (album_id is null or exists (select 1 from public.albums a where a.id = posts.album_id and (a.user_id = auth.uid() or (a.page_id is not null and private.is_page_staff(a.page_id, auth.uid()))) and a.page_id is not distinct from posts.page_id))
    and (kind = 'normal' or (group_id is null and shared_post_id is null)));

-- পেইজের মেসেজ: অ্যাডমিনরাও পড়তে ও পেইজের নামে উত্তর দিতে পারেন
drop policy if exists "messages read" on public.messages;
create policy "messages read" on public.messages for select
  using (auth.uid() in (sender_id, recipient_id) or (page_id is not null and private.is_page_staff(page_id, auth.uid())));
drop policy if exists "messages send" on public.messages;
create policy "messages send" on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and read_at is null and is_auto = false and not public.is_blocked(sender_id, recipient_id)
    and (page_id is null or private.is_page_staff(messages.page_id, messages.sender_id)
         or exists (select 1 from public.pages pg where pg.id = messages.page_id and pg.owner_id = messages.recipient_id)));

-- কথোপকথন: পেইজের ক্ষেত্রে গ্রাহক এক দিকে, পেইজ (মালিক/অ্যাডমিন যে-ই উত্তর দিক) অন্য দিকে
drop function if exists public.my_conversations();
create or replace function public.my_conversations()
returns table (partner_id uuid, page_id bigint, as_page boolean, page_name text, name text, avatar_url text, last_body text, last_at timestamptz, last_mine boolean, unread bigint)
language sql stable security invoker set search_path = public as $$
  with mp as (select id from public.pages where owner_id = auth.uid() union select page_id from public.page_admins where user_id = auth.uid()),
  m as (
    select case when x.page_id in (select id from mp) then (case when private.is_page_staff(x.page_id, x.sender_id) then x.recipient_id else x.sender_id end)
                when x.page_id is not null then (select owner_id from public.pages where id = x.page_id)
                when x.sender_id = auth.uid() then x.recipient_id else x.sender_id end as partner,
           x.page_id, x.body, x.created_at,
           case when x.page_id in (select id from mp) then private.is_page_staff(x.page_id, x.sender_id) else x.sender_id = auth.uid() end as mine,
           case when x.page_id in (select id from mp) then not private.is_page_staff(x.page_id, x.sender_id) and x.read_at is null
                else x.recipient_id = auth.uid() and x.read_at is null end as un
      from public.messages x
     where auth.uid() in (x.sender_id, x.recipient_id) or x.page_id in (select id from mp)
  ), last as (
    select distinct on (partner, coalesce(page_id, 0)) partner, page_id, body, created_at, mine from m where partner is not null order by partner, coalesce(page_id, 0), created_at desc
  )
  select l.partner, l.page_id, coalesce(l.page_id in (select id from mp), false), pg.name,
         case when l.page_id is not null and l.page_id not in (select id from mp) then pg.name else p.name end,
         case when l.page_id is not null and l.page_id not in (select id from mp) then pg.avatar_url else p.avatar_url end,
         l.body, l.created_at, l.mine,
         (select count(*) from m where m.partner = l.partner and m.page_id is not distinct from l.page_id and m.un)
    from last l join public.profiles p on p.id = l.partner left join public.pages pg on pg.id = l.page_id
   order by l.created_at desc;
$$;
grant execute on function public.my_conversations() to authenticated;

-- না-পড়া মেসেজের মোট সংখ্যা (নিজের ও যেসব পেইজ চালান)
create or replace function public.my_unread()
returns bigint language sql stable security invoker set search_path = public as $$
  select coalesce(sum(unread), 0)::bigint from public.my_conversations();
$$;
grant execute on function public.my_unread() to authenticated;

create or replace function public.mark_read2(partner uuid, p_page bigint default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_page is not null and private.is_page_staff(p_page, auth.uid()) then
    update public.messages set read_at = now() where page_id = p_page and sender_id = partner and read_at is null;
  elsif p_page is not null then
    update public.messages set read_at = now() where page_id = p_page and recipient_id = auth.uid() and read_at is null;
  else
    update public.messages set read_at = now() where page_id is null and recipient_id = auth.uid() and sender_id = partner and read_at is null;
  end if;
end $$;

create or replace function public.on_page_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare pg public.pages;
begin
  if new.page_id is null or new.is_auto or coalesce(current_setting('app.skip_auto', true), '') = 'on' then return null; end if;
  if private.is_page_staff(new.page_id, new.sender_id) then return null; end if;   -- পেইজের নিজের উত্তর
  select * into pg from public.pages where id = new.page_id;
  if not found or not pg.auto_reply_on or coalesce(trim(pg.auto_reply), '') = '' then return null; end if;
  if exists (select 1 from public.messages m where m.page_id = new.page_id and m.recipient_id = new.sender_id
              and private.is_page_staff(new.page_id, m.sender_id) and m.created_at > now() - interval '24 hours') then return null; end if;
  insert into public.messages (sender_id, recipient_id, body, page_id, is_auto) values (pg.owner_id, new.sender_id, pg.auto_reply, new.page_id, true);
  return null;
exception when others then return null;
end $$;

-- প্রশ্নের তৈরি উত্তর: গ্রাহক প্রশ্নে চাপলে প্রশ্ন ও উত্তর দুটোই কথোপকথনে যায়
create or replace function public.ask_page_faq(p_page bigint, p_idx int)
returns void language plpgsql security definer set search_path = public as $$
declare pg public.pages; item jsonb;
begin
  if auth.uid() is null then raise exception 'লগইন করুন'; end if;
  select * into pg from public.pages where id = p_page;
  if not found then raise exception 'পেইজ পাওয়া যায়নি'; end if;
  if private.is_page_staff(p_page, auth.uid()) then raise exception 'নিজের পেইজে প্রশ্ন করা যায় না'; end if;
  if private.is_blocked(pg.owner_id, auth.uid()) then raise exception 'মেসেজ পাঠানো যাবে না'; end if;
  item := pg.faqs -> p_idx;
  if item is null then raise exception 'প্রশ্ন পাওয়া যায়নি'; end if;
  perform set_config('app.skip_auto', 'on', true);
  insert into public.messages (sender_id, recipient_id, body, page_id) values (auth.uid(), pg.owner_id, item->>'q', p_page);
  insert into public.messages (sender_id, recipient_id, body, page_id, is_auto, created_at) values (pg.owner_id, auth.uid(), item->>'a', p_page, true, now() + interval '1 millisecond');
  perform set_config('app.skip_auto', '', true);
end $$;

revoke all on function public.add_page_admin(bigint, uuid) from public, anon;
revoke all on function public.remove_page_admin(bigint, uuid) from public, anon;
revoke all on function public.pin_page_post(bigint, bigint) from public, anon;
revoke all on function public.ask_page_faq(bigint, int) from public, anon;
revoke all on function public.mark_read2(uuid, bigint) from public, anon;
grant execute on function public.add_page_admin(bigint, uuid) to authenticated;
grant execute on function public.remove_page_admin(bigint, uuid) to authenticated;
grant execute on function public.pin_page_post(bigint, bigint) to authenticated;
grant execute on function public.ask_page_faq(bigint, int) to authenticated;
grant execute on function public.mark_read2(uuid, bigint) to authenticated;

-- ড্যাশবোর্ড: পেইজের অ্যাডমিনরাও দেখতে পারেন
create or replace function public.ent_insights(p_kind text, p_id bigint, p_days int default 7)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare days int := case when p_days >= 30 then 30 else 7 end;
        today date := (now() at time zone 'Asia/Dhaka')::date; since date; r jsonb; ids bigint[];
begin
  if auth.uid() is null then raise exception 'লগইন করুন'; end if;
  if p_kind = 'page' then
    if not (private.is_page_staff(p_id, auth.uid()) or public.is_admin()) then raise exception 'শুধু পেইজের মালিক ও অ্যাডমিনরা দেখতে পারেন'; end if;
    select coalesce(array_agg(id), '{}') into ids from public.posts where page_id = p_id;
  elsif p_kind = 'group' then
    if not (public.is_group_admin(p_id) or public.is_admin()) then raise exception 'শুধু গ্রুপ অ্যাডমিন দেখতে পারেন'; end if;
    select coalesce(array_agg(id), '{}') into ids from public.posts where group_id = p_id;
  else raise exception 'ভুল ধরন';
  end if;
  since := today - (days - 1);
  with v as (
    select v.*, case when p_kind = 'page' then exists (select 1 from public.page_follows f where f.page_id = p_id and f.user_id = v.user_id)
                     else exists (select 1 from public.group_members m where m.group_id = p_id and m.user_id = v.user_id and m.status = 'active') end as close
      from public.post_views v where v.post_id = any (ids) and (v.first_at at time zone 'Asia/Dhaka')::date >= since)
  select jsonb_build_object(
    'days', days,
    'people', (select count(distinct user_id) from v),
    'views', (select coalesce(sum(n), 0) from public.post_view_days where post_id = any (ids) and day >= since),
    'close', (select count(distinct user_id) from v where close),
    'others', (select count(distinct user_id) from v where not close),
    'posts', (select count(*) from public.posts where id = any (ids) and (created_at at time zone 'Asia/Dhaka')::date >= since),
    'sources', (select coalesce(jsonb_object_agg(s, n), '{}') from (select coalesce(source, 'other') s, count(*) n from v group by 1) x),
    'daily', (select jsonb_agg(jsonb_build_object('day', g::date, 'n', coalesce((select sum(n) from public.post_view_days d where d.day = g::date and d.post_id = any (ids)), 0)) order by g)
                from generate_series(since, today, interval '1 day') g),
    'hours', (select jsonb_agg(coalesce(c, 0) order by h) from generate_series(0, 23) h
                left join (select extract(hour from first_at at time zone 'Asia/Dhaka')::int hh, count(*) c
                             from public.post_views where post_id = any (ids) and first_at > now() - interval '30 days' group by 1) x on x.hh = h),
    'top', (select coalesce(jsonb_agg(t order by (t->>'people')::int desc), '[]') from (
              select jsonb_build_object('id', p.id, 'body', left(p.body, 80), 'image', coalesce(p.image_urls[1], p.image_url), 'created_at', p.created_at,
                       'people', (select count(*) from v where v.post_id = p.id), 'views', (select coalesce(sum(n), 0) from public.post_view_days d where d.post_id = p.id and d.day >= since)) t
                from public.posts p where p.id = any (ids) and exists (select 1 from v where v.post_id = p.id)
               order by (select count(*) from v where v.post_id = p.id) desc limit 5) x),
    'visits', (select count(*) from public.ent_visits where kind = p_kind and ent_id = p_id and day >= since),
    'visitors', (select count(distinct user_id) from public.ent_visits where kind = p_kind and ent_id = p_id and day >= since),
    'visits_daily', (select jsonb_agg(jsonb_build_object('day', g::date, 'n',
                       (select count(*) from public.ent_visits e where e.kind = p_kind and e.ent_id = p_id and e.day = g::date)) order by g)
                     from generate_series(since, today, interval '1 day') g),
    'followers', case when p_kind = 'page' then (select count(*) from public.page_follows where page_id = p_id)
                      else (select count(*) from public.group_members where group_id = p_id and status = 'active') end,
    'gained', (select count(*) from (
                 select user_id, (at at time zone 'Asia/Dhaka')::date d from public.ent_events where kind = p_kind and ent_id = p_id and event = 'join'
                 union select user_id, (created_at at time zone 'Asia/Dhaka')::date from public.page_follows where p_kind = 'page' and page_id = p_id) x where d >= since),
    'lost', (select count(*) from public.ent_events where kind = p_kind and ent_id = p_id and event = 'leave' and (at at time zone 'Asia/Dhaka')::date >= since),
    'follow_daily', (select jsonb_agg(jsonb_build_object('day', g::date,
                       'plus', (select count(*) from (
                                  select user_id, (at at time zone 'Asia/Dhaka')::date d from public.ent_events where kind = p_kind and ent_id = p_id and event = 'join'
                                  union select user_id, (created_at at time zone 'Asia/Dhaka')::date from public.page_follows where p_kind = 'page' and page_id = p_id) x where d = g::date),
                       'minus', (select count(*) from public.ent_events e where e.kind = p_kind and e.ent_id = p_id and e.event = 'leave' and (e.at at time zone 'Asia/Dhaka')::date = g::date)) order by g)
                     from generate_series(since, today, interval '1 day') g),
    'pending', case when p_kind = 'group' then (select count(*) from public.group_members where group_id = p_id and status = 'pending') end,
    'active_members', case when p_kind = 'group' then (select count(distinct u) from (
                         select user_id u from public.posts where group_id = p_id and (created_at at time zone 'Asia/Dhaka')::date >= since
                         union select c.user_id from public.comments c join public.posts p on p.id = c.post_id where p.group_id = p_id and (c.created_at at time zone 'Asia/Dhaka')::date >= since) x) end)
  into r;
  return r;
end $$;

-- =====================================================================
--  পেইজের মেসেজ শুধু পেইজে: ব্যক্তিগত মেসেজের তালিকা ও সংখ্যায় নিজের পেইজের মেসেজ দেখায় না
-- =====================================================================
create or replace function public.my_unread()
returns bigint language sql stable security invoker set search_path = public as $$
  select coalesce(sum(unread), 0)::bigint from public.my_conversations() where not as_page;
$$;
create or replace function public.my_page_unread()
returns table (page_id bigint, unread bigint) language sql stable security invoker set search_path = public as $$
  select page_id, coalesce(sum(unread), 0)::bigint from public.my_conversations() where as_page group by page_id;
$$;
grant execute on function public.my_unread() to authenticated;
grant execute on function public.my_page_unread() to authenticated;

alter function public.my_conversations() security definer;
alter function public.my_conversations() set search_path = public;
revoke all on function public.my_conversations() from public, anon;
grant execute on function public.my_conversations() to authenticated;

-- =====================================================================
--  পেইজ হিসেবে চলা (ফেসবুকের মতো প্রোফাইল বদল): পেইজের নামে মন্তব্য
--  (পোস্ট ও মেসেজ পেইজের নামে আগেই করা যেত)
-- =====================================================================
alter table public.comments add column if not exists page_id bigint references public.pages(id) on delete cascade;

drop policy if exists "comments insert" on public.comments;
create policy "comments insert" on public.comments for insert to authenticated
  with check (user_id = auth.uid() and public.can_see_post(post_id) and like_count = 0 and reactions = '{}'::jsonb
    and edited_at is null and public.reply_parent_ok(parent_id, post_id)
    and (page_id is null or private.is_page_staff(comments.page_id, auth.uid())));

-- =====================================================================
--  পেইজ হিসেবে থাকলে শুধু পেইজের নোটিফিকেশন; নিজের প্রোফাইলে পেইজেরগুলো বাদ
-- =====================================================================
create or replace function public.mark_notifications_read_ids(p_ids bigint[])
returns void language sql security definer set search_path = public as $$
  update public.notifications set read = true where user_id = auth.uid() and not read and id = any (p_ids);
$$;
revoke all on function public.mark_notifications_read_ids(bigint[]) from public, anon;
grant execute on function public.mark_notifications_read_ids(bigint[]) to authenticated;

-- পেইজের ব্যাজের নোটিফিকেশনে পেইজের id-ও রাখা
do $$ declare d text; begin
  select pg_get_functiondef('public.decide_verification(bigint,boolean,text)'::regprocedure) into d;
  d := replace(d, $q$jsonb_build_object('page', pname)$q$, $q$jsonb_build_object('page', pname, 'page_id', r.page_id)$q$);
  if position($q$'page_id', r.page_id$q$ in d) = 0 then raise exception 'patch failed'; end if;
  execute d;
end $$;

-- =====================================================================
--  পেইজের পোস্টে রিয়্যাক্ট/মন্তব্য/শেয়ার আর দেখার মাইলফলক: পেইজের মালিক ও সব অ্যাডমিন নোটিফিকেশন পান
--  (আগে শুধু যিনি পোস্ট করেছেন তিনি পেতেন)
-- =====================================================================
create or replace function private.notify_one(to_user uuid, from_user uuid, kind text, post bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if to_user is null or to_user = from_user or private.is_blocked(to_user, from_user) then return; end if;
  delete from public.notifications
   where user_id = to_user and actor_id = from_user and type = kind and post_id is not distinct from post and kind not in ('comment','reply');
  insert into public.notifications (user_id, actor_id, type, post_id) values (to_user, from_user, kind, post);
end $$;
revoke all on function private.notify_one(uuid, uuid, text, bigint) from public, anon, authenticated;

create or replace function public.notify(to_user uuid, from_user uuid, kind text, post bigint default null)
returns void language plpgsql security definer set search_path = public as $$
declare pg bigint; u uuid;
begin
  if post is not null and kind in ('like','comment','share') then select page_id into pg from public.posts where id = post; end if;
  if pg is null then perform private.notify_one(to_user, from_user, kind, post); return; end if;
  for u in select owner_id from public.pages where id = pg union select user_id from public.page_admins where page_id = pg loop
    perform private.notify_one(u, from_user, kind, post);
  end loop;
end $$;
revoke all on function public.notify(uuid, uuid, text, bigint) from public, anon, authenticated;

create or replace function public.on_post_view_milestone()
returns trigger language plpgsql security definer set search_path = public as $$
declare n int; owner uuid; pg bigint; m int; u uuid;
begin
  select count(*) into n from public.post_views where post_id = new.post_id;
  if n not in (100, 500, 1000, 5000, 10000) then return null; end if;
  select user_id, page_id into owner, pg from public.posts where id = new.post_id;
  m := n;
  for u in select owner where pg is null
           union select owner_id from public.pages where id = pg
           union select user_id from public.page_admins where page_id = pg loop
    if u is not null and not exists (select 1 from public.notifications where user_id = u and type = 'milestone' and post_id = new.post_id and (meta->>'n')::int = m) then
      insert into public.notifications (user_id, actor_id, type, post_id, meta) values (u, u, 'milestone', new.post_id, jsonb_build_object('n', m));
    end if;
  end loop;
  return null;
exception when others then return null;
end $$;

-- =====================================================================
--  প্রোফাইলে রক্তদানের তথ্য শুরুতে দেখায় না; "প্রোফাইলে কী দেখাবে"-তে বেছে নিলে দেখায়
-- =====================================================================
alter table public.profile_details drop constraint if exists profile_details_featured_check;
alter table public.profile_details add constraint profile_details_featured_check
  check (featured <@ array['works','educations','addr','gender','birth','relationship','religion','orgs','phone','social','joined','blood']::text[]);

-- =====================================================================
--  প্রোফাইল লক: লক করলে বন্ধু ছাড়া কেউ প্রোফাইলের পোস্ট, ছবি/অ্যালবাম,
--  বিস্তারিত (About) ও বন্ধু/ফলোয়ার তালিকা দেখতে পারবে না।
--  নাম, প্রোফাইল ছবি ও কভার আগের মতো সবাই দেখবে।
-- =====================================================================
alter table public.profiles add column if not exists locked boolean not null default false;

create or replace function private.profile_hidden(owner uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = owner and locked)
     and owner is distinct from auth.uid()
     and not coalesce(private.are_friends(owner, auth.uid()), false)
     and not public.is_admin();
$$;
-- RLS নীতিতে লাগে বলে execute থাকছে; private স্কিমায় usage নেই বলে সরাসরি ডাকা যায় না
grant execute on function private.profile_hidden(uuid) to public;

-- পোস্ট: পেইজ/গ্রুপের পোস্ট লকের আওতায় নয়
drop policy if exists "posts read" on public.posts;
create policy "posts read" on public.posts for select using (
  public.post_visible(user_id, group_id, privacy)
  and (posts.page_id is not null or posts.group_id is not null or not private.profile_hidden(posts.user_id))
);

drop policy if exists "albums read" on public.albums;
create policy "albums read" on public.albums for select using (
  public.post_visible(user_id, null::bigint, privacy)
  and (albums.page_id is not null or not private.profile_hidden(albums.user_id))
);

-- About: পুরোনো ফাংশনটি private-এ সরিয়ে উপরে লকের পাহারা
do $$ begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'private' and p.proname = 'profile_about_full') then
    alter function public.profile_about(uuid) rename to profile_about_full;
    alter function public.profile_about_full(uuid) set schema private;
  end if;
end $$;
revoke all on function private.profile_about_full(uuid) from public, anon, authenticated;

create or replace function public.profile_about(uid uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if private.profile_hidden(uid) then return jsonb_build_object('locked', true); end if;
  return private.profile_about_full(uid);
end $$;
grant execute on function public.profile_about(uuid) to anon, authenticated;

-- বন্ধু/ফলোয়ার/ফলোয়িং তালিকা
do $$ declare d text; begin
  d := pg_get_functiondef('public.list_people(uuid,text)'::regprocedure);
  if position('profile_hidden' in d) = 0 then
    d := replace(d, 'into vis from public.profiles where id = uid;',
      'into vis from public.profiles where id = uid;
  if private.profile_hidden(uid) then return jsonb_build_object(''allowed'', false, ''visibility'', ''locked'', ''ids'', ''[]''::jsonb); end if;');
    execute d;
  end if;
end $$;

-- =====================================================================
--  নিউজফিড: জরুরি পোস্ট (সমাধান চিহ্ন), পোল, অনুষ্ঠান (যাব + রিমাইন্ডার),
--  রঙিন ব্যাকগ্রাউন্ড, লিংক প্রিভিউ, ২৪ ঘণ্টার স্টোরি (পরে চিরতরে মুছে যায়)
-- =====================================================================
alter table public.posts add column if not exists bg text;
alter table public.posts add column if not exists poll text[];
alter table public.posts add column if not exists event_at timestamptz;
alter table public.posts add column if not exists event_place text;
alter table public.posts add column if not exists link jsonb;
alter table public.posts add column if not exists resolved_at timestamptz;

alter table public.posts drop constraint if exists posts_bg_check;
alter table public.posts add constraint posts_bg_check check (bg is null or bg in ('g1','g2','g3','g4','g5','g6','g7','g8'));
alter table public.posts drop constraint if exists posts_poll_check;
alter table public.posts add constraint posts_poll_check check (poll is null or cardinality(poll) between 2 and 4);
alter table public.posts drop constraint if exists posts_event_place_check;
alter table public.posts add constraint posts_event_place_check check (event_place is null or char_length(event_place) <= 120);

-- নতুন পোস্টে: সমাধান চিহ্ন দেওয়া যায় না, পোলের অপশন ও লিংকের তথ্য যাচাই
create or replace function private.posts_extras_guard()
returns trigger language plpgsql set search_path = public as $$
declare o text;
begin
  if tg_op = 'INSERT' then new.resolved_at := null; end if;
  if new.poll is not null then
    if tg_op = 'UPDATE' and old.poll is distinct from new.poll then raise exception 'poll locked'; end if;
    foreach o in array new.poll loop
      if o is null or char_length(btrim(o)) = 0 or char_length(o) > 80 then raise exception 'bad poll option'; end if;
    end loop;
  end if;
  if new.link is not null then
    if jsonb_typeof(new.link) <> 'object'
       or coalesce(new.link->>'url', '') !~ '^https?://'
       or char_length(new.link::text) > 2000
       or (new.link ? 'image' and coalesce(new.link->>'image', '') !~ '^https://') then
      raise exception 'bad link';
    end if;
    new.link := jsonb_strip_nulls(jsonb_build_object('url', new.link->>'url', 'title', left(new.link->>'title', 200),
      'desc', left(new.link->>'desc', 300), 'image', new.link->>'image', 'site', left(new.link->>'site', 80)));
  end if;
  return new;
end $$;
drop trigger if exists posts_extras_guard on public.posts;
create trigger posts_extras_guard before insert or update on public.posts for each row execute function private.posts_extras_guard();

-- পোস্ট দেখার অনুমতি (RLS-এর মতোই)
create or replace function private.post_ok(p_post bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.posts p where p.id = p_post
    and public.post_visible(p.user_id, p.group_id, p.privacy)
    and (p.page_id is not null or p.group_id is not null or not private.profile_hidden(p.user_id)));
$$;

-- ---------- সমাধান হয়েছে
create or replace function public.resolve_post(p_post bigint, p_on boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.posts set resolved_at = case when p_on then now() end
   where id = p_post and (user_id = auth.uid() or public.is_admin()
     or (page_id is not null and private.is_page_staff(page_id, auth.uid())));
  if not found then raise exception 'not allowed'; end if;
end $$;

-- ---------- পোল
create table if not exists public.poll_votes (
  post_id bigint not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  opt smallint not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.poll_votes enable row level security;
drop policy if exists "poll votes own" on public.poll_votes;
create policy "poll votes own" on public.poll_votes for select using (user_id = auth.uid());

create or replace function public.vote_poll(p_post bigint, p_opt int)
returns void language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  if not private.post_ok(p_post) then raise exception 'not allowed'; end if;
  select cardinality(poll) into n from public.posts where id = p_post;
  if n is null then raise exception 'no poll'; end if;
  if p_opt is null or p_opt < 0 then
    delete from public.poll_votes where post_id = p_post and user_id = auth.uid(); return;
  end if;
  if p_opt >= n then raise exception 'bad option'; end if;
  insert into public.poll_votes(post_id, user_id, opt) values (p_post, auth.uid(), p_opt)
    on conflict (post_id, user_id) do update set opt = excluded.opt, created_at = now();
end $$;

-- ---------- অনুষ্ঠান: যাব
create table if not exists public.event_going (
  post_id bigint not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reminded boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.event_going enable row level security;
drop policy if exists "event going own" on public.event_going;
create policy "event going own" on public.event_going for select using (user_id = auth.uid());

create or replace function public.set_going(p_post bigint, p_on boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  if not private.post_ok(p_post) then raise exception 'not allowed'; end if;
  if not exists (select 1 from public.posts where id = p_post and event_at is not null) then raise exception 'no event'; end if;
  if p_on then
    insert into public.event_going(post_id, user_id) values (p_post, auth.uid()) on conflict do nothing;
  else
    delete from public.event_going where post_id = p_post and user_id = auth.uid();
  end if;
end $$;

-- পোল ও অনুষ্ঠানের হিসাব একসাথে (ফিডের যত পোস্ট)
create or replace function public.post_extras(p_ids bigint[])
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_object_agg(p.id, jsonb_build_object(
    'votes', (select coalesce(jsonb_agg(coalesce(c.n, 0) order by i.i), '[]'::jsonb)
                from generate_series(0, coalesce(cardinality(p.poll), 0) - 1) i(i)
                left join (select opt, count(*) n from public.poll_votes where post_id = p.id group by opt) c on c.opt = i.i),
    'my', (select opt from public.poll_votes where post_id = p.id and user_id = auth.uid()),
    'going', (select count(*) from public.event_going where post_id = p.id),
    'me_going', exists (select 1 from public.event_going where post_id = p.id and user_id = auth.uid())
  )), '{}'::jsonb)
  from public.posts p
  where p.id = any(p_ids[1:60]) and (p.poll is not null or p.event_at is not null) and private.post_ok(p.id);
$$;

-- নোটিফিকেশনের নতুন ধরন
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type = any (array[
  'like','comment','share','tag','friend_request','friend_accept','follow','group_request','group_approved',
  'reply','mention','verify_ok','verify_no','boost_ok','boost_no','milestone','follower_milestone','weekly','page_admin',
  'event_reminder']));

-- অনুষ্ঠানের আগের দিন রিমাইন্ডার (প্রতি ঘণ্টায় চলে)
create or replace function private.event_reminders()
returns void language plpgsql security definer set search_path = public as $$
begin
  with due as (
    update public.event_going g set reminded = true
      from public.posts p
     where p.id = g.post_id and not g.reminded and p.event_at > now() and p.event_at <= now() + interval '24 hours'
    returning g.user_id, g.post_id, p.user_id author, p.event_at, p.event_place
  )
  insert into public.notifications(user_id, actor_id, type, post_id, meta)
  select user_id, author, 'event_reminder', post_id, jsonb_build_object('at', event_at, 'place', event_place) from due;
end $$;

-- ---------- স্টোরি: ২৪ ঘণ্টা পর সার্ভার থেকে চিরতরে মুছে যায়
-- ছবি আলাদা স্টোরেজে রাখা হয় না, এই সারির ভেতরেই (ছোট WebP); সারি মুছলেই ছবিও মুছে যায়
create table if not exists public.stories (
  id bigserial primary key,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('text','photo')),
  body text check (char_length(body) <= 250),
  bg text check (bg is null or bg in ('g1','g2','g3','g4','g5','g6','g7','g8')),
  image text check (image is null or (image like 'data:image/%' and char_length(image) <= 400000)),
  privacy text not null default 'public' check (privacy in ('public','friends')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours',
  check ((kind = 'text' and char_length(btrim(coalesce(body, ''))) > 0 and image is null) or (kind = 'photo' and image is not null))
);
create index if not exists stories_live_idx on public.stories (expires_at);
create index if not exists stories_user_idx on public.stories (user_id, created_at desc);
alter table public.stories enable row level security;
drop policy if exists "stories read" on public.stories;
create policy "stories read" on public.stories for select using (
  expires_at > now() and (user_id = auth.uid() or (private.can_view(user_id, privacy) and not private.profile_hidden(user_id))));
drop policy if exists "stories insert" on public.stories;
create policy "stories insert" on public.stories for insert with check (
  user_id = auth.uid() and created_at > now() - interval '1 minute' and expires_at <= now() + interval '24 hours 1 minute');
drop policy if exists "stories delete" on public.stories;
create policy "stories delete" on public.stories for delete using (user_id = auth.uid() or public.is_admin());

-- একসাথে সর্বোচ্চ ১৫টি চালু স্টোরি
create or replace function private.stories_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.created_at := now(); new.expires_at := now() + interval '24 hours';
  if (select count(*) from public.stories where user_id = new.user_id and expires_at > now()) >= 15 then
    raise exception 'story limit';
  end if;
  return new;
end $$;
drop trigger if exists stories_limit on public.stories;
create trigger stories_limit before insert on public.stories for each row execute function private.stories_limit();

create table if not exists public.story_views (
  story_id bigint not null references public.stories(id) on delete cascade,
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (story_id, viewer_id)
);
alter table public.story_views enable row level security;   -- সরাসরি পড়া/লেখা নেই, শুধু নিচের ফাংশন

create or replace function public.story_seen(p_ids bigint[])
returns void language sql security definer set search_path = public as $$
  insert into public.story_views(story_id, viewer_id)
  select s.id, auth.uid() from public.stories s
   where s.id = any(p_ids[1:50]) and auth.uid() is not null and s.user_id <> auth.uid() and s.expires_at > now()
     and private.can_view(s.user_id, s.privacy) and not private.profile_hidden(s.user_id)
  on conflict do nothing;
$$;

create or replace function public.story_viewers(p_story bigint)
returns table(user_id uuid, name text, avatar_url text, seen_at timestamptz)
language sql stable security definer set search_path = public as $$
  select v.viewer_id, pr.name, pr.avatar_url, v.created_at
    from public.story_views v join public.stories s on s.id = v.story_id join public.profiles pr on pr.id = v.viewer_id
   where v.story_id = p_story and s.user_id = auth.uid()
   order by v.created_at desc limit 500;
$$;

create or replace function public.my_story_view_counts()
returns table(story_id bigint, views bigint)
language sql stable security definer set search_path = public as $$
  select s.id, count(v.viewer_id) from public.stories s left join public.story_views v on v.story_id = s.id
   where s.user_id = auth.uid() and s.expires_at > now() group by s.id;
$$;

create or replace function private.purge_stories()
returns void language sql security definer set search_path = public as $$
  delete from public.stories where expires_at <= now();
$$;

-- নির্ধারিত কাজ: প্রতি ১০ মিনিটে মেয়াদোত্তীর্ণ স্টোরি মুছে ফেলা, প্রতি ঘণ্টায় অনুষ্ঠানের রিমাইন্ডার
create extension if not exists pg_cron;
do $$ begin
  perform cron.unschedule(jobid) from cron.job where jobname in ('purge-stories', 'event-reminders');
  perform cron.schedule('purge-stories', '*/10 * * * *', 'select private.purge_stories()');
  perform cron.schedule('event-reminders', '7 * * * *', 'select private.event_reminders()');
end $$;

-- =====================================================================
--  প্রোফাইলে পোস্ট পিন: নিজের প্রোফাইলের একটি পোস্ট সবার উপরে
-- =====================================================================
alter table public.profiles add column if not exists pinned_post_id bigint references public.posts(id) on delete set null;

-- শুধু নিজের প্রোফাইলের (পেইজ/গ্রুপের নয়) পোস্ট পিন করা যায়
create or replace function private.profile_pin_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.pinned_post_id is not null and new.pinned_post_id is distinct from old.pinned_post_id
     and not exists (select 1 from public.posts where id = new.pinned_post_id and user_id = new.id and page_id is null and group_id is null) then
    raise exception 'not allowed';
  end if;
  return new;
end $$;
drop trigger if exists profile_pin_guard on public.profiles;
create trigger profile_pin_guard before update of pinned_post_id on public.profiles for each row execute function private.profile_pin_guard();

create or replace function public.pin_profile_post(p_post bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  update public.profiles set pinned_post_id = p_post where id = auth.uid();
end $$;

-- =====================================================================
--  নিউজফিড (২): রক্তের অনুরোধে ডোনারদের নোটিফিকেশন, আলোচিত হ্যাশট্যাগ, বন্ধুদের জন্মদিন
-- =====================================================================
alter table public.posts add column if not exists blood_group text;
alter table public.posts drop constraint if exists posts_blood_group_check;
alter table public.posts add constraint posts_blood_group_check
  check (blood_group is null or blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-'));

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type = any (array[
  'like','comment','share','tag','friend_request','friend_accept','follow','group_request','group_approved',
  'reply','mention','verify_ok','verify_no','boost_ok','boost_no','milestone','follower_milestone','weekly','page_admin',
  'event_reminder','blood_request']));

-- রক্তের অনুরোধ: একই গ্রুপের, একই উপজেলার (না থাকলে জেলার) ডোনারদের জানানো।
-- শর্ত: ডোনার তালিকায় দৃশ্যমান, শেষ রক্তদান ৯০ দিনের বেশি আগে বা অজানা, ব্লক নেই।
-- অপব্যবহার ঠেকাতে একজন ২৪ ঘণ্টায় সর্বোচ্চ ৩ বার; শুধু পাবলিক পোস্টে (যাতে ডোনার পোস্টটা দেখতে পান)।
create or replace function private.blood_request_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare me_p record;
begin
  if new.blood_group is null or new.privacy <> 'public' or new.group_id is not null or new.page_id is not null then return new; end if;
  if (select count(*) from public.posts where user_id = new.user_id and blood_group is not null and id <> new.id and created_at > now() - interval '24 hours') >= 3 then
    return new;
  end if;
  select upazila, district into me_p from public.profiles where id = new.user_id;
  insert into public.notifications(user_id, actor_id, type, post_id, meta)
  select d.id, new.user_id, 'blood_request', new.id, jsonb_build_object('bg', new.blood_group)
    from public.profiles d
   where d.id <> new.user_id and d.blood_group = new.blood_group and coalesce(d.donor_visible, true)
     and (d.last_donated is null or d.last_donated < current_date - 90)
     and ((me_p.upazila is not null and d.upazila = me_p.upazila) or (me_p.upazila is null and me_p.district is not null and d.district = me_p.district))
     and not private.is_blocked(d.id, new.user_id)
   limit 300;
  return new;
end $$;
drop trigger if exists blood_request_notify on public.posts;
create trigger blood_request_notify after insert on public.posts for each row execute function private.blood_request_notify();

-- আলোচিত হ্যাশট্যাগ (গত ৭ দিনের পাবলিক পোস্ট থেকে)
create or replace function public.trending_tags()
returns table(tag text, n bigint)
language sql stable security definer set search_path = public as $$
  select lower(m[1]) tag, count(distinct p.id) n
    from public.posts p, regexp_matches(p.body, '(?:^|[\s(])#([^\s#.,!?।:;()\[\]{}"''<>/\\]{2,40})', 'g') m
   where p.created_at > now() - interval '7 days' and p.privacy = 'public' and p.group_id is null
   group by 1 order by 2 desc, 1 limit 8;
$$;

-- আজ (ঢাকার সময়) যে বন্ধুদের জন্মদিন — জন্মতারিখ যাদের দেখার অনুমতি আছে শুধু তাদের
create or replace function public.friends_birthdays()
returns table(id uuid, name text, avatar_url text)
language sql stable security definer set search_path = public as $$
  with today as (select (now() at time zone 'Asia/Dhaka')::date d)
  select p.id, p.name, p.avatar_url
    from public.friendships f
    join public.profiles p on p.id = case when f.requester = auth.uid() then f.addressee else f.requester end
    join public.profile_details pd on pd.user_id = p.id, today
   where f.status = 'accepted' and auth.uid() in (f.requester, f.addressee)
     and pd.birth_date is not null
     and extract(month from pd.birth_date) = extract(month from today.d) and extract(day from pd.birth_date) = extract(day from today.d)
     and private.can_view(p.id, coalesce(pd.birth_visibility, 'only_me'))
   limit 20;
$$;

-- =====================================================================
--  নিজেকে অ্যাডমিন বানাতে: অ্যাপে প্রথমে সাইনআপ করুন, তারপর নিচের লাইনে
--  নিজের ইমেইল বসিয়ে আলাদাভাবে চালান:
--
--  update public.profiles set role = 'admin'
--  where id = (select id from auth.users where email = 'your@email.com');
-- =====================================================================
