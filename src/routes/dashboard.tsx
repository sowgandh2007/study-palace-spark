import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
  Clock,
  Settings,
  Sparkles,
  BrainCircuit,
  Calendar,
  Activity,
  Zap,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { EchoLogo, HeaderNav } from "@/routes/index";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeSelect } from "@/lib/theme";
import { STABILITY_TREND, PRIORITY_REPAIRS } from "@/lib/echo/data";
import { useEcho } from "@/lib/echo/store";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { timetable, reflections, latestResult } = useEcho();

  const confidentButFragileCount = latestResult?.isConfidentButFragile ? 1 : 0;
  const currentStability = latestResult ? latestResult.stabilityScore : 68;
  const currentBand = latestResult?.bandLabel || "Developing Stability";

  return (
    <div className="min-h-screen bg-gradient-royal-ice-page text-slate-900 selection:bg-primary/30 pb-20">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 glass-header-light">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <EchoLogo />
          <HeaderNav />
          <div className="flex items-center gap-3">
            <ThemeSelect />
            <Link to="/settings" className="p-2 text-slate-700 hover:text-primary transition-colors" title="API Settings">
              <Settings className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pt-8 space-y-6">
        {/* FIGMA BENTO TOP BANNER: Ocean/Sky Cloud Header + Date Pill */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-sky-600 to-indigo-800 p-8 text-white shadow-xl">
          {/* Subtle cloud backdrop glow */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
          <div className="pointer-events-none absolute left-1/3 bottom-0 h-48 w-48 rounded-full bg-sky-300/20 blur-2xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge variant="outline" className="border-white/30 bg-white/15 text-white font-mono text-xs backdrop-blur-md px-3 py-1">
                  <Calendar className="mr-1.5 size-3.5" /> 13 August, 2026
                </Badge>
                <Badge variant="outline" className="border-white/30 bg-white/15 text-white font-mono text-xs backdrop-blur-md px-3 py-1">
                  Cohort: CS-2026 · Section B
                </Badge>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                ECHO Student Telemetry Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-sky-100 max-w-2xl">
                Real-time verified conceptual stability index, post-class reflection check-ins, and tomorrow-aware study plan prioritization.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button asChild size="lg" className="bg-white text-blue-950 hover:bg-slate-100 font-bold shadow-lg">
                <Link to="/reflection">
                  Start 10s Reflection <ArrowRight className="ml-1.5 size-4 text-blue-700" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* FIGMA BENTO GRID CONTAINER (3 Columns Desktop Layout) */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* 1. LARGE PRIMARY HERO CARD (Top Left, Spans 2 Columns, 2 Rows) */}
          <div className="bento-card-light p-8 md:col-span-2 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-primary">Core Diagnostic Metric</span>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">Overall Understanding Stability Index</h2>
                </div>
                <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-bold px-3.5 py-1 text-xs">
                  <ShieldCheck className="mr-1.5 size-4" /> {currentBand}
                </Badge>
              </div>

              {/* Main Score & Calibrated Metrics */}
              <div className="grid gap-6 sm:grid-cols-3 items-center pt-2">
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">Verified Stability Score</span>
                  <p className="font-mono text-5xl font-extrabold text-primary">{currentStability}%</p>
                  <span className="text-[11px] font-bold text-slate-700 block">Weighted Evidence Score</span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">Self-Reported Confidence</span>
                  <p className="font-mono text-5xl font-extrabold text-slate-900">75%</p>
                  <span className="text-[11px] font-bold text-slate-600 block">Post-Class Reflection</span>
                </div>

                <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-center space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800">Confidence Gap</span>
                  <p className="font-mono text-5xl font-extrabold text-amber-700">+7%</p>
                  <span className="text-[11px] font-bold text-amber-800 block">Calibrated Calibration</span>
                </div>
              </div>

              {/* 3-Dimension Score Meters */}
              <div className="space-y-3 pt-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Verified 3-Dimension Evidence Breakdown</h3>
                <div className="grid gap-3 sm:grid-cols-3 text-xs font-mono font-bold">
                  <div className="rounded-xl bg-slate-100 p-3.5 border border-slate-200 space-y-1">
                    <div className="flex justify-between text-slate-800">
                      <span>Direct Definition</span>
                      <span className="text-primary">80%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-primary" style={{ width: "80%" }} />
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-100 p-3.5 border border-slate-200 space-y-1">
                    <div className="flex justify-between text-slate-800">
                      <span>Under-The-Hood</span>
                      <span className="text-amber-600">55%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-amber-500" style={{ width: "55%" }} />
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-100 p-3.5 border border-slate-200 space-y-1">
                    <div className="flex justify-between text-slate-800">
                      <span>Unfamiliar Transfer</span>
                      <span className="text-primary">60%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-primary" style={{ width: "60%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-200">
              <span className="text-xs text-slate-600 font-medium">Assessed Concepts: <strong className="text-slate-900">12</strong> · Pending Re-Probes: <strong className="text-amber-700">3</strong></span>
              <Button asChild size="sm" variant="outline" className="border-primary/40 text-primary hover:bg-primary/5 font-bold">
                <Link to="/assessment">Launch Diagnostic Probe <ArrowRight className="ml-1 size-3.5" /></Link>
              </Button>
            </div>
          </div>

          {/* 2. TOP RIGHT ACCENT CARD (Figma Top Right Orange/Amber Card) */}
          <div className="bento-card-light p-7 bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white space-y-5 flex flex-col justify-between shadow-xl">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-100 flex items-center gap-1.5">
                  <AlertTriangle className="size-4 text-amber-200" /> Tomorrow-Aware Priority Alert
                </span>
                <Badge variant="outline" className="border-white/40 bg-white/20 text-white font-mono text-[10px]">
                  9:00 AM Class
                </Badge>
              </div>

              <h2 className="text-2xl font-extrabold text-white leading-tight">
                Binary Search Repair Scheduled
              </h2>

              <p className="text-xs text-amber-50 leading-relaxed font-medium">
                Binary Search is scheduled in tomorrow's 9:00 AM class. Verified stability is currently <strong>50% (Fragile Understanding)</strong>. ECHO recommends completing tonight's 15m repair.
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <div className="rounded-xl bg-black/20 p-3.5 text-xs font-mono border border-white/20 space-y-1">
                <div className="flex justify-between text-amber-100">
                  <span>Tonight's Allocated Time:</span>
                  <span className="font-bold text-white">35 mins</span>
                </div>
                <div className="flex justify-between text-amber-100">
                  <span>Targeted Gap:</span>
                  <span className="font-bold text-white">Spatial Elimination</span>
                </div>
              </div>

              <Button asChild size="lg" className="w-full bg-white text-orange-950 hover:bg-amber-50 font-bold shadow-md">
                <Link to="/study-plan">
                  View Tonight's Study Plan <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* 3. BOTTOM LEFT WIDE CARD (Figma Bottom Left Wide Card - 2 Columns) */}
          <div className="bento-card-light p-7 md:col-span-2 space-y-5 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-5 text-primary" />
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">7-Day Stability Score Trajectory</h2>
              </div>
              <span className="font-mono text-xs text-emerald-700 font-extrabold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                +27% Score Increase This Week
              </span>
            </div>

            <div className="flex items-end justify-between gap-3 h-44 pt-2">
              {STABILITY_TREND.map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full flex items-end h-36">
                    <div
                      className="w-full rounded-xl bg-gradient-to-t from-primary/70 via-sky-500 to-primary transition-all shadow-md hover:brightness-110"
                      style={{ height: `${d.stability}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs font-extrabold text-slate-700">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. BOTTOM MIDDLE SMALL ACTION CARD (Figma Bottom Middle Small Yellow Card) */}
          <div className="bento-card-light p-7 space-y-4 flex flex-col justify-between bg-gradient-to-br from-sky-50 via-indigo-50 to-blue-100 border-primary/30">
            <div className="space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Sparkles className="size-4" /> 10-Second Reflection
              </span>
              <h3 className="text-lg font-bold text-slate-900">Post-Class Check-In</h3>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                Log your self-reported confidence and struggle points immediately after class.
              </p>
            </div>

            <Button asChild size="md" className="w-full bg-primary hover:bg-primary/90 text-white font-bold shadow-md">
              <Link to="/reflection">Reflect Now <ArrowRight className="ml-1 size-3.5" /></Link>
            </Button>
          </div>

          {/* 5. TALL RIGHT COLUMN CARD (Figma Bottom Right Tall Card) */}
          <div className="bento-card-light p-7 md:col-span-3 lg:col-span-1 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">Priority Concept Repairs</h2>
                <Badge variant="outline" className="border-slate-300 text-slate-700 font-mono text-[10px]">
                  {PRIORITY_REPAIRS.length} Pending
                </Badge>
              </div>

              <div className="space-y-3">
                {PRIORITY_REPAIRS.map((c) => (
                  <div key={c.conceptId} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2 hover:border-primary/40 transition-all shadow-sm">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-bold text-slate-900">{c.name}</h4>
                      <span className="font-mono text-xs font-extrabold text-primary">{c.stability}%</span>
                    </div>
                    <p className="text-[11px] text-rose-600 font-bold">Weakest: {c.weakest}</p>
                    <Button asChild size="sm" variant="outline" className="w-full text-xs font-bold border-slate-300 hover:bg-slate-50">
                      <Link to="/repair" search={{ concept: c.name }}>Repair Gap</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Button asChild size="sm" variant="ghost" className="w-full text-xs font-bold text-slate-700 hover:text-primary">
                <Link to="/study-plan">Full Study Plan Queue →</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
