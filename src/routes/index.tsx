import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BrainCircuit,
  Calendar,
  CheckCircle2,
  Compass,
  FileCheck2,
  HelpCircle,
  Layers,
  RotateCcw,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
  BookOpen,
  TrendingUp,
  FileText,
  Upload,
  Loader2,
  AlertCircle,
  BadgeAlert,
  Clock,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ThemeSelect } from "@/lib/theme";
import { FRAMEWORK_DIMENSIONS } from "@/lib/echo/types";
import { BANDS } from "@/lib/echo/scoring";
import { FoldText } from "@/components/ui/FoldText";
import { EchoNavbar, EchoLogo } from "@/components/EchoNavbar";
import { Prism } from "@/components/ui/Prism";
import { ScrollStack, type ScrollStackItem } from "@/components/ui/ScrollStack";
import { extractTextFromPdf, type PdfExtractResult } from "@/lib/echo/pdf";
import {
  generatePdfSummary,
  analyzeExplanationWithAI,
  type LearningSummary,
  type ExplanationAnalysis,
} from "@/lib/echo/llm";
import { STABILITY_TREND, PRIORITY_REPAIRS } from "@/lib/echo/data";
import { useEcho } from "@/lib/echo/store";
import { toast } from "sonner";

export { EchoLogo };

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  const { timetable } = useEcho();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    function checkViewport() {
      setIsDesktop(window.innerWidth >= 768);
    }
    checkViewport();
    window.addEventListener("resize", checkViewport, { passive: true });
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  // Inline State for Learn Stage Card (AI PDF Summary Generator)
  const [learnTopic, setLearnTopic] = useState("Binary Search");
  const [learnPdfFile, setLearnPdfFile] = useState<File | null>(null);
  const [learnPdfData, setLearnPdfData] = useState<PdfExtractResult | null>(null);
  const [learnExtracting, setLearnExtracting] = useState(false);
  const [learnLoading, setLearnLoading] = useState(false);
  const [learnSummary, setLearnSummary] = useState<LearningSummary | null>(null);

  async function handleLearnPdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLearnExtracting(true);
    try {
      const res = await extractTextFromPdf(file);
      setLearnPdfFile(file);
      setLearnPdfData(res);
      setLearnTopic(file.name.replace(/\.pdf$/i, ""));
      toast.success(`PDF extracted: ${file.name}`);
    } catch (err: any) {
      toast.error(err.message || "PDF read error");
    } finally {
      setLearnExtracting(false);
    }
  }

  async function handleGenerateLearnSummary(e: React.FormEvent) {
    e.preventDefault();
    if (!learnTopic.trim() && !learnPdfData) return;
    setLearnLoading(true);
    try {
      const res = await generatePdfSummary(learnTopic.trim(), learnPdfData?.text);
      setLearnSummary(res);
      toast.success("Generated AI Summary!");
    } catch {
      toast.error("Summary generation failed.");
    } finally {
      setLearnLoading(false);
    }
  }

  // Inline State for Reflect Stage Card (Free-form explanation)
  const [reflectConcept, setReflectConcept] = useState("Binary Search");
  const [reflectConfidence, setReflectConfidence] = useState(75);
  const [reflectExplanation, setReflectExplanation] = useState(
    "Binary Search repeatedly divides a sorted array in half by comparing the search target with the mid element."
  );
  const [reflectLoading, setReflectLoading] = useState(false);
  const [reflectAnalysis, setReflectAnalysis] = useState<ExplanationAnalysis | null>(null);

  async function handleAnalyzeReflect(e: React.FormEvent) {
    e.preventDefault();
    if (!reflectConcept.trim() || !reflectExplanation.trim()) return;
    setReflectLoading(true);
    try {
      const res = await analyzeExplanationWithAI(reflectConcept.trim(), reflectExplanation.trim(), reflectConfidence);
      setReflectAnalysis(res);
      toast.success("AI Analysis Complete!");
    } catch {
      toast.error("Analysis failed.");
    } finally {
      setReflectLoading(false);
    }
  }

  // Inline State for Verify Stage Card (AI Exam Generator)
  const [verifyTopic, setVerifyTopic] = useState("Binary Search");

  function handleStartVerifyExam(e: React.FormEvent) {
    e.preventDefault();
    navigate({
      to: "/assessment",
      search: { concept: verifyTopic.trim() || "Binary Search" },
    });
  }

  // Exact 5 Stage Items conforming to Figma screenshot design & copy
  const stackItems: ScrollStackItem[] = [
    {
      id: "plan",
      stageNumber: "01",
      stageTitle: "Plan",
      icon: Calendar,
      description:
        "ECHO reads your timetable and notes to build a focused plan around tomorrow's scheduled concepts — so study time is spent where evidence says it matters.",
      content: (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-black/40 border border-blue-500/20 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Tonight's Allocated Repairs</span>
                <Badge variant="outline" className="border-primary/40 text-primary text-[10px]">2 Pending</Badge>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Binary Search (15m repair) & Database Normalization 3NF (10m repair).
              </p>
              <Button asChild size="sm" className="bg-primary hover:bg-primary/90 font-bold min-h-[38px]">
                <Link to="/study-plan">View Full Study Plan →</Link>
              </Button>
            </div>

            <div className="rounded-2xl bg-black/40 border border-blue-500/20 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Tomorrow's Timetable Context</span>
                <Badge variant="outline" className="border-sky-400/40 text-sky-300 text-[10px]">9:00 AM Class</Badge>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Binary Search is scheduled in tomorrow's lecture. Complete repair tonight!
              </p>
              <Button asChild size="sm" variant="outline" className="border-white/20 text-white min-h-[38px]">
                <Link to="/timetable">View Timetable Schedule →</Link>
              </Button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "learn",
      stageNumber: "02",
      stageTitle: "Learn",
      icon: BookOpen,
      description:
        "You attend class and engage with the underlying concept. ECHO tracks the concept itself — the mechanism and its constraints — not a memorised answer.",
      content: (
        <div className="space-y-6">
          <form onSubmit={handleGenerateLearnSummary} className="space-y-4 rounded-2xl bg-black/40 border border-blue-500/20 p-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                What do you want to learn?
              </label>
              <Input
                value={learnTopic}
                onChange={(e) => setLearnTopic(e.target.value)}
                placeholder="Enter topic..."
                className="mt-1 bg-black/50 border-white/10 text-xs text-white min-h-[42px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <FileText className="size-3.5 text-primary" /> Upload PDF Material (Optional)
              </label>
              {!learnPdfFile ? (
                <div className="relative rounded-xl border border-dashed border-white/20 bg-black/20 p-4 text-center space-y-1">
                  <Upload className="size-5 text-primary mx-auto" />
                  <p className="text-[11px] text-slate-300 font-bold">Click to select PDF document</p>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleLearnPdfUpload}
                    disabled={learnExtracting}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
              ) : (
                <div className="rounded-xl bg-primary/10 border border-primary/30 p-3 flex items-center justify-between text-xs text-white">
                  <span className="font-bold truncate max-w-xs">{learnPdfFile.name}</span>
                  <button type="button" onClick={() => setLearnPdfFile(null)} className="text-slate-400 hover:text-destructive">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              )}
            </div>

            <Button type="submit" disabled={learnLoading} size="sm" className="w-full bg-primary hover:bg-primary/90 font-bold min-h-[42px]">
              {learnLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Sparkles className="size-4 mr-2" />}
              Generate AI PDF Study Summary
            </Button>
          </form>

          {learnSummary && (
            <div className="rounded-2xl bg-black/40 border border-primary/40 p-5 space-y-3 text-xs">
              <h4 className="font-bold text-white text-sm">{learnSummary.topic} Summary</h4>
              <p className="text-slate-300 leading-relaxed">{learnSummary.overview}</p>
              <div className="pt-2 flex justify-end">
                <Button asChild size="sm" variant="outline" className="border-white/20 text-white min-h-[38px]">
                  <Link to="/learn" search={{ topic: learnSummary.topic }}>Open Full Learn Page →</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "reflect",
      stageNumber: "03",
      stageTitle: "Reflect",
      icon: Sparkles,
      description:
        "You self-report confidence and write what you understand in your own words. ECHO compares what you feel against demonstrated evidence.",
      content: (
        <div className="space-y-6">
          <form onSubmit={handleAnalyzeReflect} className="space-y-4 rounded-2xl bg-black/40 border border-blue-500/20 p-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Topic / Concept</label>
              <Input
                value={reflectConcept}
                onChange={(e) => setReflectConcept(e.target.value)}
                className="mt-1 bg-black/50 border-white/10 text-xs text-white min-h-[42px]"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Explain the concept in your own words</label>
              <Textarea
                rows={4}
                value={reflectExplanation}
                onChange={(e) => setReflectExplanation(e.target.value)}
                placeholder="Write your explanation here..."
                className="mt-1.5 bg-black/50 border-white/10 text-xs text-white p-3 leading-relaxed"
              />
            </div>

            <Button type="submit" disabled={reflectLoading} size="sm" className="w-full bg-primary hover:bg-primary/90 font-bold min-h-[42px]">
              {reflectLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Sparkles className="size-4 mr-2" />}
              Analyze My Understanding
            </Button>
          </form>

          {reflectAnalysis && (
            <div className="rounded-2xl bg-black/40 border border-indigo-500/40 p-5 space-y-3 text-xs">
              <span className="font-bold text-indigo-400 uppercase tracking-wider">AI Evaluation Verdict</span>
              <p className="text-slate-200 leading-relaxed">{reflectAnalysis.overallVerdict}</p>
              <div className="pt-2 flex justify-end">
                <Button asChild size="sm" className="bg-primary hover:bg-primary/90 font-bold min-h-[38px]">
                  <Link to="/reflection" search={{ concept: reflectAnalysis.concept }}>Open Full Reflect View →</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "verify",
      stageNumber: "04",
      stageTitle: "Verify",
      icon: Zap,
      description:
        "ECHO tests your understanding across direct, explain, and transfer dimensions through targeted AI exams and diagnostic probes.",
      content: (
        <div className="space-y-6">
          <form onSubmit={handleStartVerifyExam} className="space-y-4 rounded-2xl bg-black/40 border border-blue-500/20 p-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Exam Topic</label>
              <Input
                value={verifyTopic}
                onChange={(e) => setVerifyTopic(e.target.value)}
                className="mt-1 bg-black/50 border-white/10 text-xs text-white min-h-[42px]"
              />
            </div>

            <Button type="submit" size="sm" className="w-full bg-primary hover:bg-primary/90 font-bold min-h-[42px]">
              <Zap className="size-4 mr-2 text-warning" /> Launch AI Verification Exam
            </Button>
          </form>
        </div>
      ),
    },
    {
      id: "adapt",
      stageNumber: "05",
      stageTitle: "Adapt",
      icon: TrendingUp,
      description:
        "ECHO uses your stability trajectory to prioritize evening repair slots and recommend your next best learning action.",
      content: (
        <div className="space-y-5">
          <div className="rounded-2xl bg-black/40 border border-blue-500/20 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">7-Day Score Trajectory</span>
              <span className="font-mono text-xs text-emerald-400 font-bold">+27% Score Increase</span>
            </div>
            <div className="flex items-end justify-between gap-2 h-32 pt-2">
              {STABILITY_TREND.map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="w-full flex items-end h-24">
                    <div
                      className="w-full rounded-lg bg-gradient-to-t from-primary/70 via-sky-500 to-primary"
                      style={{ height: `${d.stability}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">{d.day}</span>
                </div>
              ))}
            </div>
            <Button asChild size="sm" className="w-full bg-primary hover:bg-primary/90 font-bold min-h-[38px]">
              <Link to="/dashboard">Open Full Dashboard →</Link>
            </Button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen text-foreground selection:bg-primary/30 pb-28 md:pb-20">
      {/* 5 Stage Sticky Navbar */}
      <EchoNavbar variant="dark" />

      {/* Hero Section */}
      <section className="hero-gradient-bg relative overflow-hidden px-4 sm:px-6 pt-16 sm:pt-20 pb-16 sm:pb-20 text-center border-b border-white/10">
        {isDesktop && (
          <div className="absolute inset-0 pointer-events-none z-0 opacity-40">
            <Prism
              animationType="rotate"
              timeScale={0.5}
              height={3.5}
              baseWidth={5.5}
              scale={3.6}
              hueShift={0}
              colorFrequency={1}
              noise={0.5}
              glow={1}
              suspendWhenOffscreen={true}
            />
          </div>
        )}

        <div className="relative z-10 mx-auto max-w-5xl space-y-6">
          <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold tracking-wide shadow-glow">
            <Sparkles className="mr-2 size-3.5" /> Continuous Learning Intelligence System
          </Badge>

          {/* FoldText Headline */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <FoldText
              text="The Answer Is Correct."
              splitBy="word"
              hinge="top"
              trigger="mount"
              duration={0.65}
              stagger={0.05}
              ease="power3.out"
              perspective={700}
              creaseShading={0.55}
              fontSize="clamp(1.8rem, 4.8vw, 3.8rem)"
              fontWeight={800}
              color="#ffffff"
            />
            <FoldText
              text="But Is the Understanding Real?"
              splitBy="word"
              hinge="top"
              trigger="mount"
              duration={0.75}
              stagger={0.04}
              ease="power3.out"
              perspective={700}
              creaseShading={0.55}
              fontSize="clamp(1.6rem, 4.2vw, 3.4rem)"
              fontWeight={800}
              color="#60a5fa"
            />
          </div>

          <p className="mx-auto max-w-2xl text-xs sm:text-base leading-relaxed text-slate-300">
            ECHO compares a student's perceived understanding with demonstrated evidence, detects conceptual fragility, and uses academic context to recommend the next best learning action.
          </p>

          {/* Core Distinction Callout */}
          <div className="mx-auto max-w-3xl rounded-2xl border border-primary/40 bg-primary/10 p-4 sm:p-5 text-center space-y-1.5 backdrop-blur-md">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-primary font-mono">Core Product Difference</span>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-200 font-medium">
              "Chat-based AI answers questions when asked. ECHO continuously tracks the relationship between perceived understanding, demonstrated evidence, and academic context to decide what should happen next."
            </p>
          </div>
        </div>
      </section>

      {/* REACT BITS SCROLL STACK CARD DECK (EXACT FIGMA DESIGN MATCH) */}
      <section className="py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary font-mono">Interactive Stage Deck</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">The ECHO Scroll Stack</h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
              Scroll down to stack stage cards. Click OPEN MENU on any card to reveal its inline tools and features!
            </p>
          </div>

          {/* ScrollStack Component rendering 5 Stage Cards */}
          <ScrollStack items={stackItems} defaultExpandedId="plan" />
        </div>
      </section>

      {/* 6-Dimension Framework Section */}
      <section className="border-t border-white/10 py-16 sm:py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-10 sm:space-y-12">
          <div className="text-center space-y-2 sm:space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-primary font-mono">Demonstrated Evidence</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">The Six-Dimension Framework</h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
              ECHO probes understanding across 6 rigorous dimensions to test whether student reasoning survives structural variation.
            </p>
          </div>

          <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {FRAMEWORK_DIMENSIONS.map((dim, idx) => (
              <div
                key={dim.id}
                className="reveal-card glass-card p-6 space-y-3"
                style={{ transitionDelay: `${idx * 60}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">{dim.label}</span>
                  {(dim.id === "direct" || dim.id === "explain" || dim.id === "transfer") && (
                    <Badge variant="outline" className="text-[10px] border-primary/40 bg-primary/10 text-primary">
                      Active Probe
                    </Badge>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-slate-300 pt-1">{dim.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
