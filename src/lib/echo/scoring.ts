import type { Band } from "./types";

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
 * Single centralized scoring function for ECHO Understanding Stability.
 * Formula: round(direct * 0.2 + explain * 0.4 + transfer * 0.4)
 */
export function calculateStabilityScore(direct: number, explain: number, transfer: number): number {
  const raw = direct * 0.2 + explain * 0.4 + transfer * 0.4;
  return Math.round(raw);
}

/**
 * Single centralized band classification function for ECHO.
 */
export function bandFor(score: number): Band {
  if (score < 40) return BANDS[0]!;
  if (score < 60) return BANDS[1]!;
  if (score < 80) return BANDS[2]!;
  return BANDS[3]!;
}
