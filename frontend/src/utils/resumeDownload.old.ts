import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, UnderlineType, BorderStyle } from 'docx'
import { saveAs } from 'file-saver'
import { ResumeData, Template } from '@/types/resume'
import { parseSkillsArray } from './resumeUtils'
import { generateClassicTemplateDocx } from "@/components/resume-docx/generateClassicDocx";
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
          spacing: { after: 100 },
          run: {
            size: 64, // 32pt
            bold: true,
            color: "2c3e50", // Dark blue-gray matching the preview
          }
        }),
        ...(resume.personalInformation.profession ? [
          new Paragraph({
            text: resume.personalInformation.profession,
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            run: {
              size: 36, // 18pt
              color: "7f8c8d", // Gray
            }
          }),
        ] : []),
        new Paragraph({
          text: [
            resume.personalInformation.address,
            resume.personalInformation.phone,
            resume.personalInformation.email
          ].filter(Boolean).join(' | '),
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          run: {
            size: 24, // 12pt
            color: "555555",
          }
        }),
        ...(resume.summary ? [
          new Paragraph({
            text: 'PROFESSIONAL SUMMARY',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: {
              size: 32, // 16pt
              bold: true,
              color: "2c3e50",
            },
            border: {
              bottom: {
                color: "2c3e50",
                space: 1,
                style: BorderStyle.SINGLE,
                size: 12, // 2px
              },
            },
          }),
          new Paragraph({ 
            text: resume.summary,
            spacing: { after: 200 },
            run: {
              size: 24, // 12pt
            }
          }),
        ] : []),
        ...(resume.professionalExperience.length > 0 ? [
          new Paragraph({
            text: 'PROFESSIONAL EXPERIENCE',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: {
              size: 32, // 16pt
              bold: true,
              color: "2c3e50",
            },
            border: {
              bottom: {
                color: "2c3e50",
                space: 1,
                style: BorderStyle.SINGLE,
                size: 12,
              },
            },
          }),
          ...resume.professionalExperience.flatMap(exp => [
            new Paragraph({
              children: [
                new TextRun({ 
                  text: `${exp.role} | ${exp.organization}${exp.location ? `, ${exp.location}` : ''}`, 
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { before: 100, after: 50 },
            }),
            new Paragraph({
              text: `${exp.startDate} - ${exp.endDate}`,
              spacing: { after: 50 },
              run: {
                size: 24,
              }
            }),
            ...exp.responsibilities.filter(r => r.trim()).map(resp => new Paragraph({
              text: `• ${resp}`,
              bullet: { level: 0 },
              spacing: { after: 50 },
              run: {
                size: 24,
              }
            })),
            new Paragraph({ text: '', spacing: { after: 100 } }),
          ]),
        ] : []),
        ...(resume.education.length > 0 ? [
          new Paragraph({
            text: 'EDUCATION',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: {
              size: 32,
              bold: true,
              color: "2c3e50",
            },
            border: {
              bottom: {
                color: "2c3e50",
                space: 1,
                style: BorderStyle.SINGLE,
                size: 12,
              },
            },
          }),
          ...resume.education.flatMap(edu => [
            new Paragraph({
              children: [new TextRun({ text: edu.degree, bold: true, size: 24 })],
              spacing: { before: 100 },
            }),
            new Paragraph({ text: edu.institution, run: { size: 24 } }),
            new Paragraph({ text: `${edu.startDate} - ${edu.endDate}`, run: { size: 24 } }),
            ...(edu.gpa ? [new Paragraph({ text: `GPA: ${edu.gpa}`, run: { size: 24 } })] : []),
            new Paragraph({ text: '', spacing: { after: 100 } }),
          ]),
        ] : []),
        ...(skills.length > 0 ? [
          new Paragraph({
            text: 'SKILLS',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: {
              size: 32,
              bold: true,
              color: "2c3e50",
            },
            border: {
              bottom: {
                color: "2c3e50",
                space: 1,
                style: BorderStyle.SINGLE,
                size: 12,
              },
            },
          }),
          new Paragraph({ 
            text: skills.join(' • '),
            spacing: { after: 200 },
            run: {
              size: 24,
            }
          }),
        ] : []),
        ...(resume.certifications.length > 0 ? [
          new Paragraph({
            text: 'CERTIFICATIONS',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: {
              size: 32,
              bold: true,
              color: "2c3e50",
            },
            border: {
              bottom: {
                color: "2c3e50",
                space: 1,
                style: BorderStyle.SINGLE,
                size: 12,
              },
            },
          }),
          ...resume.certifications.flatMap(cert => [
            new Paragraph({
              children: [new TextRun({ text: cert.name, bold: true, size: 24 })],
            }),
            new Paragraph({ text: `${cert.issuer} - ${cert.year}`, run: { size: 24 } }),
          ]),
          new Paragraph({ text: '', spacing: { after: 100 } }),
        ] : []),
        ...(resume.projects.length > 0 ? [
          new Paragraph({
            text: 'PROJECTS',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: {
              size: 32,
              bold: true,
              color: "2c3e50",
            },
            border: {
              bottom: {
                color: "2c3e50",
                space: 1,
                style: BorderStyle.SINGLE,
                size: 12,
              },
            },
          }),
          ...resume.projects.flatMap(proj => [
            new Paragraph({
              children: [new TextRun({ text: proj.name, bold: true, size: 24 })],
            }),
            new Paragraph({ text: proj.description, run: { size: 24 } }),
            ...(proj.technologies ? [
              new Paragraph({ 
                children: [new TextRun({ text: proj.technologies, italics: true, size: 24 })],
              }),
            ] : []),
            new Paragraph({ text: '', spacing: { after: 100 } }),
          ]),
        ] : []),
        ...(resume.awards.length > 0 ? [
          new Paragraph({
            text: 'AWARDS',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: {
              size: 32,
              bold: true,
              color: "2c3e50",
            },
            border: {
              bottom: {
                color: "2c3e50",
                space: 1,
                style: BorderStyle.SINGLE,
                size: 12,
              },
            },
          }),
          ...resume.awards.map(award => new Paragraph({
            text: `${award.title} - ${award.organization} (${award.year})`,
            run: { size: 24 }
          })),
        ] : []),
      ],
    }],
  })
}

