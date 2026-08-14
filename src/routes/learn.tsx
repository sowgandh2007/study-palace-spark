import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
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
  Zap,
  ArrowRight,
} from "lucide-react";
import { EchoNavbar } from "@/components/EchoNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { extractTextFromPdf, type PdfExtractResult } from "@/lib/echo/pdf";
import { generateComprehensivePdfSummaryHTML, downloadHtmlAsPdf, type ComprehensivePdfSummaryResult } from "@/lib/echo/pdfSummary";
import { toast } from "sonner";

export const Route = createFileRoute("/learn")({
  validateSearch: (search: Record<string, unknown>) => ({
    topic: typeof search["topic"] === "string" ? (search["topic"] as string) : undefined,
  }),
  component: LearnPage,
});

type LoadingStage = "idle" | "reading" | "extracting" | "analyzing" | "building" | "preparing";

function LearnPage() {
  const { topic: searchTopic } = Route.useSearch();
  const [topic, setTopic] = useState(searchTopic ?? "");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfData, setPdfData] = useState<PdfExtractResult | null>(null);
  
  const [loadingStage, setLoadingStage] = useState<LoadingStage>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [summaryResult, setSummaryResult] = useState<ComprehensivePdfSummaryResult | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setLoadingStage("reading");
    try {
      setLoadingStage("extracting");
      const res = await extractTextFromPdf(file);
      setPdfFile(file);
      setPdfData(res);
      if (!topic.trim()) {
        setTopic(file.name.replace(/\.pdf$/i, ""));
      }
      toast.success(`Extracted ${res.pageCount} pages (${res.text.length.toLocaleString()} characters) from ${file.name}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to extract text from the PDF file.");
      toast.error("PDF Processing Error");
    } finally {
      setLoadingStage("idle");
    }
  }

  async function handleGenerate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!topic.trim() && !pdfData) {
      toast.error("Please select a PDF document or enter a topic.");
      return;
    }

    setErrorMsg(null);
    setSummaryResult(null);

    try {
      let extractedText = pdfData?.text || "";

      if (!extractedText && pdfFile) {
        setLoadingStage("reading");
        const res = await extractTextFromPdf(pdfFile);
        extractedText = res.text;
        setPdfData(res);
      }

      if (extractedText) {
        setLoadingStage("analyzing");
        await new Promise((r) => setTimeout(r, 400));
        setLoadingStage("building");
        const result = await generateComprehensivePdfSummaryHTML(topic || pdfFile?.name || "Study Material", extractedText, pdfData?.pageCount);
        setLoadingStage("preparing");
        await new Promise((r) => setTimeout(r, 300));
        setSummaryResult(result);
        toast.success("Comprehensive AI Study Document Generated!");
      } else {
        throw new Error("No PDF content provided. Please upload a PDF document.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred while generating the summary.");
      toast.error("Generation Failed");
    } finally {
      setLoadingStage("idle");
    }
  }

  async function handleDownloadPdf() {
    if (!summaryResult) return;
    setDownloadingPdf(true);
    try {
      const sanitizedTitle = (summaryResult.title || "echo_study_summary").replace(/[^a-[#0047ff]z0-9_-]/gi, "_");
      await downloadHtmlAsPdf("echo-study-doc-container", sanitizedTitle);
      toast.success("Downloaded PDF Document!");
    } catch (err: any) {
      toast.error("PDF Download failed. Printing document...");
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  }

  function renderLoadingText() {
    switch (loadingStage) {
      case "reading":
        return "Reading PDF document...";
      case "extracting":
        return "Extracting text across all pages...";
      case "analyzing":
        return "Analyzing document content with Gemini AI...";
      case "building":
        return "Building comprehensive study document...";
      case "preparing":
        return "Preparing your study document...";
      default:
        return "Processing...";
    }
  }

  return (
    <div className="min-h-screen bg-gradient-royal-ice-page selection:bg-primary/30 pb-28 md:pb-20">
      <EchoNavbar variant="light" />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-8">
        {/* Page Header */}
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
            ECHO Learning Intelligence
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mt-1">
            AI PDF Study Summary Generator
          </h1>
          <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1">
            Upload your lecture slides or textbook PDF to generate an accurate, comprehensive, source-grounded HTML study document.
          </p>
        </div>

        {/* Upload & Form Container */}
        <div className="glass-card-light p-6 sm:p-8 space-y-6 rounded-2xl bg-white/95 border border-slate-200 shadow-md">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Document Topic / Subject Name (Optional)
              </label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Binary Search Trees, Operating Systems Scheduling, Data Communication"
                className="mt-1.5 bg-white border-slate-300 text-slate-900 min-h-[46px]"
              />
            </div>

            {/* PDF Upload Filepicker */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileText className="size-4 text-primary" /> Upload PDF Document <span className="text-destructive">*</span>
              </label>

              {!pdfFile ? (
                <div className="relative rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 p-6 text-center space-y-2 transition-colors">
                  <Upload className="size-7 text-primary mx-auto" />
                  <p className="text-xs font-bold text-slate-900">Click or drag PDF file to extract study material</p>
                  <p className="text-[11px] text-slate-600 font-medium">Supports PDF documents up to 20 MB</p>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileUpload}
                    disabled={loadingStage !== "idle"}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-primary/40 bg-primary/10 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileCheck className="size-6 text-primary shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 truncate max-w-xs">{pdfFile.name}</p>
                      <p className="text-[10px] text-slate-600 font-mono">
                        {pdfData?.pageCount ? `${pdfData.pageCount} pages extracted` : "File loaded"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPdfFile(null);
                      setPdfData(null);
                      setSummaryResult(null);
                      setErrorMsg(null);
                    }}
                    className="text-xs text-slate-500 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-slate-200"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={loadingStage !== "idle" || (!pdfFile && !topic)}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold shadow-glow text-base min-h-[48px]"
            >
              {loadingStage !== "idle" ? (
                <>
                  <Loader2 className="mr-2 size-5 animate-spin" /> {renderLoadingText()}
                </>
              ) : (
                <>
                  Generate Comprehensive AI Summary <Sparkles className="ml-2 size-5 text-sky-200" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Error Alert Display with Retry Button */}
        {errorMsg && (
          <div className="rounded-2xl border border-rose-300 bg-rose-50 p-6 space-y-4 shadow-sm animate-in fade-in duration-200">
            <div className="flex items-start gap-3 text-rose-900">
              <AlertCircle className="size-6 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-bold text-sm">PDF Processing Error</h3>
                <p className="text-xs text-rose-700 font-medium leading-relaxed">{errorMsg}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => handleGenerate()}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs min-h-[38px] px-4"
              >
                <RotateCcw className="size-3.5 mr-1.5" /> Retry Generation
              </Button>
            </div>
          </div>
        )}

        {/* Generated Comprehensive HTML Study Document Container */}
        {summaryResult && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header Actions */}
            <div className="glass-card-light p-4 rounded-2xl bg-white/95 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-primary/40 text-primary font-mono text-xs">
                  Source-Grounded Document
                </Badge>
                {summaryResult.wordCount && (
                  <span className="text-xs font-mono text-slate-500">
                    ~{summaryResult.wordCount} words generated
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-bold text-xs min-h-[42px] px-5 shadow-glow"
                >
                  {downloadingPdf ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-1.5" /> Exporting PDF...
                    </>
                  ) : (
                    <>
                      <Download className="size-4 mr-1.5" /> Download PDF
                    </>
                  )}
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="w-full sm:w-auto border-slate-300 text-slate-900 font-bold text-xs min-h-[42px] px-4"
                >
                  <Link to="/reflection" search={{ concept: summaryResult.title }}>
                    Reflect on Document <ArrowRight className="size-3.5 ml-1.5" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Comprehensive Document Display */}
            <div
              id="echo-study-doc-container"
              className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-12 shadow-lg space-y-6 text-slate-900 prose max-w-none font-sans"
              style={{ minHeight: "500px" }}
            >
              <div
                dangerouslySetInnerHTML={{ __html: summaryResult.htmlContent }}
                className="echo-study-html-body"
              />
            </div>
          </div>
        )}
      </main>

      {/* Embedded CSS for HTML Study Document Styling */}
      <style>{`
        .echo-study-html-body {
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #0f172a;
          line-height: 1.65;
        }
        .echo-study-html-body h1 {
          font-size: 1.875rem;
          font-weight: 800;
          color: #020721;
          margin-bottom: 0.5rem;
          border-bottom: 2px solid #0052ff;
          padding-bottom: 0.5rem;
        }
        .echo-study-html-body h2 {
          font-size: 1.35rem;
          font-weight: 700;
          color: #0052ff;
          margin-top: 1.75rem;
          margin-bottom: 0.75rem;
        }
        .echo-study-html-body h3 {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1e293b;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }
        .echo-study-html-body p {
          margin-bottom: 1rem;
          font-size: 0.95rem;
          color: #334155;
        }
        .echo-study-html-body ul, .echo-study-html-body ol {
          margin-bottom: 1.25rem;
          padding-left: 1.5rem;
        }
        .echo-study-html-body li {
          margin-bottom: 0.4rem;
          font-size: 0.925rem;
          color: #334155;
        }
        .echo-study-html-body pre {
          background-color: #0f172a;
          color: #38bdf8;
          padding: 1rem;
          border-radius: 0.75rem;
          overflow-x: auto;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.85rem;
          margin-bottom: 1.25rem;
        }
        .echo-study-html-body table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
        }
        .echo-study-html-body th, .echo-study-html-body td {
          border: 1px solid #cbd5e1;
          padding: 0.6rem 0.8rem;
          text-align: left;
        }
        .echo-study-html-body th {
          background-color: #f1f5f9;
          font-weight: 700;
          color: #020721;
        }
        .echo-study-html-body .doc-callout {
          background-color: #eff6ff;
          border-left: 4px solid #0052ff;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1.25rem;
          font-size: 0.9rem;
          color: #1e3a8a;
        }
        .echo-study-html-body .doc-header {
          margin-bottom: 2rem;
        }
        .echo-study-html-body .doc-meta {
          font-size: 0.8rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  );
}
