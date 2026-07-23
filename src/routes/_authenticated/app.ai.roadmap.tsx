import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Plus, Check, RefreshCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { aiGenerate } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/app/ai/roadmap")({
  component: Roadmap,
});

type Task = { day: string; title: string; kind: string; subject?: string; minutes: number };

function Roadmap() {
  const qc = useQueryClient();
  const call = useServerFn(aiGenerate);
  const { data: uid } = useQuery({ queryKey: ["uid"], queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null });
  const [form, setForm] = useState({ exam: "", targetDate: "", subjects: "", weak: "", strong: "", hours: 2 });
  const [busy, setBusy] = useState(false);

  const { data: roadmap } = useQuery({
    queryKey: ["roadmap", uid],
    enabled: !!uid,
    queryFn: async () => (await supabase.from("ai_roadmaps").select("*").eq("user_id", uid!).order("created_at", { ascending: false }).limit(1).maybeSingle()).data,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["roadmap-tasks", roadmap?.id],
    enabled: !!roadmap,
    queryFn: async () => (await supabase.from("ai_roadmap_tasks").select("*").eq("roadmap_id", roadmap!.id).order("day")).data ?? [],
  });

  async function generate() {
    if (!uid) return;
    setBusy(true);
    try {
      const prompt = `Create a study roadmap as JSON with shape {"tasks":[{"day":"YYYY-MM-DD","title":"...","kind":"study|revise|practice|milestone","subject":"...","minutes":30}]}. 14 days starting today (${new Date().toISOString().slice(0,10)}). Target exam: ${form.exam}. Target date: ${form.targetDate || "unspecified"}. Subjects: ${form.subjects}. Weak topics: ${form.weak}. Strong topics: ${form.strong}. Hours/day: ${form.hours}. Weight more time on weak topics. Include weekly milestone tasks and revision days. Return ONLY JSON.`;
      const res = await call({ data: { prompt, json: true, system: "You return only strict JSON." } });
      const parsed = (res.json as { tasks: Task[] } | undefined) ?? { tasks: [] };
      const { data: rm } = await supabase.from("ai_roadmaps").insert({
        user_id: uid,
        exam: form.exam,
        target_date: form.targetDate || null,
        subjects: form.subjects.split(",").map(s => s.trim()).filter(Boolean),
        weak_topics: form.weak.split(",").map(s => s.trim()).filter(Boolean),
        strong_topics: form.strong.split(",").map(s => s.trim()).filter(Boolean),
        hours_per_day: form.hours,
        plan: res.json ?? {},
      }).select("*").single();
      if (rm && parsed.tasks?.length) {
        await supabase.from("ai_roadmap_tasks").insert(parsed.tasks.map(t => ({
          roadmap_id: rm.id, user_id: uid, day: t.day, kind: t.kind, title: t.title, subject: t.subject, minutes: t.minutes ?? 30,
        })));
      }
      qc.invalidateQueries({ queryKey: ["roadmap", uid] });
    } finally { setBusy(false); }
  }

  async function adjust() {
    if (!uid || !roadmap) return;
    setBusy(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const missed = tasks.filter(t => t.day < today && !t.completed);
      const remaining = tasks.filter(t => t.day >= today);
      const prompt = `Reschedule missed study tasks into upcoming days without restarting. Return JSON {"tasks":[{"id":"...","day":"YYYY-MM-DD"}]} only for tasks to update. Missed: ${JSON.stringify(missed.map(m => ({id:m.id,title:m.title,day:m.day})))}. Upcoming free capacity (${roadmap.hours_per_day}h/day) days: ${JSON.stringify(remaining.map(t=>t.day))}. Spread them starting tomorrow.`;
      const res = await call({ data: { prompt, json: true, system: "You return only strict JSON." } });
      const updates = ((res.json as { tasks?: Array<{ id: string; day: string }> })?.tasks) ?? [];
      for (const u of updates) {
        await supabase.from("ai_roadmap_tasks").update({ day: u.day }).eq("id", u.id);
      }
      qc.invalidateQueries({ queryKey: ["roadmap-tasks", roadmap.id] });
    } finally { setBusy(false); }
  }

  async function toggle(id: string, completed: boolean) {
    await supabase.from("ai_roadmap_tasks").update({ completed: !completed }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["roadmap-tasks", roadmap?.id] });
  }

  const grouped = tasks.reduce<Record<string, typeof tasks>>((acc, t) => {
    (acc[t.day] ||= []).push(t); return acc;
  }, {});

  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <h1 className="text-2xl font-black">AI Roadmap</h1>
      <p className="text-xs text-muted-foreground">Adapts when you miss tasks</p>

      {!roadmap && (
        <div className="mt-6 space-y-3 rounded-3xl border border-border bg-card p-4">
          <Field label="Target exam" value={form.exam} onChange={v => setForm({ ...form, exam: v })} placeholder="JEE Main, GATE CS…" />
          <Field label="Target date" value={form.targetDate} onChange={v => setForm({ ...form, targetDate: v })} type="date" />
          <Field label="Subjects (comma-sep)" value={form.subjects} onChange={v => setForm({ ...form, subjects: v })} placeholder="Math, Physics" />
          <Field label="Weak topics" value={form.weak} onChange={v => setForm({ ...form, weak: v })} placeholder="Calculus, Waves" />
          <Field label="Strong topics" value={form.strong} onChange={v => setForm({ ...form, strong: v })} placeholder="Algebra" />
          <label className="block text-xs font-semibold">Hours/day: {form.hours}
            <input type="range" min={1} max={10} value={form.hours} onChange={e => setForm({ ...form, hours: +e.target.value })} className="mt-1 w-full" />
          </label>
          <button onClick={generate} disabled={busy || !form.exam} className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-brand py-3 text-sm font-bold text-primary-foreground disabled:opacity-50">
            <Sparkles className="h-4 w-4" /> {busy ? "Generating…" : "Generate roadmap"}
          </button>
        </div>
      )}

      {roadmap && (
        <>
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-border bg-card p-3">
            <div>
              <p className="text-sm font-bold">{roadmap.exam}</p>
              <p className="text-[11px] text-muted-foreground">{tasks.filter(t => t.completed).length}/{tasks.length} done</p>
            </div>
            <div className="flex gap-2">
              <button onClick={adjust} disabled={busy} className="flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-semibold"><RefreshCcw className="h-3 w-3" />Adjust</button>
              <button onClick={() => supabase.from("ai_roadmaps").delete().eq("id", roadmap.id).then(() => qc.invalidateQueries({ queryKey: ["roadmap", uid] }))} className="flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-semibold"><Plus className="h-3 w-3 rotate-45" />New</button>
            </div>
          </div>
          <div className="mt-4 space-y-4">
            {Object.entries(grouped).map(([day, list]) => (
              <div key={day}>
                <p className="mb-2 text-xs font-bold text-muted-foreground">{new Date(day).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</p>
                <div className="space-y-2">
                  {list.map(t => (
                    <button key={t.id} onClick={() => toggle(t.id, t.completed)} className={"flex w-full items-center gap-3 rounded-2xl border p-3 text-left " + (t.completed ? "border-success/40 bg-success/10" : "border-border bg-card")}>
                      <div className={"grid h-8 w-8 place-items-center rounded-xl " + (t.completed ? "bg-success/20 text-success" : "bg-muted text-muted-foreground")}>
                        {t.completed ? <Check className="h-4 w-4" /> : <span className="text-[10px] font-bold uppercase">{t.kind.slice(0,3)}</span>}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{t.title}</p>
                        <p className="text-[11px] text-muted-foreground">{t.subject} · {t.minutes} min</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold">{label}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
    </label>
  );
}
