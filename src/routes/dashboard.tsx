import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  Search,
  Sparkles,
  BookOpen,
  BrainCircuit,
  Zap,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Target,
  HelpCircle,
  Wrench,
  Calendar,
} from "lucide-react";
import { EchoNavbar } from "@/components/EchoNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useEcho } from "@/lib/echo/store";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const { latestResult, activeLearnMaterial, reflections } = useEcho();
  const [query, setQuery] = useState("");

  const latestReflection = reflections[0];
  const activeTopic =
    (query.trim() ||
    latestResult?.conceptName ||
    activeLearnMaterial?.topic ||
    latestReflection?.conceptName ||
    "Binary Search").trim();

  const confidenceScore =
    typeof latestResult?.confidenceInput === "number" && !isNaN(latestResult.confidenceInput)
      ? latestResult.confidenceInput
      : typeof latestResult?.confidenceScore === "number" && !isNaN(latestResult.confidenceScore)
      ? latestResult.confidenceScore
      : typeof latestReflection?.confidence === "number" && !isNaN(latestReflection.confidence)
      ? latestReflection.confidence
      : 75;

  const rawStab = latestResult?.stabilityScore;
  const stabilityScore =
    typeof rawStab === "number" && !isNaN(rawStab)
      ? rawStab
      : 50;

  const confidenceGap = Math.max(0, confidenceScore - stabilityScore);
  const weakSubconcept = latestResult?.weakSubconcept || `${activeTopic} Baseline Invariants`;

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const topic = (query.trim() || activeTopic).trim();
    navigate({ to: "/learn", search: { topic } });
  }

  function handleLearnClick() {
    const topic = (query.trim() || activeTopic).trim();
    navigate({ to: "/learn", search: { topic } });
  }

  function handleReflectClick() {
    const concept = (query.trim() || activeTopic).trim();
    navigate({ to: "/reflection", search: { concept } });
  }

  return (
    <div className="min-h-screen bg-gradient-royal-ice-page selection:bg-primary/30 flex flex-col justify-between pb-28 md:pb-20">
      <EchoNavbar variant="light" />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 pt-6 sm:pt-10 pb-12 space-y-8">
        {/* Header & Central Value Proposition */}
        <div className="text-center space-y-3 animate-in fade-in duration-300">
          <span className="text-xs font-mono font-bold tracking-widest text-primary uppercase bg-white/80 border border-primary/20 px-3 py-1 rounded-full shadow-sm inline-flex items-center gap-1.5">
            <BrainCircuit className="size-3.5 text-primary" /> Confidence vs Evidence Engine
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Perceived Understanding vs Demonstrated Evidence
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto font-medium">
            ECHO detects where self-reported confidence diverges from proven reasoning to prevent fragile learning before exams.
          </p>
        </div>

        {/* Central Search & Context Selector */}
        <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto w-full space-y-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a topic or concept to test..."
              className="w-full bg-white/95 border border-slate-300 hover:border-slate-400 focus:border-primary text-slate-900 placeholder:text-slate-400 text-sm sm:text-base rounded-2xl pl-12 pr-4 min-h-[52px] shadow-sm transition-all"
            />
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            <Button
              type="button"
              onClick={handleLearnClick}
              className="bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-glow min-h-[44px]"
            >
              <BookOpen className="size-4 mr-1.5" /> Learning Context
            </Button>

            <Button
              type="button"
              onClick={handleReflectClick}
              variant="outline"
              className="bg-white/90 hover:bg-white text-slate-900 border-slate-300 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl min-h-[44px] shadow-sm"
            >
              <Sparkles className="size-4 mr-1.5 text-primary" /> Confidence Capture
            </Button>

            <Button
              asChild
              variant="outline"
              className="bg-white/90 hover:bg-white text-slate-900 border-slate-300 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl min-h-[44px] shadow-sm"
            >
              <Link to="/assessment" search={{ concept: activeTopic }}>
                <Zap className="size-4 mr-1.5 text-warning" /> Evidence Collection
              </Link>
            </Button>
          </div>
        </form>

        {/* PROMINENT VISUAL CALLOUT: CONFIDENCE VS EVIDENCE COMPARISON */}
        <div className="glass-card-light p-6 sm:p-8 rounded-3xl bg-white/95 border border-primary/30 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary">Core Intelligence Telemetry</span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">{activeTopic} Stability Analysis</h2>
            </div>
            {latestResult?.isConfidentButFragile ? (
              <Badge variant="destructive" className="font-mono text-xs font-bold uppercase px-3 py-1">
                <AlertTriangle className="size-3.5 mr-1" /> Fragile Understanding
              </Badge>
            ) : (
              <Badge variant="outline" className="border-success/40 text-success bg-success/10 font-mono text-xs font-bold uppercase px-3 py-1">
                <ShieldCheck className="size-3.5 mr-1" /> {latestResult?.bandLabel || "Developing Understanding"}
              </Badge>
            )}
          </div>

          {/* 5 Core Telemetry Answers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Answer 1: Current Topic */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500 font-mono">
                <BookOpen className="size-4 text-primary" /> 1. Current Topic
              </div>
              <p className="text-base font-bold text-slate-900">{activeTopic}</p>
              <p className="text-xs text-slate-600">
                {activeLearnMaterial?.fileName ? `Source: ${activeLearnMaterial.fileName}` : "Academic Context Active"}
              </p>
            </div>

            {/* Answer 2: How Confident Am I? */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500 font-mono">
                <Sparkles className="size-4 text-primary" /> 2. Perceived Confidence
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold font-mono text-slate-900">{confidenceScore}%</span>
                <span className="text-xs font-semibold text-slate-500">Self-Reported Grasp</span>
              </div>
              <p className="text-xs text-slate-600">Captured in Stage 03 Confidence Reflection</p>
            </div>

            {/* Answer 3: What Does Evidence Show? */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500 font-mono">
                <Zap className="size-4 text-warning" /> 3. Demonstrated Evidence
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold font-mono text-primary">{stabilityScore}%</span>
                <span className="text-xs font-semibold text-slate-500">Stability Index Score</span>
              </div>
              <p className="text-xs text-slate-600">Measured across Direct, Explain & Transfer Probes</p>
            </div>

            {/* Answer 4: Biggest Conceptual Gap */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500 font-mono">
                <Target className="size-4 text-destructive" /> 4. Primary Conceptual Gap
              </div>
              <p className="text-sm font-bold text-slate-900">{weakSubconcept}</p>
              <p className="text-xs text-destructive font-medium">
                {confidenceGap > 0 ? `+${confidenceGap}% Overconfidence Gap Detected` : "Reasoning aligned with confidence"}
              </p>
            </div>
          </div>

          {/* Visual Confidence vs Evidence Comparison Bar */}
          <div className="rounded-2xl border border-slate-200 bg-slate-900 text-white p-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-sky-300">Self-Reported Confidence ({confidenceScore}%)</span>
              <span className="text-primary font-bold">Demonstrated Evidence ({stabilityScore}%)</span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-white/10 relative">
              <div
                className="h-full bg-sky-400 opacity-60 absolute top-0 left-0 transition-all duration-500"
                style={{ width: `${confidenceScore}%` }}
              />
              <div
                className="h-full bg-primary absolute top-0 left-0 transition-all duration-500 shadow-glow"
                style={{ width: `${stabilityScore}%` }}
              />
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {latestResult?.recommendation ||
                "ECHO compares your self-assessed confidence against proven reasoning to build true conceptual stability."}
            </p>
          </div>

          {/* Answer 5: Actionable Next Step */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">5. Recommended Action</span>
              <p className="text-xs font-bold text-slate-900">Launch Targeted Intervention for {weakSubconcept}</p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button asChild size="sm" variant="outline" className="border-slate-300 bg-white hover:bg-slate-50 text-slate-900 min-h-[44px]">
                <Link to="/assessment" search={{ concept: activeTopic }}>
                  Evidence Probe <Zap className="size-3.5 ml-1 text-warning" />
                </Link>
              </Button>
              <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-white font-bold shadow-glow min-h-[44px]">
                <Link to="/repair" search={{ concept: activeTopic }}>
                  Targeted Intervention <Wrench className="size-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="text-center text-[11px] text-slate-500 font-mono">
        Evidence-Based Conceptual Honesty Engine (ECHO)
      </footer>
    </div>
  );
}
