/**
 * Safe client-side PDF text extraction utility for ECHO.
 * Reads text content from uploaded PDF files for AI summarization and exam generation.
 */

export interface PdfExtractResult {
  text: string;
  pageCount: number;
  fileName: string;
}

export async function extractTextFromPdf(file: File): Promise<PdfExtractResult> {
  if (!file) {
    throw new Error("No file selected.");
  }

  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Invalid file type. Please upload a valid PDF document.");
  }

  const MAX_SIZE_BYTES = 12 * 1024 * 1024; // 12 MB
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("File is too large. Please upload a PDF under 12 MB.");
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Dynamically load pdfjs-dist from CDN if not present locally
    let pdfjs = (window as any).pdfjsLib;
    if (!pdfjs) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
        script.onload = () => {
          (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          resolve();
        };
        script.onerror = () => reject(new Error("Failed to load PDF processing library."));
        document.head.appendChild(script);
      });
      pdfjs = (window as any).pdfjsLib;
    }

    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    const pageCount = pdf.numPages;

    const maxPagesToRead = Math.min(pageCount, 25); // Cap to first 25 pages for AI context limits
    for (let i = 1; i <= maxPagesToRead; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || "")
        .join(" ");
      fullText += `--- Page ${i} ---\n` + pageText + "\n\n";
    }

    const trimmed = fullText.trim();
    if (!trimmed) {
      throw new Error("No readable text found in PDF. The document may contain scanned images without OCR.");
    }

    return {
      text: trimmed,
      pageCount,
      fileName: file.name,
    };
  } catch (err: any) {
    if (err.message && err.message.includes("PDF")) {
      throw err;
    }
    // Fallback simple text reader if pdfjs fails
    try {
      const text = await file.text();
      if (text && text.trim().length > 50) {
        return {
          text: text.slice(0, 15000),
          pageCount: 1,
          fileName: file.name,
        };
      }
    } catch {
      /* ignore fallback error */
    }
    throw new Error("Unable to read PDF contents. Please check if the file is password-protected or corrupted.");
  }
}
