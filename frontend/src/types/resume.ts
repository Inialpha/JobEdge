// Shared types for Resume functionality

export type PersonalInformation = {
  name: string
  email: string
  linkedin: string
  twitter: string
  phone: string
  website: string
  address: string
}

export type ProfessionalExperience = {
  organization: string
  role: string
  startDate: string
  endDate: string
  location: string
  responsibilities: string[]
}

export type Education = {
  institution: string
  degree: string
  field: string
  startDate: string
  endDate: string
  gpa: string
}

export type Project = {
  name: string
  description: string
  technologies: string
  link: string
}

export type Certification = {
  name: string
  issuer: string
  year: string
}

export type Award = {
  title: string
  organization: string
  year: string
}

export type ResumeData = {
  personalInformation: PersonalInformation
  summary: string
  professionalExperience: ProfessionalExperience[]
  education: Education[]
  projects: Project[]
  skills: string
  certifications: Certification[]
  awards: Award[]
}

export type Template = 'classic' | 'modern' | 'minimal' | 'creative'
