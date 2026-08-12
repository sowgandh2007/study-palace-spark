import type { Concept, ConceptRepair } from "./types";

export const CONCEPTS: Record<string, Concept> = {
  "binary-search": {
    id: "binary-search",
    name: "Binary Search",
    subject: "Data Structures & Algorithms",
    unit: "Searching · Divide and Conquer",
  },
  "hash-collisions": {
    id: "hash-collisions",
    name: "Hash Collision Resolution",
    subject: "Data Structures & Algorithms",
    unit: "Hashing",
  },
  normalization: {
    id: "normalization",
    name: "Database Normalization (3NF)",
    subject: "DBMS",
    unit: "Relational Design",
  },
  "tcp-flow": {
    id: "tcp-flow",
    name: "TCP Flow Control",
    subject: "Computer Networks",
    unit: "Transport Layer",
  },
  eigenvectors: {
    id: "eigenvectors",
    name: "Eigenvectors & Eigenvalues",
    subject: "Linear Algebra",
    unit: "Matrix Decomposition",
  },
};

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
  expectedStabilityScore: 50, // round(100*0.2 + 55*0.4 + 20*0.4) = 50
  expectedBandLabel: "Fragile Understanding",
  recommendation: "Practice adapting Binary Search to boundary-finding variants (first/last occurrence, insertion point).",
};

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
    {
      conceptId: "normalization",
      name: "Database Normalization (3NF)",
      assessed: 38,
      avgStability: 66,
      confidentButFragile: 11,
      dimensions: { direct: 88, explain: 71, variation: 60, assumption: 55, error: 58, transfer: 64 },
      misconceptions: [
        { text: "Treats 3NF as 'no repeated data' rather than removing transitive dependency", share: 44 },
        { text: "Assumes decomposition is always lossless", share: 29 },
      ],
    },
    {
      conceptId: "tcp-flow",
      name: "TCP Flow Control",
      assessed: 35,
      avgStability: 49,
      confidentButFragile: 21,
      dimensions: { direct: 79, explain: 55, variation: 41, assumption: 36, error: 40, transfer: 43 },
      misconceptions: [
        { text: "Conflates flow control with congestion control", share: 61 },
        { text: "Thinks a zero window permanently stalls the connection", share: 35 },
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

export const PRIORITY_REPAIRS: ConceptRepair[] = [
  {
    conceptId: "binary-search",
    name: "Binary Search",
    stability: 50,
    weakest: "Transfer",
    repairActivity: "Practice boundary-finding variants (first/last occurrence, insertion index).",
    estimatedMinutes: 20,
  },
  {
    conceptId: "tcp-flow",
    name: "TCP Flow Control",
    stability: 38,
    weakest: "Assumption",
    repairActivity: "Differentiate flow control sliding windows from congestion control windows.",
    estimatedMinutes: 15,
  },
  {
    conceptId: "hash-collisions",
    name: "Hash Collision Resolution",
    stability: 47,
    weakest: "Transfer",
    repairActivity: "Compare open addressing vs separate chaining performance under high load factors.",
    estimatedMinutes: 25,
  },
];
