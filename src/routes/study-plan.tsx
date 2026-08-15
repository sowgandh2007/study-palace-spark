import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles, Loader2, Download, RotateCcw, BookOpen, BrainCircuit, ShieldCheck } from "lucide-react";
import { EchoNavbar } from "@/components/EchoNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useEcho } from "@/lib/echo/store";
import { generateHtmlStudyPlanDocument, downloadHtmlAsPdf, type HtmlStudyPlanResult } from "@/lib/echo/pdfSummary";
import { toast } from "sonner";

export const Route = createFileRoute("/study-plan")({
  validateSearch: (search: Record<string, unknown>) => ({
    concept: typeof search["concept"] === "string" ? (search["concept"] as string) : undefined,
  }),
  component: StudyPlanPage,
});

export function StudyPlanPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { reflections, activeLearnMaterial } = useEcho();
  const latestReflection = reflections[0];

  const defaultTopic = search.concept || latestReflection?.conceptName || activeLearnMaterial?.topic || "Binary Search";

  const [conceptInput, setConceptInput] = useState(defaultTopic);
  const [generating, setGenerating] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [planResult, setPlanResult] = useState<HtmlStudyPlanResult | null>(null);

  async function handleGeneratePlan(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const topicToUse = conceptInput.trim() || defaultTopic;
    if (!topicToUse) return;

    setGenerating(true);
    try {
      const res = await generateHtmlStudyPlanDocument(
        topicToUse,
        latestReflection?.understoodText,
        latestReflection?.notUnderstoodText,
        latestReflection?.confidence
      );
      setPlanResult(res);
      toast.success("Generated HTML Study Plan Document!");
    } catch {
      toast.error("Failed to generate study plan document.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownloadPdf() {
    if (!planResult) return;
    setDownloadingPdf(true);
    try {
      const sanitizedTitle = (planResult.topic || "Study_Plan").replace(/[^a-z0-9_-]/gi, "_");
      await downloadHtmlAsPdf("echo-study-plan-doc-view", `${sanitizedTitle}_Study_Plan`);
      toast.success("Downloaded Study Plan PDF Document!");
    } catch {
      toast.error("PDF download failed. Opening print view...");
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-royal-ice-page selection:bg-primary/30 pb-28 md:pb-20">
      <EchoNavbar variant="light" />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
        {/* Header */}
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
            ECHO STUDY PLAN GENERATOR
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mt-1">
            Evidence-Based Study Plan
          </h1>
          <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1">
            Generate an evidence-based HTML/PDF study document with summarized learning material for any concept.
          </p>
        </div>

        {/* Input & Generator Card */}
        <div className="glass-card-light p-6 sm:p-8 space-y-6 rounded-2xl bg-white/95 border border-slate-200 shadow-md">
          <form onSubmit={handleGeneratePlan} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <BookOpen className="size-4 text-primary" /> Target Concept / Subject
              </label>
              <Input
                value={conceptInput}
                onChange={(e) => setConceptInput(e.target.value)}
                placeholder="e.g. Binary Search, Operating Systems, TCP"
                className="bg-white border-slate-300 text-slate-900 min-h-[46px]"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={generating || !conceptInput.trim()}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold shadow-glow text-base min-h-[48px] rounded-2xl"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 size-5 animate-spin" /> Generating Study Plan Document...
                </>
              ) : (
                <>
                  Generate HTML Study Plan Document <Sparkles className="ml-2 size-5 text-sky-200" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Rendered HTML / PDF Study Plan Document View */}
        {planResult && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Action Bar */}
            <div className="glass-card-light p-5 rounded-2xl bg-white/95 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-bold uppercase text-primary">Generated Document</span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">{planResult.topic}</h2>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="bg-primary hover:bg-primary/90 text-white font-bold text-xs min-h-[38px] shadow-glow"
                >
                  {downloadingPdf ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Download className="size-3.5 mr-1.5" />}
                  Download Study Plan PDF
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleGeneratePlan}
                  disabled={generating}
                  className="border-slate-300 bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs min-h-[38px]"
                >
                  <RotateCcw className="size-3.5 mr-1 text-primary" /> Regenerate
                </Button>
              </div>
            </div>

            {/* Document Content Box */}
            <div className="glass-card-light p-6 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-lg space-y-4">
              <div id="echo-study-plan-doc-view" className="echo-study-html-body max-w-none">
                <div dangerouslySetInnerHTML={{ __html: planResult.htmlContent }} />
              </div>
            </div>

            {/* Connected CTAs */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                onClick={() => navigate({ to: "/reflection", search: { concept: planResult.topic } })}
                className="bg-primary hover:bg-primary/90 text-white font-bold text-xs min-h-[44px] shadow-glow"
              >
                <BrainCircuit className="size-4 mr-2" /> Reflect on this concept →
              </Button>

              <Button
                type="button"
                onClick={() => navigate({ to: "/assessment", search: { concept: planResult.topic } })}
                variant="outline"
                className="border-primary/40 text-primary hover:bg-primary/10 font-bold text-xs min-h-[44px]"
              >
                <ShieldCheck className="size-4 mr-2" /> Verify understanding →
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
