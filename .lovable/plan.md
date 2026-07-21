
# StudySphere AI — Part 1 Build Plan

You picked all four feature areas. To keep this shippable in one build without stubs, I'll implement each area end-to-end but at a **v1 depth** (real data, real realtime where it matters, minimal-but-polished UI). Advanced polish (AI chat assistant, PDF annotation, equation solving, FCM push) is deliberately deferred to Part 2 — noted at the bottom.

## Design system

Modern mobile-first, dark-first with light-mode support and a toggle. Vibrant indigo→violet accent, soft cards, rounded-2xl, subtle glow shadows, spring-y micro-animations. All colors as `oklch` tokens in `src/styles.css` (no hardcoded hex in components). Bottom tab bar navigation (Home, Rooms, Leaderboard, Missions, Profile).

## Backend (Lovable Cloud)

Enable Cloud, then provision:

**Auth**: Email/password + Google + anonymous (Guest). Auth state listener in `__root.tsx`.

**Tables** (all with RLS + GRANTs):
- `profiles` (id, display_name, avatar_url, xp, coins, level, streak, focus_score, current_title, created_at)
- `user_roles` + `has_role()` (owner/member) — for room ownership checks
- `friendships` (user_id, friend_id, status)
- `rooms` (id, code, name, subject, is_public, owner_id, created_at)
- `room_members` (room_id, user_id, subject, topic, progress_pct, timer_seconds, focus_score, status, joined_at)
- `messages` (id, room_id, user_id, body, pinned, created_at)
- `message_reactions` (message_id, user_id, emoji)
- `resources` (id, room_id, user_id, kind, subject, title, storage_path, created_at)
- `whiteboard_strokes` (id, room_id, user_id, path_json, created_at)
- `missions` (id, user_id, kind, target, progress, reward_xp, reward_coins, completed, day)
- `study_sessions` (id, user_id, minutes, day) — powers heatmap + weekly progress
- `skill_nodes` (id, user_id, subject, node_key, unlocked_at) — Skill Tree
- `badges` + `user_badges`
- `notifications` (id, user_id, kind, payload, read, created_at)
- `leaderboard_snapshots` view for daily/weekly/monthly/all-time

Realtime enabled on `room_members`, `messages`, `message_reactions`, `whiteboard_strokes`, `notifications`.

**Storage bucket** `resources` (private, RLS by room membership).

## Routes

```text
/                       Landing / auto-redirect to /app
/auth                   Email + Google + Guest sign-in
/app                    Dashboard (goals, streak, XP, coins, weekly, focus, AI recs, Continue)
/app/rooms              List + Create + Join-by-code
/app/rooms/$roomId      Tabs: Members | Chat | Resources | Whiteboard
/app/leaderboard        Daily/Weekly/Monthly/All-time × 6 metrics
/app/missions           Daily missions + rewards
/app/skills             Skill tree per subject
/app/profile            Avatar, XP/level, badges, heatmap, friends list
/app/notifications      Inbox
```

All `/app/*` under `_authenticated`.

## Feature scope per area

**Auth + Profile + Dashboard**: full — email/Google/guest, avatar upload, editable display name, friends add/remove/list, dashboard cards wired to real aggregates (today's session minutes, streak from `study_sessions`, XP/coins from profile, weekly bar chart, focus score, task list from missions, simple heuristic AI recommendations, Continue button resumes last room or opens focus timer).

**Rooms + Members + Chat**: full realtime — create/join/leave/delete, public/private + shareable code, invite friend (adds notification), live member cards with all listed fields updating via Supabase Realtime, session timer per member updated client-side and persisted every 30s, chat with emoji reactions and pin/unpin. AI chat assistant: **deferred to Part 2** (placeholder tab entry hidden).

**Gamification**: XP/coins/level formula, daily streak calc via trigger, achievements + badges (seeded set), weekly challenge card, unlockable titles by level. Missions auto-generated daily via server fn on first dashboard load. Leaderboards computed from profile + `study_sessions`. GitHub-style heatmap on profile. Skill tree with unlock rules (previous node completed).

**Resources + Whiteboard + Notifications**: PDF/image/note uploads to Storage grouped by subject, download links. Collaborative whiteboard: freehand draw + erase + color, strokes broadcast via realtime + persisted, export as PNG. PDF annotation + equation solving: **deferred to Part 2**. Notifications inbox with realtime updates for invites/missions/leaderboard/friend activity; browser Notification API for in-session toasts (FCM push: deferred).

## Explicitly deferred to Part 2

AI chat assistant in rooms, AI-generated personalized recommendations (currently heuristic), PDF annotation, equation solver on whiteboard, mind-map editor, FCM push notifications, quiz engine + quiz-accuracy leaderboard metric (will show 0 until Part 2).

## Technical notes

- Lovable Cloud (Supabase) for DB/Auth/Storage/Realtime; all app logic via `createServerFn` where privileged, browser client for realtime.
- TanStack Query for all reads; loaders prime cache.
- Google sign-in via `lovable.auth.signInWithOAuth("google", ...)` + `supabase--configure_social_auth`.
- Guest = `supabase.auth.signInAnonymously()`.
- Roles table for room owner checks; `has_role`-style helper for member/owner.
- Bottom tab bar on `/app/*` routes; responsive up to desktop.

Approve and I'll build it in one go.
