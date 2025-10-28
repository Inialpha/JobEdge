import { ResumeData } from "@/types/resume"

/**
 * Parses skills from string or array format into a string array
 * This function provides backward compatibility for old data that may have skills as a string
 * @param skills - Skills in array format or legacy string format (separated by ' • ')
 * @returns Array of skill strings
 */
export const parseSkillsArray = (skills: string | string[] | unknown): string[] => {
  if (typeof skills === 'string') {
    // Legacy format: parse string separated by ' • '
    return skills.split(' • ').filter((s: string) => s.trim())
  }
  if (Array.isArray(skills)) {
    return skills.filter((s: string) => s && typeof s === 'string' && s.trim())
  }
  return []
}

/**
 * Converts a resume object from location state to ResumeData format
 * If resume is null/undefined, returns empty resume data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getEditableResume = (resume: any): ResumeData => {
  if (!resume) {
    return {
      personalInformation: {
        name: "",
        email: "",
        linkedin: "",
        twitter: "",
        phone: "",
        website: "",
        address: "",
      },
      summary: "",
      professionalExperience: [],
      education: [],
      projects: [],
      skills: [],
      certifications: [],
      awards: [],
    }
  }


  return {
    personalInformation: resume.personal_information,
    summary: resume.summary || "",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    professionalExperience: (resume.professional_experiences || []).map((exp: any) => ({
      organization: exp.organization || "",
      role: exp.role || "",
      startDate: exp.startDate || exp.start_date || "",
      endDate: exp.endDate || exp.end_date || "",
      location: exp.location || "",
      responsibilities: exp.responsibilities || [],
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    education: (resume.educations || resume.education || []).map((edu: any) => ({
      institution: edu.institution || "",
      degree: edu.degree || edu.certificate || "",
      field: edu.field || "",
      startDate: edu.startDate || edu.start_date || "",
      endDate: edu.endDate || edu.end_date || edu.graduationDate || "",
      gpa: edu.gpa || "",
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    projects: (resume.projects || []).map((proj: any) => ({
      name: proj.name || "",
      description: proj.description || "",
      technologies: proj.technologies || "",
      link: proj.link || "",
    })),
    skills: resume.skills,
    certifications: resume.certifications || [],
    awards: resume.awards || [],
  }
}
