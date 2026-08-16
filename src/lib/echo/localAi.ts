import { callGeminiREST, cleanAndParseJSON, getApiConfig, getResolvedGeminiKey } from "./llm";
import type { ProbeDimension, DiagnosedGap } from "./types";

export interface DiagnosticMCQ {
  id: string;
  dimension: ProbeDimension;
  dimensionLabel: string;
  subconceptName?: string;
  question: string;
  options: {
    text: string;
    score: number;
    misconception?: string;
  }[];
  correctIndex: number;
  explanation: string;
}

export interface EchoCheckResult {
  concept: string;
  confidence: number;
  gapDiagnosis: DiagnosedGap;
  questions: DiagnosticMCQ[];
}

const QUESTION_BANKS: Record<string, DiagnosticMCQ[]> = {
  "binary search": [
    {
      id: "bs-1",
      dimension: "direct",
      dimensionLabel: "Direct Definition",
      subconceptName: "Binary Search Preconditions",
      question: "What is the time complexity of Binary Search and its mandatory precondition?",
      options: [
        { text: "O(log n) time complexity, and the array MUST be sorted.", score: 100 },
        { text: "O(n) time complexity, and the array must be sorted.", score: 35, misconception: "Conflates binary search with linear search complexity." },
        { text: "O(log n) time complexity, and works on any unsorted array.", score: 20, misconception: "Misses the essential sorted-array precondition." },
        { text: "O(1) time complexity, using direct array indexing.", score: 0, misconception: "Conflates binary search with hash map lookup." },
      ],
      correctIndex: 0,
      explanation: "Binary Search operates in O(log n) time because sorted order guarantees every mid comparison discards half the array.",
    },
    {
      id: "bs-2",
      dimension: "explain",
      dimensionLabel: "Under-The-Hood Reasoning",
      subconceptName: "Binary Search Mechanism",
      question: "Why does Binary Search fail on an unsorted array — what breaks in the logic?",
      options: [
        { text: "Because sorted order guarantees target cannot exist in the discarded half when target < arr[mid].", score: 100 },
        { text: "Because finding mid requires an even number of elements in sorted order.", score: 40, misconception: "Confuses array parity with elimination invariant." },
        { text: "Because pointers lo and hi can only increment by 1 when sorted.", score: 30, misconception: "Misunderstands pointer arithmetic in divide-and-conquer." },
        { text: "It doesn't fail; unsorted binary search just takes O(n) time.", score: 10, misconception: "Fails to realize unsorted binary search returns wrong index or loops endlessly." },
      ],
      correctIndex: 0,
      explanation: "Without spatial order, arr[mid] < target gives zero information about whether target lies left or right.",
    },
    {
      id: "bs-3",
      dimension: "transfer",
      dimensionLabel: "Unfamiliar Transfer Scenario",
      subconceptName: "Binary Search Boundary Adaptation",
      question: "How must Binary Search be modified to find the FIRST occurrence of a repeated element in a sorted array?",
      options: [
        { text: "When arr[mid] == target, save mid as candidate result and continue searching in the LEFT half (hi = mid - 1).", score: 100 },
        { text: "Return mid immediately on arr[mid] == target, then scan backwards with a linear loop.", score: 50, misconception: "Linear fallback degrades O(log n) to O(n) in worst case." },
        { text: "Start lo from index 1 instead of 0.", score: 20, misconception: "Arbitrary index offset does not solve duplicate boundary handling." },
        { text: "Use standard binary search; it automatically returns the first occurrence.", score: 10, misconception: "Standard binary search returns any matching index arbitrarily." },
      ],
      correctIndex: 0,
      explanation: "Continuing the search leftwards after finding a match guarantees locating the first occurrence in pure O(log n) time.",
    },
  ],

  "sql": [
    {
      id: "sql-1",
      dimension: "direct",
      dimensionLabel: "Direct Definition",
      subconceptName: "SQL Relational Joins",
      question: "In SQL, what is the key difference between INNER JOIN and LEFT JOIN?",
      options: [
        { text: "INNER JOIN returns matching rows only; LEFT JOIN returns all left table rows plus matching right rows.", score: 100 },
        { text: "INNER JOIN combines columns; LEFT JOIN combines row counts.", score: 30, misconception: "Conflates column joins with UNION operations." },
        { text: "LEFT JOIN only works on primary key columns.", score: 20, misconception: "Misunderstands join predicates." },
        { text: "INNER JOIN is faster because it excludes NULL values from the left table.", score: 40, misconception: "Focuses on performance side-effects rather than relational logic." },
      ],
      correctIndex: 0,
      explanation: "INNER JOIN yields the intersection of both tables; LEFT JOIN preserves all left table rows with NULLs for unmatched right rows.",
    },
    {
      id: "sql-2",
      dimension: "explain",
      dimensionLabel: "Under-The-Hood Reasoning",
      subconceptName: "SQL WHERE Filtering Mechanism",
      question: "Why does filtering a LEFT JOIN's right table in the WHERE clause turn it into an implicit INNER JOIN?",
      options: [
        { text: "Because WHERE conditions evaluate after JOIN, filtering out NULL right-table rows produced by unmatched left rows.", score: 100 },
        { text: "Because SQL query engine re-orders clauses automatically for optimization.", score: 45, misconception: "Attributes relational logic change to query optimizer heuristics." },
        { text: "Because WHERE clause disables index scans on left tables.", score: 20, misconception: "Confuses execution plan indexing with relational join mechanics." },
        { text: "It doesn't; WHERE and ON clauses are completely identical.", score: 10, misconception: "Misses distinction between join predicate execution vs post-join filtering." },
      ],
      correctIndex: 0,
      explanation: "Evaluating right_table.col = 'val' in WHERE removes rows where right_table.col IS NULL, eliminating unmatched left rows.",
    },
    {
      id: "sql-3",
      dimension: "transfer",
      dimensionLabel: "Unfamiliar Transfer Scenario",
      subconceptName: "SQL Non-Matching Pattern",
      question: "How do you write a query to find all Customers who have NEVER placed an Order using a JOIN?",
      options: [
        { text: "LEFT JOIN Orders ON Customers.id = Orders.customer_id WHERE Orders.id IS NULL.", score: 100 },
        { text: "INNER JOIN Orders ON Customers.id != Orders.customer_id.", score: 30, misconception: "Inequality join creates massive Cartesian product." },
        { text: "RIGHT JOIN Customers ON Orders.customer_id = Customers.id WHERE Customers.id IS NULL.", score: 20, misconception: "Reverses table orientation." },
        { text: "FULL OUTER JOIN Orders WHERE Customers.id = Orders.customer_id.", score: 40, misconception: "Full outer join without NULL filter retains all rows." },
      ],
      correctIndex: 0,
      explanation: "LEFT JOIN unmatched rows produce NULL for Orders columns. Filtering WHERE Orders.id IS NULL extracts non-ordering customers.",
    },
  ],

  "database normalization (3nf)": [
    {
      id: "norm-1",
      dimension: "direct",
      dimensionLabel: "Direct Definition",
      subconceptName: "3NF Transitive Invariant",
      question: "What specific anomaly does Third Normal Form (3NF) eliminate in relational database design?",
      options: [
        { text: "Transitive dependencies (non-key attribute depending on another non-key attribute).", score: 100 },
        { text: "Partial dependencies on composite primary keys.", score: 50, misconception: "Partial dependencies are eliminated in 2NF, not 3NF." },
        { text: "Multi-valued dependencies across independent columns.", score: 40, misconception: "Multi-valued dependencies are addressed in 4NF." },
        { text: "Duplicate rows with missing primary keys.", score: 20, misconception: "Entity integrity/1NF concept." },
      ],
      correctIndex: 0,
      explanation: "3NF ensures that every non-key column depends directly on the primary key, and NOTHING BUT the key.",
    },
    {
      id: "norm-2",
      dimension: "explain",
      dimensionLabel: "Under-The-Hood Reasoning",
      subconceptName: "3NF Transitive Anomaly",
      question: "Why does a transitive dependency X → Y → Z cause update anomalies in a table?",
      options: [
        { text: "If Z changes for a given Y, you must update multiple rows; if you delete all X, you lose the Y → Z fact.", score: 100 },
        { text: "Because foreign keys cannot reference composite keys in 3NF.", score: 30, misconception: "Confuses key types with update anomalies." },
        { text: "Because SQL query execution speed drops exponentially with transitive chains.", score: 20, misconception: "Confuses normalization with query performance." },
        { text: "Because non-prime attributes cannot store string values.", score: 0, misconception: "Irrelevant data type misunderstanding." },
      ],
      correctIndex: 0,
      explanation: "Storing Y → Z alongside X → Y duplicates Y → Z facts across all X associated with Y.",
    },
    {
      id: "norm-3",
      dimension: "transfer",
      dimensionLabel: "Unfamiliar Transfer Scenario",
      subconceptName: "3NF Table Decomposition",
      question: "Given table Employee(EmpID, ZipCode, City) where ZipCode → City, how do you normalize it to 3NF?",
      options: [
        { text: "Decompose into Employee(EmpID, ZipCode) and ZipCity(ZipCode, City).", score: 100 },
        { text: "Add City to the primary key forming (EmpID, City).", score: 30, misconception: "Expanding composite key preserves transitive dependency." },
        { text: "Create three tables: Emp(EmpID), Zip(ZipCode), City(City).", score: 20, misconception: "Over-decomposition loses functional dependency mapping." },
        { text: "Leave table as is since ZipCode is unique per employee.", score: 10, misconception: "Fails to recognize ZipCode → City transitive dependency." },
      ],
      correctIndex: 0,
      explanation: "Extracting ZipCode → City into ZipCity removes the transitive dependency from Employee.",
    },
  ],
};

