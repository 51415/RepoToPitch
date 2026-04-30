import { useState, useEffect } from 'react'
import { streamChat } from '../lib/ollama'
import { renderPrompt } from '../lib/prompts'
import { useStore } from '../lib/store'
import { Btn, Card, MarkdownView, SectionTitle, Spinner, CopyBtn, Tag, VerticalTabs, Textarea } from '../components/UI'
import { exportAsMarkdown, exportAsJSON, exportAsDocx, exportAsPDF } from '../lib/exportUtils'
import { extractJson } from '../lib/jsonUtils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const SLIDE_THEMES = [
  { bg: '#FFFFFF', accent: '#0F172A', text: '#0F172A', sub: '#64748B', border: '#E2E8F0' },
  { bg: '#F8FAFC', accent: '#2563EB', text: '#0F172A', sub: '#64748B', border: '#E2E8F0' },
]

function SlideCard({ slide, index, total }) {
  if (!slide) return null
  return (
    <div style={{
      background: 'var(--bg)',
      borderRadius: 'var(--radius-lg)', padding: '64px', height: 480,
      position: 'relative', overflow: 'hidden',
      boxShadow: 'var(--shadow-lg)',
      display: 'flex', flexDirection: 'column',
      border: '1px solid var(--border)',
    }}>
       <div style={{
          position: 'absolute', top: 0, right: 0, padding: '32px 48px',
          fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 800, color: 'var(--accent)', opacity: 0.5
        }}>
          {String(index + 1).padStart(2, '0')} // {total}
        </div>
      
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 24 }}>
        <h2 style={{ 
          fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, 
          color: 'var(--text)', lineHeight: 1.1, marginBottom: 16, 
          letterSpacing: '-0.04em'
        }}>
          {slide.title}
        </h2>
        
        {slide.subtitle && (
          <p style={{ 
            fontSize: 11, color: 'var(--text-2)', marginBottom: 24, 
            fontFamily: 'var(--font-mono)', fontWeight: 800, 
            borderLeft: '4px solid var(--accent)', paddingLeft: 24 
          }}>
            {slide.subtitle}
          </p>
        )}
        
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(slide.bullets || []).map((b, i) => (
            <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 8, height: 8, background: 'var(--accent)', marginTop: 4, flexShrink: 0, borderRadius: 2 }} />
              <span style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.4, fontWeight: 700 }}>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function MasterPage() {
  const { 
    modelArtifacts, customPrompts, repos, qaAnswers, 
    masterPrd, pitchSlides, pitchInstructions, setMasterPrd, setPitchSlides, setPitchInstructions, setStep,
    techArchitecture, competitivePositioning, goToMarket, riskRegister, dataPrivacy, apiDocs, onboardingGuide,
    setTechArchitecture, setCompetitivePositioning, setGoToMarket, setRiskRegister, setDataPrivacy, setApiDocs, setOnboardingGuide,
    globalContext, globalDocuments, projectOverview, setProjectOverview,
    addTask, updateTask, removeTask, checkModels, masterPageTab, setMasterPageTab, tasks
  } = useStore()


  const [loadingPrd, setLoadingPrd] = useState(false)
  const [loadingPitch, setLoadingPitch] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const [slideCount, setSlideCount] = useState(10)

  const analysedRepos = repos.filter(r => r.overview)

  const getGlobalDocText = () => {
    if (!globalDocuments?.length) return ''
    return globalDocuments.map(d => `--- GLOBAL DOCUMENT: ${d.name} ---\n${d.content}`).join('\n\n')
  }

  const runProjectOverview = async () => {
    if (!checkModels()) return
    setLoadingPrd(true)
    setProjectOverview('')
    const taskId = `overview-${Date.now()}`
    addTask({ id: taskId, name: 'System Overview Generation', status: 'active' })
    try {
      const { system, prompt } = renderPrompt('projectOverview', {
        repo_count: analysedRepos.length,
        repo_overviews: analysedRepos.map(r => `## ${r.name}\n${r.overview}`).join('\n---\n')
      }, customPrompts)
      await streamChat({ 
        model: modelArtifacts, system, prompt, 
        onChunk: (t) => {
          setProjectOverview(t)
        } 
      })
      updateTask(taskId, { status: 'done', progress: 1 })
      setTimeout(() => removeTask(taskId), 5000)
    } catch (e) { 
      updateTask(taskId, { status: 'error' })
    }
    setLoadingPrd(false)
  }

  const runMasterPrd = async () => {
    if (!checkModels()) return
    setLoadingPrd(true)
    setMasterPrd('')
    const taskId = `prd-${Date.now()}`
    addTask({ id: taskId, name: 'Master PRD Generation', status: 'active' })
    try {
      const { system, prompt } = renderPrompt('masterPrd', {
        repo_count: analysedRepos.length,
        system_architecture: projectOverview || repos.map(r => `[${r.role.toUpperCase()}] ${r.name}\n${r.overview.slice(0, 500)}`).join('\n---\n'),
        per_repo_prds: repos.map(r => `## ${r.name}\n${r.prd.slice(0, 800)}`).join('\n---\n'),
        global_narrative: globalContext || 'Not specified',
        global_documents: getGlobalDocText(),
        qa_problem: qaAnswers.problem || 'Not specified',
        qa_users: qaAnswers.users || 'Not specified',
        qa_differentiator: qaAnswers.differentiator || 'Not specified',
        qa_top_features: qaAnswers.top_features || 'Not specified',
        qa_pricing: qaAnswers.pricing || 'Not specified',
        qa_traction: qaAnswers.traction || 'Not specified',
        qa_goal: qaAnswers.goal || 'Not specified'
      }, customPrompts)
      await streamChat({ 
        model: modelArtifacts, system, prompt, 
        onChunk: (t) => {
          setMasterPrd(t)
        } 
      })
      updateTask(taskId, { status: 'done', progress: 1 })
      setTimeout(() => removeTask(taskId), 5000)
    } catch (e) { 
      updateTask(taskId, { status: 'error' })
    }
    setLoadingPrd(false)
  }

  const runGenericArtifact = async (type) => {
    if (!checkModels()) return
    setLoadingPrd(true)
    const taskNames = {
      arch: 'Architecture', comp: 'Competition', gtm: 'GTM Strategy',
      risk: 'Risk Register', privacy: 'Data Privacy', api: 'API Docs',
      onboarding: 'Onboarding Guide'
    }
    const setters = {
      arch: setTechArchitecture, comp: setCompetitivePositioning, gtm: setGoToMarket,
      risk: setRiskRegister, privacy: setDataPrivacy, api: setApiDocs,
      onboarding: setOnboardingGuide
    }
    
    setters[type]('')
    const taskId = `${type}-${Date.now()}`
    addTask({ id: taskId, name: `${taskNames[type]} Generation`, status: 'active' })

    try {
      let params = {}
      if (type === 'arch') {
        params = {
          repo_details: analysedRepos.map(r => `[${r.role.toUpperCase()}] ${r.name}\nOverview: ${r.overview.slice(0, 600)}`).join('\n---\n'),
          master_prd_summary: masterPrd?.slice(0, 1000) || 'Not specified'
        }
      } else if (type === 'comp') {
        params = {
          project_overview: projectOverview?.slice(0, 1000) || 'Not specified',
          qa_problem: qaAnswers.problem || 'Not specified',
          qa_users: qaAnswers.users || 'Not specified',
          qa_differentiator: qaAnswers.differentiator || 'Not specified',
          qa_top_features: qaAnswers.top_features || 'Not specified',
          qa_pricing: qaAnswers.pricing || 'Not specified'
        }
      } else if (type === 'gtm') {
        params = {
          project_overview: projectOverview?.slice(0, 800) || 'Not specified',
          qa_problem: qaAnswers.problem || 'Not specified',
          qa_users: qaAnswers.users || 'Not specified',
          qa_differentiator: qaAnswers.differentiator || 'Not specified',
          qa_top_features: qaAnswers.top_features || 'Not specified',
          qa_pricing: qaAnswers.pricing || 'Not specified',
          qa_traction: qaAnswers.traction || 'Not specified',
          qa_goal: qaAnswers.goal || 'Not specified'
        }
      } else if (type === 'risk') {
        params = {
          project_overview: projectOverview || analysedRepos.map(r => `[${r.name}]\n${r.overview.slice(0, 600)}`).join('\n---\n'),
          master_prd_summary: masterPrd?.slice(0, 600) || 'Not specified'
        }
      } else if (type === 'privacy') {
        params = {
          project_overview: projectOverview || analysedRepos.map(r => `[${r.role.toUpperCase()}] ${r.name}\nOverview: ${r.overview?.slice(0, 500)}`).join('\n---\n'),
          master_prd_summary: masterPrd?.slice(0, 600) || 'Not specified'
        }
      } else if (type === 'api') {
        const apiRepos = analysedRepos.filter(r => r.role === 'api')
        params = {
          repo_details: apiRepos.map(r => `[${r.name}]\nOverview: ${r.overview?.slice(0, 500)}`).join('\n---\n'),
          master_prd_summary: masterPrd?.slice(0, 1000) || 'Not specified'
        }
      } else if (type === 'onboarding') {
        params = {
          project_overview: projectOverview || analysedRepos.map(r => `[${r.role.toUpperCase()}] ${r.name}\nOverview: ${r.overview?.slice(0, 500)}`).join('\n---\n'),
          master_prd_summary: masterPrd?.slice(0, 600) || 'Not specified'
        }
      }

      const { system, prompt } = renderPrompt(type === 'arch' ? 'techArchitecture' : type === 'comp' ? 'competitivePositioning' : type === 'risk' ? 'riskRegister' : type === 'privacy' ? 'dataPrivacy' : type === 'api' ? 'apiDocs' : type === 'onboarding' ? 'onboardingGuide' : 'goToMarket', params, customPrompts)
      
      await streamChat({ 
        model: modelArtifacts, system, prompt, 
        onChunk: (t) => setters[type](t)
      })
      updateTask(taskId, { status: 'done', progress: 1 })
      setTimeout(() => removeTask(taskId), 5000)
    } catch (e) { 
      updateTask(taskId, { status: 'error' })
    }
    setLoadingPrd(false)
  }

  const runPitchDeck = async () => {
    if (!masterPrd) return
    if (!checkModels()) return
    setLoadingPitch(true)
    setPitchSlides([])
    const taskId = `pitch-${Date.now()}`
    addTask({ id: taskId, name: 'Pitch Deck Generation', status: 'active' })
    
    try {
      const outlinePrompt = renderPrompt('pitchOutline', {
        master_prd: masterPrd,
        qa_users: qaAnswers.users || 'TBD',
        qa_goal: qaAnswers.goal || 'Not specified',
        pitch_instructions: pitchInstructions || 'Professional investor pitch deck focusing on technical scalability and market problem-solution fit.',
        slide_count: slideCount
      }, customPrompts)

      const outlineFull = await streamChat({
        model: modelArtifacts, 
        system: outlinePrompt.system, 
        prompt: outlinePrompt.prompt
      })
      const outlineData = extractJson(outlineFull)

      if (!outlineData.length) throw new Error("OUTLINE_GENERATION_FAILED")

      const finalSlides = []
      for (let i = 0; i < outlineData.length; i++) {
        const slide = outlineData[i]
        updateTask(taskId, { name: `Pitch Deck: Slide ${i + 1}/${outlineData.length}`, progress: (i/outlineData.length) })
        
        const contentPrompt = renderPrompt('pitchSlideContent', {
          slide_number: slide.slide,
          slide_title: slide.title,
          slide_subtitle: slide.subtitle || '',
          master_prd_summary: masterPrd.slice(0, 2000),
          pitch_instructions: pitchInstructions || 'None'
        }, customPrompts)

        const slideFull = await streamChat({
          model: modelArtifacts,
          system: contentPrompt.system,
          prompt: contentPrompt.prompt
        })

        const fullSlide = extractJson(slideFull)
        finalSlides.push(fullSlide)
        setPitchSlides([...finalSlides])
      }

      updateTask(taskId, { status: 'done', progress: 1 })
      setTimeout(() => removeTask(taskId), 5000)
    } catch (e) { 
      updateTask(taskId, { status: 'error' })
    }
    setLoadingPitch(false)
  }

  const runAllSynthesis = async () => {
    if (!checkModels()) return
    setLoadingPrd(true)
    
    try {
      await runProjectOverview()
      await runMasterPrd()
      
      const sequence = ['arch', 'comp', 'gtm', 'risk', 'privacy', 'api', 'onboarding']
      for (const type of sequence) {
        await runGenericArtifact(type)
      }
      
      await runPitchDeck()
    } catch (e) {
      console.error("All-Synthesis Error:", e)
    }
    
    setLoadingPrd(false)
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
    } else {
      console.warn('[MASTER] No content to export')
    }
  }

  const TABS = [
    { id: 'project-overview', label: 'System Overview', done: !!projectOverview, desc: 'High-level executive summary of the entire system architecture, purpose, and key modules.' },
    { id: 'prd', label: 'Master PRD', done: !!masterPrd, desc: 'The authoritative Product Requirements Document, consolidating all features, user flows, and technical logic.' },
    { id: 'arch', label: 'Architecture', done: !!techArchitecture, desc: 'A deep-dive technical map of the system\'s stack, data flow, and infrastructure components.' },
    { id: 'comp', label: 'Competition', done: !!competitivePositioning, desc: 'Strategic analysis of the market landscape, differentiators, and competitive advantages.' },
    { id: 'gtm', label: 'Go-To-Market', done: !!goToMarket, desc: 'Actionable strategy for user acquisition, pricing, and project launch phases.' },
    { id: 'risk', label: 'Risk Register', done: !!riskRegister, desc: 'Comprehensive audit of technical, strategic, and operational risks with mitigation plans.' },
    { id: 'privacy', label: 'Data & Privacy', done: !!dataPrivacy, desc: 'Detailed review of data handling practices, security protocols, and privacy compliance.' },
    { id: 'api', label: 'API Documentation', done: !!apiDocs, desc: 'Automatic documentation of inferred endpoints, request/response models, and service interfaces.' },
    { id: 'onboarding', label: 'Onboarding', done: !!onboardingGuide, desc: 'Developer and stakeholder onboarding roadmap for rapid project familiarisation.' },
    { id: 'pitch', label: 'Pitch Schematic', done: pitchSlides.length > 0, desc: 'A structured slide-by-slide breakdown of the project vision for investor or team presentations.' },
  ]

  const activeContent = {
    'project-overview': projectOverview,
    'prd': masterPrd,
    'arch': techArchitecture,
    'comp': competitivePositioning,
    'gtm': goToMarket,
    'risk': riskRegister,
    'privacy': dataPrivacy,
    'api': apiDocs,
    'onboarding': onboardingGuide
  }
  const activeTabObj = TABS.find(t => t.id === masterPageTab) || TABS[0]
  const content = activeTabObj.id === 'pitch' ? (pitchSlides.length > 0 ? 'Pitch Ready' : null) : activeContent[activeTabObj.id]
  
  const anyArtifactGenerated = !!(projectOverview || masterPrd || techArchitecture || goToMarket || competitivePositioning || riskRegister || dataPrivacy || apiDocs || onboardingGuide || pitchSlides.length > 0)
  const isGenerating = tasks.some(t => t.status === 'active')
  const isLoading = loadingPrd || (activeTabObj.id === 'pitch' && loadingPitch)

  return (
    <div style={{ padding: '0 0 40px 0', display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <SectionTitle
          title="Project Synthesis"
          subtitle={`Consolidate analysis from ${analysedRepos.length} resources into a unified system roadmap.`}
        />
        <div style={{ display: 'flex', gap: 12, marginTop: -20, marginBottom: 20 }}>
          <Btn 
            variant="primary" 
            onClick={() => {
              if (activeTabObj.id === 'project-overview') runProjectOverview()
              else if (activeTabObj.id === 'prd') runMasterPrd()
              else if (activeTabObj.id === 'pitch') runPitchDeck()
              else runGenericArtifact(activeTabObj.id)
            }} 
            loading={isLoading}
            disabled={isGenerating && !isLoading}
          >
            {content ? `Regenerate ${activeTabObj.label}` : `Generate ${activeTabObj.label}`}
          </Btn>
          <Btn variant="secondary" onClick={runAllSynthesis} loading={loadingPrd || loadingPitch} disabled={isGenerating && !(loadingPrd || loadingPitch)}>Generate All Artifacts</Btn>
          <Btn variant="secondary" onClick={exportAllArtifacts} disabled={!anyArtifactGenerated || isGenerating}>Export All (.md)</Btn>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minHeight: 700 }}>
        {/* Preview Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 12, height: 2, background: 'var(--accent)' }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-2)', fontWeight: 800, letterSpacing: '0.1em' }}>
              {activeTabObj.label.toUpperCase()} // PREVIEW
            </div>
          </div>
          
          {content && activeTabObj.id !== 'pitch' && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
               <CopyBtn text={content} />
               <Btn variant="secondary" size="sm" onClick={() => exportAsPDF(activeTabObj.label, content, `${activeTabObj.id}.pdf`)} disabled={isGenerating}>PDF</Btn>
            </div>
          )}
        </div>

        {/* Content Area */}
        <Card style={{ flex: 1, padding: '40px', minHeight: 600, cursor: isGenerating ? 'wait' : 'default' }}>
           {activeTabObj.id === 'pitch' ? (
             <div className="fade-in">
                  <div style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.1em' }}>
                         PITCH NARRATIVE & STRATEGY
                       </div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-1)', padding: '4px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border-strong)' }}>
                         <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 800, color: 'var(--text-3)' }}>SLIDES //</span>
                         <select 
                           value={slideCount} 
                           onChange={(e) => setSlideCount(parseInt(e.target.value))}
                           style={{ background: 'transparent', border: 'none', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 800, color: 'var(--accent)', cursor: 'pointer', outline: 'none' }}
                         >
                           {[5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                         </select>
                       </div>
                    </div>
                    <Textarea
                      placeholder="e.g. Professional investor pitch deck focusing on technical scalability and market problem-solution fit."
                      value={pitchInstructions}
                      onChange={setPitchInstructions}
                      rows={2}
                      style={{ background: 'var(--bg-1)', fontSize: 13, border: '1px solid var(--border-strong)' }}
                    />
                  </div>

                {pitchSlides.length > 0 ? (
                  <div className="fade-in">
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 24, background: 'var(--bg-1)', padding: 4, borderRadius: 'var(--radius)' }}>
                      {pitchSlides.map((s, i) => (
                        <button key={i} onClick={() => setActiveSlide(i)} style={{
                          padding: '8px 12px', border: 'none',
                          background: activeSlide === i ? 'var(--accent)' : 'transparent',
                          color: activeSlide === i ? '#FFF' : 'var(--text-3)',
                          fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer', transition: 'all 0.1s',
                          fontWeight: 800, borderRadius: 'var(--radius)'
                        }}>
                          {String(i + 1).padStart(2, '0')}
                        </button>
                      ))}
                    </div>
                    <SlideCard slide={pitchSlides[activeSlide]} index={activeSlide} total={pitchSlides.length} />
                  </div>
                ) : (
                  <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                    [Awaiting synthesis of pitch slides]
                  </div>
                )}
             </div>
           ) : (
             <>
               {!content && !isLoading && (
                 <div style={{ height: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
                   <div style={{ fontSize: 48 }}>🧪</div>
                   <div style={{ textAlign: 'center', maxWidth: 500 }}>
                     <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 10 }}>{activeTabObj.label} not yet generated</div>
                     <div style={{ color: 'var(--text-3)', fontSize: 14, fontFamily: 'var(--font-body)', fontWeight: 500, lineHeight: 1.6, marginBottom: 24 }}>
                       {activeTabObj.desc}
                     </div>
                   </div>
                   <Btn variant="primary" onClick={() => {
                      if (activeTabObj.id === 'project-overview') runProjectOverview()
                      else if (activeTabObj.id === 'prd') runMasterPrd()
                      else runGenericArtifact(activeTabObj.id)
                   }}>Generate {activeTabObj.label}</Btn>
                 </div>
               )}
               <MarkdownView 
                 content={content} 
                 loading={isLoading} 
                 style={{ border: 'none', padding: 0, boxShadow: 'none' }} 
               />
             </>
           )}
        </Card>
      </div>
    </div>
  )
}
