import { useEffect, useState, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  Zap,
  TrendingUp,
  BookOpen,
  Loader2,
} from "lucide-react";
import { EchoNavbar } from "@/components/EchoNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { generateAsyncEchoCheck, type DiagnosticMCQ } from "@/lib/echo/localAi";
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
  const search = Route.useSearch();
  const searchConcept = search.concept;
  const searchGap = search.gap;
  const searchConf = search.confidence ? parseInt(search.confidence, 10) : 75;

  const { activeLearnMaterial, saveStabilityResult } = useEcho();

  const [conceptInput, setConceptInput] = useState(
    searchConcept || activeLearnMaterial?.topic || ""
  );
  const [confidenceInput, setConfidenceInput] = useState(searchConf);
  const [notUnderstoodText, setNotUnderstoodText] = useState(searchGap || "");

  const [step, setStep] = useState<"input" | "loading" | "answering" | "results">("input");
  const [questions, setQuestions] = useState<DiagnosticMCQ[]>([]);
  const [gapDiagnosisText, setGapDiagnosisText] = useState("");
  const [index, setIndex] = useState(0);

  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [evaluations, setEvaluations] = useState<ProbeEvaluation[]>([]);
  const [result, setResult] = useState<StabilityResult | null>(null);

  const hasAutoStarted = useRef(false);

  useEffect(() => {
    if (searchConcept) {
      setConceptInput(searchConcept);
    } else if (activeLearnMaterial?.topic) {
      setConceptInput(activeLearnMaterial.topic);
    }
  }, [searchConcept, activeLearnMaterial]);

  useEffect(() => {
    if (searchConcept && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      handleStartCheck();
    }
  }, [searchConcept]);

  async function handleStartCheck(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const concept = (conceptInput || searchConcept || activeLearnMaterial?.topic || "Concept Verification").trim();
    if (!concept) return;

    setStep("loading");
    const materialText = activeLearnMaterial?.summaryText || activeLearnMaterial?.htmlContent;
    const checkData = await generateAsyncEchoCheck(concept, confidenceInput, "", notUnderstoodText, materialText);

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
          : "Solid understanding demonstrated.",
        question: currentQ.question,
        answer: chosenOpt.text,
        subconceptName: currentQ.subconceptName,
      };
      const updatedEvals = [...evaluations, newEval];
      setEvaluations(updatedEvals);

      if (index < questions.length - 1) {
        setIndex(index + 1);
      } else {
        // Complete evaluation
        const stability = calculateStabilityScore(updatedEvals);
        const gap = calculateConfidenceGap(confidenceInput, stability);
        const band = bandFor(stability);
        const fragile = confidenceInput >= 70 && stability < 60;

        const conceptName = conceptInput || "Concept Verification";

        const rec = fragile
          ? `High overconfidence gap (${gap} pts). Re-examine structural invariants for ${conceptName}.`
          : `Stability index is ${stability}%. Practice boundary variations to reinforce conceptual strength.`;

        const sorted = [...updatedEvals].sort((a, b) => (a.score ?? 100) - (b.score ?? 100));
        const weakSub = sorted[0]?.subconceptName || `${conceptName} Invariants`;

        const stabRes: StabilityResult = {
          conceptName,
          evaluatedAt: new Date().toISOString(),
          confidenceScore: confidenceInput,
          confidenceInput,
          stabilityScore: stability,
          confidenceGap: gap,
          isConfidentButFragile: fragile,
          bandLabel: band.label,
          evaluations: updatedEvals,
          recommendation: rec,
          weakSubconcept: weakSub,
        };

        setResult(stabRes);
        saveStabilityResult(stabRes);
        setStep("results");
      }
    }
  }

  const currentQ = questions[index];

  return (
    <div className="min-h-screen bg-gradient-royal-ice-page selection:bg-primary/30 pb-28 md:pb-20">
      <EchoNavbar variant="light" />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">CURRENT CONCEPT</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1 uppercase border-b-2 border-primary/20 pb-1 mb-2 inline-block">
              {conceptInput || searchConcept || "Diagnostic Verification"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1">
              Test whether your understanding survives grounded reasoning and unfamiliar transfer problems.
            </p>
          </div>

          {activeLearnMaterial && activeLearnMaterial.topic === conceptInput && (
            <Badge variant="outline" className="border-primary/40 text-primary text-xs font-mono hidden sm:inline-flex">
              <BookOpen className="size-3 mr-1" /> From Learn
            </Badge>
          )}
        </div>

        {step === "input" && (
          <div className="glass-card-light p-6 sm:p-8 space-y-6 rounded-2xl bg-white/95 border border-slate-200 shadow-md">
            <form onSubmit={handleStartCheck} className="space-y-6">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Topic / Concept Name <span className="text-destructive">*</span>
                </label>
                <Input
                  value={conceptInput}
                  onChange={(e) => setConceptInput(e.target.value)}
                  placeholder="e.g. Binary Search, Arrays, SQL Joins, Deadlocks"
                  className="mt-1.5 bg-white border-slate-300 text-slate-900 min-h-[46px]"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Diagnosed Gap / Struggle Point (Optional)
                </label>
                <Input
                  value={notUnderstoodText}
                  onChange={(e) => setNotUnderstoodText(e.target.value)}
                  placeholder="e.g. Boundary conditions or invariant logic..."
                  className="mt-1.5 bg-white border-slate-300 text-slate-900 min-h-[46px]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Self-Reported Confidence</span>
                  <span className="font-mono text-primary font-extrabold">{confidenceInput}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={confidenceInput}
                  onChange={(e) => setConfidenceInput(parseInt(e.target.value, 10))}
                  className="w-full accent-primary"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={!conceptInput.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold shadow-glow text-base min-h-[48px]"
              >
                Generate Diagnostic Probes <Zap className="ml-2 size-5 text-warning" />
              </Button>
            </form>
          </div>
        )}

        {step === "loading" && (
          <div className="glass-card-light p-12 text-center space-y-4 rounded-2xl bg-white/95 border border-slate-200 shadow-md">
            <Loader2 className="size-10 text-primary animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-slate-900">Generating Diagnostic Verification Probes</h2>
            <p className="text-xs text-slate-600 font-medium">
              Generating topic-specific Direct, Explain, and Transfer probes for <span className="text-primary font-bold">{conceptInput || "your concept"}</span>...
            </p>
          </div>
        )}

        {step === "answering" && currentQ && (
          <div className="glass-card-light p-6 sm:p-8 space-y-6 rounded-2xl bg-white/95 border border-slate-200 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex flex-col mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                    Question {index + 1} / {questions.length} · {currentQ.questionType || currentQ.dimensionLabel}
                  </span>
                  {(currentQ.sourceConcept || currentQ.subconceptName) && (
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary mt-1">
                      FOCUS: {currentQ.sourceConcept || currentQ.subconceptName}
                    </span>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                  {currentQ.question}
                </h2>
              </div>
              <Badge variant="outline" className="border-primary/40 text-primary uppercase font-mono text-xs shrink-0">
                {currentQ.dimension}
              </Badge>
            </div>

            <div className="space-y-3">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOptions[index] === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(index, idx)}
                    className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-primary bg-primary/10 text-slate-900 font-bold shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span>{opt.text}</span>
                    {isSelected && <CheckCircle2 className="size-4 text-primary shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <Button
                onClick={handleNextQuestion}
                disabled={selectedOptions[index] === undefined}
                className="bg-primary hover:bg-primary/90 text-white font-bold shadow-glow min-h-[48px]"
              >
                {index < questions.length - 1 ? (
                  <>
                    Next Probe <ArrowRight className="ml-1.5 size-4" />
                  </>
                ) : (
                  <>
                    Complete Verification <TrendingUp className="ml-1.5 size-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "results" && result && (
          <div className="glass-card-light p-6 sm:p-10 text-center space-y-6 rounded-3xl bg-white border border-slate-200 shadow-lg">
            <div className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 border border-primary/20 text-primary mx-auto shadow-sm">
              <TrendingUp className="size-7" />
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Verification Telemetry · {result.conceptName}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
                Understanding Stability Telemetry
              </h1>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-6 items-center font-mono text-center">
              <div>
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">Self Confidence</span>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{result.confidenceScore}%</p>
              </div>
              <div className="border-x border-slate-200">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-primary">Demonstrated</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-primary mt-1">{result.stabilityScore}%</p>
              </div>
              <div>
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-destructive">Fragility Gap</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-destructive mt-1">
                  {result.confidenceGap > 0 ? `+${result.confidenceGap}` : "0"} pts
                </p>
              </div>
            </div>

            {/* Recommendations */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-slate-700 text-left space-y-1">
              <p className="font-bold text-primary">Diagnosis & Guidance:</p>
              <p className="font-medium leading-relaxed">{result.recommendation}</p>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold shadow-glow w-full sm:w-auto min-h-[48px]">
                <Link to="/repair" search={{ concept: result.conceptName }}>
                  Launch Targeted Intervention <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setStep("input")}
                className="border-slate-300 bg-white hover:bg-slate-50 text-slate-900 w-full sm:w-auto min-h-[48px]"
              >
                <RotateCcw className="mr-1.5 size-4" /> Test Another Concept
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
