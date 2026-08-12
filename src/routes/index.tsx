import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Users, Map, ShieldCheck, ArrowRight, BrainCircuit } from "lucide-react";
import { motion, fadeUp, stagger, useReducedMotion } from "@/lib/motion";
import { ThemeSelect } from "@/lib/theme";

export const Route = createFileRoute("/")({
  component: Landing,
});

const HEADLINE_LINES = [
  <>The Answer Is <span className="text-gradient">Correct</span>.</>,
  <>But Is the Understanding</>,
  <>Real?</>,
];

export function EchoLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 border border-primary/40 text-primary">
        <BrainCircuit className="h-5 w-5" />
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold tracking-tight text-foreground">ECHO</span>
        <span className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">Verification Engine</span>
      </div>
    </div>
  );
}

function Landing() {
  const reduced = useReducedMotion();

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-[color:var(--brand-2)]/15 blur-3xl" />
      </div>

      {!reduced && (
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden overflow-hidden sm:block">
          {[
            { size: 260, x: "10%", y: "20%", color: "bg-primary/15", d: 14 },
            { size: 200, x: "70%", y: "10%", color: "bg-[color:var(--brand-2)]/15", d: 18 },
            { size: 140, x: "20%", y: "70%", color: "bg-primary/20", d: 16 },
          ].map((o, i) => (
            <motion.span
              key={i}
              className={`absolute rounded-full blur-3xl ${o.color}`}
              style={{ width: o.size, height: o.size, left: o.x, top: o.y }}
              animate={{ x: [0, 30, -20, 0], y: [0, -25, 15, 0], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: o.d, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </div>
      )}

      <div className="relative mx-auto flex min-h-screen max-w-md md:max-w-4xl flex-col px-6 pt-14 pb-10 justify-center">
        <motion.div
          className="flex items-center justify-between gap-2"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <EchoLogo />
          <ThemeSelect />
        </motion.div>

        <div className="mt-16 flex-1">
          <motion.h1
            className="text-[2.5rem] md:text-[3.25rem] font-black leading-[1.08] tracking-tight"
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
            className="mt-5 max-w-2xl text-base text-muted-foreground leading-relaxed sm:text-lg"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
          >
            ECHO doesn't ask whether you know the answer. It asks whether your understanding survives — under variation, hidden assumptions, broken code, and unfamiliar ground.
          </motion.p>

          <motion.div
            className="mt-10 grid grid-cols-2 gap-3"
            variants={stagger(0.08, 0.7)}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={fadeUp}><FeatureChip icon={<Users className="h-4 w-4" />} label="Collaborative Probes" /></motion.div>
            <motion.div variants={fadeUp}><FeatureChip icon={<ShieldCheck className="h-4 w-4" />} label="Verification Activity" /></motion.div>
            <motion.div variants={fadeUp}><FeatureChip icon={<Map className="h-4 w-4" />} label="Adaptive Roadmaps" /></motion.div>
            <motion.div variants={fadeUp}><FeatureChip icon={<Sparkles className="h-4 w-4" />} label="Diagnostic Checks" /></motion.div>
          </motion.div>
        </div>

        <motion.div
          className="space-y-3 mt-10"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05, duration: 0.5 }}
        >
          <Link
            to="/auth"
            className="group flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-base font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            Enter ECHO Engine <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/auth"
            search={{ mode: "guest" } as never}
            className="block rounded-2xl border border-border bg-card/60 px-6 py-4 text-center text-base font-semibold backdrop-blur transition-all hover:border-primary/60 hover:bg-card active:bg-card"
          >
            Continue as Guest Verification
          </Link>
        </motion.div>
      </div>
    </main>
  );
}

function FeatureChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-card/60 px-3.5 py-3 text-sm font-medium backdrop-blur transition-colors hover:border-primary/50">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-foreground">{icon}</div>
      <span>{label}</span>
    </div>
  );
}
