import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Home, Users, Trophy, Target, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppLayout,
});

const tabs = [
  { to: "/app", label: "Home", icon: Home, exact: true },
  { to: "/app/rooms", label: "Rooms", icon: Users, exact: false },
  { to: "/app/leaderboard", label: "Ranks", icon: Trophy, exact: false },
  { to: "/app/missions", label: "Missions", icon: Target, exact: false },
  { to: "/app/profile", label: "Profile", icon: User, exact: false },
] as const;

function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="relative min-h-screen bg-background pb-24">
      <Outlet />
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto grid max-w-md grid-cols-5 px-2 py-2">
          {tabs.map((t) => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className="flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-medium transition-colors"
              >
                <div
                  className={
                    "grid h-9 w-9 place-items-center rounded-xl transition-all " +
                    (active ? "gradient-brand text-primary-foreground glow" : "text-muted-foreground")
                  }
                >
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <span className={active ? "text-foreground" : "text-muted-foreground"}>{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
