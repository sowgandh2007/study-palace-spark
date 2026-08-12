import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export const THEMES = [
  { id: "dark", label: "Dark", swatch: "#0a0a0f" },
  { id: "dim", label: "Dim", swatch: "#1e2029" },
  { id: "midnight", label: "Midnight", swatch: "#0d131f" },
  { id: "light", label: "Light", swatch: "#f1f3f9" },
  { id: "creamy", label: "Creamy", swatch: "#f2ede4" },
  { id: "sepia", label: "Sepia", swatch: "#e8dfd1" },
  { id: "mint", label: "Mint", swatch: "#e3f0e9" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

const STORAGE_KEY = "echo:theme";

type Ctx = { theme: ThemeId; setTheme: (t: ThemeId) => void };
const ThemeCtx = createContext<Ctx>({ theme: "dark", setTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("dark");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && (localStorage.getItem(STORAGE_KEY) as ThemeId | null)) || "dark";
    setThemeState(saved);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.classList.toggle("light", theme === "light");
    root.classList.toggle("dark", theme !== "light");
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  }, [theme]);

  return <ThemeCtx.Provider value={{ theme, setTheme: setThemeState }}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  return useContext(ThemeCtx);
}

export function ThemeSelect({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];
  return (
    <label className={"relative inline-flex items-center gap-2 rounded-full border border-border bg-card/70 py-1.5 pl-2 pr-2 text-xs font-semibold backdrop-blur transition-colors hover:border-primary/50 " + className}>
      <span
        aria-hidden
        className="h-4 w-4 rounded-full ring-2 ring-border"
        style={{ background: current.swatch }}
      />
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as ThemeId)}
        aria-label="Select theme"
        className="cursor-pointer appearance-none bg-transparent pr-4 text-foreground outline-none"
        style={{ backgroundImage: "none" }}
      >
        {THEMES.map((t) => (
          <option key={t.id} value={t.id} className="bg-background text-foreground">
            {t.label}
          </option>
        ))}
      </select>
    </label>
  );
}
