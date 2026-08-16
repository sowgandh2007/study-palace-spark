import { callGeminiREST, cleanAndParseJSON, getApiConfig, getResolvedGeminiKey } from "./llm";
import type {
  ConceptBreakdown,
  Subconcept,
  DynamicProbeQuestion,
  DiagnosedGap,
  DynamicRepairActivity,
  DynamicRecheckProbe,
} from "./types";

export async function extractConceptBreakdown(
  conceptName: string,
  materialText?: string
): Promise<ConceptBreakdown> {
  const cfg = getApiConfig();
  const apiKey = getResolvedGeminiKey();

  const prompt = `You are ECHO.
Break down the topic "${conceptName}" into its core subconcepts.
${materialText ? `Context from material:\n${materialText.slice(0, 10000)}` : ""}

IMPORTANT JSON FORMATTING RULES:
1. Do not use unescaped double quotes inside string values. Use single quotes (') for any quotes inside text.
2. Return ONLY raw JSON without markdown formatting.

RETURN STRICTLY THIS JSON STRUCTURE:
{
  "concept": "${conceptName}",
  "overview": "2-sentence overview of ${conceptName}.",
  "subconcepts": [
    {
      "id": "sub-1",
      "name": "${conceptName} Baseline Invariants",
      "description": "Core structural rules and mandatory preconditions.",
      "keyInvariant": "Preconditions must be verified before state transitions."
    },
    {
      "id": "sub-2",
      "name": "${conceptName} Execution Flow",
      "description": "Under-the-hood mechanism and state evaluation.",
      "keyInvariant": "Logical execution must preserve structural invariants."
    },
    {
      "id": "sub-3",
      "name": "${conceptName} Boundary Conditions",
      "description": "Handling edge cases, duplicate inputs, and non-standard limits.",
      "keyInvariant": "Boundary conditions require explicit initial guards."
    }
  ]
}`;

  try {
    const raw = await callGeminiREST(prompt, apiKey, cfg.geminiModel || "gemini-3.5-flash", undefined, "extract_concept_breakdown");
    const parsed = cleanAndParseJSON<ConceptBreakdown>(raw);
    if (parsed && Array.isArray(parsed.subconcepts) && parsed.subconcepts.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error("[ECHO Pipeline] Concept breakdown error:", err);
  }

  // Dynamic fallback constructed directly from input topic name
  return {
    concept: conceptName,
    overview: `${conceptName} relies on core domain invariants, spatial/logical rules, and boundary execution conditions.`,
    subconcepts: [
      {
        id: "sub-1",
        name: `${conceptName} Baseline Invariants`,
        description: `Fundamental preconditions and structural rules governing ${conceptName}.`,
        keyInvariant: `Precondition invariants must be verified before execution.`,
      },
      {
        id: "sub-2",
        name: `${conceptName} Execution Flow`,
        description: `Under-the-hood state transitions and logical execution mechanism.`,
        keyInvariant: `State changes must maintain structural guarantees.`,
      },
      {
        id: "sub-3",
        name: `${conceptName} Boundary Conditions`,
        description: `Edge cases, non-standard inputs, and limit scenarios.`,
        keyInvariant: `Boundary conditions require explicit initial guards.`,
      },
    ],
  };
}

export async function generateDynamicProbeQuestions(
  conceptName: string,
  subconcepts?: Subconcept[],
  materialText?: string
): Promise<DynamicProbeQuestion[]> {
  const cfg = getApiConfig();
  const apiKey = getResolvedGeminiKey();

  const prompt = `You are ECHO.
Generate 3 diagnostic probe questions for topic: "${conceptName}".
${subconcepts ? `Subconcepts: ${subconcepts.map((s) => `${s.name} (${s.keyInvariant})`).join("; ")}` : ""}
${materialText ? `Material:\n${materialText.slice(0, 8000)}` : ""}

Generate 3 questions across 3 dimensions: "direct", "explain", "transfer".
Each question MUST have 4 options: 1 correct option (score: 100) and 3 distractors (scores: 40, 20, 0) with misconception flags.

IMPORTANT JSON RULES:
- Do NOT use unescaped double quotes inside strings. Use single quotes (') for any quotes inside text.
- Do NOT write newlines inside JSON string values.

RETURN STRICTLY VALID JSON ARRAY:
[
  {
    "id": "probe-direct",
    "dimension": "direct",
    "dimensionLabel": "Direct Definition",
    "subconceptName": "${conceptName} Baseline Invariants",
    "question": "What is the mandatory precondition and baseline objective of ${conceptName}?",
    "options": [
      { "text": "${conceptName} operates under defined invariants and preconditions.", "score": 100 },
      { "text": "${conceptName} operates on arbitrary unsorted states without preconditions.", "score": 35, "misconception": "Ignores mandatory precondition requirement." },
      { "text": "${conceptName} performs in constant O(1) time without verifying bounds.", "score": 20, "misconception": "Conflates concept with direct indexing." },
      { "text": "${conceptName} is an obsolete heuristic replaced by manual overrides.", "score": 0, "misconception": "Dismisses core concept validity." }
    ],
    "correctIndex": 0,
    "explanation": "Core preconditions must be satisfied before execution."
  },
  {
    "id": "probe-explain",
    "dimension": "explain",
    "dimensionLabel": "Under-The-Hood Reasoning",
    "subconceptName": "${conceptName} Execution Flow",
    "question": "Why does ${conceptName} fail when its core invariant is violated during execution?",
    "options": [
      { "text": "Violating the invariant breaks state guarantees and leads to invalid results.", "score": 100 },
      { "text": "The compiler automatically cancels execution if invariants are missing.", "score": 40, "misconception": "Confuses runtime logic with static compiler analysis." },
      { "text": "Memory allocation doubles whenever invariants are evaluated.", "score": 30, "misconception": "Confuses algorithmic logic with memory allocation." },
      { "text": "Invariant violations only affect visual output formatting.", "score": 10, "misconception": "Fails to recognize state corruption." }
    ],
    "correctIndex": 0,
    "explanation": "Invariants enforce state correctness across transitions."
  },
  {
    "id": "probe-transfer",
    "dimension": "transfer",
    "dimensionLabel": "Unfamiliar Transfer Scenario",
    "subconceptName": "${conceptName} Boundary Conditions",
    "question": "How must ${conceptName} be adapted under an unfamiliar boundary condition or high-load environment?",
    "options": [
      { "text": "Explicitly handle edge-case preconditions and adjust boundary state transitions.", "score": 100 },
      { "text": "Use standard baseline implementation without modifying boundary checks.", "score": 40, "misconception": "Assumes baseline handles boundary conditions automatically." },
      { "text": "Fall back to unconstrained linear iteration over all elements.", "score": 25, "misconception": "Linear fallback degrades complexity bounds." },
      { "text": "Bypass preconditions completely when operating under heavy load.", "score": 10, "misconception": "Ignores boundary safety guards." }
    ],
    "correctIndex": 0,
    "explanation": "Boundary conditions test whether invariant assumptions hold under non-standard inputs."
  }
]`;

  try {
    const raw = await callGeminiREST(prompt, apiKey, cfg.geminiModel || "gemini-3.5-flash", undefined, "generate_dynamic_probes");
    const parsed = cleanAndParseJSON<DynamicProbeQuestion[]>(raw);
    if (Array.isArray(parsed) && parsed.length >= 3 && parsed[0].options?.length === 4) {
      return parsed;
    }
  } catch (err) {
    console.error("[ECHO Pipeline] Probe generation error:", err);
  }

  // Dynamic fallback
  return [
    {
      id: "probe-direct",
      dimension: "direct",
      dimensionLabel: "Direct Definition",
      subconceptName: `${conceptName} Baseline Invariants`,
      question: `What is the core definition and mandatory precondition of ${conceptName}?`,
      options: [
        { text: `${conceptName} operates under strict structural invariants and verified preconditions.`, score: 100 },
        { text: `${conceptName} is an unconstrained heuristic that operates on arbitrary input states.`, score: 35, misconception: `Ignores mandatory precondition requirements for ${conceptName}.` },
        { text: `${conceptName} operates in constant O(1) time without verifying state bounds.`, score: 20, misconception: `Conflates ${conceptName} with direct memory indexing.` },
        { text: `${conceptName} is an obsolete pattern replaced by manual overrides.`, score: 0, misconception: "Dismisses validity of core computer science concept." },
      ],
      correctIndex: 0,
      explanation: `${conceptName} requires verified preconditions to ensure correctness.`,
    },
    {
      id: "probe-explain",
      dimension: "explain",
      dimensionLabel: "Under-The-Hood Reasoning",
      subconceptName: `${conceptName} Execution Flow`,
      question: `Why does ${conceptName} fail when its core invariant is violated during execution?`,
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
      id: "probe-transfer",
      dimension: "transfer",
      dimensionLabel: "Unfamiliar Transfer Scenario",
      subconceptName: `${conceptName} Boundary Conditions`,
      question: `How must ${conceptName} be adapted under an unfamiliar boundary condition or high-load environment?`,
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

export async function generateTargetedRepairActivity(
  conceptName: string,
  weakSubconcept: string,
  gapText?: string
): Promise<DynamicRepairActivity> {
  const cfg = getApiConfig();
  const apiKey = getResolvedGeminiKey();

  const prompt = `You are ECHO.
Generate a targeted 4-step repair activity for:
Concept: "${conceptName}"
Weak Subconcept: "${weakSubconcept}"
Diagnosed Gap: "${gapText || `Fragile understanding of ${weakSubconcept}.`}"

IMPORTANT JSON RULES:
- Do NOT use unescaped double quotes inside strings. Use single quotes (') inside string values.

RETURN STRICTLY THIS JSON STRUCTURE:
{
  "id": "repair-${Date.now()}",
  "conceptName": "${conceptName}",
  "weakSubconcept": "${weakSubconcept}",
  "gapText": "One sentence describing the exact gap to repair.",
  "priority": "High",
  "totalMinutes": 15,
  "steps": [
    {
      "step": 1,
      "title": "Review ${weakSubconcept} Invariant (4 min)",
      "instruction": "Detailed explanation of why ${weakSubconcept} holds and what breaks if violated."
    },
    {
      "step": 2,
      "title": "Explain Mechanism in Your Own Words (5 min)",
      "instruction": "Write 2 sentences explaining how ${weakSubconcept} operates under state changes.",
      "requiresStudentInput": true
    },
    {
      "step": 3,
      "title": "Apply to Boundary Condition (4 min)",
      "instruction": "Concrete exercise scenario testing ${weakSubconcept} under boundary conditions.",
      "requiresStudentInput": true
    },
    {
      "step": 4,
      "title": "ECHO Verification & Recheck (2 min)",
      "instruction": "Prepare to test your updated understanding on an unfamiliar probe."
    }
  ]
}`;

  try {
    const raw = await callGeminiREST(prompt, apiKey, cfg.geminiModel || "gemini-3.5-flash", undefined, "generate_targeted_repair");
    const parsed = cleanAndParseJSON<DynamicRepairActivity>(raw);
    if (parsed && Array.isArray(parsed.steps) && parsed.steps.length === 4) {
      return parsed;
    }
  } catch (err) {
    console.error("[ECHO Pipeline] Repair activity generation error:", err);
  }

  // Dynamic fallback
  return {
    id: `repair-${Date.now()}`,
    conceptName,
    weakSubconcept,
    gapText: gapText || `Understanding how ${weakSubconcept} operates under boundary constraints.`,
    priority: "High",
    totalMinutes: 15,
    beforeScore: 50,
    steps: [
      {
        step: 1,
        title: `Review ${weakSubconcept} Invariant (4 min)`,
        instruction: `Read: ${conceptName} relies on ${weakSubconcept}. Ensure structural preconditions hold before attempting spatial/relational state transitions.`,
      },
      {
        step: 2,
        title: "Explain Mechanism in Your Own Words (5 min)",
        instruction: `Write 2 sentences explaining why ${weakSubconcept} requires explicit invariant checks.`,
        requiresStudentInput: true,
      },
      {
        step: 3,
        title: "Apply to Boundary Condition (4 min)",
        instruction: `How does ${weakSubconcept} change when duplicate or non-standard inputs are introduced?`,
        requiresStudentInput: true,
      },
      {
        step: 4,
        title: "ECHO Verification & Recheck (2 min)",
        instruction: "Ready to test your updated understanding and calculate your real post-repair score increase.",
      },
    ],
  };
}

export async function generateDynamicRecheckProbe(
  conceptName: string,
  weakSubconcept: string
): Promise<DynamicRecheckProbe> {
  const cfg = getApiConfig();
  const apiKey = getResolvedGeminiKey();

  const prompt = `You are ECHO.
Generate 1 new recheck verification question testing repaired weak subconcept:
Concept: "${conceptName}"
Weak Subconcept Repaired: "${weakSubconcept}"

IMPORTANT JSON RULES:
- Do NOT use unescaped double quotes inside strings. Use single quotes (') inside string values.

RETURN STRICTLY THIS JSON STRUCTURE:
{
  "id": "recheck-${Date.now()}",
  "conceptName": "${conceptName}",
  "weakSubconcept": "${weakSubconcept}",
  "question": "New verification question testing ${weakSubconcept}?",
  "options": [
    { "text": "Correct answer demonstrating repaired understanding", "score": 100 },
    { "text": "Distractor 1", "score": 40, "misconception": "Residual fragile assumption." },
    { "text": "Distractor 2", "score": 20, "misconception": "Confuses boundary handling." },
    { "text": "Distractor 3", "score": 0, "misconception": "Superficial rote answer." }
  ],
  "correctIndex": 0,
  "explanation": "Why option 1 confirms true conceptual mastery of ${weakSubconcept}."
}`;

  try {
    const raw = await callGeminiREST(prompt, apiKey, cfg.geminiModel || "gemini-3.5-flash", undefined, "generate_recheck_probe");
    const parsed = cleanAndParseJSON<DynamicRecheckProbe>(raw);
    if (parsed && Array.isArray(parsed.options) && parsed.options.length === 4) {
      return parsed;
    }
  } catch (err) {
    console.error("[ECHO Pipeline] Recheck probe generation error:", err);
  }

  // Dynamic fallback
  return {
    id: `recheck-${Date.now()}`,
    conceptName,
    weakSubconcept,
    question: `Following your repair activity, how does ${conceptName} maintain correctness when ${weakSubconcept} is evaluated under boundary conditions?`,
    options: [
      { text: `Explicitly verify preconditions and maintain invariant guards throughout execution.`, score: 100 },
      { text: `Rely on baseline default behavior without explicit boundary checks.`, score: 35, misconception: "Residual fragile assumption." },
      { text: `Bypass invariant validation when input array is large.`, score: 20, misconception: "Confuses performance optimization with structural logic." },
      { text: `Invariants are optional documentation and do not affect runtime.`, score: 0, misconception: "Superficial rote answer." },
    ],
    correctIndex: 0,
    explanation: `Maintaining invariant guards confirms true conceptual understanding of ${weakSubconcept}.`,
  };
}
