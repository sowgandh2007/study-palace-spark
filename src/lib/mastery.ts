import { supabase } from "@/integrations/supabase/client";

export type SubjectMastery = {
  id?: string;
  user_id: string;
  subject: string;
  mastery: number;
  accuracy: number;
  chapters_done: number;
  revision_score: number;
  difficulty_bonus: number;
  quizzes_count: number;
  updated_at?: string;
};

export type TopicMastery = {
  id?: string;
  user_id: string;
  subject: string;
  topic: string;
  mastery: number;
  attempts: number;
};

const DIFF_WEIGHT: Record<string, number> = { easy: 0.6, medium: 1.0, hard: 1.4 };

// Loose subject classifier from a free-form topic string.
export function classifySubject(topic: string): string {
  const t = topic.toLowerCase();
  if (/(array|tree|graph|linked|sort|search|dp|dynamic|recursion|stack|queue|heap|hash|dsa)/.test(t)) return "DSA";
  if (/(calculus|integr|deriv|limit|series)/.test(t)) return "Calculus";
  if (/(algebra|matrix|equation|polynom|trigon)/.test(t)) return "Math";
  if (/(physic|kinematic|newton|thermodynam|optic|electric|magnet|mechanic)/.test(t)) return "Physics";
  if (/(chem|reaction|organic|inorganic|periodic|mole|acid|base)/.test(t)) return "Chemistry";
  if (/(bio|cell|genetic|evolut|organism|photosyn|ecology)/.test(t)) return "Biology";
  if (/(history|revolution|empire|world war|civiliz)/.test(t)) return "History";
  if (/(geograph|climate|continent|river|mountain)/.test(t)) return "Geography";
  if (/(econom|market|inflation|gdp|trade|finance)/.test(t)) return "Economics";
  if (/(english|grammar|literature|essay|verb|noun)/.test(t)) return "English";
  return topic.split(/\s+/).slice(0, 2).join(" ").replace(/^\w/, c => c.toUpperCase()) || "General";
}

export function masteryColor(m: number): string {
  if (m >= 85) return "text-success";
  if (m >= 65) return "text-primary";
  if (m >= 40) return "text-warning";
  return "text-destructive";
}
export function masteryBg(m: number): string {
  if (m >= 85) return "bg-success";
  if (m >= 65) return "bg-primary";
  if (m >= 40) return "bg-warning";
  return "bg-destructive";
}
export function masteryDot(m: number): string {
  if (m >= 85) return "🟢";
  if (m >= 65) return "🟡";
  if (m >= 40) return "🟠";
  return "🔴";
}

const SUBJECT_BADGE: Record<string, string> = {
  DSA: "dsa_expert",
  Calculus: "calculus_master",
  Physics: "physics_pro",
  Chemistry: "chemistry_champ",
  Biology: "biology_boss",
};

