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
  RefreshCw,
} from "lucide-react";
import { EchoLogo, HeaderNav } from "@/routes/index";
import { ThemeSelect } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  generateProbes,
  generateRecommendation,
  scoreAnswer,
  getApiConfig,
} from "@/lib/echo/llm";
import { calculateStabilityScore, calculateConfidenceGap, bandFor } from "@/lib/echo/scoring";
import { DEMO_BINARY_SEARCH_DATA } from "@/lib/echo/data";
import type { ProbeDimension, ProbeQuestion, ProbeEvaluation, StabilityResult } from "@/lib/echo/types";
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
      { title: "ECHO Assessment — Targeted Verification Probe" },
      {
        name: "description",
        content:
          "ECHO targeted verification probe: 3-dimension AI probing (Direct, Explain, Transfer), weighted scoring, confidence gap, and evidence-based results.",
      },
    ],
  }),
  component: AssessmentPage,
});

const DIMENSION_CONFIG: Record<
  ProbeDimension,
  { label: string; blurb: string; weight: number; percentLabel: string }
> = {
  direct: {
    label: "Direct",
    blurb: "Tests if you can produce the correct baseline answer.",
    weight: 0.2,
    percentLabel: "20%",
  },
  explain: {
    label: "Explain",
    blurb: "Tests 'why it works' — depth of reasoning, not recall.",
    weight: 0.4,
    percentLabel: "40%",
  },
  transfer: {
    label: "Transfer",
    blurb: "Tests applying the concept to a new/unfamiliar scenario.",
    weight: 0.4,
    percentLabel: "40%",
  },
};

