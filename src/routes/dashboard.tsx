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
    <div className="min-h-screen text-foreground selection:bg-primary/30 pb-20">
      <header className="sticky top-0 z-40 glass-header">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <EchoLogo />
          <HeaderNav />
          <div className="flex items-center gap-3">
            <ThemeSelect />
            <Link to="/settings" className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="API Settings">
              <Settings className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pt-10 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Student Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">Real-time understanding stability, reflection logs, and tomorrow-aware repair schedules.</p>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass-card glass-card-hover p-6 space-y-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Today's Scheduled Classes</span>
            <p className="font-mono text-4xl font-extrabold text-white">{timetable.length}</p>
            <Link to="/timetable" className="text-xs font-semibold text-primary hover:underline block pt-1">View schedule →</Link>
          </div>

          <div className="glass-card glass-card-hover p-6 space-y-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Today's Reflections</span>
            <p className="font-mono text-4xl font-extrabold text-white">{reflections.length || 3}</p>
            <Link to="/reflection" className="text-xs font-semibold text-primary hover:underline block pt-1">Reflect on class →</Link>
          </div>

          <div className="glass-card glass-card-hover p-6 space-y-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Understanding Gaps</span>
            <p className="font-mono text-4xl font-extrabold text-warning">2</p>
            <Link to="/study-plan" className="text-xs font-semibold text-warning hover:underline block pt-1">View study plan →</Link>
          </div>

          <div className="glass-card glass-card-hover p-6 space-y-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Confidence Traps</span>
            <p className="font-mono text-4xl font-extrabold text-destructive">{confidentButFragileCount || 1}</p>
            <span className="text-xs text-destructive font-medium block pt-1">1 Confident-but-Fragile</span>
          </div>
        </div>

        {/* Tonight's Plan Card */}
        <div className="glass-card p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-primary/30 bg-primary/10">
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Tonight's ECHO Plan</span>
            <h2 className="text-xl font-bold text-white">35 minutes · 2 concepts requiring repair</h2>
            <p className="text-xs sm:text-sm text-slate-300">Binary Search (Fragile Understanding, scheduled in tomorrow's 9:00 AM class).</p>
          </div>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 shadow-glow font-bold">
            <Link to="/study-plan">View Study Plan <ArrowRight className="ml-2 size-4" /></Link>
          </Button>
        </div>

        {/* Stability Trend & Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="glass-card p-6 md:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">7-Day Stability Score Trend</h2>
              <span className="font-mono text-xs text-success font-semibold">+27% this week</span>
            </div>
            <div className="flex items-end justify-between gap-3 h-40 pt-2">
              {STABILITY_TREND.map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full flex items-end h-32">
                    <div
                      className="w-full rounded-md bg-gradient-to-t from-primary/50 to-primary transition-all shadow-glow"
                      style={{ height: `${d.stability}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-slate-400">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Overall Stability Index</span>
              <p className="font-mono text-5xl font-extrabold text-white mt-3">
                {latestResult ? `${latestResult.stabilityScore}%` : "68%"}
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/20 px-3.5 py-1 text-xs font-bold text-primary shadow-glow">
                <ShieldCheck className="size-3.5" /> {latestResult?.bandLabel || "Developing Stability"}
              </span>
            </div>
            <div className="pt-6 border-t border-white/10">
              <p className="text-xs text-slate-300">Assessed Concepts: <span className="font-mono text-white font-bold">12</span></p>
              <p className="text-xs text-slate-300 mt-1">Pending Re-Probes: <span className="font-mono text-warning font-bold">3</span></p>
            </div>
          </div>
        </div>

        {/* Priority Concept Repairs */}
        <div className="glass-card p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-warning" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Priority Concept Repairs</h2>
            </div>
            <Button asChild size="sm" variant="ghost" className="text-xs text-slate-300 hover:text-white">
              <Link to="/study-plan">Full repair list <ArrowRight className="size-3.5 ml-1" /></Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {PRIORITY_REPAIRS.map((c) => (
              <div key={c.conceptId} className="glass-card glass-card-hover p-5 space-y-3 bg-black/20">
                <p className="text-base font-bold text-white">{c.name}</p>
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-lg font-bold text-primary">{c.stability}% Stability</span>
                  <span className="text-xs text-destructive font-semibold">Weakest: {c.weakest}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{c.repairActivity}</p>
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
