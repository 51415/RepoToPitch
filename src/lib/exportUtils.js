import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx'
// import { jsPDF } from 'jspdf' (REMOVED: Native-only export policy)
import { pluginManager } from './pluginLoader'

import { useStore } from './store'
import { Command } from '@tauri-apps/plugin-shell'
import { checkExportDependencies, downloadLibreOffice } from './dependencyCheck'

async function getConfiguredTemplates() {
  try {
    const { readTextFile, exists, BaseDirectory } = await import('@tauri-apps/plugin-fs');
    const relativeTomlPath = 'growthvariable/RepoToPitch/brand/brand.toml';

    if (await exists(relativeTomlPath, { baseDir: BaseDirectory.AppData })) {
      const content = await readTextFile(relativeTomlPath, { baseDir: BaseDirectory.AppData });
      const docxMatch = content.match(/docx_path\s*=\s*"([^"]+)"/);
      const pptxMatch = content.match(/pptx_path\s*=\s*"([^"]+)"/);
      return {
        docxPath: docxMatch && docxMatch[1] ? docxMatch[1] : null,
        pptxPath: pptxMatch && pptxMatch[1] ? pptxMatch[1] : null
      };
    }
  } catch (err) {
    console.warn('[EXPORT] Could not read configured templates from brand.toml:', err);
  }
  return { docxPath: null, pptxPath: null };
}

// ── Content Sanitization ──────────────────────────────────────────────────
function sanitize(text) {
  if (!text) return ''

  // 1. Purge invisible markers and normalize spaces
  let s = String(text)
    .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')

  // 2. Technical symbols normalization
  s = s.replace(/\\leftrightarrow|↔|<->|< - >/g, ' <-> ')
  s = s.replace(/\\rightarrow|→|->| - >/g, ' -> ')
  s = s.replace(/\\leftarrow|←|<-| < - /g, ' <- ')

  // 3. Punctuation normalization
  s = s.replace(/[！]/g, '!').replace(/[？]/g, '?').replace(/[：]/g, ':').replace(/[；]/g, ';')
  s = s.replace(/[“]/g, '"').replace(/[”]/g, '"').replace(/[‘]/g, "'").replace(/[’]/g, "'")

  return s.replace(/\s+/g, ' ').trim()
}

function parseInlineMarkdown(text) {
  if (!text) return [];
  const runs = [];
  let i = 0;
  let currentText = '';

  const flushText = () => {
    if (currentText) {
      runs.push(new TextRun({ text: sanitize(currentText) }));
      currentText = '';
    }
  };

  while (i < text.length) {
    if (text.startsWith('**', i)) {
      const closing = text.indexOf('**', i + 2);
      if (closing !== -1) {
        flushText();
        const content = text.slice(i + 2, closing);
        runs.push(new TextRun({ text: sanitize(content), bold: true }));
        i = closing + 2;
        continue;
      }
    }
    if (text.startsWith('*', i)) {
      const closing = text.indexOf('*', i + 1);
      if (closing !== -1) {
        flushText();
        const content = text.slice(i + 1, closing);
        runs.push(new TextRun({ text: sanitize(content), italic: true }));
        i = closing + 1;
        continue;
      }
    }
    if (text.startsWith('`', i)) {
      const closing = text.indexOf('`', i + 1);
      if (closing !== -1) {
        flushText();
        const content = text.slice(i + 1, closing);
        runs.push(new TextRun({ text: sanitize(content), font: "Consolas", color: "2563EB" }));
        i = closing + 1;
        continue;
      }
    }
    currentText += text[i];
    i++;
  }
  flushText();
  return runs;
}

