import { Fragment, type ReactNode } from "react"
import { ResumeData } from "@/types/resume"
import { parseSkillsArray } from "@/utils/resumeUtils"
import { getSectionOrder, type SectionId } from "@/utils/sectionOrder"

interface ClassicTemplateProps {
  resume: ResumeData
}

export const ClassicTemplate = ({ resume }: ClassicTemplateProps) => {
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  const skills = parseSkillsArray(resume?.skills)

  const sections: Record<SectionId, () => ReactNode> = {
    experience: () =>
      resume?.professionalExperience?.length > 0 && (
        <>
          <div className="resume-section-title no-break">PROFESSIONAL EXPERIENCE</div>
          <div className="resume-content">
            {resume.professionalExperience.map((exp, index) => (
              <div key={index}>
                <div className="job-header">
                  <span className="job-title">
                    {escapeHtml(exp?.role || '')} | {escapeHtml(exp?.organization || '')}
                    {exp?.location && `, ${escapeHtml(exp.location)}`}
                  </span>
                  <span className="job-duration">
                    {escapeHtml(exp?.startDate || '')} - {escapeHtml(exp?.endDate || '')}
                  </span>
                </div>
                <ul>
                  {exp?.responsibilities?.map((resp, idx) => (
                    <li key={idx}>{escapeHtml(resp)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      ),
    education: () =>
      resume?.education?.length > 0 && (
        <>
          <div className="resume-section-title no-break">Education</div>
          <div className="resume-content">
            {resume.education.map((edu, index) => (
              <div key={index} style={{ marginBottom: '10px' }}>
                <div><strong>{escapeHtml(edu?.degree || '')}</strong></div>
                <div>{escapeHtml(edu?.institution || '')}</div>
                <div>{escapeHtml(edu?.startDate || '')} - {escapeHtml(edu?.endDate || '')}</div>
              </div>
            ))}
          </div>
        </>
      ),
    skills: () =>
      skills.length > 0 && (
        <>
          <div className="resume-section-title no-break">Skills</div>
          <div className="resume-content">
            {skills.map((skillCategory, index) => (
              <div key={index} style={{ marginBottom: '5px' }}>
                <strong>{escapeHtml(skillCategory.category)}:</strong> {skillCategory.skills.map(skill => escapeHtml(skill)).join(', ')}
              </div>
            ))}
          </div>
        </>
      ),
    projects: () =>
      resume?.projects?.length > 0 && (
        <>
          <div className="resume-section-title no-break">Projects</div>
          <div className="resume-content">
            {resume.projects.map((proj, index) => (
              <div key={index} style={{ marginBottom: '10px' }}>
                <div className="no-break" ><div><strong className="no-break">{escapeHtml(proj?.name || '')}</strong></div></div>
                <div className="no-break" >{escapeHtml(proj?.description || '')}</div>
              </div>
            ))}
          </div>
        </>
      ),
    certifications: () =>
      resume?.certifications?.length > 0 && (
        <>
          <div className="resume-section-title">Certifications</div>
          <div className="resume-content">
            {resume.certifications.map((cert, index) => (
              <div key={index}>
                <div><strong>{escapeHtml(cert?.name || '')}</strong></div>
                <div>{escapeHtml(cert?.issuer || '')} - {escapeHtml(cert?.year || '')}</div>
              </div>
            ))}
          </div>
        </>
      ),
    awards: () =>
      resume?.awards?.length > 0 && (
        <>
          <div className="resume-section-title no-break">Awards</div>
          <div className="resume-content">
            {resume.awards.map((award, index) => (
              <div key={index}>
                <strong>{escapeHtml(award?.title || '')}</strong> - {escapeHtml(award?.organization || '')} ({escapeHtml(award?.year || '')})
              </div>
            ))}
          </div>
        </>
      ),
  }

  return (
    <>
      <div className="resume-name">{escapeHtml(resume?.personalInformation?.name || '')}</div>
      {resume?.personalInformation?.profession && (
        <div className="resume-title">{escapeHtml(resume.personalInformation.profession)}</div>
      )}
      <div className="resume-contact">
        {escapeHtml(resume?.personalInformation?.email || '')}
        {resume?.personalInformation?.phone && ` | ${escapeHtml(resume.personalInformation.phone)}`}
        {resume?.personalInformation?.linkedin && ` | ${escapeHtml(resume.personalInformation.linkedin)}`}
        {resume?.personalInformation?.website && ` | ${escapeHtml(resume.personalInformation.website)}`}
        {resume?.personalInformation?.twitter && ` | ${escapeHtml(resume.personalInformation.twitter)}`}
        {resume?.personalInformation?.address && ` | ${escapeHtml(resume.personalInformation.address)}`}
      </div>
      {resume?.summary && (
        <>
          <div className="resume-section-title">Professional Summary</div>
          <div className="resume-content">{escapeHtml(resume.summary)}</div>
        </>
      )}
      {getSectionOrder(resume?.sectionOrder, 'classic').map(id => (
        <Fragment key={id}>{sections[id]()}</Fragment>
      ))}
    </>
  )
}
