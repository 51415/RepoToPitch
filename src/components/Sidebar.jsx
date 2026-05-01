import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '../lib/store'
import { Btn } from './UI'
import { exportAsJSON, exportAsPptx, exportPitchAsPDF, exportAsMarkdown, exportAsPDF } from '../lib/exportUtils'

const STEPS = [
  { id: 0, label: 'Dashboard',    sub: 'PROJECTS', icon: '/icons/icon_workflow_full.png' },
  { id: 1, label: 'Repositories', sub: 'SOURCES',  icon: '/icons/icon_repos_generic.png' },
  { id: 2, label: 'Analyse',      sub: 'MODELS',   icon: '/icons/icon_analyze_code.png' },
  { id: 3, label: 'Context',      sub: 'FOUNDER',  icon: '/icons/icon_founder_strategy.png' },
  { id: 4, label: 'Synthesis',    sub: 'PRD GEN',  icon: '/icons/icon_code_editor_ui.png' },
  { id: 5, label: 'Pitch',        sub: 'OUTPUT',   icon: '/icons/icon_export_prd.png' },
]

const ARTIFACT_TABS = [
  { id: 'project-overview', label: 'System Overview' },
  { id: 'prd', label: 'Master PRD' },
  { id: 'arch', label: 'Architecture' },
  { id: 'comp', label: 'Competition' },
  { id: 'gtm', label: 'Go-To-Market' },
  { id: 'risk', label: 'Risk Register' },
  { id: 'privacy', label: 'Data & Privacy' },
  { id: 'api', label: 'API Documentation' },
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'pitch', label: 'Pitch Schematic' },
]

