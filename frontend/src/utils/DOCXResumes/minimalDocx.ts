import {
  Document,
  Paragraph,
  TextRun,
  convertInchesToTwip,
} from 'docx';

import { ResumeData } from './classicDocx';

/**
 * Creates a DOCX document for the Minimal Template
 */
export function generateMinimalDocx(resume: ResumeData): Document {
  const sections: Paragraph[] = [];

  // Name (36px = 27pt) - light weight
  sections.push(
    new Paragraph({
      text: resume.personalInformation.name,
      spacing: { after: 60 },
      run: {
        size: 72, // 36pt
        bold: false,
        color: '333333',
        font: 'Segoe UI',
      },
    })
  );

  // Profession (16px = 12pt) - light weight
  if (resume.personalInformation.profession) {
    sections.push(
      new Paragraph({
        text: resume.personalInformation.profession,
        spacing: { after: 180 },
        run: {
          size: 32, // 16pt
          bold: false,
          color: '666666',
          font: 'Segoe UI',
        },
      })
    );
  }

  // Contact information (12px = 9pt)
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
      spacing: { after: 300 },
      run: {
        size: 24, // 12pt
        color: '666666',
        font: 'Segoe UI',
      },
    })
  );

  // Professional Summary
  if (resume.summary) {
    sections.push(createMinimalSectionTitle('PROFESSIONAL SUMMARY'));
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
    sections.push(createMinimalSectionTitle('PROFESSIONAL EXPERIENCE'));

    resume.professionalExperience.forEach((exp) => {
      // Job title and organization
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: exp.role,
              bold: true,
              size: 24,
              color: '333333',
            }),
            new TextRun({
              text: ` at ${exp.organization}`,
              size: 24,
              color: '333333',
            }),
          ],
          spacing: { after: 40 },
        })
      );

      // Duration and location
      const durationParts = [`${exp.startDate} - ${exp.endDate}`];
      if (exp.location) {
        durationParts.push(exp.location);
      }

      sections.push(
        new Paragraph({
          text: durationParts.join(' | '),
          spacing: { after: 60 },
          run: {
            size: 22,
            color: '666666',
            font: 'Segoe UI',
          },
        })
      );

      // Responsibilities
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
    sections.push(createMinimalSectionTitle('EDUCATION'));

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
          spacing: { after: 40 },
        })
      );

      sections.push(
        new Paragraph({
          text: `${edu.institution} | ${edu.startDate} - ${edu.endDate}`,
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
    sections.push(createMinimalSectionTitle('SKILLS'));

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
    sections.push(createMinimalSectionTitle('CERTIFICATIONS'));

    resume.certifications.forEach((cert) => {
      sections.push(
        new Paragraph({
          text: `${cert.name} - ${cert.issuer} (${cert.year})`,
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
    sections.push(createMinimalSectionTitle('PROJECTS'));

    resume.projects.forEach((proj) => {
      sections.push(
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
            text: `Technologies: ${proj.technologies}`,
            spacing: { after: 120 },
            run: {
              size: 24,
              color: '666666',
              font: 'Segoe UI',
              italics: true,
            },
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
    sections.push(createMinimalSectionTitle('AWARDS'));

    resume.awards.forEach((award) => {
      sections.push(
        new Paragraph({
          text: `${award.title} - ${award.organization} (${award.year})`,
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
 * Helper function to create minimal section titles
 */
function createMinimalSectionTitle(title: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 28, // 14pt
        color: '333333',
      }),
    ],
    spacing: { before: 240, after: 160 },
  });
}
