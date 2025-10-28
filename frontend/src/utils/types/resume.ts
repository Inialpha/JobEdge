export type ContactInfo = {
    firstName: string
    lastName: string
    email: string
    linkedin: string
    twitter: string
    phone: string
    website: string
    country: string
    city: string
}

export type WorkExperience = {
    organization: string
    role: string
    startDate: string
    endDate: string
    location: string
    responsibilities: string[]
}

export type Education = {
  institution: string;
  degree: string;
  field: string;
  graduationDate: string;
  gpa: string;
}

export type Project = {
  name: string;
  description: string;
  technologies: string;
  link: string;
}

export type ResumeSection = {
  title: string;
  content: string | ContactInfo | WorkExperience[] | Education[] | Project[];
}
