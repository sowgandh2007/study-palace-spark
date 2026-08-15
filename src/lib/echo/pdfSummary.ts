import { getApiConfig, discoverGeminiModels, cleanAndParseJSON, ECHOAIError, INTEGRATED_GEMINI_KEY, callGeminiREST } from "./llm";

export interface ComprehensivePdfSummaryResult {
  title: string;
  htmlContent: string;
  summaryText: string;
  keyConcepts: { concept: string; explanation: string }[];
  importantPoints: string[];
  pageCount?: number;
  wordCount?: number;
}

export async function generateComprehensivePdfSummaryHTML(
  topic: string,
  pdfText: string,
  pageCount?: number
): Promise<ComprehensivePdfSummaryResult> {
  if (!pdfText || pdfText.trim().length < 30) {
    throw new ECHOAIError(
      "The extracted text from the PDF document is too short or empty to generate an accurate summary.",
      "INVALID_RESPONSE"
    );
  }

  const cfg = getApiConfig();
  const apiKey = cfg.geminiApiKey.trim() || (import.meta.env.VITE_GEMINI_API_KEY as string) || INTEGRATED_GEMINI_KEY;

  if (!apiKey) {
    throw new ECHOAIError(
      "Gemini API Key is not configured. Please add VITE_GEMINI_API_KEY to your environment variables.",
      "INVALID_KEY"
    );
  }

  const prompt = `You are ECHO, an Evidence-Based Conceptual Honesty Engine.
Analyze the following extracted text from an uploaded PDF document:

==================================================
EXTRACTED PDF DOCUMENT TEXT (${pageCount ? `${pageCount} pages, ` : ""}${pdfText.length} characters):
==================================================
${pdfText.slice(0, 50000)}
==================================================

YOUR TASK:
Generate a comprehensive, source-grounded academic study document in clean HTML format based STRICTLY on the extracted text above.

CRITICAL INSTRUCTIONS:
1. SOURCE TRUTH: Use ONLY information supported by the uploaded PDF text above. Do NOT hallucinate missing sections, do NOT invent formulas or examples not in the source text.
2. COMPREHENSIVE COVERAGE: Do NOT write a short 5-bullet summary. Cover the actual material thoroughly (Overview, Main topics, subtopics, algorithms/processes, equations/formulas, definitions, examples, applications, conditions, assumptions, and key exam-relevant points).
3. DOCUMENT TITLES: Use the true topic/title from the document.
4. STYLING & FORMATTING: Structure the response inside an HTML string using semantic tags:
   <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <code>, <pre>, <table>, <thead>, <tbody>, <tr>, <th>, <td>, and <div class="doc-callout">.

RETURN FORMAT:
Return strictly valid JSON matching this exact structure:
{
  "title": "Document Title or Topic Name",
  "summaryText": "Concise 2-3 sentence executive summary of what the document covers.",
  "keyConcepts": [
    { "concept": "Concept Name 1", "explanation": "Detailed explanation based strictly on the source text." }
  ],
  "importantPoints": ["Key takeaway point 1", "Key takeaway point 2"],
  "htmlContent": "<div class='echo-study-document'><header class='doc-header'><h1>...</h1><p class='doc-meta'>Comprehensive AI Study Document • ${pageCount || 1} Pages</p></header><section class='doc-section'><h2>1. Executive Overview</h2><p>...</p></section><section class='doc-section'><h2>2. Core Concepts & Subtopics</h2>...</section><section class='doc-section'><h2>3. Important Terminology & Definitions</h2>...</section><section class='doc-section'><h2>4. Algorithms, Processes & Formulas</h2>...</section><section class='doc-section'><h2>5. Key Examples & Applications</h2>...</section><section class='doc-section'><h2>6. Key Takeaways & Exam Points</h2>...</section><section class='doc-section'><h2>7. Concepts to Verify with ECHO</h2>...</section></div>"
}`;

  const text = await callGeminiREST(prompt, apiKey, cfg.geminiModel || "gemini-2.5-flash");

  try {
    const parsed = cleanAndParseJSON<any>(text);

    const summaryText = parsed.summaryText || parsed.summary || "Comprehensive AI study document generated from uploaded material.";
    const title = parsed.title || topic || "Uploaded Document Summary";
    const keyPoints = parsed.importantPoints || parsed.key_points || parsed.core_ideas || ["Key concept reviewed in study document."];
    const keyConcepts = Array.isArray(parsed.keyConcepts)
      ? parsed.keyConcepts
      : (keyPoints as string[]).map((p: string) => ({ concept: "Key Point", explanation: p }));

    let htmlContent = parsed.htmlContent || parsed.analysis;

    if (!htmlContent) {
      htmlContent = `<div class="echo-study-document space-y-6"><header class="doc-header border-b border-slate-200 pb-4"><h1 class="text-2xl font-bold text-slate-900">${title}</h1><p class="text-xs text-slate-500 font-mono">Comprehensive AI Study Document</p></header><section class="doc-section"><h2 class="text-lg font-bold text-slate-900">Executive Summary</h2><p class="text-sm text-slate-700 leading-relaxed">${summaryText}</p></section><section class="doc-section"><h2 class="text-lg font-bold text-slate-900">Key Points</h2><ul class="list-disc pl-5 text-sm text-slate-700 space-y-2">${keyPoints.map((kp: string) => `<li>${kp}</li>`).join("")}</ul></section></div>`;
    }

    const words = htmlContent.replace(/<[^>]*>/g, " ").split(/\s+/).length;

    return {
      title,
      htmlContent,
      summaryText,
      keyConcepts,
      importantPoints: keyPoints,
      pageCount,
      wordCount: words,
    };
  } catch (err: any) {
    if (err instanceof ECHOAIError) throw err;

    const fallbackHtml = `<div class="echo-study-document space-y-4"><h1 class="text-xl font-bold text-slate-900">${topic || "Study Material"}</h1><p class="text-sm text-slate-700 whitespace-pre-wrap">${text}</p></div>`;
    return {
      title: topic || "Study Material",
      htmlContent: fallbackHtml,
      summaryText: "Comprehensive AI study summary.",
      keyConcepts: [{ concept: topic || "Core Concept", explanation: "Extracted from source material." }],
      importantPoints: ["Key concept extracted from source material."],
      pageCount,
      wordCount: text.split(/\s+/).length,
    };
  }
}

