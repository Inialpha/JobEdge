import { Fragment, type ReactNode } from "react"
import { ResumeData } from "@/types/resume"
import { parseSkillsArray } from "@/utils/resumeUtils"
import { getSectionOrder, MODERN_SIDEBAR_SECTIONS, type SectionId } from "@/utils/sectionOrder"

interface ModernTemplateProps {
  resume: ResumeData
}

export const ModernTemplate = ({ resume }: ModernTemplateProps) => {
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
        <div className="resume-section-title">Education</div>
        <div className="">
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
        <div className="resume-section-title">Skills</div>
        <div className="">
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
              <div><strong>{escapeHtml(proj?.name || '')}</strong></div>
              <div className="no-break">{escapeHtml(proj?.description || '')}</div>
            </div>
          ))}
        </div>
      </>
      ),
    certifications: () =>
      resume?.certifications?.length > 0 && (
      <>
        <div className="resume-section-title no-break">Certifications</div>
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

  // Two columns: Skills and Education live in the sidebar, everything else in the main column.
  // The saved order applies within each column.
  const order = getSectionOrder(resume?.sectionOrder, 'modern')
  const sidebarSections = order.filter(id => MODERN_SIDEBAR_SECTIONS.includes(id))
  const mainSections = order.filter(id => !MODERN_SIDEBAR_SECTIONS.includes(id))

  return (
    <div style={{display: 'grid', gridTemplateColumns: '40% 60%', gap: '3px'}}>
      <div className="sidebar">
        <div className="resume-name">{escapeHtml(resume?.personalInformation?.name || '')}</div>
        {resume?.personalInformation?.profession && (
          <div className="resume-title">{escapeHtml(resume.personalInformation.profession)}</div>
        )}
        <div className="resume-contact">
          {escapeHtml(resume?.personalInformation?.email || '')}<br/>
          {resume?.personalInformation?.phone && <>{escapeHtml(resume.personalInformation.phone)}<br/></>}
          {resume?.personalInformation?.linkedin && <>{escapeHtml(resume.personalInformation.linkedin)}<br/></>}
          {resume?.personalInformation?.website && <>{escapeHtml(resume.personalInformation.website)}<br/></>}
          {resume?.personalInformation?.twitter && <>{escapeHtml(resume.personalInformation.twitter)}<br/></>}
          {resume?.personalInformation?.address && <>{escapeHtml(resume.personalInformation.address)}</>}
        </div>
        {sidebarSections.map(id => (
          <Fragment key={id}>{sections[id]()}</Fragment>
        ))}
      </div>
      <div className="main-content">
        {resume?.summary && (
          <>
            <div className="resume-section-title">Professional Summary</div>
            <div className="resume-content">{escapeHtml(resume.summary)}</div>
          </>
        )}
        {mainSections.map(id => (
          <Fragment key={id}>{sections[id]()}</Fragment>
        ))}
      </div>
    </div>
  )
}
