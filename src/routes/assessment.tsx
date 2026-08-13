import { useEffect, useState, useRef } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Lightbulb,
  Loader2,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Sparkles,
  Zap,
  Settings,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import { EchoNavbar } from "@/components/EchoNavbar";
import { ThemeSelect } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateLocalEchoCheck, type DiagnosticMCQ, type EchoCheckResult } from "@/lib/echo/localAi";
import { calculateStabilityScore, calculateConfidenceGap, bandFor } from "@/lib/echo/scoring";
import type { ProbeEvaluation, StabilityResult } from "@/lib/echo/types";
import { useEcho } from "@/lib/echo/store";

export const Route = createFileRoute("/assessment")({
  validateSearch: (search: Record<string, unknown>) => ({
    concept: typeof search["concept"] === "string" ? (search["concept"] as string) : undefined,
    gap: typeof search["gap"] === "string" ? (search["gap"] as string) : undefined,
    confidence: typeof search["confidence"] === "string" ? (search["confidence"] as string) : undefined,
    demo: search["demo"] === "true" || search["demo"] === true,
  }),
  component: AssessmentPage,
});

function AssessmentPage() {
  const { concept: searchConcept, gap: searchGap, confidence: searchConf, demo } = Route.useSearch();
  const isDemo = Boolean(demo);
  const { setLatestResult } = useEcho();

  const [step, setStep] = useState<"input" | "answering" | "results">("input");

  const [conceptInput, setConceptInput] = useState(
    searchConcept === "binary-search" || isDemo ? "Binary Search" : searchConcept ?? "Binary Search"
  );
  const [notUnderstoodText, setNotUnderstoodText] = useState(searchGap ?? "");
  const [confidenceInput, setConfidenceInput] = useState(
    searchConf ? Number(searchConf) : isDemo ? 90 : 75
  );

  const [questions, setQuestions] = useState<DiagnosticMCQ[]>([]);
  const [index, setIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [evaluations, setEvaluations] = useState<ProbeEvaluation[]>([]);
  const [gapDiagnosisText, setGapDiagnosisText] = useState("");

  const hasAutoStarted = useRef(false);

  // Auto-start diagnostic check if concept passed in URL search params
  useEffect(() => {
    if (searchConcept && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      handleStartCheck();
    }
  }, [searchConcept]);

  function handleStartCheck(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const concept = (conceptInput || searchConcept || "Binary Search").trim();
    if (!concept) return;

    const checkData = generateLocalEchoCheck(concept, confidenceInput, "", notUnderstoodText);
    setQuestions(checkData.questions);
    setGapDiagnosisText(checkData.gapDiagnosis.gapText);
    setIndex(0);
    setSelectedOptions({});
    setEvaluations([]);
    setStep("answering");
  }

  function handleSelectOption(qIndex: number, optionIndex: number) {
    setSelectedOptions({ ...selectedOptions, [qIndex]: optionIndex });
  }

  function handleNextQuestion() {
    const currentQ = questions[index];
    const chosenOptIndex = selectedOptions[index];

    if (currentQ && chosenOptIndex !== undefined) {
      const chosenOpt = currentQ.options[chosenOptIndex]!;
      const newEval: ProbeEvaluation = {
        dimension: currentQ.dimension,
        score: chosenOpt.score,
        reasoning: chosenOpt.misconception
          ? `Misconception detected: ${chosenOpt.misconception}`
          : chosenOpt.score === 100
          ? "Correct reasoning selected."
          : `Selected option scored ${chosenOpt.score}/100.`,
        question: currentQ.question,
        answer: chosenOpt.text,
      };
      setEvaluations([...evaluations, newEval]);
    }

    if (index < questions.length - 1) {
      setIndex(index + 1);
    } else {
      finalizeResults([...evaluations, {
        dimension: questions[index]!.dimension,
        score: questions[index]!.options[selectedOptions[index]!]!.score,
        reasoning: questions[index]!.options[selectedOptions[index]!]!.misconception
          ? `Misconception detected: ${questions[index]!.options[selectedOptions[index]!]!.misconception}`
          : "Evaluated answer.",
        question: questions[index]!.question,
        answer: questions[index]!.options[selectedOptions[index]!]!.text,
      }]);
      setStep("results");
    }
  }

  function finalizeResults(evals: ProbeEvaluation[]) {
    const directEval = evals.find((e) => e.dimension === "direct");
    const explainEval = evals.find((e) => e.dimension === "explain");
    const transferEval = evals.find((e) => e.dimension === "transfer");

    const directScore = directEval ? directEval.score : 0;
    const explainScore = explainEval ? explainEval.score : 0;
    const transferScore = transferEval ? transferEval.score : 0;

    const stabilityScore = calculateStabilityScore(directScore, explainScore, transferScore);
    const confidenceGap = calculateConfidenceGap(confidenceInput, stabilityScore);

    const isConfidentButFragile = confidenceInput >= 70 && stabilityScore < 60;
    const band = bandFor(stabilityScore);

    const resultObj: StabilityResult = {
      conceptName: conceptInput.trim() || "Concept",
      confidenceInput,
      stabilityScore,
      confidenceGap,
      isConfidentButFragile,
      bandLabel: band.label,
      evaluations: evals,
      recommendation: `Focus on repairing your weakest dimension (${
        explainScore <= directScore && explainScore <= transferScore ? "Explain reasoning" : "Transfer application"
      }).`,
    };

    setLatestResult(resultObj);
  }

  function handleReset() {
    setStep("input");
    setQuestions([]);
    setIndex(0);
    setSelectedOptions({});
    setEvaluations([]);
    hasAutoStarted.current = false;
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 pb-28 md:pb-20">
      <EchoNavbar variant="dark" />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-6 sm:pt-8">
        {/* STEP 1: INPUT STEP */}
        {step === "input" && (
          <div className="glass-card p-6 sm:p-8 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Diagnostic Check</span>
              <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Start 3-Question ECHO Check</h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Evaluate your verified understanding across 3 core dimensions: Direct Definition, Under-The-Hood Reasoning, and Unfamiliar Transfer.
              </p>
            </div>

            <form onSubmit={handleStartCheck} className="space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Today's Concept Name</label>
                <Input
                  required
                  value={conceptInput}
                  onChange={(e) => setConceptInput(e.target.value)}
                  placeholder="e.g. SQL, Binary Search, DBMS Normalization"
                  className="mt-1 bg-black/40 border-white/10 text-white min-h-[44px]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
                  <span>Self-Reported Confidence</span>
                  <span className="font-mono text-primary font-bold">{confidenceInput}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={confidenceInput}
                  onChange={(e) => setConfidenceInput(Number(e.target.value))}
                  className="mt-2 h-2.5 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  What part didn't you understand? (Optional)
                </label>
                <Textarea
                  rows={2}
                  value={notUnderstoodText}
                  onChange={(e) => setNotUnderstoodText(e.target.value)}
                  placeholder="e.g. I struggle with spatial halving or inner vs outer joins..."
                  className="mt-1 bg-black/40 border-white/10 text-xs text-white"
                />
              </div>

              <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90 font-bold shadow-glow min-h-[48px]">
                Begin 3-Question ECHO Check <ArrowRight className="ml-2 size-4" />
              </Button>
            </form>
          </div>
        )}

        {/* STEP 2: ANSWERING DIAGNOSTIC MCQs */}
        {step === "answering" && questions.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300">
              <span>Question {index + 1} of {questions.length}</span>
              <span className="uppercase text-primary font-bold">{questions[index]?.dimensionLabel}</span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-primary transition-all duration-300 shadow-glow"
                style={{ width: `${((index + 1) / questions.length) * 100}%` }}
              />
            </div>

            <div className="glass-card p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  {questions[index]!.dimensionLabel}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {questions[index]!.dimension === "direct" ? "20% Weight" : "40% Weight"}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-bold leading-relaxed text-white">
                {questions[index]!.question}
              </h2>

              <div className="space-y-3">
                {questions[index]!.options.map((opt, optIdx) => {
                  const isSelected = selectedOptions[index] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(index, optIdx)}
                      className={`w-full rounded-xl border p-4 text-left text-xs sm:text-sm font-medium transition-all min-h-[52px] ${
                        isSelected
                          ? "border-primary bg-primary/20 text-white ring-1 ring-primary shadow-glow"
                          : "border-white/10 bg-black/20 hover:border-white/30 text-slate-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg border font-mono text-xs font-bold ${
                          isSelected ? "border-primary bg-primary text-white" : "border-white/20 text-slate-400"
                        }`}>
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="mt-0.5 leading-relaxed">{opt.text}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  size="lg"
                  disabled={selectedOptions[index] === undefined}
                  onClick={handleNextQuestion}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 font-bold shadow-glow min-h-[44px]"
                >
                  {index < questions.length - 1 ? (
                    <>
                      Next Question <ArrowRight className="ml-1.5 size-4" />
                    </>
                  ) : (
                    <>
                      View Understanding Map <Sparkles className="ml-1.5 size-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: UNDERSTANDING MAP & RESULTS */}
        {step === "results" && (
          <div className="space-y-6">
            <div className="glass-card p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Diagnostic Analysis Complete</span>
                  <h1 className="text-2xl font-bold tracking-tight text-white mt-1">{conceptInput} Understanding Map</h1>
                </div>
                <Button size="sm" variant="outline" onClick={handleReset} className="border-white/20 bg-white/5 hover:bg-white/10 min-h-[40px]">
                  <RotateCcw className="mr-1.5 size-3.5" /> Re-Check Concept
                </Button>
              </div>

              {(() => {
                const directEval = evaluations.find((e) => e.dimension === "direct");
                const explainEval = evaluations.find((e) => e.dimension === "explain");
                const transferEval = evaluations.find((e) => e.dimension === "transfer");

                const dScore = directEval ? directEval.score : 0;
                const eScore = explainEval ? explainEval.score : 0;
                const tScore = transferEval ? transferEval.score : 0;

                const stScore = calculateStabilityScore(dScore, eScore, tScore);
                const gap = calculateConfidenceGap(confidenceInput, stScore);
                const isTrap = confidenceInput >= 70 && stScore < 60;
                const band = bandFor(stScore);

                return (
                  <div className="space-y-6">
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                      <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-center space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Self-Reported Confidence</span>
                        <p className="font-mono text-3xl font-bold text-white">{confidenceInput}%</p>
                      </div>

                      <div className="rounded-xl border border-primary/40 bg-primary/10 p-4 text-center space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">ECHO Stability Score</span>
                        <p className="font-mono text-3xl font-extrabold text-primary">{stScore}%</p>
                        <span className="text-[11px] font-bold text-primary block">{band.label}</span>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-center space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Confidence Gap</span>
                        <p className={`font-mono text-3xl font-extrabold ${gap > 0 ? "text-destructive" : "text-success"}`}>
                          {gap > 0 ? `+${gap}%` : `${gap}%`}
                        </p>
                        <span className="text-[11px] text-slate-400 block">{gap > 0 ? "Overconfident" : "Calibrated"}</span>
                      </div>
                    </div>

                    {isTrap && (
                      <div className="rounded-2xl border border-warning/50 bg-warning/10 p-5 space-y-2">
                        <div className="flex items-center gap-2 text-warning font-bold text-sm uppercase tracking-wider">
                          <ShieldAlert className="size-5 shrink-0" />
                          <span>Confident but Fragile Warning</span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-200">
                          You felt <strong>{confidenceInput}% confident</strong> in {conceptInput}, but verified evidence stability is <strong>{stScore}% ({band.label})</strong>. ECHO recommends targeted repair.
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">3-Dimension Understanding Map</h2>
                      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                        {evaluations.map((ev) => (
                          <div key={ev.dimension} className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase text-primary">{ev.dimension}</span>
                              <span className="font-mono text-base font-bold text-white">{ev.score}/100</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">{ev.reasoning}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
                      <Button asChild size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 font-bold shadow-glow min-h-[48px]">
                        <Link to="/study-plan">View Personalized Study Plan <ArrowRight className="ml-1.5 size-4" /></Link>
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
