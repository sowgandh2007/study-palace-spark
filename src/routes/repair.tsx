import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Clock, Sparkles, BookOpen } from "lucide-react";
import { EchoLogo } from "@/routes/index";
import { ThemeSelect } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/repair")({
  validateSearch: (search: Record<string, unknown>) => ({
    concept: typeof search["concept"] === "string" ? (search["concept"] as string) : undefined,
  }),
  component: RepairPage,
});

const REPAIR_STEPS = [
  {
    step: 1,
    title: "Review the Elimination Invariant (4 min)",
    instruction: "Read: Binary Search works because sorted order guarantees every element left of mid is <= mid. When arr[mid] < target, the target CANNOT exist in [0...mid], so discarding the left half preserves correctness.",
  },
  {
    step: 2,
    title: "Explain in Your Own Words (5 min)",
    instruction: "Write 2 sentences explaining why eliminating half the search space requires spatial order.",
  },
  {
    step: 3,
    title: "Apply to Boundary Variations (4 min)",
    instruction: "If the array contains duplicate values, how does the elimination invariant change when looking for the FIRST occurrence?",
  },
  {
    step: 4,
    title: "ECHO Post-Repair Verification (2 min)",
    instruction: "Ready to test your updated understanding and calculate your post-repair score increase.",
  },
];

function RepairPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const conceptName = search.concept || "Binary Search";

  const [currentStep, setCurrentStep] = useState(0);
  const [explanationText, setExplanationText] = useState("");

  function handleNextStep() {
    if (currentStep < REPAIR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate({
        to: "/recheck",
        search: { concept: conceptName, before: "72", after: "91" },
      });
    }
  }

  const stepItem = REPAIR_STEPS[currentStep]!;

  return (
    <div className="min-h-screen text-foreground selection:bg-primary/30 pb-20">
      <header className="sticky top-0 z-40 glass-header">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <EchoLogo />
          <ThemeSelect />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pt-10 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Targeted Gap Repair</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">{conceptName} Repair Activity</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">15-minute step-by-step exercise targeting your diagnosed conceptual gap.</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>Step {currentStep + 1} of {REPAIR_STEPS.length}</span>
            <span>{stepItem.title}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-primary transition-all duration-300 shadow-glow"
              style={{ width: `${((currentStep + 1) / REPAIR_STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Card */}
        <div className="glass-card p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <Clock className="size-4" /> {stepItem.title}
          </div>

          <p className="text-sm sm:text-base font-medium leading-relaxed text-slate-200">{stepItem.instruction}</p>

          {currentStep === 1 && (
            <Textarea
              rows={4}
              placeholder="Write your explanation here..."
              value={explanationText}
              onChange={(e) => setExplanationText(e.target.value)}
              className="bg-black/40 border-white/10 text-xs text-white"
            />
          )}

          {currentStep === 2 && (
            <Textarea
              rows={4}
              placeholder="Explain how boundary pointers shift when duplicates exist..."
              value={explanationText}
              onChange={(e) => setExplanationText(e.target.value)}
              className="bg-black/40 border-white/10 text-xs text-white"
            />
          )}

          <div className="pt-4 flex justify-end">
            <Button size="lg" onClick={handleNextStep} className="bg-primary hover:bg-primary/90 font-bold shadow-glow">
              {currentStep < REPAIR_STEPS.length - 1 ? (
                <>
                  Continue to Step {currentStep + 2} <ArrowRight className="ml-1.5 size-4" />
                </>
              ) : (
                <>
                  Complete Repair & Launch Re-Check <Sparkles className="ml-1.5 size-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
