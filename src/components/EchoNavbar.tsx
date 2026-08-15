import { useState, useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BrainCircuit,
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Sparkles,
  Settings,
  UserCheck,
  Menu,
  X,
  ChevronRight,
  Zap,
  Home,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
    { label: "LEARN", to: "/learn", icon: BookOpen },
    { label: "REFLECT", to: "/reflection", icon: Sparkles },
    { label: "STUDY PLAN", to: "/study-plan", icon: ClipboardList },
    { label: "VERIFY", to: "/assessment", icon: Zap },
  ];

  const bottomNavItems = [
    { label: "Home", to: "/", icon: Home },
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "Learn", to: "/learn", icon: BookOpen },
    { label: "Study Plan", to: "/study-plan", icon: ClipboardList },
    { label: "Reflect", to: "/reflection", icon: Sparkles },
  ];

  const isLight = variant === "light";

  return (
    <>
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

          {/* Mobile Top Actions */}
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

      {/* Mobile Slide-Over Drawer */}
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
                { label: "Stage 2: Learn", to: "/learn", icon: BookOpen, desc: "AI PDF Summary & Topic Learning" },
                { label: "Stage 3: Reflect", to: "/reflection", icon: Sparkles, desc: "Explain concepts in your own words" },
                { label: "Evidence Study Plan", to: "/study-plan", icon: ClipboardList, desc: "Targeted learning sequence" },
                { label: "Stage 4: Verify", to: "/assessment", icon: Zap, desc: "Diagnostic Probe & AI Exam Generator" },
                { label: "Class Timetable", to: "/timetable", icon: Calendar, desc: "Schedule & class timing" },
                { label: "AI System Settings", to: "/settings", icon: Settings, desc: "Gemini AI Engine status" },
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
                      "flex items-center justify-between p-3.5 rounded-2xl border transition-all touch-target",
                      isActive
                        ? "border-primary bg-primary/10 text-primary font-extrabold shadow-sm"
                        : "border-border/60 bg-card/40 hover:bg-card text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-xl border", isActive ? "border-primary/40 bg-primary/20 text-primary" : "border-border bg-background text-muted-foreground")}>
                        <IconComponent className="size-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">{item.label}</p>
                        <p className="text-[10px] text-muted-foreground">{item.desc}</p>
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

      {/* Mobile Fixed Bottom Stage Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 border-t border-border px-2 py-2 flex items-center justify-around shadow-lg backdrop-blur-lg">
        {bottomNavItems.map((item) => {
          const isActive = currentPath === item.to;
          const IconComp = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center p-1.5 rounded-xl transition-all min-w-[56px]",
                isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <IconComp className={cn("size-5 mb-0.5", isActive && "text-primary scale-110")} />
              <span className="text-[10px] font-mono">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
