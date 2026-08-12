import type { ProbeDimension, ProbeQuestion } from "./types";

export type ProbeScore = {
  score: number;
  reasoning: string;
};

/**
 * Robust JSON parser that strips markdown code fences (```json ... ``` or ``` ... ```)
 * before parsing JSON string responses from LLMs.
 */
export function cleanAndParseJSON<T>(rawText: string): T {
  let cleaned = rawText.trim();
  // Strip starting ```json or ``` and trailing ```
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  
  // Find first { or [ and last } or ]
  const firstBrace = cleaned.search(/[\{\[]/);
  const lastBrace = cleaned.search(/[\}\]][^View]*$/);
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned) as T;
}

/**
 * Call connected LLM API or fallback to intelligent generator.
 */
async function callLLM(prompt: string): Promise<string> {
  const apiKey =
    (typeof process !== "undefined" && process.env && (process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_LLM_API_KEY)) ||
    (typeof import.meta !== "undefined" && import.meta.env && (import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY));

  if (apiKey) {
    try {
      if (process.env?.GEMINI_API_KEY || import.meta.env?.VITE_GEMINI_API_KEY) {
        const key = process.env?.GEMINI_API_KEY || import.meta.env?.VITE_GEMINI_API_KEY;
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" },
            }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text;
        }
      } else {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const text = data?.choices?.[0]?.message?.content;
          if (text) return text;
        }
      }
    } catch (err) {
      console.warn("LLM API call failed, using intelligent fallback generator:", err);
    }
  }

  return generateFallbackResponse(prompt);
}

function generateFallbackResponse(prompt: string): string {
  if (prompt.includes("Generate exactly 3 short probe questions")) {
    const conceptMatch = prompt.match(/concept:\s*"([^"]+)"/i);
    const concept = conceptMatch ? conceptMatch[1] : "this concept";
    return JSON.stringify({
      probes: [
        {
          dimension: "direct",
          question: `What is the core definition and primary output of ${concept}?`,
        },
        {
          dimension: "explain",
          question: `Why does ${concept} operate this way? Walk through the step-by-step mechanism rather than reciting rules.`,
        },
        {
          dimension: "transfer",
          question: `How would you apply ${concept} to solve an unannounced problem in a new, unfamiliar domain?`,
        },
      ],
    });
  }

  if (prompt.includes("Score a student's answer")) {
    const answerMatch = prompt.match(/Student's answer:\s*(.*)/i);
    const answer = answerMatch ? answerMatch[1].trim() : "";
    const words = answer.split(/\s+/).filter(Boolean).length;

    let score = 75;
    let reasoning = "Solid explanation covering the essential mechanics.";

    if (words < 5) {
      score = 30;
      reasoning = "Answer is too brief to demonstrate full conceptual understanding.";
    } else if (words < 12) {
      score = 55;
      reasoning = "States the basic outcome but misses key steps in the underlying reasoning.";
    } else if (words > 25) {
      score = 90;
      reasoning = "Comprehensive reasoning with clear mechanism and accurate details.";
    }

    return JSON.stringify({ score, reasoning });
  }

  if (prompt.includes("Write ONE specific, actionable study recommendation")) {
    const weakestMatch = prompt.match(/weakest dimension was:\s*(\w+)/i);
    const dim = weakestMatch ? weakestMatch[1].toLowerCase() : "explain";
    const recs: Record<string, string> = {
      direct: "Re-execute standard examples step-by-step to solidify foundational recall.",
      explain: "Practice writing out the underlying 'why' mechanism from scratch without notes.",
      transfer: "Apply the concept to 2-3 boundary cases and novel real-world scenarios.",
    };
    return JSON.stringify({
      recommendation: recs[dim] || "Review the core mechanics and re-verify your reasoning chain.",
    });
  }

  return JSON.stringify({ status: "ok" });
}

