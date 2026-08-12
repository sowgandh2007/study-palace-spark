import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, TrendingUp, RotateCcw, ShieldCheck } from "lucide-react";
import { EchoLogo } from "@/routes/index";
import { ThemeSelect } from "@/lib/theme";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/recheck")({
  validateSearch: (search: Record<string, unknown>) => ({
    concept: typeof search["concept"] === "string" ? (search["concept"] as string) : undefined,
    before: typeof search["before"] === "string" ? (search["before"] as string) : "72",
    after: typeof search["after"] === "string" ? (search["after"] as string) : "91",
  }),
  component: RecheckPage,
});

function RecheckPage() {
  const search = Route.useSearch();
  const conceptName = search.concept || "Binary Search";
  const beforeScore = Number(search.before) || 72;
  const afterScore = Number(search.after) || 91;
  const improvement = afterScore - beforeScore;

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <EchoLogo />
          <ThemeSelect />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 pt-8 space-y-6">
        <div className="rounded-2xl border border-border bg-card p-8 card-shadow text-center space-y-6 sm:p-10">
          <div className="inline-grid h-12 w-12 place-items-center rounded-2xl bg-success/20 text-success mx-auto">
            <TrendingUp className="size-6" />
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Post-Repair Understanding Telemetry · {conceptName}
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl mt-1">Understanding Significantly Improved!</h1>
          </div>

          {/* Before vs After Score Callout */}
          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-border bg-background/60 p-5 items-center">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Before Repair</span>
              <p className="font-mono text-3xl font-bold text-muted-foreground mt-1">{beforeScore}%</p>
            </div>
            <div className="border-x border-border/60">
              <span className="text-xs font-semibold uppercase tracking-wider text-success">Improvement</span>
              <p className="font-mono text-3xl font-extrabold text-success mt-1">+{improvement} pts</p>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">After Repair</span>
              <p className="font-mono text-3xl font-extrabold text-primary mt-1">{afterScore}%</p>
            </div>
          </div>

          <div className="rounded-xl border border-success/40 bg-success/10 p-4 text-xs text-success flex items-center justify-center gap-2">
            <ShieldCheck className="size-4 shrink-0" />
            <span>Verified: Conceptual understanding moved from Fragile (72%) to Stable Understanding (91%).</span>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to="/dashboard">View Telemetry Dashboard <ArrowRight className="ml-1.5 size-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link to="/assessment">Start New Probe</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
