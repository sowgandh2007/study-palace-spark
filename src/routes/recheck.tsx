import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, TrendingUp, ShieldCheck, Loader2 } from "lucide-react";
import { EchoNavbar } from "@/components/EchoNavbar";
import { Button } from "@/components/ui/button";
import { generateDynamicRecheckProbe } from "@/lib/echo/pipeline";
import type { DynamicRecheckProbe } from "@/lib/echo/types";
import { useEcho } from "@/lib/echo/store";

export const Route = createFileRoute("/recheck")({
  validateSearch: (search: Record<string, unknown>) => ({
    concept: typeof search["concept"] === "string" ? (search["concept"] as string) : undefined,
    weakSubconcept: typeof search["weakSubconcept"] === "string" ? (search["weakSubconcept"] as string) : undefined,
    before: typeof search["before"] === "string" ? (search["before"] as string) : undefined,
  }),
  component: RecheckPage,
});

function RecheckPage() {
  const search = Route.useSearch();
  const { completeRecheck, latestResult } = useEcho();

  const conceptName = search.concept || latestResult?.conceptName || "Concept Verification";
  const weakSubconcept = search.weakSubconcept || latestResult?.weakSubconcept || `${conceptName} Invariants`;
  const beforeScore = search.before ? Number(search.before) : latestResult?.stabilityScore ?? 50;

  const [loading, setLoading] = useState(true);
  const [probe, setProbe] = useState<DynamicRecheckProbe | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [evaluated, setEvaluated] = useState(false);
  const [afterScore, setAfterScore] = useState<number>(100);

  useEffect(() => {
    let isMounted = true;
    async function loadProbe() {
      setLoading(true);
      const generated = await generateDynamicRecheckProbe(conceptName, weakSubconcept);
      if (isMounted) {
        setProbe(generated);
        setLoading(false);
      }
    }
    loadProbe();
    return () => {
      isMounted = false;
    };
  }, [conceptName, weakSubconcept]);

  function handleEvaluate() {
    if (selectedOption === null || !probe) return;
    const chosen = probe.options[selectedOption];
    const score = chosen ? chosen.score : 0;
    
    // Weighted combination of post-repair performance
    const computedAfter = Math.min(100, Math.round((beforeScore * 0.3) + (score * 0.7)));
    setAfterScore(computedAfter);
    setEvaluated(true);
    completeRecheck(conceptName, beforeScore, computedAfter);
  }

  const improvement = afterScore - beforeScore;

  return (
    <div className="min-h-screen text-foreground selection:bg-primary/30 pb-28 md:pb-20">
      <EchoNavbar variant="dark" />

      <main className="mx-auto max-w-2xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
        {loading ? (
          <div className="glass-card p-12 text-center space-y-4">
            <Loader2 className="size-10 text-primary animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-white">Generating Dynamic Re-Check Probe</h2>
            <p className="text-xs text-slate-400">Targeting subconcept: {weakSubconcept}...</p>
          </div>
        ) : !evaluated && probe ? (
          <div className="glass-card p-6 sm:p-8 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">STAGE 5: RECHECK</span>
              <h1 className="text-2xl font-extrabold text-white mt-1">Post-Repair Verification Probe</h1>
              <p className="text-xs text-slate-300 mt-1">
                Test your repaired understanding of <span className="text-primary font-bold">{weakSubconcept}</span>.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                {probe.question}
              </h2>

              <div className="space-y-3">
                {probe.options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedOption(idx)}
                      className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between ${
                        isSelected
                          ? "border-primary bg-primary/20 text-white font-bold"
                          : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                      }`}
                    >
                      <span>{opt.text}</span>
                      {isSelected && <CheckCircle2 className="size-4 text-primary shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <Button
                onClick={handleEvaluate}
                disabled={selectedOption === null}
                className="bg-primary hover:bg-primary/90 font-bold shadow-glow min-h-[48px]"
              >
                Submit Recheck Answer <ArrowRight className="ml-1.5 size-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="glass-card p-6 sm:p-10 text-center space-y-6">
            <div className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-success/20 border border-success/40 text-success mx-auto shadow-glow">
              <TrendingUp className="size-7" />
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Post-Repair Understanding Telemetry · {conceptName}
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mt-1">
                {improvement >= 0 ? "Understanding Significantly Improved!" : "Recheck Telemetry Recorded"}
              </h1>
            </div>

            {/* Real Before vs After Score Callout */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 sm:p-6 items-center font-mono text-center">
              <div>
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Before</span>
                <p className="text-2xl sm:text-3xl font-bold text-slate-400 mt-1">{beforeScore}%</p>
              </div>
              <div className="border-x border-white/10">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-success">Gain</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-success mt-1">
                  {improvement >= 0 ? `+${improvement}` : `${improvement}`} pts
                </p>
              </div>
              <div>
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-primary">After</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-primary mt-1">{afterScore}%</p>
              </div>
            </div>

            <div className="rounded-xl border border-success/40 bg-success/10 p-4 text-xs text-success flex items-center justify-center gap-2 font-medium">
              <ShieldCheck className="size-4 shrink-0" />
              <span>
                Verified: Real student response moved understanding from {beforeScore}% to {afterScore}%.
              </span>
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
        )}
      </main>
    </div>
  );
}
