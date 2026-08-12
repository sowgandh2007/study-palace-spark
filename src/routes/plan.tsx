import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { EchoLogo } from "@/routes/index";
import { ThemeSelect } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { useEcho } from "@/lib/echo/store";

export const Route = createFileRoute("/plan")({
  component: PlanPage,
});

function PlanPage() {
  const { timetable } = useEcho();

  const isBinarySearchTomorrow = timetable.some((t) =>
    t.topic.toLowerCase().includes("binary search")
  );

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <EchoLogo />
          <ThemeSelect />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pt-8 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Tomorrow-Aware Study Prioritization</span>
          <h1 className="text-2xl font-bold tracking-tight mt-1">Tonight's ECHO Study Plan</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Total Time: <span className="font-mono text-foreground font-bold">25 minutes</span> · 2 concepts requiring targeted repair
          </p>
        </div>

        {/* Tomorrow-Aware Callout Banner */}
        {isBinarySearchTomorrow && (
          <div className="rounded-2xl border border-warning/50 bg-warning/10 p-5 space-y-2">
            <div className="flex items-center gap-2 text-warning">
              <ShieldAlert className="size-5 shrink-0" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Tomorrow-Aware Alert</h2>
            </div>
            <p className="text-xs leading-relaxed text-foreground">
              You have <strong>Data Structures: Binary Search</strong> scheduled again in tomorrow's 9:00 AM class, and your verified understanding is currently <strong>Fragile (50%)</strong>. Repair it tonight before class!
            </p>
          </div>
        )}

        <div className="space-y-4">
          {/* Item 1 */}
          <div className="rounded-2xl border border-border bg-card p-6 card-shadow space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Binary Search</span>
              <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                <Clock className="size-3.5" /> 15 min
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold uppercase text-destructive">Diagnosed Gap:</span>
                <span className="text-foreground">Transfer dimension deficit (scored 20/100) — why spatial halving requires order</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold uppercase text-warning">Priority:</span>
                <span className="font-mono font-bold text-warning">HIGH (Appears in tomorrow's 9:00 AM timetable)</span>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground pt-1">
              Repair activity: Review invariant → Explain in own words → Apply to 2 variations → Re-check.
            </p>

            <div className="pt-2 flex justify-end">
              <Button asChild size="sm">
                <Link to="/repair" search={{ concept: "Binary Search" }}>
                  Launch Targeted Repair <ArrowRight className="size-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Item 2 */}
          <div className="rounded-2xl border border-border bg-card p-6 card-shadow space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Database Normalization (3NF)</span>
              <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                <Clock className="size-3.5" /> 10 min
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold uppercase text-destructive">Diagnosed Gap:</span>
                <span className="text-foreground">Assumption dimension deficit (scored 35/100) — transitive dependency vs candidate keys</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold uppercase text-warning">Priority:</span>
                <span className="font-mono font-bold text-primary">MEDIUM</span>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground pt-1">
              Repair activity: List all functional dependencies from scratch and verify lossless join decomposition.
            </p>

            <div className="pt-2 flex justify-end">
              <Button asChild size="sm" variant="outline">
                <Link to="/repair" search={{ concept: "Database Normalization (3NF)" }}>
                  Launch Targeted Repair <ArrowRight className="size-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
