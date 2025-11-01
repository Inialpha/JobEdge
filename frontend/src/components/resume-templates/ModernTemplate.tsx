import { ResumeData } from "@/types/resume"
import { parseSkillsArray } from "@/utils/resumeUtils"

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
        {skills.length > 0 && (
          <>
            <div className="resume-section-title">Skills</div>
            <div className="">
              {skills.map((skill, index) => (
                <div key={index} className="skill-tag">{escapeHtml(skill)} {index < skills.length - 1 && (" • ")}</div>
              ))}
            </div>
          </>
        )}
        {resume.education.length > 0 && (
          <>
            <div className="resume-section-title">Education</div>
            <div className="">
              {resume?.education?.map((edu, index) => (
                <div key={index} style={{ marginBottom: '10px' }}>
                  <div><strong>{escapeHtml(edu?.degree || '')}</strong></div>
                  <div>{escapeHtml(edu?.institution || '')}</div>
                  <div>{escapeHtml(edu?.startDate || '')} - {escapeHtml(edu?.endDate || '')}</div>
                  {edu?.gpa && <div>GPA: {escapeHtml(edu.gpa)}</div>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="main-content">
        {resume?.summary && (
          <>
            <div className="resume-section-title">Professional Summary</div>
            <div className="resume-content">{escapeHtml(resume.summary)}</div>
          </>
        )}
        {resume?.professionalExperience?.length > 0 && (
          <>
            <div className="resume-section-title">PROFESSIONAL EXPERIENCE</div>
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
        )}
        {resume?.certifications?.length > 0 && (
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
        )}
        {resume?.projects?.length > 0 && (
          <>
            <div className="resume-section-title">Projects</div>
            <div className="resume-content">
              {resume.projects.map((proj, index) => (
                <div key={index} style={{ marginBottom: '10px' }}>
                  <div><strong>{escapeHtml(proj?.name || '')}</strong></div>
                  <div>{escapeHtml(proj?.description || '')}</div>
                  <div><em>{escapeHtml(proj?.technologies || '')}</em></div>
                </div>
              ))}
            </div>
          </>
        )}
        {resume?.awards?.length > 0 && (
          <>
            <div className="resume-section-title">Awards</div>
            <div className="resume-content">
              {resume.awards.map((award, index) => (
                <div key={index}>
                  <strong>{escapeHtml(award?.title || '')}</strong> - {escapeHtml(award?.organization || '')} ({escapeHtml(award?.year || '')})
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
