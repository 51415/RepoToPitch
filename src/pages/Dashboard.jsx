import { useState } from 'react'
import { useStore } from '../lib/store'
import { Btn, Card, Modal, Input } from '../components/UI'

export default function Dashboard() {
  const { 
    resetProject, setStep, setAutoPicker, setProjectName, importProjectData,
    setProjectFilePath 
  } = useStore()

  const [isNaming, setIsNaming] = useState(false)
  const [tempName, setTempName] = useState('')

  const handleStartNew = () => {
    setTempName('')
    setIsNaming(true)
  }

  const confirmName = async () => {
    if (!tempName.trim()) return
    setIsNaming(false)
    
    resetProject()
    setProjectName(tempName)
    
    try {
      const { save } = await import('@tauri-apps/plugin-dialog')
      const path = await save({
        defaultPath: `${tempName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`,
        filters: [{ name: 'Project', extensions: ['json'] }]
      })
      if (path) {
        setProjectFilePath(path)
        setAutoPicker(true)
        setStep(1) // Move to Repos
      }
    } catch (e) {
      console.error('FAILED TO SET INITIAL PROJECT PATH:', e)
    }
  }

  const handleOpenFile = async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog')
      const { readTextFile } = await import('@tauri-apps/plugin-fs')
      
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Project', extensions: ['json'] }]
      })

      if (selected) {
        const content = await readTextFile(selected)
        const project = JSON.parse(content)
        if (project.id && project.name) {
          importProjectData(project)
          setStep(1) // Move to Repos
        } else {
          const { message } = await import('@tauri-apps/plugin-dialog')
          await message('Invalid project file: missing ID or Name', { title: 'Error', type: 'error' })
        }
      }
    } catch (e) {
      console.error('FAILED TO OPEN PROJECT FILE:', e)
    }
  }

  return (
    <div className="stage-container">
      <div style={{ textAlign: 'center', marginBottom: 48, marginTop: 20 }}>
        <h1 style={{ 
          fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 900, 
          color: 'var(--text)', lineHeight: 1, marginBottom: 16,
          letterSpacing: '-0.05em' 
        }}>
          Project Hub
        </h1>
        <p style={{ 
          color: 'var(--text-3)', fontSize: 13, fontFamily: 'var(--font-mono)', 
          fontWeight: 700, letterSpacing: '0.1em', maxWidth: 600, margin: '0 auto' 
        }}>
          Resume architectural analysis or initialise a new repository deconstruction.
        </p>
      </div>

      <div className="autofit-grid" style={{ maxWidth: 800, margin: '0 auto' }}>
        <Card 
          style={{ cursor: 'pointer', alignItems: 'center', textAlign: 'center' }} 
          onClick={handleStartNew}
          accent
        >
          <div style={{ fontSize: 48, marginBottom: 8 }}>🆕</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900, marginBottom: 8 }}>New Project</h2>
          <p style={{ color: 'var(--text-3)', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 800, letterSpacing: '0.05em' }}>[Start Fresh Audit]</p>
        </Card>
        
        <Card 
          style={{ cursor: 'pointer', alignItems: 'center', textAlign: 'center' }} 
          onClick={handleOpenFile}
        >
          <div style={{ fontSize: 48, marginBottom: 8 }}>📂</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Open Project</h2>
          <p style={{ color: 'var(--text-3)', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 800, letterSpacing: '0.05em' }}>[Load Existing Node]</p>
        </Card>
      </div>

      <Modal 
        isOpen={isNaming} 
        onClose={() => setIsNaming(false)}
        title="Initialise New Project"
        footer={(
          <>
            <Btn variant="secondary" onClick={() => setIsNaming(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={confirmName} disabled={!tempName.trim()}>Continue</Btn>
          </>
        )}
      >
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginBottom: 12, fontWeight: 700 }}>
          Project Identifier
        </div>
        <Input 
          autoFocus 
          value={tempName} 
          onChange={setTempName} 
          placeholder="e.g. My New Project" 
          onKeyDown={(e) => e.key === 'Enter' && confirmName()}
        />
        <div style={{ marginTop: 16, fontSize: 10, color: 'var(--text-3)', lineHeight: 1.6 }}>
          This name will be used as the default filename for your project data.
        </div>
      </Modal>
    </div>
  )
}
