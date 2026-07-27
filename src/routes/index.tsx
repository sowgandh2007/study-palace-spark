import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Users, Map, Flame, ArrowRight } from "lucide-react";
import { motion, fadeUp, stagger, useReducedMotion } from "@/lib/motion";
import { ThemeSelect } from "@/lib/theme";

export const Route = createFileRoute("/")({
  component: Landing,
});

const HEADLINE_LINES = [
  <>Study <span className="text-gradient">together</span>,</>,
  <>level up</>,
  <>together.</>,
];

function Landing() {
  const reduced = useReducedMotion();

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-[color:var(--brand-2)]/25 blur-3xl" />
      </div>

      {!reduced && (
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden overflow-hidden sm:block">
          {[
            { size: 260, x: "10%", y: "20%", color: "bg-primary/25", d: 14 },
            { size: 200, x: "70%", y: "10%", color: "bg-[color:var(--brand-2)]/25", d: 18 },
            { size: 180, x: "80%", y: "60%", color: "bg-fuchsia-500/20", d: 22 },
            { size: 140, x: "20%", y: "70%", color: "bg-indigo-500/25", d: 16 },
          ].map((o, i) => (
            <motion.span
              key={i}
              className={`absolute rounded-full blur-3xl ${o.color}`}
              style={{ width: o.size, height: o.size, left: o.x, top: o.y }}
              animate={{ x: [0, 30, -20, 0], y: [0, -25, 15, 0], opacity: [0.5, 0.85, 0.5] }}
              transition={{ duration: o.d, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </div>
      )}

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-6 pt-14 pb-10">
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="grid h-9 w-9 place-items-center rounded-xl gradient-brand glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">StudySphere</span>
        </motion.div>

        <div className="mt-16 flex-1">
          <motion.h1
            className="text-[2.75rem] font-black leading-[1.05] tracking-tight"
            variants={stagger(0.12, 0.15)}
            initial="hidden"
            animate="show"
          >
            {HEADLINE_LINES.map((line, i) => (
              <motion.span key={i} variants={fadeUp} className="block">
                {line}
              </motion.span>
            ))}
          </motion.h1>
          <motion.p
            className="mt-5 text-base text-muted-foreground"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
          >
            AI-powered study rooms, live focus tracking, streaks, XP and unlockable skill trees — with your friends.
          </motion.p>

          <motion.div
            className="mt-10 grid grid-cols-2 gap-3"
            variants={stagger(0.08, 0.7)}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={fadeUp}><FeatureChip icon={<Users className="h-4 w-4" />} label="Multiplayer rooms" /></motion.div>
            <motion.div variants={fadeUp}><FeatureChip icon={<Flame className="h-4 w-4" />} label="Daily streaks" /></motion.div>
            <motion.div variants={fadeUp}><FeatureChip icon={<Map className="h-4 w-4" />} label="AI Roadmaps" /></motion.div>
            <motion.div variants={fadeUp}><FeatureChip icon={<Sparkles className="h-4 w-4" />} label="AI missions" /></motion.div>
          </motion.div>
        </div>

        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05, duration: 0.5 }}
        >
          <Link
            to="/auth"
            className="group flex items-center justify-center gap-2 rounded-2xl gradient-brand px-6 py-4 text-base font-bold text-primary-foreground glow transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(139,92,246,0.55)] active:scale-[0.98]"
          >
            Get started <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/auth"
            search={{ mode: "guest" } as never}
            className="block rounded-2xl border border-border bg-card/60 px-6 py-4 text-center text-base font-semibold backdrop-blur transition-all hover:border-primary/60 hover:bg-card active:bg-card"
          >
            Continue as guest
          </Link>
        </motion.div>
      </div>
    </main>
  );
}

function FeatureChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border bg-card/60 px-3 py-3 text-sm font-medium backdrop-blur transition-colors hover:border-primary/50">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-foreground">{icon}</div>
      {label}
    </div>
  );
}
