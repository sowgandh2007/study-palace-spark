/**
 * ECHO Supabase Service Layer
 * Centralizes all database operations for the ECHO learning loop.
 * Each function handles its own error handling and returns null/empty on failure
 * so the UI can gracefully fall back to localStorage.
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  TimetableEntry,
  Reflection,
  LearnMaterial,
  StabilityResult,
  RepairActivity,
} from "./types";

// ─── Helpers ──────────────────────────────────────────────

async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const uid = await getCurrentUserId();
  return uid !== null;
}

// ─── Timetable ────────────────────────────────────────────

export async function fetchTimetableEntries(): Promise<TimetableEntry[]> {
  const uid = await getCurrentUserId();
  if (!uid) return [];

  try {
    const { data, error } = await supabase
      .from("echo_timetable" as any)
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ECHO DB] fetchTimetable error:", error.message);
      return [];
    }

    return (data ?? []).map((row: any) => ({
      id: row.id,
      time: row.time,
      subject: row.subject,
      topic: row.topic,
      date: row.date,
    }));
  } catch (e) {
    console.error("[ECHO DB] fetchTimetable exception:", e);
    return [];
  }
}

export async function insertTimetableEntry(
  entry: Omit<TimetableEntry, "id">
): Promise<TimetableEntry | null> {
  const uid = await getCurrentUserId();
  if (!uid) return null;

  try {
    const { data, error } = await supabase
      .from("echo_timetable" as any)
      .insert({
        user_id: uid,
        time: entry.time,
        subject: entry.subject,
        topic: entry.topic,
        date: entry.date,
      } as any)
      .select()
      .single();

    if (error) {
      console.error("[ECHO DB] insertTimetable error:", error.message);
      return null;
    }

    const row = data as any;
    return {
      id: row.id,
      time: row.time,
      subject: row.subject,
      topic: row.topic,
      date: row.date,
    };
  } catch (e) {
    console.error("[ECHO DB] insertTimetable exception:", e);
    return null;
  }
}

export async function deleteTimetableEntryDB(id: string): Promise<boolean> {
  const uid = await getCurrentUserId();
  if (!uid) return false;

  try {
    const { error } = await supabase
      .from("echo_timetable" as any)
      .delete()
      .eq("id", id)
      .eq("user_id", uid);

    if (error) {
      console.error("[ECHO DB] deleteTimetable error:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[ECHO DB] deleteTimetable exception:", e);
    return false;
  }
}

// ─── Reflections ──────────────────────────────────────────

export async function fetchReflections(): Promise<Reflection[]> {
  const uid = await getCurrentUserId();
  if (!uid) return [];

  try {
    const { data, error } = await supabase
      .from("echo_reflections" as any)
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ECHO DB] fetchReflections error:", error.message);
      return [];
    }

    return (data ?? []).map((row: any) => ({
      id: row.id,
      conceptId: row.concept_id,
      conceptName: row.concept_name,
      confidence: row.confidence,
      understoodText: row.understood_text ?? "",
      notUnderstoodText: row.not_understood_text ?? "",
      createdAt: row.created_at,
    }));
  } catch (e) {
    console.error("[ECHO DB] fetchReflections exception:", e);
    return [];
  }
}

export async function insertReflection(
  reflection: Omit<Reflection, "id" | "createdAt">
): Promise<Reflection | null> {
  const uid = await getCurrentUserId();
  if (!uid) return null;

  try {
    const { data, error } = await supabase
      .from("echo_reflections" as any)
      .insert({
        user_id: uid,
        concept_id: reflection.conceptId,
        concept_name: reflection.conceptName,
        confidence: reflection.confidence,
        understood_text: reflection.understoodText,
        not_understood_text: reflection.notUnderstoodText,
      } as any)
      .select()
      .single();

    if (error) {
      console.error("[ECHO DB] insertReflection error:", error.message);
      return null;
    }

    const row = data as any;
    return {
      id: row.id,
      conceptId: row.concept_id,
      conceptName: row.concept_name,
      confidence: row.confidence,
      understoodText: row.understood_text ?? "",
      notUnderstoodText: row.not_understood_text ?? "",
      createdAt: row.created_at,
    };
  } catch (e) {
    console.error("[ECHO DB] insertReflection exception:", e);
    return null;
  }
}

export async function deleteReflectionDB(id: string): Promise<boolean> {
  const uid = await getCurrentUserId();
  if (!uid) return false;

  try {
    const { error } = await supabase
      .from("echo_reflections" as any)
      .delete()
      .eq("id", id)
      .eq("user_id", uid);

    if (error) {
      console.error("[ECHO DB] deleteReflection error:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[ECHO DB] deleteReflection exception:", e);
    return false;
  }
}

// ─── Assessments (Stability Results) ─────────────────────

export async function fetchAssessments(): Promise<StabilityResult[]> {
  const uid = await getCurrentUserId();
  if (!uid) return [];

  try {
    const { data, error } = await supabase
      .from("echo_assessments" as any)
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ECHO DB] fetchAssessments error:", error.message);
      return [];
    }

    return (data ?? []).map((row: any) => ({
      conceptName: row.concept_name,
      confidenceInput: row.confidence_input,
      stabilityScore: row.stability_score,
      confidenceGap: row.confidence_gap,
      isConfidentButFragile: row.is_confident_but_fragile,
      bandLabel: row.band_label,
      evaluations: row.evaluations ?? [],
      recommendation: row.recommendation ?? "",
    }));
  } catch (e) {
    console.error("[ECHO DB] fetchAssessments exception:", e);
    return [];
  }
}

export async function insertAssessment(
  result: StabilityResult
): Promise<boolean> {
  const uid = await getCurrentUserId();
  if (!uid) return false;

  try {
    const { error } = await supabase
      .from("echo_assessments" as any)
      .insert({
        user_id: uid,
        concept_name: result.conceptName,
        confidence_input: result.confidenceInput,
        stability_score: result.stabilityScore,
        confidence_gap: result.confidenceGap,
        is_confident_but_fragile: result.isConfidentButFragile,
        band_label: result.bandLabel,
        evaluations: result.evaluations as any,
        recommendation: result.recommendation,
      } as any);

    if (error) {
      console.error("[ECHO DB] insertAssessment error:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[ECHO DB] insertAssessment exception:", e);
    return false;
  }
}

// ─── Learn Materials ─────────────────────────────────────

export async function fetchLearnMaterials(): Promise<LearnMaterial[]> {
  const uid = await getCurrentUserId();
  if (!uid) return [];

  try {
    const { data, error } = await supabase
      .from("echo_learn_materials" as any)
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ECHO DB] fetchLearnMaterials error:", error.message);
      return [];
    }

    return (data ?? []).map((row: any) => ({
      id: row.id,
      topic: row.topic,
      sourceType: row.source_type ?? "topic",
      fileName: row.file_name,
      htmlContent: row.html_content ?? "",
      summaryText: row.summary_text ?? "",
      keyConcepts: row.key_concepts ?? [],
      importantPoints: row.important_points ?? [],
      createdAt: row.created_at,
      pageCount: row.page_count,
      wordCount: row.word_count,
    }));
  } catch (e) {
    console.error("[ECHO DB] fetchLearnMaterials exception:", e);
    return [];
  }
}

export async function insertLearnMaterial(
  mat: Omit<LearnMaterial, "id" | "createdAt">
): Promise<LearnMaterial | null> {
  const uid = await getCurrentUserId();
  if (!uid) return null;

  try {
    const { data, error } = await supabase
      .from("echo_learn_materials" as any)
      .insert({
        user_id: uid,
        topic: mat.topic,
        source_type: mat.sourceType,
        file_name: mat.fileName,
        html_content: mat.htmlContent,
        summary_text: mat.summaryText,
        key_concepts: mat.keyConcepts as any,
        important_points: mat.importantPoints as any,
        page_count: mat.pageCount,
        word_count: mat.wordCount,
      } as any)
      .select()
      .single();

    if (error) {
      console.error("[ECHO DB] insertLearnMaterial error:", error.message);
      return null;
    }

    const row = data as any;
    return {
      id: row.id,
      topic: row.topic,
      sourceType: row.source_type ?? "topic",
      fileName: row.file_name,
      htmlContent: row.html_content ?? "",
      summaryText: row.summary_text ?? "",
      keyConcepts: row.key_concepts ?? [],
      importantPoints: row.important_points ?? [],
      createdAt: row.created_at,
      pageCount: row.page_count,
      wordCount: row.word_count,
    };
  } catch (e) {
    console.error("[ECHO DB] insertLearnMaterial exception:", e);
    return null;
  }
}

// ─── Repairs ──────────────────────────────────────────────

export async function insertRepair(
  repair: RepairActivity
): Promise<boolean> {
  const uid = await getCurrentUserId();
  if (!uid) return false;

  try {
    const { error } = await supabase
      .from("echo_repairs" as any)
      .insert({
        user_id: uid,
        concept_name: repair.conceptName,
        gap_text: repair.gapText,
        priority: repair.priority,
        total_minutes: repair.totalMinutes,
        steps: repair.steps as any,
        before_score: repair.beforeScore,
        after_score: repair.afterScore,
      } as any);

    if (error) {
      console.error("[ECHO DB] insertRepair error:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[ECHO DB] insertRepair exception:", e);
    return false;
  }
}

// ─── Rechecks ─────────────────────────────────────────────

export async function fetchRechecks(): Promise<
  { concept: string; beforeScore: number; afterScore: number; date: string }[]
> {
  const uid = await getCurrentUserId();
  if (!uid) return [];

  try {
    const { data, error } = await supabase
      .from("echo_rechecks" as any)
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ECHO DB] fetchRechecks error:", error.message);
      return [];
    }

    return (data ?? []).map((row: any) => ({
      concept: row.concept,
      beforeScore: row.before_score,
      afterScore: row.after_score,
      date: new Date(row.created_at).toLocaleTimeString(),
    }));
  } catch (e) {
    console.error("[ECHO DB] fetchRechecks exception:", e);
    return [];
  }
}

export async function insertRecheck(
  concept: string,
  beforeScore: number,
  afterScore: number
): Promise<boolean> {
  const uid = await getCurrentUserId();
  if (!uid) return false;

  try {
    const { error } = await supabase
      .from("echo_rechecks" as any)
      .insert({
        user_id: uid,
        concept,
        before_score: beforeScore,
        after_score: afterScore,
      } as any);

    if (error) {
      console.error("[ECHO DB] insertRecheck error:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[ECHO DB] insertRecheck exception:", e);
    return false;
  }
}

// ─── User Profile (XP, Level, Streak) ────────────────────

export type EchoProfile = {
  displayName: string;
  xp: number;
  level: number;
  streak: number;
  coins: number;
  focusScore: number;
  avatarUrl: string | null;
};

export async function fetchUserProfile(): Promise<EchoProfile | null> {
  const uid = await getCurrentUserId();
  if (!uid) return null;

  try {
    const { data, error } = await supabase
      .from("profiles" as any)
      .select("*")
      .eq("id", uid)
      .single();

    if (error) {
      console.error("[ECHO DB] fetchProfile error:", error.message);
      return null;
    }

    const row = data as any;
    return {
      displayName: row.display_name ?? "Student",
      xp: row.xp ?? 0,
      level: row.level ?? 1,
      streak: row.streak ?? 0,
      coins: row.coins ?? 0,
      focusScore: row.focus_score ?? 0,
      avatarUrl: row.avatar_url,
    };
  } catch (e) {
    console.error("[ECHO DB] fetchProfile exception:", e);
    return null;
  }
}

export async function addUserXP(xpGain: number): Promise<boolean> {
  const uid = await getCurrentUserId();
  if (!uid) return false;

  try {
    // Fetch current XP
    const profile = await fetchUserProfile();
    if (!profile) return false;

    const newXp = profile.xp + xpGain;
    const newLevel = Math.floor(newXp / 100) + 1; // Level up every 100 XP

    const { error } = await supabase
      .from("profiles" as any)
      .update({ xp: newXp, level: newLevel } as any)
      .eq("id", uid);

    if (error) {
      console.error("[ECHO DB] addUserXP error:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[ECHO DB] addUserXP exception:", e);
    return false;
  }
}
