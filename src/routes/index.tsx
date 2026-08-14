import { useEffect, useState } from "react";
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
  BookOpen,
  TrendingUp,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeSelect } from "@/lib/theme";
import { FRAMEWORK_DIMENSIONS } from "@/lib/echo/types";
import { BANDS } from "@/lib/echo/scoring";
import { FoldText } from "@/components/ui/FoldText";
import { EchoNavbar, EchoLogo } from "@/components/EchoNavbar";
import { Prism } from "@/components/ui/Prism";

// ECHO — 5-Stage Intelligence Loop Redesign (Plan -> Learn -> Reflect -> Verify -> Adapt) v2
export { EchoLogo };

export const Route = createFileRoute("/")({
  component: LandingPage,
});

// The 5 ECHO Core Stage Gateways
const STAGE_GATEWAYS = [
  {
    stage: "01",
    name: "PLAN",
    title: "Academic Context & Schedule",
    to: "/plan",
    icon: Calendar,
    desc: "Align your evening study time budget with tomorrow's class schedule and verified conceptual gaps.",
    features: ["Tonight's Study Plan", "Class Timetable", "Learning Roadmap & Goals"],
  },
  {
    stage: "02",
    name: "LEARN",
    title: "AI PDF Summary Generator",
    to: "/learn",
    icon: BookOpen,
    desc: "Generate structured, high-yield study summaries from topics or uploaded PDFs designed for deep learning.",
    features: ["Topic Overview & Key Concepts", "Uploaded PDF Processing", "Core Principles & Formulas"],
  },
  {
    stage: "03",
    name: "REFLECT",
    title: "Self-Explanation & AI Analysis",
    to: "/reflection",
    icon: Sparkles,
    desc: "Explain concepts in your own words. AI evaluates your reasoning to detect superficial rote memorization.",
    features: ["Free-form Explanation Box", "AI Rote Flagging", "Missing Connection Analysis"],
  },
  {
    stage: "04",
    name: "VERIFY",
    title: "AI Exam Generator & Probes",
    to: "/assessment",
    icon: Zap,
    desc: "Generate custom AI exams from topics or PDFs testing Direct, Explain, and Transfer dimensions.",
    features: ["Topic & PDF Exam Generator", "3-Dimension Diagnostic Probes", "Detailed Accuracy Analysis"],
  },
  {
    stage: "05",
    name: "ADAPT",
    title: "Understanding Stability Index",
    to: "/dashboard",
    icon: TrendingUp,
    desc: "Track score trajectory over time and receive context-aware learning actions based on demonstrated evidence.",
    features: ["7-Day Score Trajectory", "Weak-Area Recommendations", "Persistent State Update"],
  },
];

const BAND_COLORS: Record<string, string> = {
  surface: "score-band-red",
  fragile: "score-band-amber",
  developing: "score-band-blue",
  stable: "score-band-green",
};

function LandingPage() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    function checkViewport() {
      setIsDesktop(window.innerWidth >= 768);
    }
    checkViewport();
    window.addEventListener("resize", checkViewport, { passive: true });
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  // Scroll Reveal
  useEffect(() => {
    const elements = document.querySelectorAll(".reveal-card");
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
          }
        });
      },
      { threshold: 0.12 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen text-foreground selection:bg-primary/30 pb-28 md:pb-20">
      {/* 5 Stage Sticky Navbar */}
      <EchoNavbar variant="dark" />

      {/* Hero Section */}
      <section className="hero-gradient-bg relative overflow-hidden px-4 sm:px-6 pt-16 sm:pt-20 pb-20 sm:pb-24 md:pt-24 md:pb-28 text-center border-b border-white/10">
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

        <div className="relative z-10 mx-auto max-w-5xl space-y-6 sm:space-y-8">
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
            ECHO is a continuous learning intelligence system that compares a student's perceived understanding with demonstrated evidence, detects conceptual fragility, and uses academic context to recommend the next best learning action.
          </p>

          {/* Core Distinction Callout */}
          <div className="mx-auto max-w-3xl rounded-2xl border border-primary/40 bg-primary/10 p-5 sm:p-6 text-center space-y-2 backdrop-blur-md">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-primary font-mono">Core Product Difference</span>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-200 font-medium">
              "Chat-based AI answers questions when asked. ECHO continuously tracks the relationship between perceived understanding, demonstrated evidence, and academic context to decide what should happen next."
            </p>
          </div>

          {/* Core CTA */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto px-8 font-bold cta-btn-gradient text-white text-base min-h-[48px]">
              <Link to="/plan">
                Start Learning Loop <ArrowRight className="ml-2 size-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto px-8 border-white/20 bg-white/5 hover:bg-white/10 text-white text-base min-h-[48px] cta-btn-outline">
              <Link to="/learn">
                <BookOpen className="mr-2 size-4 text-sky-400" /> AI PDF Summarizer
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* THE 5 CORE ECHO STAGES (PRIMARY HOME WORKFLOW GATEWAYS) */}
      <section className="border-t border-white/10 bg-black/20 backdrop-blur-md py-16 sm:py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-10 sm:space-y-12">
          <div className="text-center space-y-2 sm:space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-primary font-mono">Five-Stage Intelligence Loop</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">The ECHO Core Flow</h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
              Plan → Learn → Reflect → Verify → Adapt. Select any stage to access its dedicated tools.
            </p>
          </div>

          <div className="grid gap-5 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {STAGE_GATEWAYS.map((gate, idx) => {
              const IconComp = gate.icon;
              return (
                <div
                  key={gate.name}
                  className="reveal-card glass-card glass-card-hover p-6 sm:p-7 space-y-5 flex flex-col justify-between"
                  style={{ transitionDelay: `${idx * 60}ms` }}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-extrabold text-primary flex items-center gap-1.5">
                        STAGE {gate.stage} · {gate.name}
                      </span>
                      <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 border border-primary/30 text-primary">
                        <IconComp className="size-4" />
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white">{gate.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{gate.desc}</p>

                    <div className="pt-2 space-y-1.5 border-t border-white/10">
                      {gate.features.map((feat, fIdx) => (
                        <p key={fIdx} className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span className="text-primary font-bold">•</span> {feat}
                        </p>
                      ))}
                    </div>
                  </div>

                  <Button asChild size="md" className="w-full bg-primary hover:bg-primary/90 font-bold min-h-[44px] shadow-glow mt-4">
                    <Link to={gate.to}>
                      Enter Stage {gate.stage} ({gate.name}) <ArrowRight className="ml-1.5 size-4" />
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
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
