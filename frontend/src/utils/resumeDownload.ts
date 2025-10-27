import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'
import { ResumeData } from '@/types/resume'

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

export const downloadDocx = async (resume: ResumeData) => {
  const skills = resume.skills.filter(s => s.trim())

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: resume.personalInformation.name,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: resume.summary.substring(0, 50) || 'Professional',
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: [
            resume.personalInformation.address,
            resume.personalInformation.phone,
            resume.personalInformation.email
          ].filter(Boolean).join(' | '),
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: '' }),
        ...(resume.summary ? [
          new Paragraph({
            text: 'Professional Summary',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: resume.summary }),
          new Paragraph({ text: '' }),
        ] : []),
        ...(resume.professionalExperience.length > 0 ? [
          new Paragraph({
            text: 'Professional Experience',
            heading: HeadingLevel.HEADING_2,
          }),
          ...resume.professionalExperience.flatMap(exp => [
            new Paragraph({
              children: [
                new TextRun({ 
                  text: `${exp.role} | ${exp.organization}${exp.location ? `, ${exp.location}` : ''}`, 
                  bold: true 
                }),
                new TextRun({ text: ` (${exp.startDate} - ${exp.endDate})` }),
              ],
            }),
            ...exp.responsibilities.map(resp => new Paragraph({
              text: `• ${resp}`,
              bullet: { level: 0 },
            })),
            new Paragraph({ text: '' }),
          ]),
        ] : []),
        ...(resume.education.length > 0 ? [
          new Paragraph({
            text: 'Education',
            heading: HeadingLevel.HEADING_2,
          }),
          ...resume.education.flatMap(edu => [
            new Paragraph({
              children: [new TextRun({ text: edu.degree, bold: true })],
            }),
            new Paragraph({ text: edu.institution }),
            new Paragraph({ text: `${edu.startDate} - ${edu.endDate}` }),
            ...(edu.gpa ? [new Paragraph({ text: `GPA: ${edu.gpa}` })] : []),
            new Paragraph({ text: '' }),
          ]),
        ] : []),
        ...(skills.length > 0 ? [
          new Paragraph({
            text: 'Skills',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: skills.join(', ') }),
          new Paragraph({ text: '' }),
        ] : []),
        ...(resume.certifications.length > 0 ? [
          new Paragraph({
            text: 'Certifications',
            heading: HeadingLevel.HEADING_2,
          }),
          ...resume.certifications.flatMap(cert => [
            new Paragraph({
              children: [new TextRun({ text: cert.name, bold: true })],
            }),
            new Paragraph({ text: `${cert.issuer} - ${cert.year}` }),
          ]),
          new Paragraph({ text: '' }),
        ] : []),
        ...(resume.projects.length > 0 ? [
          new Paragraph({
            text: 'Projects',
            heading: HeadingLevel.HEADING_2,
          }),
          ...resume.projects.flatMap(proj => [
            new Paragraph({
              children: [new TextRun({ text: proj.name, bold: true })],
            }),
            new Paragraph({ text: proj.description }),
            new Paragraph({ 
              children: [new TextRun({ text: proj.technologies, italics: true })],
            }),
            new Paragraph({ text: '' }),
          ]),
        ] : []),
        ...(resume.awards.length > 0 ? [
          new Paragraph({
            text: 'Awards',
            heading: HeadingLevel.HEADING_2,
          }),
          ...resume.awards.map(award => new Paragraph({
            text: `${award.title} - ${award.organization} (${award.year})`,
          })),
        ] : []),
      ],
    }],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, 'resume.docx')
}

