import { saveAs } from 'file-saver'
import { Template, ResumeData } from '@/types/resume'
import { Packer, Document } from 'docx'

import {
  generateClassicDocx,
  generateCreativeDocx,
  generateMinimalDocx,
  generateModernDocx,
}  from "@/utils/DOCXResumes"

interface User {
  firstName: string;
  lastName: string;
}

export const downloadPDF = async (elementId: string, user: User) => {
  const element = document.getElementById(elementId)
  if (!element) return

  const html2pdf = (window as { html2pdf?: () => { set: (opt: unknown) => { from: (el: HTMLElement) => { save: () => void } } } }).html2pdf
  if (html2pdf) {
    const opt = {
      margin: [0.5, 0.5, 1.2, 0.5],
      filename: `${user.firstName}_${user.lastName}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }
    html2pdf().set(opt).from(element).save()
  } else {
    console.error('PDF library not loaded. Please ensure html2pdf.js is included.')
  }
}

export const downloadDocx = async (resume: ResumeData, user: User, template: Template = 'classic') => {
  let doc: Document;

  // Template-specific document generation
  console.log(user)
  switch (template) {
    case 'classic':
      doc = generateClassicDocx(resume);
      break;
    default:
      doc = null 
  }

  if (doc === null) throw Error("Docx is not available for this template")
  const blob = await Packer.toBlob(doc)
  saveAs(blob, `${user.firstName}_${user.lastName}.docx`)
}
