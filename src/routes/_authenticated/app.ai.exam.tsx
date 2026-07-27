import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Check, X, FileText, Upload, Clock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { aiGenerate, parseAiJson } from "@/lib/ai.functions";
import { toast } from "sonner";

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

  // PDF Upload states
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);

  // Timer states
  const [useTimer, setUseTimer] = useState(false);
  const [timerDuration, setTimerDuration] = useState(10); // in minutes
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { data: uid } = useQuery({ queryKey: ["uid"], queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null });

  // PDF Text Extraction Helper
  async function extractPdfText(file: File): Promise<string> {
    const pdfjsLib = (window as any)['pdfjs-dist/build/pdf'];
    if (!pdfjsLib) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    const pdfjs = (window as any)['pdfjs-dist/build/pdf'];
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    const maxPages = Math.min(pdf.numPages, 10); // Limit to 10 pages for speed/token limits
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      text += strings.join(' ') + '\n';
    }
    return text;
  }

  async function generate() {
    setBusy(true);
    let pdfText = "";
    if (pdfFile) {
      setExtracting(true);
      try {
        pdfText = await extractPdfText(pdfFile);
        if (!pdfText.trim()) throw new Error("Could not extract readable text from PDF.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "PDF extraction failed");
        setBusy(false);
        setExtracting(false);
        return;
      } finally {
        setExtracting(false);
      }
    }

    try {
      const quizSource = pdfFile ? `the uploaded document text: "${pdfText.slice(0, 8000)}"` : `the topic "${topic}"`;
      const prompt = `Create a ${difficulty} difficulty quiz with ${count} MCQs based on ${quizSource}.
Return strict JSON format matching this shape:
{"questions":[{"q":"...","options":["A","B","C","D"],"answer":0,"explanation":"..."}]}
Guidelines:
- Return ONLY the JSON object. No explanation, markdown ticks, or surrounding commentary.
- Ensure questions are accurate and options are well-formed.
- The 'answer' index must match the correct option (0-indexed).`;

      const cacheKeyVal = pdfFile 
        ? `exam-pdf:${pdfFile.name}:${pdfFile.size}:${difficulty}:${count}` 
        : `exam:${topic}:${difficulty}:${count}`;

      const res = await call({ data: { prompt, json: true, cacheKey: cacheKeyVal, system: "You return only strict JSON." } });
      const qs = (parseAiJson<{ questions?: Q[] }>(res.text)?.questions) ?? [];
      if (qs.length === 0) {
        throw new Error("AI returned an empty question list or invalid JSON format.");
      }

      setQuiz(qs);
      setAnswers(new Array(qs.length).fill(-1));
      setSubmitted(false);

      // Start timer if configured
      if (useTimer) {
        setTimeRemaining(timerDuration * 60);
      } else {
        setTimeRemaining(null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate exam");
    } finally {
      setBusy(false);
    }
  }

  // Timer interval hook
  useEffect(() => {
    if (timeRemaining === null || submitted) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (timeRemaining <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      toast.warning("Time is up! Submitting your exam automatically.");
      submit();
      return;
    }

    timerRef.current = setTimeout(() => {
      setTimeRemaining(timeRemaining - 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeRemaining, submitted]);

  async function submit() {
    if (!quiz || !uid) return;
    const finalScore = quiz.reduce((a, q, i) => a + (answers[i] === q.answer ? 1 : 0), 0);
    setSubmitted(true);
    setTimeRemaining(null);
    await supabase.from("ai_quizzes").insert({ 
      user_id: uid, 
      topic: pdfFile ? `PDF: ${pdfFile.name}` : topic, 
      difficulty, 
      questions: quiz, 
      answers, 
      score: finalScore 
    });
    qc.invalidateQueries({ queryKey: ["quizzes-history", uid] });
  }

  const score = quiz ? quiz.reduce((a, q, i) => a + (answers[i] === q.answer ? 1 : 0), 0) : 0;

  // Format time remaining MM:SS
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return (
    <div className="mx-auto max-w-md px-5 pt-8 pb-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Exam Generator</h1>
        {timeRemaining !== null && !submitted && (
          <div className="flex items-center gap-1.5 rounded-full bg-destructive/15 border border-destructive/20 px-3.5 py-1 text-xs font-bold text-destructive animate-pulse">
            <Clock className="h-3.5 w-3.5" />
            <span>Time: {formatTime(timeRemaining)}</span>
          </div>
        )}
      </div>

      {!quiz && (
        <div className="mt-4 space-y-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
          {/* PDF Upload Selector */}
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Exam Source</span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPdfFile(null)}
                className={`rounded-xl border py-2.5 text-xs font-bold transition-all ${!pdfFile ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:bg-muted"}`}
              >
                ✏️ Topic Name
              </button>
              <button
                type="button"
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ".pdf";
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) setPdfFile(file);
                  };
                  input.click();
                }}
                className={`rounded-xl border py-2.5 text-xs font-bold transition-all ${pdfFile ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:bg-muted"}`}
              >
                📄 {pdfFile ? "PDF Selected" : "Upload PDF"}
              </button>
            </div>
          </div>

          {!pdfFile ? (
            <label className="block">
              <span className="text-xs font-semibold">Topic / chapters</span>
              <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Kinematics" className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
            </label>
          ) : (
            <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-muted/30 p-3">
              <FileText className="h-5 w-5 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-foreground">{pdfFile.name}</p>
                <p className="text-[10px] text-muted-foreground">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB · PDF Document</p>
              </div>
              <button onClick={() => setPdfFile(null)} className="text-xs font-bold text-destructive hover:underline">Remove</button>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold">Difficulty</p>
            <div className="mt-1.5 flex gap-2">
              {(["easy","medium","hard"] as const).map(d => (
                <button key={d} onClick={() => setDifficulty(d)} className={"flex-1 rounded-xl border py-2 text-xs font-bold capitalize transition-colors " + (difficulty === d ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:bg-muted")}>{d}</button>
              ))}
            </div>
          </div>

          <label className="block text-xs font-semibold">
            Questions: <span className="font-bold text-primary text-sm ml-1">{count}</span>
            <input type="range" min={3} max={15} value={count} onChange={e => setCount(+e.target.value)} className="mt-2 w-full accent-[color:var(--brand)]" />
          </label>

          {/* Timer Toggle */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foreground">Set Exam Timer</p>
                <p className="text-[10px] text-muted-foreground">Automatically submits when time runs out</p>
              </div>
              <input 
                type="checkbox" 
                checked={useTimer} 
                onChange={(e) => setUseTimer(e.target.checked)} 
                className="h-4 w-4 accent-[color:var(--brand)] cursor-pointer"
              />
            </div>
            {useTimer && (
              <div className="mt-3 flex items-center gap-2.5 rounded-2xl bg-muted/40 border border-border/50 p-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <label className="flex-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">Duration (minutes):</span>
                  <select 
                    value={timerDuration} 
                    onChange={e => setTimerDuration(+e.target.value)}
                    className="rounded-lg border border-border bg-background px-2 py-1 font-bold text-foreground outline-none cursor-pointer"
                  >
                    {[1, 3, 5, 10, 15, 30, 45, 60].map(m => (
                      <option key={m} value={m}>{m} mins</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>

          <button onClick={generate} disabled={busy || (!pdfFile && !topic.trim())} className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-brand py-3 text-sm font-bold text-primary-foreground disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99] shadow shadow-brand/20">
            <Sparkles className="h-4 w-4" /> 
            {busy ? (extracting ? "Extracting PDF..." : "Generating Exam...") : "Generate exam"}
          </button>
        </div>
      )}

      {quiz && (
        <div className="mt-4 space-y-4">
          {submitted && (
            <div className="rounded-3xl gradient-brand p-5 text-primary-foreground shadow shadow-brand/20">
              <p className="text-xs opacity-80 uppercase tracking-wider font-bold">Your score</p>
              <p className="text-4xl font-black mt-1">{score} / {quiz.length}</p>
              <p className="text-[11px] mt-1.5 opacity-90">Review explanations below to improve your skills.</p>
            </div>
          )}

          {quiz.map((q, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-sm font-bold">{i + 1}. {q.q}</p>
              <div className="mt-3 space-y-1.5">
                {q.options.map((o, k) => {
                  const isPicked = answers[i] === k;
                  const isCorrect = submitted && k === q.answer;
                  const isWrong = submitted && isPicked && k !== q.answer;
                  return (
                    <button key={k} disabled={submitted}
                      onClick={() => { const a = [...answers]; a[i] = k; setAnswers(a); }}
                      className={"flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-all " + (isCorrect ? "border-success bg-success/10 font-semibold" : isWrong ? "border-destructive bg-destructive/10 font-semibold" : isPicked ? "border-primary bg-primary/10 font-semibold" : "border-border bg-background hover:bg-muted")}>
                      {submitted && isCorrect && <Check className="h-4 w-4 text-success shrink-0" />}
                      {submitted && isWrong && <X className="h-4 w-4 text-destructive shrink-0" />}
                      {!submitted && (
                        <span className={`grid h-5 w-5 place-items-center rounded-lg border text-[10px] font-bold uppercase transition-colors shrink-0 ${isPicked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted/30"}`}>
                          {String.fromCharCode(65 + k)}
                        </span>
                      )}
                      <span>{o}</span>
                    </button>
                  );
                })}
              </div>
              {submitted && <p className="mt-3 rounded-xl border border-border/40 bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">💡 {q.explanation}</p>}
            </div>
          ))}

          {!submitted ? (
            <button onClick={submit} className="w-full rounded-2xl gradient-brand py-3 text-sm font-bold text-primary-foreground disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99] shadow">Submit Answers</button>
          ) : (
            <button onClick={() => { setQuiz(null); setPdfFile(null); setTopic(""); }} className="w-full rounded-2xl border border-border bg-card py-3 text-sm font-bold text-foreground hover:bg-muted transition-all">New Exam</button>
          )}
        </div>
      )}
    </div>
  );
}
