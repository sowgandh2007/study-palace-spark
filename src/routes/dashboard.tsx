import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, AlertTriangle, CheckCircle2, ThumbsUp, HelpCircle, Frown } from "lucide-react";
import { EchoLogo } from "@/routes/index";
import { Button } from "@/components/ui/button";
import { ThemeSelect } from "@/lib/theme";
import { STABILITY_TREND, PRIORITY_REPAIRS } from "@/lib/echo/data";
import { CHECKIN_OPTIONS, type ReflectionCheckIn } from "@/lib/echo/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const [activeCheckIn, setActiveCheckIn] = useState<ReflectionCheckIn | null>("mostly");

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <EchoLogo />
          <div className="flex items-center gap-3">
            <ThemeSelect />
            <Button asChild variant="outline" size="sm">
              <Link to="/assessment">Start New Probe</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pt-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Student Telemetry Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-1">Real-time understanding stability telemetry and post-class reflection.</p>
        </div>

        {/* 5-Second Post-Class Reflection Check-In Widget */}
        <div className="rounded-2xl border border-border bg-card p-6 card-shadow space-y-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">5-Second Post-Class Reflection</span>
            <h2 className="text-base font-bold mt-0.5">How well did today's DBMS lecture feel?</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            {CHECKIN_OPTIONS.map((opt) => {
              const isSelected = activeCheckIn === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setActiveCheckIn(opt.id)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-background/50 hover:border-border/80"
                  )}
                >
                  <p className="font-bold text-sm">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{opt.hint}</p>
                </button>
              );
            })}
          </div>
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
              <p className="font-mono text-4xl font-extrabold text-foreground mt-2">68%</p>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <ShieldCheck className="size-3.5" /> Developing Stability
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
              <Link to="/assessment">Probe engine <ArrowRight className="size-3.5 ml-1" /></Link>
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
                  <Link to="/assessment" search={{ concept: c.conceptId }}>Re-probe now</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
