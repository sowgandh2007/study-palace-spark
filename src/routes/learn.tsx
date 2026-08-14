import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Upload,
  FileText,
  Sparkles,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Zap,
  Trash2,
  Lightbulb,
  FileCheck,
} from "lucide-react";
import { EchoNavbar } from "@/components/EchoNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { extractTextFromPdf, type PdfExtractResult } from "@/lib/echo/pdf";
import { generatePdfSummary, type LearningSummary } from "@/lib/echo/llm";
import { toast } from "sonner";

export const Route = createFileRoute("/learn")({
  validateSearch: (search: Record<string, unknown>) => ({
    topic: typeof search["topic"] === "string" ? (search["topic"] as string) : undefined,
  }),
  component: LearnPage,
});

function LearnPage() {
  const { topic: searchTopic } = Route.useSearch();
  const [topic, setTopic] = useState(searchTopic ?? "Binary Search");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfData, setPdfData] = useState<PdfExtractResult | null>(null);
  const [extractingPdf, setExtractingPdf] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [summary, setSummary] = useState<LearningSummary | null>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtractingPdf(true);
    try {
      const res = await extractTextFromPdf(file);
      setPdfFile(file);
      setPdfData(res);
      if (!topic.trim()) {
        setTopic(file.name.replace(/\.pdf$/i, ""));
      }
      toast.success(`Loaded PDF: ${file.name} (${res.pageCount} pages)`);
    } catch (err: any) {
      toast.error(err.message || "Failed to process PDF file.");
    } finally {
      setExtractingPdf(false);
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim() && !pdfData) {
      toast.error("Please enter a topic or upload a PDF document.");
      return;
    }

    setGeneratingSummary(true);
    try {
      const res = await generatePdfSummary(topic.trim(), pdfData?.text);
      setSummary(res);
      toast.success("AI Educational Summary Generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate summary.");
    } finally {
      setGeneratingSummary(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-royal-ice-page selection:bg-primary/30 pb-28 md:pb-20">
      <EchoNavbar variant="light" />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-8">
        {/* Header */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">STAGE 2: LEARN</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mt-1">
            AI PDF Study Summary Generator
          </h1>
          <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1">
            Generate structured, high-yield study summaries from topics or uploaded PDFs designed for deep conceptual understanding.
          </p>
        </div>

        {/* Input Form */}
        <div className="glass-card-light p-6 sm:p-8 space-y-6 rounded-2xl bg-white/95 border border-slate-200 shadow-md">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                What do you want to learn?
              </label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Binary Search, Database Normalization 3NF, TCP Flow Control"
                className="mt-1.5 bg-white border-slate-300 text-slate-900 min-h-[46px]"
              />
            </div>

            {/* PDF Upload Option */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileText className="size-4 text-primary" /> Upload PDF Document (Optional)
              </label>

              {!pdfFile ? (
                <div className="relative rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 p-6 text-center space-y-2 transition-colors">
                  <Upload className="size-6 text-primary mx-auto" />
                  <p className="text-xs font-bold text-slate-900">Click or drag PDF file to extract study material</p>
                  <p className="text-[11px] text-slate-600 font-medium">Supports PDF files up to 12 MB</p>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileUpload}
                    disabled={extractingPdf}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-primary/40 bg-primary/10 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileCheck className="size-5 text-primary shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 truncate max-w-xs">{pdfFile.name}</p>
                      <p className="text-[10px] text-slate-600 font-mono">{pdfData?.pageCount || 1} pages extracted</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPdfFile(null);
                      setPdfData(null);
                    }}
                    className="text-xs text-slate-500 hover:text-rose-600 transition-colors p-1"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={generatingSummary || extractingPdf}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold shadow-glow text-base min-h-[48px]"
            >
              {generatingSummary ? (
                <>
                  <Loader2 className="mr-2 size-5 animate-spin" /> Generating AI Summary...
                </>
              ) : (
                <>
                  Generate AI Study Summary <Sparkles className="ml-2 size-5 text-sky-200" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Structured Summary Result */}
        {summary && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="glass-card-light p-6 sm:p-8 space-y-6 rounded-2xl bg-white/95 border border-slate-200 shadow-md">
              <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold uppercase text-primary">Structured Study Summary</span>
                  <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">{summary.topic}</h2>
                </div>
                <Badge variant="outline" className="border-primary/40 text-primary font-mono text-xs">
                  AI Generated
                </Badge>
              </div>

              {/* Overview */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Lightbulb className="size-4" /> Overview
                </h3>
                <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {summary.overview}
                </p>
              </div>

              {/* Key Concepts */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Key Concepts</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {summary.keyConcepts.map((kc, i) => (
                    <div key={i} className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-1">
                      <p className="font-bold text-xs text-slate-900">{kc.concept}</p>
                      <p className="text-[11px] text-slate-700 font-medium leading-relaxed">{kc.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Formulas & Facts */}
              {summary.formulasAndFacts && summary.formulasAndFacts.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Core Formulas & Facts</h3>
                  <div className="space-y-1.5">
                    {summary.formulasAndFacts.map((ff, i) => (
                      <div key={i} className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs font-mono text-slate-800">
                        • {ff}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Takeaways */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Key Takeaways</h3>
                <div className="space-y-1.5">
                  {summary.keyTakeaways.map((kt, i) => (
                    <p key={i} className="text-xs text-slate-700 font-medium flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-primary shrink-0" /> {kt}
                    </p>
                  ))}
                </div>
              </div>

              {/* CTAs to Reflect and Verify */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <Button asChild variant="outline" className="w-full sm:w-auto border-slate-300 bg-white hover:bg-slate-50 text-slate-900 min-h-[44px]">
                  <Link to="/reflection" search={{ concept: summary.topic }}>
                    Reflect in your own words →
                  </Link>
                </Button>
                <Button asChild className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-bold min-h-[44px] shadow-glow">
                  <Link to="/assessment" search={{ concept: summary.topic }}>
                    Verify with AI Exam <Zap className="size-4 ml-1.5 text-amber-300" />
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
