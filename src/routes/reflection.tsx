import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BrainCircuit, Loader2, Sparkles, BookOpen } from "lucide-react";
import { EchoNavbar } from "@/components/EchoNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { analyzeReflectionAndDiagnoseGap } from "@/lib/echo/llm";
import { useEcho } from "@/lib/echo/store";

export const Route = createFileRoute("/reflection")({
  validateSearch: (search: Record<string, unknown>) => ({
    concept: typeof search["concept"] === "string" ? (search["concept"] as string) : undefined,
  }),
  component: ReflectionPage,
});

function ReflectionPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { activeLearnMaterial, saveReflection } = useEcho();

  const initialTopic = search.concept || activeLearnMaterial?.topic || "Binary Search";

  const [concept, setConcept] = useState(initialTopic);
  const [confidence, setConfidence] = useState(72);
  const [understoodText, setUnderstoodText] = useState("I know how to find the middle element and compare it.");
  const [notUnderstoodText, setNotUnderstoodText] = useState("I don't understand why we can safely discard half of the array.");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (search.concept) {
      setConcept(search.concept);
    } else if (activeLearnMaterial?.topic) {
      setConcept(activeLearnMaterial.topic);
    }
  }, [search.concept, activeLearnMaterial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!concept.trim()) return;

    setLoading(true);

    saveReflection({
      conceptId: concept.toLowerCase().replace(/\s+/g, "-"),
      conceptName: concept.trim(),
      confidence,
      understoodText,
      notUnderstoodText,
    });

    try {
      const gapDiagnosis = await analyzeReflectionAndDiagnoseGap(
        concept.trim(),
        confidence,
        understoodText,
        notUnderstoodText
      );

      setLoading(false);
      navigate({
        to: "/assessment",
        search: {
          concept: concept.trim(),
          gap: gapDiagnosis.gapText,
          confidence: confidence.toString(),
        },
      });
    } catch {
      setLoading(false);
      navigate({
        to: "/assessment",
        search: { concept: concept.trim() },
      });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-royal-ice-page selection:bg-primary/30 pb-28 md:pb-20">
      <EchoNavbar variant="light" />

      <main className="mx-auto max-w-2xl px-4 sm:px-6 pt-6 sm:pt-10">
        <div className="glass-card-light p-6 sm:p-8 space-y-6 rounded-2xl bg-white/95 border border-slate-200 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 border border-primary/30 text-primary shrink-0">
                <BrainCircuit className="size-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">STAGE 3: REFLECT</span>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Explain in Your Own Words</h1>
              </div>
            </div>

            {activeLearnMaterial && activeLearnMaterial.topic === concept && (
              <Badge variant="outline" className="border-primary/40 text-primary text-xs font-mono">
                <BookOpen className="size-3 mr-1" /> From Learn
              </Badge>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Topic / Concept Name <span className="text-destructive">*</span>
              </label>
              <Input
                required
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="e.g. Binary Search, TCP Flow Control"
                className="mt-1.5 bg-white border-slate-300 text-slate-900 min-h-[44px]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Self-Reported Confidence Level
                </label>
                <span className="font-mono text-sm font-bold text-primary">{confidence}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
                className="w-full accent-primary h-2 rounded-lg bg-slate-200 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0% Completely Lost</span>
                <span>50% Partial</span>
                <span>100% Fully Mastered</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                What parts did you feel you understood today?
              </label>
              <Textarea
                rows={4}
                value={understoodText}
                onChange={(e) => setUnderstoodText(e.target.value)}
                placeholder="Explain the underlying mechanism in your own words..."
                className="mt-1.5 bg-white border-slate-300 text-slate-900 text-xs sm:text-sm p-3 min-h-[100px]"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                What felt confusing or hard to explain?
              </label>
              <Textarea
                rows={4}
                value={notUnderstoodText}
                onChange={(e) => setNotUnderstoodText(e.target.value)}
                placeholder="Where does your explanation break down?"
                className="mt-1.5 bg-white border-slate-300 text-slate-900 text-xs sm:text-sm p-3 min-h-[100px]"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold shadow-glow min-h-[48px] text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-5 animate-spin" /> Analyzing Understanding...
                </>
              ) : (
                <>
                  Analyze Understanding & Diagnose Gaps <ArrowRight className="ml-2 size-5" />
                </>
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