export function generateLocalEchoCheck(
  conceptName: string,
  confidence: number,
  understoodText: string,
  notUnderstoodText: string
): EchoCheckResult {
  const normalizedKey = conceptName.trim().toLowerCase();

  let questions: DiagnosticMCQ[] = [];

  if (QUESTION_BANKS[normalizedKey]) {
    questions = QUESTION_BANKS[normalizedKey]!;
  } else {
    // Check partial match
    const foundKey = Object.keys(QUESTION_BANKS).find((k) => normalizedKey.includes(k) || k.includes(normalizedKey));
    if (foundKey) {
      questions = QUESTION_BANKS[foundKey]!;
    } else {
      // Concept-Specific Fallback Generator
      questions = [
        {
          id: `${normalizedKey}-1`,
          dimension: "direct",
          dimensionLabel: "Direct Definition",
          subconceptName: `${conceptName} Fundamental Rules`,
          question: `What is the core definition and mandatory precondition of ${conceptName}?`,
          options: [
            { text: `${conceptName} provides a structured mechanism to solve target domain problems under defined preconditions.`, score: 100 },
            { text: `${conceptName} is an unconstrained heuristic that operates without state preconditions.`, score: 30, misconception: "Dismisses mandatory preconditions." },
            { text: `${conceptName} guarantees O(1) execution space regardless of state.`, score: 40, misconception: "Assumes unrealistic performance characteristics." },
            { text: `${conceptName} bypasses boundary checks and error state validation.`, score: 10, misconception: "Ignores edge case requirements." },
          ],
          correctIndex: 0,
          explanation: `${conceptName} relies on specific structural rules and preconditions to guarantee execution correctness.`,
        },
        {
          id: `${normalizedKey}-2`,
          dimension: "explain",
          dimensionLabel: "Under-The-Hood Reasoning",
          subconceptName: `${conceptName} Mechanism`,
          question: `Why does ${conceptName} require strict adherence to its underlying state invariant?`,
          options: [
            { text: "Because violating state invariants breaks execution correctness and leads to invalid results or corrupted state.", score: 100 },
            { text: "Because compilers abort execution if state invariants are not declared in code comments.", score: 25, misconception: "Confuses runtime logic with compiler static analysis." },
            { text: "Because memory usage doubles whenever state invariants are evaluated.", score: 35, misconception: "Confuses algorithmic logic with memory allocation." },
            { text: "State invariants are optional documentation that do not impact runtime behavior.", score: 10, misconception: "Fails to recognize critical invariant role." },
          ],
          correctIndex: 0,
          explanation: "Invariants enforce state correctness across transitions. Without them, execution logic collapses.",
        },
        {
          id: `${normalizedKey}-3`,
          dimension: "transfer",
          dimensionLabel: "Unfamiliar Transfer Scenario",
          subconceptName: `${conceptName} Boundary Adaptations`,
          question: `How does ${conceptName} handle boundary conditions or unfamiliar workload variations?`,
          options: [
            { text: "Boundary conditions expose implicit assumptions, requiring explicit initial state checks or termination guards.", score: 100 },
            { text: "It scales automatically without needing explicit boundary guards.", score: 40, misconception: "Assumes boundary robustness without explicit design." },
            { text: "It fails silently without triggering error handlers.", score: 20, misconception: "Confuses error handling with algorithm logic." },
            { text: "Boundary conditions bypass algorithmic invariant checks completely.", score: 10, misconception: "Misunderstands boundary execution paths." },
          ],
          correctIndex: 0,
          explanation: "Boundary conditions test whether state assumptions hold when invariants are evaluated under extreme values.",
        },
      ];
    }
  }

  const gapDiagnosis: DiagnosedGap = {
    gapText: notUnderstoodText.trim()
      ? `Struggles with: "${notUnderstoodText.trim()}"`
      : `Uncertainty surrounding how ${conceptName} operates under boundary variations.`,
    severity: confidence < 50 ? "high" : confidence < 75 ? "medium" : "low",
    relevantAssumption: `Assumes surface understanding without verifying invariant guarantees.`,
    recommendedProbe: "Explain and Transfer dimension checks",
  };

  return {
    concept: conceptName.trim(),
    confidence,
    gapDiagnosis,
    questions,
  };
}