export default function Sidebar() {
  const { 
    currentStep, setStep, modelCode, modelArtifacts, repos, masterPrd, 
    tasks, masterPageTab, setMasterPageTab, pitchSlides, projectOverview,
    techArchitecture, goToMarket, competitivePositioning, riskRegister, 
    dataPrivacy, apiDocs, onboardingGuide,
    addTask, updateTask, removeTask,
    showSettings, setShowSettings, projectName, isDirty, saveProject, resetProject,
    triggerSettingsFlash
  } = useStore()

  const handleSidebarAction = (action) => {
    if (showSettings) {
      triggerSettingsFlash()
      return
    }
    action()
  }
  
  const isGenerating = tasks.some(t => t.status === 'active')

  const [width, setWidth] = useState(() => parseInt(localStorage.getItem('sidebar-width') || '280'))
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true')
  const [isResizing, setIsResizing] = useState(false)
  
  const sidebarRef = useRef(null)

  useEffect(() => {
    const root = document.documentElement
    const finalWidth = isCollapsed ? 80 : width
    root.style.setProperty('--sidebar-width', `${finalWidth}px`)
    localStorage.setItem('sidebar-width', width.toString())
    localStorage.setItem('sidebar-collapsed', isCollapsed.toString())
  }, [width, isCollapsed])

  const startResizing = useCallback((e) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  const stopResizing = useCallback(() => {
    setIsResizing(false)
  }, [])

  const resize = useCallback((e) => {
    if (isResizing) {
      const newWidth = Math.min(Math.max(e.clientX, 240), 480)
      setWidth(newWidth)
    }
  }, [isResizing])

  useEffect(() => {
    window.addEventListener('mousemove', resize)
    window.addEventListener('mouseup', stopResizing)
    return () => {
      window.removeEventListener('mousemove', resize)
      window.removeEventListener('mouseup', stopResizing)
    }
  }, [resize, stopResizing])

  const isUnlocked = (id) => {
    if (id === 0) return true
    if (id === 1) return true
    if (id === 2) return (!!modelCode || !!modelArtifacts) && repos.some(r => r.treeData?.length > 0)
    if (id === 3) return repos.some(r => r.overview)
    if (id === 4) return repos.some(r => r.overview)
    if (id === 5) return !!masterPrd
    return false
  }

  const exportAllArtifacts = async () => {
    const sections = [
      { title: 'System Overview', content: projectOverview },
      { title: 'Master PRD', content: masterPrd },
      { title: 'Architecture', content: techArchitecture },
      { title: 'Competitive Positioning', content: competitivePositioning },
      { title: 'Go-To-Market Strategy', content: goToMarket },
      { title: 'Risk Register', content: riskRegister },
      { title: 'Data & Privacy', content: dataPrivacy },
      { title: 'API Documentation', content: apiDocs },
      { title: 'Onboarding Guide', content: onboardingGuide }
    ]
    
    const parts = sections
      .filter(s => {
        const has = !!s.content
        return has
      })
      .map(s => `# ${s.title}\n\n${s.content}`)
      
    if (parts.length > 0) {
      await exportAsMarkdown(parts.join('\n\n---\n\n'), 'project-artifacts.md')
    }
  }

  const finalWidth = isCollapsed ? 80 : width

  return (
    <aside 
      ref={sidebarRef}
      style={{
        width: finalWidth, minWidth: isCollapsed ? 80 : 240,
        background: 'var(--bg-1)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        height: '100vh', position: 'fixed', left: 0, top: 0,
        zIndex: 100,
        transition: isResizing ? 'none' : 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div className="resize-handle" onMouseDown={startResizing} />
      
      {/* Top Section - Logo & Flow */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ 
          padding: isCollapsed ? '32px 0' : '32px 24px', 
          borderBottom: '1px solid var(--border)',
          textAlign: isCollapsed ? 'center' : 'left',
          display: 'flex', flexDirection: 'column', alignItems: isCollapsed ? 'center' : 'flex-start'
        }}>
          <div 
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', justifyContent: 'center', gap: 4 }}
          >
            {isCollapsed ? (
              <img src="/icons/r2p_branding_icon.png" style={{ width: 24, height: 24, objectFit: 'contain' }} alt="logo" />
            ) : (
              <>
                <img src="/icons/main logo.png?v=2" style={{ height: 48, maxWidth: '100%', objectFit: 'contain' }} alt="RepoToPitch" />
                <div style={{ 
                  fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 900, 
                  letterSpacing: '-0.04em', color: '#000', marginTop: 4 
                }}>
                  Repo<span style={{ color: 'var(--accent)' }}>To</span>Pitch
                </div>
              </>
            )}
          </div>
          {!isCollapsed && (
            <>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-3)', marginTop: 20, fontWeight: 800, letterSpacing: '0.1em' }}>Project Name</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)', marginBottom: 20, letterSpacing: '0.02em' }}>{projectName || 'Unnamed Project'}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                <Btn 
                   variant="primary"
                   size="sm"
                   style={{ fontSize: 9, padding: '6px 10px', height: 28 }}
                   onClick={() => handleSidebarAction(() => {
                     if (isDirty) {
                       if (!confirm('You have unsaved changes. Start new project?')) return
                     }
                     resetProject()
                   })}
                   disabled={isGenerating}
                >
                   New Project
                </Btn>
                <Btn 
                   variant={isDirty ? "accent" : "secondary"} 
                   size="sm"
                   style={{ fontSize: 9, padding: '6px 10px', height: 28 }}
                   onClick={() => handleSidebarAction(async () => { 
                     let name = projectName;
                     if (!name) name = prompt('Enter project name to save:'); 
                     if (name) await saveProject(name); 
                   })}
                   disabled={isGenerating}
                >
                   {isDirty ? 'Save Changes*' : 'Project Saved'}
                </Btn>
                <Btn 
                   variant="secondary" 
                   size="sm" 
                   style={{ fontSize: 10, padding: '6px 10px', height: 28, color: 'var(--text-3)', borderColor: 'var(--border-strong)' }}
                   onClick={() => handleSidebarAction(() => {
                     if (isDirty) {
                       if (!confirm('You have unsaved changes. RE-INITIALISE will erase current progress. Continue?')) return
                     }
                     resetProject()
                   })}
                   disabled={isGenerating}
                >
                   Re-initialise
                </Btn>
              </div>
            </>
          )}
        </div>

        <nav style={{ padding: '20px 0' }}>
          {STEPS.map((step) => {
            const active = currentStep === step.id
            const unlocked = isUnlocked(step.id)
            return (
              <div key={step.id}>
                <div 
                  onClick={() => handleSidebarAction(() => unlocked && setStep(step.id))}
                  title={isCollapsed ? step.label : ''}
                  style={{
                    padding: isCollapsed ? '12px 0' : '12px 24px',
                    cursor: unlocked ? 'pointer' : 'not-allowed',
                    background: active ? 'var(--bg)' : 'transparent',
                    borderLeft: !isCollapsed && active ? '4px solid var(--accent)' : '4px solid transparent',
                    opacity: unlocked ? 1 : 0.3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    gap: 16,
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {isCollapsed ? (
                    <img 
                      src={step.icon} 
                      style={{ width: 20, height: 20, filter: active ? 'none' : 'grayscale(1)', opacity: active ? 1 : 0.7 }} 
                      alt={step.label} 
                    />
                  ) : (
                    <>
                       <img 
                        src={step.icon} 
                        style={{ width: 16, height: 16, filter: active ? 'none' : 'grayscale(1)', opacity: active ? 1 : 0.6 }} 
                        alt={step.label} 
                      />
                      <span style={{ 
                        fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: active ? 800 : 700, 
                        color: active ? 'var(--text)' : 'var(--text-2)',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap'
                      }}>
                        {step.label}
                      </span>
                    </>
                  )}
                </div>
                
                {/* Step 1: Repos Sub-menu */}
                {!isCollapsed && active && step.id === 1 && (
                  <div style={{ padding: '8px 24px 16px 48px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {repos.map(r => (
                      <div 
                        key={r.id}
                        onClick={() => handleSidebarAction(() => {
                          setStep(1)
                          useStore.getState().setActiveRepoId(r.id)
                          setTimeout(() => {
                            const el = document.getElementById(`repo-card-${r.id}`)
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                          }, 100)
                        })}
                        style={{ 
                          fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, 
                          color: 'var(--text-3)', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}
                      >
                        → {r.name || 'Unnamed'}
                      </div>
                    ))}
                  </div>
                )}

                {/* Step 2: Analyse Sub-menu */}
                {!isCollapsed && active && step.id === 2 && (
                  <div style={{ padding: '8px 24px 16px 48px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {repos.map(r => (
                      <div 
                        key={r.id}
                        onClick={() => handleSidebarAction(() => {
                          setStep(2)
                          useStore.getState().setActiveAnalyseRepoId(r.id)
                          setTimeout(() => {
                            const el = document.getElementById(`repo-panel-${r.id}`)
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                          }, 100)
                        })}
                        style={{ 
                          fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, 
                          color: 'var(--text-3)', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}
                      >
                        → {r.name || 'Unnamed'}
                      </div>
                    ))}
                  </div>
                )}

                
                {!isCollapsed && active && step.id === 4 && (
                  <div style={{ padding: '8px 24px 16px 48px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {ARTIFACT_TABS.map(tab => (
                      <div 
                        key={tab.id}
                        onClick={() => handleSidebarAction(() => setMasterPageTab(tab.id))}
                        style={{ 
                          fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: masterPageTab === tab.id ? 800 : 700, 
                          color: masterPageTab === tab.id ? 'var(--accent)' : 'var(--text-3)', cursor: 'pointer'
                        }}
                      >
                        → {tab.label}
                      </div>
                    ))}
                    <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                    <div 
                      onClick={() => handleSidebarAction(() => {
                        const hasContent = !!(projectOverview || masterPrd || techArchitecture || goToMarket || competitivePositioning || riskRegister || dataPrivacy || apiDocs || onboardingGuide)
                        if (!isGenerating && hasContent) exportAllArtifacts()
                      })}
                      style={{ 
                        fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 800, 
                        color: (projectOverview || masterPrd || techArchitecture || goToMarket || competitivePositioning || riskRegister || dataPrivacy || apiDocs || onboardingGuide) ? (isGenerating ? 'var(--text-3)' : 'var(--text-2)') : 'var(--text-3)', 
                        cursor: (!isGenerating && (projectOverview || masterPrd || techArchitecture || goToMarket || competitivePositioning || riskRegister || dataPrivacy || apiDocs || onboardingGuide)) ? 'pointer' : 'default',
                        opacity: (projectOverview || masterPrd || techArchitecture || goToMarket || competitivePositioning || riskRegister || dataPrivacy || apiDocs || onboardingGuide) ? (isGenerating ? 0.3 : 1) : 0.5
                      }}
                    >
                      Export All (.md)
                    </div>
                  </div>
                )}

                {!isCollapsed && active && step.id === 5 && (
                  <div style={{ padding: '8px 24px 16px 48px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div 
                      onClick={() => handleSidebarAction(() => !isGenerating && pitchSlides.length > 0 && exportPitchAsPDF(pitchSlides, 'pitch-deck.pdf'))}
                      style={{ 
                        fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, 
                        color: (pitchSlides.length > 0) ? (isGenerating ? 'var(--text-3)' : 'var(--text-2)') : 'var(--text-3)', 
                        cursor: (!isGenerating && pitchSlides.length > 0) ? 'pointer' : 'default',
                        opacity: (pitchSlides.length > 0) ? (isGenerating ? 0.3 : 1) : 0.5
                      }}
                    >
                      DOWNLOAD PDF
                    </div>
                    <div 
                      onClick={() => handleSidebarAction(() => !isGenerating && pitchSlides.length > 0 && exportAsPptx(pitchSlides, 'pitch-deck.pptx'))}
                      style={{ 
                        fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, 
                        color: (pitchSlides.length > 0) ? (isGenerating ? 'var(--text-3)' : 'var(--text-2)') : 'var(--text-3)', 
                        cursor: (!isGenerating && pitchSlides.length > 0) ? 'pointer' : 'default',
                        opacity: (pitchSlides.length > 0) ? (isGenerating ? 0.3 : 1) : 0.5
                      }}
                    >
                      EXPORT PPTX
                    </div>
                    <div 
                      onClick={() => handleSidebarAction(() => !isGenerating && pitchSlides.length > 0 && exportAsJSON(pitchSlides, 'pitch-deck.json'))}
                      style={{ 
                        fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, 
                        color: (pitchSlides.length > 0) ? (isGenerating ? 'var(--text-3)' : 'var(--text-2)') : 'var(--text-3)', 
                        cursor: (!isGenerating && pitchSlides.length > 0) ? 'pointer' : 'default',
                        opacity: (pitchSlides.length > 0) ? (isGenerating ? 0.3 : 1) : 0.5
                      }}
                    >
                      DOWNLOAD JSON
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Queued Tasks */}
        {!isCollapsed && tasks && tasks.length > 0 && (
          <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-1)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.12em', marginBottom: 12, fontWeight: 800 }}>
              [QUEUED_TASKS]
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tasks.map(t => (
                <div key={t.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontWeight: 800 }}>
                    <span style={{ color: t.status === 'error' ? 'var(--danger)' : 'var(--text-2)', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
                    <span style={{ color: t.status === 'error' ? 'var(--danger)' : 'var(--accent)', flexShrink: 0 }}>
                      {t.status === 'active' ? `[${Math.round((t.progress || 0) * 100)}%]` : `[${(t.status || 'PENDING').toUpperCase()}]`}
                    </span>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg-3)', width: '100%', position: 'relative', borderRadius: 2 }}>
                    <div style={{ 
                      height: '100%', background: t.status === 'error' ? 'var(--danger)' : 'var(--accent)', 
                      width: `${(t.progress || 0) * 100}%`, transition: 'width 0.2s',
                      borderRadius: 2
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section - Settings & Status */}
      <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-1)', flexShrink: 0 }}>
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            width: '100%', padding: isCollapsed ? '20px 0' : '20px 24px', 
            border: 'none', background: showSettings ? 'var(--accent-soft)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: 16, cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <img src="/icons/icon_settings_ai.png" style={{ width: 18, height: 18, opacity: showSettings ? 1 : 0.7 }} alt="settings" />
          {!isCollapsed && (
            <span style={{ 
              fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 800, 
              color: showSettings ? 'var(--accent-deep)' : 'var(--text-2)',
              letterSpacing: '0.05em'
            }}>
              SETTINGS
            </span>
          )}
        </button>
      </div>
    </aside>
  )
}
