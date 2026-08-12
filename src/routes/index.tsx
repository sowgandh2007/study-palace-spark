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
    <Link to="/" className="flex items-center gap-2 font-bold text-foreground">
      <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 border border-primary/40 text-primary">
        <BrainCircuit className="h-4 w-4" />
      </div>
      <span className="tracking-tight text-base font-extrabold font-mono">ECHO</span>
    </Link>
  );
}

const FIVE_STEP_LOOP = [
  { step: "01", name: "Timetable", detail: "Enter tomorrow's scheduled classes to trigger automated post-class reminders." },
  { step: "02", name: "Reflection", detail: "Complete a 10-second post-class check-in (Confidence slider + What didn't you understand?)." },
  { step: "03", name: "Gap Diagnosis", detail: "AI analyzes your self-reported confidence and diagnoses the exact underlying gap." },
  { step: "04", name: "Verification", detail: "Take a targeted 3-dimension probe (Direct, Explain, Transfer) to verify survival." },
  { step: "05", name: "Repair & Re-check", detail: "Execute step-by-step gap repair and re-check post-repair score increase." },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <EchoLogo />
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Link to="/timetable" className="hover:text-foreground transition-colors">Timetable</Link>
            <Link to="/reflection" className="hover:text-foreground transition-colors">Reflection</Link>
            <Link to="/assessment" className="hover:text-foreground transition-colors">Probe Engine</Link>
            <Link to="/dashboard" className="hover:text-foreground transition-colors">Telemetry</Link>
            <Link to="/faculty" className="hover:text-foreground transition-colors">Faculty Portal</Link>
            <Link to="/plan" className="hover:text-foreground transition-colors">Adaptive Plan</Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeSelect />
            <Button asChild size="sm" variant="ghost">
              <Link to="/settings"><Settings className="size-3.5 mr-1" /> API Settings</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-16 pb-20 md:pt-24 md:pb-28 text-center">
        <div className="mx-auto max-w-4xl space-y-6">
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary px-3.5 py-1 text-xs font-semibold tracking-wide">
            <Sparkles className="mr-1.5 size-3.5" /> Evidence-Based Conceptual Honesty Engine
          </Badge>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl md:text-6xl leading-[1.1]">
            The Answer Is Correct. <br className="hidden sm:inline" />
            <span className="text-primary">But Is the Understanding Real?</span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base leading-relaxed text-muted-foreground">
            ECHO checks whether a student's understanding of a concept is real, not just memorized or lucky. It probes whether your reasoning survives under structural variation, hidden assumptions, and unfamiliar transfer problems.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="w-full sm:w-auto px-6 font-semibold">
              <Link to="/reflection">
                Start ECHO Reflection <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto px-6">
              <Link to="/assessment" search={{ concept: "binary-search", demo: "true" }}>
                <Zap className="mr-2 size-4 text-warning" /> Try a Binary Search probe
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 5-Step Daily Loop Section */}
      <section className="border-t border-border bg-card/40 py-16 px-6">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Continuous Verification Protocol</span>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">The Five-Step ECHO Workflow</h2>
            <p className="text-xs text-muted-foreground max-w-xl mx-auto">
              How students build verifiable, bulletproof conceptual understanding every single day.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-5">
            {FIVE_STEP_LOOP.map((item) => (
              <div key={item.step} className="rounded-2xl border border-border bg-card p-5 card-shadow space-y-2 flex flex-col justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-primary">{item.step}</span>
                  <h3 className="text-base font-bold mt-1">{item.name}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6-Dimension Framework Section */}
      <section className="border-t border-border py-16 px-6">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Diagnostic Architecture</span>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">The Six-Dimension Framework</h2>
            <p className="text-xs text-muted-foreground max-w-xl mx-auto">
              ECHO probes understanding across 6 rigorous dimensions (currently evaluating 3 core probe dimensions in active assessments).
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {FRAMEWORK_DIMENSIONS.map((dim) => (
              <div key={dim.id} className="rounded-2xl border border-border bg-card p-5 card-shadow space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">{dim.label}</span>
                  {(dim.id === "direct" || dim.id === "explain" || dim.id === "transfer") && (
                    <Badge variant="outline" className="text-[10px] border-primary/40 bg-primary/10 text-primary">
                      Active Probe
                    </Badge>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground pt-1">{dim.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stability Score Bands Section */}
      <section className="border-t border-border bg-card/40 py-16 px-6">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Scoring Engine</span>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Understanding Stability Score Bands</h2>
            <p className="text-xs text-muted-foreground max-w-xl mx-auto">
              Single centralized score bands based strictly on weighted performance: round(Direct × 20% + Explain × 40% + Transfer × 40%).
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BANDS.map((band) => (
              <div key={band.id} className="rounded-2xl border border-border bg-card p-5 card-shadow space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-muted-foreground">{band.range}</span>
                  <span className="text-xs font-bold uppercase tracking-wider">{band.label}</span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{band.verdict}</p>
              </div>
            ))}
          </div>

          <div className="pt-6 text-center">
            <Button asChild size="lg" className="px-8">
              <Link to="/reflection">Launch ECHO Reflection <ArrowRight className="ml-2 size-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
