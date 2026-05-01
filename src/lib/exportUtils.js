import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import { jsPDF } from 'jspdf'
import pptxgen from 'pptxgenjs'

// ── Content Sanitization ──────────────────────────────────────────────────
// ── Content Sanitization ──────────────────────────────────────────────────
function sanitize(text) {
  if (!text) return ''
  
  // 1. Nuclear purge of all dollar-like symbols and invisible markers
  let s = String(text)
    .replace(/[\$\uFF04\u0024]/g, '')
    .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
  
  // 2. Literal purge of markdown markers
  while (s.indexOf('**') !== -1) s = s.replace('**', '')
  while (s.indexOf('__') !== -1) s = s.replace('__', '')
  while (s.indexOf('`') !== -1) s = s.replace('`', '')
  while (s.indexOf('*') !== -1) s = s.replace('*', '')
  
  // 3. Technical symbols (Aggressive detection)
  s = s.replace(/\\leftrightarrow|↔|<->|< - >/g, ' <-> ')
  s = s.replace(/\\rightarrow|→|->| - >/g, ' -> ')
  s = s.replace(/\\leftarrow|←|<-| < - /g, ' <- ')
  
  // 4. Punctuation normalization
  s = s.replace(/[！]/g, '!').replace(/[？]/g, '?').replace(/[：]/g, ':').replace(/[；]/g, ';')
  s = s.replace(/[“]/g, '"').replace(/[”]/g, '"').replace(/[‘]/g, "'").replace(/[’]/g, "'")
  
  return s.replace(/\s+/g, ' ').trim()
}

async function saveNative(filename, data, isBinary = false) {
  try {
    const { save } = await import('@tauri-apps/plugin-dialog')
    const { writeTextFile, writeFile } = await import('@tauri-apps/plugin-fs')
    
    const path = await save({
      defaultPath: filename,
      filters: [
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    
    if (path) {
      if (isBinary) {
        await writeFile(path, data)
      } else {
        await writeTextFile(path, data)
      }
      return true
    }
    return false
  } catch (e) {
    console.error('[EXPORT] Native save failed, falling back to browser:', e)
    return false
  }
}

// ── Browser Fallback Helper ────────────────────────────────────────────────
function saveBrowser(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

/**
 * EXPORT PRD AS MARKDOWN
 */
export const exportAsMarkdown = async (content, filename) => {
  
  // Try Native First
  const success = await saveNative(filename, content)
  if (success) return

  // Fallback
  try {
    const blob = new Blob([content], { type: 'text/markdown' })
    saveBrowser(blob, filename)
  } catch (e) {
    console.error('[EXPORT] Markdown fallback failed:', e)
  }
}

/**
 * EXPORT AS JSON
 */
export const exportAsJSON = async (data, filename) => {
  const content = JSON.stringify(data, null, 2)
  
  const success = await saveNative(filename, content)
  if (success) return

  try {
    const blob = new Blob([content], { type: 'application/json' })
    saveBrowser(blob, filename)
  } catch (e) {
    console.error('[EXPORT] JSON fallback failed:', e)
  }
}

/**
 * EXPORT PRD AS DOCX (Word)
 */
export const exportAsDocx = async (title, content, filename) => {
  const lines = content.split('\n')
  const children = [
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 400 },
    }),
  ]

  lines.forEach(line => {
    if (line.startsWith('# ')) {
      children.push(new Paragraph({ text: sanitize(line.replace('# ', '')), heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 120 } }))
    } else if (line.startsWith('## ')) {
      children.push(new Paragraph({ text: sanitize(line.replace('## ', '')), heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 120 } }))
    } else if (line.startsWith('### ')) {
      children.push(new Paragraph({ text: sanitize(line.replace('### ', '')), heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 120 } }))
    } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      children.push(new Paragraph({
        text: sanitize(line.trim().replace(/^[*\-•\s]+/, '')),
        bullet: { level: 0 },
        spacing: { after: 120 }
      }))
    } else if (line.trim()) {
      children.push(new Paragraph({
        children: [new TextRun(sanitize(line.trim()))],
        spacing: { after: 120 },
      }))
    }
  })

  const doc = new Document({
    sections: [{ children }],
  })

  const blob = await Packer.toBlob(doc)
  const arrayBuffer = await blob.arrayBuffer()
  const success = await saveNative(filename, new Uint8Array(arrayBuffer), true)
  if (!success) saveBrowser(blob, filename)
}

/**
 * EXPORT PRD AS PDF
 */
