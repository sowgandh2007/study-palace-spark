import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Plus, Trash2, ArrowRight, Clock, Settings, Sparkles } from "lucide-react";
import { EchoLogo, HeaderNav } from "@/routes/index";
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
    <div className="min-h-screen text-foreground selection:bg-primary/30 pb-20">
      <header className="sticky top-0 z-40 glass-header">
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

      <main className="mx-auto max-w-3xl px-6 pt-10 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Post-Class Starting Point</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">Tomorrow's Class Schedule</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Enter tomorrow's scheduled classes to enable post-class reflection check-ins and tomorrow-aware study prioritization.
          </p>
        </div>

        {/* Post-Class Reminder Prompt Banner */}
        {latestClass && (
          <div className="glass-card p-6 space-y-3 border-primary/40 bg-primary/10">
            <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Sparkles className="size-4" /> Post-Class ECHO Prompt
            </span>
            <h2 className="text-lg font-bold text-white">
              You just finished <span className="text-primary">{latestClass.subject} — {latestClass.topic}</span>.
            </h2>
            <p className="text-xs text-slate-300">How much did you actually understand today? Take 10 seconds to reflect.</p>

            <div className="pt-1">
              <Button asChild size="sm" className="bg-primary hover:bg-primary/90 font-bold shadow-glow">
                <Link to="/reflection" search={{ concept: latestClass.topic }}>
                  Reflect on {latestClass.topic} <ArrowRight className="ml-1.5 size-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Add Class Form */}
        <form onSubmit={handleAdd} className="glass-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus className="size-4 text-primary" /> Add Scheduled Class for Tomorrow
          </h2>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Time</label>
              <Input
                placeholder="e.g. 9:00 AM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-1 bg-black/40 border-white/10 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Subject</label>
              <Input
                required
                placeholder="e.g. Data Structures"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 bg-black/40 border-white/10 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Topic</label>
              <Input
                required
                placeholder="e.g. Binary Search"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="mt-1 bg-black/40 border-white/10 text-xs text-white"
              />
            </div>
          </div>

          <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90 font-bold shadow-glow w-full sm:w-auto">
            Add to Schedule
          </Button>
        </form>

        {/* Timetable List */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Scheduled Tomorrow ({timetable.length})</h2>

          {timetable.length === 0 ? (
            <div className="glass-card p-8 text-center text-xs text-slate-400">
              No classes entered for tomorrow yet.
            </div>
          ) : (
            <div className="space-y-3">
              {timetable.map((t) => (
                <div key={t.id} className="glass-card glass-card-hover p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/20 border border-primary/40 text-primary">
                      <Clock className="size-4" />
                    </div>
                    <div>
                      <span className="font-mono text-xs text-primary font-bold">{t.time}</span>
                      <h3 className="font-bold text-sm text-white">{t.topic}</h3>
                      <p className="text-xs text-slate-400">{t.subject}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button asChild size="sm" variant="outline" className="text-xs border-white/20 bg-white/5 hover:bg-white/10">
                      <Link to="/reflection" search={{ concept: t.topic }}>Reflect <ArrowRight className="ml-1 size-3" /></Link>
                    </Button>
                    <button
                      onClick={() => deleteTimetableEntry(t.id)}
                      className="p-2 text-slate-400 hover:text-destructive transition-colors"
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
