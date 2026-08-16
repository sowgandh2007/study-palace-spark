import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Upload,
  FileText,
  Sparkles,
  Loader2,
  Download,
  Trash2,
  AlertCircle,
  FileCheck,
  RotateCcw,
  ArrowRight,
  BrainCircuit,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import { EchoNavbar } from "@/components/EchoNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useEcho } from "@/lib/echo/store";
import { extractTextFromPdf, type PdfExtractResult } from "@/lib/echo/pdf";
import {
  generateComprehensivePdfSummaryHTML,
  downloadHtmlAsPdf,
  type ComprehensivePdfSummaryResult,
} from "@/lib/echo/pdfSummary";
import { toast } from "sonner";

export const Route = createFileRoute("/learn")({
  validateSearch: (search: Record<string, unknown>) => ({
    topic: typeof search["topic"] === "string" ? (search["topic"] as string) : undefined,
  }),
  component: LearnPage,
});

type LoadingStateStep = "idle" | "uploading" | "reading" | "analyzing" | "creating" | "saving" | "ready";

function LearnPage() {
  const navigate = useNavigate();
  const { topic: searchTopic } = Route.useSearch();
  const { activeLearnMaterial, saveLearnMaterial, setActiveLearnMaterial } = useEcho();

  const [topicInput, setTopicInput] = useState(searchTopic ?? "");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfData, setPdfData] = useState<PdfExtractResult | null>(null);

  const [loadingStep, setLoadingStep] = useState<LoadingStateStep>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setLoadingStep("uploading");
    try {
      setLoadingStep("reading");
      const res = await extractTextFromPdf(file);
      setPdfFile(file);
      setPdfData(res);
      if (!topicInput.trim()) {
        setTopicInput(file.name.replace(/\.pdf$/i, ""));
      }
      toast.success(`Loaded PDF: ${file.name} (${res.pageCount} pages)`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to extract text from PDF document.");
      toast.error("PDF Processing Error");
    } finally {
      setLoadingStep("idle");
    }
  }

  async function handleGenerate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!topicInput.trim() && !pdfData) {
      toast.error("Please enter a topic or upload a PDF document.");
      return;
    }

    setErrorMsg(null);

    try {
      let extractedText = pdfData?.text || "";

      if (!extractedText && pdfFile) {
        setLoadingStep("reading");
        const res = await extractTextFromPdf(pdfFile);
        extractedText = res.text;
        setPdfData(res);
      }

      setLoadingStep("analyzing");
      const topicName = topicInput.trim() || pdfFile?.name.replace(/\.pdf$/i, "") || "Study Material";
      
      let summaryResult: ComprehensivePdfSummaryResult;
      
      if (extractedText) {
        summaryResult = await generateComprehensivePdfSummaryHTML(topicName, extractedText, pdfData?.pageCount);
      } else {
        // Topic-only generation prompt context
        summaryResult = await generateComprehensivePdfSummaryHTML(
          topicName,
          `High-yield educational study guide on ${topicName}. Include core definitions, mechanisms, algorithms, formulas, and key takeaways.`,
          1
        );
      }

      setLoadingStep("creating");
      await new Promise((r) => setTimeout(r, 200));

      setLoadingStep("saving");
      // Save learning material to Echo Store for Reflect & Verify stage syncing!
      const savedMat = saveLearnMaterial({
        topic: summaryResult.title || topicName,
        sourceType: pdfFile ? "pdf" : "topic",
        fileName: pdfFile?.name,
        htmlContent: summaryResult.htmlContent,
        summaryText: summaryResult.summaryText,
        keyConcepts: summaryResult.keyConcepts,
        importantPoints: summaryResult.importantPoints,
        pageCount: pdfData?.pageCount,
        wordCount: summaryResult.wordCount,
      });

      setLoadingStep("ready");
      toast.success("Saved AI Study Summary to Learn!");
    } catch (err: any) {
      setErrorMsg(err.message || "Unable to analyze this PDF/Topic. Please try again.");
      toast.error("Generation Failed");
    } finally {
      setLoadingStep("idle");
    }
  }

  async function handleDownloadPdf() {
    if (!activeLearnMaterial) return;
    setDownloadingPdf(true);
    try {
      const sanitizedTitle = activeLearnMaterial.topic.replace(/[^a-z0-9_-]/gi, "_");
      await downloadHtmlAsPdf("echo-learn-doc-view", sanitizedTitle);
      toast.success("Downloaded PDF Document!");
    } catch {
      toast.error("PDF download failed. Printing document...");
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  }

  function handleReflectClick() {
    if (!activeLearnMaterial) return;
    navigate({
      to: "/reflection",
      search: { concept: activeLearnMaterial.topic },
    });
  }

  function handleVerifyClick() {
    if (!activeLearnMaterial) return;
    navigate({
      to: "/assessment",
      search: { concept: activeLearnMaterial.topic },
    });
  }

  function renderLoadingText() {
    switch (loadingStep) {
      case "uploading":
        return "Uploading PDF...";
      case "reading":
        return "Reading document...";
      case "analyzing":
        return "Analyzing with Gemini...";
      case "creating":
        return "Creating study summary...";
      case "saving":
        return "Saving to Learn...";
      case "ready":
        return "Ready.";
      default:
        return "Processing...";
    }
  }

  return (
    <div className="min-h-screen bg-gradient-royal-ice-page selection:bg-primary/30 pb-28 md:pb-20">
      <EchoNavbar variant="light" />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-8">
        {/* Header */}
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
            STAGE 02: LEARNING CONTEXT
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mt-1">
            Learning Context & PDF Material Ingestion
          </h1>
          <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1">
            Upload lecture notes or enter topics to extract structural subconcepts and core domain invariants.
          </p>
        </div>

        {/* Unified Input Card: Learn a Topic & Learn from PDF */}
        <div className="glass-card-light p-6 sm:p-8 space-y-6 rounded-2xl bg-white/95 border border-slate-200 shadow-md">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Option A: Learn a Topic */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <BookOpen className="size-4 text-primary" /> Learn a Topic
                </label>
                <Input
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  placeholder="e.g. Binary Search, Operating Systems, TCP"
                  className="bg-white border-slate-300 text-slate-900 min-h-[46px]"
                />
              </div>

              {/* Option B: Learn from PDF */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileText className="size-4 text-primary" /> Learn from PDF
                </label>

                {!pdfFile ? (
                  <div className="relative rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 p-3 text-center space-y-1 transition-colors min-h-[46px] flex items-center justify-center">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <Upload className="size-4 text-primary" /> Select or Drag PDF File
                    </div>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileUpload}
                      disabled={loadingStep !== "idle"}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-primary/40 bg-primary/10 p-2.5 flex items-center justify-between min-h-[46px]">
                    <div className="flex items-center gap-2 truncate">
                      <FileCheck className="size-4 text-primary shrink-0" />
                      <span className="text-xs font-bold text-slate-900 truncate">{pdfFile.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPdfFile(null);
                        setPdfData(null);
                      }}
                      className="text-slate-500 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={loadingStep !== "idle" || (!pdfFile && !topicInput)}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold shadow-glow text-base min-h-[48px]"
            >
              {loadingStep !== "idle" ? (
                <>
                  <Loader2 className="mr-2 size-5 animate-spin" /> {renderLoadingText()}
                </>
              ) : (
                <>
                  Generate Study Summary <Sparkles className="ml-2 size-5 text-sky-200" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Error Alert Display with Retry Option */}
        {errorMsg && (
          <div className="rounded-2xl border border-rose-300 bg-rose-50 p-6 space-y-4 shadow-sm animate-in fade-in duration-200">
            <div className="flex items-start gap-3 text-rose-900">
              <AlertCircle className="size-6 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-bold text-sm">Unable to analyze this material</h3>
                <p className="text-xs text-rose-700 font-medium leading-relaxed">{errorMsg}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => handleGenerate()}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs min-h-[38px] px-4"
              >
                <RotateCcw className="size-3.5 mr-1.5" /> Retry
              </Button>
            </div>
          </div>
        )}

        {/* Saved Active Learn Material Experience */}
        {activeLearnMaterial && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header & Controls */}
            <div className="glass-card-light p-5 sm:p-6 rounded-2xl bg-white/95 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <span className="text-xs font-mono font-bold uppercase text-primary">Current Topic</span>
                  <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                    {activeLearnMaterial.topic}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-primary/40 text-primary font-mono text-xs">
                    {activeLearnMaterial.sourceType === "pdf" ? `PDF: ${activeLearnMaterial.fileName || "Document"}` : "Topic Query"}
                  </Badge>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleDownloadPdf}
                    disabled={downloadingPdf}
                    className="border-slate-300 text-slate-900 font-bold text-xs min-h-[36px]"
                  >
                    {downloadingPdf ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <Download className="size-3.5 mr-1" />}
                    Download PDF
                  </Button>
                </div>
              </div>

              {/* Action Flow Connections: Reflect & Verify */}
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  onClick={handleReflectClick}
                  className="bg-primary hover:bg-primary/90 text-white font-bold text-xs min-h-[44px] shadow-glow"
                >
                  <BrainCircuit className="size-4 mr-2" /> Reflect on this →
                </Button>

                <Button
                  type="button"
                  onClick={handleVerifyClick}
                  variant="outline"
                  className="border-primary/40 text-primary hover:bg-primary/10 font-bold text-xs min-h-[44px]"
                >
                  <ShieldCheck className="size-4 mr-2" /> Verify understanding →
                </Button>
              </div>
            </div>

            {/* Key Concepts Extracted */}
            {activeLearnMaterial.keyConcepts && activeLearnMaterial.keyConcepts.length > 0 && (
              <div className="glass-card-light p-6 rounded-2xl bg-white/95 border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Key Concepts</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {activeLearnMaterial.keyConcepts.map((kc, i) => (
                    <div key={i} className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-1">
                      <p className="font-bold text-xs text-slate-900">{kc.concept}</p>
                      <p className="text-[11px] text-slate-700 leading-relaxed">{kc.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full HTML Study Document Display */}
            <div className="glass-card-light p-6 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-lg space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">
                Comprehensive AI Study Summary
              </h3>

              <div id="echo-learn-doc-view" className="echo-study-html-body max-w-none">
                <div dangerouslySetInnerHTML={{ __html: activeLearnMaterial.htmlContent }} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
