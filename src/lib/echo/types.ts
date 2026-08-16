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

export type LearnMaterial = {
  id: string;
  topic: string;
  sourceType: "pdf" | "topic";
  fileName?: string;
  htmlContent: string;
  summaryText: string;
  keyConcepts: { concept: string; explanation: string }[];
  importantPoints: string[];
  createdAt: string;
  pageCount?: number;
  wordCount?: number;
};

export type DiagnosedGap = {
  gapText: string;
  severity: "low" | "medium" | "high";
  relevantAssumption: string;
  recommendedProbe: string;
  weakSubconcept?: string;
};

export type Subconcept = {
  id: string;
  name: string;
  description: string;
  keyInvariant: string;
};

export type ConceptBreakdown = {
  concept: string;
  overview: string;
  subconcepts: Subconcept[];
};

export type DynamicProbeOption = {
  text: string;
  score: number;
  misconception?: string;
  subconceptId?: string;
};

export type DynamicProbeQuestion = {
  id: string;
  dimension: ProbeDimension;
  dimensionLabel: string;
  subconceptName: string;
  question: string;
  options: DynamicProbeOption[];
  correctIndex: number;
  explanation: string;
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
  subconceptName?: string;
};

export type StabilityResult = {
  conceptName: string;
  evaluatedAt: string;
  confidenceScore: number;
  confidenceInput?: number;
  stabilityScore: number;
  confidenceGap: number;
  isConfidentButFragile: boolean;
  bandLabel: string;
  evaluations: ProbeEvaluation[];
  recommendation: string;
  weakSubconcept?: string;
};

export type DynamicRepairStep = {
  step: number;
  title: string;
  minutes: number;
  instruction: string;
  requiresStudentInput?: boolean;
};

export type RepairActivity = {
  id: string;
  conceptName: string;
  weakSubconcept?: string;
  gapText: string;
  priority: "High" | "Medium" | "Low";
  totalMinutes: number;
  steps: { title: string; minutes: number; instruction: string }[];
  beforeScore: number;
  afterScore?: number;
};

export type DynamicRecheckProbe = {
  id: string;
  conceptName: string;
  weakSubconcept: string;
  question: string;
  options: DynamicProbeOption[];
  correctIndex: number;
  explanation: string;
};

export type ApiProviderId = "gemini" | "openai" | "anthropic" | "custom";

export type ApiConfig = {
  activeProvider: ApiProviderId;
  geminiApiKey: string;
  geminiModel: string;
  openaiApiKey: string;
  openaiModel: string;
  anthropicApiKey: string;
  anthropicModel: string;
  customEndpoint: string;
  customModel: string;
  timeoutMs: number;
};

export type Band = {
  id: "surface" | "fragile" | "developing" | "stable";
  label: string;
  range: string;
  tone: "destructive" | "warning" | "primary" | "success";
  verdict: string;
};
