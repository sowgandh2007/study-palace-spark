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

      <main className="mx-auto max-w-3xl px-6 pt-8 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Post-Class Starting Point</span>
          <h1 className="text-2xl font-bold tracking-tight mt-1">Tomorrow's Class Schedule</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Enter tomorrow's scheduled classes to enable post-class reflection check-ins and tomorrow-aware study prioritization.
          </p>
        </div>

        {/* Post-Class Reminder Prompt Banner */}
        {latestClass && (
          <div className="rounded-2xl border border-primary/40 bg-primary/10 p-6 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Sparkles className="size-4" /> Post-Class ECHO Prompt
            </span>
            <h2 className="text-lg font-bold">
              You just finished <span className="text-primary">{latestClass.subject} — {latestClass.topic}</span>.
            </h2>
            <p className="text-xs text-muted-foreground">How much did you actually understand today? Take 10 seconds to reflect.</p>

            <div className="pt-1">
              <Button asChild size="sm">
                <Link to="/reflection" search={{ concept: latestClass.topic }}>
                  Reflect on {latestClass.topic} <ArrowRight className="ml-1.5 size-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Add Class Form */}
        <form onSubmit={handleAdd} className="rounded-2xl border border-border bg-card p-6 card-shadow space-y-4">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Plus className="size-4 text-primary" /> Add Scheduled Class for Tomorrow
          </h2>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Time</label>
              <Input
                placeholder="e.g. 9:00 AM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-1 bg-background/60 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Subject</label>
              <Input
                required
                placeholder="e.g. Data Structures"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 bg-background/60 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Topic</label>
              <Input
                required
                placeholder="e.g. Binary Search"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="mt-1 bg-background/60 text-xs"
              />
            </div>
          </div>

          <Button type="submit" size="sm" className="w-full sm:w-auto">
            Add to Schedule
          </Button>
        </form>

        {/* Timetable List */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scheduled Tomorrow ({timetable.length})</h2>

          {timetable.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-xs text-muted-foreground">
              No classes entered for tomorrow yet.
            </div>
          ) : (
            <div className="space-y-2">
              {timetable.map((t) => (
                <div key={t.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4 card-shadow">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 border border-primary/30 text-primary">
                      <Clock className="size-4" />
                    </div>
                    <div>
                      <span className="font-mono text-[11px] text-primary font-semibold">{t.time}</span>
                      <h3 className="font-bold text-sm">{t.topic}</h3>
                      <p className="text-xs text-muted-foreground">{t.subject}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button asChild size="sm" variant="outline" className="text-xs">
                      <Link to="/reflection" search={{ concept: t.topic }}>Reflect <ArrowRight className="ml-1 size-3" /></Link>
                    </Button>
                    <button
                      onClick={() => deleteTimetableEntry(t.id)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
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
