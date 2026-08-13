import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
  Clock,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Calendar,
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
  const { timetable, reflections } = useEcho();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-primary/30 pb-28 md:pb-20">
      {/* Responsive Light Navbar */}
      <EchoNavbar variant="light" />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Simple & Clean Header Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-800 p-6 sm:p-8 text-white shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Student Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-sky-100">
                Your reflection check-ins and study plan, in one place.
              </p>
            </div>

            <Button asChild size="md" className="bg-white text-blue-950 hover:bg-slate-100 font-bold shadow-sm min-h-[42px] shrink-0">
              <Link to="/reflection">
                Start 10s Reflection <ArrowRight className="ml-1.5 size-4 text-blue-700" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Clean 2-Column Dashboard Grid */}
        <div className="grid gap-5 md:grid-cols-2">
          {/* Card 1: 10-Second Post-Class Reflection */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                <Sparkles className="size-4" /> Quick Check-In
              </div>
              <h2 className="text-lg font-bold text-slate-900">Post-Class Reflection</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Log your self-reported confidence and struggle points immediately after class to generate your personalized study plan.
              </p>
            </div>

            <Button asChild size="md" className="w-full bg-primary hover:bg-primary/90 text-white font-bold min-h-[42px]">
              <Link to="/reflection">Reflect Now <ArrowRight className="ml-1.5 size-4" /></Link>
            </Button>
          </div>

          {/* Card 2: Upcoming Timetable & Action Context */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
                <Calendar className="size-4" /> Academic Context
              </div>
              <h2 className="text-lg font-bold text-slate-900">Timetable & Schedule</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect your class timetable to automatically align evening repair slots with tomorrow's upcoming lectures.
              </p>
            </div>

            <Button asChild size="md" variant="outline" className="w-full border-slate-300 text-slate-800 hover:bg-slate-50 font-bold min-h-[42px]">
              <Link to="/timetable">View Timetable <ArrowRight className="ml-1.5 size-4" /></Link>
            </Button>
          </div>

          {/* Card 3: Priority Repairs & Study Plan */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 md:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="size-4 text-primary" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Tonight's Study Plan & Priority Repairs</h2>
              </div>
              <Badge variant="outline" className="border-slate-200 text-slate-600 font-mono text-[10px]">
                {PRIORITY_REPAIRS.length} Pending
              </Badge>
            </div>

            {PRIORITY_REPAIRS.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="size-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No Pending Repairs Right Now</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Complete a post-class reflection to automatically generate targeted repair slots.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {PRIORITY_REPAIRS.map((c) => (
                  <div key={c.conceptId} className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="text-xs font-bold text-slate-900">{c.name}</h3>
                      <span className="font-mono text-[11px] font-bold text-primary">{c.stability}%</span>
                    </div>
                    <p className="text-[11px] text-slate-600">Focus: {c.weakest}</p>
                    <Button asChild size="sm" className="w-full text-xs font-bold bg-white text-slate-900 border border-slate-300 hover:bg-slate-100 min-h-[36px]">
                      <Link to="/repair" search={{ concept: c.name }}>Repair Gap</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}

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
