import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { Target, Check, Coins, Zap, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ensureDailyMissions } from "@/lib/studysphere";
import { ensureWeeklyChallenges, refreshWeeklyChallengeProgress } from "@/lib/mastery";

export const Route = createFileRoute("/_authenticated/app/missions")({
  component: Missions,
});

function Missions() {
  const qc = useQueryClient();
  const { data: userId } = useQuery({
    queryKey: ["uid"],
    queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null,
  });

  useEffect(() => {
    if (!userId) return;
    ensureDailyMissions(userId);
    ensureWeeklyChallenges(userId).then(() => refreshWeeklyChallengeProgress(userId)).then(() => qc.invalidateQueries({ queryKey: ["weekly_challenges", userId] }));
  }, [userId, qc]);

  const { data: missions = [] } = useQuery({
    queryKey: ["mission-list", userId],
    enabled: !!userId,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase.from("missions").select("*").eq("user_id", userId!).eq("day", today).order("id");
      return data ?? [];
    },
  });

  const { data: weekly = [] } = useQuery({
    queryKey: ["weekly_challenges", userId],
    enabled: !!userId,
    queryFn: async () => (await supabase.from("weekly_challenges").select("*").eq("user_id", userId!).order("created_at")).data ?? [],
  });

  async function complete(m: any) {
    if (m.completed || !userId) return;
    await supabase.from("missions").update({ progress: m.target, completed: true }).eq("id", m.id);
    const { data: p } = await supabase.from("profiles").select("xp,coins").eq("id", userId).maybeSingle();
    await supabase.from("profiles").update({ xp: (p?.xp ?? 0) + m.reward_xp, coins: (p?.coins ?? 0) + m.reward_coins }).eq("id", userId);
    await supabase.from("notifications").insert({ user_id: userId, kind: "mission_complete", title: `Probe completed: ${m.title}`, body: `+${m.reward_xp} XP · +${m.reward_coins} credits` });
    toast.success(`+${m.reward_xp} XP · +${m.reward_coins} credits`);
    qc.invalidateQueries();
  }

  return (
    <div className="mx-auto max-w-md px-5 pt-8 pb-24">
      <h1 className="text-2xl font-bold tracking-tight">Diagnostic Probes</h1>
      <p className="text-xs text-muted-foreground mt-0.5">Daily verification checks — reset every 24 hours</p>

      <ul className="mt-6 space-y-3">
        {missions.map((m) => (
          <li key={m.id} className={"rounded-2xl border p-4 card-shadow " + (m.completed ? "border-success/40 bg-success/10" : "border-border bg-card")}>
            <div className="flex items-start gap-3">
              <div className={"grid h-9 w-9 shrink-0 place-items-center rounded-xl " + (m.completed ? "bg-success/20 text-success" : "bg-primary/10 border border-primary/30 text-primary")}>
                {m.completed ? <Check className="h-4 w-4" /> : <Target className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm">{m.title}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, (m.progress / m.target) * 100)}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="font-mono text-muted-foreground">{m.progress}/{m.target}</span>
                  <div className="flex gap-2 font-mono font-semibold">
                    <span className="flex items-center gap-1 text-primary"><Zap className="h-3 w-3" /> {m.reward_xp}</span>
                    <span className="flex items-center gap-1 text-muted-foreground"><Coins className="h-3 w-3" /> {m.reward_coins}</span>
                  </div>
                </div>
                {!m.completed && (
                  <button onClick={() => complete(m)} className="mt-3 w-full rounded-xl border border-border py-2 text-xs font-semibold hover:border-primary/50">Mark verified</button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8 mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-bold tracking-tight"><Trophy className="h-4 w-4 text-primary" /> Weekly Stability Challenges</h2>
        <Link to="/app/mastery" className="text-[11px] font-semibold text-primary hover:underline">Stability hub</Link>
      </div>
      <ul className="space-y-3">
        {weekly.length === 0 && <p className="text-xs text-muted-foreground">Challenges refresh every Monday.</p>}
        {weekly.map((c) => (
          <li key={c.id} className={"rounded-2xl border p-4 " + (c.completed ? "border-success/40 bg-success/10" : "border-border bg-card")}>
            <div className="flex items-start gap-3">
              <div className={"grid h-9 w-9 shrink-0 place-items-center rounded-xl " + (c.completed ? "bg-success/20 text-success" : "bg-accent text-accent-foreground")}>
                <Trophy className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm">{c.title}</p>
                {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, (c.progress / c.target) * 100)}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="font-mono text-muted-foreground">{c.progress}/{c.target}</span>
                  <div className="flex gap-2 font-mono font-semibold">
                    <span className="flex items-center gap-1 text-primary"><Zap className="h-3 w-3" /> {c.reward_xp}</span>
                    <span className="flex items-center gap-1 text-muted-foreground"><Coins className="h-3 w-3" /> {c.reward_coins}</span>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
