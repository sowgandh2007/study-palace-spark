import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { ApiConfig, LearnMaterial, Reflection, RepairActivity, StabilityResult, TimetableEntry } from "./types";
import { getApiConfig, saveApiConfig } from "./llm";
import {
  fetchTimetableEntries,
  insertTimetableEntry,
  deleteTimetableEntryDB,
  fetchReflections,
  insertReflection as insertReflectionDB,
  deleteReflectionDB,
  fetchAssessments,
  insertAssessment,
  fetchLearnMaterials,
  insertLearnMaterial as insertLearnMaterialDB,
  fetchRechecks,
  insertRecheck as insertRecheckDB,
  insertRepair as insertRepairDB,
  fetchUserProfile,
  addUserXP,
  isAuthenticated,
  type EchoProfile,
} from "./supabase-service";

type EchoStoreState = {
  timetable: TimetableEntry[];
  reflections: Reflection[];
  activeLearnMaterial: LearnMaterial | null;
  savedLearnMaterials: LearnMaterial[];
  latestResult: StabilityResult | null;
  activeRepair: RepairActivity | null;
  recheckHistory: { concept: string; beforeScore: number; afterScore: number; date: string }[];
  apiConfig: ApiConfig;
  userProfile: EchoProfile | null;
  isLoggedIn: boolean;
  isLoadingData: boolean;
};

type EchoStoreCtx = EchoStoreState & {
  addTimetableEntry: (entry: Omit<TimetableEntry, "id">) => void;
  deleteTimetableEntry: (id: string) => void;
  saveReflection: (reflection: Omit<Reflection, "id" | "createdAt">) => Reflection;
  deleteReflection: (id: string) => void;
  saveLearnMaterial: (mat: Omit<LearnMaterial, "id" | "createdAt">) => LearnMaterial;
  setActiveLearnMaterial: (mat: LearnMaterial | null) => void;
  setLatestResult: (result: StabilityResult) => void;
  saveStabilityResult: (result: StabilityResult) => void;
  setActiveRepair: (repair: RepairActivity | null) => void;
  completeRecheck: (concept: string, beforeScore: number, afterScore: number) => void;
  updateApiConfig: (config: ApiConfig) => void;
  refreshProfile: () => Promise<void>;
};

const EchoContext = createContext<EchoStoreCtx | null>(null);

const STORAGE_KEY = "echo_app_state_v4";

