import { useEffect, useState } from "react";
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
} from "lucide-react";
import { EchoLogo } from "@/routes/index";
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

  useEffect(() => {
    if (isDemo && !conceptInput) {
      setConceptInput("Binary Search");
      setConfidenceInput(90);
    }
  }, [isDemo, conceptInput]);

  async function handleStartProbe(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const concept = conceptInput.trim();
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
      setGenerating(false);
      setStep("answering");
    } catch (err: unknown) {
      setGenerating(false);
      setError((err as Error).message || "Failed to generate probes. Please try again.");
    }
  }

  async function handleSubmitAnswer() {
    const q = probes[index];
    const currentAnswerText = answersMap[index] ?? "";
    if (!q || !currentAnswerText.trim()) return;

    setEvaluating(true);

    let scoreRes: { score: number; reasoning: string };

    if (isDemo) {
      // Hardcoded evaluation with ~800ms simulated delay, 0 network requests
      await new Promise((r) => setTimeout(r, 800));
      const demoItem = DEMO_BINARY_SEARCH_DATA.probes[index];
      scoreRes = {
        score: demoItem?.demoScore ?? 50,
        reasoning: demoItem?.demoReasoning ?? "Pre-evaluated answer for demo.",
      };
    } else {
      try {
        scoreRes = await scoreAnswer(conceptInput, q.dimension, q.question, currentAnswerText);
      } catch (err: unknown) {
        setEvaluating(false);
        setError((err as Error).message || "Failed to evaluate answer.");
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

    const updatedEvals = [...evaluations.filter((e) => e.dimension !== q.dimension), newEval];
    setEvaluations(updatedEvals);
    setEvaluating(false);

    if (index < probes.length - 1) {
      setIndex(index + 1);
    } else {
      finalizeResults(updatedEvals);
    }
  }

  async function finalizeResults(finalEvals: ProbeEvaluation[]) {
    setStep("results");

    const directScore = finalEvals.find((s) => s.dimension === "direct")?.score ?? 0;
    const explainScore = finalEvals.find((s) => s.dimension === "explain")?.score ?? 0;
    const transferScore = finalEvals.find((s) => s.dimension === "transfer")?.score ?? 0;

    // Use single centralized scoring formula: round(direct*0.2 + explain*0.4 + transfer*0.4)
    const stabilityScore = calculateStabilityScore(directScore, explainScore, transferScore);
    const confidenceGap = calculateConfidenceGap(confidenceInput, stabilityScore);
    const band = bandFor(stabilityScore);

    const isConfidentButFragile = confidenceInput >= 70 && stabilityScore < 60;

    const lowestEval = [...finalEvals].sort((a, b) => a.score - b.score)[0];
    const weakestDim = lowestEval ? lowestEval.dimension : "transfer";

    let recText = "";
    if (isDemo) {
      recText = DEMO_BINARY_SEARCH_DATA.recommendation;
      setRecommendation(recText);
    } else {
      setLoadingRec(true);
      try {
        recText = await generateRecommendation(
          conceptInput,
          stabilityScore,
          band.label,
          weakestDim
        );
        setRecommendation(recText);
      } catch {
        recText = "Review your weakest dimension with step-by-step practice problems.";
        setRecommendation(recText);
      } finally {
        setLoadingRec(false);
      }
    }

    const resObj: StabilityResult = {
      conceptName: conceptInput,
      confidenceInput,
      stabilityScore,
      confidenceGap,
      isConfidentButFragile,
      bandLabel: band.label,
      evaluations: finalEvals,
      recommendation: recText || DEMO_BINARY_SEARCH_DATA.recommendation,
    };

    setLatestResult(resObj);
  }

  function handleReset() {
    setStep("input");
    setConceptInput("");
    setNotesInput("");
    setConfidenceInput(80);
    setProbes([]);
    setIndex(0);
    setAnswersMap({});
    setEvaluations([]);
    setError(null);
    setRecommendation("");
  }

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <EchoLogo />
          <div className="flex items-center gap-3">
            <ThemeSelect />
            {isDemo ? (
              <Badge variant="outline" className="border-warning/50 bg-warning/10 text-warning px-3 py-1 font-medium text-xs">
                <Zap className="mr-1.5 size-3.5" /> Guided Example (Hardcoded Demo)
              </Badge>
            ) : (
              <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary px-3 py-1 font-medium text-xs">
                <Sparkles className="mr-1.5 size-3.5 text-primary" /> Live AI Probe Engine
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 pt-8">
        {/* STEP 1: CONCEPT INPUT */}
        {step === "input" && (
          <div className="rounded-2xl border border-border bg-card p-6 card-shadow sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 border border-primary/30 text-primary">
                <ShieldQuestion className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Targeted Verification Probe</h1>
                <p className="text-xs text-muted-foreground">Define what you studied to generate your 3-dimension probe.</p>
              </div>
            </div>

            <form onSubmit={handleStartProbe} className="space-y-5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  What concept did you just study? <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  className="mt-1.5 bg-background/60"
                  placeholder="e.g. Recursion, Binary Search, Database Normalization"
                  value={conceptInput}
                  onChange={(e) => setConceptInput(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Paste notes or diagnosed gap (optional)
                </label>
                <Textarea
                  rows={3}
                  className="mt-1.5 bg-background/60"
                  placeholder="Paste key formulas, notes, or diagnosed gap from reflection..."
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    How confident are you that you understood this? (0–100%)
                  </label>
                  <span className="font-mono text-sm font-bold text-primary">{confidenceInput}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={confidenceInput}
                  onChange={(e) => setConfidenceInput(Number(e.target.value))}
                  className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary"
                />
                <div className="mt-1 flex justify-between font-mono text-[11px] text-muted-foreground">
                  <span>0% — Totally Lost</span>
                  <span>50% — Somewhat Clear</span>
                  <span>100% — Absolute Mastery</span>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                  {error}
                </div>
              )}

              <div className="pt-2">
                <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={!conceptInput.trim()}>
                  Generate Targeted Probe <ArrowRight className="ml-2 size-4" />
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: PROBE GENERATION LOADING */}
        {step === "generating" && (
          <div className="rounded-2xl border border-border bg-card p-8 card-shadow text-center space-y-4 sm:p-12">
            <Loader2 className="mx-auto size-8 animate-spin text-primary" />
            <h2 className="text-lg font-bold sm:text-xl">Generating 3-Dimension Probe for "{conceptInput}"</h2>
            <p className="mx-auto max-w-md text-xs text-muted-foreground">
              ECHO is designing 3 specific questions across Direct, Explain, and Transfer dimensions to verify whether your understanding survives under pressure.
            </p>
            <div className="mx-auto max-w-md space-y-2 pt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6 mx-auto" />
              <Skeleton className="h-4 w-4/6 mx-auto" />
            </div>
          </div>
        )}

        {/* STEP 3: PROBE ANSWERING + SCORING */}
        {step === "answering" && (
          <div className="space-y-6">
            {/* Progress Header */}
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="size-5 text-primary" />
                  <span className="font-bold sm:text-lg">{conceptInput}</span>
                </div>
                <span className="font-mono text-xs font-bold text-muted-foreground">
                  {index + 1} / {probes.length}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="bg-primary h-full transition-all duration-500"
                  style={{ width: `${((index + 1) / probes.length) * 100}%` }}
                />
              </div>

              {/* Dimension Pills */}
              <div className="mt-3 flex gap-2">
                {(["direct", "explain", "transfer"] as ProbeDimension[]).map((dim, i) => (
                  <span
                    key={dim}
                    className={cn(
                      "rounded-full border px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider transition-colors",
                      i < index
                        ? "border-success/50 bg-success/10 text-success"
                        : i === index
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {DIMENSION_CONFIG[dim].label} ({DIMENSION_CONFIG[dim].percentLabel})
                  </span>
                ))}
              </div>
            </div>

            {/* Probe Card */}
            {probes[index] && (
              <div key={index} className="rounded-2xl border border-border bg-card p-6 card-shadow sm:p-8">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold tracking-widest text-primary uppercase">
                    Probe {index + 1} of 3: {DIMENSION_CONFIG[probes[index]!.dimension].label}
                  </p>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    Weight: {DIMENSION_CONFIG[probes[index]!.dimension].percentLabel}
                  </span>
                </div>

                <h2 className="mt-3 text-lg font-bold leading-relaxed sm:text-xl">
                  {probes[index]!.question}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {DIMENSION_CONFIG[probes[index]!.dimension].blurb}
                </p>

                <div className="mt-6">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Your Answer
                  </label>
                  <Textarea
                    rows={5}
                    disabled={evaluating}
                    className="mt-1.5 bg-background/50 font-sans"
                    placeholder="Explain in 1-3 sentences. ECHO scores depth of reasoning, not vocabulary."
                    value={answersMap[index] ?? ""}
                    onChange={(e) => setAnswersMap({ ...answersMap, [index]: e.target.value })}
                  />
                </div>

                {error && (
                  <div className="mt-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                    {error}
                  </div>
                )}

                <div className="mt-6 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    disabled={index === 0 || evaluating}
                    onClick={() => {
                      setIndex(Math.max(0, index - 1));
                    }}
                  >
                    <ArrowLeft className="mr-1.5 size-4" /> Previous
                  </Button>

                  <Button
                    disabled={!(answersMap[index] ?? "").trim() || evaluating}
                    onClick={handleSubmitAnswer}
                  >
                    {evaluating ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" /> ECHO is evaluating...
                      </>
                    ) : index < probes.length - 1 ? (
                      <>
                        Next probe <ArrowRight className="ml-1.5 size-4" />
                      </>
                    ) : (
                      <>
                        Calculate Stability Score <Sparkles className="ml-1.5 size-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: RESULTS SCREEN */}
        {step === "results" && (
          <div className="space-y-6">
            {(() => {
              const directScore = evaluations.find((s) => s.dimension === "direct")?.score ?? 0;
              const explainScore = evaluations.find((s) => s.dimension === "explain")?.score ?? 0;
              const transferScore = evaluations.find((s) => s.dimension === "transfer")?.score ?? 0;

              // Use single centralized scoring formula: round(direct*0.2 + explain*0.4 + transfer*0.4)
              const stabilityScore = calculateStabilityScore(directScore, explainScore, transferScore);
              const confidenceGap = calculateConfidenceGap(confidenceInput, stabilityScore);
              const band = bandFor(stabilityScore);

              const isConfidentButFragile = confidenceInput >= 70 && stabilityScore < 60;

              let bandColorClass = "text-destructive border-destructive/40 bg-destructive/10";
              let bandIcon = ShieldAlert;

              if (band.id === "stable") {
                bandColorClass = "text-success border-success/40 bg-success/10";
                bandIcon = ShieldCheck;
              } else if (band.id === "developing") {
                bandColorClass = "text-primary border-primary/40 bg-primary/10";
                bandIcon = CheckCircle2;
              } else if (band.id === "fragile") {
                bandColorClass = "text-warning border-warning/40 bg-warning/10";
                bandIcon = ShieldAlert;
              }

              const BandIcon = bandIcon;

              return (
                <div className="rounded-2xl border border-border bg-card p-6 card-shadow sm:p-8 space-y-6">
                  <div className="flex flex-col items-center text-center">
                    <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                      Understanding Stability Score · {conceptInput}
                    </span>

                    <div className="mt-4 flex items-baseline justify-center gap-1 font-mono">
                      <span className="text-6xl font-extrabold sm:text-7xl">{stabilityScore}%</span>
                    </div>

                    <div className={cn("mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold", bandColorClass)}>
                      <BandIcon className="size-4" />
                      {band.label}
                    </div>

                    {/* Confident But Fragile Warning Badge */}
                    {isConfidentButFragile && (
                      <div className="mt-4 rounded-xl border border-warning/50 bg-warning/10 p-3 text-xs text-warning flex items-center gap-2 font-semibold">
                        <ShieldAlert className="size-4 shrink-0" />
                        <span>Confident but Fragile: Self-reported confidence ({confidenceInput}%) significantly exceeds verified evidence ({stabilityScore}%).</span>
                      </div>
                    )}

                    {/* Confidence vs Evidence Callout */}
                    <div className="mt-6 w-full rounded-2xl border border-border bg-background/60 p-4 text-center sm:text-left">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Self-reported vs Verified Evidence
                          </p>
                          <p className="mt-1 text-sm font-medium">
                            You said <span className="font-mono font-bold text-primary">{confidenceInput}% confident</span>. Evidence shows{" "}
                            <span className={cn("font-mono font-bold", stabilityScore < 60 ? "text-warning" : "text-success")}>
                              {stabilityScore}%
                            </span>.
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-xs text-muted-foreground">
                            Confidence Gap: {confidenceGap > 0 ? `+${confidenceGap}%` : `${confidenceGap}%`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dimension Score Breakdown Cards */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                      Dimension Score Breakdown
                    </h3>
                    <div className="grid gap-4 md:grid-cols-3">
                      {(["direct", "explain", "transfer"] as ProbeDimension[]).map((dim) => {
                        const item = evaluations.find((s) => s.dimension === dim);
                        const scoreVal = item ? item.score : 0;
                        const cfg = DIMENSION_CONFIG[dim];

                        return (
                          <div key={dim} className="rounded-xl border border-border bg-background/40 p-4 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                                  {cfg.label}
                                </span>
                                <span className="font-mono text-[11px] text-muted-foreground">Weight: {cfg.percentLabel}</span>
                              </div>

                              <div className="mt-3 flex items-baseline gap-1 font-mono">
                                <span className="text-2xl font-bold">{scoreVal}</span>
                                <span className="text-xs text-muted-foreground">/ 100</span>
                              </div>

                              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    scoreVal >= 80
                                      ? "bg-success"
                                      : scoreVal >= 50
                                      ? "bg-warning"
                                      : "bg-destructive"
                                  )}
                                  style={{ width: `${scoreVal}%` }}
                                />
                              </div>

                              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                                {item?.reasoning || "Evaluated dimension."}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* AI Recommendation Callout */}
                  <div className="rounded-2xl border border-primary/40 bg-primary/10 p-5">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="size-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                          ECHO Actionable Recommendation
                        </h4>
                        {loadingRec ? (
                          <Skeleton className="mt-2 h-4 w-3/4" />
                        ) : (
                          <p className="mt-1.5 text-sm font-medium leading-relaxed">
                            "{recommendation}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Navigation & Action Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button asChild size="lg" className="w-full sm:w-auto">
                      <Link to="/repair" search={{ concept: conceptInput }}>
                        Repair Concept Gap <ArrowRight className="ml-1.5 size-4" />
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" onClick={handleReset} className="w-full sm:w-auto">
                      <RotateCcw className="mr-2 size-4" /> Try another concept
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </main>
    </div>
  );
}
