import { createFileRoute } from "@tanstack/react-router";
import {
  Calendar,
  Sparkles,
  Zap,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FRAMEWORK_DIMENSIONS } from "@/lib/echo/types";
import { EchoNavbar, EchoLogo } from "@/components/EchoNavbar";
import { ScrollStack, type ScrollStackItem } from "@/components/ui/ScrollStack";
import { BrainIntro } from "@/components/echo/BrainIntro";

export { EchoLogo };

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
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
      to: "/learn",
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
    <div className="notebook-home min-h-screen selection:bg-sky-300/40 pb-28 md:pb-20">
      <EchoNavbar variant="light" />

      {/* Brain Zoom & 6-Dimension Explosion Interactive Introduction */}
      <BrainIntro />

      {/* SCROLL STACK STACKING CARD DECK ON HOME PAGE */}
      <section className="py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-sky-800 font-mono">Continuous Learning Loop</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">The Five ECHO Stages</h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
              Scroll to stack cards. Click any card or OPEN MENU to jump directly to its stage tool.
            </p>
          </div>

          {/* ScrollStack Deck */}
          <ScrollStack items={stackItems} />
        </div>
      </section>

      {/* 6-Dimension Framework Section */}
      <section className="border-t border-sky-900/10 py-16 sm:py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-10 sm:space-y-12">
          <div className="text-center space-y-2 sm:space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-sky-800 font-mono">Demonstrated Evidence</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">The Six-Dimension Framework</h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
              ECHO probes understanding across 6 rigorous dimensions to test whether student reasoning survives structural variation.
            </p>
          </div>

          <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {FRAMEWORK_DIMENSIONS.map((dim) => (
              <div key={dim.id} className="paper-card p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-800 font-mono">{dim.label}</span>
                  {(dim.id === "direct" || dim.id === "explain" || dim.id === "transfer") && (
                    <Badge variant="outline" className="text-[10px] border-sky-700/30 bg-sky-700/10 text-sky-800 font-mono">
                      Active Probe
                    </Badge>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-slate-600 pt-1">{dim.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
