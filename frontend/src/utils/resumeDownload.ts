import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'
import { ResumeData, Template } from '@/types/resume'

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

export const downloadDocx = async (resume: ResumeData, template: Template = 'classic') => {
  // Parse skills - handle both string and array formats
  const skills: string[] = typeof resume.skills === 'string' 
    ? resume.skills.split(' • ').filter((s: string) => s.trim())
    : (resume.skills as unknown as string[]).filter((s: string) => s.trim())

  let doc: Document;

  // Template-specific document generation
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
  saveAs(blob, `resume-${template}.docx`)
}

// Classic template - centered header with traditional layout
const generateClassicDocx = (resume: ResumeData, skills: string[]) => {
  return new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: resume.personalInformation.name,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        ...(resume.personalInformation.profession ? [
          new Paragraph({
            text: resume.personalInformation.profession,
            alignment: AlignmentType.CENTER,
          }),
        ] : []),
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
            text: 'PROFESSIONAL SUMMARY',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: resume.summary }),
          new Paragraph({ text: '' }),
        ] : []),
        ...(resume.professionalExperience.length > 0 ? [
          new Paragraph({
            text: 'PROFESSIONAL EXPERIENCE',
            heading: HeadingLevel.HEADING_2,
          }),
          ...resume.professionalExperience.flatMap(exp => [
            new Paragraph({
              children: [
                new TextRun({ 
                  text: `${exp.role} | ${exp.organization}${exp.location ? `, ${exp.location}` : ''}`, 
                  bold: true 
                }),
              ],
            }),
            new Paragraph({
              text: `${exp.startDate} - ${exp.endDate}`,
            }),
            ...exp.responsibilities.filter(r => r.trim()).map(resp => new Paragraph({
              text: `• ${resp}`,
              bullet: { level: 0 },
            })),
            new Paragraph({ text: '' }),
          ]),
        ] : []),
        ...(resume.education.length > 0 ? [
          new Paragraph({
            text: 'EDUCATION',
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
            text: 'SKILLS',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: skills.join(' • ') }),
          new Paragraph({ text: '' }),
        ] : []),
        ...(resume.certifications.length > 0 ? [
          new Paragraph({
            text: 'CERTIFICATIONS',
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
            text: 'PROJECTS',
            heading: HeadingLevel.HEADING_2,
          }),
          ...resume.projects.flatMap(proj => [
            new Paragraph({
              children: [new TextRun({ text: proj.name, bold: true })],
            }),
            new Paragraph({ text: proj.description }),
            ...(proj.technologies ? [
              new Paragraph({ 
                children: [new TextRun({ text: proj.technologies, italics: true })],
              }),
            ] : []),
            new Paragraph({ text: '' }),
          ]),
        ] : []),
        ...(resume.awards.length > 0 ? [
          new Paragraph({
            text: 'AWARDS',
            heading: HeadingLevel.HEADING_2,
          }),
          ...resume.awards.map(award => new Paragraph({
            text: `${award.title} - ${award.organization} (${award.year})`,
          })),
        ] : []),
      ],
    }],
  })
}

