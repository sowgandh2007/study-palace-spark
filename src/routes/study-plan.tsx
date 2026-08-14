import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Loader2, Clock, ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import { EchoNavbar } from "@/components/EchoNavbar";
import { Button } from "@/components/ui/button";
import { useEcho } from "@/lib/echo/store";
import { generateAcademicStudyPlan, type AcademicStudyPlan } from "@/lib/echo/llm";
import { toast } from "sonner";

export const Route = createFileRoute("/study-plan")({
  component: StudyPlanPage,
});

export function StudyPlanPage() {
  const { reflections } = useEcho();
  const latestReflection = reflections[0];

  const [hasGenerated, setHasGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [academicPlan, setAcademicPlan] = useState<AcademicStudyPlan | null>(null);

  // Function to generate evidence-based study plan
  async function handleGeneratePlan() {
    setGenerating(true);
    try {
      const concept = latestReflection?.conceptName || "Binary Search";
      const res = await generateAcademicStudyPlan(
        concept,
        latestReflection?.understoodText,
        latestReflection?.notUnderstoodText,
        latestReflection?.confidence
      );
      setAcademicPlan(res);
      setHasGenerated(true);
      toast.success("Study Plan Generated!");
    } catch {
      toast.error("Failed to generate study plan.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-royal-ice-page selection:bg-primary/30 flex flex-col justify-between pb-16">
      {/* Subtle Global Header */}
      <EchoNavbar variant="light" />

      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-12 w-full">
        {!hasGenerated ? (
          /* INITIAL STATE: Google-Homepage-Style Minimalism */
          <div className="flex flex-col items-center justify-center text-center py-12 sm:py-20 space-y-6 animate-in fade-in duration-300">
            <span className="text-xs font-mono font-bold tracking-widest text-primary uppercase bg-white/80 border border-primary/20 px-3 py-1 rounded-full shadow-sm">
              ECHO
            </span>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
                Study Plan
              </h1>
              <p className="text-sm sm:text-base text-slate-700 font-medium max-w-md mx-auto">
                An evidence-based plan built around what you need to understand next.
              </p>
            </div>

            <div className="pt-4 space-y-3 w-full max-w-xs mx-auto">
              <Button
                type="button"
                onClick={handleGeneratePlan}
                disabled={generating}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-base min-h-[48px] rounded-2xl shadow-glow transition-all"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" /> Generating Plan...
                  </>
                ) : (
                  <>
                    Generate Study Plan <Sparkles className="ml-2 size-5 text-sky-200" />
                  </>
                )}
              </Button>

              <p className="text-xs text-slate-600 font-medium">
                {latestReflection
                  ? `Based on your latest reflection: ${latestReflection.conceptName}`
                  : "Based on your latest reflection"}
              </p>
            </div>
          </div>
        ) : (
          /* GENERATED PLAN UI: Extremely Minimal Vertical Timeline Sequence */
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="border-b border-slate-200/80 pb-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold uppercase text-primary tracking-wider">
                  Targeted Learning Sequence
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                  {academicPlan?.topic}
                </h1>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleGeneratePlan}
                disabled={generating}
                className="border-slate-300 bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs rounded-xl min-h-[38px]"
              >
                <RotateCcw className="size-3.5 mr-1.5 text-primary" /> Regenerate
              </Button>
            </div>

            {/* What to Study & What Needs Attention */}
            {academicPlan && (
              <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 sm:p-6 space-y-3 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-wider text-primary">
                  What Needs Attention
                </div>
                <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                  {academicPlan.currentUnderstandingSummary}
                </p>
              </div>
            )}

            {/* Vertical Timeline / Sequence List */}
            {academicPlan && (
              <div className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Recommended Order & Sessions
                </h2>

                <div className="space-y-4 relative before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-primary/20">
                  {academicPlan.sessions.map((sess, idx) => (
                    <div
                      key={sess.id}
                      className="relative pl-12 rounded-2xl border border-slate-200 bg-white/95 p-5 space-y-3 shadow-sm"
                    >
                      {/* Step Number Dot */}
                      <div className="absolute left-2.5 top-5 -translate-x-1/2 grid h-6 w-6 place-items-center rounded-full bg-primary text-white font-mono text-[10px] font-bold shadow-glow">
                        0{idx + 1}
                      </div>

                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm sm:text-base text-slate-900">
                          {sess.topic}
                        </h3>
                        <span className="flex items-center gap-1 font-mono text-xs text-slate-600 font-medium">
                          <Clock className="size-3.5 text-primary" /> {sess.estimatedMinutes}m
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 font-medium leading-relaxed">
                        <strong className="text-slate-900">Objective:</strong> {sess.objective}
                      </p>

                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <strong className="text-slate-800">Activity:</strong> {sess.recommendedActivity}
                      </p>

                      <div className="pt-2 flex justify-end">
                        <Button
                          asChild
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl min-h-[38px] px-4 shadow-glow"
                        >
                          <Link to="/repair" search={{ concept: sess.topic }}>
                            Start Session <ArrowRight className="ml-1.5 size-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Subtle Footer */}
      <footer className="text-center text-[11px] text-slate-500 font-mono">
        ECHO • Evidence-Based Learning Intelligence
      </footer>
    </div>
  );
}
