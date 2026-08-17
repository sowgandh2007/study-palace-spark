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
  sourceConcept?: string;
  sourceReference?: string;
  questionType?: string;
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

async function validateEchoQuestions(
  questions: DiagnosticMCQ[],
  materialContext: string | undefined,
  concept: string,
  apiKey: string,
  model: string
): Promise<boolean> {
  if (!materialContext) return true; // Can't validate without context

  const prompt = `You are a Validation Engine for ECHO.
Analyze these 3 generated reflection questions based on the source material for "${concept}".

SOURCE MATERIAL:
${materialContext.slice(0, 5000)}

QUESTIONS:
1. ${questions[0]?.question}
2. ${questions[1]?.question}
3. ${questions[2]?.question}

RULES for Rejection:
- Reject if ANY question is generic (e.g., "What did you learn?", "How do you feel?", "Was this interesting?").
- Reject if ANY question introduces concepts completely absent from the source material.
- Accept ONLY if ALL 3 questions test actual understanding, reasoning, or application of the specific source material.

Respond ONLY with a valid JSON object:
{
  "isValid": boolean,
  "reason": "short explanation"
}`;

  try {
    const raw = await callGeminiREST(prompt, apiKey, model, undefined, "validate_echo_questions");
    const parsed = cleanAndParseJSON<{ isValid: boolean; reason: string }>(raw);
    console.log("[ECHO Validation]", parsed);
    return parsed?.isValid ?? true;
  } catch (err) {
    console.error("[ECHO Validation Error]", err);
    return true; // Fallback to true if validation fails to avoid breaking flow
  }
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
  const model = cfg.geminiModel || "gemini-3.5-flash";

  if (!apiKey) {
    return generateLocalEchoCheck(concept, confidence, understoodText, notUnderstoodText);
  }

  const basePrompt = `You are ECHO, an Evidence-Based Conceptual Honesty Engine.
Generate 3 authentic, domain-specific diagnostic MCQ probes tailored specifically to the subject: "${concept}".

${materialContext ? `CRITICAL INSTRUCTION: You MUST ground every question strictly in the following SOURCE CONTENT. Do not introduce concepts absent from the material. Do not generate generic reflection questions (e.g. "What did you learn?").

SOURCE CONTENT:
${materialContext.slice(0, 10000)}` : `Topic: "${concept}"`}

Generate a mixture of concept-grounded reflection questions.
Choose 3 distinct types from this list based on the content:
- Concept Explanation (e.g., Explain the main idea)
- Reasoning (e.g., Why does X work?)
- Application (e.g., Given X, what happens if Y?)
- Misconception Detection (e.g., What goes wrong if X is removed?)
- Transfer (e.g., How would X adapt to Z?)

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
      "dimension": "explain",
      "dimensionLabel": "Under-The-Hood Reasoning",
      "subconceptName": "Specific subconcept from material",
      "question": "A concept-grounded question...",
      "options": [
        { "text": "Correct answer", "score": 100 },
        { "text": "Distractor", "score": 35, "misconception": "..." },
        { "text": "Distractor", "score": 20, "misconception": "..." },
        { "text": "Distractor", "score": 0, "misconception": "..." }
      ],
      "correctIndex": 0,
      "explanation": "Why this is correct.",
      "sourceConcept": "The exact concept tested",
      "sourceReference": "A short reference to where this is in the material",
      "questionType": "Reasoning"
    }
  ] // Must have exactly 3 questions
}`;

  let retries = 2;
  while (retries >= 0) {
    try {
      const raw = await callGeminiREST(basePrompt, apiKey, model, undefined, "generate_async_echo_check");
      const parsed = cleanAndParseJSON<EchoCheckResult>(raw);
      
      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length === 3) {
        // Validation Layer
        const isValid = await validateEchoQuestions(parsed.questions, materialContext, concept, apiKey, model);
        
        if (isValid) {
          return parsed;
        } else {
          console.log(`[ECHO] Questions failed validation. Retries left: ${retries}`);
        }
      }
    } catch (err) {
      console.error("[ECHO LocalAI] Async echo check generation error:", err);
    }
    retries--;
  }

  return generateLocalEchoCheck(concept, confidence, understoodText, notUnderstoodText);
}
