import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Calendar,
  ClipboardList,
  Compass,
  Sparkles,
} from "lucide-react";
import { EchoNavbar } from "@/components/EchoNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEcho } from "@/lib/echo/store";

export const Route = createFileRoute("/plan")({
  component: PlanPage,
});

function PlanPage() {
  const { timetable } = useEcho();
  const [activeTab, setActiveTab] = useState<"study_plan" | "timetable" | "roadmap">("study_plan");

  const isBinarySearchTomorrow = timetable.some((t) =>
    t.topic.toLowerCase().includes("binary search")
  );

  return (
    <div className="min-h-screen text-foreground selection:bg-primary/30 pb-28 md:pb-20">
      <EchoNavbar variant="dark" />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-xs">
                STAGE 1: PLAN
              </Badge>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Academic Context & Prioritization</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
              Planning & Academic Context
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Align your evening study time budget with tomorrow's upcoming lectures and verified conceptual gaps.
            </p>
          </div>
        </div>

        {/* Stage Sub-Navigation Tabs */}
        <div className="glass-card p-1.5 flex items-center justify-between gap-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab("study_plan")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
              activeTab === "study_plan"
                ? "bg-primary text-white shadow-glow"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <ClipboardList className="size-4" /> Tonight's Study Plan
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("timetable")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
              activeTab === "timetable"
                ? "bg-primary text-white shadow-glow"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Calendar className="size-4" /> Class Timetable
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("roadmap")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
              activeTab === "roadmap"
                ? "bg-primary text-white shadow-glow"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Compass className="size-4" /> Learning Roadmap
          </button>
        </div>

        {/* Tab 1: Study Plan */}
        {activeTab === "study_plan" && (
          <div className="space-y-6">
            {isBinarySearchTomorrow && (
              <div className="glass-card p-6 border-warning/50 bg-warning/10 space-y-2">
                <div className="flex items-center gap-2 text-warning">
                  <ShieldAlert className="size-5 shrink-0" />
                  <h2 className="text-sm font-bold uppercase tracking-wider">Tomorrow-Aware Priority Alert</h2>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-200">
                  Binary Search is scheduled in tomorrow's 9:00 AM class. Your verified stability is currently <strong>50% (Fragile Understanding)</strong>. ECHO recommends completing tonight's 15m repair.
                </p>
              </div>
            )}

            <div className="glass-card p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Evening Repair Queue</h2>
                  <p className="text-xs text-slate-400">Targeted time allocation for diagnosed conceptual gaps</p>
                </div>
                <Button asChild size="sm" className="bg-primary hover:bg-primary/90 font-bold min-h-[40px]">
                  <Link to="/study-plan">Manage Budget →</Link>
                </Button>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl bg-black/30 border border-white/10 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">Binary Search</span>
                    <span className="flex items-center gap-1 font-mono text-xs text-slate-300">
                      <Clock className="size-3.5 text-primary" /> 15 min
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Diagnosed Gap: Transfer dimension deficit — spatial elimination logic breaks under non-standard setup.
                  </p>
                  <Button asChild size="sm" className="bg-primary hover:bg-primary/90 font-bold min-h-[38px]">
                    <Link to="/repair" search={{ concept: "Binary Search" }}>Launch Targeted Repair <ArrowRight className="size-3.5 ml-1" /></Link>
                  </Button>
                </div>

                <div className="rounded-xl bg-black/30 border border-white/10 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">Database Normalization (3NF)</span>
                    <span className="flex items-center gap-1 font-mono text-xs text-slate-300">
                      <Clock className="size-3.5 text-primary" /> 10 min
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Diagnosed Gap: Transitive dependency vs candidate key decomposition.
                  </p>
                  <Button asChild size="sm" variant="outline" className="border-white/20 text-white min-h-[38px]">
                    <Link to="/repair" search={{ concept: "Database Normalization (3NF)" }}>Launch Targeted Repair <ArrowRight className="size-3.5 ml-1" /></Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Timetable */}
        {activeTab === "timetable" && (
          <div className="glass-card p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Class Timetable & Schedule</h2>
                <p className="text-xs text-slate-400">Connect your classes to inform ECHO's tomorrow-aware prioritization</p>
              </div>
              <Button asChild size="sm" className="bg-primary hover:bg-primary/90 font-bold min-h-[40px]">
                <Link to="/timetable">Edit Schedule →</Link>
              </Button>
            </div>

            <div className="space-y-3">
              {[
                { time: "9:00 AM", subject: "Data Structures & Algorithms", topic: "Binary Search", date: "Tomorrow" },
                { time: "11:30 AM", subject: "Database Management Systems", topic: "Database Normalization (3NF)", date: "Tomorrow" },
                { time: "2:00 PM", subject: "Computer Networks", topic: "TCP Flow Control", date: "Tomorrow" },
              ].map((item, i) => (
                <div key={i} className="rounded-xl bg-black/30 border border-white/10 p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="font-mono text-[11px] font-bold text-primary">{item.time} · {item.date}</span>
                    <p className="text-xs font-bold text-white">{item.subject}</p>
                    <p className="text-[11px] text-slate-400">{item.topic}</p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="border-white/20 text-xs text-white min-h-[36px]">
                    <Link to="/reflection" search={{ concept: item.topic }}>Reflect Now</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Learning Roadmap */}
        {activeTab === "roadmap" && (
          <div className="glass-card p-6 sm:p-8 space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-lg font-bold text-white">Conceptual Learning Roadmap</h2>
              <p className="text-xs text-slate-400">Milestone progression across core domain concepts</p>
            </div>

            <div className="space-y-4">
              {[
                { concept: "Binary Search", status: "Fragile (50%)", band: "fragile", next: "Boundary condition variations" },
                { concept: "Database Normalization (3NF)", status: "Developing (66%)", band: "developing", next: "Lossless join verification" },
                { concept: "TCP Flow Control", status: "Surface (38%)", band: "surface", next: "Sliding window mechanics" },
              ].map((rm, i) => (
                <div key={i} className="rounded-xl bg-black/30 border border-white/10 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{rm.concept}</span>
                    <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-[10px] font-mono">
                      {rm.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-300">Next Milestone: {rm.next}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
