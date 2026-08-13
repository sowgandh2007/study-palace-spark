import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert, Users, Settings } from "lucide-react";
import { EchoLogo, HeaderNav } from "@/routes/index";
import { ThemeSelect } from "@/lib/theme";
import { FACULTY_CLASS } from "@/lib/echo/data";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/faculty")({
  component: FacultyPage,
});

function FacultyPage() {
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Faculty Cohort Telemetry Portal</span>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">{FACULTY_CLASS.cohort}</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">{FACULTY_CLASS.students} Enrolled Students · Overall Class Stability: {FACULTY_CLASS.avgStability}%</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {FACULTY_CLASS.concepts.map((c) => (
            <div key={c.conceptId} className="glass-card glass-card-hover p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">{c.name}</h3>
                  <p className="text-xs text-slate-400">{c.assessed} / {FACULTY_CLASS.students} Assessed</p>
                </div>
                <span className="font-mono text-2xl font-extrabold text-primary">{c.avgStability}%</span>
              </div>

              {/* Confident But Fragile Warning */}
              <div className="rounded-xl border border-warning/40 bg-warning/10 p-3.5 text-xs flex items-center gap-2 text-warning">
                <ShieldAlert className="size-4 shrink-0" />
                <span><strong className="font-mono">{c.confidentButFragile}</strong> students high confidence, fragile understanding.</span>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Cohort Misconception Breakdown</p>
                <ul className="space-y-2">
                  {c.misconceptions.map((m, i) => (
                    <li key={i} className="rounded-xl bg-black/40 border border-white/10 p-3 text-xs flex justify-between gap-2">
                      <span className="text-slate-300">{m.text}</span>
                      <span className="font-mono font-bold text-destructive">{m.share}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
