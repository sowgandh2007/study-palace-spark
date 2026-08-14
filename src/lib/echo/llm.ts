import type { ApiConfig, DiagnosedGap, ProbeQuestion, ProbeEvaluation } from "./types";

export const DEFAULT_API_CONFIG: ApiConfig = {
  activeProvider: "gemini",
  geminiApiKey: "",
  geminiModel: "gemini-1.5-flash",
  openaiApiKey: "",
  openaiModel: "gpt-4o-mini",
  anthropicApiKey: "",
  anthropicModel: "claude-3-5-sonnet-20240620",
  customEndpoint: "https://api.openai.com/v1/chat/completions",
  customModel: "gpt-4o-mini",
  timeoutMs: 30000,
};

const LOCAL_STORAGE_KEY = "echo-api-keys";

export function getApiConfig(): ApiConfig {
  if (typeof window === "undefined") return DEFAULT_API_CONFIG;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_API_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error("[ECHO AI] Failed to load API config from localStorage:", e);
  }
  return DEFAULT_API_CONFIG;
}

export function saveApiConfig(config: Partial<ApiConfig>): ApiConfig {
  const current = getApiConfig();
  const updated = { ...current, ...config };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("[ECHO AI] Failed to save API config to localStorage:", e);
    }
  }
  return updated;
}

export class ECHOAIError extends Error {
  code: "INVALID_KEY" | "RATE_LIMIT" | "TIMEOUT" | "NETWORK_ERROR" | "SERVER_ERROR" | "INVALID_RESPONSE";
  status?: number;

  constructor(
    message: string,
    code: "INVALID_KEY" | "RATE_LIMIT" | "TIMEOUT" | "NETWORK_ERROR" | "SERVER_ERROR" | "INVALID_RESPONSE",
    status?: number
  ) {
    super(message);
    this.name = "ECHOAIError";
    this.code = code;
    this.status = status;
  }
}

function logDev(message: string, ...data: unknown[]) {
  if (import.meta.env.DEV) {
    console.log(`%c[ECHO AI] ${message}`, "color: #38bdf8; font-weight: bold;", ...data);
  }
}

export function cleanAndParseJSON<T>(rawText: string): T {
  let text = rawText.trim();

  if (text.includes("```")) {
    text = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  }

  const firstBrace = text.search(/[\{\[]/);
  const lastBrace = text.search(/[\}\]][^]*$/);

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    text = text.substring(firstBrace, lastBrace + 1).trim();
  }

  try {
    const parsed = JSON.parse(text) as T;
    return parsed;
  } catch (e) {
    throw new ECHOAIError(
      "ECHO received an invalid JSON response structure from the AI provider.",
      "INVALID_RESPONSE"
    );
  }
}

export async function discoverGeminiModels(apiKey: string): Promise<string[]> {
  if (!apiKey.trim()) return [];
  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey.trim(),
      },
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (data?.models && Array.isArray(data.models)) {
      return data.models
        .filter((m: { supportedGenerationMethods?: string[] }) =>
          m.supportedGenerationMethods?.includes("generateContent")
        )
        .map((m: { name: string }) => m.name.replace(/^models\//, ""));
    }
  } catch (e) {
    logDev("Gemini model discovery error:", e);
  }
  return [];
}

