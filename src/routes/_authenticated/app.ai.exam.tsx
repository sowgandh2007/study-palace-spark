import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { aiGenerate } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/app/ai/exam")({
  component: Exam,
});

type Q = { q: string; options: string[]; answer: number; explanation: string };

function Exam() {
  const qc = useQueryClient();
  const call = useServerFn(aiGenerate);
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [count, setCount] = useState(5);
  const [busy, setBusy] = useState(false);
  const [quiz, setQuiz] = useState<Q[] | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const { data: uid } = useQuery({ queryKey: ["uid"], queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null });

  async function generate() {
    setBusy(true);
    try {
      const prompt = `Create a ${difficulty} difficulty quiz with ${count} MCQs on "${topic}". Return JSON {"questions":[{"q":"...","options":["A","B","C","D"],"answer":0,"explanation":"..."}]}. Only JSON.`;
      const res = await call({ data: { prompt, json: true, cacheKey: `exam:${topic}:${difficulty}:${count}`, system: "You return only strict JSON." } });
      const qs = ((res.json as { questions?: Q[] })?.questions) ?? [];
      setQuiz(qs);
      setAnswers(new Array(qs.length).fill(-1));
      setSubmitted(false);
    } finally { setBusy(false); }
  }

  async function submit() {
    if (!quiz || !uid) return;
    const score = quiz.reduce((a, q, i) => a + (answers[i] === q.answer ? 1 : 0), 0);
    setSubmitted(true);
    await supabase.from("ai_quizzes").insert({ user_id: uid, topic, difficulty, questions: quiz, answers, score });
    qc.invalidateQueries({ queryKey: ["quizzes-history", uid] });
  }

  const score = quiz ? quiz.reduce((a, q, i) => a + (answers[i] === q.answer ? 1 : 0), 0) : 0;

  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <h1 className="text-2xl font-black">Exam Generator</h1>

      {!quiz && (
        <div className="mt-4 space-y-3 rounded-3xl border border-border bg-card p-4">
          <label className="block"><span className="text-xs font-semibold">Topic / chapters</span>
            <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Kinematics" className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
          </label>
          <div>
            <p className="text-xs font-semibold">Difficulty</p>
            <div className="mt-1 flex gap-2">
              {(["easy","medium","hard"] as const).map(d => (
                <button key={d} onClick={() => setDifficulty(d)} className={"flex-1 rounded-xl border py-2 text-xs font-semibold " + (difficulty === d ? "border-primary bg-primary/10 text-primary" : "border-border")}>{d}</button>
              ))}
            </div>
          </div>
          <label className="block text-xs font-semibold">Questions: {count}
            <input type="range" min={3} max={15} value={count} onChange={e => setCount(+e.target.value)} className="mt-1 w-full" />
          </label>
          <button onClick={generate} disabled={busy || !topic.trim()} className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-brand py-3 text-sm font-bold text-primary-foreground disabled:opacity-50">
            <Sparkles className="h-4 w-4" /> {busy ? "Generating…" : "Generate exam"}
          </button>
        </div>
      )}

      {quiz && (
        <div className="mt-4 space-y-4">
          {submitted && (
            <div className="rounded-3xl gradient-brand p-4 text-primary-foreground">
              <p className="text-xs opacity-80">Your score</p>
              <p className="text-3xl font-black">{score} / {quiz.length}</p>
            </div>
          )}
          {quiz.map((q, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm font-bold">{i + 1}. {q.q}</p>
              <div className="mt-2 space-y-1.5">
                {q.options.map((o, k) => {
                  const isPicked = answers[i] === k;
                  const isCorrect = submitted && k === q.answer;
                  const isWrong = submitted && isPicked && k !== q.answer;
                  return (
                    <button key={k} disabled={submitted}
                      onClick={() => { const a = [...answers]; a[i] = k; setAnswers(a); }}
                      className={"flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm " + (isCorrect ? "border-success bg-success/10" : isWrong ? "border-destructive bg-destructive/10" : isPicked ? "border-primary bg-primary/10" : "border-border")}>
                      {submitted && isCorrect && <Check className="h-4 w-4 text-success" />}
                      {submitted && isWrong && <X className="h-4 w-4 text-destructive" />}
                      <span>{o}</span>
                    </button>
                  );
                })}
              </div>
              {submitted && <p className="mt-2 rounded-xl bg-muted/50 p-2 text-xs">💡 {q.explanation}</p>}
            </div>
          ))}
          {!submitted ? (
            <button onClick={submit} disabled={answers.some(a => a < 0)} className="w-full rounded-2xl gradient-brand py-3 text-sm font-bold text-primary-foreground disabled:opacity-50">Submit</button>
          ) : (
            <button onClick={() => setQuiz(null)} className="w-full rounded-2xl border border-border py-3 text-sm font-semibold">New exam</button>
          )}
        </div>
      )}
    </div>
  );
}
