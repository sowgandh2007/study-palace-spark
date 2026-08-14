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
  TrendingUp,
} from "lucide-react";
import { EchoNavbar } from "@/components/EchoNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { generateLocalEchoCheck, type DiagnosticMCQ } from "@/lib/echo/localAi";
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
          : "Solid understanding demonstrated.",
      };
      const updatedEvals = [...evaluations, newEval];
      setEvaluations(updatedEvals);

      if (index < questions.length - 1) {
        setIndex(index + 1);
      } else {
        // Complete Diagnostic Verification
        const finalStability = calculateStabilityScore(updatedEvals);
        const finalGap = calculateConfidenceGap(confidenceInput, finalStability);
        const bandInfo = bandFor(finalStability);

        const resultObj: StabilityResult = {
          conceptName: conceptInput.trim() || "Binary Search",
          evaluatedAt: new Date().toISOString(),
          confidenceScore: confidenceInput,
          stabilityScore: finalStability,
          confidenceGap: finalGap,
          evaluations: updatedEvals,
          recommendation:
            finalGap >= 25 && finalStability < 60
              ? `High Overconfidence Gap Detected (+${finalGap}%). Review invariant mechanisms before relying on intuitive leaps.`
              : `Focus repair efforts on your weakest dimension (${updatedEvals.sort((a, b) => a.score - b.score)[0]?.dimension}).`,
          isConfidentButFragile: finalGap >= 25 && finalStability < 60,
          bandLabel: bandInfo.label,
        };

        setLatestResult(resultObj);
        setStep("results");
      }
    }
  }

  const currentQ = questions[index];

  return (
    <div className="min-h-screen bg-gradient-royal-ice-page selection:bg-primary/30 pb-28 md:pb-20">
      <EchoNavbar variant="light" />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">STAGE 4: VERIFY</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
            Diagnostic Verification Probe
          </h1>
          <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1">
            Test whether your understanding survives direct application, under-the-hood reasoning, and unfamiliar transfer problems.
          </p>
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
                  placeholder="e.g. Binary Search, TCP Flow Control"
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
                  placeholder="e.g. Why halving requires sorted order"
                  className="mt-1.5 bg-white border-slate-300 text-slate-900 min-h-[46px]"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold shadow-glow text-base min-h-[48px]"
              >
                Launch Diagnostic Verification <Zap className="ml-2 size-5 text-warning" />
              </Button>
            </form>
          </div>
        )}

        {step === "answering" && currentQ && (
          <div className="glass-card-light p-6 sm:p-8 space-y-6 rounded-2xl bg-white/95 border border-slate-200 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-primary">
                  Question {index + 1} of {questions.length}
                </span>
                <h2 className="text-sm font-bold text-slate-900 mt-0.5">{conceptInput}</h2>
              </div>
              <Badge variant="outline" className="text-xs uppercase font-mono border-primary/40 text-primary">
                {currentQ.dimension} Dimension
              </Badge>
            </div>

            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                {currentQ.question}
              </h3>

              <div className="space-y-3 pt-2">
                {currentQ.options.map((opt, oIdx) => {
                  const isSelected = selectedOptions[index] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => handleSelectOption(index, oIdx)}
                      className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm transition-all min-h-[48px] flex items-center justify-between ${
                        isSelected
                          ? "border-primary bg-primary/10 text-slate-900 font-bold shadow-sm"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span>{opt.text}</span>
                      {isSelected && <CheckCircle2 className="size-4 text-primary shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <Button
                type="button"
                onClick={handleNextQuestion}
                disabled={selectedOptions[index] === undefined}
                className="bg-primary hover:bg-primary/90 text-white font-bold shadow-glow min-h-[44px]"
              >
                {index === questions.length - 1 ? "Complete Verification" : "Next Question"}
                <ArrowRight className="size-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {step === "results" && (
          <div className="glass-card-light p-6 sm:p-8 space-y-6 rounded-2xl bg-white/95 border border-primary/40 shadow-md">
            <div className="border-b border-slate-200 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Verification Analysis</span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">{conceptInput} Result</h2>
            </div>

            <div className="space-y-3">
              {evaluations.map((item, i) => (
                <div key={i} className="rounded-xl p-4 border bg-slate-50 border-slate-200 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase text-primary font-mono">{item.dimension} Dimension</span>
                    <span className="font-mono font-bold text-slate-900">{item.score}/100</span>
                  </div>
                  <p className="text-slate-700 font-medium">{item.reasoning}</p>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Button size="sm" variant="outline" onClick={() => setStep("input")} className="w-full sm:w-auto border-slate-300 bg-white hover:bg-slate-50 text-slate-900 min-h-[44px]">
                <RotateCcw className="size-4 mr-1.5" /> Test Another Concept
              </Button>
              <Button asChild size="sm" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-bold shadow-glow min-h-[44px]">
                <Link to="/dashboard">
                  View Stability Index Dashboard <TrendingUp className="size-4 ml-1.5" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
