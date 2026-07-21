import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Room = Database["public"]["Tables"]["rooms"]["Row"];
export type RoomMember = Database["public"]["Tables"]["room_members"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Mission = Database["public"]["Tables"]["missions"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type StudySession = Database["public"]["Tables"]["study_sessions"]["Row"];

export async function getMyProfile(): Promise<Profile | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
  return data as Profile | null;
}

export async function getTodaySessionMinutes(userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("study_sessions").select("minutes").eq("user_id", userId).eq("day", today);
  return (data ?? []).reduce((a, r) => a + (r.minutes ?? 0), 0);
}

export async function getWeeklyHeatmap(userId: string, days = 84) {
  const from = new Date();
  from.setDate(from.getDate() - days);
  const { data } = await supabase
    .from("study_sessions").select("day,minutes").eq("user_id", userId)
    .gte("day", from.toISOString().slice(0, 10)).order("day");
  const map = new Map<string, number>();
  (data ?? []).forEach((r) => map.set(r.day, (map.get(r.day) ?? 0) + (r.minutes ?? 0)));
  return map;
}

export async function ensureDailyMissions(userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await supabase
    .from("missions").select("id").eq("user_id", userId).eq("day", today).limit(1);
  if (existing && existing.length > 0) return;
  const seed: Array<Database["public"]["Tables"]["missions"]["Insert"]> = [
    { user_id: userId, day: today, kind: "study_time", title: "Study for 2 hours", target: 120, reward_xp: 100, reward_coins: 40 },
    { user_id: userId, day: today, kind: "chapters", title: "Complete 1 chapter", target: 1, reward_xp: 60, reward_coins: 20 },
    { user_id: userId, day: today, kind: "questions", title: "Solve 20 questions", target: 20, reward_xp: 80, reward_coins: 30 },
    { user_id: userId, day: today, kind: "revise", title: "Revise yesterday's topic", target: 1, reward_xp: 50, reward_coins: 20 },
  ];
  await supabase.from("missions").insert(seed);
}

export function levelFromXp(xp: number) {
  return Math.max(1, Math.floor(Math.sqrt(xp / 50)) + 1);
}
export function xpForLevel(level: number) {
  return 50 * (level - 1) * (level - 1);
}
export function xpProgress(xp: number) {
  const level = levelFromXp(xp);
  const cur = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, cur, next, pct: Math.min(100, Math.round(((xp - cur) / (next - cur)) * 100)) };
}

export function shortCode(n = 6) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