async function resolvePptxTemplatePath() {
  const brandConfig = useStore.getState().brandConfig;
  try {
    const { exists, BaseDirectory } = await import('@tauri-apps/plugin-fs');
    const { appDataDir, join } = await import('@tauri-apps/api/path');
    
    // 1. Custom Template
    if (brandConfig?.templates?.pptx) {
      const fileName = brandConfig.templates.pptx.split(/[\\/]/).pop();
      if (fileName) {
        const relativePath = `growthvariable/RepoToPitch/brand/${fileName}`;
        if (await exists(relativePath, { baseDir: BaseDirectory.AppData })) {
          return await join(await appDataDir(), relativePath);
        }
      }
    }

    // 2. Default AppData Template
    const defaultRelative = 'growthvariable/RepoToPitch/brand/template.pptx';
    if (await exists(defaultRelative, { baseDir: BaseDirectory.AppData })) {
      return await join(await appDataDir(), defaultRelative);
    }
  } catch (e) {
    console.warn('[EXPORT] Failed to resolve PPTX template path:', e);
  }
  return null;
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

async function ensureDependencies() {
  const deps = await checkExportDependencies();
  if (!deps.msOffice && !deps.libreOffice) {
    const { ask } = await import('@tauri-apps/plugin-dialog');
    await ask(
      'A professional Office Engine is required to generate high-fidelity documents.\n\nNeither Microsoft Office nor LibreOffice was detected on your system. All document exports (PDF, DOCX, PPTX) are currently unavailable.\n\nWould you like to visit the LibreOffice download page?',
      { title: 'Native Engine Required', kind: 'error', okLabel: 'Download LibreOffice', cancelLabel: 'Close' }
    ).then(async (res) => {
      if (res) await downloadLibreOffice();
    });
    return null;
  }
  return deps;
}

const withCursor = async (fn) => {
  const deps = await ensureDependencies();
  if (!deps) return;

  const root = document.documentElement;
  root.style.cursor = 'wait';
  document.body.style.cursor = 'wait';
  try {
    // Small delay to ensure cursor is rendered before heavy work starts
    await new Promise(r => setTimeout(r, 50));
    return await fn(deps);
  } finally {
    root.style.cursor = 'default';
    document.body.style.cursor = 'default';
  }
}

/**
 * EXPORT PRD AS MARKDOWN
 */
export const exportAsMarkdown = (content, filename) => withCursor(async () => {
  const success = await saveNative(filename, content)
  if (success) return
  try {
    const blob = new Blob([content], { type: 'text/markdown' })
    saveBrowser(blob, filename)
  } catch (e) {
    console.error('[EXPORT] Markdown export failed:', e)
  }
})

/**
 * EXPORT AS JSON
 */
export const exportAsJSON = (data, filename) => withCursor(async () => {
  const content = JSON.stringify(data, null, 2)
  const success = await saveNative(filename, content)
  if (success) return
  try {
    const blob = new Blob([content], { type: 'application/json' })
    saveBrowser(blob, filename)
  } catch (e) {
    console.error('[EXPORT] JSON export failed:', e)
  }
})

/**
 * CORE LOGIC: GENERATE DOCX BLOB
 */
async function generateDocxBlob(title, content) {
  const lines = content.split('\n')
  const children = [
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 400 },
    }),
  ]

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('# ')) {
      children.push(new Paragraph({ text: sanitize(line.replace('# ', '')), heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 120 } }));
      i++;
    } else if (line.startsWith('## ')) {
      children.push(new Paragraph({ text: sanitize(line.replace('## ', '')), heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 120 } }));
      i++;
    } else if (line.startsWith('### ')) {
      children.push(new Paragraph({ text: sanitize(line.replace('### ', '')), heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 120 } }));
      i++;
    } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const trimmedLine = line.trim().replace(/^[-*•]\s+/, '');
      children.push(new Paragraph({
        children: parseInlineMarkdown(trimmedLine),
        bullet: { level: 0 },
        spacing: { after: 120 }
      }));
      i++;
    } else if (line.trim().includes('|') && lines[i + 1]?.trim() && /^[|\s:-]+$/.test(lines[i + 1].trim()) && lines[i + 1].includes('-')) {
      // TABLE DETECTION
      const tableRows = [];
      const headerLine = line.trim();
      i += 2; // Skip header and separator (|---|)

      const parseCells = (l) => l.split('|')
        .map(c => c.trim())
        .filter((c, idx, arr) => !((idx === 0 || idx === arr.length - 1) && c === ''));

      const headerCells = parseCells(headerLine);
      if (headerCells.length > 0) {
        tableRows.push(new TableRow({
          children: headerCells.map(cell => new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: sanitize(cell), bold: true })],
              spacing: { before: 120, after: 120 },
              alignment: "center"
            })],
            width: { size: 100 / headerCells.length, type: WidthType.PERCENTAGE },
            shading: { fill: "F8FAFC" }
          }))
        }));

        while (i < lines.length && lines[i].trim().includes('|')) {
          const rowLine = lines[i].trim();
          const cells = parseCells(rowLine);
          if (cells.length > 0) {
            tableRows.push(new TableRow({
              children: cells.map((cell, idx) => new TableCell({
                children: [new Paragraph({
                  text: sanitize(cell),
                  spacing: { before: 100, after: 100 }
                })],
                width: { size: 100 / headerCells.length, type: WidthType.PERCENTAGE }
              }))
            }));
          }
          i++;
        }

        if (tableRows.length > 0) {
          children.push(new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
              insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
            }
          }));
          children.push(new Paragraph({ text: '', spacing: { after: 200 } })); // Spacer
        }
      }
    } else if (line.trim()) {
      children.push(new Paragraph({
        children: parseInlineMarkdown(line.trim()),
        spacing: { after: 120 },
      }));
      i++;
    } else {
      i++;
    }
  }

  const templates = await getConfiguredTemplates();
  const { brandConfig } = useStore.getState();
  const templatePath = templates.docxPath || brandConfig?.templates?.docx;

  let docOptions = {
    sections: [{ children }]
  };

  let doc = new Document(docOptions);

  // Apply Branding Hook
  const brandedDoc = await pluginManager.runHook('APPLY_DOCUMENT_BRANDING', { type: 'docx', doc, title, content, brandConfig, templatePath });
  if (brandedDoc) doc = brandedDoc;

  let blob = await Packer.toBlob(doc);

  // [TRUE TEMPLATE MERGING]
  if (templatePath) {
    try {
      const { readFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
      let templateXml;
      try {
        const wipedBuffer = await readFile('growthvariable/RepoToPitch/brand/docx_document_template.xml', { baseDir: BaseDirectory.AppData });
        templateXml = new TextDecoder().decode(wipedBuffer);
      } catch (e) {
        console.warn('[EXPORT] Pre-wiped DOCX template XML not found, falling back to basic export.', e);
      }

      if (templateXml) {
        const JSZip = (await import('jszip')).default;

        const generatedZip = new JSZip();
        await generatedZip.loadAsync(await blob.arrayBuffer());
        const generatedXml = await generatedZip.file('word/document.xml').async('string');

        let bodyContent = '';
        const genBodyStart = generatedXml.indexOf('<w:body>') + '<w:body>'.length;
        const genSectPrStart = generatedXml.lastIndexOf('<w:sectPr');
        if (genBodyStart !== -1 && genSectPrStart !== -1 && genSectPrStart > genBodyStart) {
          bodyContent = generatedXml.substring(genBodyStart, genSectPrStart);
        }

        if (bodyContent) {
          const injectPoint = templateXml.lastIndexOf('<w:sectPr');
          if (injectPoint !== -1) {
            templateXml = templateXml.substring(0, injectPoint) + bodyContent + templateXml.substring(injectPoint);

            const templateZip = new JSZip();
            const tplName = templatePath.split(/[\\/]/).pop();
            const originalTemplateBuffer = await readFile(`growthvariable/RepoToPitch/brand/${tplName}`, { baseDir: BaseDirectory.AppData });
            await templateZip.loadAsync(originalTemplateBuffer);
            templateZip.file('word/document.xml', templateXml);

            blob = await templateZip.generateAsync({ type: 'blob' });
          }
        }
      }
    } catch (mergeErr) {
      console.warn('[EXPORT] DOCX Merge failed:', mergeErr);
    }
  }
  return blob;
}

