import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, CheckCircle2, Clock } from "lucide-react";
import { EchoLogo } from "@/routes/index";
import { ThemeSelect } from "@/lib/theme";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/plan")({
  component: PlanPage,
});

const PLAN_ITEMS = [
  {
    title: "Transfer repair · Binary Search",
    detail: "Practice adapting Binary Search to boundary-finding variants (first/last occurrence, insertion point).",
    minutes: 20,
    dimension: "Transfer",
  },
  {
    title: "Assumption check · Database Normalization (3NF)",
    detail: "List all functional dependencies from scratch and verify lossless join decomposition.",
    minutes: 15,
    dimension: "Assumption",
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
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">Adaptive Study Plan</span>
          <h1 className="text-2xl font-bold tracking-tight mt-1">Tonight's Conceptual Gap Repairs</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Custom study slots generated strictly around identified understanding gaps.</p>
        </div>

        <div className="space-y-4">
          {PLAN_ITEMS.map((item, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-6 card-shadow space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">{item.dimension} Repair</span>
                <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                  <Clock className="size-3.5" /> {item.minutes} min
                </span>
              </div>

              <h3 className="text-base font-bold">{item.title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{item.detail}</p>

              <div className="pt-2 flex justify-end">
                <Button asChild size="sm" variant="outline">
                  <Link to="/assessment">Launch Probe Verification <ArrowRight className="size-3.5 ml-1" /></Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
