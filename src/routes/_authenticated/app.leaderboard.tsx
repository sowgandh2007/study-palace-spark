import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app/leaderboard")({
  component: Leaderboard,
});

const METRICS = [
  { key: "xp", label: "XP", col: "xp" },
  { key: "streak", label: "Streak", col: "streak" },
  { key: "focus", label: "Focus", col: "focus_score" },
] as const;
const RANGES = ["Daily", "Weekly", "Monthly", "All Time"] as const;

function Leaderboard() {
  const [metric, setMetric] = useState<(typeof METRICS)[number]["key"]>("xp");
  const [range, setRange] = useState<(typeof RANGES)[number]>("Weekly");

  const { data: rows = [] } = useQuery({
    queryKey: ["lb", metric],
    queryFn: async () => {
      const col = METRICS.find(m => m.key === metric)!.col;
      const { data } = await supabase.from("profiles").select("id,display_name,avatar_url,xp,coins,streak,focus_score,title").order(col, { ascending: false }).limit(50);
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <h1 className="text-2xl font-black">Leaderboard</h1>
      <p className="text-sm text-muted-foreground">Compete with your friends</p>

      <div className="mt-5 grid grid-cols-4 gap-1 rounded-2xl border border-border bg-card p-1 text-xs">
        {RANGES.map(r => (
          <button key={r} onClick={() => setRange(r)}
            className={"rounded-xl py-2 font-semibold " + (range === r ? "gradient-brand text-primary-foreground" : "text-muted-foreground")}>
            {r}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {METRICS.map(m => (
          <button key={m.key} onClick={() => setMetric(m.key)}
            className={"shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold " + (metric === m.key ? "border-primary bg-primary/10 text-primary" : "border-border")}>
            {m.label}
          </button>
        ))}
      </div>

      <ul className="mt-5 space-y-2">
        {rows.map((r, i) => (
          <li key={r.id} className={"flex items-center gap-3 rounded-2xl border border-border p-3 " + (i < 3 ? "bg-gradient-to-r from-primary/10 to-transparent" : "bg-card")}>
            <div className={"grid h-9 w-9 place-items-center rounded-full text-sm font-black " + (i === 0 ? "gradient-fire text-white" : i < 3 ? "gradient-brand text-primary-foreground" : "bg-muted")}>
              {i + 1}
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
              {r.display_name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{r.display_name}</p>
              <p className="text-[11px] text-muted-foreground">{r.title}</p>
            </div>
            <div className="text-right">
              <p className="text-base font-black">{metric === "xp" ? r.xp : metric === "streak" ? `${r.streak}d` : r.focus_score}</p>
              <p className="text-[10px] text-muted-foreground">{METRICS.find(m => m.key === metric)!.label}</p>
            </div>
          </li>
        ))}
        {rows.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground"><Trophy className="mx-auto mb-2 h-8 w-8" />No rankings yet</p>}
      </ul>
    </div>
  );
}
