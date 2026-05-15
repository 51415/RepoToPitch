import React from 'react'
import { DEFAULT_PROMPTS } from '../../lib/prompts'

export function PromptsTab({
  promptKeys,
  selectedPromptKey,
  setSelectedPromptKey,
  localCustomPrompts,
  setLocalCustomPrompts
}) {
  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 40 }}>
      {/* Prompt Selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 12 }}>
          PROMPT REGISTRY
        </div>
        {promptKeys.map(key => (
          <button
            key={key}
            onClick={() => setSelectedPromptKey(key)}
            style={{
              textAlign: 'left', padding: '10px 16px', border: 'none',
              background: selectedPromptKey === key ? 'var(--bg-2)' : 'transparent',
              borderLeft: selectedPromptKey === key ? '3px solid var(--accent)' : '3px solid transparent',
              color: selectedPromptKey === key ? 'var(--text)' : 'var(--text-2)',
              fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer',
              transition: 'all 0.1s'
            }}
          >
            {key.toUpperCase().replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Prompt Editor */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, margin: 0, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, var(--accent), #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              PROMPTS STUDIO
            </h2>
            <div style={{ background: 'var(--accent-soft)', color: 'var(--accent)', padding: '2px 8px', fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 900, borderRadius: 4 }}>
              INSTRUCTIONS
            </div>
          </div>
          <p style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 11, margin: 0 }}>
            CUSTOMIZE STRATEGIC FOUNDER-FIRST AI NARRATIVE GUIDELINES
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: -16 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', fontWeight: 700 }}>SYSTEM INSTRUCTION</div>
          <button
            onClick={() => setLocalCustomPrompts({
              ...localCustomPrompts,
              [selectedPromptKey]: DEFAULT_PROMPTS[selectedPromptKey]
            })}
            style={{
              background: 'transparent', border: 'none', color: 'var(--accent)',
              fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
              cursor: 'pointer', textDecoration: 'underline', padding: 0
            }}
          >
            RESET TO DEFAULT
          </button>
        </div>
        <div>
          <textarea
            value={localCustomPrompts[selectedPromptKey]?.system ?? DEFAULT_PROMPTS[selectedPromptKey].system}
            onChange={(e) => setLocalCustomPrompts({
              ...localCustomPrompts,
              [selectedPromptKey]: { ...(localCustomPrompts[selectedPromptKey] || {}), system: e.target.value }
            })}
            style={{
              width: '100%', height: 100, background: 'var(--bg-1)', border: '1px solid var(--border)',
              padding: 12, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text)',
              resize: 'vertical', outline: 'none'
            }}
          />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginBottom: 8, fontWeight: 700 }}>USER PROMPT TEMPLATE</div>
          <textarea
            value={localCustomPrompts[selectedPromptKey]?.prompt ?? DEFAULT_PROMPTS[selectedPromptKey].prompt}
            onChange={(e) => setLocalCustomPrompts({
              ...localCustomPrompts,
              [selectedPromptKey]: { ...(localCustomPrompts[selectedPromptKey] || {}), prompt: e.target.value }
            })}
            style={{
              width: '100%', height: 300, background: 'var(--bg-1)', border: '1px solid var(--border)',
              padding: 12, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text)',
              resize: 'vertical', outline: 'none'
            }}
          />
        </div>
      </div>
    </div>
  )
}
