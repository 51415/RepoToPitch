import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import { jsPDF } from 'jspdf'
import pptxgen from 'pptxgenjs'

// ── Content Sanitization ──────────────────────────────────────────────────
function sanitize(text) {
  if (!text || typeof text !== 'string') return text
  return text
    .replace(/\$ightarrow\$/g, '→')
    .replace(/\\rightarrow/g, '→')
    .replace(/\$leftarrow\$/g, '←')
    .replace(/\\leftarrow/g, '←')
    .replace(/\$bullet\$/g, '•')
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
      children.push(new Paragraph({ text: line.replace('# ', ''), heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 120 } }))
    } else if (line.startsWith('## ')) {
      children.push(new Paragraph({ text: line.replace('## ', ''), heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 120 } }))
    } else if (line.startsWith('### ')) {
      children.push(new Paragraph({ text: line.replace('### ', ''), heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 120 } }))
    } else if (line.trim()) {
      children.push(new Paragraph({
        children: [new TextRun(line.trim())],
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
    const cleanContent = sanitize(content)
    const lines = doc.splitTextToSize(cleanContent || '', 180)
    doc.setFontSize(18)
    doc.text(sanitize(title) || 'Document', 10, 20)
    doc.setFontSize(10)
    doc.text(lines, 10, 30)
    
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
    slide.addText((s.bullets || []).map(b => ({ text: sanitize(b), options: { bullet: true } })), { x: 0.8, y: 2.0, w: '85%', h: 3, fontSize: 18, color: '444444' })
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

  slides.forEach((s, i) => {
    if (i > 0) doc.addPage()
    doc.setFontSize(28).text(sanitize(s.title), 20, 35)
    let currentY = 50
    if (s.subtitle) {
      doc.setFontSize(11).text(sanitize(s.subtitle.toUpperCase()), 20, currentY)
      currentY += 15
    }
    doc.setFontSize(14)
    ;(s.bullets || []).forEach(bullet => {
      doc.text('• ' + sanitize(bullet), 20, currentY)
      currentY += 12
    })
  })

  const blob = doc.output('blob')
  const arrayBuffer = await blob.arrayBuffer()
  const success = await saveNative(filename, new Uint8Array(arrayBuffer), true)
  if (!success) saveBrowser(blob, filename)
}
