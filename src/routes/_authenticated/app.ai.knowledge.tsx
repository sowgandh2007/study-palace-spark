import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import { aiGenerate } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/app/ai/knowledge")({
  component: Knowledge,
});

type Node = { name: string; requires: string[]; mastered?: boolean };

function Knowledge() {
  const call = useServerFn(aiGenerate);
  const [topic, setTopic] = useState("Data Structures");
  const [struggle, setStruggle] = useState("");
  const [graph, setGraph] = useState<Node[]>([]);
  const [busy, setBusy] = useState(false);

  async function build() {
    setBusy(true);
    try {
      const prompt = `Build a knowledge graph for "${topic}" as JSON {"nodes":[{"name":"Arrays","requires":[]},{"name":"Sorting","requires":["Arrays"]}]}. Return 8-12 nodes ordered by dependency. Only JSON.`;
      const res = await call({ data: { prompt, json: true, cacheKey: `kg:${topic.toLowerCase()}`, system: "You return only strict JSON." } });
      const nodes = ((res.json as { nodes?: Node[] })?.nodes) ?? [];
      setGraph(nodes);
    } finally { setBusy(false); }
  }

  const missing = struggle
    ? graph.find(n => n.name.toLowerCase() === struggle.toLowerCase())?.requires ?? []
    : [];

  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <h1 className="text-2xl font-black">Knowledge Graph</h1>
      <p className="text-xs text-muted-foreground">See topic dependencies</p>

      <div className="mt-4 flex gap-2">
        <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic" className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none" />
        <button onClick={build} disabled={busy} className="flex items-center gap-1 rounded-xl gradient-brand px-3 text-sm font-bold text-primary-foreground disabled:opacity-50"><Sparkles className="h-4 w-4" />{busy ? "…" : "Build"}</button>
      </div>

      {graph.length > 0 && (
        <>
          <div className="mt-4 rounded-2xl border border-border bg-card p-3">
            <label className="block text-xs font-semibold">Struggling with:</label>
            <select value={struggle} onChange={e => setStruggle(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-2 text-sm">
              <option value="">(none)</option>
              {graph.map(n => <option key={n.name}>{n.name}</option>)}
            </select>
            {missing.length > 0 && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-500/10 p-3 text-xs">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <div>Missing prerequisites: <b>{missing.join(", ")}</b>. Revise these first.</div>
              </div>
            )}
          </div>

          <div className="mt-5 space-y-2">
            {graph.map((n) => (
              <div key={n.name} className="rounded-2xl border border-border bg-card p-3">
                <p className="text-sm font-bold">{n.name}</p>
                {n.requires.length > 0 && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <ArrowRight className="h-3 w-3" /> needs {n.requires.join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
