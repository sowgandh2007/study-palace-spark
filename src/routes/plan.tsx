import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, CheckCircle2 } from "lucide-react";
import { EchoLogo } from "@/routes/index";
import { ThemeSelect } from "@/lib/theme";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/plan")({
  component: PlanPage,
});

const PLAN_ITEMS = [
  {
    concept: "Binary Search",
    gap: "Transfer dimension deficit (scored 20/100)",
    priority: "High",
    repairActivity: "Practice adapting Binary Search to boundary-finding variants (first/last occurrence, insertion index).",
    estimatedTime: 20,
    completed: false,
  },
  {
    concept: "Database Normalization (3NF)",
    gap: "Assumption dimension deficit (scored 35/100)",
    priority: "Medium",
    repairActivity: "List all functional dependencies from scratch and verify lossless join decomposition.",
    estimatedTime: 15,
    completed: false,
  },
];

function PlanPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <EchoLogo />
          <ThemeSelect />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pt-8 space-y-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">Adaptive Repair Schedule</span>
          <h1 className="text-2xl font-bold tracking-tight mt-1">Tonight's Study Plan</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Recommended study slots generated strictly around identified conceptual gaps.</p>
        </div>

        <div className="space-y-4">
          {PLAN_ITEMS.map((item, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-6 card-shadow space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">{item.concept}</span>
                <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                  <Clock className="size-3.5" /> {item.estimatedTime} min
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-destructive">Gap:</span>
                  <span className="text-xs text-foreground font-medium">{item.gap}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-warning">Priority:</span>
                  <span className="text-xs font-mono font-bold text-warning">{item.priority}</span>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground pt-1">{item.repairActivity}</p>

              <div className="pt-2 flex justify-end">
                <Button asChild size="sm" variant="outline">
                  <Link to="/assessment" search={{ concept: item.concept }}>Launch Probe Verification <ArrowRight className="size-3.5 ml-1" /></Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