function AssessmentPage() {
  const { concept: searchConcept, gap: searchGap, confidence: searchConf, demo } = Route.useSearch();
  const isDemo = Boolean(demo);
  const { setLatestResult } = useEcho();
  const apiConfig = getApiConfig();

  const [step, setStep] = useState<"input" | "generating" | "answering" | "results">("input");

  const [conceptInput, setConceptInput] = useState(
    searchConcept === "binary-search" || isDemo ? "Binary Search" : searchConcept ?? ""
  );
  const [notesInput, setNotesInput] = useState(searchGap ? `Diagnosed gap: ${searchGap}` : "");
  const [confidenceInput, setConfidenceInput] = useState(
    searchConf ? Number(searchConf) : isDemo ? 90 : 80
  );

  const [probes, setProbes] = useState<ProbeQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answersMap, setAnswersMap] = useState<Record<number, string>>({});
  const [evaluations, setEvaluations] = useState<ProbeEvaluation[]>([]);

  const [generating, setGenerating] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [recommendation, setRecommendation] = useState<string>("");
  const [loadingRec, setLoadingRec] = useState(false);

  const hasAutoStarted = useRef(false);

  // Auto-start probe generation if concept passed in URL search params
  useEffect(() => {
    if (searchConcept && !hasAutoStarted.current && step === "input" && !isDemo) {
      hasAutoStarted.current = true;
      handleStartProbe();
    }
  }, [searchConcept]);

  useEffect(() => {
    if (isDemo && !conceptInput) {
      setConceptInput("Binary Search");
      setConfidenceInput(90);
    }
  }, [isDemo, conceptInput]);

  async function handleStartProbe(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const concept = (conceptInput || searchConcept || "").trim();
    if (!concept) return;

    setError(null);
    setStep("generating");
    setGenerating(true);

    if (isDemo) {
      // Offline hardcoded demo path - 0 network calls
      setTimeout(() => {
        const demoProbes: ProbeQuestion[] = DEMO_BINARY_SEARCH_DATA.probes.map((p) => ({
          dimension: p.dimension,
          question: p.question,
        }));
        setProbes(demoProbes);
        setIndex(0);
        setAnswersMap({
          0: DEMO_BINARY_SEARCH_DATA.probes[0]!.demoAnswer,
          1: DEMO_BINARY_SEARCH_DATA.probes[1]!.demoAnswer,
          2: DEMO_BINARY_SEARCH_DATA.probes[2]!.demoAnswer,
        });
        setGenerating(false);
        setStep("answering");
      }, 400);
      return;
    }

    try {
      const generatedProbes = await generateProbes(concept, notesInput, confidenceInput);
      setProbes(generatedProbes);
      setIndex(0);
      setAnswersMap({});
      setEvaluations([]);
      setStep("answering");
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to generate AI probes. Please check your API Settings.");
      setStep("input");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmitAnswer() {
    const q = probes[index];
    const currentAnswerText = answersMap[index] ?? "";
    if (!q || !currentAnswerText.trim()) return;

    setEvaluating(true);
    setError(null);

    let scoreRes: { score: number; reasoning: string };

    if (isDemo) {
      const demoItem = DEMO_BINARY_SEARCH_DATA.probes[index];
      scoreRes = {
        score: demoItem ? demoItem.demoScore : 70,
        reasoning: demoItem ? demoItem.demoReasoning : "Baseline demo reasoning.",
      };
    } else {
      try {
        scoreRes = await scoreAnswer(conceptInput.trim(), q.question, q.dimension, currentAnswerText);
      } catch (err: unknown) {
        setError((err as Error).message || "Answer evaluation timed out or failed.");
        setEvaluating(false);
        return;
      }
    }

    const newEval: ProbeEvaluation = {
      dimension: q.dimension,
      score: scoreRes.score,
      reasoning: scoreRes.reasoning,
      question: q.question,
      answer: currentAnswerText,
    };

    const nextEvals = [...evaluations, newEval];
    setEvaluations(nextEvals);
    setEvaluating(false);

    if (index < probes.length - 1) {
      setIndex((i) => i + 1);
    } else {
      // Finished all probes -> compute stability score
      setStep("results");
      finalizeResults(nextEvals);
    }
  }

  async function finalizeResults(evals: ProbeEvaluation[]) {
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
      recommendation: "",
    };

    setLatestResult(resultObj);

    if (isDemo) {
      setRecommendation(DEMO_BINARY_SEARCH_DATA.recommendation);
      return;
    }

    setLoadingRec(true);
    try {
      const rec = await generateRecommendation(
        conceptInput.trim(),
        stabilityScore,
        confidenceGap,
        evals
      );
      setRecommendation(rec);
    } catch {
      setRecommendation("Focus on explaining the core elimination mechanism in your own words.");
    } finally {
      setLoadingRec(false);
    }
  }

  function handleReset() {
    setStep("input");
    setProbes([]);
    setIndex(0);
    setAnswersMap({});
    setEvaluations([]);
    setError(null);
    setGenerating(false);
    setEvaluating(false);
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
            <Link to="/settings" className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="API Settings">
              <Settings className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Dev Debug Bar */}
      {import.meta.env.DEV && (
        <div className="bg-secondary/80 border-b border-border px-6 py-1.5 text-[11px] font-mono text-muted-foreground flex items-center justify-between">
          <span>
            [DEV DEBUG] Active Provider: <strong className="text-primary">{apiConfig.activeProvider}</strong> ({apiConfig[`${apiConfig.activeProvider}Model` as keyof typeof apiConfig] || "default"})
          </span>
          <span>State: <strong className="text-foreground">{step}</strong> (generating: {String(generating)})</span>
        </div>
      )}

      <main className="mx-auto max-w-3xl px-6 pt-8">
        {/* Banner for Demo Mode */}
        {isDemo && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-xs text-warning">
            <div className="flex items-center gap-2">
              <Zap className="size-4 shrink-0" />
              <span>
                <strong>Guided Example (Hardcoded Demo)</strong> — Binary Search (0 network calls).
              </span>
            </div>
            <Badge variant="outline" className="border-warning/50 text-warning text-[10px]">
              Offline Demo
            </Badge>
          </div>
        )}

        {/* Error Banner / Retry UI */}
        {error && (
          <div className="mb-6 rounded-2xl border border-destructive/40 bg-destructive/10 p-5 space-y-3 text-xs">
            <div className="flex items-center gap-2 text-destructive font-bold">
              <AlertTriangle className="size-4 shrink-0" />
              <span>AI Service Error</span>
            </div>
            <p className="text-foreground leading-relaxed font-mono">{error}</p>

            <div className="pt-2 flex items-center gap-3">
              <Button size="sm" onClick={() => handleStartProbe()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                <RefreshCw className="mr-1.5 size-3.5" /> Retry Probe Generation
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/settings">Check API Settings</Link>
              </Button>
            </div>
          </div>
        )}

        {/* STEP 1: INPUT STEP */}
        {step === "input" && (
          <div className="rounded-2xl border border-border bg-card p-6 card-shadow sm:p-8 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Targeted Verification</span>
              <h1 className="text-2xl font-bold tracking-tight mt-1">ECHO Probe Engine</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Generate a 3-dimension probe (Direct, Explain, Transfer) to verify real understanding.
              </p>
            </div>

            <form onSubmit={handleStartProbe} className="space-y-5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Concept Name</label>
                <Input
                  required
                  value={conceptInput}
                  onChange={(e) => setConceptInput(e.target.value)}
                  placeholder="e.g. SQL, Binary Search, Normalization"
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
                  Diagnosed Gap / Context (Optional)
                </label>
                <Textarea
                  rows={2}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="e.g. Diagnosed gap: struggle with JOINs or spatial elimination..."
                  className="mt-1 bg-background/60 text-xs"
                />
              </div>

              <Button type="submit" size="lg" disabled={generating} className="w-full">
                {generating ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Generating Targeted Probe...
                  </>
                ) : (
                  <>
                    Generate 3-Dimension Probe <Sparkles className="ml-2 size-4" />
                  </>
                )}
              </Button>
            </form>
          </div>
        )}

        {/* STEP 2: GENERATING LOADING STEP */}
        {step === "generating" && (
          <div className="rounded-2xl border border-border bg-card p-10 text-center card-shadow space-y-6">
            <div className="inline-grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 border border-primary/30 text-primary mx-auto">
              <Loader2 className="size-8 animate-spin" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Targeted Verification</span>
              <h2 className="text-xl font-bold tracking-tight">Generating 3-Dimension Probe for "{conceptInput}"</h2>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                ECHO is querying <strong className="text-foreground">{apiConfig.activeProvider}</strong> to synthesize targeted probes testing Direct, Explain, and Transfer dimensions.
              </p>
            </div>

            <div className="pt-2 flex justify-center">
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs text-muted-foreground">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: ANSWERING STEP */}
        {step === "answering" && probes.length > 0 && (
          <div className="space-y-6">
            {/* Progress */}
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
              <span>Question {index + 1} of {probes.length}</span>
              <span className="uppercase text-primary font-bold">{probes[index]?.dimension} Dimension</span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((index + 1) / probes.length) * 100}%` }}
              />
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 card-shadow space-y-5 sm:p-8">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  {DIMENSION_CONFIG[probes[index]!.dimension].label} Probe ({DIMENSION_CONFIG[probes[index]!.dimension].percentLabel} Weight)
                </span>
                <span className="text-xs text-muted-foreground">
                  {DIMENSION_CONFIG[probes[index]!.dimension].blurb}
                </span>
              </div>

              <h2 className="text-base font-bold sm:text-lg leading-relaxed">{probes[index]!.question}</h2>

              <Textarea
                rows={5}
                value={answersMap[index] ?? ""}
                onChange={(e) => setAnswersMap({ ...answersMap, [index]: e.target.value })}
                placeholder="Write your detailed reasoning here..."
                className="bg-background/60 text-xs"
              />

              <div className="pt-2 flex justify-end">
                <Button
                  size="lg"
                  disabled={evaluating || !(answersMap[index] ?? "").trim()}
                  onClick={handleSubmitAnswer}
                >
                  {evaluating ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" /> Evaluating Answer...
                    </>
                  ) : index < probes.length - 1 ? (
                    <>
                      Submit & Next Dimension <ArrowRight className="ml-1.5 size-4" />
                    </>
                  ) : (
                    <>
                      Finalize Assessment <CheckCircle2 className="ml-1.5 size-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: RESULTS STEP */}
        {step === "results" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 card-shadow sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Targeted Verification Telemetry</span>
                  <h1 className="text-2xl font-bold tracking-tight mt-1">{conceptInput} Result</h1>
                </div>
                <Button size="sm" variant="outline" onClick={handleReset}>
                  <RotateCcw className="mr-1.5 size-3.5" /> Start New Assessment
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
                          You felt <strong>{confidenceInput}% confident</strong> in {conceptInput}, but verified evidence stability is <strong>{stScore}% ({band.label})</strong>. ECHO recommends immediate targeted repair.
                        </p>
                      </div>
                    )}

                    {/* Dimension Breakdown */}
                    <div className="space-y-3">
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">3-Dimension Score Breakdown</h2>
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

                    {/* AI Recommendation */}
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-primary">ECHO Action Recommendation</span>
                      <p className="text-xs text-foreground leading-relaxed font-medium">
                        {loadingRec ? "Generating recommendation..." : recommendation || "Focus on explaining why the invariant holds under edge cases."}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
                      <Button asChild size="lg" className="w-full sm:w-auto">
                        <Link to="/study-plan">View Tonight's Study Plan <ArrowRight className="ml-1.5 size-4" /></Link>
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
