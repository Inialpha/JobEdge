import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

type PreviewModalProps = {
  isOpen: boolean
  onClose: () => void
  resume: any
}

export function PreviewModal({ isOpen, onClose, resume }: PreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Resume Preview</DialogTitle>
          <DialogDescription>This is how your resume will look when downloaded.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-full max-h-[calc(80vh-100px)] pr-4">
          <div className="space-y-6">
            <section>
              <h2 className="text-2xl font-bold">
                {resume.contact.content.firstName} {resume.contact.content.lastName}
              </h2>
              <p>
                {resume.contact.content.email} | {resume.contact.content.phone}
              </p>
              <p>
                {resume.contact.content.city}, {resume.contact.content.country}
              </p>
              <p>
                {resume.contact.content.linkedin} | {resume.contact.content.website}
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold">Professional Summary</h3>
              <p>{resume.summary.content}</p>
            </section>

            <section>
              <h3 className="text-xl font-semibold">Work Experience</h3>
              {(resume.experience.content as any[]).map((exp, index) => (
                <div key={index} className="mb-4">
                  <h4 className="font-semibold">
                    {exp.role} at {exp.organization}
                  </h4>
                  <p>
                    {exp.startDate} - {exp.endDate}
                  </p>
                  <p>{exp.location}</p>
                  <ul className="list-disc list-inside">
                    {exp.responsibilities.map((resp: string, i: number) => (
                      <li key={i}>{resp}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>

            <section>
              <h3 className="text-xl font-semibold">Education</h3>
              {(resume.education.content as any[]).map((edu, index) => (
                <div key={index} className="mb-4">
                  <h4 className="font-semibold">
                    {edu.degree} in {edu.field}
                  </h4>
                  <p>{edu.institution}</p>
                  <p>Graduated: {edu.graduationDate}</p>
                  <p>GPA: {edu.gpa}</p>
                </div>
              ))}
            </section>

            <section>
              <h3 className="text-xl font-semibold">Projects</h3>
              {(resume.projects.content as any[]).map((project, index) => (
                <div key={index} className="mb-4">
                  <h4 className="font-semibold">{project.name}</h4>
                  <p>{project.description}</p>
                  <p>Technologies: {project.technologies}</p>
                  <p>
                    Link:{" "}
                    <a href={project.link} className="text-blue-600 hover:underline">
                      {project.link}
                    </a>
                  </p>
                </div>
              ))}
            </section>

            <section>
              <h3 className="text-xl font-semibold">Skills</h3>
              <p>{resume.skills.content}</p>
            </section>
          </div>
        </ScrollArea>
        <div className="mt-4 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

