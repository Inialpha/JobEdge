import { ResumeData, Skill } from "@/types/resume"

/**
 * Parses skills from string, array, or categorized format into a Skill array
 * This function provides backward compatibility for old data formats
 * @param skills - Skills in categorized format (Skill[]), legacy array format (string[]), or legacy string format
 * @returns Array of Skill objects with category and skills
 */
export const parseSkillsArray = (skills: string | string[] | Skill[] | unknown): Skill[] => {
  // If already in the new format (array of objects with category and skills)
  if (Array.isArray(skills) && skills.length > 0 && typeof skills[0] === 'object' && 'category' in skills[0]) {
    return skills as Skill[]
  }
  
  // Legacy format: array of strings
  if (Array.isArray(skills) && skills.length > 0 && typeof skills[0] === 'string') {
    return [{
      category: 'General',
      skills: skills.filter((s: string) => s && s.trim())
    }]
  }
  
  // Legacy format: string separated by ' • '
  if (typeof skills === 'string') {
    const skillsList = skills.split(' • ').filter((s: string) => s.trim())
    if (skillsList.length > 0) {
      return [{
        category: 'General',
        skills: skillsList
      }]
    }
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
      startDate: edu.startDate || edu.start_date || "",
      endDate: edu.endDate || edu.end_date || edu.graduationDate || "",
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    projects: (resume.projects || []).map((proj: any) => ({
      name: proj.name || "",
      description: proj.description || "",
    })),
    skills: parseSkillsArray(resume.skills),
    certifications: resume.certifications || [],
    awards: resume.awards || [],
  }
}
