import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  ArrowRight,
  Sparkles,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Brain,
  Compass,
  FileText,
  RotateCcw,
} from "lucide-react";
import { EchoNavbar } from "@/components/EchoNavbar";
import { Button } from "@/components/ui/button";
import { useEcho } from "@/lib/echo/store";
import { generateAcademicStudyPlan, type AcademicStudyPlan } from "@/lib/echo/llm";
import { toast } from "sonner";

export const Route = createFileRoute("/study-plan")({
  component: StudyPlanPage,
});

export function StudyPlanPage() {
  const { reflections, latestResult } = useEcho();
  const latestReflection = reflections[0];

  const [generating, setGenerating] = useState(false);
  const [academicPlan, setAcademicPlan] = useState<AcademicStudyPlan | null>(null);

  // Auto-generate plan based on latest student reflection evidence
  useEffect(() => {
    async function loadInitialPlan() {
      if (latestReflection) {
        setGenerating(true);
        try {
          const res = await generateAcademicStudyPlan(
            latestReflection.conceptName,
            latestReflection.understoodText,
            latestReflection.notUnderstoodText,
            latestReflection.confidence
          );
          setAcademicPlan(res);
        } catch {
          // Fallback plan
        } finally {
          setGenerating(false);
        }
      } else {
        // Default academic plan baseline
        setAcademicPlan({
          topic: "Binary Search & Spatial Halving",
          generatedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          totalMinutes: 35,
          currentUnderstandingSummary:
            "Evidence indicates baseline familiarity with binary search mechanisms, but reveals structural fragility around spatial halving conditions and array sorting preconditions.",
          focusAreas: [
            {
              concept: "Order Invariance Precondition",
              issueType: "Conceptual Gap",
              description: "Requires clear formulation of why elimination logic fails on unsorted inputs.",
            },
            {
              concept: "Midpoint Overflow Prevention",
              issueType: "Weak Application",
              description: "Boundary index calculations mid = low + (high - low)/2 under large limits.",
            },
          ],
          sequence: [
            { stepNumber: "01", title: "Review Prerequisite Invariants", objective: "Verify ordered array constraints." },
            { stepNumber: "02", title: "Rebuild Core Elimination Logic", objective: "Formulate exact mid-point calculation." },
            { stepNumber: "03", title: "Verify Transfer Applications", objective: "Test algorithm on rotated or non-standard search spaces." },
          ],
          sessions: [
            {
              id: "s1",
              sessionNumber: "Session 01",
              topic: "Binary Search — Core Invariants",
              objective: "Formulate and write the array sorting precondition in your own words.",
              recommendedActivity: "Review invariant definition → Write 2-sentence explanation → Verify against edge cases.",
              estimatedMinutes: 15,
            },
            {
              id: "s2",
              sessionNumber: "Session 02",
              topic: "Binary Search — Boundary Application",
              objective: "Apply pointer elimination to rotated sorted arrays.",
              recommendedActivity: "Solve 2 boundary variations → Verify index logic.",
              estimatedMinutes: 20,
            },
          ],
        });
      }
    }
    loadInitialPlan();
  }, [latestReflection]);

  async function handleRegeneratePlan() {
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
      toast.success("Regenerated Evidence-Based Study Plan!");
    } catch {
      toast.error("Failed to generate plan.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#0f172a] selection:bg-amber-100 pb-28 md:pb-20 font-sans">
      {/* Global Echo Header */}
      <EchoNavbar variant="light" />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 pt-8 sm:pt-12 space-y-10">
        {/* Academic Page Header (No submenus or tabs) */}
        <div className="border-b border-[#e5e0d8] pb-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#b45309]">
              Academic Planning Workspace
            </span>
            {academicPlan && (
              <span className="text-xs font-mono text-[#64748b]">
                Generated {academicPlan.generatedAt}
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif font-extrabold text-[#0f172a] tracking-tight">
            Study Plan
          </h1>

          <p className="text-sm text-[#475569] font-serif italic">
            An evidence-based plan built around what you need to understand next.
          </p>

          {academicPlan && (
            <div className="pt-2 flex items-center gap-4 text-xs font-mono text-[#64748b]">
              <span>Topic: <strong className="text-[#0f172a]">{academicPlan.topic}</strong></span>
              <span>•</span>
              <span>Estimated Time: <strong className="text-[#0f172a]">{academicPlan.totalMinutes} minutes</strong></span>
            </div>
          )}
        </div>

        {generating ? (
          <div className="rounded-2xl border border-[#e5e0d8] bg-white p-12 text-center space-y-3 shadow-sm">
            <Loader2 className="size-8 text-[#b45309] animate-spin mx-auto" />
            <p className="text-sm font-serif text-[#0f172a] font-bold">Generating Evidence-Based Academic Plan...</p>
            <p className="text-xs text-[#64748b]">Analyzing reflection data, diagnosed gaps, and understanding stability.</p>
          </div>
        ) : academicPlan ? (
          <div className="space-y-10 animate-in fade-in duration-300">
            {/* SECTION 1: CURRENT UNDERSTANDING */}
            <section className="rounded-2xl border border-[#e5e0d8] bg-white p-6 sm:p-8 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-[#b45309]">
                <Brain className="size-5 shrink-0" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-widest">Current Understanding</h2>
              </div>
              <p className="text-sm sm:text-base text-[#1e293b] leading-relaxed font-serif">
                {academicPlan.currentUnderstandingSummary}
              </p>
              {latestReflection && (
                <div className="pt-2 border-t border-[#f1f5f9] flex items-center justify-between text-xs text-[#64748b] font-mono">
                  <span>Based on recent reflection: <strong>{latestReflection.conceptName}</strong></span>
                  <span>Self-reported confidence: <strong>{latestReflection.confidence}%</strong></span>
                </div>
              )}
            </section>

            {/* SECTION 2: FOCUS AREAS */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#0f172a]">
                  Focus Areas
                </h2>
                <span className="text-xs font-mono text-[#64748b]">
                  {academicPlan.focusAreas.length} Key Concepts Requiring Attention
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {academicPlan.focusAreas.map((fa, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[#e5e0d8] bg-white p-5 space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#0f172a]">{fa.concept}</span>
                      <span className="rounded-md bg-[#fff7ed] border border-[#ffedd5] px-2 py-0.5 text-[10px] font-mono font-bold text-[#c2410c]">
                        {fa.issueType}
                      </span>
                    </div>
                    <p className="text-xs text-[#475569] leading-relaxed">{fa.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 3: RECOMMENDED LEARNING SEQUENCE */}
            <section className="rounded-2xl border border-[#e5e0d8] bg-white p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-[#0f172a]">
                <Compass className="size-5 shrink-0 text-[#b45309]" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-widest">Recommended Learning Sequence</h2>
              </div>

              <div className="space-y-3 pt-2">
                {academicPlan.sequence.map((seq) => (
                  <div
                    key={seq.stepNumber}
                    className="rounded-xl border border-[#f1f5f9] bg-[#fafaf8] p-4 flex items-start gap-4"
                  >
                    <span className="font-mono text-sm font-extrabold text-[#b45309] shrink-0 pt-0.5">
                      {seq.stepNumber}
                    </span>
                    <div className="space-y-0.5">
                      <h3 className="text-xs font-bold text-[#0f172a]">{seq.title}</h3>
                      <p className="text-xs text-[#475569]">{seq.objective}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 4: YOUR STUDY SESSIONS */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#0f172a]">
                  Your Study Sessions
                </h2>
                <span className="text-xs font-mono text-[#64748b]">
                  Total Budget: {academicPlan.totalMinutes}m
                </span>
              </div>

              <div className="space-y-4">
                {academicPlan.sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="rounded-2xl border border-[#e5e0d8] bg-white p-6 space-y-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
                      <div>
                        <span className="text-[11px] font-mono font-bold uppercase text-[#b45309]">
                          {sess.sessionNumber}
                        </span>
                        <h3 className="text-base font-bold text-[#0f172a] mt-0.5">{sess.topic}</h3>
                      </div>
                      <span className="flex items-center gap-1 font-mono text-xs text-[#64748b]">
                        <Clock className="size-3.5 text-[#b45309]" /> {sess.estimatedMinutes} min
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-[#334155]">
                      <p><strong>Objective:</strong> {sess.objective}</p>
                      <p className="text-[#475569] leading-relaxed">
                        <strong>Recommended Activity:</strong> {sess.recommendedActivity}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-end">
                      <Button
                        asChild
                        size="sm"
                        className="bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs rounded-xl min-h-[38px] px-5"
                      >
                        <Link to="/repair" search={{ concept: sess.topic }}>
                          Launch Repair Session <ArrowRight className="ml-1.5 size-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 5: PRIMARY ACTION */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#e5e0d8]">
              <Button
                type="button"
                variant="outline"
                onClick={handleRegeneratePlan}
                disabled={generating}
                className="w-full sm:w-auto border-[#cbd5e1] bg-white text-[#0f172a] hover:bg-[#f8fafc] font-bold text-xs min-h-[44px] px-6"
              >
                <RotateCcw className="mr-2 size-4 text-[#b45309]" /> Regenerate Evidence-Based Plan
              </Button>

              <Button
                asChild
                className="w-full sm:w-auto bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs min-h-[44px] px-6"
              >
                <Link to="/reflection">
                  Submit New Reflection <Sparkles className="ml-2 size-4 text-amber-300" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#e5e0d8] bg-white p-10 text-center space-y-3">
            <p className="text-sm font-serif text-[#0f172a]">No reflection evidence available yet.</p>
            <Button asChild size="sm" className="bg-[#0f172a] text-white font-bold text-xs">
              <Link to="/reflection">Reflect on a Topic →</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
