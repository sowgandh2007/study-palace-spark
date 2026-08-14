import { getApiConfig, discoverGeminiModels, cleanAndParseJSON, ECHOAIError } from "./llm";

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
  const apiKey = cfg.geminiApiKey.trim() || (import.meta.env.VITE_GEMINI_API_KEY as string) || "";

  if (!apiKey) {
    throw new ECHOAIError(
      "Gemini API Key is not configured. Please add VITE_GEMINI_API_KEY to your environment variables.",
      "INVALID_KEY"
    );
  }

  let modelName = (cfg.geminiModel || "gemini-1.5-flash").trim().replace(/^models\//, "");
  const availableModels = await discoverGeminiModels(apiKey);
  if (availableModels.length > 0 && !availableModels.includes(modelName)) {
    modelName = availableModels[0]!;
  }

  const modelPath = `models/${modelName}`;
  const requestUrl = `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent`;

  const prompt = `You are ECHO, an Evidence-Based Conceptual Honesty Engine.
Analyze the following extracted text from an uploaded PDF document:

==================================================
EXTRACTED PDF DOCUMENT TEXT (${pageCount ? `${pageCount} pages, ` : ""}${pdfText.length} characters):
==================================================
${pdfText}
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

  const res = await fetch(requestUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    }),
  });

  const responseText = await res.text();
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new ECHOAIError("Invalid Gemini API Key. Please verify your VITE_GEMINI_API_KEY environment variable.", "INVALID_KEY", res.status);
    }
    if (res.status === 429) {
      throw new ECHOAIError("Gemini API rate limit exceeded. Please wait a moment and click Retry.", "RATE_LIMIT", res.status);
    }
    throw new ECHOAIError(`Gemini API returned error status: ${res.status}`, "SERVER_ERROR", res.status);
  }

  const data = JSON.parse(responseText);
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new ECHOAIError("Received an empty response payload from Gemini AI.", "INVALID_RESPONSE");
  }

  try {
    const parsed = cleanAndParseJSON<ComprehensivePdfSummaryResult>(text);
    if (parsed && parsed.htmlContent) {
      const words = parsed.htmlContent.replace(/<[^>]*>/g, " ").split(/\s+/).length;
      return {
        title: parsed.title || topic || "Uploaded Document Summary",
        htmlContent: parsed.htmlContent,
        summaryText: parsed.summaryText || "Comprehensive AI study document generated from uploaded PDF.",
        keyConcepts: parsed.keyConcepts || [{ concept: topic || "Core Concept", explanation: "Primary mechanism described in source document." }],
        importantPoints: parsed.importantPoints || ["Key concept reviewed in study document."],
        pageCount,
        wordCount: words,
      };
    }
    throw new Error("HTML content missing");
  } catch (err: any) {
    if (err instanceof ECHOAIError) throw err;
    throw new ECHOAIError("Failed to parse the generated summary HTML from Gemini.", "INVALID_RESPONSE");
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
      margin: [12, 12, 12, 12],
      filename: filename.endsWith(".pdf") ? filename : `${filename}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };

    await html2pdf().set(opt).from(element).save();
  } catch (err: any) {
    console.error("[PDF Export Error]", err);
    window.print();
  }
}
