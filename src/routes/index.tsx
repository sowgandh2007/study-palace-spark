import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Users, Map, Flame, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-[color:var(--brand-2)]/25 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-6 pt-14 pb-10">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl gradient-brand glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">StudySphere</span>
        </div>

        <div className="mt-16 flex-1">
          <h1 className="text-[2.75rem] font-black leading-[1.05] tracking-tight">
            Study <span className="text-gradient">together</span>,
            <br />level up <br />together.
          </h1>
          <p className="mt-5 text-base text-muted-foreground">
            AI-powered study rooms, live focus tracking, streaks, XP and unlockable skill trees — with your friends.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-3">
            <FeatureChip icon={<Users className="h-4 w-4" />} label="Multiplayer rooms" />
            <FeatureChip icon={<Flame className="h-4 w-4" />} label="Daily streaks" />
            <FeatureChip icon={<Trophy className="h-4 w-4" />} label="Leaderboards" />
            <FeatureChip icon={<Sparkles className="h-4 w-4" />} label="AI missions" />
          </div>
        </div>

        <div className="space-y-3">
          <Link
            to="/auth"
            className="flex items-center justify-center gap-2 rounded-2xl gradient-brand px-6 py-4 text-base font-bold text-primary-foreground glow transition-transform active:scale-[0.98]"
          >
            Get started <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            to="/auth"
            search={{ mode: "guest" } as never}
            className="block rounded-2xl border border-border bg-card/60 px-6 py-4 text-center text-base font-semibold backdrop-blur transition-colors active:bg-card"
          >
            Continue as guest
          </Link>
        </div>
      </div>
    </main>
  );
}

function FeatureChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border bg-card/60 px-3 py-3 text-sm font-medium backdrop-blur">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-foreground">{icon}</div>
      {label}
    </div>
  );
}
