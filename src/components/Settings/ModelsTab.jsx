import React from 'react'
import { Btn, Input } from '../UI'
import { SettingsModelSelect } from './SettingsModelSelect'

export function ModelsTab({
  models,
  localModelCode,
  setLocalModelCode,
  localModelArtifacts,
  setLocalModelArtifacts,
  localHost,
  setLocalHost,
  tryConnect,
  loading,
  connected,
  resetSystem
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 60 }} className="fade-in">
      {/* Left Column: Model Selection */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, margin: 0, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, var(--accent), #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              MODELS STUDIO
            </h2>
            <div style={{ background: 'var(--accent-soft)', color: 'var(--accent)', padding: '2px 8px', fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 900, borderRadius: 4 }}>
              AI_UNITS
            </div>
          </div>
          <p style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 11, margin: 0 }}>
            LOCAL AI RUNTIME ENGINE BINDINGS & HOST DISCOVERY PROTOCOL
          </p>
        </div>

        {/* Code Review Model */}
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)', letterSpacing: '0.1em', fontWeight: 800, marginBottom: 12 }}>
            CODE ANALYSIS ENGINE
          </div>
          <SettingsModelSelect
            models={models}
            selected={localModelCode}
            onSelect={setLocalModelCode}
            loading={loading}
            connected={connected}
          />
        </div>

        {/* Artifact Model */}
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)', letterSpacing: '0.1em', fontWeight: 800, marginBottom: 12 }}>
            ARTIFACT SYNTHESIS ENGINE
          </div>
          <SettingsModelSelect
            models={models}
            selected={localModelArtifacts}
            onSelect={setLocalModelArtifacts}
            loading={loading}
            connected={connected}
          />
        </div>

        <div style={{ borderTop: '2px solid var(--danger)', paddingTop: 32 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--danger)', marginBottom: 12, fontWeight: 800 }}>
            DANGER ZONE
          </div>
          <Btn
            variant="danger"
            size="sm"
            onClick={async () => {
              const { ask } = await import('@tauri-apps/plugin-dialog')
              const confirmed = await ask('[CRITICAL]: PURGE ALL APPLICATION DATA AND SETTINGS?', { title: 'FACTORY RESET', type: 'warning' })
              if (confirmed) {
                resetSystem();
                window.location.href = '/';
              }
            }}
          >
            FACTORY_RESET
          </Btn>
        </div>
      </div>

      {/* Right Column: Connection */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', marginBottom: 12, letterSpacing: '0.1em', fontWeight: 700 }}>
            OLLAMA ENDPOINT
          </div>
          <div style={{ display: 'flex', gap: 0, border: '2px solid var(--accent)' }}>
            <Input
              value={localHost}
              onChange={setLocalHost}
              placeholder="http://localhost:11434"
              style={{ flex: 1, border: 'none', background: 'transparent', padding: '10px 16px', fontSize: 12 }}
            />
            <button
              onClick={() => tryConnect(localHost)}
              disabled={loading}
              style={{
                background: 'var(--accent)', color: '#FFF', border: 'none',
                padding: '0 16px', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 800, cursor: 'pointer'
              }}
            >
              {loading ? '...' : 'LINK'}
            </button>
          </div>
          {connected && (
            <div style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--success)', fontWeight: 700 }}>
              [STATUS CONNECTED] · {models.length} UNITS AVAILABLE
            </div>
          )}
        </div>

        <div style={{ background: 'var(--bg-1)', border: '1px solid var(--accent)', padding: '24px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', marginBottom: 16, letterSpacing: '0.1em', fontWeight: 700 }}>
            PRIVACY PROTOCOL
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
            <strong>LOCAL-FIRST DATA:</strong> All project data is stored in your browser's local storage. Your source files are analyzed in-place and never uploaded.
          </div>
          <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6, borderLeft: '2px solid var(--accent)', paddingLeft: 16 }}>
            Processing occurs entirely via your local Ollama instance.
          </div>
        </div>
      </div>
    </div>
  )
}
