// Shared types for Resume functionality
import type { SectionId } from '@/utils/sectionOrder'

export type { SectionId }

export type PersonalInformation = {
  name: string
  profession?: string
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
  startDate: string
  endDate: string
}

export type Project = {
  name: string
  description: string
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

export type Skill = {
  category: string
  skills: string[]
}

export type ResumeData = {
  personalInformation: PersonalInformation
  summary: string
  professionalExperience: ProfessionalExperience[]
  education: Education[]
  projects: Project[]
  skills: Skill[]
  certifications: Certification[]
  awards: Award[]
  // Order of the movable sections. Contact and Summary are always first. Empty/missing = default order.
  sectionOrder?: SectionId[]
}

// Returned by the generate endpoint next to a tailored resume (see backend resume_intelligence).
export type ResumeEvaluationSummary = {
  id?: string
  overall_score: number
  passed: boolean
  scores: Record<string, number>
  matched_keywords: string[]
  missing_keywords: string[]
  gaps: string[]
  revisions: number
}

export type Template = 'classic' | 'modern' | 'minimal' | 'creative'
