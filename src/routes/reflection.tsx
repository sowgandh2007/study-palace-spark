import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BrainCircuit,
  Loader2,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  FileText,
  BadgeAlert,
  Zap,
  RotateCcw,
} from "lucide-react";
import { EchoNavbar } from "@/components/EchoNavbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { analyzeExplanationWithAI, type ExplanationAnalysis } from "@/lib/echo/llm";
import { useEcho } from "@/lib/echo/store";
import { toast } from "sonner";

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
  const [confidence, setConfidence] = useState(75);
  const [explanation, setExplanation] = useState(
    "Binary Search works by repeatedly halving a sorted array. We calculate mid = (low + high) / 2. If the target is smaller than mid, we search the left half, otherwise the right half."
  );

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ExplanationAnalysis | null>(null);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!concept.trim() || !explanation.trim()) {
      toast.error("Please enter a concept name and your explanation.");
      return;
    }

    setLoading(true);

    saveReflection({
      conceptId: concept.toLowerCase().replace(/\s+/g, "-"),
      conceptName: concept.trim(),
      confidence,
      understoodText: explanation.trim(),
      notUnderstoodText: "",
    });

    try {
      const res = await analyzeExplanationWithAI(concept.trim(), explanation.trim(), confidence);
      setAnalysis(res);
      toast.success("AI Analysis Complete!");
    } catch (err: any) {
      toast.error("Analysis failed. Proceeding to diagnostic probe.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen text-foreground selection:bg-primary/30 pb-28 md:pb-20">
      <EchoNavbar variant="dark" />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-xs">
              STAGE 3: REFLECT
            </Badge>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Self-Explanation Analysis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
            Explain Concept in Your Own Words
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            ECHO analyzes your free-form explanation to identify genuine understanding versus superficial rote memorization.
          </p>
        </div>

        {/* Free-form Explanation Form */}
        <div className="glass-card p-6 sm:p-8 space-y-6">
          <form onSubmit={handleAnalyze} className="space-y-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Concept Name <span className="text-destructive">*</span>
              </label>
              <Input
                required
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="e.g. Binary Search, Database Normalization (3NF), TCP Flow Control"
                className="mt-1.5 bg-black/40 border-white/10 text-white min-h-[46px]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Self-Reported Confidence (0–100%)
                </label>
                <span className="font-mono text-sm font-bold text-primary">{confidence}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
                className="mt-3 h-3 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-primary"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <FileText className="size-4 text-primary shrink-0" /> Explain the concept in your own words. <span className="text-destructive">*</span>
              </label>
              <Textarea
                required
                rows={6}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Write your explanation here... Walk through how it works under the hood, what preconditions are required, and why it behaves the way it does."
                className="mt-2 bg-black/40 border-white/10 text-xs sm:text-sm text-white leading-relaxed p-4"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 font-bold shadow-glow text-base min-h-[48px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-5 animate-spin" /> Analyzing Your Explanation...
                </>
              ) : (
                <>
                  Analyze My Understanding <Sparkles className="ml-2 size-5" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* AI Analysis Result Card */}
        {analysis && (
          <div className="glass-card p-6 sm:p-8 space-y-6 border-primary/40 shadow-glow">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">AI Evaluation Breakdown</span>
                <h2 className="text-xl font-bold text-white mt-0.5">{analysis.concept} Analysis</h2>
              </div>
              {analysis.isSuperficialOrRote && (
                <Badge variant="outline" className="border-warning/50 bg-warning/10 text-warning text-xs font-bold">
                  <BadgeAlert className="size-3.5 mr-1" /> Rote Flagged
                </Badge>
              )}
            </div>

            {/* Verdict */}
            <div className="rounded-xl bg-primary/10 border border-primary/30 p-4 space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary">Overall Assessment</span>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">{analysis.overallVerdict}</p>
            </div>

            {/* Understood vs Missing */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="size-4" /> What You Understood Correctly
                </span>
                <ul className="space-y-1 text-xs text-slate-200">
                  {analysis.understoodCorrectly.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="size-4" /> Missing Concepts & Connections
                </span>
                <ul className="space-y-1 text-xs text-slate-200">
                  {analysis.missingConcepts.concat(analysis.missingConnections).map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Misconceptions or Reasoning Flaws */}
            {(analysis.misconceptions.length > 0 || analysis.incorrectReasoning.length > 0) && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <BadgeAlert className="size-4" /> Misconceptions & Reasoning Flaws
                </span>
                <ul className="space-y-1 text-xs text-slate-200">
                  {analysis.misconceptions.concat(analysis.incorrectReasoning).map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action CTA */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-300 font-medium">{analysis.suggestedAction}</p>
              <Button asChild size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 font-bold shadow-glow min-h-[46px]">
                <Link to="/assessment" search={{ concept: analysis.concept }}>
                  Verify in Diagnostic <Zap className="size-4 ml-1.5 text-warning" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
