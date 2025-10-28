import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { generatePDF } from './pdfGenerator'
import { generateDOCX } from './docxGenerator'
import { Separator } from "@/components/ui/separator"

export default function EditableResume() {
  const [resume, setResume] = useState({
    name: '',
    email: '',
    phone: '',
    summary: '',
    experience: '',
    education: '',
    skills: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setResume(prev => ({ ...prev, [name]: value }))
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Editable Resume</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-6">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" value={resume.name} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" value={resume.email} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" type="tel" value={resume.phone} onChange={handleChange} />
          </div>
          <Separator className="my-4" />
          <div>
            <Label htmlFor="summary">Professional Summary</Label>
            <Textarea id="summary" name="summary" value={resume.summary} onChange={handleChange} />
          </div>
          <Separator className="my-4" />
          <div>
            <Label htmlFor="experience">Work Experience</Label>
            <Textarea id="experience" name="experience" value={resume.experience} onChange={handleChange} />
          </div>
          <Separator className="my-4" />
          <div>
            <Label htmlFor="education">Education</Label>
            <Textarea id="education" name="education" value={resume.education} onChange={handleChange} />
          </div>
          <Separator className="my-4" />
          <div>
            <Label htmlFor="skills">Skills</Label>
            <Textarea id="skills" name="skills" value={resume.skills} onChange={handleChange} />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={() => generatePDF(resume)}>Download as PDF</Button>
        <Button onClick={() => generateDOCX(resume)}>Download as DOCX</Button>
      </CardFooter>
    </Card>
  )
}

