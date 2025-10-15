import { jsPDF } from "jspdf"

export const generatePDF = (resume: any) => {
  const doc = new jsPDF()
  const lineColor = 200 // Light gray

  const addSection = (title: string, content: any, y: number) => {
    doc.setFontSize(16)
    doc.setTextColor(0)
    doc.text(title, 20, y)
    doc.setDrawColor(lineColor)
    doc.line(20, y + 1, 190, y + 1)
    doc.setFontSize(12)
    doc.setTextColor(0)

    if (typeof content === "string") {
      doc.text(content, 20, y + 10, { maxWidth: 170 })
      return doc.getTextDimensions(content, { maxWidth: 170 }).h + 20
    } else if (Array.isArray(content)) {
      let height = 10
      content.forEach((item, index) => {
        Object.entries(item).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            doc.text(`${key}:`, 20, y + height)
            height += 10
            value.forEach((v: string) => {
              doc.text(`• ${v}`, 25, y + height)
              height += 10
            })
          } else {
            doc.text(`${key}: ${value}`, 20, y + height)
            height += 10
          }
        })
        if (index < content.length - 1) {
          height += 5
          doc.setDrawColor(lineColor)
          doc.line(20, y + height, 190, y + height)
          height += 5
        }
      })
      return height + 10
    } else {
      let height = 10
      Object.entries(content).forEach(([key, value]) => {
        if (value) {
          doc.text(`${key}: ${value}`, 20, y + height)
          height += 10
        }
      })
      return height + 10
    }
  }

  let yPos = 20
  Object.entries(resume).forEach(([key, section]) => {
    yPos += addSection(section.title, section.content, yPos)
  })

  doc.save("resume.pdf")
}

