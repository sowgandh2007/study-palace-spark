import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, AlertTriangle, BookOpen, Clock, Settings, Sparkles, BrainCircuit } from "lucide-react";
import { EchoLogo, HeaderNav } from "@/routes/index";
import { Button } from "@/components/ui/button";
import { ThemeSelect } from "@/lib/theme";
import { STABILITY_TREND, PRIORITY_REPAIRS } from "@/lib/echo/data";
import { useEcho } from "@/lib/echo/store";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { timetable, reflections, latestResult } = useEcho();

  const confidentButFragileCount = latestResult?.isConfidentButFragile ? 1 : 0;

  return (
    <div className="min-h-screen bg-gradient-royal-ice-page selection:bg-primary/30 pb-20">
      {/* Header with light glass styling */}
      <header className="sticky top-0 z-40 glass-header-light">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
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

      <main className="mx-auto max-w-6xl px-6 pt-10 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Student Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1">Real-time understanding stability, reflection logs, and tomorrow-aware repair schedules.</p>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass-card-light glass-card-light-hover p-6 space-y-2">
            <span className="text-xs uppercase tracking-wider text-slate-600 font-bold">Today's Scheduled Classes</span>
            <p className="font-mono text-4xl font-extrabold text-slate-900">{timetable.length}</p>
            <Link to="/timetable" className="text-xs font-bold text-primary hover:underline block pt-1">View schedule →</Link>
          </div>

          <div className="glass-card-light glass-card-light-hover p-6 space-y-2">
            <span className="text-xs uppercase tracking-wider text-slate-600 font-bold">Today's Reflections</span>
            <p className="font-mono text-4xl font-extrabold text-slate-900">{reflections.length || 3}</p>
            <Link to="/reflection" className="text-xs font-bold text-primary hover:underline block pt-1">Reflect on class →</Link>
          </div>

          <div className="glass-card-light glass-card-light-hover p-6 space-y-2">
            <span className="text-xs uppercase tracking-wider text-slate-600 font-bold">Understanding Gaps</span>
            <p className="font-mono text-4xl font-extrabold text-amber-600">2</p>
            <Link to="/study-plan" className="text-xs font-bold text-amber-700 hover:underline block pt-1">View study plan →</Link>
          </div>

          <div className="glass-card-light glass-card-light-hover p-6 space-y-2">
            <span className="text-xs uppercase tracking-wider text-slate-600 font-bold">Confidence Traps</span>
            <p className="font-mono text-4xl font-extrabold text-rose-600">{confidentButFragileCount || 1}</p>
            <span className="text-xs text-rose-700 font-bold block pt-1">1 Confident-but-Fragile</span>
          </div>
        </div>

        {/* Tonight's Plan Banner Card */}
        <div className="glass-card-light p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-primary/40 bg-white/90">
          <div className="space-y-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wider text-primary">Tonight's ECHO Plan</span>
            <h2 className="text-xl font-bold text-slate-900">35 minutes · 2 concepts requiring repair</h2>
            <p className="text-xs sm:text-sm text-slate-700 font-medium">Binary Search (Fragile Understanding, scheduled in tomorrow's 9:00 AM class).</p>
          </div>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold shadow-glow">
            <Link to="/study-plan">View Study Plan <ArrowRight className="ml-2 size-4" /></Link>
          </Button>
        </div>

        {/* Stability Trend & Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="glass-card-light p-6 md:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">7-Day Stability Score Trend</h2>
              <span className="font-mono text-xs text-emerald-700 font-bold">+27% this week</span>
            </div>
            <div className="flex items-end justify-between gap-3 h-40 pt-2">
              {STABILITY_TREND.map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full flex items-end h-32">
                    <div
                      className="w-full rounded-md bg-gradient-to-t from-primary/70 to-primary transition-all shadow-glow"
                      style={{ height: `${d.stability}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-slate-700 font-bold">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card-light p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-600 font-bold">Overall Stability Index</span>
              <p className="font-mono text-5xl font-extrabold text-slate-900 mt-3">
                {latestResult ? `${latestResult.stabilityScore}%` : "68%"}
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary shadow-sm">
                <ShieldCheck className="size-3.5" /> {latestResult?.bandLabel || "Developing Stability"}
              </span>
            </div>
            <div className="pt-6 border-t border-slate-200">
              <p className="text-xs text-slate-700 font-medium">Assessed Concepts: <span className="font-mono text-slate-900 font-bold">12</span></p>
              <p className="text-xs text-slate-700 font-medium mt-1">Pending Re-Probes: <span className="font-mono text-amber-700 font-bold">3</span></p>
            </div>
          </div>
        </div>

        {/* Priority Concept Repairs */}
        <div className="glass-card-light p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Priority Concept Repairs</h2>
            </div>
            <Button asChild size="sm" variant="ghost" className="text-xs text-slate-700 hover:text-slate-900">
              <Link to="/study-plan">Full repair list <ArrowRight className="size-3.5 ml-1" /></Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {PRIORITY_REPAIRS.map((c) => (
              <div key={c.conceptId} className="glass-card-light glass-card-light-hover p-5 space-y-3 bg-white/70">
                <p className="text-base font-bold text-slate-900">{c.name}</p>
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-lg font-bold text-primary">{c.stability}% Stability</span>
                  <span className="text-xs text-rose-600 font-bold">Weakest: {c.weakest}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">{c.repairActivity}</p>
                <Button asChild size="sm" className="mt-2 w-full" variant="outline">
                  <Link to="/repair" search={{ concept: c.name }}>Repair concept gap</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