/** Recomputes mastery scores from quiz + mission history and upserts to the database. */
export async function recomputeMastery(userId: string) {
  const [{ data: quizzes }, { data: missions }, { data: profile }] = await Promise.all([
    supabase.from("ai_quizzes").select("topic,difficulty,questions,score,created_at").eq("user_id", userId),
    supabase.from("missions").select("kind,completed,day").eq("user_id", userId).eq("completed", true),
    supabase.from("profiles").select("streak,xp").eq("id", userId).maybeSingle(),
  ]);

  // aggregate per subject + per topic
  type Agg = { correct: number; total: number; diffSum: number; quizzes: number };
  const subj: Record<string, Agg> = {};
  const topic: Record<string, Record<string, { correct: number; total: number }>> = {};

  for (const q of quizzes ?? []) {
    const total = Array.isArray(q.questions) ? (q.questions as unknown[]).length : 0;
    if (!total) continue;
    const s = classifySubject(q.topic ?? "");
    const w = DIFF_WEIGHT[(q.difficulty ?? "medium") as string] ?? 1;
    subj[s] ??= { correct: 0, total: 0, diffSum: 0, quizzes: 0 };
    subj[s].correct += q.score ?? 0;
    subj[s].total += total;
    subj[s].diffSum += w;
    subj[s].quizzes += 1;

    topic[s] ??= {};
    const key = (q.topic ?? "General").trim();
    topic[s][key] ??= { correct: 0, total: 0 };
    topic[s][key].correct += q.score ?? 0;
    topic[s][key].total += total;
  }

  const chaptersByDay = new Map<string, number>();
  let chaptersDone = 0;
  let revisionDays = new Set<string>();
  for (const m of missions ?? []) {
    if (m.kind === "chapters") { chaptersDone += 1; chaptersByDay.set(m.day, (chaptersByDay.get(m.day) ?? 0) + 1); }
    if (m.kind === "revise") revisionDays.add(m.day);
  }
  // revision consistency = fraction of last 14 days with a revision mission completed
  const today = new Date();
  let hits = 0;
  for (let i = 0; i < 14; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    if (revisionDays.has(d.toISOString().slice(0, 10))) hits++;
  }
  const revisionScore = Math.round((hits / 14) * 100);

  const subjectRows: SubjectMastery[] = [];
  for (const [s, a] of Object.entries(subj)) {
    const accuracy = a.total ? (a.correct / a.total) * 100 : 0;
    const avgDiff = a.quizzes ? a.diffSum / a.quizzes : 1;
    const difficultyBonus = Math.max(0, (avgDiff - 1) * 15); // hard quizzes push mastery higher
    const chapterScore = Math.min(100, chaptersDone * 8);
    // Weighted composite: accuracy 55%, chapters 20%, revision 15%, difficulty 10%
    const mastery = Math.max(0, Math.min(100,
      accuracy * 0.55 + chapterScore * 0.20 + revisionScore * 0.15 + difficultyBonus * 0.10
    ));
    subjectRows.push({
      user_id: userId, subject: s,
      mastery: +mastery.toFixed(2),
      accuracy: +accuracy.toFixed(2),
      chapters_done: chaptersDone,
      revision_score: revisionScore,
      difficulty_bonus: +difficultyBonus.toFixed(2),
      quizzes_count: a.quizzes,
    });
  }

  const topicRows: TopicMastery[] = [];
  for (const [s, byTopic] of Object.entries(topic)) {
    for (const [t, v] of Object.entries(byTopic)) {
      if (!v.total) continue;
      const acc = (v.correct / v.total) * 100;
      topicRows.push({
        user_id: userId, subject: s, topic: t,
        mastery: +acc.toFixed(2),
        attempts: v.total,
      });
    }
  }

  if (subjectRows.length) {
    await supabase.from("subject_mastery").upsert(subjectRows, { onConflict: "user_id,subject" });
  }
  if (topicRows.length) {
    await supabase.from("topic_mastery").upsert(topicRows, { onConflict: "user_id,subject,topic" });
  }

  // Auto-award expertise badges
  const toAward: { user_id: string; badge_id: string }[] = [];
  for (const r of subjectRows) {
    const bid = SUBJECT_BADGE[r.subject];
    if (bid && r.mastery >= 85) toAward.push({ user_id: userId, badge_id: bid });
  }
  const overallAcc = quizzes && quizzes.length >= 10
    ? subjectRows.reduce((a, r) => a + r.accuracy * r.quizzes_count, 0) / Math.max(1, subjectRows.reduce((a, r) => a + r.quizzes_count, 0))
    : 0;
  if ((quizzes?.length ?? 0) >= 10 && overallAcc >= 90) toAward.push({ user_id: userId, badge_id: "accuracy_ace" });
  if ((profile?.streak ?? 0) >= 14) toAward.push({ user_id: userId, badge_id: "consistency_champion" });

  if (toAward.length) {
    await supabase.from("user_badges").upsert(toAward, { onConflict: "user_id,badge_id" });
  }

  return { subjectRows, topicRows };
}

export function weekStart(d = new Date()): string {
  const x = new Date(d);
  const day = x.getDay() || 7; // Mon = 1
  x.setDate(x.getDate() - (day - 1));
  return x.toISOString().slice(0, 10);
}