/**
 * EXPORT PRD AS DOCX (Word)
 */
export const exportAsDocx = (title, content, filename) => withCursor(async (deps) => {
  try {
    const blob = await generateDocxBlob(title, content);
    
    // If MS Office is present, we "bake" it via Word COM to ensure native formatting
    if (deps.msOffice) {
      try {
        await bakeDocxWithWord(blob, filename);
        return;
      } catch (e) {
        console.warn('[EXPORT] Word COM baking failed, saving raw blob:', e);
      }
    }

    const arrayBuffer = await blob.arrayBuffer();
    await saveNative(filename, new Uint8Array(arrayBuffer), true);
  } catch (err) {
    console.error('[EXPORT] DOCX failed:', err);
    const { message } = await import('@tauri-apps/plugin-dialog');
    await message(`Failed to compile DOCX document.\n\nError: ${err.message || err}`, { title: 'Export Error', type: 'error' });
  }
})

async function bakeDocxWithWord(blob, filename) {
  const { writeFile, remove, BaseDirectory } = await import('@tauri-apps/plugin-fs');
  const { Command } = await import('@tauri-apps/plugin-shell');
  const { appLocalDataDir, join } = await import('@tauri-apps/api/path');

  const dataDir = await appLocalDataDir();
  const tempIn = await join(dataDir, `temp_bake.docx`);
  const tempOut = await join(dataDir, `temp_baked.docx`);

  const arrayBuffer = await blob.arrayBuffer();
  await writeFile(`temp_bake.docx`, new Uint8Array(arrayBuffer), { baseDir: BaseDirectory.AppLocalData });

  const psScript = `
    $app = New-Object -ComObject Word.Application
    $app.Visible = $false
    try {
      $doc = $app.Documents.Open('${tempIn}')
      $doc.SaveAs('${tempOut}')
      $doc.Close([ref]0)
    } finally {
      $app.Quit()
    }
  `;
  const cmd = Command.create('powershell', ['-Command', psScript]);
  await cmd.execute();

  const { readFile } = await import('@tauri-apps/plugin-fs');
  const docxBytes = await readFile(tempOut);
  await saveNative(filename, docxBytes, true);
  
  try { await remove(`temp_bake.docx`, { baseDir: BaseDirectory.AppLocalData }); } catch (e) {}
  try { await remove(`temp_baked.docx`, { baseDir: BaseDirectory.AppLocalData }); } catch (e) {}
}

/**
 * HIGH-FIDELITY CONVERSION: OFFICE TO PDF
 */
async function convertOfficeToPdf(blob, type, filename, includeNotes = false, isDefaultTemplate = false) {
  try {
    const { writeFile, remove, BaseDirectory } = await import('@tauri-apps/plugin-fs');
    const { Command } = await import('@tauri-apps/plugin-shell');
    const { appLocalDataDir, join } = await import('@tauri-apps/api/path');

    const deps = await checkExportDependencies();
    if (!deps.msOffice && !deps.libreOffice) {
      return { success: false, error: 'No compatible Office engines (MS Office or LibreOffice) detected.' };
    }

    const dataDir = await appLocalDataDir();
    const tempIn = await join(dataDir, `temp_export.${type}`);
    const tempOut = await join(dataDir, `temp_export.pdf`);

    const arrayBuffer = await blob.arrayBuffer();
    await writeFile(`temp_export.${type}`, new Uint8Array(arrayBuffer), { baseDir: BaseDirectory.AppLocalData });

    let success = false;
    let error = '';

    if (deps.msOffice) {
      let psScript = '';
      if (type === 'docx') {
        psScript = `
          $app = New-Object -ComObject Word.Application
          $app.Visible = $false
          try {
            $doc = $app.Documents.Open('${tempIn}')
            $doc.SaveAs('${tempOut}', 17) # 17 = wdFormatPDF
            $doc.Close([ref]0) # 0 = wdDoNotSaveChanges
          } catch {
            throw $_
          } finally {
            $app.Quit()
          }
        `;
      } else {

        const outputType = includeNotes ? 5 : 1;
        psScript = `
          $app = New-Object -ComObject PowerPoint.Application
          try {
            if ("${isDefaultTemplate}" -eq "true") {
              # Create new presentation with PowerPoint's actual system default template
              $pres = $app.Presentations.Add()
              $sourcePres = $app.Presentations.Open('${tempIn}', 0, 0, 0)
              
              # Copy slides from source to default template version
              # Note: Using InsertFromFile is more stable than clipboard Copy/Paste in COM
              $count = $sourcePres.Slides.Count
              $sourcePres.Close()
              $pres.Slides.InsertFromFile('${tempIn}', 0, 1, $count)
            } else {
              $pres = $app.Presentations.Open('${tempIn}', 0, 0, 0)
            }
            
            $pres.PrintOptions.OutputType = ${outputType}
            $pres.PrintOptions.HandoutOrder = 1
            $pres.PrintOptions.RangeType = 1
            $m = [System.Type]::Missing
            $bindingFlags = [System.Reflection.BindingFlags]::InvokeMethod
            $params = @("${tempOut}", [int]2, [int]1, [int]0, [int]1, [int]${outputType}, [int]0, $m, [int]1, $m, $true, $true, $true, $true, $false)
            try {
              $pres.GetType().InvokeMember("ExportAsFixedFormat", $bindingFlags, $null, $pres, $params)
            } catch {
              $pres.SaveAs('${tempOut}', 32)
            }
            $pres.Close()
          } catch {
            throw $_
          } finally {
            $app.Quit()
          }
        `;
      }
      const cmd = Command.create('powershell', ['-Command', psScript]);
      const res = await cmd.execute();
      if (res.code !== 0) {
        error = res.stderr;
      } else {
        await new Promise(r => setTimeout(r, 500));
        success = true;
      }
    } else if (deps.libreOffice) {
      const cmd = Command.create(deps.sofficePath, ['--headless', '--convert-to', 'pdf', '--outdir', dataDir, tempIn]);
      const res = await cmd.execute();

      if (res.code !== 0) {
        error = res.stderr;
      } else {
        await new Promise(r => setTimeout(r, 500));
        success = true;
      }
    }

    if (success) {
      const { readFile } = await import('@tauri-apps/plugin-fs');
      const pdfBytes = await readFile(tempOut);
      const { save } = await import('@tauri-apps/plugin-dialog');
      const targetPath = await save({ defaultPath: filename, filters: [{ name: 'PDF', extensions: ['pdf'] }] });
      if (targetPath) {
        await writeFile(targetPath, pdfBytes);
      } else {
        saveBrowser(new Blob([pdfBytes], { type: 'application/pdf' }), filename);
      }
    }

    try { await remove(`temp_export.${type}`, { baseDir: BaseDirectory.AppLocalData }); } catch (e) { }
    try { await remove(`temp_export.pdf`, { baseDir: BaseDirectory.AppLocalData }); } catch (e) { }

    return { success, error };
  } catch (err) {
    console.error('[CONVERSION] Office to PDF failed:', err);
    return { success: false, error: err.message || err };
  }
}


