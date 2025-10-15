import { jsPDF } from "jspdf"
// import React, { useState, useEffect } from "react";
import { WorkExperience, Project } from "@/utils/types/resume";



export const generatePDF = (resume: any) => {
  const doc = new jsPDF()

  const addContact = (contactInfo: any) => {
    doc.setFontSize(46)
    const textWidth = doc.getTextWidth(contactInfo.name)
    const centerX = doc.internal.pageSize.getWidth()
    doc.text(contactInfo.name, (centerX - textWidth) / 2, 20)
    doc.setFontSize(12)
    let xPos = 20;
    Object.entries(contactInfo).forEach(([key, value]: [string, unknown]) => {
      if (key !== "name") {
        doc.text(value as string, xPos, 30)
        const textWidth = doc.getTextWidth(value as string)
        xPos = xPos + textWidth + 5
      }
    });
    doc.setDrawColor(0)
    doc.line(20, 32, 190, 32)
    return 32
  }


  const addText = (content: string, y: number, x: number=20) => {
    doc.text(content, x, y + 5, { maxWidth: 170 })
    console.log("..............", doc.getTextDimensions(content, { maxWidth: 170 }))
    return doc.getTextDimensions(content, { maxWidth: 170 })
  }


  const addWorkExperience = (workExperiences: any, y: number) => {
    doc.text("WORK EXPERIENCE", 20, y)
    y += 2
    doc.line(20, y, 190, y)
    let height = y + 10
    workExperiences.forEach((experience: WorkExperience, _idx: number) => {
      doc.text(experience.organization, 20, height)
      height += 10
      doc.text(experience.role, 20, height)
      height += 10
      experience.responsibilities.forEach((value: string, _idx: number) => {
        
        doc.text(`• ${value}`, 25, height, { maxWidth: 170 })
        height += 10;
      });
    });
    return height
  }
  
  const addEducations = (educations: any, y: number) => {
    doc.text("EDUCATION", 20, y)
    y += 2
    doc.line(20, y, 190, y)
    let height = y + 10
    educations.forEach((education: any, _idx: number) => {
     doc.text(education.school_name, 20, height);
     height += 5;
     doc.text(`—— ${education.certificate}`, 20, height);
     height += 5;
     doc.text(`   ${education.time}`, 20, height);
     height += 10;
    });
    return height + 10
  }
    

  const addProjects = (projects: Project[], y: number) => {
    doc.text("PROJECTS", 20, y)
    y += 2
    doc.line(20, y, 190, y)
    let height = y + 10
    projects.forEach((project: Project, _idx: number) => {
      doc.text(project.name, 20, height);
      height += 2;
      let linePos = addText(project.description, height);
      height += linePos.h + 10;
    })
    return height
  }

  const addSkills = (skills: any, y: number) => {
    doc.text("SKILLS", 20, y)
    y += 2
    doc.line(20, y, 190, y)
    let height = y + 10
    let space = 170;
    let xPos = 20
    skills.forEach((skill: any, _idx: number) => {
      const textWidth = doc.getTextWidth(skill)
      if (space - textWidth < 0) {
        height += 5
        xPos = 20
      }
      space -= textWidth
      doc.text(`• ${skill}`, xPos, height)
      xPos += textWidth + 6
      //let linePos = addText(`• ${skill}`, height, xPos);
      //console.log(linePos)
      //xPos = linePos.w + 20
      //height += linePos.h;
    })
    return height
  }


  let yPos = 0
  yPos += addContact(resume.contact.content);
  yPos += addText(resume.summary.content, yPos).h + 10

  yPos = addWorkExperience(resume.experience.content, yPos);
  yPos = addEducations(resume.education.content, yPos)
  yPos = addProjects(resume.projects.content, yPos)
  doc.addPage()
  yPos = 0
  yPos = addSkills(resume.skills.content, yPos)
  
  return doc

  //doc.save("resume.pdf")
}


export const Preview = ({resume}: any) => {
  
  const display = () => {
    if (!resume) return;
    console.log("oreview", resume)
    const doc = generatePDF(resume);
    doc.save()
  };

  return (
    <div>
      <button                                                 onClick={display}                                     className="px-4 py-2 bg-blue-500 text-white ro
unded hover:bg-blue-600 transition-colors"                  >                                                       Preview                                             </button>
    </div>
  );
}
