import { useState, useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BrainCircuit,
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Sparkles,
  Users,
  Settings,
  UserCheck,
  Menu,
  X,
  ChevronRight,
  Zap,
  Home,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeSelect } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface EchoNavbarProps {
  variant?: "dark" | "light";
}

export function EchoLogo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-bold text-foreground group shrink-0">
      <div className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-xl bg-primary/20 border border-primary/40 text-primary shadow-glow group-hover:scale-105 transition-transform">
        <BrainCircuit className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <span className="tracking-tight text-base sm:text-lg font-extrabold font-mono bg-gradient-to-r from-blue-400 via-sky-300 to-primary bg-clip-text text-transparent">
        ECHO
      </span>
    </Link>
  );
}

export function EchoNavbar({ variant = "dark" }: EchoNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  // 6. Nav on scroll performance hook (no heavy backdrop-filter blur)
  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 50);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "HOME", to: "/", icon: Home },
    { label: "DASHBOARD", to: "/dashboard", icon: LayoutDashboard },
    { label: "TIMETABLE", to: "/timetable", icon: Calendar },
    { label: "STUDY PLAN", to: "/study-plan", icon: ClipboardList },
    { label: "FACULTY", to: "/faculty", icon: Users },
  ];

  const bottomNavItems = [
    { label: "Home", to: "/", icon: Home },
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "Timetable", to: "/timetable", icon: Calendar },
    { label: "Study Plan", to: "/study-plan", icon: ClipboardList },
    { label: "Reflect", to: "/reflection", icon: Sparkles },
  ];

  const isLight = variant === "light";

  return (
    <>
      {/* 6. Sticky Header Navigation with High-Performance Scroll Transition */}
      <header
        className={cn(
          "sticky top-0 z-40 w-full nav-scroll-base",
          isScrolled
            ? isLight
              ? "nav-scrolled-light"
              : "nav-scrolled-dark"
            : isLight
            ? "glass-header-light"
            : "glass-header"
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3.5 sm:px-6 py-3">
          <EchoLogo />

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-6 text-[11px] lg:text-xs font-bold uppercase tracking-wider">
            {navLinks.map((link) => {
              const isActive = currentPath === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "transition-colors hover:text-primary py-1 border-b-2 font-mono whitespace-nowrap",
                    isActive
                      ? "border-primary text-primary font-extrabold"
                      : "border-transparent text-muted-foreground"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeSelect />
            <Link
              to="/settings"
              className={cn(
                "p-2.5 rounded-xl border transition-colors",
                isLight
                  ? "border-slate-200 text-slate-700 hover:text-primary hover:bg-slate-100"
                  : "border-white/10 text-slate-300 hover:text-white hover:bg-white/5"
              )}
              title="API & System Settings"
            >
              <Settings className="size-4" />
            </Link>
            <Button
              asChild
              size="sm"
              variant="outline"
              className={cn(
                "font-bold text-xs whitespace-nowrap cta-btn-outline",
                isLight ? "border-slate-300 text-slate-900 bg-white hover:bg-slate-50" : "border-white/20 bg-white/5 hover:bg-white/10 text-white"
              )}
            >
              <Link to="/login">Sign In</Link>
            </Button>
          </div>

          {/* Mobile Top Actions (Theme Select + Hamburger) */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeSelect />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={cn(
                "p-2 rounded-xl border min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors shadow-sm",
                isLight
                  ? "border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
                  : "border-white/20 bg-white/10 text-white hover:bg-white/20"
              )}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer / Full Feature Navigation Modal */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col bg-background/95 text-foreground animate-in fade-in duration-200">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <EchoLogo />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl border border-border min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">All Features Navigation</span>
              <h2 className="text-lg font-bold tracking-tight text-foreground">ECHO Application</h2>
            </div>

            <nav className="space-y-2">
              {[
                { label: "Home / Overview", to: "/", icon: Home, desc: "Evidence-Based Honesty Engine" },
                { label: "Student Dashboard", to: "/dashboard", icon: LayoutDashboard, desc: "Real-time stability telemetry" },
                { label: "Class Timetable", to: "/timetable", icon: Calendar, desc: "Tomorrow's schedule & reflections" },
                { label: "Personalized Study Plan", to: "/study-plan", icon: ClipboardList, desc: "Tonight's time budget & repairs" },
                { label: "Post-Class Reflection", to: "/reflection", icon: Sparkles, desc: "10-second confidence check-in" },
                { label: "3-Question Diagnostic Probe", to: "/assessment", icon: Zap, desc: "Direct, Explain & Transfer MCQs" },
                { label: "Faculty Cohort Portal", to: "/faculty", icon: Users, desc: "Classroom stability analytics" },
                { label: "AI API & Model Settings", to: "/settings", icon: Settings, desc: "Gemini, OpenAI or Built-in Mode" },
                { label: "Sign In / Profile", to: "/login", icon: UserCheck, desc: "Student session login" },
              ].map((item) => {
                const isActive = currentPath === item.to;
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between p-3.5 rounded-2xl border transition-all min-h-[52px]",
                      isActive
                        ? "border-primary bg-primary/20 text-white font-bold"
                        : "border-border bg-card/60 hover:bg-card text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 border border-primary/30 text-primary">
                        <IconComponent className="size-4" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold leading-tight">{item.label}</p>
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Sticky Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-header border-t border-border px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="flex items-center justify-around">
          {bottomNavItems.map((item) => {
            const isActive = currentPath === item.to;
            const IconComponent = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center min-h-[46px] min-w-[52px] px-1.5 py-1 rounded-xl transition-all",
                  isActive
                    ? "text-primary font-bold bg-primary/15"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <IconComponent className={cn("size-4 sm:size-5", isActive && "scale-110")} />
                <span className="text-[9px] sm:text-[10px] font-bold tracking-tight mt-0.5 whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center min-h-[46px] min-w-[52px] px-1.5 py-1 rounded-xl text-muted-foreground hover:text-foreground transition-all"
          >
            <Sliders className="size-4 sm:size-5" />
            <span className="text-[9px] sm:text-[10px] font-bold tracking-tight mt-0.5 whitespace-nowrap">More</span>
          </button>
        </div>
      </div>
    </>
  );
}
