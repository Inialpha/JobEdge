import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { generatePDF, Preview } from "@/components/pdfGenerator"
import { PreviewModal } from "@/components/preview-modal"
import { useLocation } from 'react-router-dom';

type ContactInfo = {
  name: string
  email: string
  linkedin: string
  twitter: string
  phone: string
  website: string
  address: string
}

type WorkExperience = {
  organization: string
  role: string
  startDate: string
  endDate: string
  location: string
  responsibilities: string[]
}

type Education = {
  institution: string
  degree: string
  field: string
  graduationDate: string
  gpa: string
}

type Project = {
  name: string
  description: string
  technologies: string
  link: string
}

type ResumeSection = {
  title: string
  content: string | ContactInfo | WorkExperience[] | Education[] | Project[] | string[]
}

export const getEditableResume = (resume: any) => {
  return {
    contact: {
      title: "Contact",
      content: {
        name: resume.name || "",
        email: resume.email || "",
        linkedin: resume.linkedin || "",
        twitter: resume.twitter || "",
        phone: resume.phone_number || "",
        website: resume.website || "",
        address: resume.address || "",
      },
    },
    summary: {
      title: "Professional Summary",
      content: resume.summary || "",
    },
    experience: {
      title: "Work Experience",
      content: resume.professional_experiences || [],
    },
    education: {
      title: "Education",
      content: resume.educations || [],
    },
    projects: {
      title: "Projects",
      content: resume.projects || [],
    },
    skills: {
      title: "Skills",
      content: resume.skills || [],
    },
  }
}


