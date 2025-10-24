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

  // Parse personal_information if it exists (new format)
  const personalInfo = {
    name: resume.name || "",
    profession: resume.profession || "",
    email: resume.email || "",
    linkedin: resume.linkedin || "",
    twitter: resume.twitter || "",
    phone: resume.phone_number || resume.phone || "",
    website: resume.website || "",
    address: resume.address || "",
  }

  // If personal_information array exists, parse it
  if (resume.personal_information && Array.isArray(resume.personal_information)) {
    // Check if it's the new format (array of dictionaries with 'field' and 'value')
    if (resume.personal_information.length > 0 && 
        typeof resume.personal_information[0] === 'object' && 
        'field' in resume.personal_information[0]) {
      // New format: array of {field, value} dictionaries
      resume.personal_information.forEach((item: {field: string, value: string}) => {
        const field = item.field.toLowerCase()
        const value = item.value || ""
        
        if (field === 'name' && !personalInfo.name) {
          personalInfo.name = value
        } else if (field === 'email' && !personalInfo.email) {
          personalInfo.email = value
        } else if (field === 'phone' && !personalInfo.phone) {
          personalInfo.phone = value
        } else if (field === 'address' && !personalInfo.address) {
          personalInfo.address = value
        } else if (field === 'linkedin' && !personalInfo.linkedin) {
          personalInfo.linkedin = value
        } else if (field === 'website' && !personalInfo.website) {
          personalInfo.website = value
        }
      })
    } else {
      // Old format: array of strings, parse them
      resume.personal_information.forEach((item: string) => {
        const lowerItem = item.toLowerCase()
        // Check for email
        if (item.includes('@') && !personalInfo.email) {
          personalInfo.email = item
        }
        // Check for phone (starts with + or contains digits with dashes/parentheses)
        else if ((item.startsWith('+') || /\d{3}[-.)]\d/.test(item)) && !personalInfo.phone) {
          personalInfo.phone = item
        }
        // Check for LinkedIn
        else if (!personalInfo.linkedin) {
          try {
            const url = new URL(item)
            if (url.hostname === 'linkedin.com' || url.hostname === 'www.linkedin.com' || url.hostname.endsWith('.linkedin.com')) {
              personalInfo.linkedin = item
            }
          } catch {
            // Not a valid URL, skip
          }
        }
        // Check for website (http/https but not linkedin)
        else if (!personalInfo.website && (item.startsWith('http://') || item.startsWith('https://'))) {
          try {
            const url = new URL(item)
            if (url.hostname !== 'linkedin.com' && url.hostname !== 'www.linkedin.com' && !url.hostname.endsWith('.linkedin.com')) {
              personalInfo.website = item
            }
          } catch {
            // Not a valid URL, skip
          }
        }
        // Check if it looks like an address (contains comma and street indicators)
        else if ((item.includes(',') || lowerItem.includes('street') || lowerItem.includes('st,') || lowerItem.includes('ave') || lowerItem.includes('road')) && !personalInfo.address) {
          personalInfo.address = item
        }
        // Otherwise, if name is empty, assume it's the name
        else if (!personalInfo.name) {
          personalInfo.name = item
        }
      })
    }
  }

  return {
    personalInformation: personalInfo,
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
