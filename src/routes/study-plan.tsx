import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, Trash2, RotateCcw } from "lucide-react";
import { EchoLogo, HeaderNav } from "@/routes/index";
import { ThemeSelect } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { useEcho } from "@/lib/echo/store";
import { toast } from "sonner";

export const Route = createFileRoute("/study-plan")({
  component: StudyPlanPage,
});

const TIME_BUDGET_OPTIONS = [20, 30, 45, 60];

const INITIAL_ITEMS = [
  {
    id: "sp-1",
    concept: "Binary Search",
    priority: "High Priority Repair",
    priorityLevel: "high",
    time: 15,
    stability: 50,
    stabilityBand: "Fragile",
    confidenceGap: "You felt 90% · Evidence was 50% (+40 Gap)",
    diagnosedGap: "Elimination condition breaks under non-standard setup",
    breakdown: "4m review invariant → 5m explain in own words → 4m apply variations → 2m re-check.",
  },
  {
    id: "sp-2",
    concept: "Database Normalization (3NF)",
    priority: "Medium Priority Repair",
    priorityLevel: "medium",
    time: 10,
    stability: 66,
    stabilityBand: "Developing",
    confidenceGap: "You felt 80% · Evidence was 66% (+14 Gap)",
    diagnosedGap: "Transitive dependency vs candidate key decomposition",
    breakdown: "List functional dependencies from scratch and verify lossless join decomposition.",
  },
];

function StudyPlanPage() {
  const { timetable } = useEcho();
  const [selectedBudget, setSelectedBudget] = useState(35);
  const [planItems, setPlanItems] = useState(INITIAL_ITEMS);

  const isBinarySearchTomorrow = timetable.some((t) =>
    t.topic.toLowerCase().includes("binary search")
  );

  function removeItem(id: string, conceptName: string) {
    setPlanItems((prev) => prev.filter((item) => item.id !== id));
    toast.success(`Removed ${conceptName} from study plan`);
  }

  function resetPlan() {
    setPlanItems(INITIAL_ITEMS);
    toast.info("Reset study plan items");
  }

  const totalMinutes = planItems.reduce((acc, item) => acc + item.time, 0);

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <EchoLogo />
          <HeaderNav />
          <div className="flex items-center gap-3">
            <ThemeSelect />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pt-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Personalized Study Plan</span>
            <h1 className="text-2xl font-bold tracking-tight mt-1">Tonight's ECHO Plan</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Prioritized repair slots generated strictly from your diagnosed conceptual gaps and tomorrow's timetable.
            </p>
          </div>

          {planItems.length < INITIAL_ITEMS.length && (
            <Button size="sm" variant="outline" onClick={resetPlan} className="text-xs">
              <RotateCcw className="size-3.5 mr-1" /> Restore Default Items
            </Button>
          )}
        </div>

        {/* Study Time Budget Selector */}
        <div className="rounded-2xl border border-border bg-card p-6 card-shadow space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              How much time can you study tonight?
            </label>
            <span className="font-mono text-sm font-bold text-primary">{selectedBudget} minutes ({totalMinutes}m allocated)</span>
          </div>

          <div className="flex gap-2">
            {TIME_BUDGET_OPTIONS.map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setSelectedBudget(mins)}
                className={`flex-1 rounded-xl border py-2 text-xs font-mono font-bold transition-all ${
                  selectedBudget === mins
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background/50 hover:border-border/80 text-muted-foreground"
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Tomorrow-Aware Priority Banner */}
        {isBinarySearchTomorrow && planItems.some((i) => i.concept === "Binary Search") && (
          <div className="rounded-2xl border border-warning/50 bg-warning/10 p-5 space-y-2">
            <div className="flex items-center gap-2 text-warning">
              <ShieldAlert className="size-5 shrink-0" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Tomorrow-Aware Priority Alert</h2>
            </div>
            <p className="text-xs leading-relaxed text-foreground">
              Binary Search is being taught again in tomorrow's 9:00 AM class. Your verified stability is currently <strong>50% (Fragile Understanding)</strong>, so ECHO recommends repairing this gap tonight.
            </p>
          </div>
        )}

        {/* Prioritized Repair Slots */}
        <div className="space-y-4">
          {planItems.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-3 card-shadow">
              <CheckCircle2 className="size-8 text-success mx-auto" />
              <h3 className="font-bold text-base">All Study Plan Items Cleared!</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                You have completed or removed all tonight's study plan items. Complete another class reflection when ready.
              </p>
              <div className="pt-2">
                <Button size="sm" variant="outline" onClick={resetPlan}>
                  Restore Plan Items
                </Button>
              </div>
            </div>
          ) : (
            planItems.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border bg-card p-6 card-shadow space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">{item.priority}</span>
                    <h3 className="text-base font-bold text-foreground">{item.concept}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                      <Clock className="size-3.5 text-primary" /> {item.time} min
                    </span>
                    <button
                      onClick={() => removeItem(item.id, item.concept)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
                      title="Remove from study plan"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="grid gap-2 text-xs rounded-xl bg-background/60 p-3 border border-border/50 font-mono">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stability Score:</span>
                    <span className={`font-bold ${item.stability < 60 ? "text-warning" : "text-primary"}`}>
                      {item.stability} ({item.stabilityBand})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Confidence Gap:</span>
                    <span className="font-bold text-destructive">{item.confidenceGap}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Diagnosed Gap:</span>
                    <span className="text-foreground">{item.diagnosedGap}</span>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-muted-foreground pt-1">
                  Step-by-step repair breakdown: {item.breakdown}
                </p>

                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    onClick={() => removeItem(item.id, item.concept)}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors font-semibold"
                  >
                    Remove from plan
                  </button>

                  <Button asChild size="sm">
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
