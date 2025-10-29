import { saveAs } from 'file-saver'
import { Template } from '@/types/resume'
import { Packer } from 'docx'

import {
  generateClassicDocx,
  generateCreativeDocx,
  generateMinimalDocx,
  generateModernDocx,
}  from "@/utils/DOCXResumes"


export const downloadPDF = async (elementId: string, user) => {
  const element = document.getElementById(elementId)
  if (!element) return

  const html2pdf = (window as { html2pdf?: () => { set: (opt: unknown) => { from: (el: HTMLElement) => { save: () => void } } } }).html2pdf
  if (html2pdf) {
    const opt = {
      margin: 0.5,
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

export const downloadDocx = async (resume: ResumeData, user, template: Template = 'classic') => {
  const skills = resume.skills;
  let doc: Document;

  // Template-specific document generation
  console.log(user)
  switch (template) {
    case 'modern':
      doc = generateModernDocx(resume, skills);
      break;
    case 'minimal':
      doc = generateMinimalDocx(resume, skills);
      break;
    case 'creative':
      doc = generateCreativeDocx(resume, skills);
      break;
    default:
      doc = generateClassicDocx(resume, skills);
  }

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `${user.firstName}_${user.lastName}.docx`)
}
