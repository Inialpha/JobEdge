import { jsPDF } from 'jspdf';

/**
 * Generate and download a PDF of the cover letter
 * @param coverLetterText - The cover letter text content
 * @param fileName - Optional filename for the PDF (defaults to cover_letter.pdf)
 */
export const coverLetterPdf = (coverLetterText: string, fileName: string = 'cover_letter.pdf') => {
  // Create a new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'letter',
  });

  // Set margins
  const marginLeft = 1;
  const marginRight = 1;
  const marginTop = 1;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - marginLeft - marginRight;
  const maxHeight = pageHeight - marginTop - 1; // Bottom margin of 1 inch

  // Set font
  doc.setFont('times', 'normal');
  doc.setFontSize(12);

  // Split text into lines that fit within the page width
  const lines = doc.splitTextToSize(coverLetterText, maxWidth);
  
  let currentY = marginTop;
  const lineHeight = 0.2; // Line spacing in inches

  lines.forEach((line: string) => {
    // Check if we need a new page
    if (currentY + lineHeight > maxHeight) {
      doc.addPage();
      currentY = marginTop;
    }

    doc.text(line, marginLeft, currentY);
    currentY += lineHeight;
  });

  // Save the PDF
  doc.save(fileName);
};
