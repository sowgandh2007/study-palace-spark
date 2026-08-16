import type { ProbeDimension, DiagnosedGap } from "./types";
import { generateDynamicProbeQuestions } from "./pipeline";

export interface DiagnosticMCQ {
  id: string;
  dimension: ProbeDimension;
  dimensionLabel: string;
  subconceptName?: string;
  question: string;
  options: {
    text: string;
    score: number;
    misconception?: string;
  }[];
  correctIndex: number;
  explanation: string;
}

export interface EchoCheckResult {
  concept: string;
  confidence: number;
  gapDiagnosis: DiagnosedGap;
  questions: DiagnosticMCQ[];
}

export function buildFallbackDiagnosticMCQs(conceptName: string): DiagnosticMCQ[] {
  const safeConcept = conceptName.trim();
  return [
    {
      id: `probe-${Date.now()}-1`,
      dimension: "direct",
      dimensionLabel: "Direct Definition",
      subconceptName: `${safeConcept} Preconditions`,
      question: `What is the core definition and mandatory precondition of ${safeConcept}?`,
      options: [
        { text: `${safeConcept} operates under strict structural invariants and verified preconditions.`, score: 100 },
        { text: `${safeConcept} is an unconstrained heuristic that operates on arbitrary input states.`, score: 35, misconception: `Ignores mandatory precondition requirements for ${safeConcept}.` },
        { text: `${safeConcept} operates in constant O(1) time without verifying state bounds.`, score: 20, misconception: `Conflates ${safeConcept} with direct memory indexing.` },
        { text: `${safeConcept} is an obsolete pattern replaced by manual overrides.`, score: 0, misconception: "Dismisses validity of core computer science concept." },
      ],
      correctIndex: 0,
      explanation: `${safeConcept} requires verified preconditions to ensure correctness.`,
    },
    {
      id: `probe-${Date.now()}-2`,
      dimension: "explain",
      dimensionLabel: "Under-The-Hood Reasoning",
      subconceptName: `${safeConcept} Execution Mechanism`,
      question: `Why does ${safeConcept} fail when its core invariant is violated during execution?`,
      options: [
        { text: `Because violating the invariant breaks state guarantees and leads to invalid output or infinite execution.`, score: 100 },
        { text: `Because the compiler automatically cancels execution if invariants are omitted in comments.`, score: 40, misconception: "Confuses runtime logic with compiler syntax parsing." },
        { text: `Because memory allocation doubles whenever invariants are evaluated.`, score: 30, misconception: "Confuses algorithmic logic with memory allocation." },
        { text: `It does not fail; invariant violations only affect visual formatting.`, score: 10, misconception: "Fails to recognize state corruption or invalid logic." },
      ],
      correctIndex: 0,
      explanation: "Invariants enforce logical correctness across state transitions.",
    },
    {
      id: `probe-${Date.now()}-3`,
      dimension: "transfer",
      dimensionLabel: "Unfamiliar Transfer Scenario",
      subconceptName: `${safeConcept} Boundary Conditions`,
      question: `How must ${safeConcept} be adapted under an unfamiliar boundary condition or high-load environment?`,
      options: [
        { text: "Explicitly handle edge-case preconditions and adjust boundary pointer or state transitions.", score: 100 },
        { text: "Use standard baseline implementation without modifying boundary checks.", score: 40, misconception: "Assumes baseline handles boundary conditions automatically." },
        { text: "Fall back to unconstrained linear iteration over all elements.", score: 25, misconception: "Linear fallback degrades complexity bounds." },
        { text: "Bypass preconditions completely when operating under heavy load.", score: 10, misconception: "Ignores boundary safety guards." },
      ],
      correctIndex: 0,
      explanation: "Boundary conditions test whether invariant assumptions hold under non-standard inputs.",
    },
  ];
}

export function generateLocalEchoCheck(
  conceptName: string,
  confidence: number,
  understoodText: string,
  notUnderstoodText: string
): EchoCheckResult {
  const safeConcept = conceptName.trim() || "Computer Science";
  const questions = buildFallbackDiagnosticMCQs(safeConcept);

  const gapDiagnosis: DiagnosedGap = {
    gapText: notUnderstoodText.trim()
      ? `Struggles with: "${notUnderstoodText.trim()}"`
      : `Uncertainty surrounding how ${safeConcept} operates under boundary variations.`,
    severity: confidence < 50 ? "high" : confidence < 75 ? "medium" : "low",
    relevantAssumption: `Assumes surface understanding without verifying invariant guarantees.`,
    recommendedProbe: "Explain and Transfer dimension checks",
  };

  return {
    concept: safeConcept,
    confidence,
    gapDiagnosis,
    questions,
  };
}

export async function generateAsyncEchoCheck(
  conceptName: string,
  confidence: number,
  understoodText: string,
  notUnderstoodText: string,
  materialText?: string
): Promise<EchoCheckResult> {
  const safeConcept = conceptName.trim() || "Computer Science";

  try {
    const dynamicProbes = await generateDynamicProbeQuestions(safeConcept, undefined, materialText);
    const questions: DiagnosticMCQ[] = dynamicProbes.map((dp) => ({
      id: dp.id,
      dimension: dp.dimension,
      dimensionLabel: dp.dimensionLabel,
      subconceptName: dp.subconceptName,
      question: dp.question,
      options: dp.options,
      correctIndex: dp.correctIndex,
      explanation: dp.explanation,
    }));

    const gapDiagnosis: DiagnosedGap = {
      gapText: notUnderstoodText.trim()
        ? `Struggles with: "${notUnderstoodText.trim()}"`
        : `Uncertainty surrounding how ${safeConcept} operates under boundary variations.`,
      severity: confidence < 50 ? "high" : confidence < 75 ? "medium" : "low",
      relevantAssumption: `Assumes surface understanding without verifying invariant guarantees.`,
      recommendedProbe: "Explain and Transfer dimension checks",
    };

    return {
      concept: safeConcept,
      confidence,
      gapDiagnosis,
      questions,
    };
  } catch (err) {
    console.error("[ECHO] Async echo check generation error:", err);
    return generateLocalEchoCheck(safeConcept, confidence, understoodText, notUnderstoodText);
  }
}
