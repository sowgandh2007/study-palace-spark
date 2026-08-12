import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, RotateCcw, ShieldCheck } from "lucide-react";
import { EchoLogo } from "@/routes/index";
import { ThemeSelect } from "@/lib/theme";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/results")({
  component: ResultsPage,
});

function ResultsPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <EchoLogo />
          <ThemeSelect />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pt-8 space-y-6">
        <div className="rounded-2xl border border-border bg-card p-8 card-shadow text-center space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Latest Verification Probe Result</span>
          <h1 className="text-3xl font-extrabold tracking-tight">Understanding Stability Recorded</h1>

          <div className="pt-4 flex justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/assessment">Start New Probe <ArrowRight className="size-4 ml-2" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/dashboard">View Telemetry Dashboard</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
