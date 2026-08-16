import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Plus, Trash2, ArrowRight, Clock, Sparkles, Compass, Loader2 } from "lucide-react";
import { EchoNavbar } from "@/components/EchoNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEcho } from "@/lib/echo/store";
import { toast } from "sonner";

export const Route = createFileRoute("/timetable")({
  component: TimetablePage,
});

export function TimetablePageContent() {
  const { timetable, addTimetableEntry, deleteTimetableEntry } = useEcho();

  const [time, setTime] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");

  // AI Roadmap Generator State
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);
  const [roadmapGoal, setRoadmapGoal] = useState("");
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
  const [generatedRoadmap, setGeneratedRoadmap] = useState<{ goal: string; steps: string[] } | null>(null);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !topic.trim()) return;

    addTimetableEntry({
      time: time.trim() || "9:00 AM",
      subject: subject.trim(),
      topic: topic.trim(),
      date: "Tomorrow",
    });

    setTime("");
    setSubject("");
    setTopic("");
    toast.success("Class added to tomorrow's timetable");
  }

  function handleGenerateRoadmap(e: React.FormEvent) {
    e.preventDefault();
    if (!roadmapGoal.trim()) return;

    setGeneratingRoadmap(true);
    setTimeout(() => {
      setGeneratedRoadmap({
        goal: roadmapGoal.trim(),
        steps: [
          "Phase 1: Core Mechanics & Mathematical Invariant",
          "Phase 2: Corner-case Edge Condition Analysis",
          "Phase 3: Real-world System Optimization & Transfer Problems",
        ],
      });
      setGeneratingRoadmap(false);
      toast.success("Generated AI Learning Roadmap!");
    }, 600);
  }

  const latestClass = timetable[0];

  return (
    <div className="min-h-screen bg-gradient-royal-ice-page selection:bg-primary/30 pb-28 md:pb-20">
      <EchoNavbar variant="light" />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-8">
        {/* Header with Small AI Roadmap Generator Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-primary">POST-CLASS STARTING POINT</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mt-1">Tomorrow's Class Schedule</h1>
            <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1 max-w-xl">
              Enter tomorrow's scheduled classes to enable post-class reflection check-ins and tomorrow-aware study prioritization.
            </p>
          </div>

          {/* Small AI Roadmap Generator Button */}
          <div className="shrink-0">
            <Button
              type="button"
              size="sm"
              onClick={() => setShowRoadmapModal(!showRoadmapModal)}
              className="bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl shadow-glow min-h-[40px] px-4 flex items-center gap-1.5"
            >
              <Compass className="size-4 text-sky-200" /> AI Roadmap Generator
            </Button>
          </div>
        </div>

        {/* AI Roadmap Generator Modal / Drawer */}
        {showRoadmapModal && (
          <div className="glass-card-light p-6 space-y-4 border-primary/40 bg-white/95 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <h3 className="text-sm font-bold text-slate-900">AI Learning Roadmap Generator</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRoadmapModal(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-900"
              >
                Close ✕
              </button>
            </div>

            <form onSubmit={handleGenerateRoadmap} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Target Learning Goal / Domain</label>
                <Input
                  value={roadmapGoal}
                  onChange={(e) => setRoadmapGoal(e.target.value)}
                  placeholder="e.g. Master Binary Search & Divide and Conquer, Normalization 3NF"
                  className="mt-1 bg-white border-slate-300 text-xs text-slate-900 min-h-[42px]"
                />
              </div>
              <Button type="submit" disabled={generatingRoadmap} size="sm" className="bg-primary hover:bg-primary/90 text-white font-bold text-xs min-h-[40px]">
                {generatingRoadmap ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Sparkles className="size-4 mr-1.5" />}
                Generate AI Roadmap
              </Button>
            </form>

            {generatedRoadmap && (
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-2 text-xs text-slate-800">
                <h4 className="font-bold text-primary">Roadmap for: {generatedRoadmap.goal}</h4>
                <div className="space-y-1.5 pt-1">
                  {generatedRoadmap.steps.map((st, idx) => (
                    <p key={idx} className="font-medium flex items-center gap-2 text-slate-700">
                      <span className="text-primary font-bold">{idx + 1}.</span> {st}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Post-Class Reminder Prompt Banner */}
        {latestClass && (
          <div className="glass-card-light p-6 space-y-3 border-primary/40 bg-white/95">
            <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Sparkles className="size-4" /> Post-Class ECHO Prompt
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              You just finished <span className="text-primary">{latestClass.subject} — {latestClass.topic}</span>.
            </h2>
            <p className="text-xs text-slate-700 font-medium">How much did you actually understand today? Take 10 seconds to reflect.</p>

            <div className="pt-1">
              <Button asChild size="sm" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-bold shadow-glow min-h-[44px]">
                <Link to="/reflection" search={{ concept: latestClass.topic }}>
                  Reflect on {latestClass.topic} <ArrowRight className="ml-1.5 size-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Add Class Form matching user image */}
        <form onSubmit={handleAdd} className="glass-card-light p-6 sm:p-8 space-y-5 rounded-2xl bg-white/95 border border-slate-200 shadow-md">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Plus className="size-4 text-primary" /> Add Scheduled Class for Tomorrow
          </h2>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">TIME</label>
              <Input
                placeholder="e.g. 9:00 AM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-1 bg-white border-slate-300 text-xs text-slate-900 min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">SUBJECT</label>
              <Input
                required
                placeholder="e.g. Data Structures"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 bg-white border-slate-300 text-xs text-slate-900 min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">TOPIC</label>
              <Input
                required
                placeholder="e.g. Binary Search"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="mt-1 bg-white border-slate-300 text-xs text-slate-900 min-h-[44px]"
              />
            </div>
          </div>

          <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90 text-white font-bold shadow-glow w-full sm:w-auto min-h-[44px] px-6">
            Add to Schedule
          </Button>
        </form>

        {/* Timetable List matching user image */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">SCHEDULED TOMORROW ({timetable.length})</h2>

          {timetable.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white/95 p-10 text-center text-xs text-slate-600 font-bold shadow-sm">
              No classes entered for tomorrow yet.
            </div>
          ) : (
            <div className="space-y-3">
              {timetable.map((t) => (
                <div key={t.id} className="glass-card-light glass-card-light-hover p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 border border-primary/30 text-primary">
                      <Clock className="size-4" />
                    </div>
                    <div>
                      <span className="font-mono text-xs text-primary font-bold">{t.time}</span>
                      <h3 className="font-bold text-sm text-slate-900">{t.topic}</h3>
                      <p className="text-xs text-slate-600 font-medium">{t.subject}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                    <Button asChild size="sm" variant="outline" className="text-xs border-slate-300 bg-white hover:bg-slate-50 text-slate-900 min-h-[40px]">
                      <Link to="/reflection" search={{ concept: t.topic }}>Reflect <ArrowRight className="ml-1 size-3" /></Link>
                    </Button>
                    <button
                      onClick={() => deleteTimetableEntry(t.id)}
                      className="p-2.5 text-slate-500 hover:text-rose-600 transition-colors rounded-xl border border-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Delete class"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function TimetablePage() {
  return <TimetablePageContent />;
}
