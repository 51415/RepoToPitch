import React, { useState, useEffect } from 'react'
import { useStore } from '../lib/store'
import { checkExportDependencies, downloadLibreOffice } from '../lib/dependencyCheck'
import { Btn } from './UI'

export default function SetupWizard() {
  const { setSetupComplete } = useStore()
  const [status, setStatus] = useState('checking') // checking, missing, ready
  const [deps, setDeps] = useState(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    async function runCheck() {
      const results = await checkExportDependencies()
      setDeps(results)
      if (results.msOffice || results.libreOffice) {
        // SILENT SUCCESS: Proceed automatically without showing wizard
        setSetupComplete(true)
      } else {
        setStatus('missing')
      }
    }
    runCheck()
  }, [])

  const handleDownload = async () => {
    setDownloading(true)
    await downloadLibreOffice()
    // Since download opens a browser, we'll give the user a way to "Verify" again
    const reCheck = await checkExportDependencies()
    if (reCheck.msOffice || reCheck.libreOffice) {
      setDeps(reCheck)
      setStatus('ready')
    }
    setDownloading(false)
  }

  const handleFinish = () => {
    setSetupComplete(true)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'var(--bg-0)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 40
    }}>
      <div style={{
        maxWidth: 600, width: '100%', background: 'var(--bg-1)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 48, boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column', gap: 32
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: 48, marginBottom: 24, 
            background: 'linear-gradient(135deg, var(--accent), #f59e0b)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            fontWeight: 900, fontFamily: 'var(--font-display)'
          }}>
            RepoToPitch
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
            FINALIZING INSTALLATION
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 8 }}>
            VERIFYING PROFESSIONAL BRANDING SUBSYSTEMS
          </p>
        </div>

        {status === 'checking' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div className="spin" style={{ fontSize: 32, marginBottom: 16 }}>⚙️</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>INITIALIZING DEPENDENCY CHECK...</div>
          </div>
        )}

        {status === 'missing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ 
              background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', 
              padding: 24, borderRadius: 8, color: '#f59e0b'
            }}>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>REQUIRED COMPONENT MISSING</div>
              <p style={{ fontSize: 12, margin: 0, lineHeight: 1.5, color: 'var(--text-2)' }}>
                Professional PDF branding requires an Office Engine to generate high-fidelity layouts. 
                Neither **Microsoft Office** nor **LibreOffice** was detected on your system.
              </p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Btn onClick={handleDownload} disabled={downloading}>
                {downloading ? 'OPENING DOWNLOAD PAGE...' : 'DOWNLOAD BRANDING SUPPORT PACKAGE'}
              </Btn>
              <button 
                onClick={() => setStatus('ready')} // Let them skip if they really want
                style={{ 
                  background: 'transparent', border: 'none', color: 'var(--text-3)', 
                  fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-mono)',
                  textDecoration: 'underline'
                }}
              >
                CONTINUE WITH BASIC ENGINE (NOT RECOMMENDED)
              </button>
            </div>
          </div>
        )}

        {status === 'ready' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ 
              background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', 
              padding: 24, borderRadius: 8, color: '#10b981', textAlign: 'center'
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>SYSTEM READY</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>
                {deps?.msOffice ? 'Native MS Office engine detected.' : 'LibreOffice engine detected.'}
              </div>
            </div>
            <Btn variant="primary" onClick={handleFinish}>
              LAUNCH REPOTOPITCH →
            </Btn>
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 10, color: 'var(--text-3)', margin: 0 }}>
            v1.1.2 // INTERNAL BRANDING PIPELINE // PROD_BUILD
          </p>
        </div>
      </div>
    </div>
  )
}
