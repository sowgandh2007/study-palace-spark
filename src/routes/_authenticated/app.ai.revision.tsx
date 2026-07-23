import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Repeat, Plus, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { aiGenerate } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/app/ai/revision")({
  component: Revision,
});

function Revision() {
  const qc = useQueryClient();
  const call = useServerFn(aiGenerate);
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [flipped, setFlipped] = useState<string | null>(null);

  const { data: uid } = useQuery({ queryKey: ["uid"], queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null });
  const today = new Date().toISOString().slice(0, 10);

  const { data: due = [] } = useQuery({
    queryKey: ["due-cards", uid, today],
    enabled: !!uid,
    queryFn: async () => (await supabase.from("ai_flashcards").select("*").eq("user_id", uid!).lte("due_date", today).order("due_date").limit(30)).data ?? [],
  });

  const { data: all = [] } = useQuery({
    queryKey: ["all-cards", uid],
    enabled: !!uid,
    queryFn: async () => (await supabase.from("ai_flashcards").select("*").eq("user_id", uid!).order("due_date").limit(50)).data ?? [],
  });

  async function generate() {
    if (!uid || !topic.trim()) return;
    setBusy(true);
    try {
      const prompt = `Create 6 concise flashcards for topic "${topic}" as JSON {"cards":[{"front":"...","back":"..."}]}. Only JSON.`;
      const res = await call({ data: { prompt, json: true, cacheKey: `cards:${topic.toLowerCase()}`, system: "You return only strict JSON." } });
      const cards = ((res.json as { cards?: Array<{ front: string; back: string }> })?.cards) ?? [];
      if (cards.length) {
        await supabase.from("ai_flashcards").insert(cards.map(c => ({ user_id: uid, topic, front: c.front, back: c.back })));
        qc.invalidateQueries({ queryKey: ["due-cards", uid, today] });
        qc.invalidateQueries({ queryKey: ["all-cards", uid] });
        setTopic("");
      }
    } finally { setBusy(false); }
  }

  // SM-2-lite
  async function grade(id: string, score: number, card: typeof due[number]) {
    let ease = card.ease + (0.1 - (5 - score) * (0.08 + (5 - score) * 0.02));
    ease = Math.max(1.3, ease);
    let interval = card.interval_days;
    if (score < 3) interval = 1;
    else if (interval === 1) interval = 3;
    else interval = Math.round(interval * ease);
    const due_date = new Date(); due_date.setDate(due_date.getDate() + interval);
    await supabase.from("ai_flashcards").update({
      ease, interval_days: interval, due_date: due_date.toISOString().slice(0, 10), last_score: score,
    }).eq("id", id);
    setFlipped(null);
    qc.invalidateQueries({ queryKey: ["due-cards", uid, today] });
  }

  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <h1 className="text-2xl font-black">Revision Planner</h1>
      <p className="text-xs text-muted-foreground">Spaced repetition · {due.length} due today</p>

      <div className="mt-4 flex gap-2 rounded-2xl border border-border bg-card p-2">
        <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic to memorize" className="flex-1 bg-transparent px-2 text-sm outline-none" />
        <button onClick={generate} disabled={busy || !topic.trim()} className="flex items-center gap-1 rounded-xl gradient-brand px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"><Plus className="h-3 w-3" />{busy ? "…" : "Add cards"}</button>
      </div>

      <h2 className="mt-6 text-sm font-bold">Due now</h2>
      <div className="mt-2 space-y-2">
        {due.length === 0 && <p className="rounded-2xl bg-muted/40 py-4 text-center text-xs text-muted-foreground">Nothing due 🎉</p>}
        {due.map(c => (
          <div key={c.id} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-[11px] uppercase text-muted-foreground">{c.topic}</p>
            <p className="mt-1 text-sm font-semibold">{c.front}</p>
            {flipped === c.id ? (
              <>
                <p className="mt-2 rounded-xl bg-muted/60 p-3 text-sm">{c.back}</p>
                <div className="mt-3 flex gap-2">
                  {[1, 3, 5].map(s => (
                    <button key={s} onClick={() => grade(c.id, s, c)} className={"flex-1 rounded-xl py-2 text-xs font-bold " + (s === 1 ? "bg-rose-500/20 text-rose-500" : s === 3 ? "bg-amber-500/20 text-amber-500" : "bg-success/20 text-success")}>
                      {s === 1 ? "Again" : s === 3 ? "Hard" : "Easy"}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <button onClick={() => setFlipped(c.id)} className="mt-2 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold">Show answer</button>
            )}
          </div>
        ))}
      </div>

      {all.length > 0 && (
        <>
          <h2 className="mt-6 text-sm font-bold">Upcoming ({all.length})</h2>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {all.slice(0, 10).map(c => (
              <li key={c.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                <span className="truncate">{c.front}</span>
                <span>{c.due_date}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
