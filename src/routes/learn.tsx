import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  FileText,
  Upload,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  Zap,
  Trash2,
} from "lucide-react";
import { EchoNavbar } from "@/components/EchoNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { extractTextFromPdf, type PdfExtractResult } from "@/lib/echo/pdf";
import { generatePdfSummary, type LearningSummary } from "@/lib/echo/llm";
import { toast } from "sonner";

export const Route = createFileRoute("/learn")({
  component: LearnPage,
});

function LearnPage() {
  const navigate = useNavigate();

  const [topic, setTopic] = useState("Binary Search");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfData, setPdfData] = useState<PdfExtractResult | null>(null);
  const [extractingPdf, setExtractingPdf] = useState(false);

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<LearningSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtractingPdf(true);
    setErrorMsg(null);
    try {
      const res = await extractTextFromPdf(file);
      setPdfFile(file);
      setPdfData(res);
      if (!topic || topic === "Binary Search") {
        setTopic(file.name.replace(/\.pdf$/i, ""));
      }
      toast.success(`Extracted text from ${file.name} (${res.pageCount} pages)`);
    } catch (err: any) {
      toast.error(err.message || "Failed to process PDF file.");
      setErrorMsg(err.message || "Failed to process PDF file.");
    } finally {
      setExtractingPdf(false);
    }
  }

  function removePdf() {
    setPdfFile(null);
    setPdfData(null);
    toast.info("Removed uploaded PDF");
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim() && !pdfData) {
      toast.error("Please enter a topic or upload a PDF document.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const result = await generatePdfSummary(topic.trim(), pdfData?.text);
      setSummary(result);
      toast.success("Generated AI Learning Summary!");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to generate AI summary. Please check your API settings.");
      toast.error("Generation failed. Retry or check settings.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen text-foreground selection:bg-primary/30 pb-28 md:pb-20">
      <EchoNavbar variant="dark" />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-8">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-xs">
                STAGE 2: LEARN
              </Badge>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Learning Materials</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
              AI PDF Study Summary Generator
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Generate structured, high-yield learning summaries from topics or uploaded PDFs designed for real conceptual understanding.
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="glass-card p-6 sm:p-8 space-y-6">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                What do you want to learn? <span className="text-destructive">*</span>
              </label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter a topic... e.g., Binary Search, Normalization (3NF), TCP Windowing"
                className="mt-1.5 bg-black/40 border-white/10 text-white min-h-[46px]"
              />
            </div>

            {/* Optional PDF Upload Section */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <FileText className="size-4 text-primary" /> Upload Study Material PDF (Optional)
              </label>

              {!pdfFile ? (
                <div className="relative rounded-2xl border-2 border-dashed border-white/20 bg-black/20 hover:bg-black/30 p-6 text-center space-y-3 transition-colors">
                  <Upload className="size-8 text-primary mx-auto" />
                  <div>
                    <p className="text-xs font-bold text-white">Click or drag PDF file to upload</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Supports PDF documents up to 12 MB</p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handlePdfUpload}
                    disabled={extractingPdf}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="size-6 text-primary shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-white">{pdfFile.name}</p>
                      <p className="text-[11px] text-slate-300">
                        {pdfData ? `${pdfData.pageCount} pages extracted` : "Reading PDF..."}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={removePdf}
                    className="text-slate-400 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              )}

              {extractingPdf && (
                <p className="text-xs text-primary flex items-center gap-2 pt-1 font-mono">
                  <Loader2 className="size-3.5 animate-spin" /> Extracting PDF content for AI summarization...
                </p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={loading || extractingPdf}
              className="w-full bg-primary hover:bg-primary/90 font-bold shadow-glow text-base min-h-[48px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-5 animate-spin" /> Generating AI Summary...
                </>
              ) : (
                <>
                  Generate AI Study Summary <Sparkles className="ml-2 size-5" />
                </>
              )}
            </Button>
          </form>

          {/* Error State */}
          {errorMsg && (
            <div className="rounded-2xl border border-destructive/50 bg-destructive/10 p-4 flex items-start gap-3 text-xs text-slate-200">
              <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-white">Summary Generation Error</p>
                <p>{errorMsg}</p>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="text-primary font-bold hover:underline pt-1 inline-block"
                >
                  Click here to retry generation
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Summary Display Card */}
        {summary && (
          <div className="glass-card p-6 sm:p-8 space-y-6 border-primary/40 shadow-glow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">AI Conceptual Summary</span>
                <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5">{summary.topic}</h2>
              </div>
              <Button size="sm" variant="outline" onClick={handleGenerate} className="w-fit text-xs border-white/20">
                <RotateCcw className="size-3.5 mr-1.5" /> Regenerate
              </Button>
            </div>

            {/* Overview */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Topic Overview</h3>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-black/30 p-4 rounded-xl border border-white/10">
                {summary.overview}
              </p>
            </div>

            {/* Key Concepts */}
            {summary.keyConcepts.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Key Concepts</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {summary.keyConcepts.map((kc, i) => (
                    <div key={i} className="rounded-xl bg-black/30 p-4 border border-white/10 space-y-1">
                      <p className="text-xs font-bold text-primary">{kc.name}</p>
                      <p className="text-[11px] text-slate-300 leading-relaxed">{kc.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Core Principles & Definitions */}
            {summary.definitions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Important Definitions</h3>
                <div className="space-y-2">
                  {summary.definitions.map((def, i) => (
                    <div key={i} className="text-xs rounded-xl bg-black/20 p-3.5 border border-white/10 flex flex-col sm:flex-row gap-1 sm:gap-2">
                      <span className="font-bold text-white font-mono shrink-0">{def.term}:</span>
                      <span className="text-slate-300">{def.definition}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Under-The-Hood Explanations */}
            {summary.explanations.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Structured Under-The-Hood Explanations</h3>
                <div className="space-y-3">
                  {summary.explanations.map((exp, i) => (
                    <div key={i} className="rounded-xl bg-primary/5 p-4 border border-primary/20 space-y-1.5">
                      <p className="text-xs font-bold text-sky-300">{exp.heading}</p>
                      <p className="text-xs text-slate-200 leading-relaxed">{exp.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Stage CTAs */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-400">Ready to test your understanding?</span>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <Button asChild size="sm" variant="outline" className="w-full sm:w-auto border-white/20 text-white min-h-[44px]">
                  <Link to="/reflection" search={{ concept: summary.topic }}>
                    Proceed to Reflect <ArrowRight className="size-4 ml-1.5" />
                  </Link>
                </Button>
                <Button asChild size="sm" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-bold min-h-[44px]">
                  <Link to="/assessment" search={{ concept: summary.topic }}>
                    Proceed to Verify Exam <Zap className="size-4 ml-1.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