export interface HtmlStudyPlanResult {
  topic: string;
  summaryText: string;
  htmlContent: string;
  estimatedMinutes: number;
}

export async function generateHtmlStudyPlanDocument(
  concept: string,
  understoodText?: string,
  notUnderstoodText?: string,
  confidenceScore = 75
): Promise<HtmlStudyPlanResult> {
  const cfg = getApiConfig();
  const apiKey = cfg.geminiApiKey.trim() || (import.meta.env.VITE_GEMINI_API_KEY as string) || INTEGRATED_GEMINI_KEY;

  const prompt = `You are ECHO, an Evidence-Based Conceptual Honesty Engine.
Generate a comprehensive HTML study plan document for the concept: "${concept}".
Student Self-Reported Confidence: ${confidenceScore}%
Student Understood: "${understoodText || "Baseline familiarity"}"
Student Struggling With: "${notUnderstoodText || "Boundary conditions and core invariants"}"

CRITICAL INSTRUCTIONS:
1. Generate high-yield, structured summarized learning material related to "${concept}".
2. Include Overview, Conceptual Gaps, Key Formulas & Invariants, Step-by-Step Study Sequence, and Timed Learning Sessions.
3. Structure inside semantic HTML tags: <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <code>, <pre>, <table>, and <div class="doc-callout">.

RETURN FORMAT:
Return strictly valid JSON with this structure:
{
  "topic": "${concept}",
  "summaryText": "2-3 sentence executive summary of the study plan focus and identified conceptual gaps.",
  "estimatedMinutes": 35,
  "htmlContent": "<div class='echo-study-document'><header class='doc-header border-b border-slate-200 pb-4'><h1 class='text-2xl font-bold text-slate-900'>${concept} — Academic Study Plan</h1><p class='doc-meta text-xs text-slate-500 font-mono'>Evidence-Based Targeted Learning Guide • Estimated Time: 35 mins</p></header><section class='doc-section my-4'><h2 class='text-lg font-bold text-slate-900'>1. Current Understanding & Identified Gaps</h2><p class='text-sm text-slate-700 leading-relaxed'>...</p></section><section class='doc-section my-4'><h2 class='text-lg font-bold text-slate-900'>2. Summarized Learning Material & Core Mechanisms</h2><p class='text-sm text-slate-700 leading-relaxed'>...</p><div class='doc-callout bg-sky-50 border-l-4 border-sky-600 p-4 my-3'><strong class='text-sky-900'>Key Invariant:</strong> <span class='text-sky-800'>...</span></div></section><section class='doc-section my-4'><h2 class='text-lg font-bold text-slate-900'>3. Important Terminology & Formulas</h2><ul class='list-disc pl-5 text-sm text-slate-700 space-y-1.5'>...</ul></section><section class='doc-section my-4'><h2 class='text-lg font-bold text-slate-900'>4. Targeted Learning Sequence & Sessions</h2><ol class='list-decimal pl-5 text-sm text-slate-700 space-y-2'>... </ol></section><section class='doc-section my-4'><h2 class='text-lg font-bold text-slate-900'>5. Verification Checkpoints</h2><p class='text-sm text-slate-700 leading-relaxed'>...</p></section></div>"
}`;

  try {
    const text = await callGeminiREST(prompt, apiKey, cfg.geminiModel || "gemini-2.5-flash");
    const parsed = cleanAndParseJSON<any>(text);
    const summaryText = parsed.summaryText || parsed.summary || `Targeted study plan and summarized material for ${concept}.`;
    const topicTitle = parsed.topic || parsed.title || concept || "Study Plan";
    let htmlContent = parsed.htmlContent || parsed.analysis;

    if (!htmlContent) {
      htmlContent = `<div class="echo-study-document space-y-6"><header class="doc-header border-b border-slate-200 pb-4"><h1 class="text-2xl font-bold text-slate-900">${topicTitle} — Academic Study Plan</h1><p class="text-xs text-slate-500 font-mono">Evidence-Based Learning Guide</p></header><section class="doc-section"><h2 class="text-lg font-bold text-slate-900">1. Executive Summary</h2><p class="text-sm text-slate-700 leading-relaxed">${summaryText}</p></section></div>`;
    }

    return {
      topic: topicTitle,
      summaryText,
      htmlContent,
      estimatedMinutes: parsed.estimatedMinutes || 35,
    };
  } catch {
    const fallbackHtml = `<div class="echo-study-document space-y-6"><header class="doc-header border-b border-slate-200 pb-4"><h1 class="text-2xl font-bold text-slate-900">${concept} — Academic Study Plan</h1><p class="text-xs text-slate-500 font-mono">Evidence-Based Learning Guide • Estimated Time: 35 mins</p></header><section class="doc-section"><h2 class="text-lg font-bold text-slate-900">1. Executive Summary</h2><p class="text-sm text-slate-700 leading-relaxed">Study plan and high-yield material for ${concept}. Focus on core invariant mechanisms and boundary constraints.</p></section><section class="doc-section"><h2 class="text-lg font-bold text-slate-900">2. Key Concepts & Mechanisms</h2><div class="doc-callout bg-sky-50 border-l-4 border-sky-600 p-4 my-3"><strong class="text-sky-900">Core Invariant:</strong> <span class="text-sky-800">Ensure array sorting or precondition invariants hold before halving search space.</span></div></section><section class="doc-section"><h2 class="text-lg font-bold text-slate-900">3. Recommended Study Sessions</h2><ol class="list-decimal pl-5 text-sm text-slate-700 space-y-2"><li><strong>Session 01 (15 mins):</strong> Review core invariants and write 2-sentence explanation in your own words.</li><li><strong>Session 02 (20 mins):</strong> Solve 2 boundary variations and verify index logic.</li></ol></section></div>`;

    return {
      topic: concept || "Binary Search",
      summaryText: `Evidence-based study plan for ${concept || "Binary Search"}.`,
      htmlContent: fallbackHtml,
      estimatedMinutes: 35,
    };
  }
}

export async function downloadHtmlAsPdf(elementId: string, filename: string): Promise<void> {
  if (typeof window === "undefined") return;
  const element = document.getElementById(elementId);
  if (!element) throw new Error("Study document element not found for PDF export.");

  try {
    const html2pdfModule = await import("html2pdf.js");
    const html2pdf = html2pdfModule.default || (window as any).html2pdf;

    const opt = {
      margin: [12, 12, 12, 12] as [number, number, number, number],
      filename: filename.endsWith(".pdf") ? filename : `${filename}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    } as const satisfies Record<string, unknown>;

    await html2pdf().set(opt as never).from(element).save();
  } catch (err: any) {
    console.error("[PDF Export Error]", err);
    window.print();
  }
}
