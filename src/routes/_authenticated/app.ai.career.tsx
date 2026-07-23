import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Compass } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { aiGenerate, parseAiJson } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/app/ai/career")({
  component: Career,
});

const GOALS = ["Software Engineer", "Data Scientist", "GATE", "UPSC", "Semester Exams", "ML Engineer", "Product Manager"];

type Milestone = { title: string; duration: string; skills: string[]; projects: string[] };

function Career() {
  const qc = useQueryClient();
  const call = useServerFn(aiGenerate);
  const [goal, setGoal] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: uid } = useQuery({ queryKey: ["uid"], queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null });

  const { data: roadmap } = useQuery({
    queryKey: ["career", uid],
    enabled: !!uid,
    queryFn: async () => (await supabase.from("ai_career_roadmaps").select("*").eq("user_id", uid!).order("created_at", { ascending: false }).limit(1).maybeSingle()).data,
  });

  async function generate() {
    if (!uid || !goal) return;
    setBusy(true);
    try {
      const prompt = `Create a career roadmap for goal "${goal}" as JSON {"milestones":[{"title":"...","duration":"1 month","skills":["..."],"projects":["..."]}]}. 6-8 milestones in order. Only JSON.`;
      const res = await call({ data: { prompt, json: true, cacheKey: `career:${goal}`, system: "You return only strict JSON." } });
      const milestones = (parseAiJson<{ milestones?: Milestone[] }>(res.text)?.milestones) ?? [];
      await supabase.from("ai_career_roadmaps").insert({ user_id: uid, goal, milestones });
      qc.invalidateQueries({ queryKey: ["career", uid] });
    } finally { setBusy(false); }
  }

  const milestones = (roadmap?.milestones as unknown as Milestone[]) ?? [];

  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <h1 className="flex items-center gap-2 text-2xl font-black"><Compass className="h-6 w-6 text-primary" />Career Roadmap</h1>

      {!roadmap && (
        <>
          <p className="mt-2 text-xs text-muted-foreground">Choose a goal</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {GOALS.map(g => (
              <button key={g} onClick={() => setGoal(g)} className={"rounded-full border px-3 py-1.5 text-xs font-semibold " + (goal === g ? "border-primary bg-primary/10 text-primary" : "border-border")}>{g}</button>
            ))}
          </div>
          <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="Or type your own goal" className="mt-3 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none" />
          <button onClick={generate} disabled={busy || !goal} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl gradient-brand py-3 text-sm font-bold text-primary-foreground disabled:opacity-50">
            <Sparkles className="h-4 w-4" />{busy ? "Generating…" : "Generate roadmap"}
          </button>
        </>
      )}

      {roadmap && (
        <>
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-border bg-card p-3">
            <p className="text-sm font-bold">{roadmap.goal}</p>
            <button onClick={() => supabase.from("ai_career_roadmaps").delete().eq("id", roadmap.id).then(() => qc.invalidateQueries({ queryKey: ["career", uid] }))} className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold">New</button>
          </div>
          <div className="mt-4 space-y-3">
            {milestones.map((m, i) => (
              <div key={i} className="relative rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl gradient-brand text-sm font-black text-primary-foreground">{i + 1}</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{m.title}</p>
                    <p className="text-[11px] text-muted-foreground">{m.duration}</p>
                    {m.skills?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {m.skills.map(s => <span key={s} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{s}</span>)}
                      </div>
                    )}
                    {m.projects?.length > 0 && (
                      <ul className="mt-2 space-y-0.5 text-[11px] text-muted-foreground">
                        {m.projects.map(p => <li key={p}>• {p}</li>)}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
