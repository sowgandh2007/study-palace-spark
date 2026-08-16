import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Sparkles, Loader2, Info, Target, Wrench } from "lucide-react";
import { EchoNavbar } from "@/components/EchoNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useEcho } from "@/lib/echo/store";
import { diagnoseWeaknessProfile, generateAdaptiveRepairPlan } from "@/lib/echo/adaptiveEngine";
import type { AdaptiveRepairPlan } from "@/lib/echo/types";

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

  const [loading, setLoading] = useState(true);
  const [repairPlan, setRepairPlan] = useState<AdaptiveRepairPlan | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [explanationText, setExplanationText] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadAdaptivePlan() {
      setLoading(true);
      const evals = latestResult?.evaluations || [];
      const diagnosis = diagnoseWeaknessProfile(evals);

      const plan = await generateAdaptiveRepairPlan(
        conceptName,
        diagnosis.weakDimension,
        diagnosis.weakSubconcept,
        diagnosis.lowestScore
      );

      if (isMounted) {
        setRepairPlan(plan);
        setActiveRepair({
          id: plan.id,
          conceptName: plan.conceptName,
          weakSubconcept: plan.weakSubconcept,
          gapText: plan.steps[0]?.selectedReason || `Targeting weak dimension: ${plan.weakDimension}`,
          priority: "High",
          totalMinutes: plan.totalMinutes,
          steps: plan.steps.map((s) => ({ title: s.title, minutes: s.minutes, instruction: s.instruction })),
          beforeScore: diagnosis.lowestScore,
        });
        setLoading(false);
      }
    }
    loadAdaptivePlan();
    return () => {
      isMounted = false;
    };
  }, [conceptName, latestResult]);

  function handleNextStep() {
    if (!repairPlan) return;
    if (currentStep < repairPlan.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate({
        to: "/recheck",
        search: {
          concept: conceptName,
          weakDimension: repairPlan.weakDimension,
          weakSubconcept: repairPlan.weakSubconcept,
        },
      });
    }
  }

  if (loading || !repairPlan) {
    return (
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 pb-28 md:pb-20">
        <EchoNavbar variant="dark" />
        <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-16 text-center space-y-4">
          <Loader2 className="size-10 text-primary animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-white">Synthesizing Adaptive Repair Plan</h2>
          <p className="text-xs text-slate-400">Diagnosing evidence weaknesses for {conceptName}...</p>
        </main>
      </div>
    );
  }

  const stepItem = repairPlan.steps[currentStep]!;

  return (
    <div className="min-h-screen text-foreground selection:bg-primary/30 pb-28 md:pb-20">
      <EchoNavbar variant="dark" />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
        {/* Stage Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">STAGE 05: TARGETED INTERVENTION</span>
            <Badge variant="outline" className="border-primary/40 text-primary font-mono text-xs">
              <Wrench className="size-3 mr-1" /> {repairPlan.primaryStrategy}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{conceptName} Targeted Intervention</h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Targeting weak dimension: <span className="text-primary font-bold uppercase">{repairPlan.weakDimension}</span> ({repairPlan.weakSubconcept}).
          </p>
        </div>

        {/* PROMPT #4 REQUIREMENT: SHOW WHY EACH ACTIVITY WAS SELECTED */}
        <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-primary">
            <Info className="size-4 shrink-0" />
            <span>Why this intervention strategy was selected:</span>
          </div>
          <p className="text-slate-200 font-medium pl-6 leading-relaxed">
            {stepItem.selectedReason}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>Step {currentStep + 1} of {repairPlan.steps.length}</span>
            <span>{stepItem.title}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-primary transition-all duration-300 shadow-glow"
              style={{ width: `${((currentStep + 1) / repairPlan.steps.length) * 100}%` }}
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
              placeholder="Formulate your response based on the structural invariant..."
              value={explanationText}
              onChange={(e) => setExplanationText(e.target.value)}
              className="bg-black/40 border-white/10 text-xs text-white"
            />
          )}

          <div className="pt-4 flex justify-end">
            <Button size="lg" onClick={handleNextStep} className="w-full sm:w-auto bg-primary hover:bg-primary/90 font-bold shadow-glow min-h-[48px]">
              {currentStep < repairPlan.steps.length - 1 ? (
                <>
                  Continue to Step {currentStep + 2} <ArrowRight className="ml-1.5 size-4" />
                </>
              ) : (
                <>
                  Complete Intervention & Verify <Sparkles className="ml-1.5 size-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
