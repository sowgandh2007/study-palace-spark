import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Plus, Copy, Archive, Trash2, ArrowRight, Clock, ListTree, ArchiveRestore } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { aiGenerate, parseAiJson } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/app/ai/roadmap/")({
  component: RoadmapList,
});

type NodeSpec = {
  key: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  minutes: number;
  youtube_video_id?: string;
  youtube_title?: string;
  youtube_channel?: string;
  youtube_url?: string;
  practice_task?: string;
  prereq_keys: string[];
  x: number; // 0..1
  y: number; // 0..1
  recommended_channel?: string;
};

function RoadmapList() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const call = useServerFn(aiGenerate);
  const { data: uid } = useQuery({ queryKey: ["uid"], queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null });
  const [showNew, setShowNew] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", nodeCount: 12 });

  const { data: roadmaps = [] } = useQuery({
    queryKey: ["roadmaps", uid, showArchived],
    enabled: !!uid,
    queryFn: async () => {
      const q = supabase.from("ai_roadmaps").select("*").eq("user_id", uid!).order("updated_at", { ascending: false });
      const { data } = await (showArchived ? q : q.eq("archived", false));
      return data ?? [];
    },
  });

  const { data: taskCounts = {} } = useQuery({
    queryKey: ["roadmap-counts", roadmaps.map(r => r.id).join(",")],
    enabled: roadmaps.length > 0,
    queryFn: async () => {
      const ids = roadmaps.map(r => r.id);
      const { data } = await supabase.from("ai_roadmap_tasks").select("roadmap_id, completed").in("roadmap_id", ids);
      const map: Record<string, { total: number; done: number }> = {};
      for (const id of ids) map[id] = { total: 0, done: 0 };
      for (const t of data ?? []) {
        map[t.roadmap_id].total++;
        if (t.completed) map[t.roadmap_id].done++;
      }
      return map;
    },
  });

  async function createRoadmap() {
    if (!uid || !form.name.trim() || busy) return;
    setBusy(true);
    try {
      const prompt = `Design an interactive learning roadmap as JSON for "${form.name}". ${form.description ? "Focus: " + form.description : ""}
Return strict JSON with shape:
{"description":"1-2 sentence intro","estimated_hours":number,"nodes":[
{"key":"unique-slug","title":"Topic","description":"1-2 line explanation","difficulty":"beginner|intermediate|advanced","minutes":30,
 "recommended_channel":"channel name","practice_task":"one concrete exercise","prereq_keys":["other-slug"],"x":0.0-1.0,"y":0.0-1.0}
]}
Generate exactly ${form.nodeCount} nodes.
Rules:
1. Maintain proper logical ordering of topics: nodes must form a strict progression from fundamentals/basic (top, y small, e.g. 0.0 to 0.2) to advanced/specialized (bottom, y large, e.g. 0.8 to 1.0).
2. The nodes must be ordered in the JSON array by their progression/logical order (fundamental topics first, then intermediate, then advanced).
3. x should spread 0.1-0.9 to create a nice-looking tree visualization.
4. Each node lists its prerequisites via prereq_keys (slugs). The first 1-2 foundational nodes must have no prerequisites (empty prereq_keys).
5. All prerequisite keys in prereq_keys must exist in the roadmap as a previous node's key. No forward references or orphan references.
6. For "recommended_channel", pick the most appropriate student-friendly educational YouTube channel for the topic, prioritizing "Bro Code" (especially with timestamps), "Gate Smashers", "Apna College", "CodeWithHarry", "Neetcode", "Striver", or "FreeCodeCamp". Strictly do NOT choose "NPTEL" or other dry, overly academic lecture channels.
Return ONLY JSON.`;
      const res = await call({ data: { prompt, json: true, system: "You return only strict JSON.", cacheKey: `rm:v4:${form.name.toLowerCase().trim()}:${form.nodeCount}` } });
      const parsed = parseAiJson<{ description?: string; estimated_hours?: number; nodes: NodeSpec[] }>(res.text);
      if (!parsed?.nodes || !Array.isArray(parsed.nodes) || parsed.nodes.length === 0) {
        throw new Error("AI returned no roadmap topics or invalid JSON. Please try again.");
      }

      // Filter duplicate keys
      const uniqueNodes: NodeSpec[] = [];
      const seenKeys = new Set<string>();
      for (const n of parsed.nodes) {
        if (!n.key || seenKeys.has(n.key)) continue;
        seenKeys.add(n.key);
        uniqueNodes.push(n);
      }

      const { data: rm, error: rmErr } = await supabase.from("ai_roadmaps").insert({
        user_id: uid,
        name: form.name.trim(),
        description: parsed.description ?? form.description ?? "",
        exam: form.name.trim(),
        subjects: [],
        weak_topics: [],
        strong_topics: [],
        hours_per_day: 2,
        estimated_hours: parsed.estimated_hours ?? uniqueNodes.reduce((s, n) => s + (n.minutes ?? 30), 0) / 60,
        kind: "skill_tree",
        plan: parsed as never,
      }).select("*").single();
      if (rmErr || !rm) throw new Error(rmErr?.message || "Failed to save roadmap");

      const validKeys = new Set(uniqueNodes.map(n => n.key));
      const rows = uniqueNodes.map((n, i) => {
        const prereqs = (n.prereq_keys ?? []).filter(k => validKeys.has(k));
        const channelSuffix = n.recommended_channel ? ` ${n.recommended_channel}` : "";
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(n.title + channelSuffix)}`;
        return {
          roadmap_id: rm.id,
          user_id: uid,
          node_key: n.key,
          title: n.title,
          description: n.description,
          difficulty: n.difficulty ?? "beginner",
          minutes: n.minutes ?? 30,
          kind: "study",
          youtube_video_id: null,
          youtube_title: n.title,
          youtube_channel: n.recommended_channel || "YouTube Search",
          youtube_url: searchUrl,
          youtube_thumbnail: null,
          practice_task: n.practice_task ?? null,
          prereq_ids: prereqs,
          position_x: typeof n.x === "number" ? n.x : (i % 3) / 3,
          position_y: typeof n.y === "number" ? n.y : i / uniqueNodes.length,
          order_index: i,
        };
      });

      const { error: taskErr } = await supabase.from("ai_roadmap_tasks").insert(rows);
      if (taskErr) throw new Error(taskErr.message);
      qc.invalidateQueries({ queryKey: ["roadmaps", uid] });
      setShowNew(false);
      setForm({ name: "", description: "", nodeCount: 12 });
      nav({ to: "/app/ai/roadmap/$roadmapId", params: { roadmapId: rm.id } });
    } catch (e) {
      alert((e as Error).message);
    } finally { setBusy(false); }
  }

  async function duplicate(id: string, name: string) {
    if (!uid) return;
    const { data: orig } = await supabase.from("ai_roadmaps").select("*").eq("id", id).single();
    if (!orig) return;
    const { id: _o, created_at: _c, updated_at: _u, ...rest } = orig as Record<string, unknown> & { id: string; created_at: string; updated_at: string };
    const { data: newRm } = await supabase.from("ai_roadmaps").insert({ ...(rest as Record<string, unknown>), name: `${name} (copy)`, archived: false } as never).select("*").single();
    if (!newRm) return;
    const { data: tasks } = await supabase.from("ai_roadmap_tasks").select("*").eq("roadmap_id", id);
    if (tasks?.length) {
      const rows = tasks.map(t => {
        const { id: _i, created_at: _c2, roadmap_id: _r, completed: _cp, ...rt } = t as Record<string, unknown> & { id: string; created_at: string; roadmap_id: string; completed: boolean };
        return { ...rt, roadmap_id: newRm.id, completed: false };
      });
      await supabase.from("ai_roadmap_tasks").insert(rows as never);
    }
    qc.invalidateQueries({ queryKey: ["roadmaps", uid] });
  }

  async function toggleArchive(id: string, archived: boolean) {
    await supabase.from("ai_roadmaps").update({ archived: !archived }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["roadmaps", uid] });
  }
  async function del(id: string) {
    if (!confirm("Delete this roadmap?")) return;
    await supabase.from("ai_roadmap_tasks").delete().eq("roadmap_id", id);
    await supabase.from("ai_roadmaps").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["roadmaps", uid] });
  }

  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-500 glow">
            <ListTree className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Roadmaps</h1>
            <p className="text-xs text-muted-foreground">Your AI-crafted learning paths</p>
          </div>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="grid h-10 w-10 place-items-center rounded-2xl gradient-brand text-primary-foreground glow"
          aria-label="New roadmap"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 flex gap-2 text-xs">
        <button
          onClick={() => setShowArchived(false)}
          className={"rounded-full border px-3 py-1.5 font-semibold " + (!showArchived ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}
        >Active</button>
        <button
          onClick={() => setShowArchived(true)}
          className={"rounded-full border px-3 py-1.5 font-semibold " + (showArchived ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}
        >Archived</button>
      </div>

      <div className="mt-5 space-y-3">
        {roadmaps.map((r) => {
          const c = taskCounts[r.id] ?? { total: 0, done: 0 };
          const pct = c.total ? Math.round((c.done / c.total) * 100) : 0;
          const eta = c.total && c.done < c.total ? `${Math.ceil(((c.total - c.done) * 45) / 60)}h left` : "Completed";
          return (
            <div key={r.id} className="group relative overflow-hidden rounded-3xl border border-border bg-card p-4 card-shadow transition-transform hover:-translate-y-0.5">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-2xl" />
              <div className="relative flex items-start gap-3">
                <ProgressRing pct={pct} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-black">{r.name ?? r.exam}</p>
                  {r.description && <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{r.description}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                    <span>{c.total} topics</span>
                    <span>·</span>
                    <span>{c.done} done</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{eta}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">Updated {new Date(r.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Link
                  to="/app/ai/roadmap/$roadmapId"
                  params={{ roadmapId: r.id }}
                  className="flex flex-1 items-center justify-center gap-1 rounded-2xl gradient-brand py-2.5 text-sm font-bold text-primary-foreground"
                >
                  {c.done > 0 && c.done < c.total ? "Resume" : c.done === c.total && c.total > 0 ? "Review" : "Start"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button onClick={() => duplicate(r.id, r.name ?? r.exam ?? "Roadmap")} className="grid h-10 w-10 place-items-center rounded-2xl border border-border" aria-label="Duplicate"><Copy className="h-4 w-4" /></button>
                <button onClick={() => toggleArchive(r.id, r.archived)} className="grid h-10 w-10 place-items-center rounded-2xl border border-border" aria-label="Archive">
                  {r.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                </button>
                <button onClick={() => del(r.id)} className="grid h-10 w-10 place-items-center rounded-2xl border border-border text-destructive" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          );
        })}
        {roadmaps.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border p-8 text-center">
            <ListTree className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-sm font-semibold">No roadmaps yet</p>
            <p className="text-xs text-muted-foreground">Create your first AI roadmap</p>
            <button onClick={() => setShowNew(true)} className="mt-4 rounded-2xl gradient-brand px-4 py-2 text-sm font-bold text-primary-foreground">Create roadmap</button>
          </div>
        )}
      </div>

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => !busy && setShowNew(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl border border-border bg-card p-5 animate-slide-in-right">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted" />
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-black">New Roadmap</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">AI will design an interactive learning tree with the best YouTube videos.</p>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-semibold">Roadmap name</span>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="DSA, Calculus, Machine Learning…" className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["DSA", "Machine Learning", "Web Development", "Calculus", "GATE CS", "System Design"].map(s => (
                  <button key={s} onClick={() => setForm({ ...form, name: s })} className="rounded-xl border border-border bg-background px-2 py-1.5 text-[11px] font-semibold hover:border-primary">{s}</button>
                ))}
              </div>
              <label className="block">
                <span className="text-xs font-semibold">Focus (optional)</span>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Beginner-friendly, interview prep…" className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold">Topics: {form.nodeCount}</span>
                <input type="range" min={6} max={20} value={form.nodeCount} onChange={e => setForm({ ...form, nodeCount: +e.target.value })} className="mt-1 w-full" />
              </label>
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setShowNew(false)} disabled={busy} className="flex-1 rounded-2xl border border-border py-2.5 text-sm font-semibold">Cancel</button>
              <button onClick={createRoadmap} disabled={busy || !form.name.trim()} className="flex flex-[1.5] items-center justify-center gap-2 rounded-2xl gradient-brand py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50">
                <Sparkles className="h-4 w-4" /> {busy ? "Generating…" : "Generate with AI"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  return (
    <div className="relative grid h-14 w-14 shrink-0 place-items-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r={r} className="stroke-muted" strokeWidth="5" fill="none" />
        <circle cx="30" cy="30" r={r} stroke="url(#g)" strokeWidth="5" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} className="transition-all duration-700" />
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.72 0.19 295)" />
            <stop offset="100%" stopColor="oklch(0.78 0.18 210)" />
          </linearGradient>
        </defs>
      </svg>
      <span className="text-xs font-black">{pct}%</span>
    </div>
  );
}
