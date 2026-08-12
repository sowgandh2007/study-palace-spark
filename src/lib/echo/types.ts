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

export type TimetableEntry = {
  id: string;
  time: string;
  subject: string;
  topic: string;
  date: string;
};

export type Reflection = {
  id: string;
  conceptId: string;
  conceptName: string;
  confidence: number;
  understoodText: string;
  notUnderstoodText: string;
  createdAt: string;
};

export type DiagnosedGap = {
  gapText: string;
  severity: "low" | "medium" | "high";
  relevantAssumption: string;
  recommendedProbe: string;
};

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

export type StabilityResult = {
  conceptName: string;
  confidenceInput: number;
  stabilityScore: number;
  confidenceGap: number;
  isConfidentButFragile: boolean;
  bandLabel: string;
  evaluations: ProbeEvaluation[];
  recommendation: string;
};

export type RepairActivity = {
  id: string;
  conceptName: string;
  gapText: string;
  priority: "High" | "Medium" | "Low";
  totalMinutes: number;
  steps: { title: string; minutes: number; instruction: string }[];
  beforeScore: number;
  afterScore?: number;
};

export type ApiConfig = {
  activeProvider: "gemini" | "openai" | "anthropic" | "custom";
  geminiApiKey: string;
  openaiApiKey: string;
  anthropicApiKey: string;
  customEndpoint: string;
};

export type Band = {
  id: "surface" | "fragile" | "developing" | "stable";
  label: string;
  range: string;
  tone: "destructive" | "warning" | "primary" | "success";
  verdict: string;
};
