import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BrainCircuit, Loader2, Sparkles, HelpCircle, CheckCircle2 } from "lucide-react";
import { EchoLogo } from "@/routes/index";
import { ThemeSelect } from "@/lib/theme";
import { Button } from "@/components/ui/button";
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
  const { saveReflection } = useEcho();

  const [concept, setConcept] = useState(search.concept || "Binary Search");
  const [confidence, setConfidence] = useState(72);
  const [understoodText, setUnderstoodText] = useState("I know how to find the middle element and compare it.");
  const [notUnderstoodText, setNotUnderstoodText] = useState("I don't understand why we can safely discard half of the array.");

  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen text-foreground selection:bg-primary/30 pb-20">
      <header className="sticky top-0 z-40 glass-header">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <EchoLogo />
          <ThemeSelect />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 pt-10">
        <div className="glass-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/20 border border-primary/40 text-primary shadow-glow">
              <BrainCircuit className="size-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Post-Class Self-Assessment</span>
              <h1 className="text-2xl font-bold tracking-tight text-white">Quick ECHO Reflection</h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Topic / Concept Name <span className="text-destructive">*</span>
              </label>
              <Input
                required
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="e.g. Binary Search, TCP Flow Control"
                className="mt-1.5 bg-black/40 border-white/10 text-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  How much do you understand this? (0–100%)
                </label>
                <span className="font-mono text-sm font-bold text-primary">{confidence}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
                className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-primary"
              />
              <div className="mt-1.5 flex justify-between font-mono text-[11px] text-slate-400">
                <span>0% — Totally Lost</span>
                <span>50% — Somewhat Clear</span>
                <span>100% — Absolute Mastery</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <HelpCircle className="size-4 text-warning" /> What part didn't you understand? <span className="text-destructive">*</span>
              </label>
              <Textarea
                required
                rows={3}
                value={notUnderstoodText}
                onChange={(e) => setNotUnderstoodText(e.target.value)}
                placeholder="e.g. I don't understand why sorted order allows us to eliminate half the array..."
                className="mt-1.5 bg-black/40 border-white/10 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-success" /> What part do you already understand? (Optional)
              </label>
              <Textarea
                rows={2}
                value={understoodText}
                onChange={(e) => setUnderstoodText(e.target.value)}
                placeholder="e.g. I know how to calculate the mid index..."
                className="mt-1.5 bg-black/40 border-white/10 text-xs text-white"
              />
            </div>

            <Button type="submit" size="lg" disabled={loading} className="w-full bg-primary hover:bg-primary/90 font-bold shadow-glow text-base">
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Diagnosing Gap...
                </>
              ) : (
                <>
                  Diagnose Gap & Verify <Sparkles className="ml-2 size-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
