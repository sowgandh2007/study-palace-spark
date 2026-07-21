import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Lock, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app/skills")({
  component: Skills,
});

const TREE: Record<string, string[]> = {
  Programming: ["Arrays", "Sorting", "Binary Search", "Trees", "Graphs", "DP"],
  Mathematics: ["Algebra", "Geometry", "Calculus", "Statistics", "Probability"],
  Physics: ["Kinematics", "Dynamics", "Energy", "Waves", "Electricity"],
};

function Skills() {
  const qc = useQueryClient();
  const [subject, setSubject] = useState("Programming");

  const { data: userId } = useQuery({ queryKey: ["uid"], queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null });

  const { data: nodes = [] } = useQuery({
    queryKey: ["skills", userId, subject],
    enabled: !!userId,
    queryFn: async () => (await supabase.from("skill_nodes").select("*").eq("user_id", userId!).eq("subject", subject)).data ?? [],
  });

  const unlocked = new Set(nodes.filter(n => n.unlocked).map(n => n.node_key));
  const items = TREE[subject];

  async function toggle(key: string, idx: number) {
    if (!userId) return;
    // require previous unlocked
    if (idx > 0 && !unlocked.has(items[idx - 1])) return;
    await supabase.from("skill_nodes").upsert({ user_id: userId, subject, node_key: key, unlocked: true, unlocked_at: new Date().toISOString() }, { onConflict: "user_id,subject,node_key" });
    qc.invalidateQueries({ queryKey: ["skills", userId, subject] });
  }

  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <h1 className="text-2xl font-black">Skill Tree</h1>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {Object.keys(TREE).map(s => (
          <button key={s} onClick={() => setSubject(s)}
            className={"shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold " + (subject === s ? "border-primary bg-primary/10 text-primary" : "border-border")}>
            {s}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {items.map((n, i) => {
          const isUnlocked = unlocked.has(n);
          const isLocked = i > 0 && !unlocked.has(items[i - 1]);
          return (
            <button key={n} onClick={() => toggle(n, i)} disabled={isLocked || isUnlocked}
              className={"relative flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all " + (isUnlocked ? "border-success/40 bg-success/10" : isLocked ? "border-border bg-card opacity-50" : "border-border bg-card")}>
              <div className={"grid h-11 w-11 place-items-center rounded-full text-lg font-black " + (isUnlocked ? "bg-success/20 text-success" : isLocked ? "bg-muted text-muted-foreground" : "gradient-brand text-primary-foreground")}>
                {isUnlocked ? <Check className="h-5 w-5" /> : isLocked ? <Lock className="h-4 w-4" /> : i + 1}
              </div>
              <div>
                <p className="font-bold">{n}</p>
                <p className="text-[11px] text-muted-foreground">{isUnlocked ? "Mastered" : isLocked ? "Locked" : "Available"}</p>
              </div>
              {i < items.length - 1 && <div className="absolute -bottom-3 left-9 h-3 w-0.5 bg-border" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
