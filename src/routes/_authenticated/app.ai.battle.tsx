import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Swords, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { aiGenerate } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/app/ai/battle")({
  component: Battle;
});

type Q = { q: string; options: string[]; answer: number };

function Battle() {
  const qc = useQueryClient();
  const call = useServerFn(aiGenerate);
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [startTs, setStartTs] = useState<number>(0);
  const [done, setDone] = useState(false);

  const { data: uid } = useQuery({ queryKey: ["uid"], queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null });

  const { data: battles = [] } = useQuery({
    queryKey: ["battles"],
    queryFn: async () => (await supabase.from("ai_battles").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(10)).data ?? [],
  });

  const { data: active } = useQuery({
    queryKey: ["battle", activeId],
    enabled: !!activeId,
    queryFn: async () => (await supabase.from("ai_battles").select("*").eq("id", activeId!).maybeSingle()).data,
  });

  const { data: scores = [] } = useQuery({
    queryKey: ["battle-scores", activeId],
    enabled: !!activeId,
    queryFn: async () => (await supabase.from("ai_battle_scores").select("*, profiles:profiles!ai_battle_scores_user_id_fkey(display_name)").eq("battle_id", activeId!).order("score", { ascending: false })).data ?? [],
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (!activeId) return;
    const ch = supabase.channel(`battle-${activeId}`).on("postgres_changes", { event: "*", schema: "public", table: "ai_battle_scores", filter: `battle_id=eq.${activeId}` }, () => {
      qc.invalidateQueries({ queryKey: ["battle-scores", activeId] });
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeId, qc]);

  async function host() {
    if (!uid || !topic.trim()) return;
    setBusy(true);
    try {
      const prompt = `Create 5 medium MCQs on "${topic}". JSON {"questions":[{"q":"","options":["","","",""],"answer":0}]}. Only JSON.`;
      const res = await call({ data: { prompt, json: true, cacheKey: `battle:${topic}`, system: "You return only strict JSON." } });
      const questions = ((res.json as { questions?: Q[] })?.questions) ?? [];
      const { data: b } = await supabase.from("ai_battles").insert({ host_id: uid, topic, questions, difficulty: "medium" }).select("*").single();
      if (b) { setActiveId(b.id); setAnswers(new Array(questions.length).fill(-1)); setStartTs(Date.now()); setDone(false); }
      qc.invalidateQueries({ queryKey: ["battles"] });
    } finally { setBusy(false); }
  }

  async function join(id: string) {
    const { data: b } = await supabase.from("ai_battles").select("*").eq("id", id).maybeSingle();
    if (!b) return;
    setActiveId(id);
    setAnswers(new Array((b.questions as unknown as Q[]).length).fill(-1));
    setStartTs(Date.now());
    setDone(false);
  }

  async function finish() {
    if (!active || !uid) return;
    const qs = active.questions as unknown as Q[];
    const correct = qs.reduce((a, q, i) => a + (answers[i] === q.answer ? 1 : 0), 0);
    const duration = Math.round((Date.now() - startTs) / 1000);
    const accuracy = qs.length ? correct / qs.length : 0;
    await supabase.from("ai_battle_scores").upsert({ battle_id: active.id, user_id: uid, score: correct, accuracy, duration_sec: duration }, { onConflict: "battle_id,user_id" });
    // XP to top scorer applied client-side if you're currently winning
    setDone(true);
    if (uid === active.host_id) {
      const top = [...scores, { user_id: uid, score: correct, accuracy, duration_sec: duration }].sort((a, b) => b.score - a.score || a.duration_sec - b.duration_sec)[0];
      if (top?.user_id === uid) {
        const { data: p } = await supabase.from("profiles").select("xp").eq("id", uid).maybeSingle();
        await supabase.from("profiles").update({ xp: (p?.xp ?? 0) + 100 }).eq("id", uid);
      }
    }
  }

  const qs = (active?.questions as unknown as Q[]) ?? [];

  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <h1 className="flex items-center gap-2 text-2xl font-black"><Swords className="h-6 w-6 text-primary" />Study Battle</h1>

      {!activeId && (
        <>
          <div className="mt-4 flex gap-2 rounded-2xl border border-border bg-card p-2">
            <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Battle topic" className="flex-1 bg-transparent px-2 text-sm outline-none" />
            <button onClick={host} disabled={busy || !topic.trim()} className="flex items-center gap-1 rounded-xl gradient-brand px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"><Sparkles className="h-3 w-3" />{busy ? "…" : "Host"}</button>
          </div>
          <h2 className="mt-6 text-sm font-bold">Open battles</h2>
          <div className="mt-2 space-y-2">
            {battles.length === 0 && <p className="rounded-2xl bg-muted/40 py-4 text-center text-xs text-muted-foreground">No open battles</p>}
            {battles.map(b => (
              <button key={b.id} onClick={() => join(b.id)} className="flex w-full items-center justify-between rounded-2xl border border-border bg-card p-3 text-left">
                <div>
                  <p className="text-sm font-bold">{b.topic}</p>
                  <p className="text-[11px] text-muted-foreground">{Array.isArray(b.questions) ? b.questions.length : 0} questions · {b.difficulty}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">Join</span>
              </button>
            ))}
          </div>
        </>
      )}

      {activeId && active && !done && (
        <div className="mt-4 space-y-3">
          {qs.map((q, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-3">
              <p className="text-sm font-bold">{i + 1}. {q.q}</p>
              <div className="mt-2 space-y-1">
                {q.options.map((o, k) => (
                  <button key={k} onClick={() => { const a = [...answers]; a[i] = k; setAnswers(a); }} className={"w-full rounded-xl border px-3 py-2 text-left text-sm " + (answers[i] === k ? "border-primary bg-primary/10" : "border-border")}>{o}</button>
                ))}
              </div>
            </div>
          ))}
          <button onClick={finish} disabled={answers.some(a => a < 0)} className="w-full rounded-2xl gradient-brand py-3 text-sm font-bold text-primary-foreground disabled:opacity-50">Submit</button>
        </div>
      )}

      {activeId && done && (
        <div className="mt-4">
          <div className="rounded-3xl gradient-brand p-4 text-primary-foreground">
            <p className="flex items-center gap-2 text-sm"><Trophy className="h-4 w-4" /> Leaderboard</p>
          </div>
          <ul className="mt-3 space-y-2">
            {scores.map((s, i) => (
              <li key={s.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-3">
                <span className="text-sm font-bold">#{i + 1} {(s as unknown as { profiles?: { display_name?: string } }).profiles?.display_name ?? "Player"}</span>
                <span className="text-xs">{s.score} pts · {s.duration_sec}s</span>
              </li>
            ))}
          </ul>
          <button onClick={() => setActiveId(null)} className="mt-4 w-full rounded-2xl border border-border py-3 text-sm font-semibold">Back</button>
        </div>
      )}
    </div>
  );
}