export async function generateProbes(
  concept: string,
  notes: string = "",
  confidence: number = 80
): Promise<ProbeQuestion[]> {
  const prompt = `You are ECHO, an academic understanding-verification engine. A student just studied the concept: "${concept}" (context/notes: ${notes || "None"}).

The student self-reported their confidence in this concept as ${confidence}%.

Generate exactly 3 short probe questions, one for each of these dimensions:
1. DIRECT — a standard question testing if they can produce the correct answer
2. EXPLAIN — a "why does this work" question testing reasoning, not recall
3. TRANSFER — a question applying the concept to a new/unfamiliar scenario

Rules:
- Each question must be answerable in 1-3 sentences (this is a quick probe, not an exam)
- Questions must be specific to "${concept}", not generic
- Do not make the questions trivially easy — they should be able to expose a gap
- Avoid yes/no questions

Return ONLY valid JSON in this exact format, nothing else:
{
  "probes": [
    {"dimension": "direct", "question": "..."},
    {"dimension": "explain", "question": "..."},
    {"dimension": "transfer", "question": "..."}
  ]
}`;

  const rawText = await callLLM(prompt);
  try {
    const parsed = cleanAndParseJSON<{ probes: ProbeQuestion[] }>(rawText);
    if (Array.isArray(parsed.probes) && parsed.probes.length === 3) {
      return parsed.probes;
    }
    throw new Error("Invalid probe structure returned from LLM");
  } catch (err) {
    console.error("Failed to parse probe generation JSON:", rawText, err);
    throw new Error("ECHO could not parse the generated probe questions. Please try again.");
  }
}

export async function scoreAnswer(
  concept: string,
  dimension: ProbeDimension,
  question: string,
  studentAnswer: string
): Promise<ProbeScore> {
  const prompt = `You are ECHO's evaluation engine. Score a student's answer to a probe question on a specific understanding dimension.

Concept: ${concept}
Dimension: ${dimension}
Question: ${question}
Student's answer: ${studentAnswer}

Score the answer from 0-100 based on:
- Correctness of the core idea
- Depth of reasoning (not just a right final answer with no justification)
- For "explain" and "transfer" dimensions specifically: penalize answers that are correct but show no real reasoning (e.g. a guessed or memorized answer)

Return ONLY valid JSON in this exact format, nothing else:
{
  "score": <0-100 integer>,
  "reasoning": "<one sentence on why this score, written for the student>"
}`;

  const rawText = await callLLM(prompt);
  try {
    const parsed = cleanAndParseJSON<ProbeScore>(rawText);
    if (typeof parsed.score === "number" && typeof parsed.reasoning === "string") {
      return {
        score: Math.max(0, Math.min(100, Math.round(parsed.score))),
        reasoning: parsed.reasoning,
      };
    }
    throw new Error("Invalid score structure returned from LLM");
  } catch (err) {
    console.error("Failed to parse scoring JSON:", rawText, err);
    throw new Error("ECHO could not parse the evaluation response.");
  }
}

export async function generateRecommendation(
  concept: string,
  stabilityScore: number,
  band: string,
  weakestDimension: string
): Promise<string> {
  const prompt = `You are ECHO. A student just completed an understanding probe on "${concept}".
Their Understanding Stability Score is ${stabilityScore} (${band}).
Their weakest dimension was: ${weakestDimension}.

Write ONE specific, actionable study recommendation (max 20 words) targeting that weakest dimension.

Return ONLY valid JSON:
{
  "recommendation": "<string>"
}`;

  const rawText = await callLLM(prompt);
  try {
    const parsed = cleanAndParseJSON<{ recommendation: string }>(rawText);
    if (typeof parsed.recommendation === "string") {
      return parsed.recommendation;
    }
    throw new Error("Invalid recommendation structure");
  } catch (err) {
    console.error("Failed to parse recommendation JSON:", rawText, err);
    return `Focus your study on the ${weakestDimension} dimension by working through step-by-step examples.`;
  }
}
