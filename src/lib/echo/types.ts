export type Role = "student" | "faculty";

export type ProbeDimension = "direct" | "explain" | "transfer";

export type FrameworkDimension =
  | "direct"
  | "explain"
  | "variation"
  | "assumption"
  | "error"
  | "transfer";

export const FRAMEWORK_DIMENSIONS: { id: FrameworkDimension; label: string; blurb: string }[] = [
  { id: "direct", label: "Direct", blurb: "Can you produce the correct baseline answer?" },
  { id: "explain", label: "Explain", blurb: "Can you justify why it works?" },
  { id: "variation", label: "Variation", blurb: "Does it hold when the setup changes?" },
  { id: "assumption", label: "Assumption", blurb: "Do you know the hidden preconditions?" },
  { id: "error", label: "Error Detection", blurb: "Can you spot a broken version?" },
  { id: "transfer", label: "Transfer", blurb: "Can you apply it somewhere new?" },
];

export type ReflectionCheckIn = "understood" | "mostly" | "confused" | "lost";

export const CHECKIN_OPTIONS: {
  id: ReflectionCheckIn;
  label: string;
  hint: string;
  tone: "success" | "primary" | "warning" | "destructive";
}[] = [
  { id: "understood", label: "Understood", hint: "Felt clear end to end", tone: "success" },
  { id: "mostly", label: "Mostly understood", hint: "One or two fuzzy parts", tone: "primary" },
  { id: "confused", label: "Confused", hint: "Lost the thread midway", tone: "warning" },
  { id: "lost", label: "Didn't understand", hint: "Need to relearn it", tone: "destructive" },
];

export type ProbeQuestion = {
  dimension: ProbeDimension;
  question: string;
};

export type ProbeAnswer = {
  dimension: ProbeDimension;
  question: string;
  answer: string;
};

export type ProbeEvaluation = {
  dimension: ProbeDimension;
  score: number;
  reasoning: string;
  question: string;
  answer: string;
};

export type Concept = {
  id: string;
  name: string;
  subject: string;
  unit: string;
};

export type ConceptRepair = {
  conceptId: string;
  name: string;
  stability: number;
  weakest: string;
  repairActivity: string;
  estimatedMinutes: number;
};

export type Band = {
  id: "surface" | "fragile" | "developing" | "stable";
  label: string;
  range: string;
  tone: "destructive" | "warning" | "primary" | "success";
  verdict: string;
};
