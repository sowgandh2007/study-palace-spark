import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trophy, Users, Target, Sparkles, TrendingUp, Award, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ensureWeeklyChallenges, masteryBg, masteryColor, masteryDot, recomputeMastery, refreshWeeklyChallengeProgress } from "@/lib/mastery";

export const Route = createFileRoute("/_authenticated/app/mastery")({
  head: () => ({
    meta: [
      { title: "Mastery · StudySphere AI" },
      { name: "description", content: "Track subject and topic mastery, compare with friends, and win weekly challenges." },
      { property: "og:title", content: "Mastery · StudySphere AI" },
      { property: "og:description", content: "Compete through mastery, not just study time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MasteryHub,
});

type Tab = "subjects" | "topics" | "compare" | "challenges" | "leaderboard";
const TABS: { key: Tab; label: string }[] = [
  { key: "subjects", label: "Subjects" },
  { key: "topics", label: "Topics" },
  { key: "compare", label: "Compare" },
  { key: "challenges", label: "Weekly" },
  { key: "leaderboard", label: "Ranks" },
];

function MasteryHub() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("subjects");
  const [busy, setBusy] = useState(false);

  const { data: uid } = useQuery({
    queryKey: ["uid"],
    queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null,
  });

  useEffect(() => {
    if (!uid) return;
    (async () => {
      await recomputeMastery(uid);
      await ensureWeeklyChallenges(uid);
      await refreshWeeklyChallengeProgress(uid);
      qc.invalidateQueries();
    })();
  }, [uid, qc]);

  async function refresh() {
    if (!uid) return;
    setBusy(true);
    try {
      await recomputeMastery(uid);
      await refreshWeeklyChallengeProgress(uid);
      await qc.invalidateQueries();
      toast.success("Mastery updated");
    } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black">Mastery</h1>
          <p className="text-sm text-muted-foreground">Compete through learning, not clocks.</p>
        </div>
        <button onClick={refresh} disabled={busy} className="grid h-10 w-10 place-items-center rounded-xl border border-border disabled:opacity-50">
          <RefreshCw className={"h-4 w-4 " + (busy ? "animate-spin" : "")} />
        </button>
      </header>

      <div className="mt-5 flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1 text-xs">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={"shrink-0 rounded-xl px-3 py-2 font-semibold " + (tab === t.key ? "gradient-brand text-primary-foreground" : "text-muted-foreground")}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "subjects" && uid && <SubjectsPane userId={uid} />}
        {tab === "topics" && uid && <TopicsPane userId={uid} />}
        {tab === "compare" && uid && <ComparePane userId={uid} />}
        {tab === "challenges" && uid && <ChallengesPane userId={uid} />}
        {tab === "leaderboard" && uid && <LeaderPane userId={uid} />}
      </div>
    </div>
  );
}

function SubjectsPane({ userId }: { userId: string }) {
  const { data: rows = [] } = useQuery({
    queryKey: ["subject_mastery", userId],
    queryFn: async () => (await supabase.from("subject_mastery").select("*").eq("user_id", userId).order("mastery", { ascending: false })).data ?? [],
  });
  if (!rows.length) return <Empty icon={<Target className="h-8 w-8" />} text="Take a quiz to build mastery" />;
  return (
    <ul className="space-y-3">
      {rows.map(r => (
        <li key={r.id} className="rounded-3xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="font-bold">{r.subject}</p>
            <span className={"text-lg font-black " + masteryColor(Number(r.mastery))}>{Math.round(Number(r.mastery))}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div className={"h-full " + masteryBg(Number(r.mastery))} style={{ width: `${r.mastery}%` }} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
            <Metric label="Accuracy" value={`${Math.round(Number(r.accuracy))}%`} />
            <Metric label="Revision" value={`${Math.round(Number(r.revision_score))}%`} />
            <Metric label="Quizzes" value={String(r.quizzes_count)} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/50 p-2 text-center">
      <p className="text-[10px]">{label}</p>
      <p className="text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

function TopicsPane({ userId }: { userId: string }) {
  const { data: rows = [] } = useQuery({
    queryKey: ["topic_mastery", userId],
    queryFn: async () => (await supabase.from("topic_mastery").select("*").eq("user_id", userId).order("mastery", { ascending: false })).data ?? [],
  });
  const grouped = rows.reduce<Record<string, typeof rows>>((acc, r) => {
    (acc[r.subject] ??= []).push(r); return acc;
  }, {});
  if (!rows.length) return <Empty icon={<Sparkles className="h-8 w-8" />} text="No topics yet — take quizzes on specific topics" />;
  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([subject, list]) => (
        <div key={subject} className="rounded-3xl border border-border bg-card p-4">
          <p className="mb-3 text-xs font-bold uppercase text-muted-foreground">{subject}</p>
          <ul className="space-y-2">
            {list.map(t => (
              <li key={t.id} className="flex items-center gap-3">
                <span className="text-base">{masteryDot(Number(t.mastery))}</span>
                <span className="min-w-0 flex-1 truncate text-sm">{t.topic}</span>
                <span className={"text-sm font-bold " + masteryColor(Number(t.mastery))}>{Math.round(Number(t.mastery))}%</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function ComparePane({ userId }: { userId: string }) {
  const { data: friends = [] } = useQuery({
    queryKey: ["friends-compare", userId],
    queryFn: async () => {
      const { data } = await supabase.from("friendships").select("*, friend:profiles!friendships_friend_id_fkey(*), user:profiles!friendships_user_id_fkey(*)").or(`user_id.eq.${userId},friend_id.eq.${userId}`);
      return (data ?? []).map((f: any) => f.user_id === userId ? f.friend : f.user).filter(Boolean);
    },
  });
  const [otherId, setOtherId] = useState<string | null>(null);
  useEffect(() => { if (!otherId && friends[0]) setOtherId(friends[0].id); }, [friends, otherId]);

  const { data: mine } = useQuery({
    queryKey: ["compare-me", userId],
    queryFn: async () => fetchCompare(userId),
  });
  const { data: other } = useQuery({
    queryKey: ["compare-other", otherId],
    enabled: !!otherId,
    queryFn: async () => fetchCompare(otherId!),
  });

  if (!friends.length) return <Empty icon={<Users className="h-8 w-8" />} text="Add friends in your profile to compare" />;
  if (!mine || !other) return null;

  const rows = [
    { label: "XP", a: mine.xp, b: other.xp, fmt: (n: number) => `${n}` },
    { label: "Streak", a: mine.streak, b: other.streak, fmt: (n: number) => `${n}d` },
    { label: "Weekly minutes", a: mine.weekly, b: other.weekly, fmt: (n: number) => `${n}m` },
    { label: "Quiz accuracy", a: mine.accuracy, b: other.accuracy, fmt: (n: number) => `${Math.round(n)}%` },
    { label: "Top mastery", a: mine.topMastery, b: other.topMastery, fmt: (n: number) => `${Math.round(n)}%` },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto">
        {friends.map((f: any) => (
          <button key={f.id} onClick={() => setOtherId(f.id)}
            className={"shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold " + (otherId === f.id ? "border-primary bg-primary/10 text-primary" : "border-border")}>
            {f.display_name}
          </button>
        ))}
      </div>
      <div className="rounded-3xl border border-border bg-card p-4">
        <div className="mb-3 grid grid-cols-3 items-center text-xs font-bold">
          <div>You</div>
          <div className="text-center text-muted-foreground">vs</div>
          <div className="text-right">{other.name}</div>
        </div>
        <ul className="space-y-3">
          {rows.map(r => {
            const total = (r.a ?? 0) + (r.b ?? 0) || 1;
            const aPct = ((r.a ?? 0) / total) * 100;
            return (
              <li key={r.label}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">{r.fmt(r.a ?? 0)}</span>
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className="font-semibold">{r.fmt(r.b ?? 0)}</span>
                </div>
                <div className="mt-1 flex h-2 overflow-hidden rounded-full bg-muted">
                  <div className="gradient-brand" style={{ width: `${aPct}%` }} />
                  <div className="bg-warning" style={{ width: `${100 - aPct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

async function fetchCompare(userId: string) {
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const [{ data: p }, { data: quizzes }, { data: sessions }, { data: sm }] = await Promise.all([
    supabase.from("profiles").select("display_name,xp,streak").eq("id", userId).maybeSingle(),
    supabase.from("ai_quizzes").select("questions,score").eq("user_id", userId),
    supabase.from("study_sessions").select("minutes").eq("user_id", userId).gte("day", weekAgo.toISOString().slice(0, 10)),
    supabase.from("subject_mastery").select("mastery").eq("user_id", userId).order("mastery", { ascending: false }).limit(1),
  ]);
  const totQ = (quizzes ?? []).reduce((a, q) => a + (Array.isArray(q.questions) ? (q.questions as unknown[]).length : 0), 0);
  const totS = (quizzes ?? []).reduce((a, q) => a + (q.score ?? 0), 0);
  return {
    name: p?.display_name ?? "Friend",
    xp: p?.xp ?? 0,
    streak: p?.streak ?? 0,
    weekly: (sessions ?? []).reduce((a, r) => a + (r.minutes ?? 0), 0),
    accuracy: totQ ? (totS / totQ) * 100 : 0,
    topMastery: Number(sm?.[0]?.mastery ?? 0),
  };
}

function ChallengesPane({ userId }: { userId: string }) {
  const { data: rows = [] } = useQuery({
    queryKey: ["weekly_challenges", userId],
    queryFn: async () => (await supabase.from("weekly_challenges").select("*").eq("user_id", userId).order("created_at")).data ?? [],
  });
  if (!rows.length) return <Empty icon={<Award className="h-8 w-8" />} text="Preparing your weekly challenges…" />;
  return (
    <ul className="space-y-3">
      {rows.map(c => (
        <li key={c.id} className={"rounded-3xl border p-4 " + (c.completed ? "border-success/40 bg-success/10" : "border-border bg-card")}>
          <div className="flex items-start gap-3">
            <div className={"grid h-10 w-10 shrink-0 place-items-center rounded-2xl " + (c.completed ? "bg-success/20 text-success" : "gradient-brand text-primary-foreground")}>
              <Trophy className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{c.title}</p>
              {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full gradient-brand" style={{ width: `${Math.min(100, (c.progress / c.target) * 100)}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{c.progress}/{c.target}</span>
                <span className="font-semibold text-primary">+{c.reward_xp} XP · +{c.reward_coins} coins</span>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

const LB_METRICS = [
  { key: "mastery", label: "Top Mastery" },
  { key: "accuracy", label: "Accuracy" },
  { key: "improved", label: "Most Improved" },
  { key: "consistency", label: "Consistency" },
] as const;
const LB_SCOPES = ["Global", "Friends"] as const;

function LeaderPane({ userId }: { userId: string }) {
  const [metric, setMetric] = useState<(typeof LB_METRICS)[number]["key"]>("mastery");
  const [scope, setScope] = useState<(typeof LB_SCOPES)[number]>("Global");

  const { data: friendIds = [] } = useQuery({
    queryKey: ["friend-ids", userId],
    queryFn: async () => {
      const { data } = await supabase.from("friendships").select("user_id,friend_id").or(`user_id.eq.${userId},friend_id.eq.${userId}`);
      const s = new Set<string>([userId]);
      (data ?? []).forEach(f => { s.add(f.user_id); s.add(f.friend_id); });
      return Array.from(s);
    },
  });

  const { data: rows = [] } = useQuery({
    queryKey: ["mastery-lb", metric, scope, friendIds.length],
    queryFn: async () => {
      const idsFilter = scope === "Friends" ? friendIds : null;
      const attachProfiles = async (userIds: string[]) => {
        if (!userIds.length) return new Map<string, { display_name: string; title: string | null }>();
        const { data } = await supabase.from("profiles").select("id,display_name,title").in("id", userIds);
        return new Map((data ?? []).map(p => [p.id, { display_name: p.display_name, title: p.title }]));
      };

      if (metric === "mastery") {
        let q = supabase.from("subject_mastery").select("user_id,subject,mastery").order("mastery", { ascending: false }).limit(50);
        if (idsFilter) q = q.in("user_id", idsFilter);
        const { data } = await q;
        const profMap = await attachProfiles((data ?? []).map(r => r.user_id));
        return (data ?? []).map(r => ({ user_id: r.user_id, name: profMap.get(r.user_id)?.display_name ?? "—", title: r.subject, value: `${Math.round(Number(r.mastery))}%` }));
      }
      if (metric === "accuracy") {
        let q = supabase.from("subject_mastery").select("user_id,accuracy,quizzes_count").gt("quizzes_count", 2).order("accuracy", { ascending: false }).limit(50);
        if (idsFilter) q = q.in("user_id", idsFilter);
        const { data } = await q;
        const profMap = await attachProfiles((data ?? []).map(r => r.user_id));
        return (data ?? []).map(r => ({ user_id: r.user_id, name: profMap.get(r.user_id)?.display_name ?? "—", title: `${r.quizzes_count} quizzes`, value: `${Math.round(Number(r.accuracy))}%` }));
      }
      if (metric === "consistency") {
        let q = supabase.from("profiles").select("id,display_name,title,streak").order("streak", { ascending: false }).limit(50);
        if (idsFilter) q = q.in("id", idsFilter);
        const { data } = await q;
        return (data ?? []).map(r => ({ user_id: r.id, name: r.display_name, title: r.title ?? "", value: `${r.streak}d` }));
      }
      let q = supabase.from("weekly_challenges").select("user_id,progress").eq("kind", "improve_subject").order("progress", { ascending: false }).limit(50);
      if (idsFilter) q = q.in("user_id", idsFilter);
      const { data } = await q;
      const profMap = await attachProfiles((data ?? []).map(r => r.user_id));
      return (data ?? []).map(r => ({ user_id: r.user_id, name: profMap.get(r.user_id)?.display_name ?? "—", title: "This week", value: `+${r.progress}%` }));
    },
  });

  return (
    <div>
      <div className="mb-3 grid grid-cols-2 gap-1 rounded-2xl border border-border bg-card p-1 text-xs">
        {LB_SCOPES.map(s => (
          <button key={s} onClick={() => setScope(s)} className={"rounded-xl py-2 font-semibold " + (scope === s ? "gradient-brand text-primary-foreground" : "text-muted-foreground")}>{s}</button>
        ))}
      </div>
      <div className="mb-3 flex gap-2 overflow-x-auto">
        {LB_METRICS.map(m => (
          <button key={m.key} onClick={() => setMetric(m.key)}
            className={"shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold " + (metric === m.key ? "border-primary bg-primary/10 text-primary" : "border-border")}>
            {m.label}
          </button>
        ))}
      </div>
      <ul className="space-y-2">
        {rows.map((r, i) => (
          <li key={r.user_id + i} className={"flex items-center gap-3 rounded-2xl border border-border p-3 " + (i < 3 ? "bg-gradient-to-r from-primary/10 to-transparent" : "bg-card")}>
            <div className={"grid h-9 w-9 place-items-center rounded-full text-sm font-black " + (i === 0 ? "gradient-fire text-white" : i < 3 ? "gradient-brand text-primary-foreground" : "bg-muted")}>{i + 1}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{r.name}</p>
              <p className="text-[11px] text-muted-foreground">{r.title}</p>
            </div>
            <p className="text-base font-black">{r.value}</p>
          </li>
        ))}
        {rows.length === 0 && <Empty icon={<TrendingUp className="h-8 w-8" />} text="No rankings yet" />}
      </ul>
    </div>
  );
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="grid place-items-center gap-2 rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{icon}<p>{text}</p></div>;
}