export function EchoProvider({ children }: { children: ReactNode }) {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [activeLearnMaterial, setActiveLearnMaterial] = useState<LearnMaterial | null>(null);
  const [savedLearnMaterials, setSavedLearnMaterials] = useState<LearnMaterial[]>([]);
  const [latestResult, setLatestResultState] = useState<StabilityResult | null>(null);
  const [activeRepair, setActiveRepair] = useState<RepairActivity | null>(null);
  const [recheckHistory, setRecheckHistory] = useState<
    { concept: string; beforeScore: number; afterScore: number; date: string }[]
  >([]);
  const [apiConfig, setApiConfigState] = useState<ApiConfig>(getApiConfig());
  const [userProfile, setUserProfile] = useState<EchoProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // ─── Initial data load: try Supabase first, fallback to localStorage ───
  useEffect(() => {
    async function loadData() {
      setIsLoadingData(true);

      const authed = await isAuthenticated();
      setIsLoggedIn(authed);

      if (authed) {
        // Load from Supabase
        try {
          const [dbTimetable, dbReflections, dbAssessments, dbMaterials, dbRechecks, profile] =
            await Promise.all([
              fetchTimetableEntries(),
              fetchReflections(),
              fetchAssessments(),
              fetchLearnMaterials(),
              fetchRechecks(),
              fetchUserProfile(),
            ]);

          if (dbTimetable.length > 0) setTimetable(dbTimetable);
          if (dbReflections.length > 0) setReflections(dbReflections);
          if (dbAssessments.length > 0) setLatestResultState(dbAssessments[0]!);
          if (dbMaterials.length > 0) {
            setSavedLearnMaterials(dbMaterials);
            setActiveLearnMaterial(dbMaterials[0]!);
          }
          if (dbRechecks.length > 0) setRecheckHistory(dbRechecks);
          if (profile) setUserProfile(profile);

          console.log("[ECHO] Data loaded from Supabase");
        } catch (e) {
          console.error("[ECHO] Supabase load failed, falling back to localStorage:", e);
          loadFromLocalStorage();
        }
      } else {
        // Not logged in: load from localStorage
        loadFromLocalStorage();
      }

      setIsLoadingData(false);
    }

    function loadFromLocalStorage() {
      try {
        if (typeof window !== "undefined") {
          const raw = window.localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed.timetable)) setTimetable(parsed.timetable);
            if (Array.isArray(parsed.reflections)) setReflections(parsed.reflections);
            if (parsed.activeLearnMaterial) setActiveLearnMaterial(parsed.activeLearnMaterial);
            if (Array.isArray(parsed.savedLearnMaterials)) setSavedLearnMaterials(parsed.savedLearnMaterials);
            if (parsed.latestResult) setLatestResultState(parsed.latestResult);
            if (parsed.activeRepair) setActiveRepair(parsed.activeRepair);
            if (Array.isArray(parsed.recheckHistory)) setRecheckHistory(parsed.recheckHistory);
          }
        }
      } catch {
        /* ignore storage parse errors */
      }
    }

    loadData();
  }, []);

  // ─── Persist to localStorage (always, as offline fallback) ───
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

  // ─── Timetable ───
  function addTimetableEntry(entry: Omit<TimetableEntry, "id">) {
    const newEntry: TimetableEntry = { ...entry, id: "tt-" + Date.now() };
    setTimetable((prev) => [newEntry, ...prev]);

    // Async persist to Supabase
    if (isLoggedIn) {
      insertTimetableEntry(entry).then((dbEntry) => {
        if (dbEntry) {
          // Replace the temp ID with the real DB ID
          setTimetable((prev) =>
            prev.map((t) => (t.id === newEntry.id ? { ...t, id: dbEntry.id } : t))
          );
        }
      });
    }
  }

  function deleteTimetableEntry(id: string) {
    setTimetable((prev) => prev.filter((t) => t.id !== id));
    if (isLoggedIn) {
      deleteTimetableEntryDB(id);
    }
  }

  // ─── Reflections ───
  function saveReflection(reflection: Omit<Reflection, "id" | "createdAt">): Reflection {
    const newRef: Reflection = {
      ...reflection,
      id: "ref-" + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setReflections((prev) => [newRef, ...prev]);

    // Async persist to Supabase
    if (isLoggedIn) {
      insertReflectionDB(reflection).then((dbRef) => {
        if (dbRef) {
          setReflections((prev) =>
            prev.map((r) => (r.id === newRef.id ? { ...r, id: dbRef.id } : r))
          );
        }
      });
    }

    return newRef;
  }

  function deleteReflection(id: string) {
    setReflections((prev) => prev.filter((r) => r.id !== id));
    if (isLoggedIn) {
      deleteReflectionDB(id);
    }
  }

  // ─── Learn Materials ───
  function saveLearnMaterial(mat: Omit<LearnMaterial, "id" | "createdAt">): LearnMaterial {
    const newMat: LearnMaterial = {
      ...mat,
      id: "lm-" + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setActiveLearnMaterial(newMat);
    setSavedLearnMaterials((prev) => [newMat, ...prev.filter((item) => item.topic !== newMat.topic)]);

    // Async persist to Supabase
    if (isLoggedIn) {
      insertLearnMaterialDB(mat).then((dbMat) => {
        if (dbMat) {
          setActiveLearnMaterial(dbMat);
          setSavedLearnMaterials((prev) =>
            prev.map((m) => (m.id === newMat.id ? dbMat : m))
          );
        }
      });
    }

    return newMat;
  }

  // ─── Stability Results ───
  function setLatestResult(result: StabilityResult) {
    setLatestResultState(result);
  }

  function saveStabilityResult(result: StabilityResult) {
    setLatestResultState(result);

    // Async persist to Supabase + award XP
    if (isLoggedIn) {
      insertAssessment(result).then((success) => {
        if (success) {
          // Award XP based on stability score
          const xpGain = Math.max(5, Math.round(result.stabilityScore / 5));
          addUserXP(xpGain).then(() => refreshProfile());
        }
      });
    }
  }

  // ─── Repairs ───
  function setActiveRepairAndPersist(repair: RepairActivity | null) {
    setActiveRepair(repair);
    if (isLoggedIn && repair) {
      insertRepairDB(repair);
    }
  }

  // ─── Rechecks ───
  function completeRecheck(concept: string, beforeScore: number, afterScore: number) {
    const item = { concept, beforeScore, afterScore, date: new Date().toLocaleTimeString() };
    setRecheckHistory((prev) => [item, ...prev]);

    if (isLoggedIn) {
      insertRecheckDB(concept, beforeScore, afterScore);
    }
  }

  // ─── API Config ───
  function updateApiConfig(config: ApiConfig) {
    setApiConfigState(config);
    saveApiConfig(config);
  }

  // ─── Profile Refresh ───
  const refreshProfile = useCallback(async () => {
    const profile = await fetchUserProfile();
    if (profile) setUserProfile(profile);
  }, []);

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
        userProfile,
        isLoggedIn,
        isLoadingData,
        addTimetableEntry,
        deleteTimetableEntry,
        saveReflection,
        deleteReflection,
        saveLearnMaterial,
        setActiveLearnMaterial,
        setLatestResult,
        saveStabilityResult,
        setActiveRepair: setActiveRepairAndPersist,
        completeRecheck,
        updateApiConfig,
        refreshProfile,
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
