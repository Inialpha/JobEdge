import { ResumeData, Template } from "@/types/resume"
import { ClassicTemplate, ModernTemplate, MinimalTemplate, CreativeTemplate } from "./resume-templates"

interface ResumePreviewProps {
  resume: ResumeData
  template: Template
}

export const ResumePreview = ({ resume, template }: ResumePreviewProps) => {
  const renderTemplate = () => {
    switch (template) {
      case 'modern':
        return <ModernTemplate resume={resume} />
      case 'minimal':
        return <MinimalTemplate resume={resume} />
      case 'creative':
        return <CreativeTemplate resume={resume} />
      default:
        return <ClassicTemplate resume={resume} />
    }
  }

  return (
    <div className={`resume-preview ${template}-template`}>
      {renderTemplate()}
    </div>
  )
}
