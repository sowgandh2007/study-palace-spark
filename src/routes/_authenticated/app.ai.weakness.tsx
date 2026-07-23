import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { aiGenerate } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/app/ai/weakness")({
  component: Weakness,
});

function Weakness() {
  const call = useServerFn(aiGenerate);
  const [analysis, setAnalysis] = useState<{ weak: string[]; mistakes: string[]; low: string[]; next: string[] } | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: uid } = useQuery({ queryKey: ["uid"], queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null });

  const { data: quizzes = [] } = useQuery({
    queryKey: ["quizzes-history", uid],
    enabled: !!uid,
    queryFn: async () => (await supabase.from("ai_quizzes").select("topic,difficulty,score,questions").eq("user_id", uid!).order("created_at", { ascending: false }).limit(20)).data ?? [],
  });

  async function analyze() {
    setBusy(true);
    try {
      const summary = quizzes.map(q => ({ topic: q.topic, difficulty: q.difficulty, score: q.score, total: Array.isArray(q.questions) ? q.questions.length : 0 }));
      const prompt = `Analyze this quiz history and return JSON {"weak":[...],"mistakes":[...],"low":[...],"next":[...]}: weak topics, frequent mistakes, low-confidence concepts, and exact next revision items. History: ${JSON.stringify(summary)}. Only JSON.`;
      const res = await call({ data: { prompt, json: true, system: "You return only strict JSON." } });
      setAnalysis(res.json as never);
    } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <h1 className="text-2xl font-black">Weakness Analysis</h1>
      <p className="text-xs text-muted-foreground">Based on your quiz history</p>

      <button onClick={analyze} disabled={busy || quizzes.length === 0} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl gradient-brand py-3 text-sm font-bold text-primary-foreground disabled:opacity-50">
        <Sparkles className="h-4 w-4" /> {busy ? "Analyzing…" : quizzes.length === 0 ? "Take a quiz first" : "Analyze my performance"}
      </button>

      {analysis && (
        <div className="mt-5 space-y-4">
          <Section title="Weak topics" items={analysis.weak} tint="bg-rose-500/10 text-rose-500" />
          <Section title="Frequent mistakes" items={analysis.mistakes} tint="bg-amber-500/10 text-amber-500" />
          <Section title="Low-confidence concepts" items={analysis.low} tint="bg-orange-500/10 text-orange-500" />
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-bold"><TrendingDown className="h-4 w-4 text-primary" /> Revise next</p>
            <ol className="space-y-1 text-sm">
              {(analysis.next ?? []).map((n, i) => <li key={i} className="rounded-lg bg-muted/50 px-3 py-2">{i + 1}. {n}</li>)}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, items, tint }: { title: string; items: string[]; tint: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="mb-2 text-sm font-bold">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {(items ?? []).map((i, k) => <span key={k} className={"rounded-full px-2.5 py-1 text-xs font-semibold " + tint}>{i}</span>)}
        {(!items || items.length === 0) && <span className="text-xs text-muted-foreground">None found</span>}
      </div>
    </div>
  );
}
