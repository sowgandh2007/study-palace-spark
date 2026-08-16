import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Clock, Sparkles, BookOpen, Loader2 } from "lucide-react";
import { EchoNavbar } from "@/components/EchoNavbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEcho } from "@/lib/echo/store";
import { generateTargetedRepairActivity } from "@/lib/echo/pipeline";
import type { DynamicRepairActivity } from "@/lib/echo/types";

export const Route = createFileRoute("/repair")({
  validateSearch: (search: Record<string, unknown>) => ({
    concept: typeof search["concept"] === "string" ? (search["concept"] as string) : undefined,
  }),
  component: RepairPage,
});

function RepairPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { latestResult, setActiveRepair } = useEcho();

  const conceptName = search.concept || latestResult?.conceptName || "Concept Verification";
  const weakSubconcept = latestResult?.weakSubconcept || `${conceptName} Invariants`;
  const beforeScore = latestResult?.stabilityScore ?? 50;

  const [loading, setLoading] = useState(true);
  const [repairActivity, setRepairActivity] = useState<DynamicRepairActivity | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [explanationText, setExplanationText] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadRepair() {
      setLoading(true);
      const activity = await generateTargetedRepairActivity(
        conceptName,
        weakSubconcept,
        latestResult?.recommendation
      );
      if (isMounted) {
        setRepairActivity(activity);
        setActiveRepair(activity);
        setLoading(false);
      }
    }
    loadRepair();
    return () => {
      isMounted = false;
    };
  }, [conceptName, weakSubconcept]);

  function handleNextStep() {
    if (!repairActivity) return;
    if (currentStep < repairActivity.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Pass actual pre-repair score to recheck! Zero fake scores!
      navigate({
        to: "/recheck",
        search: {
          concept: conceptName,
          weakSubconcept,
          before: String(beforeScore),
        },
      });
    }
  }

  if (loading || !repairActivity) {
    return (
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 pb-28 md:pb-20">
        <EchoNavbar variant="dark" />
        <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-16 text-center space-y-4">
          <Loader2 className="size-10 text-primary animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-white">Synthesizing Targeted Repair Activity</h2>
          <p className="text-xs text-slate-400">Targeting weak subconcept: {weakSubconcept}...</p>
        </main>
      </div>
    );
  }

  const stepItem = repairActivity.steps[currentStep]!;

  return (
    <div className="min-h-screen text-foreground selection:bg-primary/30 pb-28 md:pb-20">
      <EchoNavbar variant="dark" />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">STAGE 05: TARGETED INTERVENTION</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">{conceptName} Targeted Intervention</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Targeting weak subconcept: <span className="text-primary font-bold">{weakSubconcept}</span>.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>Step {currentStep + 1} of {repairActivity.steps.length}</span>
            <span>{stepItem.title}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-primary transition-all duration-300 shadow-glow"
              style={{ width: `${((currentStep + 1) / repairActivity.steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Card */}
        <div className="glass-card p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <Clock className="size-4" /> {stepItem.title}
          </div>

          <p className="text-sm sm:text-base font-medium leading-relaxed text-slate-200">{stepItem.instruction}</p>

          {stepItem.requiresStudentInput && (
            <Textarea
              rows={4}
              placeholder="Write your explanation here..."
              value={explanationText}
              onChange={(e) => setExplanationText(e.target.value)}
              className="bg-black/40 border-white/10 text-xs text-white"
            />
          )}

          <div className="pt-4 flex justify-end">
            <Button size="lg" onClick={handleNextStep} className="w-full sm:w-auto bg-primary hover:bg-primary/90 font-bold shadow-glow min-h-[48px]">
              {currentStep < repairActivity.steps.length - 1 ? (
                <>
                  Continue to Step {currentStep + 2} <ArrowRight className="ml-1.5 size-4" />
                </>
              ) : (
                <>
                  Complete Repair & Launch Dynamic Re-Check <Sparkles className="ml-1.5 size-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
