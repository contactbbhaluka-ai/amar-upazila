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

-- =====================================================================
--  নিজেকে অ্যাডমিন বানাতে: অ্যাপে প্রথমে সাইনআপ করুন, তারপর নিচের লাইনে
--  নিজের ইমেইল বসিয়ে আলাদাভাবে চালান:
--
--  update public.profiles set role = 'admin'
--  where id = (select id from auth.users where email = 'your@email.com');
-- =====================================================================