export async function ensureWeeklyChallenges(userId: string) {
  const ws = weekStart();
  const { data: existing } = await supabase
    .from("weekly_challenges").select("id").eq("user_id", userId).eq("week_start", ws).limit(1);
  if (existing && existing.length) return;

  // Look at weakest subject for a targeted challenge
  const { data: sm } = await supabase
    .from("subject_mastery").select("subject,mastery").eq("user_id", userId).order("mastery", { ascending: true }).limit(1);
  const weakest = sm?.[0]?.subject ?? "any subject";
  const baseline = sm?.[0]?.mastery ?? 0;

  const seed = [
    { kind: "topic_mastery", title: "Reach 80% mastery in a topic", target: 80, reward_xp: 200, reward_coins: 60, reward_badge_id: null as string | null, description: "Any topic — accuracy across your quizzes counts." },
    { kind: "revisions_week", title: "Complete all revisions this week", target: 7, reward_xp: 180, reward_coins: 50, reward_badge_id: null, description: "Finish 7 revision missions." },
    { kind: "quizzes_week", title: "Finish 3 quizzes", target: 3, reward_xp: 150, reward_coins: 40, reward_badge_id: null, description: "Take 3 AI-generated quizzes." },
    { kind: "improve_subject", title: `Improve ${weakest} by 15%`, target: 15, reward_xp: 250, reward_coins: 80, reward_badge_id: "most_improved", description: `Baseline ${Math.round(baseline)}% — grow by 15 points.`, meta: { subject: weakest, baseline } },
  ];

  await supabase.from("weekly_challenges").insert(
    seed.map(s => ({ user_id: userId, week_start: ws, ...s, meta: (s as any).meta ?? {} }))
  );
}

export async function refreshWeeklyChallengeProgress(userId: string) {
  const ws = weekStart();
  const { data: chs } = await supabase
    .from("weekly_challenges").select("*").eq("user_id", userId).eq("week_start", ws);
  if (!chs?.length) return;

  const weekStartDate = new Date(ws);
  const [{ data: quizzes }, { data: missions }, { data: topics }, { data: subjects }] = await Promise.all([
    supabase.from("ai_quizzes").select("id,created_at").eq("user_id", userId).gte("created_at", weekStartDate.toISOString()),
    supabase.from("missions").select("kind,completed,day").eq("user_id", userId).eq("completed", true).gte("day", ws),
    supabase.from("topic_mastery").select("mastery").eq("user_id", userId),
    supabase.from("subject_mastery").select("subject,mastery").eq("user_id", userId),
  ]);

  const updates: any[] = [];
  for (const c of chs) {
    let progress = c.progress;
    let completed = c.completed;
    if (c.kind === "quizzes_week") progress = quizzes?.length ?? 0;
    if (c.kind === "revisions_week") progress = (missions ?? []).filter(m => m.kind === "revise").length;
    if (c.kind === "topic_mastery") progress = Math.round(Math.max(0, ...(topics ?? []).map(t => Number(t.mastery))));
    if (c.kind === "improve_subject") {
      const s = (c.meta as any)?.subject;
      const baseline = Number((c.meta as any)?.baseline ?? 0);
      const cur = Number((subjects ?? []).find(x => x.subject === s)?.mastery ?? 0);
      progress = Math.max(0, Math.round(cur - baseline));
    }
    if (!completed && progress >= c.target) completed = true;
    if (progress !== c.progress || completed !== c.completed) {
      updates.push({ id: c.id, progress, completed });
    }
  }
  for (const u of updates) {
    await supabase.from("weekly_challenges").update({ progress: u.progress, completed: u.completed }).eq("id", u.id);
    if (u.completed) {
      const ch = chs.find(x => x.id === u.id)!;
      const { data: p } = await supabase.from("profiles").select("xp,coins").eq("id", userId).maybeSingle();
      await supabase.from("profiles").update({ xp: (p?.xp ?? 0) + ch.reward_xp, coins: (p?.coins ?? 0) + ch.reward_coins }).eq("id", userId);
      if (ch.reward_badge_id) {
        await supabase.from("user_badges").upsert({ user_id: userId, badge_id: ch.reward_badge_id }, { onConflict: "user_id,badge_id" });
      }
      await supabase.from("notifications").insert({ user_id: userId, kind: "challenge_complete", title: `Weekly challenge complete: ${ch.title}`, body: `+${ch.reward_xp} XP · +${ch.reward_coins} coins` });
    }
  }
}