export const exportAsPDF = (title, content, filename, customBrandConfigOverride = null) => withCursor(async (deps) => {
  try {
    const docxBlob = await generateDocxBlob(title, content);
    const { success, error } = await convertOfficeToPdf(docxBlob, 'docx', filename);
    if (success) return;

    throw new Error(error);
  } catch (e) {
    console.error('[EXPORT] PDF export failed:', e);
    const { message } = await import('@tauri-apps/plugin-dialog');
    await message(`PDF Export Failed: ${e.message || 'An engine error occurred.'}`, { title: 'Export Error', type: 'error' });
  }
})

/**
 * CORE LOGIC: GENERATE PPTX BLOB
 */
async function generatePptxBlob(slides, overrideBrandConfig) {
  const { readFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
  const JSZip = (await import('jszip')).default;

  const brandConfig = overrideBrandConfig || useStore.getState().brandConfig;
  let templateBuffer = null;

  // 1. Try Custom Template (Plugin Mode)
  if (brandConfig?.templates?.pptx) {
    try {
      templateBuffer = await readFile(brandConfig.templates.pptx);
    } catch (e) {
      try {
        const pathOnly = brandConfig.templates.pptx.split(/[\\/]brand[\\/]/).pop();
        if (pathOnly) {
          templateBuffer = await readFile(`growthvariable/RepoToPitch/brand/${pathOnly}`, { baseDir: BaseDirectory.AppData });
        }
      } catch (e2) { }
    }
  }

  // 2. Try User-Configured Default in AppData
  if (!templateBuffer) {
    try {
      templateBuffer = await readFile(`growthvariable/RepoToPitch/brand/template.pptx`, { baseDir: BaseDirectory.AppData });
    } catch (e) { }
  }

  // 3. FALLBACK: Try Bundled Community Default (src/defaults)
  if (!templateBuffer) {
    const fallbackPaths = ['template.pptx', 'defaults/template.pptx', 'src/defaults/template.pptx'];
    for (const path of fallbackPaths) {
      try {
        templateBuffer = await readFile(path, { baseDir: BaseDirectory.Resource });
        if (templateBuffer) {
          console.log(`[EXPORT] Found bundled template at Resource:${path}`);
          break;
        }
      } catch (e) { }
    }
  }


  if (!templateBuffer) {
     console.warn('[EXPORT] No PPTX template found in any location.');
     return null; // Return null instead of throwing to allow caller to handle UI
  }


  const zip = await JSZip.loadAsync(templateBuffer);
  const slide1File = zip.file('ppt/slides/slide1.xml');
  const slide2File = zip.file('ppt/slides/slide2.xml');
  const baseNotesFile = zip.file('ppt/notesSlides/notesSlide1.xml');

  if (!slide1File || !slide2File) throw new Error('Invalid PPTX Template');

  const slide1Xml = await slide1File.async('string');
  const slide2Xml = await slide2File.async('string');
  const slide1Rels = await zip.file('ppt/slides/_rels/slide1.xml.rels').async('string');
  const slide2Rels = await zip.file('ppt/slides/_rels/slide2.xml.rels').async('string');
  const baseNotesXml = baseNotesFile ? await baseNotesFile.async('string') : null;
  const hasNotesMaster = zip.file(/ppt\/notesMasters\/notesMaster.*\.xml/).length > 0;

  let presentationXml = await zip.file('ppt/presentation.xml').async('string');
  let presentationRels = await zip.file('ppt/_rels/presentation.xml.rels').async('string');
  let contentTypesXml = await zip.file('[Content_Types].xml').async('string');

  presentationXml = presentationXml.replace(/<p:sldIdLst>[\s\S]*?<\/p:sldIdLst>/, '<p:sldIdLst></p:sldIdLst>');
  if (presentationXml.includes('<p:sldIdLst/>')) presentationXml = presentationXml.replace('<p:sldIdLst/>', '<p:sldIdLst></p:sldIdLst>');
  contentTypesXml = contentTypesXml.replace(/<Override PartName="\/ppt\/slides\/slide\d+\.xml"[\s\S]*?\/>/g, '');
  contentTypesXml = contentTypesXml.replace(/<Override PartName="\/ppt\/notesSlides\/notesSlide\d+\.xml"[\s\S]*?\/>/g, '');

  const relsHeader = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">';
  let newPresentationRels = relsHeader;
  const relMatches = presentationRels.matchAll(/<Relationship Id="(rId\d+)" Type="([^"]+)" Target="([^"]+)"\/>/g);
  let maxRId = 0;
  for (const match of relMatches) {
    const [full, id, type, target] = match;
    const idNum = parseInt(id.replace('rId', ''));
    if (idNum > maxRId) maxRId = idNum;
    if (!type.includes('/relationships/slide') || type.includes('Master') || type.includes('Layout')) newPresentationRels += `\n  ${full}`;
  }

  let sldIdList = '';
  const xmlEscape = (str) => (str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[m]));

  for (let i = 0; i < slides.length; i++) {
    const slideData = slides[i];
    const slideNum = i + 1;
    const isTitle = i === 0;
    const rId = `rId${maxRId + slideNum}`;
    const sldId = 1024 + i;
    let xml = isTitle ? slide1Xml : slide2Xml;
    let rels = isTitle ? slide1Rels : slide2Rels;

    const filledPh = new Set();
    xml = xml.replace(/<p:sp>[\s\S]*?<\/p:sp>/g, (shapeMatch) => {
      const hasPh = shapeMatch.includes('<p:ph');
      if (!hasPh) return shapeMatch;

      const isTitleShape = (shapeMatch.includes('type="title"') || shapeMatch.includes('type="ctrTitle"')) && !shapeMatch.includes('type="subTitle"');
      const isSubTitleShape = shapeMatch.includes('type="subTitle"');
      const isBodyShape = shapeMatch.includes('type="body"') || shapeMatch.includes('idx="1"');

      if (isTitleShape && !filledPh.has('title')) {
        filledPh.add('title');
        const titleFontSize = (slideData.title || '').length > 40 ? '3200' : '4400';
        const titleXml = `<a:bodyPr anchor="t" anchorCtr="1"/><a:lstStyle/><a:p><a:pPr algn="ctr"><a:defRPr sz="${titleFontSize}" b="1"/></a:pPr><a:r><a:t>${xmlEscape(sanitize(slideData.title))}</a:t></a:r></a:p>`;
        return shapeMatch.replace(/<p:txBody>[\s\S]*?<\/p:txBody>/, `<p:txBody>${titleXml}</p:txBody>`);
      } else if (isSubTitleShape && !filledPh.has('subtitle')) {
        filledPh.add('subtitle');
        if (!slideData.subtitle) return shapeMatch.replace(/<p:txBody>[\s\S]*?<\/p:txBody>/, `<p:txBody><a:bodyPr/><a:lstStyle/></p:txBody>`);
        const subXml = `<a:bodyPr anchor="t"/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1200" b="1"/></a:pPr><a:r><a:t>${xmlEscape(sanitize(slideData.subtitle.toUpperCase()))}</a:t></a:r></a:p>`;
        return shapeMatch.replace(/<p:txBody>[\s\S]*?<\/p:txBody>/, `<p:txBody>${subXml}</p:txBody>`);
      } else if (isBodyShape && !filledPh.has('body')) {
        filledPh.add('body');
        const bodyFontSize = (slideData.bullets || []).length > 10 ? '800' : ((slideData.bullets || []).length > 6 ? '1000' : '1200');
        const bodyItems = (slideData.bullets || []).map(b => `<a:p><a:pPr><a:lnSpc><a:spcPct val="120000"/></a:lnSpc><a:defRPr sz="${bodyFontSize}"/></a:pPr><a:r><a:t>${xmlEscape(sanitize(b.replace(/^[•\-\*\s]+/, '')))}</a:t></a:r></a:p>`);

        // If the template LACKS a subtitle placeholder, we prepend the subtitle to the body items
        if (!xml.includes('type="subTitle"') && slideData.subtitle) {
          bodyItems.unshift(`<a:p><a:pPr><a:lnSpc><a:spcPct val="120000"/></a:lnSpc><a:defRPr sz="${bodyFontSize}" b="1"/></a:pPr><a:r><a:t>${xmlEscape(sanitize(slideData.subtitle.toUpperCase()))}</a:t></a:r></a:p>`);
        }

        const bodyXml = `<a:bodyPr anchor="t" tIns="365760"/><a:lstStyle/>` + bodyItems.join('');
        return shapeMatch.replace(/<p:txBody>[\s\S]*?<\/p:txBody>/, `<p:txBody>${bodyXml}</p:txBody>`);
      }

      return shapeMatch;
    });

    const speakerNotes = slideData.notes || slideData.speakerNotes || slideData.speaker_note || '';

    const notesMasterFile = zip.file(/ppt\/notesMasters\/notesMaster.*\.xml/)[0];
    const notesMasterName = notesMasterFile ? notesMasterFile.name.split('/').pop() : 'notesMaster1.xml';

    // Allow speaker notes even if hasNotesMaster is missing (fallback to local notes structure)
    if (speakerNotes) {
      const notesLines = speakerNotes.split('\n');
      const notesParagraphs = notesLines.map(line => `<a:p><a:r><a:t>${xmlEscape(sanitize(line))}</a:t></a:r></a:p>`).join('');
      let notesXml = baseNotesXml ? baseNotesXml.replace(/<p:txBody>[\s\S]*?<\/p:txBody>/, `<p:txBody><a:bodyPr/><a:lstStyle/>${notesParagraphs}</p:txBody>`) : `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:notes xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvPr></p:nvGrpSpPr><p:grpSpPr/><p:sp><p:nvSpPr><p:cNvPr id="2" name="Notes Placeholder 2"/><p:cNvSpPr/><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/>${notesParagraphs}</p:txBody></p:sp></p:spTree></p:cSld></p:notes>`;
      const notesRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesMaster" Target="../notesMasters/${notesMasterName}"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="../slides/slide${slideNum}.xml"/></Relationships>`;
      zip.file(`ppt/notesSlides/notesSlide${slideNum}.xml`, notesXml);
      zip.file(`ppt/notesSlides/_rels/notesSlide${slideNum}.xml.rels`, notesRels);
      const notesRelType = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide';
      const notesRId = 'rIdNotes';
      if (!xml.includes('<p:notesSlide')) {
        xml = xml.replace('</p:sld>', `<p:notesSlide r:id="${notesRId}"/></p:sld>`);
      }
      const existingMatch = rels.match(/<Relationship Id="([^"]+)" Type="http:\/\/schemas\.openxmlformats\.org\/officeDocument\/2006\/relationships\/notesSlide"/);
      if (existingMatch) {
        rels = rels.replace(/<Relationship[^>]*?Type="http:\/\/schemas\.openxmlformats\.org\/officeDocument\/2006\/relationships\/notesSlide"[^>]*?\/>/, `<Relationship Id="${existingMatch[1]}" Type="${notesRelType}" Target="../notesSlides/notesSlide${slideNum}.xml"/>`);
      } else {
        rels = rels.replace('</Relationships>', `<Relationship Id="${notesRId}" Type="${notesRelType}" Target="../notesSlides/notesSlide${slideNum}.xml"/></Relationships>`);
      }
      if (!contentTypesXml.includes(`PartName="/ppt/notesSlides/notesSlide${slideNum}.xml"`)) {
        contentTypesXml = contentTypesXml.replace('</Types>', `<Override PartName="/ppt/notesSlides/notesSlide${slideNum}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/></Types>`);
      }
    }


    zip.file(`ppt/slides/slide${slideNum}.xml`, xml);
    zip.file(`ppt/slides/_rels/slide${slideNum}.xml.rels`, rels);
    sldIdList += `<p:sldId id="${sldId}" r:id="${rId}"/>`;
    newPresentationRels += `\n  <Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${slideNum}.xml"/>`;
    if (!contentTypesXml.includes(`PartName="/ppt/slides/slide${slideNum}.xml"`)) {
      const lastSlideEntry = contentTypesXml.lastIndexOf('<Override PartName="/ppt/slides/slide');
      if (lastSlideEntry !== -1) {
        const insertPoint = contentTypesXml.indexOf('/>', lastSlideEntry) + 2;
        contentTypesXml = contentTypesXml.substring(0, insertPoint) + `<Override PartName="/ppt/slides/slide${slideNum}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>` + contentTypesXml.substring(insertPoint);
      } else {
        contentTypesXml = contentTypesXml.replace('</Types>', `<Override PartName="/ppt/slides/slide${slideNum}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/></Types>`);
      }
    }
  }

  presentationXml = presentationXml.replace('<p:sldIdLst></p:sldIdLst>', `<p:sldIdLst>${sldIdList}</p:sldIdLst>`);
  newPresentationRels += '\n</Relationships>';
  zip.file('ppt/presentation.xml', presentationXml);
  zip.file('ppt/_rels/presentation.xml.rels', newPresentationRels);
  zip.file('[Content_Types].xml', contentTypesXml);

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * EXPORT PITCH DECK AS PPTX (TEMPLATE INJECTION)
 */
