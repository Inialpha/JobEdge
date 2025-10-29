import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  UnderlineType,
  BorderStyle,
  convertInchesToTwip,
  HeadingLevel,
  TabStopPosition,
} from 'docx';

// Types
export type PersonalInformation = {
  name: string;
  profession?: string;
  email: string;
  linkedin: string;
  twitter: string;
  phone: string;
  website: string;
  address: string;
};

export type ProfessionalExperience = {
  organization: string;
  role: string;
  startDate: string;
  endDate: string;
  location: string;
  responsibilities: string[];
};

export type Education = {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa: string;
};

export type Project = {
  name: string;
  description: string;
  technologies: string;
  link: string;
};

export type Certification = {
  name: string;
  issuer: string;
  year: string;
};

export type Award = {
  title: string;
  organization: string;
  year: string;
};

export type ResumeData = {
  personalInformation: PersonalInformation;
  summary: string;
  professionalExperience: ProfessionalExperience[];
  education: Education[];
  projects: Project[];
  skills: string[];
  certifications: Certification[];
  awards: Award[];
};

/**
 * Creates a DOCX document for the Classic Template
 */
export function generateClassicDocx(resume: ResumeData): Document {
  const sections: Paragraph[] = [];

  // Name (32px = 24pt)
  sections.push(
    new Paragraph({
      text: resume.personalInformation.name,
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      style: 'resumeName',
    })
  );

  // Profession (18px = 13.5pt)
  if (resume.personalInformation.profession) {
    sections.push(
      new Paragraph({
        text: resume.personalInformation.profession,
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        style: 'resumeTitle',
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

  sections.push(
    new Paragraph({
      text: contactParts.join(' | '),
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      style: 'contactInfo',
    })
  );

  // Professional Summary
  if (resume.summary) {
    sections.push(createSectionTitle('PROFESSIONAL SUMMARY'));
    sections.push(
      new Paragraph({
        text: resume.summary,
        spacing: { after: 240 },
        style: 'contentText',
      })
    );
  }

  // Professional Experience
  if (resume.professionalExperience.length > 0) {
    sections.push(createSectionTitle('PROFESSIONAL EXPERIENCE'));

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
            }),
            new TextRun({
              text: `\t${exp.startDate} - ${exp.endDate}`,
              size: 22,
              color: '666666',
            }),
          ],
          spacing: { after: 60 },
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
            spacing: { after: 40 },
            style: 'contentText',
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
    sections.push(createSectionTitle('EDUCATION'));

    resume.education.forEach((edu) => {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: edu.degree,
              bold: true,
              size: 24,
            }),
          ],
          spacing: { after: 40 },
        })
      );

      sections.push(
        new Paragraph({
          text: edu.institution,
          spacing: { after: 40 },
          style: 'contentText',
        })
      );

      sections.push(
        new Paragraph({
          text: `${edu.startDate} - ${edu.endDate}`,
          spacing: { after: 40 },
          style: 'contentText',
        })
      );

      if (edu.gpa) {
        sections.push(
          new Paragraph({
            text: `GPA: ${edu.gpa}`,
            spacing: { after: 120 },
            style: 'contentText',
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

  // Skills
  if (resume.skills.length > 0) {
    sections.push(createSectionTitle('SKILLS'));

    const skillsText = resume.skills.join(' • ');
    sections.push(
      new Paragraph({
        text: skillsText,
        spacing: { after: 240 },
        style: 'contentText',
      })
    );
  }

  // Certifications
  if (resume.certifications.length > 0) {
    sections.push(createSectionTitle('CERTIFICATIONS'));

    resume.certifications.forEach((cert) => {
      sections.push(
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

      sections.push(
        new Paragraph({
          text: `${cert.issuer} - ${cert.year}`,
          spacing: { after: 120 },
          style: 'contentText',
        })
      );
    });
  }

  // Projects
  if (resume.projects.length > 0) {
    sections.push(createSectionTitle('PROJECTS'));

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
          style: 'contentText',
        })
      );

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
    });
  }

  // Awards
  if (resume.awards.length > 0) {
    sections.push(createSectionTitle('AWARDS'));

    resume.awards.forEach((award) => {
      sections.push(
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
    styles: {
      paragraphStyles: [
        {
          id: 'resumeName',
          name: 'Resume Name',
          basedOn: 'Normal',
          run: {
            size: 64, // 32pt (32px)
            bold: true,
            color: '2c3e50',
            font: 'Segoe UI',
          },
          paragraph: {
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
          },
        },
        {
          id: 'resumeTitle',
          name: 'Resume Title',
          basedOn: 'Normal',
          run: {
            size: 36, // 18pt (18px)
            color: '7f8c8d',
            font: 'Segoe UI',
          },
          paragraph: {
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
          },
        },
        {
          id: 'contactInfo',
          name: 'Contact Info',
          basedOn: 'Normal',
          run: {
            size: 24, // 12pt (12px)
            color: '555555',
            font: 'Segoe UI',
          },
          paragraph: {
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
          },
        },
        {
          id: 'contentText',
          name: 'Content Text',
          basedOn: 'Normal',
          run: {
            size: 24, // 12pt (12px)
            color: '333333',
            font: 'Segoe UI',
          },
          paragraph: {
            spacing: { line: 276 }, // 1.6 line height
          },
        },
      ],
    },
  });
}

/**
 * Helper function to create section titles
 */
function createSectionTitle(title: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: title,
        bold: true,
      }),
    ],
    spacing: { before: 240, after: 160 },
    border: {
      bottom: {
        color: '#2c3e50',
        space: 1,
        style: BorderStyle.SINGLE,
        size: 12, // 2px
      },
    },
    style: 'sectionTitle',
    run: {
      size: 32, // 16pt (16px)
      bold: true,
      color: '#2c3e50',
      font: 'Segoe UI',
    },
  });
}
