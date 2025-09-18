/*import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle } from "docx"

export const generateDOCX = async (resume: any) => {
  const createSection = (title: string, content: any) => {
    const children = [
      new Paragraph({
        children: [new TextRun({ text: title, bold: true, size: 24 })],
      }),
      new Table({
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                },
              }),
            ],
          }),
        ],
      }),
    ]

    if (typeof content === "string") {
      children.push(new Paragraph({ children: [new TextRun({ text: content })] }))
    } else if (Array.isArray(content)) {
      content.forEach((item, index) => {
        Object.entries(item).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            children.push(new Paragraph({ children: [new TextRun({ text: `${key}:`, bold: true })] }))
            value.forEach((v: string) => {
              children.push(new Paragraph({ children: [new TextRun({ text: `• ${v}` })], indent: { left: 720 } }))
            })
          } else {
            children.push(new Paragraph({ children: [new TextRun({ text: `${key}: ${value}` })] }))
          }
        })
        if (index < content.length - 1) {
          children.push(new Paragraph({}))
          children.push(
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                        bottom: { style: BorderStyle.NONE },
                        left: { style: BorderStyle.NONE },
                        right: { style: BorderStyle.NONE },
                      },
                    }),
                  ],
                }),
              ],
            }),
          )
        }
      })
    } else {
      Object.entries(content).forEach(([key, value]) => {
        if (value) {
          children.push(new Paragraph({ children: [new TextRun({ text: `${key}: ${value}` })] }))
        }
      })
    }

    children.push(new Paragraph({}))
    return children
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: Object.entries(resume).flatMap(([key, section]) => createSection(section.title, section.content)),
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "resume.docx"
  link.click()
  URL.revokeObjectURL(url)
}
*/