// Modern template - left-aligned with bold section headers
const generateModernDocx = (resume: ResumeData, skills: string[]) => {
  return new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: resume.personalInformation.name,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.LEFT,
        }),
        ...(resume.personalInformation.profession ? [
          new Paragraph({
            text: resume.personalInformation.profession,
            alignment: AlignmentType.LEFT,
          }),
        ] : []),
        new Paragraph({
          text: [
            resume.personalInformation.email,
            resume.personalInformation.phone,
            resume.personalInformation.address
          ].filter(Boolean).join(' | '),
          alignment: AlignmentType.LEFT,
        }),
        new Paragraph({ text: '' }),
        ...(resume.summary ? [
          new Paragraph({
            text: 'PROFESSIONAL SUMMARY',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: resume.summary }),
          new Paragraph({ text: '' }),
        ] : []),
        ...(skills.length > 0 ? [
          new Paragraph({
            text: 'SKILLS',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: skills.join(' • ') }),
          new Paragraph({ text: '' }),
        ] : []),
        ...(resume.professionalExperience.length > 0 ? [
          new Paragraph({
            text: 'PROFESSIONAL EXPERIENCE',
            heading: HeadingLevel.HEADING_2,
          }),
          ...resume.professionalExperience.flatMap(exp => [
            new Paragraph({
              children: [
                new TextRun({ 
                  text: `${exp.role} | ${exp.organization}${exp.location ? `, ${exp.location}` : ''}`, 
                  bold: true 
                }),
              ],
            }),
            new Paragraph({
              text: `${exp.startDate} - ${exp.endDate}`,
            }),
            ...exp.responsibilities.filter(r => r.trim()).map(resp => new Paragraph({
              text: `• ${resp}`,
              bullet: { level: 0 },
            })),
            new Paragraph({ text: '' }),
          ]),
        ] : []),
        ...(resume.education.length > 0 ? [
          new Paragraph({
            text: 'EDUCATION',
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
        ...(resume.certifications.length > 0 ? [
          new Paragraph({
            text: 'CERTIFICATIONS',
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
            text: 'PROJECTS',
            heading: HeadingLevel.HEADING_2,
          }),
          ...resume.projects.flatMap(proj => [
            new Paragraph({
              children: [new TextRun({ text: proj.name, bold: true })],
            }),
            new Paragraph({ text: proj.description }),
            ...(proj.technologies ? [
              new Paragraph({ 
                children: [new TextRun({ text: proj.technologies, italics: true })],
              }),
            ] : []),
            new Paragraph({ text: '' }),
          ]),
        ] : []),
        ...(resume.awards.length > 0 ? [
          new Paragraph({
            text: 'AWARDS',
            heading: HeadingLevel.HEADING_2,
          }),
          ...resume.awards.map(award => new Paragraph({
            text: `${award.title} - ${award.organization} (${award.year})`,
          })),
        ] : []),
      ],
    }],
  })
}

// Minimal template - clean and simple with less formatting
const generateMinimalDocx = (resume: ResumeData, skills: string[]) => {
  return new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: resume.personalInformation.name,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.LEFT,
        }),
        ...(resume.personalInformation.profession ? [
          new Paragraph({
            text: resume.personalInformation.profession,
            alignment: AlignmentType.LEFT,
          }),
        ] : []),
        new Paragraph({
          text: [
            resume.personalInformation.email,
            resume.personalInformation.phone
          ].filter(Boolean).join(' • '),
          alignment: AlignmentType.LEFT,
        }),
        new Paragraph({ text: '' }),
        ...(resume.summary ? [
          new Paragraph({
            text: 'PROFESSIONAL SUMMARY',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: resume.summary }),
          new Paragraph({ text: '' }),
        ] : []),
        ...(resume.professionalExperience.length > 0 ? [
          new Paragraph({
            text: 'EXPERIENCE',
            heading: HeadingLevel.HEADING_2,
          }),
          ...resume.professionalExperience.flatMap(exp => [
            new Paragraph({
              children: [
                new TextRun({ 
                  text: `${exp.role}, ${exp.organization}`, 
                  bold: true 
                }),
              ],
            }),
            new Paragraph({
              text: `${exp.startDate} - ${exp.endDate}`,
            }),
            ...exp.responsibilities.filter(r => r.trim()).map(resp => new Paragraph({
              text: `• ${resp}`,
            })),
            new Paragraph({ text: '' }),
          ]),
        ] : []),
        ...(resume.education.length > 0 ? [
          new Paragraph({
            text: 'EDUCATION',
            heading: HeadingLevel.HEADING_2,
          }),
          ...resume.education.flatMap(edu => [
            new Paragraph({
              children: [new TextRun({ text: `${edu.degree}, ${edu.institution}`, bold: true })],
            }),
            new Paragraph({ text: `${edu.startDate} - ${edu.endDate}` }),
            new Paragraph({ text: '' }),
          ]),
        ] : []),
        ...(skills.length > 0 ? [
          new Paragraph({
            text: 'SKILLS',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: skills.join(' • ') }),
          new Paragraph({ text: '' }),
        ] : []),
        ...(resume.projects.length > 0 ? [
          new Paragraph({
            text: 'PROJECTS',
            heading: HeadingLevel.HEADING_2,
          }),
          ...resume.projects.flatMap(proj => [
            new Paragraph({
              children: [new TextRun({ text: proj.name, bold: true })],
            }),
            new Paragraph({ text: proj.description }),
            new Paragraph({ text: '' }),
          ]),
        ] : []),
        ...(resume.certifications.length > 0 ? [
          new Paragraph({
            text: 'CERTIFICATIONS',
            heading: HeadingLevel.HEADING_2,
          }),
          ...resume.certifications.map(cert => new Paragraph({
            text: `${cert.name} - ${cert.issuer} (${cert.year})`,
          })),
          new Paragraph({ text: '' }),
        ] : []),
        ...(resume.awards.length > 0 ? [
          new Paragraph({
            text: 'AWARDS',
            heading: HeadingLevel.HEADING_2,
          }),
          ...resume.awards.map(award => new Paragraph({
            text: `${award.title} - ${award.organization} (${award.year})`,
          })),
        ] : []),
      ],
    }],
  })
}

