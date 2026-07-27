import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Flame, Zap, Coins, Target, Brain, ArrowRight, Sparkles, Play, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ensureDailyMissions, getMyProfile, getTodaySessionMinutes, xpProgress } from "@/lib/studysphere";

export const Route = createFileRoute("/_authenticated/app/")({
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());

  const { data: profile, refetch } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const p = await getMyProfile();
      if (p) await ensureDailyMissions(p.id);
      return p;
    },
  });

  const { data: todayMinutes = 0 } = useQuery({
    queryKey: ["today-minutes", profile?.id],
    queryFn: () => (profile ? getTodaySessionMinutes(profile.id) : 0),
    enabled: !!profile,
  });

  const { data: missions = [] } = useQuery({
    queryKey: ["missions-today", profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase.from("missions").select("*").eq("user_id", profile!.id).eq("day", today).order("id");
      return data ?? [];
    },
  });

  const { data: weekly = [] } = useQuery({
    queryKey: ["weekly", profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const from = new Date(); from.setDate(from.getDate() - 6);
      const { data } = await supabase
        .from("study_sessions").select("day,minutes").eq("user_id", profile!.id)
        .gte("day", from.toISOString().slice(0, 10));
      return data ?? [];
    },
  });

  const { data: lastRoom } = useQuery({
    queryKey: ["last-room", profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const { data } = await supabase.from("room_members").select("room_id,rooms(*)").eq("user_id", profile!.id).order("updated_at", { ascending: false }).limit(1).maybeSingle();
      return data;
    },
  });

  const { data: unreadNotifs = 0 } = useQuery({
    queryKey: ["notif-count", profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const { count } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", profile!.id).eq("read", false);
      return count ?? 0;
    },
  });

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const weeklyMap = useMemo(() => {
    const m = new Map<string, number>();
    weekly.forEach((r) => m.set(r.day, (m.get(r.day) ?? 0) + r.minutes));
    return m;
  }, [weekly]);

  const days = useMemo(() => {
    const arr: { label: string; day: string; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      arr.push({ label: d.toLocaleDateString(undefined, { weekday: "narrow" }), day: key, minutes: weeklyMap.get(key) ?? 0 });
    }
    return arr;
  }, [weeklyMap]);

  const p = profile ?? { display_name: "Learner", xp: 0, coins: 0, streak: 0, focus_score: 70, avatar_url: null, title: "Newcomer" } as ReturnType<typeof Object.assign>;
  const xp = xpProgress(p.xp ?? 0);
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";

  const completedMissions = missions.filter((m) => m.completed).length;

  const recs = useMemo(() => {
    const r: string[] = [];
    if (todayMinutes < 30) r.push("Kickstart your day with a 25-min focus block.");
    if ((p.streak ?? 0) >= 3) r.push(`You're on a ${p.streak}-day streak — protect it with a quick session.`);
    if (completedMissions < missions.length) r.push("Finish a daily mission for bonus XP + coins.");
    if (r.length === 0) r.push("Great pace! Try a harder skill-tree node today.");
    return r;
  }, [todayMinutes, p.streak, completedMissions, missions.length]);

  async function quickLog() {
    if (!profile) return;
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from("study_sessions").insert({ user_id: profile.id, day: today, minutes: 25 });
    await supabase.from("profiles").update({ xp: (profile.xp ?? 0) + 25, last_active_day: today, streak: (profile.streak ?? 0) + (profile.last_active_day === today ? 0 : 1) }).eq("id", profile.id);
    refetch();
  }

  return (
    <div className="mx-auto max-w-md md:max-w-5xl px-5 pt-8">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{greeting},</p>
          <h1 className="text-2xl font-black tracking-tight">{p.display_name} 👋</h1>
          <p className="mt-1 text-xs font-medium text-primary">{p.title}</p>
        </div>
        <Link to="/app/notifications" className="relative grid h-11 w-11 place-items-center rounded-2xl border border-border bg-card">
          <Bell className="h-5 w-5" />
          {unreadNotifs > 0 && (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">{unreadNotifs}</span>
          )}
        </Link>
      </header>

      <div className="mt-6 grid grid-cols-3 gap-2.5">
        <Stat icon={<Flame className="h-4 w-4" />} label="Streak" value={`${p.streak ?? 0}d`} tint="fire" />
        <Stat icon={<Zap className="h-4 w-4" />} label="XP" value={String(p.xp ?? 0)} />
        <Stat icon={<Coins className="h-4 w-4" />} label="Coins" value={String(p.coins ?? 0)} />
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5 items-start pb-24">
        <div className="space-y-5">
          <section className="rounded-3xl gradient-brand p-5 text-primary-foreground glow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-80">Level {xp.level}</p>
                <p className="text-lg font-bold">{p.xp - xp.cur}/{xp.next - xp.cur} XP</p>
              </div>
              <Sparkles className="h-8 w-8 opacity-90" />
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/25">
              <div className="h-full rounded-full bg-white/90" style={{ width: `${xp.pct}%` }} />
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-5 card-shadow">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">Today's goal</h2>
              <span className="text-xs text-muted-foreground">{todayMinutes} / 120 min</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full gradient-brand" style={{ width: `${Math.min(100, (todayMinutes / 120) * 100)}%` }} />
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={quickLog} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-foreground py-3 text-sm font-bold text-background">
                <Play className="h-4 w-4" /> Log 25 min
              </button>
              <button
                onClick={() => navigate({ to: lastRoom?.room_id ? "/app/rooms/$roomId" : "/app/rooms", params: { roomId: lastRoom?.room_id ?? "" } as never })}
                className="rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold"
              >
                Continue
              </button>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl border border-border bg-card p-4 card-shadow">
              <div className="flex items-center gap-2 text-muted-foreground"><Brain className="h-4 w-4" /><span className="text-xs">Focus score</span></div>
              <p className="mt-2 text-3xl font-black">{p.focus_score ?? 70}</p>
              <p className="text-xs text-success">+3 today</p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-4 card-shadow">
              <div className="flex items-center gap-2 text-muted-foreground"><Target className="h-4 w-4" /><span className="text-xs">Missions</span></div>
              <p className="mt-2 text-3xl font-black">{completedMissions}/{missions.length}</p>
              <Link to="/app/missions" className="text-xs text-primary">View →</Link>
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-3xl border border-border bg-card p-5 card-shadow">
            <h2 className="text-sm font-bold">This week</h2>
            <div className="mt-4 flex items-end justify-between gap-1.5">
              {days.map((d) => {
                const h = Math.min(100, (d.minutes / 120) * 100);
                return (
                  <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="flex h-24 w-full items-end">
                      <div className="w-full rounded-lg gradient-brand" style={{ height: `${Math.max(6, h)}%`, opacity: d.minutes ? 1 : 0.25 }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{d.label}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-5 card-shadow">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl gradient-brand"><Sparkles className="h-4 w-4 text-primary-foreground" /></div>
              <h2 className="text-sm font-bold">AI recommendations</h2>
            </div>
            <ul className="mt-3 space-y-2">
              {recs.map((r, i) => (
                <li key={i} className="flex items-start gap-2 rounded-2xl bg-muted/50 px-3 py-2.5 text-sm">
                  <ArrowRight className="mt-0.5 h-4 w-4 text-primary" /> {r}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-border bg-card p-5 card-shadow">
            <h2 className="text-sm font-bold">Upcoming</h2>
            <ul className="mt-3 space-y-2">
              {missions.filter(m => !m.completed).slice(0, 3).map((m) => (
                <li key={m.id} className="flex items-center justify-between rounded-2xl bg-muted/40 px-3 py-2.5 text-sm">
                  <span>{m.title}</span>
                  <span className="text-xs text-muted-foreground">{m.progress}/{m.target}</span>
                </li>
              ))}
              {missions.filter(m => !m.completed).length === 0 && (
                <li className="rounded-2xl bg-muted/40 px-3 py-3 text-center text-sm text-muted-foreground">All caught up! 🎉</li>
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: string; tint?: "fire" }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 card-shadow">
      <div className={"grid h-8 w-8 place-items-center rounded-xl " + (tint === "fire" ? "gradient-fire" : "bg-accent")}>
        <span className={tint === "fire" ? "text-white" : "text-accent-foreground"}>{icon}</span>
      </div>
      <p className="mt-2 text-lg font-black">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
