import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AssessmentResult, CheckInResponse, Role } from "./types";

export type EchoUser = { name: string; email: string; role: Role; cohort: string };

export const DEMO_ACCOUNTS: Record<Role, EchoUser & { password: string }> = {
  student: {
    name: "Ananya Sharma",
    email: "student@echo.edu",
    password: "echo1234",
    role: "student",
    cohort: "CSE — Semester 4 · Section B",
  },
  faculty: {
    name: "Dr. Rao",
    email: "faculty@echo.edu",
    password: "echo1234",
    role: "faculty",
    cohort: "CSE — Semester 4 · Section B",
  },
};

export type UploadedPlan = { timetableName: string; notesName: string; uploadedAt: string };

type EchoState = {
  user: EchoUser | null;
  checkIns: Record<string, CheckInResponse>;
  results: AssessmentResult[];
  upload: UploadedPlan | null;
};

const EMPTY: EchoState = { user: null, checkIns: {}, results: [], upload: null };
const KEY = "echo-state-v1";

type Ctx = EchoState & {
  hydrated: boolean;
  signIn: (email: string, password: string) => { ok: boolean; error?: string; role?: Role };
  signOut: () => void;
  setCheckIn: (classId: string, response: CheckInResponse) => void;
  addResult: (result: AssessmentResult) => void;
  setUpload: (upload: UploadedPlan) => void;
  latestFor: (conceptId: string) => AssessmentResult | undefined;
};

const EchoContext = createContext<Ctx | null>(null);

export function EchoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EchoState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setState({ ...EMPTY, ...(JSON.parse(raw) as EchoState) });
    } catch {
      /* ignore corrupt state */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable */
    }
  }, [state, hydrated]);

  const signIn = useCallback((email: string, password: string) => {
    const match = Object.values(DEMO_ACCOUNTS).find(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (!match) return { ok: false, error: "No account found for that email." };
    if (match.password !== password) return { ok: false, error: "Incorrect password." };
    const { password: _pw, ...user } = match;
    setState((s) => ({ ...s, user }));
    return { ok: true, role: user.role };
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      hydrated,
      signIn,
      signOut: () => setState((s) => ({ ...s, user: null })),
      setCheckIn: (classId, response) =>
        setState((s) => ({ ...s, checkIns: { ...s.checkIns, [classId]: response } })),
      addResult: (result) => setState((s) => ({ ...s, results: [result, ...s.results] })),
      setUpload: (upload) => setState((s) => ({ ...s, upload })),
      latestFor: (conceptId) => state.results.find((r) => r.conceptId === conceptId),
    }),
    [state, hydrated, signIn],
  );

  return <EchoContext.Provider value={value}>{children}</EchoContext.Provider>;
}

export function useEcho() {
  const ctx = useContext(EchoContext);
  if (!ctx) throw new Error("useEcho must be used inside EchoProvider");
  return ctx;
}