/**
 * EXPORT PITCH DECK AS PPTX
 */
export const exportAsPptx = (slides, filename, overrideBrandConfig) => withCursor(async (deps) => {
  try {
    // 1. Try Native MS Office Route (Highest Fidelity, Prioritized)
    if (deps.msOffice) {
      const { appLocalDataDir, join } = await import('@tauri-apps/api/path');
      const { readFile, writeFile } = await import('@tauri-apps/plugin-fs');
      const { save } = await import('@tauri-apps/plugin-dialog');
      
      const dataDir = await appLocalDataDir();
      const tempPath = await join(dataDir, `temp_gen.pptx`);
      
      const templatePath = await resolvePptxTemplatePath();
      await generateNativePptx(slides, tempPath, false, templatePath);
      
      const bytes = await readFile(tempPath);
      const target = await save({ defaultPath: filename, filters: [{ name: 'PowerPoint', extensions: ['pptx'] }] });
      if (target) await writeFile(target, bytes);
      return;
    }

    // 2. Fallback to XML Injection (LibreOffice / Branded Plugins)
    const blob = await generatePptxBlob(slides, overrideBrandConfig);
    if (!blob) {
      const { message, ask } = await import('@tauri-apps/plugin-dialog');
      const download = await ask('No PPTX template found. Native Office was also not detected.\n\nWould you like to download the default template pack?', { title: 'Template Required', type: 'warning' });
      if (download) {
        const { open } = await import('@tauri-apps/plugin-shell');
        await open('https://repotopitch.com/templates');
      }
      return;
    }
    const arrayBuffer = await blob.arrayBuffer();
    await saveNative(filename, new Uint8Array(arrayBuffer), true);
  } catch (e) {
    console.error('[EXPORT] PPTX Export failed:', e);
    const { message } = await import('@tauri-apps/plugin-dialog');
    await message(`PPTX Export Failed.\n\nError: ${e.message || 'An engine error occurred.'}`, { title: 'Export Error', type: 'error' });
  }
});


