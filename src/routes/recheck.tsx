import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, TrendingUp, ShieldCheck, Loader2, RefreshCw } from "lucide-react";
import { EchoNavbar } from "@/components/EchoNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEcho } from "@/lib/echo/store";
import {
  generateAdaptiveRecheckProbe,
  calculateDimensionComparisons,
} from "@/lib/echo/adaptiveEngine";
import type { DynamicRecheckProbe, FrameworkDimension, DimensionComparison } from "@/lib/echo/types";

export const Route = createFileRoute("/recheck")({
  validateSearch: (search: Record<string, unknown>) => ({
    concept: typeof search["concept"] === "string" ? (search["concept"] as string) : undefined,
    weakDimension: typeof search["weakDimension"] === "string" ? (search["weakDimension"] as FrameworkDimension) : undefined,
    weakSubconcept: typeof search["weakSubconcept"] === "string" ? (search["weakSubconcept"] as string) : undefined,
  }),
  component: RecheckPage,
});

function RecheckPage() {
  const search = Route.useSearch();
  const { latestResult, completeRecheck } = useEcho();

  const conceptName = search.concept || latestResult?.conceptName || "Concept Verification";
  const weakDimension: FrameworkDimension = search.weakDimension || latestResult?.weakDimension || "explain";
  const weakSubconcept = search.weakSubconcept || latestResult?.weakSubconcept || `${conceptName} Invariants`;

  const [loading, setLoading] = useState(true);
  const [probe, setProbe] = useState<DynamicRecheckProbe | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [evaluated, setEvaluated] = useState(false);

  const [comparisonResult, setComparisonResult] = useState<{
    comparisons: DimensionComparison[];
    overallBefore: number;
    overallAfter: number;
    overallGain: number;
    targetImproved: boolean;
    verdictMessage: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadProbe() {
      setLoading(true);
      const generated = await generateAdaptiveRecheckProbe(conceptName, weakDimension, weakSubconcept);
      if (isMounted) {
        setProbe(generated);
        setLoading(false);
      }
    }
    loadProbe();
    return () => {
      isMounted = false;
    };
  }, [conceptName, weakDimension, weakSubconcept]);

  function handleEvaluate() {
    if (selectedOption === null || !probe) return;
    const chosen = probe.options[selectedOption];
    const score = chosen ? chosen.score : 0;

    const evals = latestResult?.evaluations || [];
    const result = calculateDimensionComparisons(evals, weakDimension, score);

    setComparisonResult(result);
    setEvaluated(true);
    completeRecheck(conceptName, result.overallBefore, result.overallAfter);
  }

  return (
    <div className="min-h-screen text-foreground selection:bg-primary/30 pb-28 md:pb-20">
      <EchoNavbar variant="dark" />

      <main className="mx-auto max-w-2xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
        {loading ? (
          <div className="glass-card p-12 text-center space-y-4">
            <Loader2 className="size-10 text-primary animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-white">Generating Dynamic Verification Probe</h2>
            <p className="text-xs text-slate-400">Testing weak dimension: {weakDimension.toUpperCase()} ({weakSubconcept})...</p>
          </div>
        ) : !evaluated && probe ? (
          <div className="glass-card p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">STAGE 06: VERIFICATION</span>
                <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">Fresh Post-Intervention Verification</h1>
                <p className="text-xs text-slate-300 mt-1">
                  Testing <span className="text-primary font-bold uppercase">{weakDimension}</span> dimension with a new question.
                </p>
              </div>
              <Badge variant="outline" className="border-primary/40 text-primary uppercase font-mono text-xs">
                {weakDimension} Probe
              </Badge>
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
                Submit Verification Answer <ArrowRight className="ml-1.5 size-4" />
              </Button>
            </div>
          </div>
        ) : comparisonResult ? (
          <div className="glass-card p-6 sm:p-10 text-center space-y-6">
            <div className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-success/20 border border-success/40 text-success mx-auto shadow-glow">
              <TrendingUp className="size-7" />
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Evidence Verification Telemetry · {conceptName}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
                Post-Intervention Dimension Telemetry
              </h1>
            </div>

            {/* Overall Score Gain */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 sm:p-6 items-center font-mono text-center">
              <div>
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Initial Evidence</span>
                <p className="text-2xl sm:text-3xl font-bold text-slate-400 mt-1">{comparisonResult.overallBefore}%</p>
              </div>
              <div className="border-x border-white/10">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-success">Net Gain</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-success mt-1">
                  +{comparisonResult.overallGain} pts
                </p>
              </div>
              <div>
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-primary">Post-Intervention</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-primary mt-1">{comparisonResult.overallAfter}%</p>
              </div>
            </div>

            {/* PROMPT #4 REQUIREMENT: DIMENSION-BY-DIMENSION COMPARISON TABLE */}
            <div className="space-y-3 text-left">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Dimension-by-Dimension Evidence Comparison
              </h3>
              <div className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden divide-y divide-white/10">
                {comparisonResult.comparisons.map((c) => (
                  <div key={c.dimension} className="p-3.5 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="font-bold text-white uppercase">{c.label}</span>
                      {c.dimension === weakDimension && (
                        <Badge variant="outline" className="ml-2 text-[10px] border-primary/40 text-primary">
                          Targeted Weakness
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 font-bold">
                      <span className="text-slate-400">{c.beforeScore}%</span>
                      <ArrowRight className="size-3 text-slate-500" />
                      <span className="text-primary">{c.afterScore}%</span>
                      <span className={c.improved ? "text-success" : "text-slate-400"}>
                        ({c.scoreGain >= 0 ? `+${c.scoreGain}` : c.scoreGain}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PROMPT #4 REQUIREMENT: EXACT NON-GUARANTEED WORDING */}
            <div className="rounded-xl border border-success/40 bg-success/10 p-4 text-xs text-success flex items-center justify-center gap-2 font-medium">
              <ShieldCheck className="size-4 shrink-0" />
              <span>{comparisonResult.verdictMessage}</span>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 font-bold shadow-glow w-full sm:w-auto min-h-[48px]">
                <Link to="/dashboard">View Telemetry Dashboard <ArrowRight className="ml-1.5 size-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 hover:bg-white/10 w-full sm:w-auto min-h-[48px]">
                <Link to="/assessment">Start New Evidence Probe</Link>
              </Button>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
