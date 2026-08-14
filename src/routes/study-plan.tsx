import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  FileText,
  Upload,
  Sparkles,
  Flame,
  Target,
  Trash2,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  Loader2,
  Zap,
  TrendingUp,
  Sliders,
  Code,
  Activity,
  Layers,
} from "lucide-react";
import { EchoNavbar } from "@/components/EchoNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useEcho } from "@/lib/echo/store";
import { extractTextFromPdf, type PdfExtractResult } from "@/lib/echo/pdf";
import { generatePdfSummary } from "@/lib/echo/llm";
import { toast } from "sonner";

export const Route = createFileRoute("/study-plan")({
  component: StudyPlanPage,
});

export function StudyPlanPage() {
  const navigate = useNavigate();
  const { reflections, deleteReflection } = useEcho();

  // Learn input state
  const [topicInput, setTopicInput] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfData, setPdfData] = useState<PdfExtractResult | null>(null);
  const [extractingPdf, setExtractingPdf] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Recommended items local state allowing removal
  const [recommendedItems, setRecommendedItems] = useState([
    { id: "rec-1", title: "Algorithms Basics", duration: "12 min read", icon: Code, concept: "Binary Search" },
    { id: "rec-2", title: "Time Complexity", duration: "8 min read", icon: Activity, concept: "Big-O Notation" },
    { id: "rec-3", title: "Recursion Explained", duration: "15 min read", icon: Layers, concept: "Recursion" },
  ]);

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtractingPdf(true);
    try {
      const res = await extractTextFromPdf(file);
      setPdfFile(file);
      setPdfData(res);
      if (!topicInput) setTopicInput(file.name.replace(/\.pdf$/i, ""));
      toast.success(`PDF loaded: ${file.name}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to process PDF.");
    } finally {
      setExtractingPdf(false);
    }
  }

  async function handleGenerateSummary(e: React.FormEvent) {
    e.preventDefault();
    if (!topicInput.trim() && !pdfData) {
      toast.error("Please enter a topic or upload a PDF document.");
      return;
    }
    setGenerating(true);
    try {
      await generatePdfSummary(topicInput.trim(), pdfData?.text);
      toast.success("AI Study Summary Generated!");
      navigate({ to: "/learn", search: { topic: topicInput.trim() || "Study Material" } });
    } catch {
      toast.error("Failed to generate summary.");
    } finally {
      setGenerating(false);
    }
  }

  function removeRecommended(id: string) {
    setRecommendedItems((prev) => prev.filter((item) => item.id !== id));
    toast.success("Removed recommendation");
  }

  return (
    <div className="min-h-screen bg-gradient-royal-ice-page selection:bg-primary/30 pb-28 md:pb-20">
      <EchoNavbar variant="light" />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-8">
        {/* Top 5 Stage Navigation Pills */}
        <div className="flex items-center justify-center">
          <div className="glass-card-light rounded-full p-1.5 flex items-center justify-center gap-1 sm:gap-2 shadow-sm border border-primary/20 max-w-md w-full">
            {[
              { label: "Plan", to: "/timetable" },
              { label: "Learn", to: "/study-plan", active: true },
              { label: "Reflect", to: "/reflection" },
              { label: "Verify", to: "/assessment" },
              { label: "Adapt", to: "/dashboard" },
            ].map((stage) => (
              <Link
                key={stage.label}
                to={stage.to}
                className={`flex-1 py-1.5 px-3 text-center rounded-full text-xs font-bold transition-all ${
                  stage.active
                    ? "bg-primary text-white shadow-glow"
                    : "text-slate-700 hover:text-primary hover:bg-primary/10"
                }`}
              >
                {stage.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Hero Title & Subtitle matching reference image */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Learn Smarter with ECHO
          </h1>
          <p className="text-sm sm:text-base text-slate-700 font-medium">
            Understand deeply. Not just remember.
          </p>
        </div>

        {/* 3 Column Grid Matching Reference Screenshot */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-12 items-start">
          {/* Card 1: AI PDF Summary (Left Column - 4 cols) */}
          <div className="lg:col-span-4 glass-card-light p-6 sm:p-7 rounded-3xl bg-white/95 border border-slate-200 shadow-md space-y-5">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <FileText className="size-4" /> AI PDF Summary
              </span>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Upload a PDF or enter a topic to get an AI-generated summary with key concepts, definitions, and more.
              </p>
            </div>

            <form onSubmit={handleGenerateSummary} className="space-y-4">
              {/* PDF Dropzone */}
              {!pdfFile ? (
                <div className="relative rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 p-5 text-center space-y-1.5 transition-colors">
                  <Upload className="size-5 text-primary mx-auto" />
                  <p className="text-xs font-bold text-slate-900">Upload your PDF</p>
                  <p className="text-[10px] text-slate-500 font-medium">Drag & drop or click to browse</p>
                  <p className="text-[9px] text-slate-400 font-mono">PDF (max 12MB)</p>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handlePdfUpload}
                    disabled={extractingPdf}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-primary/40 bg-primary/10 p-3 flex items-center justify-between text-xs text-slate-900">
                  <span className="font-bold truncate max-w-xs">{pdfFile.name}</span>
                  <button type="button" onClick={() => setPdfFile(null)} className="text-slate-500 hover:text-rose-600">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className="h-[1px] flex-1 bg-slate-200" />
                <span className="text-[10px] font-mono text-slate-400 uppercase">or</span>
                <div className="h-[1px] flex-1 bg-slate-200" />
              </div>

              {/* Topic Input */}
              <Input
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="Enter a topic to learn..."
                className="bg-slate-50 border-slate-300 text-xs text-slate-900 min-h-[44px]"
              />

              <Button
                type="submit"
                disabled={generating || extractingPdf}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl min-h-[44px] shadow-glow text-xs"
              >
                {generating ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Sparkles className="size-4 mr-1.5" />}
                Generate Summary
              </Button>
            </form>
          </div>

          {/* Card 2: Continue Learning / Active Study Plan (Center Column - 5 cols) */}
          <div className="lg:col-span-5 glass-card-light p-6 sm:p-7 rounded-3xl bg-white/95 border border-slate-200 shadow-md space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <BookOpen className="size-4" /> Continue Learning
              </span>
              <Badge variant="outline" className="border-primary/40 text-primary text-[10px] font-mono">
                {reflections.length} Active Items
              </Badge>
            </div>

            {/* List of Reflected Topics */}
            <div className="space-y-3">
              {reflections.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-8 text-center space-y-3">
                  <Sparkles className="size-7 text-primary mx-auto" />
                  <p className="text-xs font-bold text-slate-900">No active study plan topics yet</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed max-w-xs mx-auto">
                    Complete a 10-second post-class reflection on any topic to automatically add it to your Study Plan!
                  </p>
                  <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-white font-bold min-h-[38px] text-xs">
                    <Link to="/reflection">Reflect on a Topic →</Link>
                  </Button>
                </div>
              ) : (
                reflections.map((ref) => (
                  <div
                    key={ref.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white p-4 flex items-center justify-between gap-3 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 border border-primary/30 text-primary">
                        <FileText className="size-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900">{ref.conceptName}</h3>
                        <p className="text-[10px] text-slate-500 font-medium">Last reflected today</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full border border-primary/40 bg-primary/10 font-mono text-xs font-bold text-primary">
                        {ref.confidence}%
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          deleteReflection(ref.id);
                          toast.success(`Removed ${ref.conceptName} from study plan`);
                        }}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
                        title="Remove from study plan"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {reflections.length > 0 && (
              <Button asChild variant="outline" className="w-full border-slate-300 bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs min-h-[42px] rounded-2xl">
                <Link to="/reflection">View All Reflections →</Link>
              </Button>
            )}
          </div>

          {/* Card 3: Learning Streak & Today's Goal (Right Column - 3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Learning Streak Card */}
            <div className="glass-card-light p-6 rounded-3xl bg-white/95 border border-slate-200 shadow-md space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Flame className="size-4 text-warning" /> Learning Streak
              </span>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono">12</span>
                <span className="text-xs font-bold text-slate-500">days</span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium">Keep going! You're doing great.</p>

              {/* Bar Chart Visualization */}
              <div className="flex items-end justify-between gap-1 h-12 pt-2 border-t border-slate-100">
                {[40, 65, 30, 80, 55, 90, 70].map((h, i) => (
                  <div key={i} className="flex-1 bg-primary/20 rounded-sm h-full flex items-end">
                    <div className="w-full bg-primary rounded-sm" style={{ height: `${h}%` }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Goal Card */}
            <div className="glass-card-light p-6 rounded-3xl bg-white/95 border border-slate-200 shadow-md space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Target className="size-4 text-primary" /> Today's Goal
              </span>

              <p className="text-xs font-bold text-slate-900">Study for 45 minutes</p>

              <div className="space-y-1.5">
                <div className="flex justify-end font-mono text-[10px] text-slate-500 font-bold">
                  30 / 45 min
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "66%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Recommended for You matching reference image */}
        <div className="space-y-4 pt-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">Recommended for You</h2>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            {recommendedItems.map((rec) => {
              const IconComp = rec.icon;
              return (
                <div
                  key={rec.id}
                  className="glass-card-light p-5 rounded-2xl bg-white/95 border border-slate-200 shadow-sm flex items-center justify-between gap-3 hover:border-primary/40 transition-all group"
                >
                  <div className="space-y-1">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900">{rec.title}</h3>
                    <p className="text-[10px] text-slate-500 font-mono">{rec.duration}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button asChild size="sm" variant="outline" className="text-xs border-slate-300 bg-white hover:bg-slate-50 text-slate-900 p-2 h-9 w-9 rounded-xl">
                      <Link to="/repair" search={{ concept: rec.concept }}>
                        <IconComp className="size-4 text-primary" />
                      </Link>
                    </Button>
                    <button
                      type="button"
                      onClick={() => removeRecommended(rec.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove recommendation"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