export const exportAsPDF = async (title, content, filename) => {
  try {
    const doc = new jsPDF()
    const lines = content.split('\n')
    
    let y = 20
    const margin = 20
    const pageWidth = doc.internal.pageSize.width
    const contentWidth = pageWidth - (margin * 2)

    // Title & Header
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(24)
    doc.setTextColor(15, 23, 42)
    doc.text(sanitize(title) || 'Document', margin, y)
    y += 10
    
    doc.setDrawColor(37, 99, 235)
    doc.setLineWidth(1)
    doc.line(margin, y, margin + 40, y)
    y += 15

    lines.forEach(line => {
      const trimmedLine = line.trim()
      if (!trimmedLine && line !== '') return

      if (line.startsWith('# ')) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(18)
        doc.setTextColor(15, 23, 42)
        const text = sanitize(line.replace('# ', ''))
        const splitText = doc.splitTextToSize(text, contentWidth)
        splitText.forEach(t => {
          if (y > 275) { doc.addPage(); y = 20; doc.setFont('helvetica', 'bold'); doc.setFontSize(18); }
          doc.setCharSpace(0)
          doc.text(t, margin, y)
          y += 9
        })
        y += 2
      } else if (line.startsWith('## ')) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(15)
        doc.setTextColor(30, 41, 59)
        const text = sanitize(line.replace('## ', ''))
        const splitText = doc.splitTextToSize(text, contentWidth)
        splitText.forEach(t => {
          if (y > 275) { doc.addPage(); y = 20; doc.setFont('helvetica', 'bold'); doc.setFontSize(15); }
          doc.setCharSpace(0)
          doc.text(t, margin, y)
          y += 8
        })
        y += 2
      } else if (line.startsWith('### ')) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.setTextColor(51, 65, 85)
        const text = sanitize(line.replace('### ', ''))
        const splitText = doc.splitTextToSize(text, contentWidth)
        splitText.forEach(t => {
          if (y > 275) { doc.addPage(); y = 20; doc.setFont('helvetica', 'bold'); doc.setFontSize(12); }
          doc.setCharSpace(0)
          doc.text(t, margin, y)
          y += 7
        })
        y += 1
      } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(71, 85, 105)
        const cleanLine = sanitize(trimmedLine.replace(/^[*\-•\s]+/, ''))
        const splitText = doc.splitTextToSize('• ' + cleanLine, contentWidth - 8)
        splitText.forEach(t => {
          if (y > 275) { doc.addPage(); y = 20; doc.setFont('helvetica', 'normal'); doc.setFontSize(10); }
          doc.setCharSpace(0)
          doc.text(t, margin + 8, y)
          y += 6
        })
      } else if (line === '') {
        y += 6
      } else {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(71, 85, 105)
        const cleanLine = sanitize(line)
        const splitText = doc.splitTextToSize(cleanLine, contentWidth)
        splitText.forEach(t => {
          if (y > 275) { doc.addPage(); y = 20; doc.setFont('helvetica', 'normal'); doc.setFontSize(10); }
          doc.setCharSpace(0)
          doc.text(t, margin, y)
          y += 6
        })
      }
    })

    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, 285, { align: 'center' })
      doc.text('RepoToPitch Synthesis Output', margin, 285)
    }
    
    const blob = doc.output('blob')
    const arrayBuffer = await blob.arrayBuffer()
    const success = await saveNative(filename, new Uint8Array(arrayBuffer), true)
    if (!success) saveBrowser(blob, filename)
  } catch (e) {
    console.error('[EXPORT] PDF export failed:', e)
  }
}

/**
 * EXPORT PITCH DECK AS PPTX
 */
export const exportAsPptx = async (slides, filename) => {
  const pptx = new pptxgen()
  
  slides.forEach((s) => {
    const slide = pptx.addSlide()
    slide.addText(sanitize(s.title), { x: 0.5, y: 0.5, w: '90%', h: 1, fontSize: 32, bold: true, color: '363636' })
    if (s.subtitle) slide.addText(sanitize(s.subtitle), { x: 0.5, y: 1.3, w: '90%', h: 0.5, fontSize: 14, italic: true, color: '666666' })
    slide.addText((s.bullets || []).map(b => ({ text: sanitize(b.replace(/^[*\-•\s]+/, '')), options: { bullet: true } })), { x: 0.8, y: 2.0, w: '85%', h: 3, fontSize: 18, color: '444444' })
    if (s.speaker_note) slide.addNotes(sanitize(s.speaker_note))
  })

  const data = await pptx.write('blob')
  const arrayBuffer = await data.arrayBuffer()
  const success = await saveNative(filename, new Uint8Array(arrayBuffer), true)
  if (!success) saveBrowser(data, filename)
}

/**
 * EXPORT PITCH DECK AS PDF
 */
export const exportPitchAsPDF = async (slides, filename) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.width
  const contentWidth = pageWidth - 40 // Margins

  slides.forEach((s, i) => {
    if (i > 0) doc.addPage()
    
    // Background card style
    doc.setDrawColor(226, 232, 240)
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(10, 10, pageWidth - 20, 190, 3, 3, 'FD')

    // Title
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(28)
    doc.setTextColor(15, 23, 42)
    doc.text(sanitize(s.title), 20, 35)
    
    let currentY = 45
    
    // Subtitle
    if (s.subtitle) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(37, 99, 235)
      doc.text(sanitize(s.subtitle.toUpperCase()), 20, currentY)
      currentY += 15
    }

    // Dynamic Font Scaling for high-density slides
    const bulletCount = (s.bullets || []).length
    let fontSize = 16
    let lineSpacing = 12
    if (bulletCount > 6) { fontSize = 14; lineSpacing = 10; }
    if (bulletCount > 8) { fontSize = 12; lineSpacing = 8; }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(fontSize)
    doc.setTextColor(51, 65, 85)

    ;(s.bullets || []).forEach(bullet => {
      // Deduplicate bullets and clean markdown
      const cleanBullet = sanitize(bullet.replace(/^[*\-•\s]+/, ''))
      const splitBullet = doc.splitTextToSize('• ' + cleanBullet, contentWidth)
      
      splitBullet.forEach(line => {
        if (currentY > 185) return // Safety check
        doc.setCharSpace(0)
        doc.text(line, 20, currentY)
        currentY += lineSpacing
      })
      currentY += 4 // Bullet gap
    })

    // Slide Number
    doc.setFontSize(10)
    doc.setTextColor(148, 163, 184)
    doc.text(`${i + 1} // ${slides.length}`, pageWidth - 35, 190)
  })

  const blob = doc.output('blob')
  const arrayBuffer = await blob.arrayBuffer()
  const success = await saveNative(filename, new Uint8Array(arrayBuffer), true)
  if (!success) saveBrowser(blob, filename)
}