export async function generateAsyncEchoCheck(
  conceptName: string,
  confidence: number,
  understoodText: string,
  notUnderstoodText: string,
  materialContext?: string
): Promise<EchoCheckResult> {
  const concept = conceptName.trim() || "Study Concept";
  const cfg = getApiConfig();
  const apiKey = getResolvedGeminiKey();

  if (!apiKey) {
    return generateLocalEchoCheck(concept, confidence, understoodText, notUnderstoodText);
  }

  const prompt = `You are ECHO, an Evidence-Based Conceptual Honesty Engine.
Generate 3 authentic, domain-specific diagnostic MCQ probes tailored specifically to the subject: "${concept}".

${materialContext ? `SOURCE CONTENT:\n${materialContext.slice(0, 10000)}` : `Topic: "${concept}"`}

IMPORTANT INSTRUCTIONS:
Generate 3 diagnostic questions specifically about "${concept}":
- Question 1 (Direct Definition): Direct definition, core invariants, or mandatory preconditions of ${concept}.
- Question 2 (Under-The-Hood Reasoning): Why and how ${concept} works under the hood.
- Question 3 (Unfamiliar Transfer Scenario): Edge case, boundary condition, or real-world application of ${concept}.

Each question must have 4 distinct options: 1 correct option (score: 100) and 3 distractors (scores between 0 and 40) with misconception flags.

RETURN STRICTLY VALID JSON ONLY IN THIS EXACT FORMAT:
{
  "concept": "${concept}",
  "confidence": ${confidence},
  "gapDiagnosis": {
    "gapText": "Identified struggle in boundary conditions for ${concept}."
  },
  "questions": [
    {
      "id": "q-1",
      "dimension": "direct",
      "dimensionLabel": "Direct Definition",
      "subconceptName": "${concept} Preconditions",
      "question": "What is the primary precondition or defining property of ${concept}?",
      "options": [
        { "text": "Correct answer specific to ${concept}", "score": 100 },
        { "text": "First distractor", "score": 35, "misconception": "Confuses basic precondition." },
        { "text": "Second distractor", "score": 20, "misconception": "Superficial assumption." },
        { "text": "Third distractor", "score": 0, "misconception": "Completely flawed logic." }
      ],
      "correctIndex": 0,
      "explanation": "Explanation of correct answer for ${concept}."
    },
    {
      "id": "q-2",
      "dimension": "explain",
      "dimensionLabel": "Under-The-Hood Reasoning",
      "subconceptName": "${concept} Mechanism",
      "question": "Why does ${concept} operate in this manner under the hood?",
      "options": [
        { "text": "Correct mechanism explanation for ${concept}", "score": 100 },
        { "text": "First distractor", "score": 35, "misconception": "Confuses mechanism detail." },
        { "text": "Second distractor", "score": 15, "misconception": "Fails to trace state transitions." },
        { "text": "Third distractor", "score": 0, "misconception": "Irrelevant concept." }
      ],
      "correctIndex": 0,
      "explanation": "Explanation of mechanism for ${concept}."
    },
    {
      "id": "q-3",
      "dimension": "transfer",
      "dimensionLabel": "Unfamiliar Transfer Scenario",
      "subconceptName": "${concept} Boundary Adaptation",
      "question": "How does ${concept} behave when applied to an edge case scenario?",
      "options": [
        { "text": "Correct solution under edge conditions for ${concept}", "score": 100 },
        { "text": "First distractor", "score": 45, "misconception": "Fails on boundary condition." },
        { "text": "Second distractor", "score": 25, "misconception": "Confuses edge case behavior." },
        { "text": "Third distractor", "score": 10, "misconception": "Disregards preconditions." }
      ],
      "correctIndex": 0,
      "explanation": "Explanation of boundary handling for ${concept}."
    }
  ]
}`;

  try {
    const raw = await callGeminiREST(prompt, apiKey, cfg.geminiModel || "gemini-3.5-flash", undefined, "generate_async_echo_check");
    const parsed = cleanAndParseJSON<EchoCheckResult>(raw);
    if (parsed && Array.isArray(parsed.questions) && parsed.questions.length === 3) {
      return parsed;
    }
  } catch (err) {
    console.error("[ECHO LocalAI] Async echo check generation error:", err);
  }

  return generateLocalEchoCheck(concept, confidence, understoodText, notUnderstoodText);
}
