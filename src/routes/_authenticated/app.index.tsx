import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Zap, Coins, Target, BrainCircuit, ArrowRight, Sparkles, Play, Bell } from "lucide-react";
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

  const p = profile ?? { display_name: "Learner", xp: 0, coins: 0, streak: 0, focus_score: 70, avatar_url: null, title: "Verified Student" } as ReturnType<typeof Object.assign>;
  const xp = xpProgress(p.xp ?? 0);
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";

  const completedMissions = missions.filter((m) => m.completed).length;

  const recs = useMemo(() => {
    const r: string[] = [];
    if (todayMinutes < 30) r.push("Start a 25-minute diagnostic focus session.");
    if ((p.streak ?? 0) >= 3) r.push(`Active for ${p.streak} consecutive days — verify today's concept.`);
    if (completedMissions < missions.length) r.push("Complete a diagnostic probe to reinforce understanding.");
    if (r.length === 0) r.push("Understanding is stable. Explore advanced conceptual maps.");
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
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{greeting}</p>
          <h1 className="text-2xl font-bold tracking-tight">{p.display_name}</h1>
          <p className="mt-0.5 text-xs font-medium text-primary">{p.title || "ECHO Verified Student"}</p>
        </div>
        <Link to="/app/notifications" className="relative grid h-10 w-10 place-items-center rounded-xl border border-border bg-card hover:border-primary/50 transition-colors">
          <Bell className="h-4 w-4" />
          {unreadNotifs > 0 && (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{unreadNotifs}</span>
          )}
        </Link>
      </header>

      {/* Numerical Stat Displays */}
      <div className="mt-6 grid grid-cols-3 gap-2.5">
        <Stat icon={<ShieldCheck className="h-4 w-4" />} label="Activity" value={`${p.streak ?? 0}d`} />
        <Stat icon={<Zap className="h-4 w-4" />} label="XP Points" value={String(p.xp ?? 0)} />
        <Stat icon={<Coins className="h-4 w-4" />} label="Credits" value={String(p.coins ?? 0)} />
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5 items-start pb-24">
        <div className="space-y-5">
          {/* Telemetry Telemetry Progress Card */}
          <section className="rounded-2xl border border-border bg-card p-5 card-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Verification Level {xp.level}</p>
                <p className="font-mono text-base font-bold text-foreground mt-0.5">
                  {p.xp - xp.cur} / {xp.next - xp.cur} <span className="text-xs font-normal text-muted-foreground">XP</span>
                </p>
              </div>
              <BrainCircuit className="h-6 w-6 text-primary" />
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${xp.pct}%` }} />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 card-shadow">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider">Today's Focus Goal</h2>
              <span className="font-mono text-xs text-muted-foreground">{todayMinutes} / 120 min</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.min(100, (todayMinutes / 120) * 100)}%` }} />
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={quickLog} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90">
                <Play className="h-4 w-4" /> Log 25 min
              </button>
              <button
                onClick={() => navigate({ to: lastRoom?.room_id ? "/app/rooms/$roomId" : "/app/rooms", params: { roomId: lastRoom?.room_id ?? "" } as never })}
                className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold hover:border-primary/50"
              >
                Resume
              </button>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-card p-4 card-shadow">
              <div className="flex items-center gap-2 text-muted-foreground"><BrainCircuit className="h-4 w-4 text-primary" /><span className="text-xs uppercase tracking-wider">Stability Index</span></div>
              <p className="font-mono mt-2 text-2xl font-bold">{p.focus_score ?? 70}</p>
              <p className="text-xs text-success font-medium">+3 verified today</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 card-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-muted-foreground"><Target className="h-4 w-4 text-primary" /><span className="text-xs uppercase tracking-wider">Probes</span></div>
                <p className="font-mono mt-2 text-2xl font-bold">{completedMissions}/{missions.length}</p>
              </div>
              <Link to="/app/missions" className="mt-2 text-xs font-semibold text-primary hover:underline">View Probes →</Link>
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-5 card-shadow">
            <h2 className="text-sm font-semibold uppercase tracking-wider">Weekly Activity Readout</h2>
            <div className="mt-4 flex items-end justify-between gap-1.5">
              {days.map((d) => {
                const h = Math.min(100, (d.minutes / 120) * 100);
                return (
                  <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="flex h-24 w-full items-end">
                      <div className="w-full rounded-md bg-primary transition-all" style={{ height: `${Math.max(6, h)}%`, opacity: d.minutes ? 1 : 0.2 }} />
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">{d.label}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 card-shadow">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-wider">ECHO Diagnostic Recommendations</h2>
            </div>
            <ul className="mt-3 space-y-2">
              {recs.map((r, i) => (
                <li key={i} className="flex items-start gap-2.5 rounded-xl bg-background/50 border border-border/50 px-3 py-2.5 text-xs font-medium leading-relaxed">
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 text-primary shrink-0" /> {r}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 card-shadow">
            <h2 className="text-sm font-semibold uppercase tracking-wider">Pending Diagnostic Checks</h2>
            <ul className="mt-3 space-y-2">
              {missions.filter(m => !m.completed).slice(0, 3).map((m) => (
                <li key={m.id} className="flex items-center justify-between rounded-xl bg-background/50 border border-border/50 px-3 py-2.5 text-xs">
                  <span className="font-medium">{m.title}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">{m.progress}/{m.target}</span>
                </li>
              ))}
              {missions.filter(m => !m.completed).length === 0 && (
                <li className="rounded-xl bg-background/50 border border-border/50 px-3 py-3 text-center text-xs text-muted-foreground">All diagnostic checks completed</li>
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 card-shadow">
      <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 border border-primary/30 text-primary">
        {icon}
      </div>
      <p className="font-mono mt-2 text-lg font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
