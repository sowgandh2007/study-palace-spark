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
    <div className="bg-background min-h-screen pb-28 md:pb-20 bg-[radial-gradient(#d1d8e0_2px,transparent_2px)] bg-[length:30px_30px]">
      <EchoNavbar variant="dark" />

      {/* Brain Zoom & 6-Dimension Explosion Interactive Introduction */}
      <BrainIntro />

      {/* SCROLL STACK STACKING CARD DECK ON HOME PAGE */}
      <section className="py-16 px-4 sm:px-6 relative z-10">
        <div className="mx-auto max-w-4xl space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary font-retro">Level 01: Core Loop</span>
            <h2 className="text-2xl sm:text-4xl tracking-tight text-foreground font-pixel uppercase drop-shadow-[2px_2px_0_rgba(45,27,78,0.2)]">The ECHO Stages</h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto font-sans font-semibold mt-4">
              Scroll to stack cards. Click any card or OPEN MENU to jump directly to its stage tool.
            </p>
          </div>

          {/* ScrollStack Deck */}
          <ScrollStack items={stackItems} />
        </div>
      </section>

      {/* 6-Dimension Framework Section */}
      <section className="border-t-4 border-border py-16 sm:py-20 px-4 sm:px-6 relative z-10 bg-white">
        <div className="mx-auto max-w-6xl space-y-10 sm:space-y-12">
          <div className="text-center space-y-2 sm:space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-primary font-retro">Level 02: Framework</span>
            <h2 className="text-2xl sm:text-4xl tracking-tight text-foreground font-pixel uppercase drop-shadow-[2px_2px_0_rgba(45,27,78,0.2)]">The Six Dimensions</h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto font-sans font-semibold mt-4">
              ECHO probes understanding across 6 rigorous dimensions to test whether student reasoning survives structural variation.
            </p>
          </div>

          <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {FRAMEWORK_DIMENSIONS.map((dim) => (
              <div key={dim.id} className="retro-pixel-card space-y-3 group bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold uppercase tracking-wider text-primary font-retro group-hover:text-brand transition-colors"><span className="opacity-0 group-hover:opacity-100 animate-blink mr-1">►</span>{dim.label}</span>
                  {(dim.id === "direct" || dim.id === "explain" || dim.id === "transfer") && (
                    <Badge variant="outline" className="text-[10px] border-2 border-border bg-accent text-white font-retro rounded-none shadow-[2px_2px_0_rgba(45,27,78,1)]">
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-foreground font-sans font-medium">{dim.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
