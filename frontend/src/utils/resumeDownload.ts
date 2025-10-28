import { saveAs } from 'file-saver'
import { Template } from '@/types/resume'
import { postFormData } from './apis';

export const downloadPDF = async (elementId: string) => {
  const element = document.getElementById(elementId)
  if (!element) return

  // Using html2pdf library (needs to be loaded via CDN)
  const html2pdf = (window as { html2pdf?: () => { set: (opt: unknown) => { from: (el: HTMLElement) => { save: () => void } } } }).html2pdf
  if (html2pdf) {
    const opt = {
      margin: 0.5,
      filename: 'resume.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }
    html2pdf().set(opt).from(element).save()
  } else {
    console.error('PDF library not loaded. Please ensure html2pdf.js is included.')
  }
}

export const downloadDocx = async (elementId: string, template: Template = 'classic') => {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error('Resume preview element not found')
    return
  }

  try {
    // Using html2pdf library to generate PDF
    const html2pdf = (window as { 
      html2pdf?: () => { 
        set: (opt: unknown) => { 
          from: (el: HTMLElement) => { 
            outputPdf: (type: string) => Promise<Blob> 
          } 
        } 
      } 
    }).html2pdf
    
    if (!html2pdf) {
      console.error('PDF library not loaded. Please ensure html2pdf.js is included.')
      return
    }

    // Generate PDF as blob
    const opt = {
      margin: 0.5,
      filename: 'resume.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }
    
    const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob')
    
    // Create FormData and append the PDF blob
    const formData = new FormData()
    formData.append('pdf_file', pdfBlob, 'resume.pdf')
    
    // Send to backend for conversion
    const url = `${import.meta.env.VITE_API_URL}/resume/convert-pdf-to-docx/`
    const response = await postFormData(url, formData)
    
    if (response.ok) {
      // Get the DOCX blob from response
      const docxBlob = await response.blob()
      
      // Download the DOCX file
      saveAs(docxBlob, `resume-${template}.docx`)
    } else {
      console.error('Failed to convert PDF to DOCX')
      alert('Failed to convert resume to DOCX format. Please try again.')
    }
  } catch (error) {
    console.error('Error generating DOCX:', error)
    alert('An error occurred while generating the DOCX file. Please try again.')
  }
}
