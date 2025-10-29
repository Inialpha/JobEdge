import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
  ShadingType,
} from 'docx';

import { ResumeData } from './classicDocx';

/**
 * Creates a DOCX document for the Creative Template
 */
export function generateCreativeDocx(resume: ResumeData): Document {
  const sections: Paragraph[] = [];

  // Header section with gradient-like styling (using color)
  // Name (32px = 24pt)
  sections.push(
    new Paragraph({
      text: resume.personalInformation.name,
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      run: {
        size: 64, // 32pt
        bold: true,
        color: 'FFFFFF',
        font: 'Segoe UI',
      },
      shading: {
        fill: '667EEA', // Purple gradient start color
        type: ShadingType.SOLID,
      },
    })
  );

  // Profession (18px = 13.5pt)
  if (resume.personalInformation.profession) {
    sections.push(
      new Paragraph({
        text: resume.personalInformation.profession,
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        run: {
          size: 36, // 18pt
          color: 'FFFFFF',
          font: 'Segoe UI',
        },
        shading: {
          fill: '764BA2', // Purple gradient end color
          type: ShadingType.SOLID,
        },
      })
    );
  }

  // Contact information
  const contactParts: string[] = [];
  if (resume.personalInformation.address) {
    contactParts.push(resume.personalInformation.address);
  }
  if (resume.personalInformation.phone) {
    contactParts.push(resume.personalInformation.phone);
  }
  contactParts.push(resume.personalInformation.email);
  if (resume.personalInformation.linkedin) {
    contactParts.push(resume.personalInformation.linkedin);
  }
  if (resume.personalInformation.website) {
    contactParts.push(resume.personalInformation.website);
  }

  sections.push(
    new Paragraph({
      text: contactParts.join(' | '),
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      run: {
        size: 24, // 12pt
        color: 'FFFFFF',
        font: 'Segoe UI',
      },
      shading: {
        fill: '764BA2',
        type: ShadingType.SOLID,
      },
    })
  );

  // Professional Summary
  if (resume.summary) {
    sections.push(createCreativeSectionTitle('PROFESSIONAL SUMMARY'));
    sections.push(
      new Paragraph({
        text: resume.summary,
        spacing: { after: 240 },
        run: {
          size: 24,
          color: '333333',
          font: 'Segoe UI',
        },
      })
    );
  }

  // Professional Experience
  if (resume.professionalExperience.length > 0) {
    sections.push(createCreativeSectionTitle('PROFESSIONAL EXPERIENCE'));

    resume.professionalExperience.forEach((exp) => {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: exp.role,
              bold: true,
              size: 24,
              color: '667EEA',
            }),
            new TextRun({
              text: ` | ${exp.organization}`,
              bold: true,
              size: 24,
              color: '333333',
            }),
            exp.location
              ? new TextRun({
                  text: `, ${exp.location}`,
                  size: 24,
                  color: '333333',
                })
              : new TextRun({ text: '' }),
          ],
          spacing: { after: 40 },
        })
      );

      sections.push(
        new Paragraph({
          text: `${exp.startDate} - ${exp.endDate}`,
          spacing: { after: 60 },
          run: {
            size: 22,
            color: '666666',
            font: 'Segoe UI',
          },
        })
      );

      exp.responsibilities.forEach((resp) => {
        sections.push(
          new Paragraph({
            text: resp,
            bullet: { level: 0 },
            spacing: { after: 40 },
            run: {
              size: 24,
              color: '333333',
              font: 'Segoe UI',
            },
          })
        );
      });

      sections.push(
        new Paragraph({
          text: '',
          spacing: { after: 120 },
        })
      );
    });
  }

  // Education
  if (resume.education.length > 0) {
    sections.push(createCreativeSectionTitle('EDUCATION'));

    resume.education.forEach((edu) => {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: edu.degree,
              bold: true,
              size: 24,
              color: '667EEA',
            }),
          ],
          spacing: { after: 40 },
        })
      );

      sections.push(
        new Paragraph({
          text: edu.institution,
          spacing: { after: 40 },
          run: {
            size: 24,
            color: '333333',
            font: 'Segoe UI',
          },
        })
      );

      sections.push(
        new Paragraph({
          text: `${edu.startDate} - ${edu.endDate}`,
          spacing: { after: edu.gpa ? 40 : 120 },
          run: {
            size: 24,
            color: '333333',
            font: 'Segoe UI',
          },
        })
      );

      if (edu.gpa) {
        sections.push(
          new Paragraph({
            text: `GPA: ${edu.gpa}`,
            spacing: { after: 120 },
            run: {
              size: 24,
              color: '333333',
              font: 'Segoe UI',
            },
          })
        );
      }
    });
  }

  // Skills
  if (resume.skills.length > 0) {
    sections.push(createCreativeSectionTitle('SKILLS'));

    const skillsText = resume.skills.join(' • ');
    sections.push(
      new Paragraph({
        text: skillsText,
        spacing: { after: 240 },
        run: {
          size: 24,
          color: '333333',
          font: 'Segoe UI',
        },
      })
    );
  }

  // Certifications
  if (resume.certifications.length > 0) {
    sections.push(createCreativeSectionTitle('CERTIFICATIONS'));

    resume.certifications.forEach((cert) => {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: cert.name,
              bold: true,
              size: 24,
              color: '667EEA',
            }),
          ],
          spacing: { after: 40 },
        })
      );

      sections.push(
        new Paragraph({
          text: `${cert.issuer} - ${cert.year}`,
          spacing: { after: 120 },
          run: {
            size: 24,
            color: '333333',
            font: 'Segoe UI',
          },
        })
      );
    });
  }

  // Projects
  if (resume.projects.length > 0) {
    sections.push(createCreativeSectionTitle('PROJECTS'));

    resume.projects.forEach((proj) => {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: proj.name,
              bold: true,
              size: 24,
              color: '667EEA',
            }),
          ],
          spacing: { after: 40 },
        })
      );

      sections.push(
        new Paragraph({
          text: proj.description,
          spacing: { after: 40 },
          run: {
            size: 24,
            color: '333333',
            font: 'Segoe UI',
          },
        })
      );

      if (proj.technologies) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: proj.technologies,
                italics: true,
                size: 24,
              }),
            ],
            spacing: { after: 120 },
          })
        );
      } else {
        sections.push(
          new Paragraph({
            text: '',
            spacing: { after: 120 },
          })
        );
      }
    });
  }

  // Awards
  if (resume.awards.length > 0) {
    sections.push(createCreativeSectionTitle('AWARDS'));

    resume.awards.forEach((award) => {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: award.title,
              bold: true,
              size: 24,
              color: '667EEA',
            }),
            new TextRun({
              text: ` - ${award.organization} (${award.year})`,
              size: 24,
            }),
          ],
          spacing: { after: 120 },
        })
      );
    });
  }

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.5),
              right: convertInchesToTwip(0.5),
              bottom: convertInchesToTwip(0.5),
              left: convertInchesToTwip(0.5),
            },
          },
        },
        children: sections,
      },
    ],
  });
}

/**
 * Helper function to create creative section titles with colored left border
 */
function createCreativeSectionTitle(title: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: '  ' + title, // Add space for the "left bar" effect
        bold: true,
        size: 32, // 16pt
        color: '667EEA',
      }),
    ],
    spacing: { before: 240, after: 160 },
    border: {
      left: {
        color: '667EEA',
        space: 1,
        style: BorderStyle.SINGLE,
        size: 24, // Thicker border for the "bar" effect (4px)
      },
    },
  });
}
