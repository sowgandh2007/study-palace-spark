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
import { EchoLogo, HeaderNav } from "@/routes/index";
import { ThemeSelect } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateLocalEchoCheck, type DiagnosticMCQ, type EchoCheckResult } from "@/lib/echo/localAi";
import { calculateStabilityScore, calculateConfidenceGap, bandFor } from "@/lib/echo/scoring";
import type { ProbeEvaluation, StabilityResult } from "@/lib/echo/types";
import { useEcho } from "@/lib/echo/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/assessment")({
  validateSearch: (search: Record<string, unknown>) => ({
    concept: typeof search["concept"] === "string" ? (search["concept"] as string) : undefined,
    gap: typeof search["gap"] === "string" ? (search["gap"] as string) : undefined,
    confidence: typeof search["confidence"] === "string" ? (search["confidence"] as string) : undefined,
    demo: search["demo"] === "true" || search["demo"] === true,
  }),
  head: () => ({
    meta: [
      { title: "ECHO Diagnostic Check — 3-Question Probe" },
      {
        name: "description",
        content:
          "ECHO 3-question diagnostic check: Direct, Explain, and Transfer MCQ evaluation with instant understanding map and personalized study plan generation.",
      },
    ],
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
    <div className="min-h-screen bg-background pb-20 text-foreground selection:bg-primary/20">
      <header className="sticky top-0 z-40 border-b border-border bg-card/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <EchoLogo />
          <HeaderNav />
          <div className="flex items-center gap-3">
            <ThemeSelect />
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-[10px]">
              Built-in Engine (Offline Mode)
            </Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pt-8">
        {/* STEP 1: INPUT STEP */}
        {step === "input" && (
          <div className="rounded-2xl border border-border bg-card p-6 card-shadow sm:p-8 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Diagnostic Check</span>
              <h1 className="text-2xl font-bold tracking-tight mt-1">Start 3-Question ECHO Check</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Evaluate your verified understanding across 3 core dimensions: Direct Definition, Under-The-Hood Reasoning, and Unfamiliar Transfer.
              </p>
            </div>

            <form onSubmit={handleStartCheck} className="space-y-5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Today's Concept Name</label>
                <Input
                  required
                  value={conceptInput}
                  onChange={(e) => setConceptInput(e.target.value)}
                  placeholder="e.g. SQL, Binary Search, DBMS Normalization"
                  className="mt-1 bg-background/60"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Self-Reported Confidence</span>
                  <span className="font-mono text-primary font-bold">{confidenceInput}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={confidenceInput}
                  onChange={(e) => setConfidenceInput(Number(e.target.value))}
                  className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  What part didn't you understand? (Optional)
                </label>
                <Textarea
                  rows={2}
                  value={notUnderstoodText}
                  onChange={(e) => setNotUnderstoodText(e.target.value)}
                  placeholder="e.g. I struggle with spatial halving or inner vs outer joins..."
                  className="mt-1 bg-background/60 text-xs"
                />
              </div>

              <Button type="submit" size="lg" className="w-full">
                Begin 3-Question ECHO Check <ArrowRight className="ml-2 size-4" />
              </Button>
            </form>
          </div>
        )}

        {/* STEP 2: ANSWERING DIAGNOSTIC MCQs */}
        {step === "answering" && questions.length > 0 && (
          <div className="space-y-6">
            {/* Progress */}
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
              <span>Question {index + 1} of {questions.length}</span>
              <span className="uppercase text-primary font-bold">{questions[index]?.dimensionLabel}</span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((index + 1) / questions.length) * 100}%` }}
              />
            </div>

            {/* Question Card */}
            <div className="rounded-2xl border border-border bg-card p-6 card-shadow space-y-6 sm:p-8">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  {questions[index]!.dimensionLabel}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {questions[index]!.dimension === "direct" ? "20% Weight" : "40% Weight"}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-bold leading-relaxed">
                {questions[index]!.question}
              </h2>

              {/* Options */}
              <div className="space-y-3">
                {questions[index]!.options.map((opt, optIdx) => {
                  const isSelected = selectedOptions[index] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(index, optIdx)}
                      className={`w-full rounded-xl border p-4 text-left text-xs sm:text-sm font-medium transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary"
                          : "border-border bg-background/50 hover:border-border/80 text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg border font-mono text-xs font-bold ${
                          isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border"
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
            <div className="rounded-2xl border border-border bg-card p-6 card-shadow sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Diagnostic Analysis Complete</span>
                  <h1 className="text-2xl font-bold tracking-tight mt-1">{conceptInput} Understanding Map</h1>
                </div>
                <Button size="sm" variant="outline" onClick={handleReset}>
                  <RotateCcw className="mr-1.5 size-3.5" /> Re-Check Concept
                </Button>
              </div>

              {/* Centralized Score Output */}
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
                    {/* Score Cards */}
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-xl border border-border bg-background/60 p-4 text-center space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Self-Reported Confidence</span>
                        <p className="font-mono text-3xl font-bold text-foreground">{confidenceInput}%</p>
                      </div>

                      <div className="rounded-xl border border-border bg-background/60 p-4 text-center space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">ECHO Stability Score</span>
                        <p className="font-mono text-3xl font-extrabold text-primary">{stScore}%</p>
                        <span className="text-[11px] font-semibold text-primary block">{band.label}</span>
                      </div>

                      <div className="rounded-xl border border-border bg-background/60 p-4 text-center space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Confidence Gap</span>
                        <p className={`font-mono text-3xl font-extrabold ${gap > 0 ? "text-destructive" : "text-success"}`}>
                          {gap > 0 ? `+${gap}%` : `${gap}%`}
                        </p>
                        <span className="text-[11px] text-muted-foreground block">{gap > 0 ? "Overconfident" : "Calibrated"}</span>
                      </div>
                    </div>

                    {/* Confident But Fragile Warning Callout */}
                    {isTrap && (
                      <div className="rounded-2xl border border-warning/50 bg-warning/10 p-5 space-y-2">
                        <div className="flex items-center gap-2 text-warning font-bold text-sm uppercase tracking-wider">
                          <ShieldAlert className="size-5 shrink-0" />
                          <span>Confident but Fragile Warning</span>
                        </div>
                        <p className="text-xs leading-relaxed text-foreground">
                          You felt <strong>{confidenceInput}% confident</strong> in {conceptInput}, but verified evidence stability is <strong>{stScore}% ({band.label})</strong>. ECHO recommends targeted repair.
                        </p>
                      </div>
                    )}

                    {/* Understanding Map Dimension Breakdown */}
                    <div className="space-y-3">
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">3-Dimension Understanding Map</h2>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {evaluations.map((ev) => (
                          <div key={ev.dimension} className="rounded-xl border border-border bg-background/50 p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase text-primary">{ev.dimension}</span>
                              <span className="font-mono text-base font-bold">{ev.score}/100</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{ev.reasoning}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Diagnosed Weak Areas */}
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Identified Weak Areas & Recommended Repair</span>
                      <p className="text-xs text-foreground leading-relaxed font-medium">
                        {gapDiagnosisText || `Focus on strengthening your reasoning in the ${
                          eScore <= dScore && eScore <= tScore ? "Explain (under-the-hood)" : "Transfer (unfamiliar scenario)"
                        } dimension before tomorrow's class.`}
                      </p>
                    </div>

                    {/* Action button */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
                      <Button asChild size="lg" className="w-full sm:w-auto">
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