// Modern template - left-aligned with bold section headers and blue accents
const generateModernDocx = (resume: ResumeData, skills: string[]) => {
  return new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: resume.personalInformation.name,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.LEFT,
          spacing: { after: 100 },
          run: {
            size: 56, // 28pt
            bold: true,
            color: "2c3e50",
          }
        }),
        ...(resume.personalInformation.profession ? [
          new Paragraph({
            text: resume.personalInformation.profession,
            alignment: AlignmentType.LEFT,
            spacing: { after: 100 },
            run: {
              size: 28,
              color: "7f8c8d",
            }
          }),
        ] : []),
        new Paragraph({
          text: [
            resume.personalInformation.email,
            resume.personalInformation.phone,
            resume.personalInformation.address
          ].filter(Boolean).join(' | '),
          alignment: AlignmentType.LEFT,
          spacing: { after: 200 },
          run: {
            size: 24,
            color: "555555",
          }
        }),
        ...(resume.summary ? [
          new Paragraph({
            text: 'PROFESSIONAL SUMMARY',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: {
              size: 32,
              bold: true,
              color: "2c3e50",
            },
            border: {
              bottom: {
                color: "3498db", // Blue accent
                space: 1,
                style: BorderStyle.SINGLE,
                size: 12,
              },
            },
          }),
          new Paragraph({ 
            text: resume.summary,
            spacing: { after: 200 },
            run: {
              size: 24,
            }
          }),
        ] : []),
        ...(skills.length > 0 ? [
          new Paragraph({
            text: 'SKILLS',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: {
              size: 32,
              bold: true,
              color: "2c3e50",
            },
            border: {
              bottom: {
                color: "3498db",
                space: 1,
                style: BorderStyle.SINGLE,
                size: 12,
              },
            },
          }),
          new Paragraph({ 
            text: skills.join(' • '),
            spacing: { after: 200 },
            run: {
              size: 24,
            }
          }),
        ] : []),
        ...(resume.professionalExperience.length > 0 ? [
          new Paragraph({
            text: 'PROFESSIONAL EXPERIENCE',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: {
              size: 32,
              bold: true,
              color: "2c3e50",
            },
            border: {
              bottom: {
                color: "3498db",
                space: 1,
                style: BorderStyle.SINGLE,
                size: 12,
              },
            },
          }),
          ...resume.professionalExperience.flatMap(exp => [
            new Paragraph({
              children: [
                new TextRun({ 
                  text: `${exp.role} | ${exp.organization}${exp.location ? `, ${exp.location}` : ''}`, 
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { before: 100, after: 50 },
            }),
            new Paragraph({
              text: `${exp.startDate} - ${exp.endDate}`,
              spacing: { after: 50 },
              run: {
                size: 24,
              }
            }),
            ...exp.responsibilities.filter(r => r.trim()).map(resp => new Paragraph({
              text: `• ${resp}`,
              bullet: { level: 0 },
              spacing: { after: 50 },
              run: {
                size: 24,
              }
            })),
            new Paragraph({ text: '', spacing: { after: 100 } }),
          ]),
        ] : []),
        ...(resume.education.length > 0 ? [
          new Paragraph({
            text: 'EDUCATION',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: {
              size: 32,
              bold: true,
              color: "2c3e50",
            },
            border: {
              bottom: {
                color: "3498db",
                space: 1,
                style: BorderStyle.SINGLE,
                size: 12,
              },
            },
          }),
          ...resume.education.flatMap(edu => [
            new Paragraph({
              children: [new TextRun({ text: edu.degree, bold: true, size: 24 })],
              spacing: { before: 100 },
            }),
            new Paragraph({ text: edu.institution, run: { size: 24 } }),
            new Paragraph({ text: `${edu.startDate} - ${edu.endDate}`, run: { size: 24 } }),
            ...(edu.gpa ? [new Paragraph({ text: `GPA: ${edu.gpa}`, run: { size: 24 } })] : []),
            new Paragraph({ text: '', spacing: { after: 100 } }),
          ]),
        ] : []),
        ...(resume.certifications.length > 0 ? [
          new Paragraph({
            text: 'CERTIFICATIONS',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: {
              size: 32,
              bold: true,
              color: "2c3e50",
            },
            border: {
              bottom: {
                color: "3498db",
                space: 1,
                style: BorderStyle.SINGLE,
                size: 12,
              },
            },
          }),
          ...resume.certifications.flatMap(cert => [
            new Paragraph({
              children: [new TextRun({ text: cert.name, bold: true, size: 24 })],
            }),
            new Paragraph({ text: `${cert.issuer} - ${cert.year}`, run: { size: 24 } }),
          ]),
          new Paragraph({ text: '', spacing: { after: 100 } }),
        ] : []),
        ...(resume.projects.length > 0 ? [
          new Paragraph({
            text: 'PROJECTS',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: {
              size: 32,
              bold: true,
              color: "2c3e50",
            },
            border: {
              bottom: {
                color: "3498db",
                space: 1,
                style: BorderStyle.SINGLE,
                size: 12,
              },
            },
          }),
          ...resume.projects.flatMap(proj => [
            new Paragraph({
              children: [new TextRun({ text: proj.name, bold: true, size: 24 })],
            }),
            new Paragraph({ text: proj.description, run: { size: 24 } }),
            ...(proj.technologies ? [
              new Paragraph({ 
                children: [new TextRun({ text: proj.technologies, italics: true, size: 24 })],
              }),
            ] : []),
            new Paragraph({ text: '', spacing: { after: 100 } }),
          ]),
        ] : []),
        ...(resume.awards.length > 0 ? [
          new Paragraph({
            text: 'AWARDS',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: {
              size: 32,
              bold: true,
              color: "2c3e50",
            },
            border: {
              bottom: {
                color: "3498db",
                space: 1,
                style: BorderStyle.SINGLE,
                size: 12,
              },
            },
          }),
          ...resume.awards.map(award => new Paragraph({
            text: `${award.title} - ${award.organization} (${award.year})`,
            run: { size: 24 }
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
          spacing: { after: 100 },
          run: {
            size: 72, // 36pt - larger for minimal
            bold: false, // Light weight for minimal
            color: "333333",
          }
        }),
        ...(resume.personalInformation.profession ? [
          new Paragraph({
            text: resume.personalInformation.profession,
            alignment: AlignmentType.LEFT,
            spacing: { after: 150 },
            run: {
              size: 32,
              bold: false,
              color: "666666",
            }
          }),
        ] : []),
        new Paragraph({
          text: [
            resume.personalInformation.email,
            resume.personalInformation.phone
          ].filter(Boolean).join(' • '),
          alignment: AlignmentType.LEFT,
          spacing: { after: 250 },
          run: {
            size: 24,
            color: "666666",
          }
        }),
        ...(resume.summary ? [
          new Paragraph({
            text: 'PROFESSIONAL SUMMARY',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: {
              size: 28,
              bold: true,
              color: "333333",
            },
          }),
          new Paragraph({ 
            text: resume.summary,
            spacing: { after: 200 },
            run: {
              size: 24,
            }
          }),
        ] : []),
        ...(resume.professionalExperience.length > 0 ? [
          new Paragraph({
            text: 'EXPERIENCE',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: {
              size: 28,
              bold: true,
              color: "333333",
            },
          }),
          ...resume.professionalExperience.flatMap(exp => [
            new Paragraph({
              children: [
                new TextRun({ 
                  text: `${exp.role}, ${exp.organization}`, 
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { before: 100, after: 50 },
            }),
            new Paragraph({
              text: `${exp.startDate} - ${exp.endDate}`,
              spacing: { after: 50 },
              run: {
                size: 24,
              }
            }),
            ...exp.responsibilities.filter(r => r.trim()).map(resp => new Paragraph({
              text: `• ${resp}`,
              spacing: { after: 50 },
              run: {
                size: 24,
              }
            })),
            new Paragraph({ text: '', spacing: { after: 100 } }),
          ]),
        ] : []),
        ...(resume.education.length > 0 ? [
          new Paragraph({
            text: 'EDUCATION',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: {
              size: 28,
              bold: true,
              color: "333333",
            },
          }),
          ...resume.education.flatMap(edu => [
            new Paragraph({
              children: [new TextRun({ text: `${edu.degree}, ${edu.institution}`, bold: true, size: 24 })],
              spacing: { before: 100 },
            }),
            new Paragraph({ text: `${edu.startDate} - ${edu.endDate}`, run: { size: 24 } }),
            new Paragraph({ text: '', spacing: { after: 100 } }),
          ]),
        ] : []),
        ...(skills.length > 0 ? [
          new Paragraph({
            text: 'SKILLS',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: {
              size: 28,
              bold: true,
              color: "333333",
            },
          }),
          new Paragraph({ 
            text: skills.join(' • '),
            spacing: { after: 200 },
            run: {
              size: 24,
            }
          }),
        ] : []),
        ...(resume.projects.length > 0 ? [
          new Paragraph({
            text: 'PROJECTS',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: {
              size: 28,
              bold: true,
              color: "333333",
            },
          }),
          ...resume.projects.flatMap(proj => [
            new Paragraph({
              children: [new TextRun({ text: proj.name, bold: true, size: 24 })],
            }),
            new Paragraph({ text: proj.description, run: { size: 24 } }),
            new Paragraph({ text: '', spacing: { after: 100 } }),
          ]),
        ] : []),
        ...(resume.certifications.length > 0 ? [
          new Paragraph({
            text: 'CERTIFICATIONS',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: {
              size: 28,
              bold: true,
              color: "333333",
            },
          }),
          ...resume.certifications.map(cert => new Paragraph({
            text: `${cert.name} - ${cert.issuer} (${cert.year})`,
            run: { size: 24 }
          })),
          new Paragraph({ text: '', spacing: { after: 100 } }),
        ] : []),
        ...(resume.awards.length > 0 ? [
          new Paragraph({
            text: 'AWARDS',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: {
              size: 28,
              bold: true,
              color: "333333",
            },
          }),
          ...resume.awards.map(award => new Paragraph({
            text: `${award.title} - ${award.organization} (${award.year})`,
            run: { size: 24 }
          })),
        ] : []),
      ],
    }],
  })
}

// Creative template - centered header with purple accent and left border on headings
const generateCreativeDocx = (resume: ResumeData, skills: string[]) => {
  return new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: resume.personalInformation.name,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          run: {
            size: 64,
            bold: true,
            color: "FFFFFF", // White text (can't do gradient in DOCX, using solid color)
          },
          // Note: DOCX doesn't support gradient backgrounds, so we'll use purple color for section titles
        }),
        ...(resume.personalInformation.profession ? [
          new Paragraph({
            text: resume.personalInformation.profession,
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            run: {
              size: 36,
              color: "667eea", // Purple
            }
          }),
        ] : []),
        new Paragraph({
          text: [
            resume.personalInformation.email,
            resume.personalInformation.phone,
            resume.personalInformation.address
          ].filter(Boolean).join(' | '),
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          run: {
            size: 24,
            color: "555555",
          }
        }),
        ...(resume.summary ? [
          new Paragraph({
            text: 'PROFESSIONAL SUMMARY',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: {
              size: 32,
              bold: true,
              color: "667eea", // Purple
            },
            border: {
              left: {
                color: "667eea",
                space: 1,
                style: BorderStyle.SINGLE,
                size: 24, // 4px thick left border
              },
            },
            indent: {
              left: 200, // Indent for left border effect
            },
          }),
          new Paragraph({ 
            text: resume.summary,
            spacing: { after: 200 },
            run: {
              size: 24,
            }
          }),
        ] : []),
        ...(resume.professionalExperience.length > 0 ? [
          new Paragraph({
            text: 'PROFESSIONAL EXPERIENCE',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: {
              size: 32,
              bold: true,
              color: "667eea",
            },
            border: {
              left: {
                color: "667eea",
                space: 1,
                style: BorderStyle.SINGLE,
                size: 24,
              },
            },
            indent: {
              left: 200,
            },
          }),
          ...resume.professionalExperience.flatMap(exp => [
            new Paragraph({
              children: [
                new TextRun({ 
                  text: `${exp.role} | ${exp.organization}${exp.location ? `, ${exp.location}` : ''}`, 
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { before: 100, after: 50 },
            }),
            new Paragraph({
              text: `${exp.startDate} - ${exp.endDate}`,
              spacing: { after: 50 },
              run: {
                size: 24,
              }
            }),
            ...exp.responsibilities.filter(r => r.trim()).map(resp => new Paragraph({
              text: `• ${resp}`,
              bullet: { level: 0 },
              spacing: { after: 50 },
              run: {
                size: 24,
              }
            })),
            new Paragraph({ text: '', spacing: { after: 100 } }),
          ]),
        ] : []),
        ...(resume.education.length > 0 ? [
          new Paragraph({
            text: 'EDUCATION',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: {
              size: 32,
              bold: true,
              color: "667eea",
            },
            border: {
              left: {
                color: "667eea",
                space: 1,
                style: BorderStyle.SINGLE,
                size: 24,
              },
            },
            indent: {
              left: 200,
            },
          }),
          ...resume.education.flatMap(edu => [
            new Paragraph({
              children: [new TextRun({ text: edu.degree, bold: true, size: 24 })],
              spacing: { before: 100 },
            }),
            new Paragraph({ text: edu.institution, run: { size: 24 } }),
            new Paragraph({ text: `${edu.startDate} - ${edu.endDate}`, run: { size: 24 } }),
            ...(edu.gpa ? [new Paragraph({ text: `GPA: ${edu.gpa}`, run: { size: 24 } })] : []),
            new Paragraph({ text: '', spacing: { after: 100 } }),
          ]),
        ] : []),
        ...(skills.length > 0 ? [
          new Paragraph({
            text: 'SKILLS',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: {
              size: 32,
              bold: true,
              color: "667eea",
            },
            border: {
              left: {
                color: "667eea",
                space: 1,
                style: BorderStyle.SINGLE,
                size: 24,
              },
            },
            indent: {
              left: 200,
            },
          }),
          new Paragraph({ 
            text: skills.join(' • '),
            spacing: { after: 200 },
            run: {
              size: 24,
            }
          }),
        ] : []),
        ...(resume.certifications.length > 0 ? [
          new Paragraph({
            text: 'CERTIFICATIONS',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: {
              size: 32,
              bold: true,
              color: "667eea",
            },
            border: {
              left: {
                color: "667eea",
                space: 1,
                style: BorderStyle.SINGLE,
                size: 24,
              },
            },
            indent: {
              left: 200,
            },
          }),
          ...resume.certifications.flatMap(cert => [
            new Paragraph({
              children: [new TextRun({ text: cert.name, bold: true, size: 24 })],
            }),
            new Paragraph({ text: `${cert.issuer} - ${cert.year}`, run: { size: 24 } }),
          ]),
          new Paragraph({ text: '', spacing: { after: 100 } }),
        ] : []),
        ...(resume.projects.length > 0 ? [
          new Paragraph({
            text: 'PROJECTS',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: {
              size: 32,
              bold: true,
              color: "667eea",
            },
            border: {
              left: {
                color: "667eea",
                space: 1,
                style: BorderStyle.SINGLE,
                size: 24,
              },
            },
            indent: {
              left: 200,
            },
          }),
          ...resume.projects.flatMap(proj => [
            new Paragraph({
              children: [new TextRun({ text: proj.name, bold: true, size: 24 })],
            }),
            new Paragraph({ text: proj.description, run: { size: 24 } }),
            ...(proj.technologies ? [
              new Paragraph({ 
                children: [new TextRun({ text: proj.technologies, italics: true, size: 24 })],
              }),
            ] : []),
            new Paragraph({ text: '', spacing: { after: 100 } }),
          ]),
        ] : []),
        ...(resume.awards.length > 0 ? [
          new Paragraph({
            text: 'AWARDS',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
            run: {
              size: 32,
              bold: true,
              color: "667eea",
            },
            border: {
              left: {
                color: "667eea",
                space: 1,
                style: BorderStyle.SINGLE,
                size: 24,
              },
            },
            indent: {
              left: 200,
            },
          }),
          ...resume.awards.map(award => new Paragraph({
            text: `${award.title} - ${award.organization} (${award.year})`,
            run: { size: 24 }
          })),
        ] : []),
      ],
    }],
  })
}

