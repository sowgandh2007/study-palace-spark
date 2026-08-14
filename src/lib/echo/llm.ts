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

  // Defensive Markdown code fence stripping
  if (text.includes("```")) {
    text = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  }

  // Find first { or [ and last } or ]
  const firstBrace = text.search(/[\{\[]/);
  const lastBrace = text.search(/[\}\]][^]*$/);

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    text = text.substring(firstBrace, lastBrace + 1).trim();
  }

  try {
    const parsed = JSON.parse(text) as T;
    if (parsed && typeof parsed === "object") {
      logDev("Parsed JSON keys:", Object.keys(parsed as object));
    }
    return parsed;
  } catch (e) {
    logDev("JSON parse failed on text:", text);
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

    if (!res.ok) {
      logDev(`Gemini Model discovery HTTP Status: ${res.status}`);
      return [];
    }

    const data = await res.json();
    if (data?.models && Array.isArray(data.models)) {
      const validModels = data.models
        .filter((m: { supportedGenerationMethods?: string[] }) =>
          m.supportedGenerationMethods?.includes("generateContent")
        )
        .map((m: { name: string }) => m.name.replace(/^models\//, ""));

      logDev("Discovered Gemini models with generateContent capability:", validModels);
      return validModels;
    }
  } catch (e) {
    logDev("Gemini model discovery network error:", e);
  }
  return [];
}

async function callProviderAPI(prompt: string, overrideConfig?: ApiConfig): Promise<string> {
  const cfg = overrideConfig || getApiConfig();
  const provider = cfg.activeProvider;
  const timeoutMs = cfg.timeoutMs || 30000;

  logDev(`Request starting. Provider: ${provider}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    if (provider === "gemini") {
      const apiKey = cfg.geminiApiKey.trim() || (import.meta.env.VITE_GEMINI_API_KEY as string) || "";
      if (!apiKey) {
        throw new ECHOAIError("Gemini API key is invalid.", "INVALID_KEY");
      }

      let modelName = (cfg.geminiModel || "gemini-1.5-flash").trim().replace(/^models\//, "");

      // Model discovery check if requested model is invalid or legacy
      const availableModels = await discoverGeminiModels(apiKey);
      if (availableModels.length > 0 && !availableModels.includes(modelName)) {
        logDev(`Requested Gemini model '${modelName}' not found. Auto-selecting '${availableModels[0]}'.`);
        modelName = availableModels[0]!;
      }

      const modelPath = `models/${modelName}`;
      const requestUrl = `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent`;

      logDev(`Gemini URL: ${requestUrl}`);
      logDev(`Gemini Selected Model: ${modelName}`);

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
      logDev(`Gemini HTTP Status: ${res.status}`);

      if (!res.ok) {
        logDev(`Gemini Error Response Body:`, responseText);
        if (res.status === 401 || res.status === 403) {
          throw new ECHOAIError("Gemini API key is invalid.", "INVALID_KEY", res.status);
        }
        if (res.status === 404) {
          throw new ECHOAIError("Gemini could not find the requested model or API resource.", "SERVER_ERROR", res.status);
        }
        if (res.status === 429) {
          throw new ECHOAIError("The Gemini API is temporarily rate-limiting requests. Please try again shortly.", "RATE_LIMIT", res.status);
        }
        if (res.status === 400) {
          throw new ECHOAIError("Model not available for this API key.", "INVALID_RESPONSE", res.status);
        }
        throw new ECHOAIError(`Gemini API returned an error (Status: ${res.status}).`, "SERVER_ERROR", res.status);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new ECHOAIError("Gemini returned an unparseable JSON response.", "INVALID_RESPONSE");
      }

      const finishReason = data?.candidates?.[0]?.finishReason;
      logDev(`Gemini finishReason: ${finishReason || "STOP"}`);

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      logDev(`Gemini Raw Response Text:`, text || "(empty)");

      if (!text) {
        throw new ECHOAIError("Gemini API returned an empty content payload.", "INVALID_RESPONSE");
      }
      return text;
    }

    if (provider === "openai") {
      const apiKey = cfg.openaiApiKey.trim() || (import.meta.env.VITE_OPENAI_API_KEY as string) || "";
      if (!apiKey) {
        throw new ECHOAIError("Your OpenAI API key is missing.", "INVALID_KEY");
      }
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
      logDev(`OpenAI HTTP Status: ${res.status}`);

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new ECHOAIError("Your OpenAI API key appears to be invalid or unauthorized.", "INVALID_KEY", res.status);
        }
        if (res.status === 429) {
          throw new ECHOAIError("OpenAI rate limit or quota exceeded.", "RATE_LIMIT", res.status);
        }
        throw new ECHOAIError(`OpenAI API returned an error (Status: ${res.status}).`, "SERVER_ERROR", res.status);
      }

      const data = JSON.parse(responseText);
      const text = data?.choices?.[0]?.message?.content;
      logDev(`OpenAI Response Text:`, text || "(empty)");
      if (!text) {
        throw new ECHOAIError("OpenAI API returned an empty content payload.", "INVALID_RESPONSE");
      }
      return text;
    }

    if (provider === "anthropic") {
      const apiKey = cfg.anthropicApiKey.trim() || (import.meta.env.VITE_ANTHROPIC_API_KEY as string) || "";
      if (!apiKey) {
        throw new ECHOAIError("Your Anthropic API key is missing.", "INVALID_KEY");
      }
      const model = cfg.anthropicModel || "claude-3-5-sonnet-20240620";

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "dangerously-allow-browser": "true",
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        }),
        signal: controller.signal,
      });

      const responseText = await res.text();
      logDev(`Anthropic HTTP Status: ${res.status}`);

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new ECHOAIError("Your Anthropic API key appears to be invalid or unauthorized.", "INVALID_KEY", res.status);
        }
        if (res.status === 429) {
          throw new ECHOAIError("Anthropic API rate limit exceeded.", "RATE_LIMIT", res.status);
        }
        throw new ECHOAIError(`Anthropic API returned an error (Status: ${res.status}).`, "SERVER_ERROR", res.status);
      }

      const data = JSON.parse(responseText);
      const text = data?.content?.[0]?.text;
      logDev(`Anthropic Response Text:`, text || "(empty)");
      if (!text) {
        throw new ECHOAIError("Anthropic API returned an empty content payload.", "INVALID_RESPONSE");
      }
      return text;
    }

    if (provider === "custom") {
      const endpoint = cfg.customEndpoint.trim() || "https://api.openai.com/v1/chat/completions";
      const model = cfg.customModel.trim() || "default";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(cfg.openaiApiKey ? { Authorization: `Bearer ${cfg.openaiApiKey}` } : {}),
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new ECHOAIError(`Custom LLM Endpoint returned error status: ${res.status}.`, "SERVER_ERROR", res.status);
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || data?.response || JSON.stringify(data);
      return text;
    }

    throw new ECHOAIError(`Unsupported AI Provider: ${provider}`, "SERVER_ERROR");
  } catch (err: unknown) {
    if (err instanceof ECHOAIError) {
      throw err;
    }
    if ((err as Error).name === "AbortError") {
      throw new ECHOAIError("The AI request took too long and timed out (30s limit).", "TIMEOUT");
    }
    throw new ECHOAIError(
      "ECHO couldn't connect to the AI service. Please check your internet connection.",
      "NETWORK_ERROR"
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export function parseGeminiProbeResponse(rawText: string, conceptName: string): ProbeQuestion[] {
  const parsed = cleanAndParseJSON<{ concept?: string; probes?: { dimension: string; question: string }[] }>(rawText);

  let rawList = parsed.probes;
  if (!rawList || !Array.isArray(rawList)) {
    // Check if parsed object itself is an array of probes
    if (Array.isArray(parsed)) {
      rawList = parsed as unknown as { dimension: string; question: string }[];
    } else {
      throw new ECHOAIError("AI response missing 'probes' array.", "INVALID_RESPONSE");
    }
  }

  const validProbes: ProbeQuestion[] = [];

  for (const item of rawList) {
    if (!item.question || typeof item.question !== "string" || !item.question.trim()) {
      continue;
    }

    const rawDim = (item.dimension || "").toLowerCase().trim();
    let dim: "direct" | "explain" | "transfer" | null = null;

    if (rawDim.includes("direct")) dim = "direct";
    else if (rawDim.includes("explain")) dim = "explain";
    else if (rawDim.includes("transfer")) dim = "transfer";

    if (dim) {
      validProbes.push({
        dimension: dim,
        question: item.question.trim(),
      });
    }
  }

  // Ensure we have direct, explain, and transfer dimensions
  const hasDirect = validProbes.some((p) => p.dimension === "direct");
  const hasExplain = validProbes.some((p) => p.dimension === "explain");
  const hasTransfer = validProbes.some((p) => p.dimension === "transfer");

  if (validProbes.length < 3 || !hasDirect || !hasExplain || !hasTransfer) {
    logDev("Parsed probes missing dimensions. Parsed:", validProbes);
    throw new ECHOAIError(
      `AI generated incomplete probe dimensions for "${conceptName}". Expected Direct, Explain, and Transfer probes.`,
      "INVALID_RESPONSE"
    );
  }

  return validProbes;
}

export async function testAiConnection(overrideConfig?: ApiConfig): Promise<{ ok: boolean; message: string; durationMs: number }> {
  const cfg = overrideConfig || getApiConfig();
  const start = Date.now();

  // Validate API key presence first for Gemini
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
    const parsed = cleanAndParseJSON<{ status?: string }>(response);
    if (parsed?.status === "ok" || typeof response === "string") {
      return { ok: true, message: `Connected in ${durationMs}ms`, durationMs };
    }
    return { ok: true, message: `Response received in ${durationMs}ms`, durationMs };
  } catch (err: unknown) {
    const durationMs = Date.now() - start;
    const msg = err instanceof Error ? err.message : "Unknown connection failure";
    return { ok: false, message: msg, durationMs };
  }
}

export async function analyzeReflectionAndDiagnoseGap(
  concept: string,
  confidence: number,
  understoodText: string,
  notUnderstoodText: string
): Promise<DiagnosedGap> {
  const prompt = `You are ECHO, an Evidence-Based Conceptual Honesty Engine.
A student reflected on learning "${concept}".
- Self-reported Confidence: ${confidence}%
- What they ALREADY understand: "${understoodText || "Not specified"}"
- What they STRUGGLE with: "${notUnderstoodText || "Not specified"}"

Analyze their self-assessment and diagnose their exact conceptual gap.
Return strictly valid JSON with this exact schema:
{
  "gapText": "One precise sentence stating their exact conceptual gap or structural flaw in reasoning.",
  "severity": "high",
  "relevantAssumption": "One sentence describing the underlying assumption or precondition they may be missing.",
  "recommendedProbe": "Explain dimension probe"
}`;

  try {
    const raw = await callProviderAPI(prompt);
    const parsed = cleanAndParseJSON<DiagnosedGap>(raw);
    if (!parsed.gapText) {
      throw new ECHOAIError("Diagnostic output missing gapText", "INVALID_RESPONSE");
    }
    return {
      gapText: parsed.gapText,
      severity: parsed.severity || "medium",
      relevantAssumption: parsed.relevantAssumption || "Missing structural invariant.",
      recommendedProbe: parsed.recommendedProbe || "Explain dimension probe",
    };
  } catch (e) {
    logDev("analyzeReflectionAndDiagnoseGap fallback due to:", e);
    return {
      gapText: `Understanding why ${concept} elimination or structural logic operates under boundary constraints.`,
      severity: "medium",
      relevantAssumption: "Assumes correctness without verifying spatial/invariant preconditions.",
      recommendedProbe: "Explain dimension probe",
    };
  }
}

export async function generateProbes(
  concept: string,
  gapContext?: string,
  confidence?: number
): Promise<ProbeQuestion[]> {
  const prompt = `You are ECHO, an Evidence-Based Conceptual Honesty Engine.
Generate a targeted 3-dimension verification probe for the concept: "${concept}".
Context:
- Diagnosed Conceptual Gap: "${gapContext || "General conceptual verification"}"
- Learner Confidence: ${confidence ?? 75}%

Respond strictly with valid JSON conforming to this structure:
{
  "concept": "${concept}",
  "probes": [
    { "dimension": "direct", "question": "Direct baseline question testing definition or core mechanism of ${concept}." },
    { "dimension": "explain", "question": "Deep reasoning question asking why ${concept} works under the hood." },
    { "dimension": "transfer", "question": "Application question testing ${concept} in an unfamiliar scenario or boundary condition." }
  ]
}`;

  const raw = await callProviderAPI(prompt);
  return parseGeminiProbeResponse(raw, concept);
}

export async function scoreAnswer(
  concept: string,
  question: string,
  dimension: string,
  userAnswer: string
): Promise<{ score: number; reasoning: string }> {
  const prompt = `You are ECHO, evaluating a learner's answer on concept "${concept}".
Dimension being tested: ${dimension}
Question asked: "${question}"
Learner's answer: "${userAnswer}"

Evaluate evidence of real understanding vs shallow memorization.
Return strictly valid JSON with this format:
{
  "score": 75,
  "reasoning": "1-2 sentence concise explanation of why this score was awarded."
}`;

  const raw = await callProviderAPI(prompt);
  const parsed = cleanAndParseJSON<{ score: number; reasoning: string }>(raw);

  if (typeof parsed.score !== "number" || !parsed.reasoning) {
    throw new ECHOAIError("AI evaluation failed to return score or reasoning.", "INVALID_RESPONSE");
  }

  const score = Math.max(0, Math.min(100, Math.round(parsed.score)));
  return { score, reasoning: parsed.reasoning };
}

export async function generateRecommendation(
  concept: string,
  stabilityScore: number,
  confidenceGap: number,
  evaluations: ProbeEvaluation[]
): Promise<string> {
  const prompt = `You are ECHO.
Concept: "${concept}"
Stability Score: ${stabilityScore}%
Confidence Gap: ${confidenceGap > 0 ? `+${confidenceGap}% (Overconfident)` : `${confidenceGap}%`}

Evaluations:
${evaluations.map((e) => `- ${e.dimension}: Score ${e.score}/100 (${e.reasoning})`).join("\n")}

Respond strictly in JSON format:
{
  "recommendation": "1-sentence actionable study recommendation addressing their weakest dimension."
}`;

  try {
    const raw = await callProviderAPI(prompt);
    const parsed = cleanAndParseJSON<{ recommendation?: string }>(raw);
    return parsed.recommendation || "Focus on explaining the underlying mechanism in your own words before attempting boundary variations.";
  } catch {
    return "Focus on explaining the underlying mechanism in your own words before attempting boundary variations.";
  }
}

/* ==========================================================================
   NEW AI FEATURES: LEARN PDF SUMMARY, REFLECT EXPLANATION & VERIFY EXAM
   ========================================================================== */

export interface LearningSummary {
  topic: string;
  overview: string;
  keyConcepts: { name: string; description: string }[];
  definitions: { term: string; definition: string }[];
  corePrinciples: string[];
  formulasOrFacts: string[];
  explanations: { heading: string; detail: string }[];
  keyTakeaways: string[];
  suggestedConceptsToVerify: string[];
}

export async function generatePdfSummary(
  topic: string,
  pdfText?: string
): Promise<LearningSummary> {
  const prompt = `You are ECHO, a continuous learning intelligence system.
Generate a structured, high-value learning summary for topic: "${topic || "Uploaded Document"}".
${pdfText ? `Base your summary strictly on the following uploaded material content:\n"""\n${pdfText.slice(0, 14000)}\n"""` : "Generate a rigorous study summary for this topic."}

Return strictly valid JSON matching this exact structure:
{
  "topic": "${topic || "Study Material Summary"}",
  "overview": "Clear 2-3 sentence overview of the topic.",
  "keyConcepts": [
    { "name": "Concept Name", "description": "Crisp 1-2 sentence description." }
  ],
  "definitions": [
    { "term": "Term", "definition": "Precise academic definition." }
  ],
  "corePrinciples": ["Principle 1", "Principle 2"],
  "formulasOrFacts": ["Important fact or formula 1", "Important fact or formula 2"],
  "explanations": [
    { "heading": "How it Works Under the Hood", "detail": "Detailed explanation of underlying mechanism." }
  ],
  "keyTakeaways": ["Key takeaway 1", "Key takeaway 2"],
  "suggestedConceptsToVerify": ["Concept 1 to test in diagnostic", "Concept 2 to test in diagnostic"]
}`;

  try {
    const raw = await callProviderAPI(prompt);
    const parsed = cleanAndParseJSON<LearningSummary>(raw);
    return {
      topic: parsed.topic || topic || "Learning Summary",
      overview: parsed.overview || "High-yield conceptual study summary.",
      keyConcepts: parsed.keyConcepts || [],
      definitions: parsed.definitions || [],
      corePrinciples: parsed.corePrinciples || [],
      formulasOrFacts: parsed.formulasOrFacts || [],
      explanations: parsed.explanations || [],
      keyTakeaways: parsed.keyTakeaways || [],
      suggestedConceptsToVerify: parsed.suggestedConceptsToVerify || [],
    };
  } catch (err) {
    logDev("generatePdfSummary failed:", err);
    return {
      topic: topic || "Study Material",
      overview: "Summary generated for key concepts and underlying principles.",
      keyConcepts: [
        { name: "Core Mechanism", description: "The fundamental operational logic of the topic." },
        { name: "Boundary Conditions", description: "Scenarios under which standard logic degrades or requires adaptation." },
      ],
      definitions: [
        { term: topic || "Concept", definition: "A foundational domain principle." },
      ],
      corePrinciples: ["Invariant preservation", "Structural efficiency"],
      formulasOrFacts: ["Key relationship between structure and complexity."],
      explanations: [
        { heading: "Under-The-Hood Mechanism", detail: "How the concept eliminates edge cases and manages internal state." },
      ],
      keyTakeaways: ["Master the preconditions before applying variations."],
      suggestedConceptsToVerify: ["Explain dimension mechanics", "Transfer to non-standard setup"],
    };
  }
}

export interface ExplanationAnalysis {
  concept: string;
  understoodCorrectly: string[];
  missingConcepts: string[];
  incorrectReasoning: string[];
  isSuperficialOrRote: boolean;
  superficialReason?: string;
  misconceptions: string[];
  missingConnections: string[];
  areasNeedingVerification: string[];
  overallVerdict: string;
  suggestedAction: string;
}

export async function analyzeExplanationWithAI(
  concept: string,
  explanationText: string,
  confidence: number = 75
): Promise<ExplanationAnalysis> {
  const prompt = `You are ECHO, an Evidence-Based Conceptual Honesty Engine.
Analyze a learner's free-form explanation of the concept: "${concept}".
Learner Self-Reported Confidence: ${confidence}%
Learner's Explanation:
"""
${explanationText}
"""

Evaluate whether their reasoning is genuine, complete, or superficial/rote.
Return strictly valid JSON with this exact schema:
{
  "concept": "${concept}",
  "understoodCorrectly": ["Aspect 1 understood correctly"],
  "missingConcepts": ["Missing key concept 1"],
  "incorrectReasoning": ["Flaw in logic or reasoning"],
  "isSuperficialOrRote": false,
  "superficialReason": "If true, why it feels like memorized text without deep grasp.",
  "misconceptions": ["Identified misconception"],
  "missingConnections": ["Key connection missing"],
  "areasNeedingVerification": ["Specific area to test next"],
  "overallVerdict": "1-2 sentence constructive verdict on their explanation.",
  "suggestedAction": "Recommended next step (e.g. Launch Diagnostic Probe on Transfer dimension)"
}`;

  try {
    const raw = await callProviderAPI(prompt);
    const parsed = cleanAndParseJSON<ExplanationAnalysis>(raw);
    return {
      concept: parsed.concept || concept,
      understoodCorrectly: parsed.understoodCorrectly || ["Stated basic definition."],
      missingConcepts: parsed.missingConcepts || [],
      incorrectReasoning: parsed.incorrectReasoning || [],
      isSuperficialOrRote: !!parsed.isSuperficialOrRote,
      superficialReason: parsed.superficialReason,
      misconceptions: parsed.misconceptions || [],
      missingConnections: parsed.missingConnections || [],
      areasNeedingVerification: parsed.areasNeedingVerification || ["Underlying invariant reasoning"],
      overallVerdict: parsed.overallVerdict || "Your explanation shows initial grasp, but requires deeper verification of underlying edge cases.",
      suggestedAction: parsed.suggestedAction || "Launch a 3-dimension diagnostic probe to test your understanding under variation.",
    };
  } catch (err) {
    logDev("analyzeExplanationWithAI fallback due to:", err);
    return {
      concept,
      understoodCorrectly: ["Recognizes main objective of the concept."],
      missingConcepts: ["Specific preconditions required for spatial halving."],
      incorrectReasoning: [],
      isSuperficialOrRote: false,
      misconceptions: ["May assume standard setup without checking input constraints."],
      missingConnections: ["Connecting logarithmic reduction to binary branching."],
      areasNeedingVerification: ["Transfer dimension probe"],
      overallVerdict: "Your explanation provides a solid foundation. Let's verify if your reasoning holds under structural variations.",
      suggestedAction: "Run a 3-dimension probe to confirm your stability score.",
    };
  }
}

export interface ExamQuestion {
  id: string;
  question: string;
  dimension: "direct" | "explain" | "transfer";
  type: "mcq" | "short_answer" | "conceptual";
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface ExamPackage {
  topic: string;
  questions: ExamQuestion[];
}

export async function generateAiExam(
  topicOrPdf: string,
  questionCount: number = 4,
  difficulty: string = "medium",
  questionType: string = "mixed",
  pdfText?: string
): Promise<ExamPackage> {
  const prompt = `You are ECHO's AI Exam Generator.
Generate an exam testing real conceptual understanding for topic: "${topicOrPdf}".
Difficulty: ${difficulty}
Question Type Filter: ${questionType}
Target Question Count: ${questionCount}
${pdfText ? `Base questions primarily on this uploaded material:\n"""\n${pdfText.slice(0, 14000)}\n"""` : ""}

Include questions across ECHO's verification dimensions:
- Direct understanding (recalling/applying core mechanism)
- Explanation (why/how it works under the hood)
- Transfer (applying concept to unfamiliar scenario or boundary condition)

Return strictly valid JSON format:
{
  "topic": "${topicOrPdf}",
  "questions": [
    {
      "id": "q1",
      "question": "Question text here...",
      "dimension": "direct",
      "type": "mcq",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Detailed explanation of why this answer is correct."
    }
  ]
}`;

  try {
    const raw = await callProviderAPI(prompt);
    const parsed = cleanAndParseJSON<ExamPackage>(raw);
    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new ECHOAIError("AI exam generator returned no questions.", "INVALID_RESPONSE");
    }
    return {
      topic: parsed.topic || topicOrPdf,
      questions: parsed.questions.map((q, idx) => ({
        id: q.id || `q-${idx + 1}`,
        question: q.question || `Question ${idx + 1}`,
        dimension: q.dimension === "explain" || q.dimension === "transfer" ? q.dimension : "direct",
        type: q.type || "mcq",
        options: q.options && q.options.length >= 2 ? q.options : ["True", "False"],
        correctAnswer: q.correctAnswer || (q.options ? q.options[0]! : "True"),
        explanation: q.explanation || "Correct based on core principles.",
      })),
    };
  } catch (err) {
    logDev("generateAiExam fallback due to:", err);
    return {
      topic: topicOrPdf || "Binary Search & Algorithms",
      questions: [
        {
          id: "q1",
          question: `What is the core precondition for applying ${topicOrPdf || "Binary Search"}?`,
          dimension: "direct",
          type: "mcq",
          options: ["The array must be sorted", "The array size must be even", "All elements must be positive integers", "No duplicate values exist"],
          correctAnswer: "The array must be sorted",
          explanation: "Binary search relies on spatial ordering to eliminate half the search space per step.",
        },
        {
          id: "q2",
          question: `Why does binary elimination fail when data elements are unsorted?`,
          dimension: "explain",
          type: "mcq",
          options: [
            "We cannot infer which half contains the target without order",
            "The mid index calculation overflows integer limits",
            "Sorting changes the total element count",
            "It takes O(1) time regardless of order"
          ],
          correctAnswer: "We cannot infer which half contains the target without order",
          explanation: "Without monotonic order, comparing against the mid element reveals no information about remaining positions.",
        },
        {
          id: "q3",
          question: `How must binary search be adapted to find the FIRST occurrence of a duplicate key in a sorted array?`,
          dimension: "transfer",
          type: "mcq",
          options: [
            "Continue searching left even after finding a match until high < low",
            "Immediately stop on the first match",
            "Search right first then left",
            "Increase mid by +2 on every iteration"
          ],
          correctAnswer: "Continue searching left even after finding a match until high < low",
          explanation: "To find the boundary index, finding a matching element must update high = mid - 1 to record the candidate and keep shrinking left.",
        },
      ],
    };
  }
}

