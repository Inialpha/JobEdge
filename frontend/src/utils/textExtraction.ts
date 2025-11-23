import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from "tesseract.js";
import mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;


/**
 * Extract text from a PDF file (handles both regular and scanned PDFs)
 */
export async function extractTextFromPDF(file) {
  const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;

  const worker = await createWorker({
    logger: m => console.log(m)  // optional
  });

  let finalText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    // If text layer exists (normal PDF)
    const extracted = content.items.map(item => item.str).join(" ");
    if (extracted.trim().length > 0) {
      finalText += extracted + "\n";
      continue;
    }

    // Else: page is an image — convert page to image for OCR
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: ctx, viewport }).promise;

    // Run OCR on the image
    const {
      data: { text: ocrText }
    } = await worker.recognize(canvas);

    finalText += ocrText + "\n";
  }

  await worker.terminate();
  return finalText;
}


/**
 * Extract text from a DOCX file
 */
async function extractTextFromDocx(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error('Failed to extract text from DOCX file');
  }
}

/**
 * Extract text from a text file
 */
async function extractTextFromTxt(file: File): Promise<string> {
  try {
    const text = await file.text();
    return text.trim();
  } catch (error) {
    console.error('Error extracting text from TXT:', error);
    throw new Error('Failed to extract text from TXT file');
  }
}

/**
 * Main function to extract text from any supported file type
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  if (!fileExtension) {
    throw new Error('File has no extension');
  }
  
  switch (fileExtension) {
    case 'pdf':
      return await extractTextFromPDF(file);
    case 'docx':
      return await extractTextFromDocx(file);
    case 'txt':
      return await extractTextFromTxt(file);
    default:
      throw new Error(`Unsupported file type: ${fileExtension}`);
  }
}
