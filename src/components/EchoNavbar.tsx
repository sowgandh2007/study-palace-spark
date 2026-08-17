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
      <div className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center bg-primary border-2 border-border text-white group-hover:scale-105 group-active:translate-y-1 transition-transform">
        <BrainCircuit className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <span className="tracking-widest text-base sm:text-lg font-pixel text-primary group-hover:text-brand transition-colors">
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
          isScrolled ? "nav-scrolled-light shadow-[0_4px_0_rgba(45,27,78,1)]" : ""
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
                    "transition-all hover:text-brand py-1 font-retro whitespace-nowrap group flex items-center gap-1",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <span className={cn("inline-block transition-opacity text-brand", isActive ? "opacity-100" : "opacity-0 group-hover:opacity-50 animate-blink")}>►</span>
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
              className="p-2.5 bg-background border-2 border-border text-border hover:bg-muted hover:translate-y-[-2px] hover:shadow-[2px_2px_0_rgba(45,27,78,1)] transition-all"
              title="API & System Settings"
            >
              <Settings className="size-4" />
            </Link>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="retro-btn-outline font-retro"
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
              className="p-2 bg-background border-2 border-border text-border min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-muted hover:shadow-[2px_2px_0_rgba(45,27,78,1)] transition-all"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col bg-background text-foreground animate-in slide-in-from-right-full duration-200 border-l-4 border-border">
          <div className="flex items-center justify-between p-4 border-b-4 border-border bg-muted">
            <EchoLogo />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 bg-background border-2 border-border min-h-[44px] min-w-[44px] flex items-center justify-center text-border hover:bg-destructive hover:text-white"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-background">
            <div className="space-y-0.5">
              <span className="text-[10px] font-retro uppercase tracking-widest text-primary">All Features Navigation</span>
              <h2 className="text-lg font-retro tracking-tight text-foreground">ECHO Application</h2>
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
                      "flex items-center justify-between p-3.5 border-2 transition-all touch-target bg-card",
                      isActive
                        ? "border-primary text-primary font-retro shadow-[4px_4px_0_rgba(88,101,242,1)] -translate-y-1"
                        : "border-border text-foreground hover:shadow-[2px_2px_0_rgba(45,27,78,1)] hover:-translate-y-0.5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 border-2", isActive ? "border-primary bg-primary text-white" : "border-border bg-muted text-muted-foreground")}>
                        <IconComponent className="size-4" />
                      </div>
                      <div>
                        <p className="text-xs font-retro flex items-center gap-1">
                           {isActive && <span className="text-brand text-[10px] animate-blink">►</span>} {item.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-sans">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-border" />
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

    </>
  );
}
