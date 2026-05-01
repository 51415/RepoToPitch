import { useStore } from '../lib/store'
import { Btn, Textarea, SectionTitle, Card } from '../components/UI'

const QUESTIONS = [
  {
    key: 'problem',
    label: 'What specific problem are you solving for yourself?',
    placeholder: 'e.g. Excessive latency in PRD generation after project ship.',
    hint: '01 // Problem Statement',
  },
  {
    key: 'users',
    label: 'Identify the target user demographic.',
    placeholder: 'e.g. Solo founders, high-velocity engineering teams.',
    hint: '02 // User Profiles',
  },
  {
    key: 'differentiator',
    label: 'What is the primary technical differentiator?',
    placeholder: 'e.g. Direct source code analysis vs template-based generation.',
    hint: '03 // Core Differentiator',
  },
  {
    key: 'top_features',
    label: 'List the top three functional modules.',
    placeholder: '1. Source mapping  2. Contextual Q&A  3. Deck export.',
    hint: '04 // Feature Matrix',
  },
  {
    key: 'pricing',
    label: 'Define the commercialisation model.',
    placeholder: 'e.g. Tiered subscription or open-source license.',
    hint: '05 // Revenue Architecture',
  },
  {
    key: 'traction',
    label: 'Current validation metrics or signals.',
    placeholder: 'e.g. Internal use-case data or beta group feedback.',
    hint: '06 // Validation Log',
  },
  {
    key: 'goal',
    label: 'Primary strategic objective.',
    placeholder: 'e.g. Reach $5k MRR or secure pre-seed funding.',
    hint: '07 // Strategic Goal',
  },
]

export default function QAPage() {
  const {
    qaAnswers, setQaAnswer, setStep,
    globalContext, setGlobalContext,
    globalDocuments, addGlobalDocument, removeGlobalDocument,
    repos
  } = useStore()

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    for (const file of files) {
      if (!file.name.match(/\.(txt|md|pdf)$/i)) continue

      const reader = new FileReader()
      reader.onload = (ev) => {
        addGlobalDocument({
          id: crypto.randomUUID(),
          name: file.name,
          content: ev.target.result,
          type: file.type
        })
      }
      reader.readAsText(file)
    }
  }

  const filled = QUESTIONS.filter(q => qaAnswers[q.key]?.trim()).length

  return (
    <div style={{ padding: '0 0 40px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
        <SectionTitle
          title="Project Context"
          subtitle="Deconstruct the strategic vision and technical documentation."
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
        {/* Left: Strategic Objectives */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 12, height: 2, background: 'var(--accent)' }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-2)', fontWeight: 800, letterSpacing: '0.1em' }}>01 // STRATEGIC OBJECTIVES</div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {QUESTIONS.map(q => (
              <Card key={q.key} style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--text)', fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}>{q.label.toUpperCase()}</div>
                </div>
                <Textarea
                  value={qaAnswers[q.key] || ''}
                  onChange={(v) => setQaAnswer(q.key, v)}
                  placeholder={q.placeholder}
                  rows={2}
                  style={{ fontSize: 13, background: 'var(--bg-1)', border: '1px solid var(--border-strong)' }}
                />
              </Card>
            ))}
          </div>
        </div>

        {/* Right: Narrative & Docs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          {/* Narrative */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 12, height: 2, background: 'var(--accent)' }} />
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-2)', fontWeight: 800, letterSpacing: '0.1em' }}>02 // PROJECT NARRATIVE</div>
            </div>
            <Card style={{ padding: '24px', minHeight: 400 }}>
              <Textarea
                value={globalContext}
                onChange={setGlobalContext}
                placeholder="Paste system overview, pitch deck notes, or visionary statements..."
                style={{ flex: 1, fontSize: 13, background: 'var(--bg-1)', border: '1px solid var(--border-strong)' }}
              />
            </Card>
          </div>

          {/* Documents */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 12, height: 2, background: 'var(--accent)' }} />
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-2)', fontWeight: 800, letterSpacing: '0.1em' }}>03 // ADDITIONAL INFORMATION</div>
            </div>
            
            <Card style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
                <div 
                  style={{
                    border: '2px dashed var(--border)', borderRadius: 'var(--radius)',
                    padding: '24px', textAlign: 'center', background: 'var(--bg-1)',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onClick={() => document.getElementById('global-doc-upload').click()}
                >
                  <input type="file" multiple accept=".txt,.md,.pdf" onChange={handleFileUpload} style={{ display: 'none' }} id="global-doc-upload" />
                  <div style={{ fontSize: 24, marginBottom: 8 }}>📂</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 800, color: 'var(--accent)' }}>Upload Assets</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)', marginTop: 4 }}>[ .txt, .md, .pdf only ]</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {globalDocuments?.length > 0 ? (
                    globalDocuments.map(d => (
                      <div key={d.id || d.name} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 16px', background: 'var(--bg-1)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <span style={{ fontSize: 14 }}>📄</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 800, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                        </div>
                        <button onClick={() => removeGlobalDocument(d.name)} style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 4 }}>✕</button>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 10, padding: 20 }}>
                       [No documents attached]
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