/**
 * EXPORT PITCH DECK AS PDF
 */
export const exportPitchAsPDF = (slides, filename) => withCursor(async (deps) => {
  try {
    // 1. Try Native MS Office Route (Highest Fidelity, Prioritized)
    if (deps.msOffice) {
      const { appLocalDataDir, join } = await import('@tauri-apps/api/path');
      const { readFile, writeFile } = await import('@tauri-apps/plugin-fs');
      const { save } = await import('@tauri-apps/plugin-dialog');
      
      const dataDir = await appLocalDataDir();
      const tempPath = await join(dataDir, `temp_gen.pdf`);
      
      const templatePath = await resolvePptxTemplatePath();
      await generateNativePptx(slides, tempPath, true, templatePath);
      
      const bytes = await readFile(tempPath);
      const target = await save({ defaultPath: filename, filters: [{ name: 'PDF', extensions: ['pdf'] }] });
      if (target) await writeFile(target, bytes);
      return;
    }

    // 2. Fallback to XML Injection -> LibreOffice Conversion
    const pptxBlob = await generatePptxBlob(slides);
    if (!pptxBlob) {
      const { message } = await import('@tauri-apps/plugin-dialog');
      await message('No PPTX template found for PDF conversion. Please ensure a template is configured or install MS Office for native export.', { title: 'Template Required', type: 'warning' });
      return;
    }
    const { success, error } = await convertOfficeToPdf(pptxBlob, 'pptx', filename);
    if (!success) throw new Error(error);
  } catch (e) {
    console.error('[EXPORT] Pitch PDF export failed:', e);
    const { message } = await import('@tauri-apps/plugin-dialog');
    await message(`PDF Export Failed: ${e.message || 'An engine error occurred.'}`, { title: 'Export Error', type: 'error' });
  }
});






