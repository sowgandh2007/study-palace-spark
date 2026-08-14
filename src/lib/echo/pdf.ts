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
    script.onerror = () => reject(new Error("Failed to load PDF processing script. Please check your connection."));
    document.head.appendChild(script);
  });
}

/**
 * Safe client-side PDF text extractor with file validation.
 */
export async function extractTextFromPdf(file: File, maxPages = 30): Promise<PdfExtractResult> {
  if (!file) {
    throw new Error("No file provided for extraction.");
  }

  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Invalid file type. Please upload a valid PDF document (.pdf).");
  }

  const MAX_FILE_SIZE_MB = 12;
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
      fullText += `--- Page ${pageNum} ---\n${pageText}\n\n`;
    }

    if (!fullText.trim()) {
      throw new Error("The uploaded PDF appears to contain no extractable text (it might be a scanned image).");
    }

    // Limit context length for prompt window efficiency
    const truncatedText = fullText.slice(0, 16000);

    return {
      text: truncatedText,
      pageCount: pdfDocument.numPages,
    };
  } catch (err: any) {
    if (err.message && err.message.includes("PDF")) {
      throw err;
    }
    // Fallback simple FileReader reader text fallback if WebWorker fails
    try {
      const text = await readTextFileFallback(file);
      return { text: text.slice(0, 16000), pageCount: 1 };
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
