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
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
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

      <main className="mx-auto max-w-5xl px-6 pt-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Student Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-1">Real-time understanding stability, reflection logs, and tomorrow-aware repair schedules.</p>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-5 card-shadow space-y-1">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Today's Scheduled Classes</span>
            <p className="font-mono text-3xl font-extrabold text-foreground">{timetable.length}</p>
            <Link to="/timetable" className="text-[11px] font-semibold text-primary hover:underline block pt-1">View schedule →</Link>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 card-shadow space-y-1">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Today's Reflections</span>
            <p className="font-mono text-3xl font-extrabold text-foreground">{reflections.length || 3}</p>
            <Link to="/reflection" className="text-[11px] font-semibold text-primary hover:underline block pt-1">Reflect on class →</Link>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 card-shadow space-y-1">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Understanding Gaps</span>
            <p className="font-mono text-3xl font-extrabold text-warning">2</p>
            <Link to="/study-plan" className="text-[11px] font-semibold text-warning hover:underline block pt-1">View study plan →</Link>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 card-shadow space-y-1">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Confidence Traps</span>
            <p className="font-mono text-3xl font-extrabold text-destructive">{confidentButFragileCount || 1}</p>
            <span className="text-[11px] text-destructive font-medium block pt-1">1 Confident-but-Fragile</span>
          </div>
        </div>

        {/* Tonight's Plan Card */}
        <div className="rounded-2xl border border-primary/40 bg-primary/10 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Tonight's ECHO Plan</span>
            <h2 className="text-lg font-bold">35 minutes · 2 concepts requiring repair</h2>
            <p className="text-xs text-muted-foreground">Binary Search (Fragile Understanding, scheduled in tomorrow's 9:00 AM class).</p>
          </div>
          <Button asChild size="lg">
            <Link to="/study-plan">View Study Plan <ArrowRight className="ml-1.5 size-4" /></Link>
          </Button>
        </div>

        {/* Stability Trend & Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 card-shadow md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">7-Day Stability Score Trend</h2>
              <span className="font-mono text-xs text-success font-semibold">+27% this week</span>
            </div>
            <div className="flex items-end justify-between gap-2 h-36 pt-2">
              {STABILITY_TREND.map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full flex items-end h-28">
                    <div
                      className="w-full rounded-md bg-primary transition-all"
                      style={{ height: `${d.stability}%` }}
                    />
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 card-shadow flex flex-col justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Overall Stability Index</span>
              <p className="font-mono text-4xl font-extrabold text-foreground mt-2">
                {latestResult ? `${latestResult.stabilityScore}%` : "68%"}
              </p>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <ShieldCheck className="size-3.5" /> {latestResult?.bandLabel || "Developing Stability"}
              </span>
            </div>
            <div className="pt-4 border-t border-border/60">
              <p className="text-xs text-muted-foreground">Assessed Concepts: <span className="font-mono text-foreground font-semibold">12</span></p>
              <p className="text-xs text-muted-foreground mt-1">Pending Re-Probes: <span className="font-mono text-warning font-semibold">3</span></p>
            </div>
          </div>
        </div>

        {/* Priority Concept Repairs */}
        <div className="rounded-2xl border border-border bg-card p-6 card-shadow space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-warning" />
              <h2 className="text-xs font-semibold uppercase tracking-wider">Priority Concept Repairs</h2>
            </div>
            <Button asChild size="sm" variant="ghost">
              <Link to="/study-plan">Full repair list <ArrowRight className="size-3.5 ml-1" /></Link>
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {PRIORITY_REPAIRS.map((c) => (
              <div key={c.conceptId} className="rounded-xl border border-border bg-background/50 p-4 space-y-2">
                <p className="text-sm font-bold">{c.name}</p>
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-base font-bold">{c.stability}% Stability</span>
                  <span className="text-xs text-destructive font-medium">Weakest: {c.weakest}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{c.repairActivity}</p>
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