export default function AccordionResume() {
  const location = useLocation()
  const generatedResume = location.state.resume;
  console.log("resume", generatedResume)
  const [resume, setResume] = useState<Record<string, ResumeSection>>({
    contact: {
      title: "Contact",
      content: {
        name: generatedResume.name || "",
        email: generatedResume.email || "",
        linkedin: generatedResume.linkedin || "",
        twitter: generatedResume.twitter || "",
        phone: generatedResume.phone_number || "",
        website: generatedResume.website || "",
        address: generatedResume.address || "",
      },
    },
    summary: {
      title: "Professional Summary",
      content: generatedResume.summary || "",
    },
    experience: {
      title: "Work Experience",
      content: generatedResume.professional_experiences || [],
    },
    education: {
      title: "Education",
      content: generatedResume.educations || [],
    },
    projects: {
      title: "Projects",
      content: generatedResume.projects || [],
    },
    skills: {
      title: "Skills",
      content: generatedResume.skills || [],
    },
  })

  const [editMode, setEditMode] = useState<Record<string, boolean>>({})
  const [newExperience, setNewExperience] = useState<WorkExperience>({
    organization: "",
    role: "",
    startDate: "",
    endDate: "",
    location: "",
    responsibilities: [""],
  })
  const [newEducation, setNewEducation] = useState<Education>({
    institution: "",
    degree: "",
    field: "",
    graduationDate: "",
    gpa: "",
  })
  const [newProject, setNewProject] = useState<Project>({
    name: "",
    description: "",
    technologies: "",
    link: "",
  })
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const handleChange = useCallback((section: string, field: string, value: string | string[]) => {
    setResume((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        content: typeof prev[section].content === "string" ? value : { ...prev[section].content, [field]: value },
      },
    }))
  }, [])

  const addItem = useCallback((section: string, item: WorkExperience | Education | Project) => {
    setResume((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        content: [...(prev[section].content as any[]), item],
      },
    }))
  }, [])

  const toggleEditMode = useCallback((section: string) => {
    setEditMode((prev) => ({ ...prev, [section]: !prev[section] }))
  }, [])

  const renderContactForm = useCallback(() => {
    const content = resume.contact.content as ContactInfo
    return Object.entries(content).map(([key, value]) => (
      <div key={key} className="mb-4">
        <Label htmlFor={`contact-${key}`} className="capitalize">
          {key.replace(/([A-Z])/g, " $1").trim()}
        </Label>
        <Input id={`contact-${key}`} value={value} onChange={(e) => handleChange("contact", key, e.target.value)} />
      </div>
    ))
  }, [resume.contact.content, handleChange])

  const renderWorkExperienceForm = useCallback(() => {
    const handleExperienceChange = (field: keyof WorkExperience, value: string) => {
      setNewExperience((prev) => ({ ...prev, [field]: value }))
    }

    const addResponsibility = () => {
      setNewExperience((prev) => ({ ...prev, responsibilities: [...prev.responsibilities, ""] }))
    }

    const handleResponsibilityChange = (index: number, value: string) => {
      setNewExperience((prev) => ({
        ...prev,
        responsibilities: prev.responsibilities.map((r, i) => (i === index ? value : r)),
      }))
    }

    return (
      <div>
        <Input
          placeholder="Organization"
          value={newExperience.organization}
          onChange={(e) => handleExperienceChange("organization", e.target.value)}
          className="mb-2"
        />
        <Input
          placeholder="Role"
          value={newExperience.role}
          onChange={(e) => handleExperienceChange("role", e.target.value)}
          className="mb-2"
        />
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Start Date"
            value={newExperience.startDate}
            onChange={(e) => handleExperienceChange("startDate", e.target.value)}
          />
          <Input
            placeholder="End Date"
            value={newExperience.endDate}
            onChange={(e) => handleExperienceChange("endDate", e.target.value)}
          />
        </div>
        <Input
          placeholder="Location"
          value={newExperience.location}
          onChange={(e) => handleExperienceChange("location", e.target.value)}
          className="mb-2"
        />
        {newExperience.responsibilities.map((resp, index) => (
          <Input
            key={index}
            placeholder={`Responsibility ${index + 1}`}
            value={resp}
            onChange={(e) => handleResponsibilityChange(index, e.target.value)}
            className="mb-2"
          />
        ))}
        <Button onClick={addResponsibility} className="mb-2">
          Add Responsibility
        </Button>
        <Button
          onClick={() => {
            addItem("experience", newExperience)
            setNewExperience({
              organization: "",
              role: "",
              startDate: "",
              endDate: "",
              location: "",
              responsibilities: [""],
            })
          }}
        >
          Add Experience
        </Button>
      </div>
    )
  }, [newExperience, addItem])

  const renderEducationForm = useCallback(() => {
    const handleEducationChange = (field: keyof Education, value: string) => {
      setNewEducation((prev) => ({ ...prev, [field]: value }))
    }

    return (
      <div>
        <Input
          placeholder="Institution"
          value={newEducation.institution}
          onChange={(e) => handleEducationChange("institution", e.target.value)}
          className="mb-2"
        />
        <Input
          placeholder="Degree"
          value={newEducation.degree}
          onChange={(e) => handleEducationChange("degree", e.target.value)}
          className="mb-2"
        />
        <Input
          placeholder="Field of Study"
          value={newEducation.field}
          onChange={(e) => handleEducationChange("field", e.target.value)}
          className="mb-2"
        />
        <Input
          placeholder="Graduation Date"
          value={newEducation.graduationDate}
          onChange={(e) => handleEducationChange("graduationDate", e.target.value)}
          className="mb-2"
        />
        <Input
          placeholder="GPA"
          value={newEducation.gpa}
          onChange={(e) => handleEducationChange("gpa", e.target.value)}
          className="mb-2"
        />
        <Button
          onClick={() => {
            addItem("education", newEducation)
            setNewEducation({ institution: "", degree: "", field: "", graduationDate: "", gpa: "" })
          }}
        >
          Add Education
        </Button>
      </div>
    )
  }, [newEducation, addItem])

  const renderProjectForm = useCallback(() => {
    const handleProjectChange = (field: keyof Project, value: string) => {
      setNewProject((prev) => ({ ...prev, [field]: value }))
    }

    return (
      <div>
        <Input
          placeholder="Project Name"
          value={newProject.name}
          onChange={(e) => handleProjectChange("name", e.target.value)}
          className="mb-2"
        />
        <Textarea
          placeholder="Project Description"
          value={newProject.description}
          onChange={(e) => handleProjectChange("description", e.target.value)}
          className="mb-2"
        />
        <Input
          placeholder="Technologies Used"
          value={newProject.technologies}
          onChange={(e) => handleProjectChange("technologies", e.target.value)}
          className="mb-2"
        />
        <Input
          placeholder="Project Link"
          value={newProject.link}
          onChange={(e) => handleProjectChange("link", e.target.value)}
          className="mb-2"
        />
        <Button
          onClick={() => {
            addItem("projects", newProject)
            setNewProject({ name: "", description: "", technologies: "", link: "" })
          }}
        >
          Add Project
        </Button>
      </div>
    )
  }, [newProject, addItem])

  const renderContent = useCallback(
    (section: string) => {
      const content = resume[section].content
      if (section === "skills" && Array.isArray(content)) {
        return content.length > 0 ? (
          <div>
            {content.map((item, index: number) =>

              typeof item === "string" ? <p key={index}>{item}</p> : null
            )}
          </div>
        ) : (
          <p>No skills</p>
        )
      }
      if (typeof content === "string") {
        return content || <Button onClick={() => toggleEditMode(section)}>Add {resume[section].title}</Button>
      }
      if (Array.isArray(content)) {
        return content.length > 0 ? (
          <div>
            {content.map((item, index) => (
              <div key={index} className="mb-4">
                {Object.entries(item).map(([key, value]) => (
                  <p key={key} className="mb-1">
                    <span className="font-semibold capitalize">{key.replace(/([A-Z])/g, " $1").trim()}:</span>
                    {Array.isArray(value) ? (
                      <ul className="list-disc list-inside">
                        {value.map((v, i) => (
                          <li key={i}>{v}</li>
                        ))}
                      </ul>
                    ) : (
                      ` ${value}`
                    )}
                  </p>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <Button onClick={() => toggleEditMode(section)}>Add {resume[section].title}</Button>
        )
      }
      return Object.entries(content as ContactInfo).map(([key, value]) => (
        <p key={key} className="mb-1">
          <span className="font-semibold capitalize">{key.replace(/([A-Z])/g, " $1").trim()}:</span>{" "}
          {value || "Not provided"}
        </p>
      ))
    },
    [resume, toggleEditMode],
  )

  return (
   <div className="p-6">
    <div className="flex mb-4 justify-end">
      <Preview resume={resume}/>
    </div>
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Resume</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {Object.entries(resume).map(([key, section]) => (
            <AccordionItem value={key} key={key}>
              <AccordionTrigger>{section.title}</AccordionTrigger>
              <AccordionContent>
                {editMode[key] ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      toggleEditMode(key)
                    }}
                  >
                    {key === "contact" && renderContactForm()}
                    {key === "experience" && renderWorkExperienceForm()}
                    {key === "education" && renderEducationForm()}
                    {key === "projects" && renderProjectForm()}
                    {(key === "summary" || key === "skills") && (
                      <Textarea
                        value={resume[key].content as string}
                        onChange={(e) => handleChange(key, key, e.target.value)}
                        className="mb-2"
                      />
                    )}
                    <Button type="submit">Save</Button>
                  </form>
                ) : (
                  <div>
                    {renderContent(key)}
                    <Button onClick={() => toggleEditMode(key)} className="mt-2">
                      Edit
                    </Button>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={() => setIsPreviewOpen(true)}>Preview</Button>
        <Button onClick={() => generatePDF(resume)}>Download as PDF</Button>
      </CardFooter>
      <PreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} resume={resume} />
    </Card>
   </div>
  )
}

