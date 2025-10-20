import { ResumeData } from "@/types/resume"

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
      skills: "",
      certifications: [],
      awards: [],
    }
  }

  return {
    personalInformation: {
      name: resume.name || "",
      profession: resume.profession || "",
      email: resume.email || "",
      linkedin: resume.linkedin || "",
      twitter: resume.twitter || "",
      phone: resume.phone_number || resume.phone || "",
      website: resume.website || "",
      address: resume.address || "",
    },
    summary: resume.summary || "",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    professionalExperience: (resume.professional_experiences || resume.professionalExperience || []).map((exp: any) => ({
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
    skills: resume.skills || [],
    certifications: resume.certifications || [],
    awards: resume.awards || [],
  }
}
