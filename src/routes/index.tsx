import { useEffect } from "react";
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
import { FoldText } from "@/components/ui/FoldText";
import { EchoNavbar, EchoLogo } from "@/components/EchoNavbar";
import { Prism } from "@/components/ui/Prism";

export { EchoLogo };

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const FIVE_STEP_LOOP = [
  { step: "01", name: "Learn", detail: "Attend class or engage with study material from your timetable." },
  { step: "02", name: "Reflect", detail: "Complete a 10-second post-class check-in (Confidence slider + What didn't you understand?)." },
  { step: "03", name: "Verify", detail: "ECHO diagnoses your conceptual gap and runs a targeted 3-dimension check." },
  { step: "04", name: "Repair", detail: "Execute a gap-specific repair exercise fitted within your evening study time budget." },
  { step: "05", name: "Improve", detail: "Re-check understanding post-repair and track verified score increases." },
];

const BAND_COLORS: Record<string, string> = {
  surface: "score-band-red",
  fragile: "score-band-amber",
  developing: "score-band-blue",
  stable: "score-band-green",
};

function LandingPage() {
  // Scroll Reveal via IntersectionObserver
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
      {/* High-performance scroll navbar */}
      <EchoNavbar variant="dark" />

      {/* Hero Section with React Bits 3D Prism WebGL Background & FoldText */}
      <section className="hero-gradient-bg relative overflow-hidden px-4 sm:px-6 pt-16 sm:pt-20 pb-20 sm:pb-24 md:pt-28 md:pb-32 text-center border-b border-white/10">
        {/* React Bits 3D Prism WebGL Background */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-45">
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
          />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl space-y-6 sm:space-y-8">
          <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold tracking-wide shadow-glow">
            <Sparkles className="mr-2 size-3.5" /> Evidence-Based Conceptual Honesty Engine
          </Badge>

          {/* FoldText applied to full headline */}
          <div className="flex flex-col items-center justify-center">
            <FoldText
              text="The Answer Is Correct. But Is the Understanding Real?"
              splitBy="char"
              hinge="top"
              trigger="mount"
              duration={0.65}
              stagger={0.035}
              ease="power3.out"
              perspective={700}
              creaseShading={0.55}
              fontSize="clamp(1.8rem, 4.8vw, 3.8rem)"
              fontWeight={800}
              color="#60a5fa"
            />
          </div>

          <p className="mx-auto max-w-2xl text-xs sm:text-base leading-relaxed text-slate-300">
            ECHO verifies whether a student's understanding of a concept is real, not just memorized or lucky. It probes whether your reasoning survives under structural variation, hidden assumptions, and unfamiliar transfer problems.
          </p>

          {/* GPU-Friendly Scale/Brightness CTA Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto px-8 font-bold cta-btn-gradient text-white text-base min-h-[48px]">
              <Link to="/reflection">
                Enter the Demo <ArrowRight className="ml-2 size-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto px-8 border-white/20 bg-white/5 hover:bg-white/10 text-white text-base min-h-[48px] cta-btn-outline">
              <Link to="/assessment" search={{ concept: "binary-search", demo: "true" }}>
                <Zap className="mr-2 size-4 text-warning" /> Try a Probe
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 5-Step ECHO Workflow Loop Section with Scroll Reveal */}
      <section className="border-t border-white/10 bg-black/20 backdrop-blur-md py-16 sm:py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-10 sm:space-y-12">
          <div className="text-center space-y-2 sm:space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Continuous Verification Protocol</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">The Five-Step ECHO Workflow</h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
              How students build verifiable, bulletproof conceptual understanding every single day.
            </p>
          </div>

          <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            {FIVE_STEP_LOOP.map((item, idx) => (
              <div
                key={item.step}
                className="reveal-card glass-card p-6 space-y-3 flex flex-col justify-between"
                style={{ transitionDelay: `${idx * 60}ms` }}
              >
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

      {/* 6-Dimension Framework Section with Scroll Reveal */}
      <section className="border-t border-white/10 py-16 sm:py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-10 sm:space-y-12">
          <div className="text-center space-y-2 sm:space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Diagnostic Architecture</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">The Six-Dimension Framework</h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
              ECHO probes understanding across 6 rigorous dimensions (currently evaluating 3 core probe dimensions in active assessments).
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

      {/* Score Band Cards (0-39 → 80-100) with Color-Coded Left Border */}
      <section className="border-t border-white/10 bg-black/20 backdrop-blur-md py-16 sm:py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-10 sm:space-y-12">
          <div className="text-center space-y-2 sm:space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Scoring Engine</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">Understanding Stability Score Bands</h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
              Single centralized score bands based strictly on weighted performance: round(Direct × 20% + Explain × 40% + Transfer × 40%).
            </p>
          </div>

          <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {BANDS.map((band, idx) => (
              <div
                key={band.id}
                className={`reveal-card glass-card score-band-card ${BAND_COLORS[band.id] || "score-band-blue"} p-6 space-y-3`}
                style={{ transitionDelay: `${idx * 60}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-400">{band.range}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-white">{band.label}</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-300">{band.verdict}</p>
              </div>
            ))}
          </div>

          <div className="pt-6 text-center">
            <Button asChild size="lg" className="px-10 font-bold cta-btn-gradient text-white text-base min-h-[48px]">
              <Link to="/reflection">Enter the Demo <ArrowRight className="ml-2 size-5" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