async function generateNativePptx(slides, targetPath, isPdf = false, templatePath = null) {
  const { Command } = await import('@tauri-apps/plugin-shell');

  // Prepare slide data for PowerShell (Base64 to avoid escaping issues)
  const slideDataJson = JSON.stringify(slides);
  const slideDataB64 = btoa(unescape(encodeURIComponent(slideDataJson)));

  const psScript = `
    $app = New-Object -ComObject PowerPoint.Application
    # PowerPoint: ppAlertsNone = 1
    try { $app.DisplayAlerts = 1 } catch {}
    
    $tpl = "${templatePath || ''}"
    $useTemplate = $false
    $workingPath = "${targetPath}"
    if ($tpl -and (Test-Path $tpl)) {
      $useTemplate = $true
      if ("${isPdf}" -eq "True") {
        $workingPath = "${targetPath}.pptx"
      }
      Copy-Item -Path $tpl -Destination $workingPath -Force
    }

    # Helper to resolve layouts natively from slide master
    function Get-SafeLayout($pres, $layoutType) {
      try {
        $master = $pres.SlideMaster
        if ($null -eq $master -and $pres.Designs.Count -gt 0) {
          $master = $pres.Designs.Item(1).SlideMaster
        }
        if ($null -ne $master -and $master.CustomLayouts.Count -gt 0) {
          if ($layoutType -eq 1) {
            foreach ($layout in $master.CustomLayouts) {
              if ($layout.Name -like "*Title Slide*" -or $layout.Name -like "*TitleSlide*") {
                return $layout
              }
            }
            return $master.CustomLayouts.Item(1)
          } else {
            foreach ($layout in $master.CustomLayouts) {
              if ($layout.Name -like "*Content*" -or $layout.Name -like "*Text*") {
                return $layout
              }
            }
            if ($master.CustomLayouts.Count -ge 2) {
              return $master.CustomLayouts.Item(2)
            }
            return $master.CustomLayouts.Item(1)
          }
        }
      } catch {}
      return $null
    }

    try {
      $originalSlidesCount = 0
      if ($useTemplate) {
        # Open the copied template presentation (WithWindow = 0 to run silently)
        try {
          $pres = $app.Presentations.Open($workingPath, 0, 0, 0)
        } catch {
          $pres = $app.Presentations.Open($workingPath, 0, 0, -1)
        }
        $originalSlidesCount = $pres.Slides.Count
      } else {
        # Fallback: Create a blank presentation
        try {
          $pres = $app.Presentations.Add(0) 
        } catch {
          $pres = $app.Presentations.Add(-1)
        }
      }
      
      $jsonRaw = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String("${slideDataB64}"))
      $slidesData = $jsonRaw | ConvertFrom-Json
      
      $idx = 0
      foreach ($s in $slidesData) {
        $slideNum = $idx + 1
        $isTitle = $idx -eq 0
        
        $layoutType = 2
        if ($isTitle) { $layoutType = 1 }
        
        $slide = $null
        
        # 1. Duplication Pathway (Preserves layout/shapes of custom slide designs)
        if ($useTemplate -and $originalSlidesCount -gt 0) {
          $templateIndex = 1
          if (!$isTitle -and $originalSlidesCount -ge 2) {
            $templateIndex = 2
          }
          try {
            $templateSlide = $pres.Slides.Item($templateIndex)
            $dupRange = $templateSlide.Duplicate()
            $slide = $dupRange.Item(1)
            $slide.MoveTo($pres.Slides.Count)
          } catch {
            # Fallback on failure
          }
        }
        
        # 2. Layout Pathway (Standard/Fallback creation using Slide Master custom layouts)
        if ($null -eq $slide) {
          $layout = $null
          if ($useTemplate) {
            $layout = Get-SafeLayout -pres $pres -layoutType $layoutType
          }
          
          if ($null -ne $layout) {
            try {
              $slide = $pres.Slides.AddSlide($pres.Slides.Count + 1, $layout)
            } catch {
              $slide = $pres.Slides.Add($pres.Slides.Count + 1, $layoutType)
            }
          } else {
            $slide = $pres.Slides.Add($pres.Slides.Count + 1, $layoutType)
          }
        }
        
        # Populate slide title
        $titleShape = $null
        if ($s.title) {
          $titleFontSize = if ($s.title.Length -gt 40) { 32 } else { 44 }
          
          # Try resolving by placeholder type (ppPlaceholderTitle=1, ppPlaceholderCenterTitle=3)
          foreach ($sh in $slide.Shapes) {
            if ($sh.Type -eq 14) {
              $phType = $sh.PlaceholderFormat.Type
              if ($phType -eq 1 -or $phType -eq 3) {
                $titleShape = $sh
                break
              }
            }
          }
          # Fallback by name
          if ($null -eq $titleShape) {
            foreach ($sh in $slide.Shapes) {
              if ($sh.HasTextFrame -and ($sh.Name -like "*Title*")) {
                $titleShape = $sh
                break
              }
            }
          }
          # Fallback to slide's built-in Title shape range
          if ($null -eq $titleShape -and $slide.Shapes.HasTitle -eq -1) {
            $titleShape = $slide.Shapes.Title
          }
          # Fallback to first shape containing a text frame
          if ($null -eq $titleShape) {
            foreach ($sh in $slide.Shapes) {
              if ($sh.HasTextFrame) {
                $titleShape = $sh
                break
              }
            }
          }
          
          if ($null -ne $titleShape) {
            $titleShape.TextFrame.TextRange.Text = $s.title
            $titleShape.TextFrame.TextRange.Font.Size = $titleFontSize
          } elseif ($slide.Shapes.Count -gt 0) {
            try {
              $slide.Shapes.Item(1).TextFrame.TextRange.Text = $s.title
            } catch {}
          }
        }
        
        # Populate bullets / body
        $bulletCount = if ($s.bullets) { $s.bullets.Count } else { 0 }
        $fontSize = if ($bulletCount -gt 10) { 10 } elseif ($bulletCount -gt 6) { 12 } else { 14 }
        
        $body = ""
        if ($s.subtitle) { $body += $s.subtitle + "\`n" }
        if ($s.bullets) {
          foreach ($b in $s.bullets) {
            $cleaned = $b -replace '^[•\\-\\*\\s]+', ''
            $body += "• " + $cleaned + "\`n"
          }
        }
        
        if ($body) {
          $bodyShape = $null
          # Try placeholder types (ppPlaceholderBody=2, ppPlaceholderObject=7, ppPlaceholderSubtitle=4)
          foreach ($sh in $slide.Shapes) {
            if ($sh.Type -eq 14) {
              $phType = $sh.PlaceholderFormat.Type
              if ($phType -eq 2 -or $phType -eq 7 -or $phType -eq 4) {
                if ($null -eq $titleShape -or $sh.Name -ne $titleShape.Name) {
                  $bodyShape = $sh
                  break
                }
              }
            }
          }
          # Fallback by name
          if ($null -eq $bodyShape) {
            foreach ($sh in $slide.Shapes) {
              if ($sh.HasTextFrame -and ($sh.Name -like "*Content*" -or $sh.Name -like "*Body*" -or $sh.Name -like "*Object*")) {
                if ($null -eq $titleShape -or $sh.Name -ne $titleShape.Name) {
                  $bodyShape = $sh
                  break
                }
              }
            }
          }
          # Fallback to second shape with text frame
          if ($null -eq $bodyShape) {
            $textShapes = @()
            foreach ($sh in $slide.Shapes) {
              if ($sh.HasTextFrame -and ($null -eq $titleShape -or $sh.Name -ne $titleShape.Name)) {
                $textShapes += $sh
              }
            }
            if ($textShapes.Count -gt 0) {
              $bodyShape = $textShapes[0]
            }
          }
          
          if ($null -ne $bodyShape) {
            $bodyShape.TextFrame.TextRange.ParagraphFormat.Bullet.Visible = 0
            $bodyShape.TextFrame.TextRange.Font.Size = $fontSize
            $bodyShape.TextFrame.TextRange.ParagraphFormat.LineRuleWithin = $true
            $bodyShape.TextFrame.TextRange.ParagraphFormat.SpaceWithin = 1.2
            $bodyShape.TextFrame.TextRange.Text = $body
          }
        }
        
        # Populate speaker notes
        $notesText = $s.notes -join "\`n"
        if (!$notesText) { $notesText = $s.speakerNotes }
        if (!$notesText) { $notesText = $s.speaker_note }
        if ($notesText) {
          try {
            $slide.NotesPage.Shapes.Placeholders.Item(2).TextFrame.TextRange.Text = $notesText
          } catch {}
        }
        
        $idx++
      }
      
      # Clean up original template slides
      if ($useTemplate -and $originalSlidesCount -gt 0) {
        for ($i = 1; $i -le $originalSlidesCount; $i++) {
          try { $pres.Slides.Item(1).Delete() } catch {}
        }
      }

      if ("${isPdf}" -eq "True") {
        # ExportAsFixedFormat(Path, FixedFormatType=2 (PDF), Intent=1, Frame=0, Start=1, End=1, OutputType=1 (Slides), ...)
        $m = [System.Type]::Missing
        $bindingFlags = [System.Reflection.BindingFlags]::InvokeMethod
        $params = @("${targetPath}", [int]2, [int]1, [int]0, [int]1, [int]1, [int]0, $m, [int]1, $m, $true, $true, $true, $true, $false)
        try {
           $pres.GetType().InvokeMember("ExportAsFixedFormat", $bindingFlags, $null, $pres, $params)
        } catch {
           $pres.SaveAs("${targetPath}", 32)
        }
      } else {
        $pres.SaveAs($workingPath)
      }
      $pres.Close()
      
      # Clean up the working file if it was a temporary PPTX file
      if ($useTemplate -and "${isPdf}" -eq "True") {
        try { Remove-Item -Path $workingPath -Force } catch {}
      }
    } catch {
      throw $_
    } finally {
      $app.Quit()
    }
  `;

  const cmd = Command.create('powershell', ['-Command', psScript]);
  const result = await cmd.execute();
  if (result.code !== 0) throw new Error(result.stderr);
}