// Creative template - similar to classic but with different emphasis
const generateCreativeDocx = (resume: ResumeData, skills: string[]) => {
  return new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: resume.personalInformation.name,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        ...(resume.personalInformation.profession ? [
          new Paragraph({
            text: resume.personalInformation.profession,
            alignment: AlignmentType.CENTER,
          }),
        ] : []),
        new Paragraph({
          text: [
            resume.personalInformation.email,
            resume.personalInformation.phone,
            resume.personalInformation.address
          ].filter(Boolean).join(' | '),
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: '' }),
        ...(resume.summary ? [
          new Paragraph({
            text: 'PROFESSIONAL SUMMARY',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: resume.summary }),
          new Paragraph({ text: '' }),
        ] : []),
        ...(resume.professionalExperience.length > 0 ? [
          new Paragraph({
            text: 'PROFESSIONAL EXPERIENCE',
            heading: HeadingLevel.HEADING_2,
          }),
          ...resume.professionalExperience.flatMap(exp => [
            new Paragraph({
              children: [
                new TextRun({ 
                  text: `${exp.role} | ${exp.organization}${exp.location ? `, ${exp.location}` : ''}`, 
                  bold: true 
                }),
              ],
            }),
            new Paragraph({
              text: `${exp.startDate} - ${exp.endDate}`,
            }),
            ...exp.responsibilities.filter(r => r.trim()).map(resp => new Paragraph({
              text: `• ${resp}`,
              bullet: { level: 0 },
            })),
            new Paragraph({ text: '' }),
          ]),
        ] : []),
        ...(resume.education.length > 0 ? [
          new Paragraph({
            text: 'EDUCATION',
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
            text: 'SKILLS',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({ text: skills.join(' • ') }),
          new Paragraph({ text: '' }),
        ] : []),
        ...(resume.certifications.length > 0 ? [
          new Paragraph({
            text: 'CERTIFICATIONS',
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
            text: 'PROJECTS',
            heading: HeadingLevel.HEADING_2,
          }),
          ...resume.projects.flatMap(proj => [
            new Paragraph({
              children: [new TextRun({ text: proj.name, bold: true })],
            }),
            new Paragraph({ text: proj.description }),
            ...(proj.technologies ? [
              new Paragraph({ 
                children: [new TextRun({ text: proj.technologies, italics: true })],
              }),
            ] : []),
            new Paragraph({ text: '' }),
          ]),
        ] : []),
        ...(resume.awards.length > 0 ? [
          new Paragraph({
            text: 'AWARDS',
            heading: HeadingLevel.HEADING_2,
          }),
          ...resume.awards.map(award => new Paragraph({
            text: `${award.title} - ${award.organization} (${award.year})`,
          })),
        ] : []),
      ],
    }],
  })
}

