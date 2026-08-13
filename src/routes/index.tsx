import { createFileRoute, Link } from "@tanstack/react-router";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeSelect } from "@/lib/theme";
import { FRAMEWORK_DIMENSIONS } from "@/lib/echo/types";
import { BANDS } from "@/lib/echo/scoring";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

export function EchoLogo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 font-bold text-foreground group">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/20 border border-primary/40 text-primary shadow-glow group-hover:scale-105 transition-transform">
        <BrainCircuit className="h-5 w-5" />
      </div>
      <span className="tracking-tight text-lg font-extrabold font-mono bg-gradient-to-r from-white via-blue-100 to-primary bg-clip-text text-transparent">
        ECHO
      </span>
    </Link>
  );
}

export function HeaderNav() {
  return (
    <nav className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">
      <Link to="/timetable" className="hover:text-foreground transition-colors">TIMETABLE</Link>
      <Link to="/dashboard" className="hover:text-foreground transition-colors">DASHBOARD</Link>
      <Link to="/study-plan" className="hover:text-foreground transition-colors">STUDY PLAN</Link>
      <Link to="/faculty" className="hover:text-foreground transition-colors">FACULTY</Link>
    </nav>
  );
}

const FIVE_STEP_LOOP = [
  { step: "01", name: "Learn", detail: "Attend class or engage with study material from your timetable." },
  { step: "02", name: "Reflect", detail: "Complete a 10-second post-class check-in (Confidence slider + What didn't you understand?)." },
  { step: "03", name: "Verify", detail: "ECHO diagnoses your conceptual gap and runs a targeted 3-dimension check." },
  { step: "04", name: "Repair", detail: "Execute a gap-specific repair exercise fitted within your evening study time budget." },
  { step: "05", name: "Improve", detail: "Re-check understanding post-repair and track verified score increases." },
];

function LandingPage() {
  return (
    <div className="min-h-screen text-foreground selection:bg-primary/30">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-header">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <EchoLogo />
          <HeaderNav />
          <div className="flex items-center gap-3">
            <ThemeSelect />
            <Link to="/settings" className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="API Settings">
              <Settings className="size-4" />
            </Link>
            <Button asChild size="sm" variant="outline" className="border-white/20 bg-white/5 hover:bg-white/10">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-20 pb-24 md:pt-32 md:pb-36 text-center">
        {/* Subtle Ambient Radial Glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-4xl space-y-8">
          <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary px-4 py-1.5 text-xs font-bold tracking-wide shadow-glow">
            <Sparkles className="mr-2 size-3.5" /> Evidence-Based Conceptual Honesty Engine
          </Badge>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl leading-[1.08] text-white">
            The Answer Is Correct. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-200 via-sky-300 to-primary bg-clip-text text-transparent">
              But Is the Understanding Real?
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base leading-relaxed text-slate-300">
            ECHO verifies whether a student's understanding of a concept is real, not just memorized or lucky. It probes whether your reasoning survives under structural variation, hidden assumptions, and unfamiliar transfer problems.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto px-8 font-bold bg-primary hover:bg-primary/90 shadow-glow text-base">
              <Link to="/reflection">
                Check My Understanding <ArrowRight className="ml-2 size-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto px-8 border-white/20 bg-white/5 hover:bg-white/10 text-base">
              <Link to="/assessment" search={{ concept: "binary-search", demo: "true" }}>
                <Zap className="mr-2 size-4 text-warning" /> Try a Binary Search Probe
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 5-Step ECHO Workflow Loop Section */}
      <section className="border-t border-white/10 bg-black/20 backdrop-blur-md py-20 px-6">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Continuous Verification Protocol</span>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">The Five-Step ECHO Workflow</h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
              How students build verifiable, bulletproof conceptual understanding every single day.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-5">
            {FIVE_STEP_LOOP.map((item) => (
              <div key={item.step} className="glass-card glass-card-hover p-6 space-y-3 flex flex-col justify-between">
                <div>
                  <span className="font-mono text-xs font-extrabold text-primary">{item.step}</span>
                  <h3 className="text-lg font-bold text-white mt-1">{item.name}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6-Dimension Framework Section */}
      <section className="border-t border-white/10 py-20 px-6">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Diagnostic Architecture</span>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">The Six-Dimension Framework</h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
              ECHO probes understanding across 6 rigorous dimensions (currently evaluating 3 core probe dimensions in active assessments).
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
            {FRAMEWORK_DIMENSIONS.map((dim) => (
              <div key={dim.id} className="glass-card glass-card-hover p-6 space-y-3">
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

      {/* Stability Score Bands Section */}
      <section className="border-t border-white/10 bg-black/20 backdrop-blur-md py-20 px-6">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Scoring Engine</span>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">Understanding Stability Score Bands</h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
              Single centralized score bands based strictly on weighted performance: round(Direct × 20% + Explain × 40% + Transfer × 40%).
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {BANDS.map((band) => (
              <div key={band.id} className="glass-card glass-card-hover p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-400">{band.range}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-white">{band.label}</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-300">{band.verdict}</p>
              </div>
            ))}
          </div>

          <div className="pt-6 text-center">
            <Button asChild size="lg" className="px-10 font-bold bg-primary hover:bg-primary/90 shadow-glow text-base">
              <Link to="/reflection">Check My Understanding <ArrowRight className="ml-2 size-5" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
