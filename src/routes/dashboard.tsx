import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Search, Sparkles, BookOpen, BrainCircuit } from "lucide-react";
import { EchoNavbar } from "@/components/EchoNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEcho } from "@/lib/echo/store";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const { latestResult } = useEcho();
  const [query, setQuery] = useState("");

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const topic = query.trim() || "Binary Search";
    navigate({ to: "/learn", search: { topic } });
  }

  function handleLearnClick() {
    const topic = query.trim() || "Binary Search";
    navigate({ to: "/learn", search: { topic } });
  }

  function handleReflectClick() {
    const concept = query.trim() || "Binary Search";
    navigate({ to: "/reflection", search: { concept } });
  }

  return (
    <div className="min-h-screen bg-gradient-royal-ice-page selection:bg-primary/30 flex flex-col justify-between pb-12">
      {/* Subtle Global Header */}
      <EchoNavbar variant="light" />

      {/* Main Google-Homepage-Style Center Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 max-w-2xl mx-auto w-full text-center py-12 sm:py-20 space-y-8">
        {/* ECHO Branding & Central Question */}
        <div className="space-y-3 animate-in fade-in duration-300">
          <span className="text-xs font-mono font-bold tracking-widest text-primary uppercase bg-white/80 border border-primary/20 px-3 py-1 rounded-full shadow-sm">
            ECHO
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            What do you want to understand?
          </h1>
        </div>

        {/* Central Search Input Form */}
        <form onSubmit={handleSearchSubmit} className="w-full space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a topic or ask ECHO..."
              className="w-full bg-white/95 border border-slate-300 hover:border-slate-400 focus:border-primary text-slate-900 placeholder:text-slate-400 text-sm sm:text-base rounded-2xl pl-12 pr-4 min-h-[52px] shadow-sm transition-all"
            />
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              type="button"
              onClick={handleLearnClick}
              className="bg-primary hover:bg-primary/90 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-glow min-h-[44px] transition-all"
            >
              <BookOpen className="size-4 mr-2" /> Learn
            </Button>

            <Button
              type="button"
              onClick={handleReflectClick}
              variant="outline"
              className="bg-white/90 hover:bg-white text-slate-900 border-slate-300 font-bold text-sm px-6 py-2.5 rounded-xl min-h-[44px] shadow-sm transition-all"
            >
              <BrainCircuit className="size-4 mr-2 text-primary" /> Reflect
            </Button>
          </div>
        </form>

        {/* Small Understanding Indicator */}
        <div className="pt-8 border-t border-slate-200/60 w-full max-w-sm mx-auto">
          {latestResult ? (
            <div className="space-y-1">
              <div className="text-2xl font-extrabold font-mono text-slate-900">
                {latestResult.stabilityScore} <span className="text-xs text-slate-500 font-normal">/ 100</span>
              </div>
              <p className="text-xs font-bold text-primary tracking-wide">
                {latestResult.bandLabel}
              </p>
              <p className="text-[11px] text-slate-600 truncate max-w-xs mx-auto pt-0.5">
                {latestResult.conceptName}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <span className="text-xs font-mono text-slate-500 font-medium">
                Understanding not measured yet
              </span>
              <p className="text-[11px] text-slate-500">
                Complete a reflection check to measure stability
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="text-center text-[11px] text-slate-500 font-mono">
        Evidence-Based Conceptual Honesty Engine
      </footer>
    </div>
  );
}
