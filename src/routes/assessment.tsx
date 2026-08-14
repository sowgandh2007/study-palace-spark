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
  Upload,
  FileText,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { EchoNavbar } from "@/components/EchoNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { generateLocalEchoCheck, type DiagnosticMCQ } from "@/lib/echo/localAi";
import { generateAiExam, type ExamQuestion, type ExamPackage } from "@/lib/echo/llm";
import { extractTextFromPdf, type PdfExtractResult } from "@/lib/echo/pdf";
import { calculateStabilityScore, calculateConfidenceGap, bandFor } from "@/lib/echo/scoring";
import type { ProbeEvaluation, StabilityResult } from "@/lib/echo/types";
import { useEcho } from "@/lib/echo/store";
import { toast } from "sonner";

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

  const [mode, setMode] = useState<"ai_exam" | "probe">("ai_exam");
  const [step, setStep] = useState<"input" | "answering" | "results">("input");

  // AI Exam Generator state
  const [examTopic, setExamTopic] = useState(
    searchConcept === "binary-search" || isDemo ? "Binary Search" : searchConcept ?? "Binary Search"
  );
  const [questionCount, setQuestionCount] = useState(4);
  const [difficulty, setDifficulty] = useState("medium");
  const [questionType, setQuestionType] = useState("mixed");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfData, setPdfData] = useState<PdfExtractResult | null>(null);
  const [extractingPdf, setExtractingPdf] = useState(false);
  const [loadingExam, setLoadingExam] = useState(false);

  // Active Exam/Probe State
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [examResults, setExamResults] = useState<{
    score: number;
    evaluations: ProbeEvaluation[];
    details: { question: ExamQuestion; userAns: string; isCorrect: boolean }[];
  } | null>(null);

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtractingPdf(true);
    try {
      const res = await extractTextFromPdf(file);
      setPdfFile(file);
      setPdfData(res);
      setExamTopic(file.name.replace(/\.pdf$/i, ""));
      toast.success(`Loaded PDF: ${file.name} (${res.pageCount} pages)`);
    } catch (err: any) {
      toast.error(err.message || "Failed to parse PDF.");
    } finally {
      setExtractingPdf(false);
    }
  }

  async function handleGenerateExam(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!examTopic.trim() && !pdfData) {
      toast.error("Please enter a topic or upload a PDF.");
      return;
    }

    setLoadingExam(true);
    try {
      const pkg = await generateAiExam(
        examTopic.trim(),
        questionCount,
        difficulty,
        questionType,
        pdfData?.text
      );
      setExamQuestions(pkg.questions);
      setCurrentIndex(0);
      setUserAnswers({});
      setExamResults(null);
      setStep("answering");
      toast.success("Generated AI Exam!");
    } catch (err: any) {
      toast.error("Exam generation failed. Using default probe questions.");
      // Fallback probe start
      startDefaultProbe();
    } finally {
      setLoadingExam(false);
    }
  }

  function startDefaultProbe() {
    const checkData = generateLocalEchoCheck(examTopic.trim() || "Binary Search", 75, "", "");
    const formattedQuestions: ExamQuestion[] = checkData.questions.map((q, i) => ({
      id: `probe-${i}`,
      question: q.question,
      dimension: q.dimension,
      type: "mcq",
      options: q.options.map((o) => o.text),
      correctAnswer: q.options.find((o) => o.score === 100)?.text || q.options[0]!.text,
      explanation: q.options.find((o) => o.score === 100)?.misconception || "Correct response.",
    }));
    setExamQuestions(formattedQuestions);
    setCurrentIndex(0);
    setUserAnswers({});
    setExamResults(null);
    setStep("answering");
  }

  function handleAnswerSelect(ans: string) {
    setUserAnswers({ ...userAnswers, [currentIndex]: ans });
  }

  function handleNext() {
    if (currentIndex < examQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      submitExam();
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }

  function submitExam() {
    let totalScore = 0;
    const details = examQuestions.map((q, idx) => {
      const userAns = userAnswers[idx] || "";
      const isCorrect = userAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
      if (isCorrect) totalScore += 1;
      return { question: q, userAns, isCorrect };
    });

    const finalPct = Math.round((totalScore / examQuestions.length) * 100);

    // Map to ECHO 3-dimension probe evaluations
    const directQuestions = details.filter((d) => d.question.dimension === "direct");
    const explainQuestions = details.filter((d) => d.question.dimension === "explain");
    const transferQuestions = details.filter((d) => d.question.dimension === "transfer");

    const directScore = directQuestions.length
      ? Math.round((directQuestions.filter((d) => d.isCorrect).length / directQuestions.length) * 100)
      : finalPct;
    const explainScore = explainQuestions.length
      ? Math.round((explainQuestions.filter((d) => d.isCorrect).length / explainQuestions.length) * 100)
      : finalPct;
    const transferScore = transferQuestions.length
      ? Math.round((transferQuestions.filter((d) => d.isCorrect).length / transferQuestions.length) * 100)
      : finalPct;

    const evalList: ProbeEvaluation[] = [
      { dimension: "direct", score: directScore, reasoning: `${directQuestions.filter((d) => d.isCorrect).length}/${directQuestions.length || 1} correct` },
      { dimension: "explain", score: explainScore, reasoning: `${explainQuestions.filter((d) => d.isCorrect).length}/${explainQuestions.length || 1} correct` },
      { dimension: "transfer", score: transferScore, reasoning: `${transferQuestions.filter((d) => d.isCorrect).length}/${transferQuestions.length || 1} correct` },
    ];

    const stabilityScore = calculateStabilityScore(evalList);
    const confidenceGap = calculateConfidenceGap(75, stabilityScore);
    const bandInfo = bandFor(stabilityScore);

    const resultObj: StabilityResult = {
      conceptName: examTopic.trim() || "Exam Concept",
      evaluatedAt: new Date().toISOString(),
      confidenceScore: 75,
      stabilityScore,
      confidenceGap,
      evaluations: evalList,
      recommendation: `Focus on repairing your weakest dimension (${evalList.sort((a, b) => a.score - b.score)[0]?.dimension}).`,
      isConfidentButFragile: confidenceGap >= 25 && stabilityScore < 60,
      bandLabel: bandInfo.label,
    };

    setLatestResult(resultObj);
    setExamResults({ score: finalPct, evaluations: evalList, details });
    setStep("results");
    toast.success(`Exam submitted! Score: ${finalPct}%`);
  }

  const currentQ = examQuestions[currentIndex];

  return (
    <div className="min-h-screen text-foreground selection:bg-primary/30 pb-28 md:pb-20">
      <EchoNavbar variant="dark" />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-xs">
                STAGE 4: VERIFY
              </Badge>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">AI Exam & Diagnostic Verification</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
              Verification Exam Generator
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Test whether your understanding survives direct application, under-the-hood reasoning, and unfamiliar transfer problems.
            </p>
          </div>
        </div>

        {/* Input / Config Screen */}
        {step === "input" && (
          <div className="glass-card p-6 sm:p-8 space-y-6">
            <form onSubmit={handleGenerateExam} className="space-y-6">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Topic Name <span className="text-destructive">*</span>
                </label>
                <Input
                  value={examTopic}
                  onChange={(e) => setExamTopic(e.target.value)}
                  placeholder="e.g. Binary Search, Normalization (3NF), TCP Flow Control"
                  className="mt-1.5 bg-black/40 border-white/10 text-white min-h-[46px]"
                />
              </div>

              {/* PDF Upload Option */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <FileText className="size-4 text-primary" /> Generate Exam from PDF Document (Optional)
                </label>

                {!pdfFile ? (
                  <div className="relative rounded-2xl border-2 border-dashed border-white/20 bg-black/20 hover:bg-black/30 p-5 text-center space-y-2 transition-colors">
                    <Upload className="size-6 text-primary mx-auto" />
                    <p className="text-xs font-bold text-white">Click or drag PDF to generate exam questions</p>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handlePdfUpload}
                      disabled={extractingPdf}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-primary/40 bg-primary/10 p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileText className="size-5 text-primary shrink-0" />
                      <span className="text-xs font-bold text-white truncate max-w-xs">{pdfFile.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPdfFile(null);
                        setPdfData(null);
                      }}
                      className="text-xs text-slate-400 hover:text-destructive"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Exam Options */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Question Count</label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl bg-black/40 border border-white/10 p-3 text-xs text-white"
                  >
                    <option value={3}>3 Questions</option>
                    <option value={4}>4 Questions</option>
                    <option value={6}>6 Questions</option>
                    <option value={10}>10 Questions</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="mt-1.5 w-full rounded-xl bg-black/40 border border-white/10 p-3 text-xs text-white"
                  >
                    <option value="easy">Baseline (Easy)</option>
                    <option value="medium">Rigorous (Medium)</option>
                    <option value="hard">Advanced (Hard)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Dimension Filter</label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value)}
                    className="mt-1.5 w-full rounded-xl bg-black/40 border border-white/10 p-3 text-xs text-white"
                  >
                    <option value="mixed">All 3 Dimensions (Mixed)</option>
                    <option value="direct">Direct Understanding</option>
                    <option value="explain">Under-the-Hood Explain</option>
                    <option value="transfer">Unfamiliar Transfer</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Button
                  type="submit"
                  size="lg"
                  disabled={loadingExam || extractingPdf}
                  className="w-full bg-primary hover:bg-primary/90 font-bold shadow-glow text-base min-h-[48px]"
                >
                  {loadingExam ? (
                    <>
                      <Loader2 className="mr-2 size-5 animate-spin" /> Generating AI Exam...
                    </>
                  ) : (
                    <>
                      Generate AI Verification Exam <Zap className="ml-2 size-5 text-warning" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Answering Screen */}
        {step === "answering" && currentQ && (
          <div className="glass-card p-6 sm:p-8 space-y-6">
            {/* Exam Header Bar */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-primary">
                  Question {currentIndex + 1} of {examQuestions.length}
                </span>
                <h2 className="text-sm font-bold text-white mt-0.5">{examTopic} Exam</h2>
              </div>
              <Badge variant="outline" className="text-xs uppercase font-mono border-primary/40 text-primary">
                {currentQ.dimension} Dimension
              </Badge>
            </div>

            {/* Question Text */}
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                {currentQ.question}
              </h3>

              {/* MCQ Options */}
              {currentQ.options && currentQ.options.length > 0 ? (
                <div className="space-y-3 pt-2">
                  {currentQ.options.map((opt, i) => {
                    const isSelected = userAnswers[currentIndex] === opt;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleAnswerSelect(opt)}
                        className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm transition-all min-h-[48px] flex items-center justify-between ${
                          isSelected
                            ? "border-primary bg-primary/20 text-white font-bold shadow-glow"
                            : "border-white/10 bg-black/30 text-slate-300 hover:border-white/30"
                        }`}
                      >
                        <span>{opt}</span>
                        {isSelected && <CheckCircle2 className="size-4 text-primary shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Textarea
                  rows={4}
                  value={userAnswers[currentIndex] || ""}
                  onChange={(e) => handleAnswerSelect(e.target.value)}
                  placeholder="Write your answer here..."
                  className="bg-black/40 border-white/10 text-white text-xs sm:text-sm"
                />
              )}
            </div>

            {/* Navigation Controls */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="border-white/20 text-white min-h-[44px]"
              >
                Previous
              </Button>

              <Button
                type="button"
                onClick={handleNext}
                disabled={!userAnswers[currentIndex]}
                className="bg-primary hover:bg-primary/90 font-bold shadow-glow min-h-[44px]"
              >
                {currentIndex === examQuestions.length - 1 ? "Submit Exam" : "Next Question"}
                <ArrowRight className="size-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Results Screen */}
        {step === "results" && examResults && (
          <div className="glass-card p-6 sm:p-8 space-y-6 border-primary/40 shadow-glow">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Verification Analysis</span>
                <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5">{examTopic} Exam Score</h2>
              </div>
              <div className="text-right">
                <span className="font-mono text-3xl font-extrabold text-primary">{examResults.score}%</span>
                <span className="text-[10px] text-slate-400 block font-mono uppercase">Total Accuracy</span>
              </div>
            </div>

            {/* Detailed Question Review */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Detailed Answer Analysis</h3>
              <div className="space-y-3">
                {examResults.details.map((item, i) => (
                  <div
                    key={i}
                    className={`rounded-xl p-4 border space-y-2 text-xs ${
                      item.isCorrect ? "bg-emerald-500/10 border-emerald-500/30" : "bg-rose-500/10 border-rose-500/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-white">{i + 1}. {item.question.question}</p>
                      <Badge variant="outline" className={`shrink-0 text-[10px] ${item.isCorrect ? "text-emerald-400 border-emerald-500/40" : "text-rose-400 border-rose-500/40"}`}>
                        {item.question.dimension}
                      </Badge>
                    </div>
                    <p className="text-slate-300">Your Answer: <strong className="text-white">{item.userAns || "None"}</strong></p>
                    {!item.isCorrect && (
                      <p className="text-rose-300 font-medium">Correct Answer: <strong>{item.question.correctAnswer}</strong></p>
                    )}
                    <p className="text-slate-400 leading-relaxed text-[11px] pt-1">{item.question.explanation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Button size="sm" variant="outline" onClick={() => setStep("input")} className="w-full sm:w-auto border-white/20 text-white min-h-[44px]">
                <RotateCcw className="size-4 mr-1.5" /> Take Another Exam
              </Button>
              <Button asChild size="sm" className="w-full sm:w-auto bg-primary hover:bg-primary/90 font-bold shadow-glow min-h-[44px]">
                <Link to="/dashboard">
                  View Updated Stability Dashboard <TrendingUp className="size-4 ml-1.5" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
