import type { TimetableEntry } from "./types";

export const SAMPLE_TIMETABLE: TimetableEntry[] = [];

export const DEMO_BINARY_SEARCH_DATA = {
  concept: "Binary Search",
  probes: [
    {
      dimension: "direct" as const,
      question: "What is the time complexity of Binary Search, and what is one precondition the array must satisfy?",
      demoAnswer: "O(log n), and the array must be sorted.",
      demoScore: 100,
      demoReasoning: "Correct complexity O(log n) and sorted array precondition identified.",
    },
    {
      dimension: "explain" as const,
      question: "Why does Binary Search fail on unsorted data — walk through what breaks in the logic?",
      demoAnswer: "It just won't work because you need it sorted.",
      demoScore: 55,
      demoReasoning: "States the requirement but misses the underlying mechanism — why eliminating half the search space relies on spatial order.",
    },
    {
      dimension: "transfer" as const,
      question: "How would you adapt Binary Search to find the first occurrence of a repeated value in a sorted array (not just any occurrence)?",
      demoAnswer: "You'd still use binary search.",
      demoScore: 20,
      demoReasoning: "Names the technique but provides no adaptation logic — standard binary search does not guarantee the first occurrence index.",
    },
  ],
  expectedScores: { direct: 100, explain: 55, transfer: 20 },
  expectedStabilityScore: 50,
  expectedConfidence: 90,
  expectedConfidenceGap: 40,
  isConfidentButFragile: true,
  expectedBandLabel: "Fragile Understanding",
  recommendation: "Practice adapting Binary Search to boundary-finding variants (first/last occurrence, insertion point).",
};

export const PRIORITY_REPAIRS: any[] = [];

export const FACULTY_CLASS = {
  cohort: "CSE — Semester 4 · Section B",
  students: 48,
  avgStability: 58,
  confidentButFragile: 17,
  concepts: [
    {
      conceptId: "binary-search",
      name: "Binary Search",
      assessed: 41,
      avgStability: 58,
      confidentButFragile: 17,
      dimensions: { direct: 91, explain: 63, variation: 46, assumption: 38, error: 44, transfer: 52 },
      misconceptions: [
        { text: "Believes binary search always returns the leftmost occurrence with duplicates", share: 54 },
        { text: "Cannot state the sortedness precondition unprompted", share: 47 },
        { text: "Recites 'divide by 2' without connecting halving to log₂n", share: 39 },
        { text: "Blames the overflow bug for an infinite loop caused by lo = mid", share: 33 },
      ],
    },
  ],
};

export const STABILITY_TREND = [
  { day: "Mon", stability: 44 },
  { day: "Tue", stability: 51 },
  { day: "Wed", stability: 49 },
  { day: "Thu", stability: 58 },
  { day: "Fri", stability: 64 },
  { day: "Sat", stability: 68 },
  { day: "Sun", stability: 71 },
];
