
-- ENUMS
create type public.app_role as enum ('user','admin');
create type public.room_role as enum ('owner','member');
create type public.member_status as enum ('studying','quiz','break','offline');
create type public.mission_kind as enum ('study_time','chapters','questions','revise');
create type public.resource_kind as enum ('pdf','note','image','mindmap','paper');
create type public.notif_kind as enum ('room_invite','daily_reminder','mission_complete','leaderboard','friend_activity');
create type public.friend_status as enum ('pending','accepted','blocked');

-- TABLES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Learner',
  avatar_url text,
  xp integer not null default 0,
  coins integer not null default 0,
  level integer not null default 1,
  streak integer not null default 0,
  last_active_day date,
  focus_score integer not null default 70,
  title text not null default 'Newcomer',
  is_guest boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null default 'user',
  unique(user_id, role)
);

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_id uuid not null references auth.users(id) on delete cascade,
  status friend_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique(user_id, friend_id),
  check (user_id <> friend_id)
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  subject text,
  is_public boolean not null default true,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role room_role not null default 'member',
  subject text,
  topic text,
  progress_pct integer not null default 0,
  timer_seconds integer not null default 0,
  focus_score integer not null default 70,
  xp_delta integer not null default 0,
  status member_status not null default 'studying',
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(room_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique(message_id, user_id, emoji)
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind resource_kind not null,
  subject text,
  title text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table public.whiteboard_strokes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  path jsonb not null,
  created_at timestamptz not null default now()
);

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default (now() at time zone 'utc')::date,
  minutes integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default (now() at time zone 'utc')::date,
  kind mission_kind not null,
  title text not null,
  target integer not null,
  progress integer not null default 0,
  reward_xp integer not null default 50,
  reward_coins integer not null default 20,
  completed boolean not null default false
);

create table public.skill_nodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  node_key text not null,
  unlocked boolean not null default false,
  unlocked_at timestamptz,
  unique(user_id, subject, node_key)
);

create table public.badges (
  id text primary key,
  name text not null,
  description text not null,
  icon text not null
);

create table public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id text not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique(user_id, badge_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind notif_kind not null,
  title text not null,
  body text,
  payload jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- GRANTS
grant select, insert, update on public.profiles to authenticated;
grant select on public.profiles to anon;
grant all on public.profiles to service_role;

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

grant select, insert, update, delete on public.friendships to authenticated;
grant all on public.friendships to service_role;

grant select, insert, update, delete on public.rooms to authenticated;
grant all on public.rooms to service_role;

grant select, insert, update, delete on public.room_members to authenticated;
grant all on public.room_members to service_role;

grant select, insert, update, delete on public.messages to authenticated;
grant all on public.messages to service_role;

grant select, insert, delete on public.message_reactions to authenticated;
grant all on public.message_reactions to service_role;

grant select, insert, delete on public.resources to authenticated;
grant all on public.resources to service_role;

grant select, insert, delete on public.whiteboard_strokes to authenticated;
grant all on public.whiteboard_strokes to service_role;

grant select, insert, update on public.study_sessions to authenticated;
grant all on public.study_sessions to service_role;

grant select, insert, update, delete on public.missions to authenticated;
grant all on public.missions to service_role;

grant select, insert, update on public.skill_nodes to authenticated;
grant all on public.skill_nodes to service_role;

grant select on public.badges to anon, authenticated;
grant all on public.badges to service_role;

grant select, insert on public.user_badges to authenticated;
grant all on public.user_badges to service_role;

grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;

-- RLS ENABLE
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.friendships enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;
alter table public.resources enable row level security;
alter table public.whiteboard_strokes enable row level security;
alter table public.study_sessions enable row level security;
alter table public.missions enable row level security;
alter table public.skill_nodes enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.notifications enable row level security;

-- SECURITY DEFINER helper for room membership (avoids recursion issues)
create or replace function public.is_room_member(_room uuid, _user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.room_members where room_id = _room and user_id = _user)
$$;

create or replace function public.is_room_owner(_room uuid, _user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.rooms where id = _room and owner_id = _user)
$$;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role=_role)
$$;

-- POLICIES
create policy "profiles readable" on public.profiles for select using (true);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

create policy "own roles" on public.user_roles for select using (auth.uid() = user_id);

create policy "see own friendships" on public.friendships for select using (auth.uid() in (user_id, friend_id));
create policy "create own friendships" on public.friendships for insert with check (auth.uid() = user_id);
create policy "update own friendships" on public.friendships for update using (auth.uid() in (user_id, friend_id));
create policy "delete own friendships" on public.friendships for delete using (auth.uid() in (user_id, friend_id));

create policy "rooms visible" on public.rooms for select using (
  is_public or owner_id = auth.uid() or public.is_room_member(id, auth.uid())
);
create policy "create rooms" on public.rooms for insert with check (auth.uid() = owner_id);
create policy "owner update" on public.rooms for update using (auth.uid() = owner_id);
create policy "owner delete" on public.rooms for delete using (auth.uid() = owner_id);

