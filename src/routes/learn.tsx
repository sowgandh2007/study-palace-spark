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
  HelpCircle,
  Zap,
  Trash2,
  AlertCircle,
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
    <div className="min-h-screen bg-[#030919] text-foreground selection:bg-primary/30 pb-28 md:pb-20">
      <EchoNavbar variant="dark" />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 pt-8 sm:pt-12 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-blue-400/40 bg-blue-500/10 text-blue-400 font-mono text-xs">
                STAGE 2: LEARN
              </Badge>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Underlying Concept Mechanics</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-1">
              AI PDF Study Summary Generator
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Generate structured, high-yield study summaries from topics or uploaded PDFs designed for deep conceptual understanding.
            </p>
          </div>
        </div>

        {/* Input Form */}
        <div className="rounded-3xl border border-blue-500/25 bg-gradient-to-br from-[#050e26] via-[#08173d] to-[#0b1d4c] p-6 sm:p-8 space-y-6 shadow-2xl">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                What do you want to learn?
              </label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Binary Search, Database Normalization 3NF, TCP Flow Control"
                className="mt-1.5 bg-black/40 border-white/10 text-white min-h-[46px]"
              />
            </div>

            {/* PDF Upload Option */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <FileText className="size-4 text-blue-400" /> Upload PDF Document (Optional)
              </label>

              {!pdfFile ? (
                <div className="relative rounded-2xl border-2 border-dashed border-white/20 bg-black/20 hover:bg-black/30 p-6 text-center space-y-2 transition-colors">
                  <Upload className="size-6 text-blue-400 mx-auto" />
                  <p className="text-xs font-bold text-white">Click or drag PDF file to extract study material</p>
                  <p className="text-[11px] text-slate-400">Supports PDF files up to 12 MB</p>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileUpload}
                    disabled={extractingPdf}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-blue-500/40 bg-blue-500/10 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileCheck className="size-5 text-blue-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-white truncate max-w-xs">{pdfFile.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{pdfData?.pageCount || 1} pages extracted</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPdfFile(null);
                      setPdfData(null);
                    }}
                    className="text-xs text-slate-400 hover:text-rose-400 transition-colors p-1"
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
              className="w-full bg-blue-500 hover:bg-blue-600 font-bold shadow-glow text-base min-h-[48px]"
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
            <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-br from-[#050e26] via-[#08173d] to-[#0b1d4c] p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="border-b border-blue-500/20 pb-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold uppercase text-blue-400">Structured Study Summary</span>
                  <h2 className="text-2xl font-extrabold text-white mt-0.5">{summary.topic}</h2>
                </div>
                <Badge variant="outline" className="border-blue-400/40 text-blue-300 font-mono text-xs">
                  AI Generated
                </Badge>
              </div>

              {/* Overview */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Lightbulb className="size-4" /> Overview
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-black/30 p-4 rounded-xl border border-white/10">
                  {summary.overview}
                </p>
              </div>

              {/* Key Concepts */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Key Concepts</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {summary.keyConcepts.map((kc, i) => (
                    <div key={i} className="rounded-xl bg-black/30 p-4 border border-white/10 space-y-1">
                      <p className="font-bold text-xs text-white">{kc.concept}</p>
                      <p className="text-[11px] text-slate-300 leading-relaxed">{kc.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Formulas & Facts */}
              {summary.formulasAndFacts && summary.formulasAndFacts.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Core Formulas & Facts</h3>
                  <div className="space-y-1.5">
                    {summary.formulasAndFacts.map((ff, i) => (
                      <div key={i} className="rounded-xl bg-black/30 p-3 border border-white/10 text-xs font-mono text-slate-200">
                        • {ff}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Takeaways */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Key Takeaways</h3>
                <div className="space-y-1.5">
                  {summary.keyTakeaways.map((kt, i) => (
                    <p key={i} className="text-xs text-slate-300 flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-blue-400 shrink-0" /> {kt}
                    </p>
                  ))}
                </div>
              </div>

              {/* CTAs to Reflect and Verify */}
              <div className="pt-4 border-t border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <Button asChild variant="outline" className="w-full sm:w-auto border-white/20 text-white min-h-[44px]">
                  <Link to="/reflection" search={{ concept: summary.topic }}>
                    Reflect in your own words →
                  </Link>
                </Button>
                <Button asChild className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 font-bold min-h-[44px] shadow-glow">
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
