import { useState, useEffect } from 'react'
import { streamChat } from '../lib/ollama'
import { renderPrompt } from '../lib/prompts'
import { useStore } from '../lib/store'
import { Btn, Card, Textarea, MarkdownView, SectionTitle, Tag, CopyBtn } from '../components/UI'
import { exportAsMarkdown, exportAsPDF } from '../lib/exportUtils'

// ── Horizontal Tabs Component (Internal to Analyse) ──────────────────────────
function TabBar({ tabs, activeId, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
      {tabs.map(tab => (
        <div 
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            padding: '8px 0 12px 0',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            fontWeight: activeId === tab.id ? 900 : 700,
            color: activeId === tab.id ? 'var(--accent)' : 'var(--text-3)',
            cursor: 'pointer',
            position: 'relative',
            borderBottom: activeId === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
            transition: 'all 0.2s',
            letterSpacing: '0.05em'
          }}
        >
          {tab.label.toUpperCase()}
          {tab.done && <span style={{ marginLeft: 6, color: 'var(--success)' }}>●</span>}
        </div>
      ))}
    </div>
  )
}

// ── Individual Repo Card ─────────────────────────────────────────────────────
function RepoAnalysisCard({ repo }) {
  const { 
    modelCode, modelArtifacts, customPrompts, 
    updateRepo, addDocument, removeDocument,
    addTask, updateTask, removeTask, tasks, checkModels
  } = useStore()
  
  const [activeTab, setActiveTab] = useState('documents') 
  const [loadingOverview, setLoadingOverview] = useState(false)
  const [loadingPrd, setLoadingPrd] = useState(false)
  const allRepos = useStore(s => s.repos)

  const isGenerating = tasks.some(t => t.status === 'active')
  const isThisRepoGenerating = tasks.some(t => t.id.includes(repo.id) && t.status === 'active')

  const TABS = [
    { id: 'documents', label: 'Documents', done: repo.documents?.length > 0 },
    { id: 'overview', label: 'System Overview', done: !!repo.overview },
    { id: 'prd', label: 'Technical PRD', done: !!repo.prd },
  ]

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    for (const file of files) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        addDocument(repo.id, {
          name: file.name,
          content: ev.target.result,
          type: file.type
        })
      }
      reader.readAsText(file)
    }
  }

  const runOverview = async () => {
    if (!repo.treeData?.length) return
    if (!checkModels()) return
    setLoadingOverview(true)
    const taskId = `analyse-${repo.id}-${Date.now()}`
    addTask({ id: taskId, name: `Analysing: ${repo.name}`, status: 'active' })
    const allNames = allRepos.map(r => r.name).filter(Boolean).join(', ')
    const { system, prompt } = renderPrompt('repoOverview', {
      repo_name: repo.name || 'unnamed',
      repo_role_type: repo.role === 'frontend' ? 'FRONTEND' : 'BACKEND API',
      repo_role_desc: repo.role === 'frontend' ? 'User-facing frontend' : 'Backend API service',
      other_repos: allNames || 'none listed yet',
      tree_text: repo.treeText,
      additional_docs: repo.documents?.map(d => `--- DOCUMENT: ${d.name} ---\n${d.content}`).join('\n\n') || ''
    }, customPrompts)
    try {
      updateRepo(repo.id, { overview: '' })
      await streamChat({
        model: modelCode, system, prompt,
        onChunk: (t) => updateRepo(repo.id, { overview: t }),
      })
      updateTask(taskId, { status: 'done', progress: 1 })
      setTimeout(() => removeTask(taskId), 3000)
    } catch (e) {
      updateTask(taskId, { status: 'error' })
    } finally {
      setLoadingOverview(false)
    }
  }

  const runPrd = async () => {
    if (!repo.overview) return
    if (!checkModels()) return
    setLoadingPrd(true)
    const taskId = `prd-${repo.id}-${Date.now()}`
    addTask({ id: taskId, name: `Generating PRD: ${repo.name}`, status: 'active' })
    const { system, prompt } = renderPrompt('repoPrd', {
      repo_name: repo.name || 'unnamed',
      repo_role_desc: repo.role === 'frontend' ? 'Frontend Application' : 'Backend API service',
      overview: repo.overview,
      module_analyses: 'Module analysis deprecated.',
      additional_docs: repo.documents?.map(d => `--- DOCUMENT: ${d.name} ---\n${d.content}`).join('\n\n') || ''
    }, customPrompts)
    try {
      updateRepo(repo.id, { prd: '' })
      await streamChat({
        model: modelArtifacts, system, prompt,
        onChunk: (t) => updateRepo(repo.id, { prd: t }),
      })
      updateTask(taskId, { status: 'done', progress: 1 })
      setTimeout(() => removeTask(taskId), 5000)
    } catch (e) {
      updateTask(taskId, { status: 'error' })
    } finally {
      setLoadingPrd(false)
    }
  }

  return (
    <div style={{ marginBottom: 64, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header outside of card */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 12, height: 2, background: 'var(--accent)' }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-2)', fontWeight: 800, letterSpacing: '0.1em' }}>
              RESOURCE // {repo.name?.toUpperCase()}
            </div>
            {repo.role && (
              <Tag color={repo.role === 'frontend' ? 'accent' : 'indigo'}>
                {repo.role === 'api' ? 'Api Service' : repo.role}
              </Tag>
            )}
          </div>
          <TabBar tabs={TABS} activeId={activeTab} onChange={setActiveTab} />
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          {activeTab === 'overview' && (
            <Btn variant="primary" size="sm" onClick={runOverview} loading={loadingOverview} disabled={isGenerating && !loadingOverview}>
              {repo.overview ? 'Regenerate Analysis' : 'Run Analysis'}
            </Btn>
          )}
          {activeTab === 'prd' && (
            <Btn variant="primary" size="sm" onClick={runPrd} loading={loadingPrd} disabled={(isGenerating && !loadingPrd) || !repo.overview}>
              {repo.prd ? 'Regenerate PRD' : 'Gen PRD'}
            </Btn>
          )}
          {(activeTab === 'overview' && repo.overview) || (activeTab === 'prd' && repo.prd) ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <CopyBtn text={activeTab === 'overview' ? repo.overview : repo.prd} />
              <Btn variant="secondary" size="sm" onClick={async () => {
                const title = activeTab === 'overview' ? 'System Overview' : 'Technical PRD'
                const content = activeTab === 'overview' ? repo.overview : repo.prd
                await exportAsPDF(title, content, `${repo.name}-${activeTab}.pdf`)
              }}>PDF</Btn>
              <Btn variant="secondary" size="sm" onClick={async () => {
                const content = activeTab === 'overview' ? repo.overview : repo.prd
                await exportAsMarkdown(content, `${repo.name}-${activeTab}.md`)
              }}>MD</Btn>
            </div>
          ) : null}
        </div>
      </div>

      <Card style={{ minHeight: 400, cursor: isThisRepoGenerating ? 'wait' : 'default' }}>
        <div className="fade-in">
          {activeTab === 'documents' && (
             <div className="fade-in">
                <div style={{ border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius)', padding: '24px', textAlign: 'center', background: 'var(--bg-1)', marginBottom: 20 }}>
                  <input type="file" multiple onChange={handleFileUpload} style={{ display: 'none' }} id={`doc-u-${repo.id}`} />
                  <label htmlFor={`doc-u-${repo.id}`} style={{ cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 900, color: 'var(--accent)' }}>
                    + ATTACH CONTEXT DOCUMENTS
                  </label>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {repo.documents?.map(d => (
                    <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-1)', borderRadius: 6, border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>{d.name}</span>
                      <button onClick={() => removeDocument(repo.id, d.name)} style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 4 }}>✕</button>
                    </div>
                  ))}
                </div>
             </div>
          )}
          {activeTab === 'overview' && <MarkdownView content={repo.overview} loading={loadingOverview} style={{ border: 'none', padding: 0, boxShadow: 'none' }} />}
          {activeTab === 'prd' && <MarkdownView content={repo.prd} loading={loadingPrd} style={{ border: 'none', padding: 0, boxShadow: 'none' }} />}
        </div>
      </Card>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function AnalysePage() {
  const { 
    repos, modelCode, modelArtifacts, customPrompts, 
    updateRepo, addTask, updateTask, removeTask, checkModels, tasks 
  } = useStore()
  
  const analysedCount = repos.filter(r => r.overview).length
  const isGenerating = tasks.some(t => t.status === 'active')

  const analyseAll = async () => {
    if (!checkModels()) return
    const taskMap = {}
    for (const r of repos) {
      const id = `analyse-${r.id}-${Date.now()}`
      addTask({ id, name: `Analysing: ${r.name}`, status: 'pending', progress: 0 })
      taskMap[r.id] = id
    }
    
    for (const r of repos) {
      const taskId = taskMap[r.id]
      updateTask(taskId, { status: 'active' })
      const { system, prompt } = renderPrompt('repoOverview', {
        repo_name: r.name || 'unnamed',
        repo_role_type: r.role === 'frontend' ? 'FRONTEND' : 'BACKEND API',
        repo_role_desc: r.role === 'frontend' ? 'User-facing frontend' : 'Backend API service',
        other_repos: repos.map(x => x.name).join(', '),
        tree_text: r.treeText,
        additional_docs: r.documents?.map(d => `--- DOCUMENT: ${d.name} ---\n${d.content}`).join('\n\n') || ''
      }, customPrompts)

      try {
        updateRepo(r.id, { overview: '' })
        await streamChat({
          model: modelCode, system, prompt,
          onChunk: (t) => updateRepo(r.id, { overview: t }),
        })
        updateTask(taskId, { status: 'done', progress: 1 })
        setTimeout(() => removeTask(taskId), 5000)
      } catch (e) {
        updateTask(taskId, { status: 'error' })
      }
    }
  }

  const generateAllPrds = async () => {
    if (!checkModels()) return
    const taskMap = {}
    for (const r of repos) {
      if (!r.overview) continue
      const id = `gen-prd-${r.id}-${Date.now()}`
      addTask({ id, name: `PRD Gen: ${r.name}`, status: 'pending', progress: 0 })
      taskMap[r.id] = id
    }

    for (const r of repos) {
      if (!r.overview) continue
      const taskId = taskMap[r.id]
      updateTask(taskId, { status: 'active' })
      const { system, prompt } = renderPrompt('repoPrd', {
        repo_name: r.name || 'unnamed',
        repo_role_desc: r.role === 'frontend' ? 'frontend' : 'API service',
        overview: r.overview,
        module_analyses: 'Module analysis deprecated.',
        additional_docs: r.documents?.map(d => `--- DOCUMENT: ${d.name} ---\n${d.content}`).join('\n\n') || ''
      }, customPrompts)

      try {
        updateRepo(r.id, { prd: '' })
        await streamChat({
          model: modelArtifacts, system, prompt,
          onChunk: (t) => updateRepo(r.id, { prd: t }),
        })
        updateTask(taskId, { status: 'done', progress: 1 })
        setTimeout(() => removeTask(taskId), 5000)
      } catch (e) {
        updateTask(taskId, { status: 'error' })
      }
    }
  }

  return (
    <div style={{ padding: '0 0 40px 0', display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <SectionTitle
          title="Deep Analysis"
          subtitle="Deconstructing source code into functional requirements and technical narratives."
        />

        <div style={{ display: 'flex', gap: 12, marginTop: -20, marginBottom: 20 }}>
           <Btn variant="primary" onClick={analyseAll} disabled={isGenerating}>
             Analyse All ({repos.length})
           </Btn>
           <Btn variant="secondary" onClick={generateAllPrds} disabled={isGenerating || analysedCount === 0}>
             Generate All PRDs
           </Btn>
        </div>
      </div>

      {/* Repository Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
         {repos.map((repo) => (
           <RepoAnalysisCard key={repo.id} repo={repo} />
         ))}
         {repos.length === 0 && (
           <Card style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
              [No resources detected]
           </Card>
         )}
      </div>
    </div>
  )
}
