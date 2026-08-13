import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, Trash2, RotateCcw, Plus } from "lucide-react";
import { EchoNavbar } from "@/components/EchoNavbar";
import { ThemeSelect } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { useEcho } from "@/lib/echo/store";
import { toast } from "sonner";

export const Route = createFileRoute("/study-plan")({
  component: StudyPlanPage,
});

const TIME_BUDGET_OPTIONS = [20, 30, 45, 60];

// Initial items empty by default so no sample courses are pre-displayed
const INITIAL_ITEMS: any[] = [];

function StudyPlanPage() {
  const { timetable } = useEcho();
  const [selectedBudget, setSelectedBudget] = useState(35);
  const [planItems, setPlanItems] = useState<any[]>(INITIAL_ITEMS);

  const isBinarySearchTomorrow = timetable.some((t) =>
    t.topic.toLowerCase().includes("binary search")
  );

  function removeItem(id: string, conceptName: string) {
    setPlanItems((prev) => prev.filter((item) => item.id !== id));
    toast.success(`Removed ${conceptName} from study plan`);
  }

  const totalMinutes = planItems.reduce((acc, item) => acc + item.time, 0);

  return (
    <div className="min-h-screen text-foreground selection:bg-primary/30 pb-28 md:pb-20">
      <EchoNavbar variant="dark" />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Personalized Study Plan</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">Tonight's ECHO Plan</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Prioritized repair slots generated strictly from your diagnosed conceptual gaps and tomorrow's timetable.
            </p>
          </div>
        </div>

        {/* Study Time Budget Selector */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              How much time can you study tonight?
            </label>
            <span className="font-mono text-xs sm:text-sm font-bold text-primary">{selectedBudget} minutes ({totalMinutes}m allocated)</span>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {TIME_BUDGET_OPTIONS.map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setSelectedBudget(mins)}
                className={`rounded-xl border py-3 text-xs font-mono font-bold transition-all min-h-[44px] ${
                  selectedBudget === mins
                    ? "border-primary bg-primary/20 text-white shadow-glow"
                    : "border-white/10 bg-black/20 hover:border-white/30 text-slate-400"
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Prioritized Repair Slots Empty State */}
        <div className="space-y-5">
          {planItems.length === 0 ? (
            <div className="glass-card p-10 sm:p-12 text-center space-y-4">
              <Sparkles className="size-10 text-primary mx-auto" />
              <h3 className="font-bold text-lg text-white">No Courses or Study Plan Items Yet</h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto">
                Complete a 10-second post-class reflection or diagnostic probe to automatically add target repair courses to your study plan.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-white font-bold shadow-glow min-h-[44px]">
                  <Link to="/reflection">Start 10s Reflection <ArrowRight className="ml-1 size-3.5" /></Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="border-white/20 bg-white/5 hover:bg-white/10 text-white min-h-[44px]">
                  <Link to="/timetable">Add Scheduled Class</Link>
                </Button>
              </div>
            </div>
          ) : (
            planItems.map((item) => (
              <div key={item.id} className="glass-card glass-card-hover p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">{item.priority}</span>
                    <h3 className="text-base sm:text-lg font-bold text-white">{item.concept}</h3>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0">
                    <span className="flex items-center gap-1 font-mono text-xs text-slate-300">
                      <Clock className="size-3.5 text-primary" /> {item.time} min
                    </span>
                    <button
                      onClick={() => removeItem(item.id, item.concept)}
                      className="p-2.5 text-slate-400 hover:text-destructive transition-colors rounded-xl border border-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Remove from study plan"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="grid gap-2 text-xs rounded-xl bg-black/40 p-4 border border-white/10 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Stability Score:</span>
                    <span className={`font-bold ${item.stability < 60 ? "text-warning" : "text-primary"}`}>
                      {item.stability} ({item.stabilityBand})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Confidence Gap:</span>
                    <span className="font-bold text-destructive">{item.confidenceGap}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Diagnosed Gap:</span>
                    <span className="text-white">{item.diagnosedGap}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed pt-1">
                  Step-by-step repair breakdown: {item.breakdown}
                </p>

                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    onClick={() => removeItem(item.id, item.concept)}
                    className="text-xs text-slate-400 hover:text-destructive transition-colors font-semibold"
                  >
                    Remove from plan
                  </button>

                  <Button asChild size="sm" className="bg-primary hover:bg-primary/90 font-bold shadow-glow min-h-[44px]">
                    <Link to="/repair" search={{ concept: item.concept }}>
                      Start Repair <ArrowRight className="size-3.5 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
