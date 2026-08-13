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
import { EchoNavbar } from "@/components/EchoNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STABILITY_TREND, PRIORITY_REPAIRS } from "@/lib/echo/data";
import { useEcho } from "@/lib/echo/store";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { timetable, reflections, latestResult } = useEcho();

  return (
    <div className="min-h-screen bg-gradient-royal-ice-page text-slate-900 selection:bg-primary/30 pb-28 md:pb-20">
      {/* Unified Mobile & Desktop Responsive Navbar */}
      <EchoNavbar variant="light" />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* TOP BANNER: Ocean/Sky Cloud Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-sky-600 to-indigo-800 p-6 sm:p-8 text-white shadow-xl">
          {/* Subtle cloud backdrop glow */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
          <div className="pointer-events-none absolute left-1/3 bottom-0 h-48 w-48 rounded-full bg-sky-300/20 blur-2xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
                Student Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-sky-100 max-w-2xl">
                Your reflection check-ins and study plan, in one place.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button asChild size="lg" className="w-full sm:w-auto bg-white text-blue-950 hover:bg-slate-100 font-bold shadow-lg min-h-[44px]">
                <Link to="/reflection">
                  Start 10s Reflection <ArrowRight className="ml-1.5 size-4 text-blue-700" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* UNIFIED BENTO GRID CONTAINER */}
        <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* 1. TOP LEFT ACCENT CARD (Tomorrow-Aware Alert) */}
          <div className="bento-card-light p-6 sm:p-7 bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white space-y-5 flex flex-col justify-between shadow-xl">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-100 flex items-center gap-1.5">
                  <AlertTriangle className="size-4 text-amber-200" /> Tomorrow-Aware Priority
                </span>
                <Badge variant="outline" className="border-white/40 bg-white/20 text-white font-mono text-[10px]">
                  9:00 AM Class
                </Badge>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
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

              <Button asChild size="lg" className="w-full bg-white text-orange-950 hover:bg-amber-50 font-bold shadow-md min-h-[44px]">
                <Link to="/study-plan">
                  View Tonight's Study Plan <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* 2. 7-DAY STABILITY TREND CARD */}
          <div className="bento-card-light p-6 sm:p-7 md:col-span-1 lg:col-span-2 space-y-5 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-5 text-primary" />
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">7-Day Stability Score Trajectory</h2>
              </div>
              <span className="font-mono text-xs text-emerald-700 font-extrabold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 w-fit">
                +27% Score Increase This Week
              </span>
            </div>

            <div className="flex items-end justify-between gap-2 sm:gap-3 h-40 pt-2">
              {STABILITY_TREND.map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full flex items-end h-32">
                    <div
                      className="w-full rounded-xl bg-gradient-to-t from-primary/70 via-sky-500 to-primary transition-all shadow-md hover:brightness-110"
                      style={{ height: `${d.stability}%` }}
                    />
                  </div>
                  <span className="font-mono text-[11px] sm:text-xs font-extrabold text-slate-700">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. 10s REFLECTION ACTION CARD */}
          <div className="bento-card-light p-6 sm:p-7 space-y-4 flex flex-col justify-between bg-gradient-to-br from-sky-50 via-indigo-50 to-blue-100 border-primary/30">
            <div className="space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Sparkles className="size-4" /> 10-Second Reflection
              </span>
              <h3 className="text-lg font-bold text-slate-900">Post-Class Check-In</h3>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                Log your self-reported confidence and struggle points immediately after class.
              </p>
            </div>

            <Button asChild size="md" className="w-full bg-primary hover:bg-primary/90 text-white font-bold shadow-md min-h-[44px]">
              <Link to="/reflection">Reflect Now <ArrowRight className="ml-1 size-3.5" /></Link>
            </Button>
          </div>

          {/* 4. PRIORITY CONCEPT REPAIRS CARD (Explicit Light White Buttons to fix dark text issue) */}
          <div className="bento-card-light p-6 sm:p-7 md:col-span-2 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">Priority Concept Repairs</h2>
                <Badge variant="outline" className="border-slate-300 text-slate-700 font-mono text-[10px]">
                  {PRIORITY_REPAIRS.length} Pending
                </Badge>
              </div>

              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                {PRIORITY_REPAIRS.map((c) => (
                  <div key={c.conceptId} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2.5 hover:border-primary/40 transition-all shadow-sm">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-bold text-slate-900">{c.name}</h4>
                      <span className="font-mono text-xs font-extrabold text-primary">{c.stability}%</span>
                    </div>
                    <p className="text-[11px] text-rose-600 font-bold">Weakest: {c.weakest}</p>
                    {/* Fixed button styling: Explicit white background with crisp dark text */}
                    <Button asChild size="sm" className="w-full text-xs font-bold bg-white text-slate-900 border border-slate-300 hover:bg-slate-50 min-h-[40px] shadow-sm">
                      <Link to="/repair" search={{ concept: c.name }}>Repair Gap</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Button asChild size="sm" className="w-full text-xs font-bold bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 min-h-[38px] shadow-sm">
                <Link to="/study-plan">Full Study Plan Queue →</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