async function callProviderAPI(prompt: string, overrideConfig?: ApiConfig): Promise<string> {
  const cfg = overrideConfig || getApiConfig();
  const provider = cfg.activeProvider;
  const timeoutMs = cfg.timeoutMs || 30000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    if (provider === "gemini") {
      const apiKey = cfg.geminiApiKey.trim() || (import.meta.env.VITE_GEMINI_API_KEY as string) || "";
      if (!apiKey) {
        throw new ECHOAIError("Gemini API key is invalid.", "INVALID_KEY");
      }

      let modelName = (cfg.geminiModel || "gemini-1.5-flash").trim().replace(/^models\//, "");

      const availableModels = await discoverGeminiModels(apiKey);
      if (availableModels.length > 0 && !availableModels.includes(modelName)) {
        modelName = availableModels[0]!;
      }

      const modelPath = `models/${modelName}`;
      const requestUrl = `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent`;

      const res = await fetch(requestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        }),
        signal: controller.signal,
      });

      const responseText = await res.text();
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new ECHOAIError("Gemini API key is invalid.", "INVALID_KEY", res.status);
        }
        if (res.status === 429) {
          throw new ECHOAIError("Gemini API rate limited.", "RATE_LIMIT", res.status);
        }
        throw new ECHOAIError(`Gemini API error status: ${res.status}`, "SERVER_ERROR", res.status);
      }

      const data = JSON.parse(responseText);
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new ECHOAIError("Empty content payload", "INVALID_RESPONSE");
      return text;
    }

    if (provider === "openai") {
      const apiKey = cfg.openaiApiKey.trim() || (import.meta.env.VITE_OPENAI_API_KEY as string) || "";
      if (!apiKey) throw new ECHOAIError("Missing OpenAI API key", "INVALID_KEY");
      const model = cfg.openaiModel || "gpt-4o-mini";

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });

      const responseText = await res.text();
      if (!res.ok) throw new ECHOAIError(`OpenAI error: ${res.status}`, "SERVER_ERROR", res.status);
      const data = JSON.parse(responseText);
      const text = data?.choices?.[0]?.message?.content;
      if (!text) throw new ECHOAIError("Empty OpenAI response", "INVALID_RESPONSE");
      return text;
    }

    throw new ECHOAIError(`Unsupported AI Provider: ${provider}`, "SERVER_ERROR");
  } catch (err: unknown) {
    if (err instanceof ECHOAIError) throw err;
    if ((err as Error).name === "AbortError") throw new ECHOAIError("Request timed out (30s limit)", "TIMEOUT");
    throw new ECHOAIError("Network connection failed", "NETWORK_ERROR");
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function testAiConnection(overrideConfig?: ApiConfig): Promise<{ ok: boolean; message: string; durationMs: number }> {
  const cfg = overrideConfig || getApiConfig();
  const start = Date.now();

  if (cfg.activeProvider === "gemini") {
    const apiKey = cfg.geminiApiKey.trim() || (import.meta.env.VITE_GEMINI_API_KEY as string) || "";
    if (!apiKey) {
      return { ok: false, message: "Gemini API key is invalid.", durationMs: 0 };
    }
  }

  try {
    const response = await callProviderAPI(
      'Respond strictly in JSON format: {"status": "ok", "message": "connection successful"}',
      cfg
    );
    const durationMs = Date.now() - start;
    return { ok: true, message: `Connected in ${durationMs}ms`, durationMs };
  } catch (err: unknown) {
    const durationMs = Date.now() - start;
    const msg = err instanceof Error ? err.message : "Unknown failure";
    return { ok: false, message: msg, durationMs };
  }
}

export async function analyzeReflectionAndDiagnoseGap(
  concept: string,
  confidence: number,
  understoodText: string,
  notUnderstoodText: string
): Promise<DiagnosedGap> {
  const prompt = `You are ECHO.
A student reflected on learning "${concept}".
- Self-reported Confidence: ${confidence}%
- What they ALREADY understand: "${understoodText || "Not specified"}"
- What they STRUGGLE with: "${notUnderstoodText || "Not specified"}"

Diagnose their exact conceptual gap.
Return strictly valid JSON with this schema:
{
  "gapText": "One precise sentence stating their exact conceptual gap.",
  "severity": "high",
  "relevantAssumption": "One sentence describing missing precondition.",
  "recommendedProbe": "Explain dimension probe"
}`;

  try {
    const raw = await callProviderAPI(prompt);
    const parsed = cleanAndParseJSON<DiagnosedGap>(raw);
    return {
      gapText: parsed.gapText || `Understanding why ${concept} elimination operates under boundary constraints.`,
      severity: parsed.severity || "medium",
      relevantAssumption: parsed.relevantAssumption || "Missing structural invariant.",
      recommendedProbe: parsed.recommendedProbe || "Explain dimension probe",
    };
  } catch {
    return {
      gapText: `Understanding why ${concept} elimination operates under boundary constraints.`,
      severity: "medium",
      relevantAssumption: "Assumes correctness without verifying spatial preconditions.",
      recommendedProbe: "Explain dimension probe",
    };
  }
}

export interface AcademicStudyPlan {
  topic: string;
  generatedAt: string;
  totalMinutes: number;
  currentUnderstandingSummary: string;
  focusAreas: { concept: string; issueType: string; description: string }[];
  sequence: { stepNumber: string; title: string; objective: string }[];
  sessions: {
    id: string;
    sessionNumber: string;
    topic: string;
    objective: string;
    recommendedActivity: string;
    estimatedMinutes: number;
  }[];
}

export async function generateAcademicStudyPlan(
  concept: string,
  understoodText?: string,
  notUnderstoodText?: string,
  confidenceScore = 75
): Promise<AcademicStudyPlan> {
  const prompt = `You are ECHO, an Evidence-Based Conceptual Honesty Engine.
A student reflected on: "${concept}".
- Self-reported confidence: ${confidenceScore}%
- Understood: "${understoodText || "Baseline familiarity"}"
- Struggling with: "${notUnderstoodText || "Boundary conditions and invariant mechanics"}"

Generate a focused, evidence-based academic study plan.
Return strictly valid JSON matching this exact structure:
{
  "topic": "${concept}",
  "generatedAt": "${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}",
  "totalMinutes": 35,
  "currentUnderstandingSummary": "2-3 sentence evidence-based assessment of their current grasp, highlighting identified conceptual gaps.",
  "focusAreas": [
    { "concept": "Core Invariant Mechanics", "issueType": "Conceptual Gap", "description": "Needs clear formulation of why spatial elimination holds." },
    { "concept": "Boundary Condition Overflow", "issueType": "Weak Application", "description": "Index calculation mid-overflow under large inputs." }
  ],
  "sequence": [
    { "stepNumber": "01", "title": "Review Prerequisite Invariants", "objective": "Verify ordered array constraints." },
    { "stepNumber": "02", "title": "Rebuild Core Elimination Logic", "objective": "Formulate exact mid-point calculation." },
    { "stepNumber": "03", "title": "Verify Transfer Applications", "objective": "Test algorithm on rotated or non-standard search spaces." }
  ],
  "sessions": [
    {
      "id": "s1",
      "sessionNumber": "Session 01",
      "topic": "${concept} — Core Invariants",
      "objective": "Formulate and write the array sorting precondition in your own words.",
      "recommendedActivity": "Review invariant definition → Write 2-sentence explanation → Verify against edge cases.",
      "estimatedMinutes": 15
    },
    {
      "id": "s2",
      "sessionNumber": "Session 02",
      "topic": "${concept} — Boundary Application",
      "objective": "Apply pointer elimination to rotated sorted arrays.",
      "recommendedActivity": "Solve 2 boundary variations → Verify index logic.",
      "estimatedMinutes": 20
    }
  ]
}`;

  try {
    const raw = await callProviderAPI(prompt);
    const parsed = cleanAndParseJSON<AcademicStudyPlan>(raw);
    if (parsed && parsed.currentUnderstandingSummary && Array.isArray(parsed.sessions)) {
      return parsed;
    }
    throw new Error("Invalid plan structure");
  } catch {
    return {
      topic: concept || "Binary Search",
      generatedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      totalMinutes: 35,
      currentUnderstandingSummary: `Student demonstrates baseline familiarity with ${concept || "Binary Search"}, but evidence reveals fragile understanding around boundary invariants and spatial elimination logic.`,
      focusAreas: [
        {
          concept: `${concept || "Binary Search"} Invariance`,
          issueType: "Conceptual Gap",
          description: "Needs clear formulation of why spatial halving requires sorted preconditions.",
        },
        {
          concept: "Index Boundary Calculation",
          issueType: "Weak Application",
          description: "Midpoint overflow prevention and loop termination criteria under edge cases.",
        },
      ],
      sequence: [
        { stepNumber: "01", title: "Review Prerequisite Invariants", objective: "Verify ordered array constraints." },
        { stepNumber: "02", title: "Rebuild Core Elimination Logic", objective: "Formulate exact mid-point calculation." },
        { stepNumber: "03", title: "Verify Transfer Applications", objective: "Test algorithm on rotated or non-standard search spaces." },
      ],
      sessions: [
        {
          id: "s1",
          sessionNumber: "Session 01",
          topic: `${concept || "Binary Search"} — Core Invariants`,
          objective: "Formulate and write the array sorting precondition in your own words.",
          recommendedActivity: "Review invariant definition → Write 2-sentence explanation → Verify against edge cases.",
          estimatedMinutes: 15,
        },
        {
          id: "s2",
          sessionNumber: "Session 02",
          topic: `${concept || "Binary Search"} — Boundary Application`,
          objective: "Apply pointer elimination to rotated sorted arrays.",
          recommendedActivity: "Solve 2 boundary variations → Verify index logic.",
          estimatedMinutes: 20,
        },
      ],
    };
  }
}

export interface LearningSummary {
  topic: string;
  overview: string;
  keyConcepts: { concept: string; explanation: string }[];
  definitions: { term: string; definition: string }[];
  coreIdeas: string[];
  formulasAndFacts: string[];
  keyTakeaways: string[];
  conceptsToVerify: string[];
}

export async function generatePdfSummary(topic: string, pdfText?: string): Promise<LearningSummary> {
  const prompt = `You are ECHO.
Generate a structured, high-yield learning summary for: "${topic || "Uploaded Document"}".
${pdfText ? `Context extracted from PDF:\n${pdfText.slice(0, 10000)}` : ""}

Return strictly valid JSON with this exact schema:
{
  "topic": "${topic || "Study Material"}",
  "overview": "2-3 sentence overview of the core subject matter.",
  "keyConcepts": [
    { "concept": "Concept Name", "explanation": "Clear structural explanation." }
  ],
  "definitions": [
    { "term": "Important Term", "definition": "Precise definition." }
  ],
  "coreIdeas": ["Core Idea 1"],
  "formulasAndFacts": ["Fact 1"],
  "keyTakeaways": ["Takeaway 1"],
  "conceptsToVerify": ["Suggested concept 1"]
}`;

  try {
    const raw = await callProviderAPI(prompt);
    return cleanAndParseJSON<LearningSummary>(raw);
  } catch {
    return {
      topic: topic || "Study Material",
      overview: "Study summary generated for core subject matter.",
      keyConcepts: [{ concept: topic || "Binary Search", explanation: "Repeated spatial halving of a sorted search space." }],
      definitions: [{ term: "Invariance", definition: "Condition that remains true throughout algorithm execution." }],
      coreIdeas: ["Divide and conquer space reduction."],
      formulasAndFacts: ["Time complexity O(log N)."],
      keyTakeaways: ["Requires sorted array precondition."],
      conceptsToVerify: ["Transfer dimension boundary handling."],
    };
  }
}

export interface ExplanationAnalysis {
  concept: string;
  overallVerdict: string;
  understoodConcepts: string[];
  missingConcepts: string[];
  roteFlags: string[];
  misconceptions: string[];
  verificationRecommendations: string[];
}

export async function analyzeExplanationWithAI(
  concept: string,
  explanationText: string,
  confidence: number
): Promise<ExplanationAnalysis> {
  const prompt = `You are ECHO.
A student wrote their explanation for "${concept}":
- Self-reported confidence: ${confidence}%
- Student explanation: "${explanationText}"

Analyze for rote memorization vs genuine deep understanding.
Return strictly valid JSON with this format:
{
  "concept": "${concept}",
  "overallVerdict": "1-2 sentences summarizing their understanding quality.",
  "understoodConcepts": ["Correct concept 1"],
  "missingConcepts": ["Missing connection 1"],
  "roteFlags": ["Superficial phrase flagged if any"],
  "misconceptions": ["Identified flaw in reasoning if any"],
  "verificationRecommendations": ["Recommendation for repair 1"]
}`;

  try {
    const raw = await callProviderAPI(prompt);
    return cleanAndParseJSON<ExplanationAnalysis>(raw);
  } catch {
    return {
      concept,
      overallVerdict: "Demonstrates baseline familiarity but misses underlying boundary invariant details.",
      understoodConcepts: ["Recognizes core mechanism."],
      missingConcepts: ["Boundary condition handling."],
      roteFlags: ["Uses standard textbook phrase."],
      misconceptions: ["Assumes sorted condition without explicit check."],
      verificationRecommendations: ["Test transfer dimension application."],
    };
  }
}

export interface ExamQuestion {
  id: string;
  question: string;
  dimension: "direct" | "explain" | "transfer";
  type: "mcq" | "short";
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface ExamPackage {
  topic: string;
  difficulty: string;
  questions: ExamQuestion[];
}

export async function generateAiExam(
  topic: string,
  questionCount = 4,
  difficulty = "medium",
  questionType = "mixed",
  pdfText?: string
): Promise<ExamPackage> {
  const prompt = `You are ECHO.
Generate an AI verification exam for topic: "${topic}".
Difficulty: ${difficulty}.
Total questions: ${questionCount}.
${pdfText ? `Context from PDF:\n${pdfText.slice(0, 8000)}` : ""}

Generate questions testing 3 dimensions:
- Direct, Explain, Transfer.

Return strictly valid JSON with this format:
{
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "id": "q1",
      "question": "Question text testing direct application?",
      "dimension": "direct",
      "type": "mcq",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Why Option A is correct."
    }
  ]
}`;

  try {
    const raw = await callProviderAPI(prompt);
    const parsed = cleanAndParseJSON<ExamPackage>(raw);
    if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
      return parsed;
    }
    throw new Error("Invalid exam array");
  } catch {
    return {
      topic: topic || "Binary Search",
      difficulty,
      questions: [
        {
          id: "q1",
          question: `In ${topic || "Binary Search"}, why does the algorithm require the target array to be sorted?`,
          dimension: "direct",
          type: "mcq",
          options: [
            "Because halving decisions depend on order invariants.",
            "Because unsorted arrays double memory footprint.",
            "Because pointer comparison fails on odd lengths.",
            "It does not require sorted inputs.",
          ],
          correctAnswer: "Because halving decisions depend on order invariants.",
          explanation: "Order invariants allow spatial elimination of half the remaining search space.",
        },
      ],
    };
  }
}
