import { ResumeData, Template } from "@/types/resume"
import { ClassicTemplate, ModernTemplate, MinimalTemplate, CreativeTemplate } from "./resume-templates"
import { createRoot } from 'react-dom/client'

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

// Function to update preview imperatively (for backward compatibility)
export const updatePreviewElement = (elementId: string, resume: ResumeData, template: Template) => {
  const element = document.getElementById(elementId)
  if (!element) return

  element.className = `resume-preview ${template}-template`
  
  const root = createRoot(element)
  root.render(<ResumePreview resume={resume} template={template} />)
}
