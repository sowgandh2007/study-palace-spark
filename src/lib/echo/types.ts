export type Role = "student" | "faculty";

export type Dimension =
  | "direct"
  | "explain"
  | "variation"
  | "assumption"
  | "error"
  | "transfer";

export const DIMENSIONS: { id: Dimension; label: string; blurb: string }[] = [
  { id: "direct", label: "Direct", blurb: "Can you produce the correct answer?" },
  { id: "explain", label: "Explain", blurb: "Can you justify why it works?" },
  { id: "variation", label: "Variation", blurb: "Does it hold when the setup changes?" },
  { id: "assumption", label: "Assumption", blurb: "Do you know the hidden preconditions?" },
  { id: "error", label: "Error Detection", blurb: "Can you spot a broken version?" },
  { id: "transfer", label: "Transfer", blurb: "Can you apply it somewhere new?" },
];

export type CheckInResponse = "understood" | "mostly" | "confused" | "lost";

export const CHECKIN_OPTIONS: {
  id: CheckInResponse;
  label: string;
  hint: string;
  tone: "success" | "primary" | "warning" | "destructive";
}[] = [
  { id: "understood", label: "Understood", hint: "Felt clear end to end", tone: "success" },
  { id: "mostly", label: "Mostly understood", hint: "One or two fuzzy parts", tone: "primary" },
  { id: "confused", label: "Confused", hint: "Lost the thread midway", tone: "warning" },
  { id: "lost", label: "Didn't understand", hint: "Need to relearn it", tone: "destructive" },
];

export type Question = {
  id: string;
  dimension: Dimension;
  prompt: string;
  kind: "choice" | "text";
  options?: { id: string; text: string }[];
  correct?: string;
  keywords?: string[];
  trap?: { choice: string; misconception: string };
  ideal: string;
};

export type Answer = { questionId: string; value: string };

export type DimensionScore = { dimension: Dimension; score: number; note: string };

export type AssessmentResult = {
  id: string;
  conceptId: string;
  conceptName: string;
  createdAt: string;
  stability: number;
  confidence?: number;
  band: Band;
  dimensions: DimensionScore[];
  misconceptions: string[];
  gaps: string[];
  tonight: { title: string; detail: string; minutes: number }[];
};

export type Band = {
  id: "surface" | "fragile" | "developing" | "stable";
  label: string;
  range: string;
  tone: "destructive" | "warning" | "primary" | "success";
  verdict: string;
};

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

export function bandFor(score: number): Band {
  if (score < 40) return BANDS[0]!;
  if (score < 60) return BANDS[1]!;
  if (score < 80) return BANDS[2]!;
  return BANDS[3]!;
}
