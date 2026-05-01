import { useState, useEffect } from 'react'
import { useStore } from '../lib/store'
import { Btn, Card, Input, SectionTitle, Tag, Spinner, StatusLog } from '../components/UI'
import { FolderTree } from '../components/FolderTree'
import { pickDirectory, smartScan, smartGuessRole } from '../lib/storageUtils'
import { getOS } from '../lib/folderUtils'

function RepoCard({ repo, allRepos, onUpdate, onRemove, onToggleIgnore, globalMaxDepth }) {
  const { activeRepoId, setActiveRepoId, tasks } = useStore()
  const open = activeRepoId === repo.id
  const isGenerating = tasks.some(t => t.status === 'active')
  const [collapsed, setCollapsed] = useState(new Set())

  const toggleCollapse = (path) => {
    const next = new Set(collapsed)
    if (next.has(path)) next.delete(path)
    else next.add(path)
    setCollapsed(next)
  }

  const expandAll = () => setCollapsed(new Set())
  const collapseAll = () => {
    const all = new Set()
    const walk = (nodes) => {
      nodes.forEach(n => {
        if (n.kind === 'directory') {
          all.add(n.path)
          if (n.children) walk(n.children)
        }
      })
    }
    walk(repo.treeData)
    setCollapsed(all)
  }

  const otherRepos = allRepos.filter(r => r.id !== repo.id && r.name)
  const toggleCalls = (id) => {
    const calls = repo.calls.includes(id) ? repo.calls.filter(c => c !== id) : [...repo.calls, id]
    onUpdate({ calls })
  }

  const roleColor = repo.role === 'frontend' ? 'var(--accent)' : 'var(--success)'

  return (
    <Card 
      id={`repo-card-${repo.id}`}
      style={{ 
        borderColor: open ? 'var(--accent)' : 'var(--accent)', // Always blue now
        position: 'relative',
        padding: '24px 32px',
        marginBottom: 20
      }} 
    >
      {/* Structural Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: open ? 24 : 0 }}>
        <div style={{ width: 12, height: 2, background: 'var(--accent)' }} />
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Input
              value={repo.name}
              onChange={(v) => onUpdate({ name: v })}
              placeholder={repo.role === 'frontend' ? 'e.g. web-app' : 'e.g. auth-api'}
              style={{ fontSize: 13, fontWeight: 800, padding: '2px 0', border: 'none', background: 'transparent', color: 'var(--text)' }}
            />
            {repo.role && (
              <Tag color={repo.role === 'frontend' ? 'accent' : 'indigo'}>
                {repo.role === 'api' ? 'Api Service' : repo.role}
              </Tag>
            )}
          </div>
          {repo.path && (
            <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', fontWeight: 700 }}>
              PATH // {repo.path.toUpperCase()}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', height: 36, 
            border: '1px solid var(--border-strong)', background: 'var(--bg-1)', 
            padding: '0 12px', borderRadius: 'var(--radius)' 
          }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-3)', letterSpacing: '0.05em' }}>ROLE //</span>
            <select 
              value={repo.role} 
              onChange={(e) => onUpdate({ role: e.target.value })}
              style={{
                padding: '0 4px', border: 'none',
                fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 800,
                background: 'transparent', color: 'var(--text)', cursor: 'pointer', outline: 'none',
                height: '100%', flexShrink: 0
              }}
              disabled={isGenerating}
            >
              <option value="">[Select]</option>
              <option value="frontend">Frontend</option>
              <option value="api">API Service</option>
            </select>
          </div>

          <Btn 
            variant="secondary" 
            size="sm" 
            onClick={async () => {
              try {
                const handle = await pickDirectory()
                const treeData = await smartScan(handle, 0, globalMaxDepth, [], getOS())
                onUpdate({
                  name: handle.name,
                  path: handle.name,
                  treeData
                })
              } catch (e) {
                if (e.name !== 'AbortError') alert('Permission denied.')
              }
            }}
            style={{ height: 36, fontSize: 11 }}
            disabled={isGenerating}
          >
            RE-SCAN
          </Btn>
          <Btn variant="ghost" onClick={() => setActiveRepoId(activeRepoId === repo.id ? null : repo.id)} style={{ width: 36, height: 36, padding: 0, justifyContent: 'center', fontSize: '18px', fontWeight: 800 }}>
            {open ? '—' : '+'}
          </Btn>
          <Btn variant="danger" onClick={onRemove} style={{ width: 36, height: 36, padding: 0, justifyContent: 'center', fontSize: '12px' }} disabled={isGenerating}>✕</Btn>
        </div>
      </div>

      {open && (
        <div className="fade-in">
          <div style={{ height: 1, background: 'var(--border)', margin: '0 -32px 24px -32px' }} />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Tree Explorer */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 12, height: 2, background: 'var(--accent)' }} />
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.1em', fontWeight: 800 }}>
                    01 // PROJECT STRUCTURE
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                   <Btn variant="secondary" size="sm" onClick={expandAll} style={{ fontSize: 9, padding: '4px 10px', height: 26 }}>EXPAND ALL</Btn>
                   <Btn variant="secondary" size="sm" onClick={collapseAll} style={{ fontSize: 9, padding: '4px 10px', height: 26 }}>COLLAPSE ALL</Btn>
                </div>
              </div>
              
              <div style={{ 
                border: '1px solid var(--accent)', background: 'var(--bg-1)', padding: '24px',
                minHeight: 240, maxHeight: 500, overflowY: 'auto', borderRadius: 'var(--radius)'
              }}>
                {repo.treeData.length > 0 ? (
                  <FolderTree 
                    treeData={repo.treeData} 
                    onToggleIgnore={(path) => onToggleIgnore(repo.id, path)}
                    os={getOS()}
                    collapsed={collapsed}
                    onToggleCollapse={toggleCollapse}
                  />
                ) : (
                  <div style={{ 
                    height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px dashed var(--border)', borderRadius: 'var(--radius)',
                    color: 'var(--text-3)', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700
                  }}>
                    [Waiting for recursive scan...]
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}export default function ReposPage() {
  const { 
    repos, addRepo, removeRepo, updateRepo, toggleRepoIgnore, 
    setStep, modelCode, modelArtifacts, globalMaxDepth, setGlobalMaxDepth, resetProject,
    autoPicker, setAutoPicker, checkModels, tasks
  } = useStore()
  const [scanning, setScanning] = useState(false)
  const [scanLogs, setScanLogs] = useState([])

  const isGenerating = tasks.some(t => t.status === 'active')
  const canProceed = repos.every(r => r.treeData.length > 0 && r.name && r.role) && repos.length > 0

  const addLog = (msg) => setScanLogs(prev => [...prev, msg])

  const handleAttachNew = async () => {
    try {
      const handle = await pickDirectory()
      setScanning(true)
      setScanLogs([])
      addLog(`[SYSTEM_IO]: ATTACHING RESOURCE "${handle.name.toUpperCase()}"`)

      const treeData = await smartScan(handle, 0, globalMaxDepth, [], getOS())
      const role = await smartGuessRole(handle)
      addLog(`[System IO]: Role Detected -> [${(role || 'UNKNOWN').toUpperCase()}]`)
      
      const newId = Math.random().toString(36).slice(2, 10)
      addRepo(role, {
        id: newId,
        name: handle.name,
        treeData,
        handle // Store handle for later reading
      })
      
      // Auto-open the newly added repo
      setActiveRepoId(newId)
      
      addLog(`[SYSTEM_IO]: SCAN COMPLETE. ${treeData.length} NODES INDEXED.`)
      addLog(`[SUCCESS]: RESOURCE COMMITTED TO STACK.`)
    } catch (e) {
      if (e.name !== 'AbortError') {
        addLog(`[Fatal Error]: ${e.message}`)
        console.error(e)
      }
    } finally {
      setScanning(false)
    }
  }

  return (
    <div style={{ padding: '0 0 40px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <SectionTitle
          title="Project Sources"
          subtitle="Select the local folders for your frontend and backend repositories."
        />
      </div>

      <div className="fade-in">
        {/* Browser Warning */}
        {!window.chrome && (
          <div style={{ 
            margin: '24px 0', padding: '16px', background: 'var(--accent-soft)', 
            border: '1px solid var(--border)', borderRadius: 'var(--radius)',
            display: 'flex', alignItems: 'center', gap: 24
          }}>
            <div style={{ fontSize: 24 }}>⚠️</div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 800, color: 'var(--accent-deep)', marginBottom: 4 }}>COMPATIBILITY_ALERT</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
                <strong>Google Chrome is the only fully supported browser.</strong> You are currently using a different browser which may block the File System Access API or restrict indexing permissions.
              </div>
            </div>
          </div>
        )}

        {autoPicker && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '40px'
          }}>
            <Card style={{ maxWidth: 600, width: '100%', padding: '48px', textAlign: 'center' }} accent>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', fontWeight: 800, marginBottom: 24, letterSpacing: '0.2em' }}>
                [WORKFLOW_INITIALISED]
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, marginBottom: 16, textTransform: 'uppercase', color: 'var(--text)' }}>
                Select Root Resource
              </h2>
              <p style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.6, marginBottom: 32, fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                To begin, we need to map your local source code. Select the primary repository folder to initialise the architecture scan.
              </p>
              <Btn size="lg" onClick={() => { setAutoPicker(false); handleAttachNew(); }} style={{ width: '100%', padding: '20px' }}>
                INITIALISE PROJECT FOLDER →
              </Btn>
              <div style={{ marginTop: 16 }}>
                 <Btn variant="ghost" size="sm" onClick={() => setAutoPicker(false)}>SKIP FOR NOW</Btn>
              </div>
            </Card>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 32, marginBottom: 40 }}>
          {/* Quick Add Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.15em', fontWeight: 800 }}>
              Add New Resource
            </div>
            <div style={{ display: 'flex', gap: 0, border: '1px solid var(--border)', background: 'var(--bg-1)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', height: 56, boxShadow: 'var(--shadow)' }}>
              <div style={{ 
                flex: 1, padding: '0 20px', fontSize: 12, fontFamily: 'var(--font-mono)', 
                color: 'var(--text-3)', display: 'flex', alignItems: 'center', fontWeight: 700 
              }}>
                {scanning ? '[SYSTEM_SCAN_IN_PROGRESS...]' : '[AWAITING_LOCAL_RESOURCE]'}
              </div>
              <button 
                onClick={handleAttachNew} 
                disabled={scanning || isGenerating}
                style={{ 
                  background: 'var(--accent)', border: 'none', padding: '0 32px', color: '#FFF',
                  cursor: (scanning || isGenerating) ? 'wait' : 'pointer', fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-mono)', opacity: (scanning || isGenerating) ? 0.5 : 1,
                  height: '100%', transition: 'all 0.2s'
                }}
              >
                {scanning ? 'Scanning...' : 'Scan & Attach'}
              </button>
            </div>
          </div>

          {/* Global Config Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.15em', fontWeight: 800 }}>
              Global Parameters
            </div>
            <div style={{ display: 'flex', border: '1px solid var(--border)', background: 'var(--bg-1)', padding: '0 20px', alignItems: 'center', justifyContent: 'space-between', height: 56, borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
               <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-2)', fontWeight: 700 }}>Max Scan Depth</span>
               <div style={{ display: 'flex', border: '1px solid var(--border)', background: 'var(--bg)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                 <button onClick={() => setGlobalMaxDepth(Math.max(1, globalMaxDepth - 1))} style={{ width: 32, height: 32, border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 900, color: 'var(--text)' }}>-</button>
                 <div style={{ width: 40, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', fontSize: 12, fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{globalMaxDepth}</div>
                 <button onClick={() => setGlobalMaxDepth(Math.min(10, globalMaxDepth + 1))} style={{ width: 32, height: 32, border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 900, color: 'var(--text)' }}>+</button>
               </div>
            </div>
          </div>
        </div>

        {scanning && (
          <div style={{ marginBottom: 32 }} className="fade-in">
             <StatusLog messages={scanLogs} />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
            <div style={{ width: 12, height: 2, background: 'var(--accent)' }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-2)', fontWeight: 800, letterSpacing: '0.15em' }}>
              ACTIVE RESOURCES ({repos.length})
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {repos.map((repo, i) => (
              <RepoCard
                key={repo.id}
                repo={repo}
                allRepos={repos}
                onUpdate={(patch) => updateRepo(repo.id, patch)}
                onRemove={() => removeRepo(repo.id)}
                onToggleIgnore={toggleRepoIgnore}
                globalMaxDepth={globalMaxDepth}
              />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 64 }}>
          <button 
            onClick={handleAttachNew} 
            style={{ 
              width: '100%', padding: '32px', background: 'var(--bg-1)', border: '1px dashed var(--accent)', 
              borderRadius: 'var(--radius-lg)', color: 'var(--accent)', fontFamily: 'var(--font-mono)', 
              fontSize: 12, fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              letterSpacing: '0.1em'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-deep)'; e.currentTarget.style.background = 'var(--accent-soft)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--bg-1)'; }}
          >
            + ATTACH ADDITIONAL RESOURCE [SCAN LOCAL FOLDER]
          </button>
        </div>

        {/* Analytics Summary */}
        <Card style={{ padding: '24px 32px', marginBottom: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ 
              width: 12, height: 2, background: 'var(--accent)', 
              flexShrink: 0
            }} />
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign:'center',  gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', fontWeight: 800, letterSpacing: '0.1em' }}>TOTAL NODES</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)' }}>{repos.length.toString().padStart(2, '0')}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column',  textAlign:'center', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', fontWeight: 800, letterSpacing: '0.1em' }}>FRONTEND</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--accent)' }}>{repos.filter(r => r.role === 'frontend').length.toString().padStart(2, '0')}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign:'center', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', fontWeight: 800, letterSpacing: '0.1em' }}>API SERVICES</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--success)' }}>{repos.filter(r => r.role === 'api').length.toString().padStart(2, '0')}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign:'center', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', fontWeight: 800, letterSpacing: '0.1em' }}>INDEXED</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-2)' }}>{repos.filter(r => r.treeData.length > 0).length.toString().padStart(2, '0')}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
