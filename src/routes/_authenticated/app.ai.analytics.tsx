import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, TrendingUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { aiGenerate, parseAiJson } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/app/ai/analytics")({
  component: Analytics,
});

function Analytics() {
  const call = useServerFn(aiGenerate);
  const [insight, setInsight] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const { data: uid } = useQuery({ queryKey: ["uid"], queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null });

  const { data: sessions = [] } = useQuery({
    queryKey: ["ana-sessions", uid],
    enabled: !!uid,
    queryFn: async () => {
      const from = new Date(); from.setDate(from.getDate() - 28);
      return (await supabase.from("study_sessions").select("day,minutes").eq("user_id", uid!).gte("day", from.toISOString().slice(0,10))).data ?? [];
    },
  });
  const { data: quizzes = [] } = useQuery({
    queryKey: ["ana-quizzes", uid],
    enabled: !!uid,
    queryFn: async () => (await supabase.from("ai_quizzes").select("topic,score,questions,created_at").eq("user_id", uid!).order("created_at", { ascending: false }).limit(20)).data ?? [],
  });

  const totalMin = sessions.reduce((a, r) => a + (r.minutes ?? 0), 0);
  const activeDays = new Set(sessions.map(s => s.day)).size;
  const readiness = Math.min(100, Math.round((activeDays / 28) * 60 + (totalMin / 800) * 40));

  async function summarize() {
    setBusy(true);
    try {
      const prompt = `Weekly study insights. Return markdown (short bullets) covering: most productive time, strongest subject, weakest subject, focus trend, consistency, and estimated exam readiness. Data: sessions=${JSON.stringify(sessions.slice(0,60))} quizzes=${JSON.stringify(quizzes.map(q=>({topic:q.topic,score:q.score,total:Array.isArray(q.questions)?q.questions.length:0})))} readiness=${readiness}%.`;
      const res = await call({ data: { prompt } });
      setInsight(res.text);
    } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <h1 className="text-2xl font-black">AI Analytics</h1>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Metric label="Minutes (28d)" value={String(totalMin)} />
        <Metric label="Active days" value={`${activeDays}/28`} />
        <Metric label="Readiness" value={`${readiness}%`} />
      </div>

      <div className="mt-4 rounded-3xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-bold"><TrendingUp className="h-4 w-4 text-primary" /> Weekly insights</p>
          <button onClick={summarize} disabled={busy} className="flex items-center gap-1 rounded-xl gradient-brand px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-50"><Sparkles className="h-3 w-3" />{busy ? "…" : "Generate"}</button>
        </div>
        {insight ? (
          <div className="prose prose-sm mt-3 max-w-none dark:prose-invert">
            <ReactMarkdown>{insight}</ReactMarkdown>
          </div>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">Tap Generate to get AI-powered insights on your recent study patterns.</p>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <p className="text-lg font-black">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
