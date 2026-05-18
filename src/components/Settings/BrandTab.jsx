import React, { useState, useEffect } from 'react'
import { Btn } from '../UI'
import { checkExportDependencies, downloadLibreOffice } from '../../lib/dependencyCheck'

export default function BrandTab({
  localBrandConfig,
  setLocalBrandConfig,
  handleSelectTemplate
}) {
  const [engineStatus, setEngineStatus] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const refreshStatus = async () => {
    setRefreshing(true)
    const status = await checkExportDependencies()
    setEngineStatus(status)
    setRefreshing(false)
  }

  useEffect(() => {
    refreshStatus()
  }, [])
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 700 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, margin: 0, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, var(--accent), #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            BRAND STUDIO
          </h2>
          <div style={{ background: 'var(--accent-soft)', color: 'var(--accent)', padding: '2px 8px', fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 900, borderRadius: 4 }}>
            PRO_OVERLAYS
          </div>


        </div>
        <p style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 11, margin: 0 }}>
          HIGH-FIDELITY EXPORT STYLING & DYNAMIC TEMPLATE BINDING ENGINE (DOCX, PPTX & PDF)
        </p>
      </div>

      <div style={{ 
        background: 'var(--bg-1)', border: '1px solid var(--border)', padding: 32, 
        borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 28,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
      }}>
        <div>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', fontWeight: 800, display: 'block', marginBottom: 16, letterSpacing: '0.05em' }}>
            // ADD YOUR TEMPLATES
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Word Template Box */}
            <div 
              onClick={() => handleSelectTemplate('docx')}
              style={{ 
                border: '2px dashed var(--border)', padding: 24, 
                textAlign: 'center', background: 'var(--bg-2)', borderRadius: 8, cursor: 'pointer',
                transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ fontSize: 24 }}>📄</div>
              {localBrandConfig?.templates?.docx ? (
                <>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 800, color: 'var(--accent)', wordBreak: 'break-all' }}>
                    {localBrandConfig.templates.docx.split(/[\\/]/).pop()}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                    Click to choose or drag and drop a different Word template
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 800, color: 'var(--text)' }}>
                    Add your Word template (.docx)
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                    Click to choose your file
                  </div>
                </>
              )}
            </div>

            {/* PowerPoint Template Box */}
            <div 
              onClick={() => handleSelectTemplate('pptx')}
              style={{ 
                border: '2px dashed var(--border)', padding: 24, 
                textAlign: 'center', background: 'var(--bg-2)', borderRadius: 8, cursor: 'pointer',
                transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ fontSize: 24 }}>📊</div>
              {localBrandConfig?.templates?.pptx ? (
                <>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 800, color: 'var(--accent)', wordBreak: 'break-all' }}>
                    {localBrandConfig.templates.pptx.split(/[\\/]/).pop()}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                    Click to choose or drag and drop a different PowerPoint template
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 800, color: 'var(--text)' }}>
                    Add your PowerPoint template (.pptx)
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                    Click to choose your file
                  </div>
                </>
              )}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', fontStyle: 'italic', marginTop: -10, paddingLeft: 4, lineHeight: 1.5 }}>
              Tip: To enable speaker notes in your exports, ensure your template is "Notes-Ready". 
              Simply open your PPTX in PowerPoint, add a single note to any slide, and save it before uploading.
            </div>
          </div>
        <div>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', fontWeight: 800, display: 'block', marginBottom: 16, letterSpacing: '0.05em' }}>
            // PDF ENGINE STATUS
          </label>
          <div style={{ 
            background: 'var(--bg-2)', border: '1px solid var(--border)', 
            padding: '16px 20px', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 10, height: 10, borderRadius: '50%', 
                background: (engineStatus?.msOffice || engineStatus?.libreOffice) ? '#10b981' : '#f59e0b',
                boxShadow: (engineStatus?.msOffice || engineStatus?.libreOffice) ? '0 0 10px #10b981' : '0 0 10px #f59e0b'
              }} />
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}>
                {engineStatus?.msOffice ? 'MS OFFICE NATIVE (READY)' : (engineStatus?.libreOffice ? 'LIBREOFFICE CLI (READY)' : 'JS-DRAW ENGINE (BASIC)')}
              </div>
            </div>
            {!(engineStatus?.msOffice || engineStatus?.libreOffice) ? (
              <Btn 
                onClick={async () => {
                  await downloadLibreOffice()
                  setTimeout(refreshStatus, 2000)
                }}
                style={{ fontSize: 9, padding: '6px 12px' }}
              >
                UPGRADE ENGINE
              </Btn>
            ) : (
              <button 
                onClick={refreshStatus}
                disabled={refreshing}
                style={{ 
                  background: 'transparent', border: 'none', color: 'var(--accent)', 
                  cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-mono)'
                }}
              >
                {refreshing ? '...' : 'REFRESH'}
              </button>
            )}
          </div>
          <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 8, fontStyle: 'italic' }}>
            {engineStatus?.msOffice ? 'Using locally installed Word/PowerPoint for maximum fidelity.' : (engineStatus?.libreOffice ? 'Using LibreOffice for high-fidelity conversion.' : 'Install MS Office or LibreOffice for professional template-based PDF exports.')}
          </p>
        </div>
        </div>
      </div>
    </div>
  )
}
