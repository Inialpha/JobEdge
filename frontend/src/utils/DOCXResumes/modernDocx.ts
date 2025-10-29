import {
  Document,
  Paragraph,
  TextRun,
  BorderStyle,
  convertInchesToTwip,
  Table,
  TableCell,
  TableRow,
  WidthType,
  VerticalAlign,
  ShadingType,
} from 'docx';

import { ResumeData } from './classicDocx';

/**
 * Creates a DOCX document for the Modern Template (two-column layout)
 */
export function generateModernDocx(resume: ResumeData): Document {
  // Left column (sidebar) content
  const leftColumnContent: Paragraph[] = [];
  
  // Name
  leftColumnContent.push(
    new Paragraph({
      text: resume.personalInformation.name,
      spacing: { after: 60 },
      run: {
        size: 56, // 28pt
        bold: true,
        color: 'FFFFFF',
        font: 'Segoe UI',
      },
    })
  );

  // Title/Summary preview
  const titleText = resume.personalInformation.profession || resume.summary.substring(0, 50) || 'Professional';
  leftColumnContent.push(
    new Paragraph({
      text: titleText,
      spacing: { after: 180 },
      run: {
        size: 28, // 14pt
        color: 'ECF0F1',
        font: 'Segoe UI',
      },
    })
  );

  // Contact information
  leftColumnContent.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'CONTACT',
          bold: true,
          size: 28,
          color: '3498DB',
        }),
      ],
      spacing: { before: 180, after: 120 },
      border: {
        bottom: {
          color: '3498DB',
          space: 1,
          style: BorderStyle.SINGLE,
          size: 12,
        },
      },
    })
  );

  if (resume.personalInformation.address) {
    leftColumnContent.push(
      new Paragraph({
        text: resume.personalInformation.address,
        spacing: { after: 60 },
        run: {
          size: 22,
          color: 'FFFFFF',
          font: 'Segoe UI',
        },
      })
    );
  }

  if (resume.personalInformation.phone) {
    leftColumnContent.push(
      new Paragraph({
        text: resume.personalInformation.phone,
        spacing: { after: 60 },
        run: {
          size: 22,
          color: 'FFFFFF',
          font: 'Segoe UI',
        },
      })
    );
  }

  leftColumnContent.push(
    new Paragraph({
      text: resume.personalInformation.email,
      spacing: { after: 180 },
      run: {
        size: 22,
        color: 'FFFFFF',
        font: 'Segoe UI',
      },
    })
  );

  // Skills
  if (resume.skills.length > 0) {
    leftColumnContent.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'SKILLS',
            bold: true,
            size: 28,
            color: '3498DB',
          }),
        ],
        spacing: { before: 180, after: 120 },
        border: {
          bottom: {
            color: '3498DB',
            space: 1,
            style: BorderStyle.SINGLE,
            size: 12,
          },
        },
      })
    );

    const skillsText = resume.skills.join(' • ');
    leftColumnContent.push(
      new Paragraph({
        text: skillsText,
        spacing: { after: 180 },
        run: {
          size: 22,
          color: 'FFFFFF',
          font: 'Segoe UI',
        },
      })
    );
  }

  // Education in sidebar
  if (resume.education.length > 0) {
    leftColumnContent.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'EDUCATION',
            bold: true,
            size: 28,
            color: '3498DB',
          }),
        ],
        spacing: { before: 180, after: 120 },
        border: {
          bottom: {
            color: '3498DB',
            space: 1,
            style: BorderStyle.SINGLE,
            size: 12,
          },
        },
      })
    );

    resume.education.forEach((edu) => {
      leftColumnContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: edu.degree,
              bold: true,
              size: 22,
              color: 'FFFFFF',
            }),
          ],
          spacing: { after: 40 },
        })
      );

      leftColumnContent.push(
        new Paragraph({
          text: edu.institution,
          spacing: { after: 40 },
          run: {
            size: 22,
            color: 'FFFFFF',
            font: 'Segoe UI',
          },
        })
      );

      leftColumnContent.push(
        new Paragraph({
          text: `${edu.startDate} - ${edu.endDate}`,
          spacing: { after: edu.gpa ? 40 : 120 },
          run: {
            size: 22,
            color: 'FFFFFF',
            font: 'Segoe UI',
          },
        })
      );

      if (edu.gpa) {
        leftColumnContent.push(
          new Paragraph({
            text: `GPA: ${edu.gpa}`,
            spacing: { after: 120 },
            run: {
              size: 22,
              color: 'FFFFFF',
              font: 'Segoe UI',
            },
          })
        );
      }
    });
  }

  // Right column (main content) content
  const rightColumnContent: Paragraph[] = [];

  // Professional Summary
  if (resume.summary) {
    rightColumnContent.push(createMainSectionTitle('PROFESSIONAL SUMMARY'));
    rightColumnContent.push(
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
    rightColumnContent.push(createMainSectionTitle('EXPERIENCE'));

    resume.professionalExperience.forEach((exp) => {
      rightColumnContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${exp.role} | ${exp.organization}`,
              bold: true,
              size: 24,
              color: '2C3E50',
            }),
            exp.location
              ? new TextRun({
                  text: `, ${exp.location}`,
                  bold: true,
                  size: 24,
                  color: '2C3E50',
                })
              : new TextRun({ text: '' }),
          ],
          spacing: { after: 40 },
        })
      );

      rightColumnContent.push(
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
        rightColumnContent.push(
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

      rightColumnContent.push(
        new Paragraph({
          text: '',
          spacing: { after: 120 },
        })
      );
    });
  }

  // Certifications
  if (resume.certifications.length > 0) {
    rightColumnContent.push(createMainSectionTitle('CERTIFICATIONS'));

    resume.certifications.forEach((cert) => {
      rightColumnContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: cert.name,
              bold: true,
              size: 24,
            }),
          ],
          spacing: { after: 40 },
        })
      );

      rightColumnContent.push(
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
    rightColumnContent.push(createMainSectionTitle('PROJECTS'));

    resume.projects.forEach((proj) => {
      rightColumnContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: proj.name,
              bold: true,
              size: 24,
            }),
          ],
          spacing: { after: 40 },
        })
      );

      rightColumnContent.push(
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
        rightColumnContent.push(
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
      }
    });
  }

  // Awards
  if (resume.awards.length > 0) {
    rightColumnContent.push(createMainSectionTitle('AWARDS'));

    resume.awards.forEach((award) => {
      rightColumnContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: award.title,
              bold: true,
              size: 24,
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

  // Create two-column table
  const table = new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: leftColumnContent,
            width: { size: 35, type: WidthType.PERCENTAGE },
            shading: {
              fill: '2C3E50',
              type: ShadingType.SOLID,
              color: '2C3E50',
            },
            margins: {
              top: 300,
              bottom: 300,
              left: 200,
              right: 200,
            },
            verticalAlign: VerticalAlign.TOP,
          }),
          new TableCell({
            children: rightColumnContent,
            width: { size: 65, type: WidthType.PERCENTAGE },
            margins: {
              top: 300,
              bottom: 300,
              left: 200,
              right: 200,
            },
            verticalAlign: VerticalAlign.TOP,
          }),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

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
        children: [table],
      },
    ],
  });
}

/**
 * Helper function to create main section titles (for right column)
 */
function createMainSectionTitle(title: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 28,
        color: '2C3E50',
      }),
    ],
    spacing: { before: 240, after: 160 },
    border: {
      bottom: {
        color: '3498DB',
        space: 1,
        style: BorderStyle.SINGLE,
        size: 12,
      },
    },
  });
}
