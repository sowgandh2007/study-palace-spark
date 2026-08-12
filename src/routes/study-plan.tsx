import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";
import { EchoLogo, HeaderNav } from "@/routes/index";
import { ThemeSelect } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { useEcho } from "@/lib/echo/store";

export const Route = createFileRoute("/study-plan")({
  component: StudyPlanPage,
});

const TIME_BUDGET_OPTIONS = [20, 30, 45, 60];

function StudyPlanPage() {
  const { timetable } = useEcho();
  const [selectedBudget, setSelectedBudget] = useState(35);

  const isBinarySearchTomorrow = timetable.some((t) =>
    t.topic.toLowerCase().includes("binary search")
  );

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
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Personalized Study Plan</span>
          <h1 className="text-2xl font-bold tracking-tight mt-1">Tonight's ECHO Plan</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Prioritized repair slots generated strictly from your diagnosed conceptual gaps and tomorrow's timetable.
          </p>
        </div>

        {/* Study Time Budget Selector */}
        <div className="rounded-2xl border border-border bg-card p-6 card-shadow space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              How much time can you study tonight?
            </label>
            <span className="font-mono text-sm font-bold text-primary">{selectedBudget} minutes</span>
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
        {isBinarySearchTomorrow && (
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
          {/* Item 1 */}
          <div className="rounded-2xl border border-border bg-card p-6 card-shadow space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">High Priority Repair</span>
                <h3 className="text-base font-bold text-foreground">Binary Search</h3>
              </div>
              <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                <Clock className="size-3.5 text-primary" /> 15 min
              </span>
            </div>

            <div className="grid gap-2 text-xs rounded-xl bg-background/60 p-3 border border-border/50 font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stability Score:</span>
                <span className="font-bold text-warning">50 (Fragile)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Confidence Gap:</span>
                <span className="font-bold text-destructive">You felt 90% · Evidence was 50% (+40 Gap)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Diagnosed Gap:</span>
                <span className="text-foreground">Elimination condition breaks under non-standard setup</span>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground pt-1">
              Step-by-step repair breakdown: 4m review invariant → 5m explain in own words → 4m apply variations → 2m re-check.
            </p>

            <div className="pt-2 flex justify-end">
              <Button asChild size="sm">
                <Link to="/repair" search={{ concept: "Binary Search" }}>
                  Start Repair <ArrowRight className="size-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Item 2 */}
          <div className="rounded-2xl border border-border bg-card p-6 card-shadow space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Medium Priority Repair</span>
                <h3 className="text-base font-bold text-foreground">Database Normalization (3NF)</h3>
              </div>
              <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                <Clock className="size-3.5 text-primary" /> 10 min
              </span>
            </div>

            <div className="grid gap-2 text-xs rounded-xl bg-background/60 p-3 border border-border/50 font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stability Score:</span>
                <span className="font-bold text-primary">66 (Developing)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Diagnosed Gap:</span>
                <span className="text-foreground">Transitive dependency vs candidate key decomposition</span>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground pt-1">
              Step-by-step repair breakdown: List functional dependencies from scratch and verify lossless join decomposition.
            </p>

            <div className="pt-2 flex justify-end">
              <Button asChild size="sm" variant="outline">
                <Link to="/repair" search={{ concept: "Database Normalization (3NF)" }}>
                  Start Repair <ArrowRight className="size-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
