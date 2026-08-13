import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Plus, Trash2, ArrowRight, Clock, Settings, Sparkles } from "lucide-react";
import { EchoNavbar } from "@/components/EchoNavbar";
import { ThemeSelect } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEcho } from "@/lib/echo/store";
import { toast } from "sonner";

export const Route = createFileRoute("/timetable")({
  component: TimetablePage,
});

function TimetablePage() {
  const { timetable, addTimetableEntry, deleteTimetableEntry } = useEcho();

  const [time, setTime] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !topic.trim()) return;

    addTimetableEntry({
      time: time.trim() || "10:00 AM",
      subject: subject.trim(),
      topic: topic.trim(),
      date: "Tomorrow",
    });

    setTime("");
    setSubject("");
    setTopic("");
    toast.success("Class added to tomorrow's timetable");
  }

  const latestClass = timetable[0];

  return (
    <div className="min-h-screen bg-gradient-royal-ice-page selection:bg-primary/30 pb-28 md:pb-20">
      <EchoNavbar variant="light" />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-8">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-primary">Post-Class Starting Point</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">Tomorrow's Class Schedule</h1>
          <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1">
            Enter tomorrow's scheduled classes to enable post-class reflection check-ins and tomorrow-aware study prioritization.
          </p>
        </div>

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

        {/* Add Class Form */}
        <form onSubmit={handleAdd} className="glass-card-light p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Plus className="size-4 text-primary" /> Add Scheduled Class for Tomorrow
          </h2>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Time</label>
              <Input
                placeholder="e.g. 9:00 AM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-1 bg-white border-slate-300 text-xs text-slate-900 min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Subject</label>
              <Input
                required
                placeholder="e.g. Data Structures"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 bg-white border-slate-300 text-xs text-slate-900 min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Topic</label>
              <Input
                required
                placeholder="e.g. Binary Search"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="mt-1 bg-white border-slate-300 text-xs text-slate-900 min-h-[44px]"
              />
            </div>
          </div>

          <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90 text-white font-bold shadow-glow w-full sm:w-auto min-h-[44px]">
            Add to Schedule
          </Button>
        </form>

        {/* Timetable List */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Scheduled Tomorrow ({timetable.length})</h2>

          {timetable.length === 0 ? (
            <div className="glass-card-light p-8 text-center text-xs text-slate-600 font-medium">
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
