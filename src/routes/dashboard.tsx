import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Search, Sparkles, BookOpen, BrainCircuit, Trophy, Flame, Star } from "lucide-react";
import { EchoNavbar } from "@/components/EchoNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEcho } from "@/lib/echo/store";
import { StudyWorld } from "@/components/study-world/StudyWorld";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const { latestResult, userProfile, isLoggedIn, isLoadingData, refreshProfile } = useEcho();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (isLoggedIn) {
      refreshProfile();
    }
  }, [isLoggedIn, refreshProfile]);

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
    <StudyWorld pageContext="dashboard">
      <div className="min-h-screen flex flex-col justify-between pb-12 relative z-10">
        {/* Subtle Global Header */}
        <EchoNavbar variant="dark" />

      {/* Main Center Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 max-w-2xl mx-auto w-full text-center py-12 sm:py-20 space-y-8 relative z-10">
        {/* ECHO Branding & Central Question */}
        <div className="space-y-3 animate-in fade-in duration-300">
          <span className="text-xs font-retro font-bold tracking-widest text-primary uppercase bg-white border-2 border-border px-3 py-1 shadow-[2px_2px_0_rgba(45,27,78,1)] inline-block mb-2">
            SYS: ECHO_QUEST
          </span>
          <h1 className="text-3xl sm:text-5xl tracking-tight text-foreground leading-tight font-pixel uppercase drop-shadow-[4px_4px_0_rgba(45,27,78,0.15)]">
            Initialize Quest
          </h1>
        </div>

        {/* Central Search Input Form */}
        <form onSubmit={handleSearchSubmit} className="w-full space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-border/50 group-focus-within:text-primary transition-colors" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter subject vector..."
              className="w-full retro-input pl-12 pr-4 min-h-[60px]"
            />
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Button
              type="button"
              onClick={handleLearnClick}
              className="retro-btn-primary min-h-[50px] w-full sm:w-auto px-8"
            >
              <BookOpen className="size-5 mr-2" /> Start Quest
            </Button>

            <Button
              type="button"
              onClick={handleReflectClick}
              variant="outline"
              className="retro-btn-outline min-h-[50px] w-full sm:w-auto px-8"
            >
              <BrainCircuit className="size-5 mr-2" /> Reflect
            </Button>
          </div>
        </form>

        {/* Player Stats Panel */}
        <div className="pt-4 w-full max-w-md mx-auto">
          {/* Profile Stats Row (only when logged in with profile) */}
          {isLoggedIn && userProfile && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="retro-pixel-card bg-muted/30 p-3 text-center">
                <Trophy className="size-4 mx-auto mb-1 text-brand-2" />
                <div className="text-lg font-pixel text-foreground">{userProfile.level}</div>
                <div className="text-[10px] font-retro text-muted-foreground uppercase">Level</div>
              </div>
              <div className="retro-pixel-card bg-muted/30 p-3 text-center">
                <Star className="size-4 mx-auto mb-1 text-primary" />
                <div className="text-lg font-pixel text-foreground">{userProfile.xp}</div>
                <div className="text-[10px] font-retro text-muted-foreground uppercase">XP</div>
              </div>
              <div className="retro-pixel-card bg-muted/30 p-3 text-center">
                <Flame className="size-4 mx-auto mb-1 text-brand" />
                <div className="text-lg font-pixel text-foreground">{userProfile.streak}</div>
                <div className="text-[10px] font-retro text-muted-foreground uppercase">Streak</div>
              </div>
            </div>
          )}

          {/* Understanding Indicator */}
          <div className="retro-pixel-card bg-muted/30 pb-4">
            {latestResult ? (
              <div className="space-y-2">
                <div className="text-3xl font-pixel text-foreground">
                  {latestResult.stabilityScore} <span className="text-sm text-muted-foreground font-retro">XP</span>
                </div>
                <div className="w-full bg-white border-2 border-border h-4 relative">
                   <div className="absolute top-0 left-0 h-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, latestResult.stabilityScore))}%` }}></div>
                </div>
                <p className="text-sm font-retro text-primary font-bold uppercase mt-2">
                  RANK: {latestResult.bandLabel}
                </p>
                <p className="text-xs text-foreground font-sans truncate max-w-xs mx-auto">
                  {latestResult.conceptName}
                </p>
              </div>
            ) : (
              <div className="space-y-2 py-4">
                <span className="text-sm font-retro text-muted-foreground font-bold">
                  PLAYER UNRANKED
                </span>
                <p className="text-xs text-muted-foreground font-sans">
                  Complete a reflection check to gain XP
                </p>
              </div>
            )}
          </div>

          {/* Login prompt for guests */}
          {!isLoggedIn && (
            <div className="mt-4 text-center">
              <Link
                to="/auth"
                className="text-xs font-retro text-primary font-bold uppercase hover:underline"
              >
                ► Sign in to save progress
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="text-center text-[10px] text-muted-foreground font-retro uppercase tracking-widest relative z-10 pb-4">
        Evidence-Based Conceptual Honesty Engine v2.0 // Interactive Study World
      </footer>
    </div>
    </StudyWorld>
  );
}
