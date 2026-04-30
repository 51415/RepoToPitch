import { useState } from 'react'
import { useStore } from '../lib/store'
import { Btn, Card, SectionTitle, Tag } from '../components/UI'
import { exportAsJSON, exportAsPptx, exportPitchAsPDF } from '../lib/exportUtils'

const SLIDE_THEMES = [
  { bg: '#FFFFFF', accent: '#0F172A', text: '#0F172A', sub: '#64748B', border: '#E2E8F0' },
  { bg: '#F8FAFC', accent: '#2563EB', text: '#0F172A', sub: '#64748B', border: '#E2E8F0' },
]

function SlideCard({ slide, theme, index, total }) {
  if (!slide) return null
  return (
    <div style={{
      background: 'var(--bg)',
      borderRadius: 'var(--radius-lg)', padding: '80px', height: 640,
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
       {/* Geometric Background Element */}
       <div style={{ 
         position: 'absolute', bottom: -150, right: -150, 
         width: 600, height: 600, border: '1px solid var(--accent)', 
         opacity: 0.03, transform: 'rotate(45deg)' 
       }} />

      
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 24 }}>
        <h2 style={{ 
          fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 900, 
          color: 'var(--text)', lineHeight: 1.1, marginBottom: 24, 
          letterSpacing: '-0.04em'
        }}>
          {slide.title}
        </h2>
        
        {slide.subtitle && (
          <p style={{ 
            fontSize: 12, color: 'var(--text-2)', marginBottom: 32, 
            fontFamily: 'var(--font-mono)', fontWeight: 800, 
            letterSpacing: '0.12em', borderLeft: '6px solid var(--accent)', paddingLeft: 24 
          }}>
            {slide.subtitle}
          </p>
        )}
        
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {(slide.bullets || []).map((b, i) => (
            <li key={i} style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              <div style={{ width: 10, height: 10, background: 'var(--accent)', marginTop: 6, flexShrink: 0, borderRadius: 2 }} />
              <span style={{ fontSize: 18, color: 'var(--text)', lineHeight: 1.4, fontWeight: 700, letterSpacing: '-0.02em' }}>{b}</span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  )
}

export default function PitchPage() {
  const { pitchSlides, setStep, resetProject, isDirty } = useStore()
  const [activeSlide, setActiveSlide] = useState(0)
  const [showMenu, setShowMenu] = useState(false)

  const handleStartNew = () => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Starting a new project will erase all current progress. Continue?')) return
    }
    resetProject()
  }

  if (pitchSlides.length === 0) {
    return (
      <div style={{ padding: '40px 0' }}>
        <SectionTitle
          step="5"
          total="5"
          title="Pitch Deck"
          subtitle="Generate your investor slides in the Synthesis step first."
        />
        <div className="glass-panel" style={{ textAlign: 'center', padding: '120px 64px' }}>
          <div style={{ fontSize: 64, marginBottom: 32 }}>🎴</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, marginBottom: 16, color: 'var(--text)' }}>Deck not generated</div>
          <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 48, fontFamily: 'var(--font-mono)', fontWeight: 800, letterSpacing: '0.1em' }}>Go back to the Synthesis step to build your investor story.</p>
          <Btn size="lg" onClick={() => setStep(4)} style={{ padding: '20px 48px' }}>← Return to Synthesis</Btn>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '0 0 80px 0' }}>
      <SectionTitle
        title="Investor Pitch Deck"
        subtitle="A presentation based on your project's architecture, vision, and goals."
      />

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 40, background: 'var(--bg-1)', padding: 6, borderRadius: 'var(--radius)' }}>
        {pitchSlides.map((s, i) => (
          <button key={i} onClick={() => setActiveSlide(i)} style={{
            padding: '12px 24px', border: 'none',
            background: activeSlide === i ? 'var(--accent)' : 'transparent',
            color: activeSlide === i ? '#FFF' : 'var(--text-3)',
            fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            fontWeight: 900, borderRadius: 'var(--radius)', letterSpacing: '0.05em'
          }}>
            {String(i + 1).padStart(2, '0')}
          </button>
        ))}
      </div>

      <div className="fade-in">
        <SlideCard 
          slide={pitchSlides[activeSlide]} 
          index={activeSlide}
          total={pitchSlides.length}
        />
        {pitchSlides[activeSlide]?.speaker_note && (
          <div style={{
            marginTop: 40, padding: '48px', background: 'var(--bg)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
            fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-2)', 
            lineHeight: 1.8, boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ 
              fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 900, 
              color: 'var(--accent)', marginBottom: 24,
              borderBottom: '1px solid var(--accent-soft)',
              paddingBottom: 8, display: 'inline-block'
            }}>
              Strategic Narrative Guidance
            </div>
            <div style={{ fontStyle: 'italic', fontWeight: 500 }}>{pitchSlides[activeSlide].speaker_note}</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 48, marginBottom: 80, alignItems: 'center' }}>
        <Btn variant="secondary" onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))} disabled={activeSlide === 0} style={{ width: 120 }}>Prev</Btn>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 900, color: 'var(--text)' }}>
          {activeSlide + 1} / {pitchSlides.length}
        </div>
        <Btn variant="secondary" onClick={() => setActiveSlide(Math.min(pitchSlides.length - 1, activeSlide + 1))} disabled={activeSlide === pitchSlides.length - 1} style={{ width: 120 }}>Next</Btn>
      </div>

    </div>
  )
}

const menuItemStyle = {
  background: 'transparent', border: 'none', color: 'var(--text)',
  padding: '12px 16px', textAlign: 'left', borderRadius: 'var(--radius)',
  cursor: 'pointer', fontSize: 13, transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
  fontFamily: 'var(--font-mono)', fontWeight: 800, letterSpacing: '0.05em'
}