create policy "room members visible" on public.room_members for select using (
  public.is_room_member(room_id, auth.uid()) or public.is_room_owner(room_id, auth.uid())
  or exists(select 1 from public.rooms r where r.id = room_id and r.is_public)
);
create policy "join room" on public.room_members for insert with check (auth.uid() = user_id);
create policy "update own membership" on public.room_members for update using (auth.uid() = user_id);
create policy "leave room" on public.room_members for delete using (
  auth.uid() = user_id or public.is_room_owner(room_id, auth.uid())
);

create policy "messages visible to members" on public.messages for select using (
  public.is_room_member(room_id, auth.uid()) or public.is_room_owner(room_id, auth.uid())
);
create policy "members post messages" on public.messages for insert with check (
  auth.uid() = user_id and public.is_room_member(room_id, auth.uid())
);
create policy "pin/edit as owner or author" on public.messages for update using (
  auth.uid() = user_id or public.is_room_owner(room_id, auth.uid())
);
create policy "delete own or as owner" on public.messages for delete using (
  auth.uid() = user_id or public.is_room_owner(room_id, auth.uid())
);

create policy "reactions visible" on public.message_reactions for select using (
  exists(select 1 from public.messages msg where msg.id = message_id and public.is_room_member(msg.room_id, auth.uid()))
);
create policy "react as member" on public.message_reactions for insert with check (
  auth.uid() = user_id and exists(
    select 1 from public.messages msg where msg.id = message_id and public.is_room_member(msg.room_id, auth.uid())
  )
);
create policy "remove own reaction" on public.message_reactions for delete using (auth.uid() = user_id);

create policy "resources visible to members" on public.resources for select using (
  public.is_room_member(room_id, auth.uid())
);
create policy "members upload resources" on public.resources for insert with check (
  auth.uid() = user_id and public.is_room_member(room_id, auth.uid())
);
create policy "delete own resource or as owner" on public.resources for delete using (
  auth.uid() = user_id or public.is_room_owner(room_id, auth.uid())
);

create policy "strokes visible to members" on public.whiteboard_strokes for select using (
  public.is_room_member(room_id, auth.uid())
);
create policy "members draw" on public.whiteboard_strokes for insert with check (
  auth.uid() = user_id and public.is_room_member(room_id, auth.uid())
);
create policy "owner or author erase" on public.whiteboard_strokes for delete using (
  auth.uid() = user_id or public.is_room_owner(room_id, auth.uid())
);

create index on public.study_sessions(user_id, day);
create policy "sessions readable to self or friends" on public.study_sessions for select using (
  auth.uid() = user_id or exists(select 1 from public.friendships f where f.status='accepted' and (
    (f.user_id = auth.uid() and f.friend_id = study_sessions.user_id) or
    (f.friend_id = auth.uid() and f.user_id = study_sessions.user_id)
  ))
);
create policy "log own sessions" on public.study_sessions for insert with check (auth.uid() = user_id);
create policy "update own sessions" on public.study_sessions for update using (auth.uid() = user_id);

create index on public.missions(user_id, day);
create policy "own missions" on public.missions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own skills" on public.skill_nodes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "badges public" on public.badges for select using (true);

create policy "user_badges readable" on public.user_badges for select using (true);
create policy "earn own badge" on public.user_badges for insert with check (auth.uid() = user_id);

create index on public.notifications(user_id, created_at desc);
create policy "own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "insert notification" on public.notifications for insert with check (auth.uid() is not null);
create policy "update own notification" on public.notifications for update using (auth.uid() = user_id);
create policy "delete own notification" on public.notifications for delete using (auth.uid() = user_id);

-- TRIGGERS
create or replace function public.tg_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger tg_profiles_updated before update on public.profiles for each row execute function public.tg_updated_at();
create trigger tg_room_members_updated before update on public.room_members for each row execute function public.tg_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url, is_guest)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email,'Learner'),'@',1)),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.is_anonymous, false)
  ) on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- STORAGE POLICIES
create policy "avatars readable" on storage.objects for select using (bucket_id = 'avatars');
create policy "user uploads own avatar" on storage.objects for insert with check (
  bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "user updates own avatar" on storage.objects for update using (
  bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "user deletes own avatar" on storage.objects for delete using (
  bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "resources readable to room members" on storage.objects for select using (
  bucket_id = 'resources' and public.is_room_member(((storage.foldername(name))[1])::uuid, auth.uid())
);
create policy "members upload resources storage" on storage.objects for insert with check (
  bucket_id = 'resources' and public.is_room_member(((storage.foldername(name))[1])::uuid, auth.uid())
);
create policy "members delete own resources storage" on storage.objects for delete using (
  bucket_id = 'resources' and owner = auth.uid()
);

-- REALTIME
alter publication supabase_realtime add table public.room_members;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.message_reactions;
alter publication supabase_realtime add table public.whiteboard_strokes;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.resources;
