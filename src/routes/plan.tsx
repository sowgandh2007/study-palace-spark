import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, ShieldAlert, Sparkles, Trash2 } from "lucide-react";
import { EchoNavbar } from "@/components/EchoNavbar";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/plan")({
  component: PlanPage,
});

const DEFAULT_PLAN_ITEMS = [
  {
    id: "binary-search",
    concept: "BINARY SEARCH",
    time: 15,
    diagnosedGap: "Transfer dimension deficit (scored 20/100) — why spatial halving requires order",
    priority: "HIGH (Appears in tomorrow's 9:00 AM timetable)",
    priorityLevel: "high",
    activity: "Review invariant → Explain in own words → Apply to 2 variations → Re-check.",
  },
  {
    id: "db-normalization",
    concept: "DATABASE NORMALIZATION (3NF)",
    time: 10,
    diagnosedGap: "Assumption dimension deficit (scored 35/100) — transitive dependency vs candidate keys",
    priority: "MEDIUM",
    priorityLevel: "medium",
    activity: "List all functional dependencies from scratch and verify lossless join decomposition.",
  },
];

function PlanPage() {
  const [items, setItems] = useState(DEFAULT_PLAN_ITEMS);

  const totalMinutes = items.reduce((acc, curr) => acc + curr.time, 0);

  function handleRemove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="min-h-screen bg-[#030919] text-foreground selection:bg-primary/30 pb-28 md:pb-20">
      <EchoNavbar variant="dark" />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-8 sm:pt-12 space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-blue-400">
            TOMORROW-AWARE STUDY PRIORITIZATION
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Tonight's ECHO Study Plan
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium pt-1">
            Total Time: <strong className="text-white">{totalMinutes} minutes</strong> · {items.length} concepts requiring targeted repair
          </p>
        </div>

        {/* Plan Cards List */}
        <div className="space-y-5">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-blue-500/25 bg-gradient-to-br from-[#050e26] via-[#08173d] to-[#0b1d4c] p-6 sm:p-8 space-y-4 shadow-2xl relative group"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs sm:text-sm font-extrabold uppercase tracking-wider text-blue-400">
                  {item.concept}
                </span>
                <span className="flex items-center gap-1.5 font-mono text-xs text-slate-300">
                  <Clock className="size-4 text-blue-400" /> {item.time} min
                </span>
              </div>

              {/* Diagnosed Gap & Priority */}
              <div className="space-y-1.5 text-xs sm:text-sm">
                <p className="text-slate-300">
                  <strong className="text-rose-400 uppercase tracking-wider font-bold">DIAGNOSED GAP: </strong>
                  {item.diagnosedGap}
                </p>
                <p className="text-slate-300">
                  <strong className="text-amber-400 uppercase tracking-wider font-bold">PRIORITY: </strong>
                  <span className={item.priorityLevel === "high" ? "text-amber-400 font-bold" : "text-amber-300"}>
                    {item.priority}
                  </span>
                </p>
              </div>

              {/* Repair Activity */}
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed pt-1">
                Repair activity: {item.activity}
              </p>

              {/* Bottom Actions */}
              <div className="pt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="text-xs text-slate-400 hover:text-rose-400 transition-colors font-mono"
                >
                  Remove
                </button>

                <Button
                  asChild
                  size="md"
                  className={`rounded-full px-6 font-bold text-xs min-h-[44px] shadow-glow ${
                    item.priorityLevel === "high"
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : "border border-blue-400/40 bg-blue-500/10 hover:bg-blue-500/20 text-white"
                  }`}
                >
                  <Link to="/repair" search={{ concept: item.concept }}>
                    Launch Targeted Repair <ArrowRight className="ml-1.5 size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="rounded-3xl border border-blue-500/20 bg-black/30 p-10 text-center space-y-3">
              <Sparkles className="size-8 text-blue-400 mx-auto" />
              <p className="text-xs sm:text-sm text-slate-300">All planned study repair items completed!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
