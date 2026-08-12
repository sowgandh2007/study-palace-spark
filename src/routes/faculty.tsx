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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Faculty Cohort Telemetry Portal</span>
            <h1 className="text-2xl font-bold tracking-tight mt-1">{FACULTY_CLASS.cohort}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{FACULTY_CLASS.students} Enrolled Students · Overall Class Stability: {FACULTY_CLASS.avgStability}%</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {FACULTY_CLASS.concepts.map((c) => (
            <div key={c.conceptId} className="rounded-2xl border border-border bg-card p-5 card-shadow space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold">{c.name}</h3>
                  <p className="text-xs text-muted-foreground">{c.assessed} / {FACULTY_CLASS.students} Assessed</p>
                </div>
                <span className="font-mono text-xl font-bold">{c.avgStability}%</span>
              </div>

              {/* Confident But Fragile Warning */}
              <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs flex items-center gap-2 text-warning">
                <ShieldAlert className="size-4 shrink-0" />
                <span><strong className="font-mono">{c.confidentButFragile}</strong> students high confidence, fragile understanding.</span>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Cohort Misconception Breakdown</p>
                <ul className="space-y-2">
                  {c.misconceptions.map((m, i) => (
                    <li key={i} className="rounded-lg bg-background/50 border border-border/50 p-2 text-xs flex justify-between gap-2">
                      <span className="text-muted-foreground">{m.text}</span>
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
