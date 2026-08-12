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

  // Strip markdown code fences
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
    return JSON.parse(text) as T;
  } catch (e) {
    logDev("JSON parse failed on output:", text);
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
        }),
        signal: controller.signal,
      });

      const responseText = await res.text();
      logDev(`Gemini HTTP Status: ${res.status}`);
      logDev(`Gemini Raw Response:`, responseText);

      if (!res.ok) {
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
        throw new ECHOAIError("Gemini returned an invalid JSON payload.", "INVALID_RESPONSE");
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new ECHOAIError("Gemini API returned an empty or unreadable content payload.", "INVALID_RESPONSE");
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
      'Respond with valid JSON: {"status": "ok", "message": "connection successful"}',
      cfg
    );
    const durationMs = Date.now() - start;
    const parsed = cleanAndParseJSON<{ status: string }>(response);
    if (parsed.status === "ok" || typeof response === "string") {
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
Return strictly valid JSON with this format:
{
  "gapText": "One precise sentence stating their exact conceptual gap or structural flaw in reasoning.",
  "severity": "high" | "medium" | "low",
  "relevantAssumption": "One sentence describing the underlying assumption or precondition they may be missing.",
  "recommendedProbe": "Direct, Explain, or Transfer recommendation"
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

Generate EXACTLY 3 targeted probe questions corresponding to 3 distinct dimensions:
1. "direct": Tests if the learner can produce the correct baseline definition/answer directly.
2. "explain": Tests "why it works" — depth of reasoning and underlying mechanism, not recall.
3. "transfer": Tests applying the concept to a new, unfamiliar scenario or boundary condition.

Return strictly valid JSON in this format:
{
  "concept": "${concept}",
  "probes": [
    { "dimension": "direct", "question": "..." },
    { "dimension": "explain", "question": "..." },
    { "dimension": "transfer", "question": "..." }
  ]
}`;

  const raw = await callProviderAPI(prompt);
  const parsed = cleanAndParseJSON<{ concept: string; probes: ProbeQuestion[] }>(raw);

  if (!parsed.probes || !Array.isArray(parsed.probes) || parsed.probes.length < 3) {
    throw new ECHOAIError("AI output did not return 3 valid probe dimensions.", "INVALID_RESPONSE");
  }

  // Validate required dimensions
  const validProbes = parsed.probes.filter(
    (p) => (p.dimension === "direct" || p.dimension === "explain" || p.dimension === "transfer") && p.question?.trim()
  );

  if (validProbes.length < 3) {
    throw new ECHOAIError("AI output contained incomplete probe questions.", "INVALID_RESPONSE");
  }

  logDev("Probes generated successfully:", validProbes);
  return validProbes;
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
Return strictly valid JSON:
{
  "score": integer between 0 and 100,
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

Provide a 1-sentence actionable study recommendation addressing their weakest dimension.`;

  try {
    const raw = await callProviderAPI(prompt);
    return raw.trim().replace(/^"|"$/g, "");
  } catch {
    return "Focus on explaining the underlying mechanism in your own words before attempting boundary variations.";
  }
}
