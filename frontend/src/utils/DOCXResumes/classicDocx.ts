import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
  TabStopPosition,
} from 'docx';
import { getSectionOrder, type SectionId } from '@/utils/sectionOrder';

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
  startDate: string;
  endDate: string;
};

export type Project = {
  name: string;
  description: string;
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

export type Skill = {
  category: string;
  skills: string[];
};

export type ResumeData = {
  personalInformation: PersonalInformation;
  summary: string;
  professionalExperience: ProfessionalExperience[];
  education: Education[];
  projects: Project[];
  skills: Skill[];
  certifications: Certification[];
  awards: Award[];
  sectionOrder?: string[];
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

  const experienceParagraphs: Paragraph[] = [];
  // Professional Experience
  if (resume.professionalExperience.length > 0) {
    experienceParagraphs.push(createSectionTitle('PROFESSIONAL EXPERIENCE'));

    resume.professionalExperience.forEach((exp) => {
      // Job header with role, organization, location
      const jobTitleText = `${exp.role} | ${exp.organization}${
        exp.location ? `, ${exp.location}` : ''
      }`;

      experienceParagraphs.push(
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
        experienceParagraphs.push(
          new Paragraph({
            text: resp,
            bullet: { level: 0 },
            spacing: { after: 40 },
            style: 'contentText',
          })
        );
      });

      experienceParagraphs.push(
        new Paragraph({
          text: '',
          spacing: { after: 120 },
        })
      );
    });
  }

  const educationParagraphs: Paragraph[] = [];
  // Education
  if (resume.education.length > 0) {
    educationParagraphs.push(createSectionTitle('EDUCATION'));

    resume.education.forEach((edu) => {
      educationParagraphs.push(
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

      educationParagraphs.push(
        new Paragraph({
          text: edu.institution,
          spacing: { after: 40 },
          style: 'contentText',
        })
      );

      educationParagraphs.push(
        new Paragraph({
          text: `${edu.startDate} - ${edu.endDate}`,
          spacing: { after: 120 },
          style: 'contentText',
        })
      );
    });
  }

  const skillsParagraphs: Paragraph[] = [];
  // Skills
  if (resume.skills.length > 0) {
    skillsParagraphs.push(createSectionTitle('SKILLS'));

    // Add categorized skills
    resume.skills.forEach((skillCategory) => {
      const categoryText = `${skillCategory.category}: `;
      const skillsText = skillCategory.skills.join(', ');
      
      skillsParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: categoryText,
              bold: true,
              size: 24,
              color: '2c3e50',
            }),
            new TextRun({
              text: skillsText,
              size: 24,
              color: '333333',
            }),
          ],
          spacing: { after: 120 },
        })
      );
    });
  }

  const projectsParagraphs: Paragraph[] = [];
  // Projects
  if (resume.projects.length > 0) {
    projectsParagraphs.push(createSectionTitle('PROJECTS'));

    resume.projects.forEach((proj) => {
      projectsParagraphs.push(
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

      projectsParagraphs.push(
        new Paragraph({
          text: proj.description,
          spacing: { after: 120 },
          style: 'contentText',
        })
      );
    });
  }

  const certificationsParagraphs: Paragraph[] = [];
  // Certifications
  if (resume.certifications.length > 0) {
    certificationsParagraphs.push(createSectionTitle('CERTIFICATIONS'));

    resume.certifications.forEach((cert) => {
      certificationsParagraphs.push(
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

      certificationsParagraphs.push(
        new Paragraph({
          text: `${cert.issuer} - ${cert.year}`,
          spacing: { after: 120 },
          style: 'contentText',
        })
      );
    });
  }

  const awardsParagraphs: Paragraph[] = [];
  // Awards
  if (resume.awards.length > 0) {
    awardsParagraphs.push(createSectionTitle('AWARDS'));

    resume.awards.forEach((award) => {
      awardsParagraphs.push(
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

  // Movable sections go in the user's chosen order (contact and summary above stay first).
  const sectionParagraphs: Record<SectionId, Paragraph[]> = {
    experience: experienceParagraphs,
    education: educationParagraphs,
    skills: skillsParagraphs,
    projects: projectsParagraphs,
    certifications: certificationsParagraphs,
    awards: awardsParagraphs,
  };
  getSectionOrder(resume.sectionOrder, 'classic').forEach((id) => {
    sections.push(...sectionParagraphs[id]);
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
