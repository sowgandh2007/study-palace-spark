export interface PdfExtractResult {
  text: string;
  pageCount: number;
  info?: {
    title?: string;
    author?: string;
  };
}

/**
 * Dynamically loads pdfjs from cdnjs if not already present on window.
 */
async function loadPdfJsScript(): Promise<any> {
  if (typeof window === "undefined") {
    throw new Error("PDF processing is only supported in browser context.");
  }

  const globalAny = window as any;
  if (globalAny.pdfjsLib) {
    return globalAny.pdfjsLib;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      if (globalAny.pdfjsLib) {
        globalAny.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(globalAny.pdfjsLib);
      } else {
        reject(new Error("Failed to initialize PDF.js library."));
      }
    };
    script.onerror = () => reject(new Error("Failed to load PDF processing script. Please check your internet connection."));
    document.head.appendChild(script);
  });
}

/**
 * Robust client-side PDF text extractor with file validation.
 * Extracts up to 100 pages and up to 120,000 characters for Gemini AI processing.
 */
export async function extractTextFromPdf(file: File, maxPages = 100): Promise<PdfExtractResult> {
  if (!file) {
    throw new Error("No file provided for extraction.");
  }

  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Invalid file format. Please upload a valid PDF document (.pdf).");
  }

  const MAX_FILE_SIZE_MB = 20;
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`);
  }

  try {
    const pdfjs = await loadPdfJsScript();
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;

    const numPages = Math.min(pdfDocument.numPages, maxPages);
    let fullText = "";

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      if (pageText.trim()) {
        fullText += `--- Page ${pageNum} ---\n${pageText}\n\n`;
      }
    }

    if (!fullText.trim() || fullText.trim().length < 50) {
      throw new Error("The uploaded PDF contains no extractable text. It may be a scanned image PDF or password protected.");
    }

    // High capacity limit (up to 120,000 chars) for thorough Gemini document analysis
    const fullExtractedContent = fullText.slice(0, 120000);

    return {
      text: fullExtractedContent,
      pageCount: pdfDocument.numPages,
    };
  } catch (err: any) {
    if (err.message && (err.message.includes("PDF") || err.message.includes("extractable"))) {
      throw err;
    }
    try {
      const text = await readTextFileFallback(file);
      if (!text.trim() || text.length < 50) {
        throw new Error("Failed to extract readable text from PDF.");
      }
      return { text: text.slice(0, 120000), pageCount: 1 };
    } catch {
      throw new Error(err.message || "Failed to process PDF document.");
    }
  }
}

function readTextFileFallback(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) || "");
    reader.onerror = () => reject(new Error("File reading failed."));
    reader.readAsText(file);
  });
}
