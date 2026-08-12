import type { Question } from "./types";

export const CONCEPTS: Record<string, { id: string; name: string; subject: string; unit: string }> =
  {
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

export const BINARY_SEARCH_QUESTIONS: Question[] = [
  {
    id: "bs-1",
    dimension: "direct",
    kind: "choice",
    prompt:
      "Binary search runs on the sorted array [2, 5, 9, 14, 21, 30, 47] looking for 21. Which indices does mid land on, in order?",
    options: [
      { id: "a", text: "3, 5, 4" },
      { id: "b", text: "3, 4" },
      { id: "c", text: "0, 3, 4" },
      { id: "d", text: "3, 5" },
    ],
    correct: "b",
    trap: {
      choice: "a",
      misconception: "Treats the surviving half as inclusive of the already-rejected mid element.",
    },
    ideal: "mid=3 (14) → search right half → mid=4 (21) → found.",
  },
  {
    id: "bs-2",
    dimension: "explain",
    kind: "text",
    prompt:
      "In your own words: why is binary search O(log n)? Explain the mechanism, not the formula.",
    keywords: ["half", "halv", "double", "log", "search space", "eliminat", "discard"],
    ideal:
      "Each comparison eliminates half of the remaining search space, so the space shrinks n → n/2 → n/4 …; the number of halvings before one element remains is log₂n.",
  },
  {
    id: "bs-3",
    dimension: "transfer",
    kind: "text",
    prompt:
      "A deploy pipeline has 1024 commits; exactly one introduced a bug and every commit after it is broken. You can test any commit. Design the search and state why the binary-search idea legitimately applies here.",
    keywords: ["monoton", "half", "log", "10", "predicate", "boundary", "first", "bisect"],
    ideal:
      "The predicate 'is broken' is monotonic (false…false, true…true), so bisect on the boundary: test the middle commit, keep the half containing the flip. ~10 tests (log₂1024).",
  },
];

export const QUESTION_BANK: Record<string, Question[]> = {
  "binary-search": BINARY_SEARCH_QUESTIONS,
};

export const FACULTY_CLASS = {
  cohort: "CSE — Semester 4 · Section B",
  students: 48,
  concepts: [
    {
      conceptId: "binary-search",
      name: "Binary Search",
      assessed: 41,
      avgStability: 58,
      confidentButFragile: 17,
      dimensions: { direct: 91, explain: 63, variation: 46, assumption: 38, error: 44, transfer: 52 },
      misconceptions: [
        {
          text: "Believes binary search always returns the leftmost occurrence with duplicates",
          share: 54,
        },
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

export const WEAK_CONCEPTS = [
  { conceptId: "tcp-flow", name: "TCP Flow Control", stability: 38, weakest: "Assumption" },
  { conceptId: "hash-collisions", name: "Hash Collision Resolution", stability: 47, weakest: "Transfer" },
  { conceptId: "eigenvectors", name: "Eigenvectors & Eigenvalues", stability: 56, weakest: "Explain" },
];
