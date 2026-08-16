import type { Band, ProbeEvaluation } from "./types";

export const BANDS: Band[] = [
  {
    id: "surface",
    label: "Surface Knowledge",
    range: "0–39",
    tone: "destructive",
    verdict: "The answer can be reproduced, but the understanding does not survive pressure.",
  },
  {
    id: "fragile",
    label: "Fragile Understanding",
    range: "40–59",
    tone: "warning",
    verdict: "Understanding holds in the familiar case and collapses when the setup shifts.",
  },
  {
    id: "developing",
    label: "Developing Understanding",
    range: "60–79",
    tone: "primary",
    verdict: "Reasoning is mostly sound with specific structural gaps still open.",
  },
  {
    id: "stable",
    label: "Stable Understanding",
    range: "80–100",
    tone: "success",
    verdict: "Understanding survives variation, faulty inputs and transfer to new problems.",
  },
];

/**
 * Robust centralized scoring function for ECHO Understanding Stability.
 * Supports direct numeric args OR an array of ProbeEvaluation objects.
 * Guarantees a safe integer between 0 and 100 (never NaN).
 */
export function calculateStabilityScore(
  directOrEvals: number | ProbeEvaluation[],
  explain?: number,
  transfer?: number
): number {
  if (Array.isArray(directOrEvals)) {
    if (directOrEvals.length === 0) return 50;
    let sum = 0;
    let count = 0;
    for (const item of directOrEvals) {
      const s = typeof item?.score === "number" ? item.score : Number(item?.score);
      if (!isNaN(s)) {
        sum += s;
        count++;
      }
    }
    return count > 0 ? Math.round(sum / count) : 50;
  }

  const d = typeof directOrEvals === "number" && !isNaN(directOrEvals) ? directOrEvals : 50;
  const e = typeof explain === "number" && !isNaN(explain) ? explain : 50;
  const t = typeof transfer === "number" && !isNaN(transfer) ? transfer : 50;
  const raw = d * 0.2 + e * 0.4 + t * 0.4;
  return isNaN(raw) ? 50 : Math.round(raw);
}

/**
 * Calculates Confidence Gap = self-reported confidence - evidence stability score
 */
export function calculateConfidenceGap(confidenceInput: number, stabilityScore: number): number {
  const safeConf = typeof confidenceInput === "number" && !isNaN(confidenceInput) ? confidenceInput : 75;
  const safeStab = typeof stabilityScore === "number" && !isNaN(stabilityScore) ? stabilityScore : 50;
  return safeConf - safeStab;
}

/**
 * Single centralized band classification function for ECHO.
 */
export function bandFor(score: number): Band {
  const safeScore = typeof score === "number" && !isNaN(score) ? score : 50;
  if (safeScore < 40) return BANDS[0]!;
  if (safeScore < 60) return BANDS[1]!;
  if (safeScore < 80) return BANDS[2]!;
  return BANDS[3]!;
}
