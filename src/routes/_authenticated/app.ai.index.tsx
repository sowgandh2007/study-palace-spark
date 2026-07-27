import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, MessageSquare, Map, Network, Activity, Repeat, BarChart3, FileQuestion, Swords, Compass } from "lucide-react";
import { motion, fadeUp, stagger, useReducedMotion } from "@/lib/motion";

export const Route = createFileRoute("/_authenticated/app/ai/")({
  component: AiHub,
});

const tiles = [
  { to: "/app/ai/assistant", label: "Study Assistant", desc: "Doubts, notes, flashcards, MCQs", icon: MessageSquare, tint: "from-violet-500 to-indigo-500" },
  { to: "/app/ai/roadmap", label: "Roadmap Generator", desc: "Personalized study plan", icon: Map, tint: "from-fuchsia-500 to-pink-500" },
  { to: "/app/ai/knowledge", label: "Knowledge Graph", desc: "Topic dependencies", icon: Network, tint: "from-emerald-500 to-teal-500" },
  { to: "/app/ai/weakness", label: "Weakness Analysis", desc: "What to revise next", icon: Activity, tint: "from-amber-500 to-orange-500" },
  { to: "/app/ai/revision", label: "Revision Planner", desc: "Spaced repetition", icon: Repeat, tint: "from-cyan-500 to-blue-500" },
  { to: "/app/ai/analytics", label: "Analytics", desc: "Weekly insights", icon: BarChart3, tint: "from-indigo-500 to-purple-500" },
  { to: "/app/ai/exam", label: "Exam Generator", desc: "Practice tests with feedback", icon: FileQuestion, tint: "from-rose-500 to-red-500" },
  { to: "/app/ai/battle", label: "Study Battle", desc: "Quiz your friends", icon: Swords, tint: "from-yellow-500 to-amber-500" },
  { to: "/app/ai/career", label: "Career Roadmap", desc: "Long-term milestones", icon: Compass, tint: "from-sky-500 to-indigo-500" },
] as const;

function AiHub() {
  const reduced = useReducedMotion();
  return (
    <div className="mx-auto max-w-md md:max-w-5xl lg:max-w-6xl px-5 pt-8">
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="relative grid h-11 w-11 place-items-center rounded-2xl gradient-brand glow">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
          {!reduced && (
            <motion.span
              className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-primary/50"
              animate={{ opacity: [0.15, 0.55, 0.15], scale: [1, 1.12, 1] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-black">AI Studio</h1>
          <p className="text-xs text-muted-foreground">Powered by Lovable AI</p>
        </div>
      </motion.div>

      <motion.div
        className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20"
        variants={stagger(0.06)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
      >
        {tiles.map((t) => {
          const Icon = t.icon;
          const scanIcon = t.to === "/app/ai/roadmap" || t.to === "/app/ai/weakness" || t.to === "/app/ai/analytics" || t.to === "/app/ai/knowledge";
          return (
            <motion.div key={t.to} variants={fadeUp}>
              <Link
                to={t.to}
                className="group relative block overflow-hidden rounded-3xl border border-border bg-card p-4 card-shadow transition-transform active:scale-[0.98]"
              >
                <div className={`relative grid h-10 w-10 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br ${t.tint} text-white`}>
                  <Icon className="relative z-10 h-5 w-5" />
                  {scanIcon && !reduced && (
                    <motion.span
                      aria-hidden
                      className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      animate={{ x: ["0%", "260%"] }}
                      transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 }}
                    />
                  )}
                </div>
                <p className="mt-3 text-sm font-bold">{t.label}</p>
                <p className="text-[11px] leading-tight text-muted-foreground">{t.desc}</p>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
