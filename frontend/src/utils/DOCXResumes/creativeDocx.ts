import {
  Document,
  Paragraph,
  TextRun,
  convertInchesToTwip,
  Table,
  TableCell,
  TableRow,
  WidthType,
  VerticalAlign,
  ShadingType,
  TabStopPosition,
  TableLayoutType
} from 'docx';

import { ResumeData } from './classicDocx';

/**
 * Creates a DOCX document for the Creative Template
 * Matches the styling from ResumeBuilder.tsx creative-template CSS
 */
export function generateCreativeDocx(resume: ResumeData): Document {
  const sections: Paragraph[] = [];

  // Create header section with gradient background effect
  // Since DOCX doesn't support CSS gradients, we'll use a solid color approximation
  // Using a mid-tone from the gradient: #667eea (102, 126, 234) to #764ba2 (118, 75, 162)
  // Approximating with #6C74C6 which is between the two colors
  
  const headerContent: Paragraph[] = [];

  // Name (32px = 24pt, in docx half-points: 64)
  headerContent.push(
    new Paragraph({
      text: resume.personalInformation.name,
      spacing: { after: 100 },
      run: {
        size: 64, // 32px (docx uses half-points: 32px * 2 = 64)
        bold: true,
        color: 'FFFFFF',
        font: 'Segoe UI',
      },
    })
  );

  // Profession/Title (18px in docx half-points: 36)
  if (resume.personalInformation.profession) {
    headerContent.push(
      new Paragraph({
        text: resume.personalInformation.profession,
        spacing: { after: 200 },
        run: {
          size: 36, // 18px (docx uses half-points: 18px * 2 = 36)
          color: 'FFFFFF',
          font: 'Segoe UI',
        },
      })
    );
  }

  // Contact information (12px in docx half-points: 24)
  const contactParts: string[] = [];
  if (resume.personalInformation.address) {
    contactParts.push(resume.personalInformation.address);
  }
  if (resume.personalInformation.phone) {
    contactParts.push(resume.personalInformation.phone);
  }
  contactParts.push(resume.personalInformation.email);

  headerContent.push(
    new Paragraph({
      text: contactParts.join(' | '),
      spacing: { after: 0 },
      run: {
        size: 24, // 12px (docx uses half-points: 12px * 2 = 24)
        color: 'FFFFFF',
        font: 'Segoe UI',
      },
    })
  );

  // Create header table with colored background
  const headerTable = new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: headerContent,
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: {
              fill: '6C74C6', // Approximation of gradient midpoint
              type: ShadingType.SOLID,
              color: '6C74C6',
            },
            margins: {
              top: 600,
              bottom: 600,
              left: 600,
              right: 600,
            },
            verticalAlign: VerticalAlign.CENTER,
          }),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
  });

  // Add some spacing after header
  sections.push(
    new Paragraph({
      text: '',
      spacing: { after: 400 },
    })
  );

  // Professional Summary
  if (resume.summary) {
    sections.push(createCreativeSectionTitle('PROFESSIONAL SUMMARY'));
    sections.push(
      new Paragraph({
        text: resume.summary,
        spacing: { after: 320 },
        run: {
          size: 24, // 12pt
          color: '333333',
          font: 'Segoe UI',
        },
      })
    );
  }

  // Professional Experience
  if (resume.professionalExperience.length > 0) {
    sections.push(createCreativeSectionTitle('EXPERIENCE'));

    resume.professionalExperience.forEach((exp) => {
      // Job header with role, organization, location
      const jobTitleText = `${exp.role} | ${exp.organization}${
        exp.location ? `, ${exp.location}` : ''
      }`;

      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: jobTitleText,
              bold: true,
              size: 24,
              color: '333333',
            }),
            new TextRun({
              text: `\t${exp.startDate} - ${exp.endDate}`,
              size: 22,
              color: '666666',
            }),
          ],
          spacing: { after: 100 },
          tabStops: [
            {
              type: 'right',
              position: TabStopPosition.MAX,
            },
          ],
        })
      );

      // Responsibilities as bullet points
      exp.responsibilities.forEach((resp) => {
        sections.push(
          new Paragraph({
            text: resp,
            bullet: { level: 0 },
            spacing: { after: 60 },
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
          spacing: { after: 200 },
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
              color: '333333',
            }),
          ],
          spacing: { after: 80 },
        })
      );

      sections.push(
        new Paragraph({
          text: edu.institution,
          spacing: { after: 80 },
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
          spacing: { after: edu.gpa ? 80 : 200 },
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
            spacing: { after: 200 },
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
        spacing: { after: 320 },
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
              color: '333333',
            }),
          ],
          spacing: { after: 80 },
        })
      );

      sections.push(
        new Paragraph({
          text: `${cert.issuer} - ${cert.year}`,
          spacing: { after: 200 },
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
              color: '333333',
            }),
          ],
          spacing: { after: 80 },
        })
      );

      sections.push(
        new Paragraph({
          text: proj.description,
          spacing: { after: 80 },
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
                color: '333333',
              }),
            ],
            spacing: { after: 200 },
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
              color: '333333',
            }),
            new TextRun({
              text: ` - ${award.organization} (${award.year})`,
              size: 24,
              color: '333333',
            }),
          ],
          spacing: { after: 200 },
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
        children: [headerTable, ...sections],
      },
    ],
  });
}

/**
 * Helper function to create creative section titles
 * 16px (32 half-points), uppercase, bold, with purple color (#667eea)
 */
function createCreativeSectionTitle(title: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 32, // 16px (docx uses half-points: 16px * 2 = 32)
        color: '667EEA',
      }),
    ],
    spacing: { before: 400, after: 200 },
    // Note: DOCX doesn't support the left gradient bar directly
    // The color and bold styling will distinguish sections
  });
}
