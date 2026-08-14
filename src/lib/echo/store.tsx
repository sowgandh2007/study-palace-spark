import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { ApiConfig, LearnMaterial, Reflection, RepairActivity, StabilityResult, TimetableEntry } from "./types";
import { getApiConfig, saveApiConfig } from "./llm";

type EchoStoreState = {
  timetable: TimetableEntry[];
  reflections: Reflection[];
  activeLearnMaterial: LearnMaterial | null;
  savedLearnMaterials: LearnMaterial[];
  latestResult: StabilityResult | null;
  activeRepair: RepairActivity | null;
  recheckHistory: { concept: string; beforeScore: number; afterScore: number; date: string }[];
  apiConfig: ApiConfig;
};

type EchoStoreCtx = EchoStoreState & {
  addTimetableEntry: (entry: Omit<TimetableEntry, "id">) => void;
  deleteTimetableEntry: (id: string) => void;
  saveReflection: (reflection: Omit<Reflection, "id" | "createdAt">) => Reflection;
  deleteReflection: (id: string) => void;
  saveLearnMaterial: (mat: Omit<LearnMaterial, "id" | "createdAt">) => LearnMaterial;
  setActiveLearnMaterial: (mat: LearnMaterial | null) => void;
  setLatestResult: (result: StabilityResult) => void;
  setActiveRepair: (repair: RepairActivity | null) => void;
  completeRecheck: (concept: string, beforeScore: number, afterScore: number) => void;
  updateApiConfig: (config: ApiConfig) => void;
};

const EchoContext = createContext<EchoStoreCtx | null>(null);

const STORAGE_KEY = "echo_app_state_v4";

export function EchoProvider({ children }: { children: ReactNode }) {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [activeLearnMaterial, setActiveLearnMaterial] = useState<LearnMaterial | null>(null);
  const [savedLearnMaterials, setSavedLearnMaterials] = useState<LearnMaterial[]>([]);
  const [latestResult, setLatestResult] = useState<StabilityResult | null>(null);
  const [activeRepair, setActiveRepair] = useState<RepairActivity | null>(null);
  const [recheckHistory, setRecheckHistory] = useState<
    { concept: string; beforeScore: number; afterScore: number; date: string }[]
  >([]);
  const [apiConfig, setApiConfigState] = useState<ApiConfig>(getApiConfig());

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.timetable)) setTimetable(parsed.timetable);
          if (Array.isArray(parsed.reflections)) setReflections(parsed.reflections);
          if (parsed.activeLearnMaterial) setActiveLearnMaterial(parsed.activeLearnMaterial);
          if (Array.isArray(parsed.savedLearnMaterials)) setSavedLearnMaterials(parsed.savedLearnMaterials);
          if (parsed.latestResult) setLatestResult(parsed.latestResult);
          if (parsed.activeRepair) setActiveRepair(parsed.activeRepair);
          if (Array.isArray(parsed.recheckHistory)) setRecheckHistory(parsed.recheckHistory);
        }
      }
    } catch {
      /* ignore storage parse errors */
    }
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            timetable,
            reflections,
            activeLearnMaterial,
            savedLearnMaterials,
            latestResult,
            activeRepair,
            recheckHistory,
          })
        );
      }
    } catch {
      /* ignore storage write errors */
    }
  }, [timetable, reflections, activeLearnMaterial, savedLearnMaterials, latestResult, activeRepair, recheckHistory]);

  function addTimetableEntry(entry: Omit<TimetableEntry, "id">) {
    const newEntry: TimetableEntry = { ...entry, id: "tt-" + Date.now() };
    setTimetable((prev) => [newEntry, ...prev]);
  }

  function deleteTimetableEntry(id: string) {
    setTimetable((prev) => prev.filter((t) => t.id !== id));
  }

  function saveReflection(reflection: Omit<Reflection, "id" | "createdAt">): Reflection {
    const newRef: Reflection = {
      ...reflection,
      id: "ref-" + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setReflections((prev) => [newRef, ...prev]);
    return newRef;
  }

  function deleteReflection(id: string) {
    setReflections((prev) => prev.filter((r) => r.id !== id));
  }

  function saveLearnMaterial(mat: Omit<LearnMaterial, "id" | "createdAt">): LearnMaterial {
    const newMat: LearnMaterial = {
      ...mat,
      id: "lm-" + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setActiveLearnMaterial(newMat);
    setSavedLearnMaterials((prev) => [newMat, ...prev.filter((item) => item.topic !== newMat.topic)]);
    return newMat;
  }

  function completeRecheck(concept: string, beforeScore: number, afterScore: number) {
    const item = { concept, beforeScore, afterScore, date: new Date().toLocaleTimeString() };
    setRecheckHistory((prev) => [item, ...prev]);
  }

  function updateApiConfig(config: ApiConfig) {
    setApiConfigState(config);
    saveApiConfig(config);
  }

  return (
    <EchoContext.Provider
      value={{
        timetable,
        reflections,
        activeLearnMaterial,
        savedLearnMaterials,
        latestResult,
        activeRepair,
        recheckHistory,
        apiConfig,
        addTimetableEntry,
        deleteTimetableEntry,
        saveReflection,
        deleteReflection,
        saveLearnMaterial,
        setActiveLearnMaterial,
        setLatestResult,
        setActiveRepair,
        completeRecheck,
        updateApiConfig,
      }}
    >
      {children}
    </EchoContext.Provider>
  );
}

export function useEcho() {
  const ctx = useContext(EchoContext);
  if (!ctx) throw new Error("useEcho must be used inside EchoProvider");
  return ctx;
}
