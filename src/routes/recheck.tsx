import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, TrendingUp, RotateCcw, ShieldCheck } from "lucide-react";
import { EchoNavbar } from "@/components/EchoNavbar";
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
    <div className="min-h-screen text-foreground selection:bg-primary/30 pb-28 md:pb-20">
      <EchoNavbar variant="dark" />

      <main className="mx-auto max-w-2xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
        <div className="glass-card p-6 sm:p-10 text-center space-y-6">
          <div className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-success/20 border border-success/40 text-success mx-auto shadow-glow">
            <TrendingUp className="size-7" />
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Post-Repair Understanding Telemetry · {conceptName}
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mt-1">Understanding Significantly Improved!</h1>
          </div>

          {/* Before vs After Score Callout */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 sm:p-6 items-center font-mono text-center">
            <div>
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Before</span>
              <p className="text-2xl sm:text-3xl font-bold text-slate-400 mt-1">{beforeScore}%</p>
            </div>
            <div className="border-x border-white/10">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-success">Gain</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-success mt-1">+{improvement} pts</p>
            </div>
            <div>
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-primary">After</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-primary mt-1">{afterScore}%</p>
            </div>
          </div>

          <div className="rounded-xl border border-success/40 bg-success/10 p-4 text-xs text-success flex items-center justify-center gap-2 font-medium">
            <ShieldCheck className="size-4 shrink-0" />
            <span>Verified: Conceptual understanding moved from Fragile ({beforeScore}%) to Stable Understanding ({afterScore}%).</span>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 font-bold shadow-glow w-full sm:w-auto min-h-[48px]">
              <Link to="/dashboard">View Telemetry Dashboard <ArrowRight className="ml-1.5 size-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 hover:bg-white/10 w-full sm:w-auto min-h-[48px]">
              <Link to="/assessment">Start New Probe</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
