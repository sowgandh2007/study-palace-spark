import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BrainCircuit,
  Calendar,
  Sparkles,
  Zap,
  BookOpen,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FRAMEWORK_DIMENSIONS } from "@/lib/echo/types";
import { FoldText } from "@/components/ui/FoldText";
import { EchoNavbar, EchoLogo } from "@/components/EchoNavbar";
import { Prism } from "@/components/ui/Prism";
import { ScrollStack, type ScrollStackItem } from "@/components/ui/ScrollStack";

export { EchoLogo };

export const Route = createFileRoute("/")({
  component: LandingPage,
});

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

  // 5 Stage Cards for ScrollStack deck matching exact Figma screenshot
  // Plan card points DIRECTLY to /timetable (Tomorrow's Class Schedule)
  const stackItems: ScrollStackItem[] = [
    {
      id: "plan",
      stageNumber: "01",
      stageTitle: "Plan",
      icon: Calendar,
      to: "/timetable",
      description:
        "ECHO reads your timetable and notes to build a focused plan around tomorrow's scheduled concepts — so study time is spent where evidence says it matters.",
    },
    {
      id: "learn",
      stageNumber: "02",
      stageTitle: "Learn",
      icon: BookOpen,
      to: "/study-plan",
      description:
        "You attend class and engage with the underlying concept. ECHO tracks the concept itself — the mechanism and its constraints — not a memorised answer.",
    },
    {
      id: "reflect",
      stageNumber: "03",
      stageTitle: "Reflect",
      icon: Sparkles,
      to: "/reflection",
      description:
        "You self-report confidence and write what you understand in your own words. ECHO compares what you feel against demonstrated evidence.",
    },
    {
      id: "verify",
      stageNumber: "04",
      stageTitle: "Verify",
      icon: Zap,
      to: "/assessment",
      description:
        "ECHO tests your understanding across direct, explain, and transfer dimensions through targeted AI exams and diagnostic probes.",
    },
    {
      id: "adapt",
      stageNumber: "05",
      stageTitle: "Adapt",
      icon: TrendingUp,
      to: "/dashboard",
      description:
        "ECHO uses your stability trajectory to prioritize evening repair slots and recommend your next best learning action.",
    },
  ];

  return (
    <div className="min-h-screen text-foreground selection:bg-primary/30 pb-28 md:pb-20">
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

      {/* SCROLL STACK STACKING CARD DECK ON HOME PAGE */}
      <section className="py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary font-mono">Continuous Learning Loop</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">The Five ECHO Stages</h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
              Scroll to stack cards. Click any card or OPEN MENU to jump directly to its stage tool.
            </p>
          </div>

          {/* ScrollStack Deck */}
          <ScrollStack items={stackItems} />
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
              <div key={dim.id} className="glass-card p-6 space-y-3">
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
