import { getApiConfig, cleanAndParseJSON, ECHOAIError, callGeminiREST, getResolvedGeminiKey } from "./llm";

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
  pdfText?: string,
  pageCount?: number
): Promise<ComprehensivePdfSummaryResult> {
  const cfg = getApiConfig();
  const apiKey = getResolvedGeminiKey();

  if (!apiKey) {
    throw new ECHOAIError(
      "Gemini API Key is not configured in backend environment variables.",
      "INVALID_KEY",
      401
    );
  }

  const topicName = topic.trim() || "Study Material";
  const hasText = pdfText && pdfText.trim().length > 20;

  const prompt = `You are ECHO, an Evidence-Based Conceptual Honesty Engine.
Generate an in-depth, highly thorough, non-generic academic study document in clean HTML format for the subject/topic: "${topicName}".

${hasText ? `EXTRACTED CONTENT (${pageCount ? `${pageCount} pages, ` : ""}${pdfText.length} characters):\n${pdfText.slice(0, 50000)}` : `User Topic Context: Prepare a comprehensive, deep-dive learning summary for "${topicName}".`}

CRITICAL INSTRUCTIONS FOR NON-GENERIC HIGH QUALITY SUMMARY:
1. DEEP EXPLANATION: Do NOT provide generic superficial definitions. Explain EXACTLY how "${topicName}" works under the hood — step-by-step mechanisms, preconditions, key formulas, code logic, boundary variations, and trade-offs.
2. STRUCTURED SECTIONS: Structure the HTML document into 5 detailed sections:
   - Section 1: Executive Overview & Foundational Preconditions
   - Section 2: Deep Mechanism & Structural Invariants (Why & How it works)
   - Section 3: Important Definitions, Formulas & Code Logic
   - Section 4: Boundary Conditions, Edge Cases & Common Misconceptions
   - Section 5: High-Yield Exam Takeaways & Review Points
3. VISUAL STYLING TAGS: Use semantic HTML tags: <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <code>, <pre>, <table>, <thead>, <tbody>, <tr>, <th>, <td>, and <div class='doc-callout'>.
4. STRICT JSON ESCAPING: Use single quotes (') for HTML attributes inside the htmlContent JSON string property (e.g. <div class='doc-callout'>). Do NOT use unescaped double quotes inside strings.

RETURN FORMAT:
Return strictly valid JSON with this structure:
{
  "title": "${topicName}",
  "summaryText": "2-3 sentence executive summary explaining the core mechanism and invariants of ${topicName}.",
  "keyConcepts": [
    { "concept": "Concept 1 Name", "explanation": "Detailed, specific structural explanation." },
    { "concept": "Concept 2 Name", "explanation": "Detailed, specific structural explanation." }
  ],
  "importantPoints": ["Key takeaway point 1", "Key takeaway point 2"],
  "htmlContent": "<div class='echo-study-document'><header class='doc-header border-b border-slate-200 pb-4 mb-6'><h1 class='text-2xl font-extrabold text-slate-900'>${topicName} — Academic Study Guide</h1><p class='doc-meta text-xs text-primary font-mono font-bold uppercase tracking-wider mt-1'>Comprehensive Evidence-Based Summary</p></header><section class='doc-section my-6'><h2 class='text-lg font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3'>1. Executive Overview & Foundational Preconditions</h2><p class='text-sm text-slate-700 leading-relaxed'>...</p></section><section class='doc-section my-6'><h2 class='text-lg font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3'>2. Deep Mechanism & Structural Invariants</h2><p class='text-sm text-slate-700 leading-relaxed'>...</p><div class='doc-callout bg-sky-50 border-l-4 border-sky-600 p-4 my-4 rounded-r-xl'><strong class='text-sky-900 font-bold'>Core Invariant:</strong> <span class='text-sky-800 text-sm'>...</span></div></section><section class='doc-section my-6'><h2 class='text-lg font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3'>3. Important Terminology & Code / Formula Logic</h2><ul class='list-disc pl-5 text-sm text-slate-700 space-y-2'>...</ul></section><section class='doc-section my-6'><h2 class='text-lg font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3'>4. Boundary Variations & Common Misconceptions</h2><p class='text-sm text-slate-700 leading-relaxed'>...</p></section><section class='doc-section my-6'><h2 class='text-lg font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3'>5. High-Yield Exam Review Takeaways</h2><ol class='list-decimal pl-5 text-sm text-slate-700 space-y-2'>...</ol></section></div>"
}`;

  const text = await callGeminiREST(prompt, apiKey, cfg.geminiModel || "gemini-3.5-flash", undefined, "comprehensive_pdf_summary");

  try {
    const parsed = cleanAndParseJSON<any>(text);

    const summaryText = parsed.summaryText || parsed.summary || `Comprehensive AI study guide for ${topicName}.`;
    const title = parsed.title || topicName;
    const keyPoints = parsed.importantPoints || parsed.key_points || ["Core mechanism and preconditions analyzed."];
    const keyConcepts = Array.isArray(parsed.keyConcepts)
      ? parsed.keyConcepts
      : keyPoints.map((kp: string) => ({ concept: "Key Mechanism", explanation: kp }));

    let htmlContent = parsed.htmlContent || parsed.analysis;

    if (!htmlContent) {
      htmlContent = `<div class="echo-study-document space-y-6"><header class="doc-header border-b border-slate-200 pb-4"><h1 class="text-2xl font-extrabold text-slate-900">${title} — Study Guide</h1><p class="text-xs text-primary font-mono font-bold uppercase">Comprehensive Evidence-Based Summary</p></header><section class="doc-section"><h2 class="text-lg font-bold text-slate-900">Executive Overview</h2><p class="text-sm text-slate-700 leading-relaxed">${summaryText}</p></section><section class="doc-section"><h2 class="text-lg font-bold text-slate-900">Key Points</h2><ul class="list-disc pl-5 text-sm text-slate-700 space-y-2">${keyPoints.map((kp: string) => `<li>${kp}</li>`).join("")}</ul></section></div>`;
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
  } catch {
    const summaryText = `Comprehensive AI study document generated for ${topicName}.`;
    const cleanText = text.replace(/```json/gi, "").replace(/```html/gi, "").replace(/```/g, "").trim();
    const fallbackHtml = cleanText.includes("<div") || cleanText.includes("<h1") || cleanText.includes("<p>")
      ? cleanText
      : `<div class="echo-study-document space-y-6"><header class="doc-header border-b border-slate-200 pb-4"><h1 class="text-2xl font-extrabold text-slate-900">${topicName} — Study Guide</h1><p class="text-xs text-primary font-mono font-bold uppercase">Comprehensive AI Study Document</p></header><section class="doc-section"><h2 class="text-lg font-bold text-slate-900">Executive Summary</h2><p class="text-sm text-slate-700 leading-relaxed">${summaryText}</p></section><section class="doc-section"><div class="text-sm text-slate-800 space-y-4 whitespace-pre-wrap">${cleanText}</div></section></div>`;

    return {
      title: topicName,
      htmlContent: fallbackHtml,
      summaryText,
      keyConcepts: [{ concept: topicName, explanation: "Core conceptual mechanism analyzed." }],
      importantPoints: ["Key concept extracted from study material."],
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
  if (!concept || !concept.trim()) {
    throw new ECHOAIError("Invalid request: concept is required for study plan generation.", "INVALID_RESPONSE", 400);
  }

  const cfg = getApiConfig();
  const apiKey = getResolvedGeminiKey();

  const prompt = `You are ECHO, an Evidence-Based Conceptual Honesty Engine.
Generate a comprehensive HTML study plan document for the concept: "${concept}".
Student Self-Reported Confidence: ${confidenceScore}%
Student Understood: "${understoodText || "Baseline familiarity"}"
Student Struggling With: "${notUnderstoodText || "Boundary conditions and core invariants"}"

CRITICAL INSTRUCTIONS:
1. Generate high-yield, structured summarized learning material related to "${concept}".
2. Include Overview, Conceptual Gaps, Key Formulas & Invariants, Step-by-Step Study Sequence, and Timed Learning Sessions.
3. Structure inside semantic HTML tags: <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <code>, <pre>, <table>, and <div class='doc-callout'>.
4. STRICT JSON ESCAPING: Use single quotes (') for HTML attributes inside the htmlContent JSON string property.

RETURN FORMAT:
Return strictly valid JSON with this structure:
{
  "topic": "${concept}",
  "summaryText": "2-3 sentence executive summary of the study plan focus and identified conceptual gaps.",
  "estimatedMinutes": 35,
  "htmlContent": "<div class='echo-study-document'><header class='doc-header border-b border-slate-200 pb-4'><h1 class='text-2xl font-bold text-slate-900'>${concept} — Academic Study Plan</h1><p class='doc-meta text-xs text-slate-500 font-mono'>Evidence-Based Targeted Learning Guide • Estimated Time: 35 mins</p></header><section class='doc-section my-4'><h2 class='text-lg font-bold text-slate-900'>1. Current Understanding & Identified Gaps</h2><p class='text-sm text-slate-700 leading-relaxed'>...</p></section><section class='doc-section my-4'><h2 class='text-lg font-bold text-slate-900'>2. Summarized Learning Material & Core Mechanisms</h2><p class='text-sm text-slate-700 leading-relaxed'>...</p><div class='doc-callout bg-sky-50 border-l-4 border-sky-600 p-4 my-3'><strong class='text-sky-900'>Key Invariant:</strong> <span class='text-sky-800'>...</span></div></section><section class='doc-section my-4'><h2 class='text-lg font-bold text-slate-900'>3. Important Terminology & Formulas</h2><ul class='list-disc pl-5 text-sm text-slate-700 space-y-1.5'>...</ul></section><section class='doc-section my-4'><h2 class='text-lg font-bold text-slate-900'>4. Targeted Learning Sequence & Sessions</h2><ol class='list-decimal pl-5 text-sm text-slate-700 space-y-2'>... </ol></section><section class='doc-section my-4'><h2 class='text-lg font-bold text-slate-900'>5. Verification Checkpoints</h2><p class='text-sm text-slate-700 leading-relaxed'>...</p></section></div>"
}`;

  const text = await callGeminiREST(prompt, apiKey, cfg.geminiModel || "gemini-3.5-flash", undefined, "html_study_plan_document");
  
  try {
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
    const cleanText = text.replace(/```json/gi, "").replace(/```html/gi, "").replace(/```/g, "").trim();
    const fallbackHtml = cleanText.includes("<div") || cleanText.includes("<h1") || cleanText.includes("<p>")
      ? cleanText
      : `<div class="echo-study-document space-y-6"><header class="doc-header border-b border-slate-200 pb-4"><h1 class="text-2xl font-bold text-slate-900">${concept} — Academic Study Plan</h1><p class="text-xs text-slate-500 font-mono">Evidence-Based Learning Guide • Estimated Time: 35 mins</p></header><section class="doc-section"><h2 class="text-lg font-bold text-slate-900">1. Executive Summary</h2><p class="text-sm text-slate-700 leading-relaxed">Study plan and high-yield material for ${concept}. Focus on core invariant mechanisms and boundary constraints.</p></section><section class="doc-section"><div class="text-sm text-slate-800 space-y-4 whitespace-pre-wrap">${cleanText}</div></section></div>`;

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

export function downloadRawHtmlFile(filename: string, htmlBodyContent: string, title = "ECHO Study Document"): void {
  if (typeof window === "undefined") return;

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    :root {
      --primary: #0284c7;
      --primary-dark: #0369a1;
      --bg-slate: #f8fafc;
      --text-main: #0f172a;
      --border-color: #e2e8f0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: var(--text-main);
      background-color: var(--bg-slate);
      margin: 0;
      padding: 32px 16px;
    }
    .doc-container {
      max-width: 860px;
      margin: 0 auto;
      background: #ffffff;
      padding: 40px;
      border-radius: 16px;
      border: 1px solid var(--border-color);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
    }
    .doc-header {
      border-bottom: 2px solid var(--primary);
      padding-bottom: 20px;
      margin-bottom: 32px;
    }
    .doc-header h1 {
      font-size: 28px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 8px 0;
      letter-spacing: -0.02em;
    }
    .doc-meta {
      font-size: 13px;
      font-weight: 600;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0;
    }
    .doc-section {
      margin-bottom: 32px;
    }
    .doc-section h2 {
      font-size: 20px;
      font-weight: 700;
      color: #1e293b;
      margin-top: 24px;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 6px;
    }
    .doc-section h3 {
      font-size: 16px;
      font-weight: 700;
      color: #334155;
      margin-top: 18px;
      margin-bottom: 8px;
    }
    .doc-section p {
      font-size: 14px;
      color: #334155;
      margin-bottom: 14px;
    }
    .doc-callout {
      background: #f0f9ff;
      border-left: 4px solid var(--primary);
      padding: 16px 20px;
      border-radius: 0 12px 12px 0;
      margin: 20px 0;
    }
    .doc-callout strong {
      color: var(--primary-dark);
    }
    code, pre {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
      background: #0f172a;
      color: #f8fafc;
      border-radius: 8px;
    }
    pre {
      padding: 16px;
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 13px;
    }
    th, td {
      border: 1px solid var(--border-color);
      padding: 10px 14px;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      font-weight: 700;
      color: #0f172a;
    }
    ul, ol {
      padding-left: 24px;
      font-size: 14px;
      color: #334155;
    }
    li {
      margin-bottom: 6px;
    }
  </style>
</head>
<body>
  <div class="doc-container">
    ${htmlBodyContent}
  </div>
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".html") ? filename : `${filename}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
