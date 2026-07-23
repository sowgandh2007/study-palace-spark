import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, MessageSquare, Map, Network, Activity, Repeat, BarChart3, FileQuestion, Swords, Compass } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/ai")({
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
  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl gradient-brand glow">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-black">AI Studio</h1>
          <p className="text-xs text-muted-foreground">Powered by Lovable AI</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Link key={t.to} to={t.to} className="group rounded-3xl border border-border bg-card p-4 card-shadow transition-transform active:scale-[0.98]">
              <div className={`grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br ${t.tint} text-white`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-bold">{t.label}</p>
              <p className="text-[11px] leading-tight text-muted-foreground">{t.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
