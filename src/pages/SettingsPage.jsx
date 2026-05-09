import { useState, useEffect } from 'react'
import { listModels } from '../lib/ollama'
import { useStore } from '../lib/store'
import { Btn, Input } from '../components/UI'
import { DEFAULT_PROMPTS } from '../lib/prompts'
import { useLicence } from '../hooks/useLicence'
import { open } from '@tauri-apps/plugin-shell'

export default function SettingsPage() {
  const {
    modelCode: storeModelCode, setModelCode,
    modelArtifacts: storeModelArtifacts, setModelArtifacts,
    ollamaHost: storeOllamaHost, setOllamaHost,
    customPrompts: storeCustomPrompts, setCustomPrompts,
    resetSystem,
    setShowSettings,
    settingsFlashCount
  } = useStore()

  const [activeTab, setActiveTab] = useState('models') // 'models' | 'prompts' | 'about'
  const { status, activate, deactivate, loading: licenceLoading, error: licenceError } = useLicence()
  const [licenceKey, setLicenceKey] = useState('')
  const [flashing, setFlashing] = useState(false)

  useEffect(() => {
    if (settingsFlashCount > 0) {
      setFlashing(true)
      const timer = setTimeout(() => setFlashing(false), 600)
      return () => clearTimeout(timer)
    }
  }, [settingsFlashCount])

  const [localModelCode, setLocalModelCode] = useState(storeModelCode)
  const [localModelArtifacts, setLocalModelArtifacts] = useState(storeModelArtifacts)
  const [localHost, setLocalHost] = useState(storeOllamaHost)
  const [localCustomPrompts, setLocalCustomPrompts] = useState(storeCustomPrompts)

  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [connected, setConnected] = useState(false)

  const [selectedPromptKey, setSelectedPromptKey] = useState('repoOverview')

  const isDirty =
    localModelCode !== storeModelCode ||
    localModelArtifacts !== storeModelArtifacts ||
    localHost !== storeOllamaHost ||
    JSON.stringify(localCustomPrompts) !== JSON.stringify(storeCustomPrompts)

  const tryConnect = async (h) => {
    setLoading(true)
    setError('')
    setConnected(false)
    setModels([])
    try {
      const list = await listModels()
      setModels(list)
      setConnected(true)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (localHost) tryConnect(localHost)
  }, [])

  const handleSave = () => {
    import('../lib/ollama').then(({ setOllamaHost: syncHost }) => {
      setModelCode(localModelCode)
      setModelArtifacts(localModelArtifacts)
      setOllamaHost(localHost)
      syncHost(localHost)
      setCustomPrompts(localCustomPrompts)
      setShowSettings(false)
    })
  }

  const handleClose = () => {
    if (isDirty) {
      if (confirm('YOU HAVE UNSAVED CHANGES. DISCARD AND CLOSE?')) {
        setShowSettings(false)
      }
    } else {
      setShowSettings(false)
    }
  }

  const promptKeys = Object.keys(DEFAULT_PROMPTS)

  return (
    <div style={{ maxWidth: 750, margin: '0 auto', padding: '40px 30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 26, margin: 0, letterSpacing: '-0.04em' }}>
            SETTINGS
          </h1>
          <p style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 11, marginTop: 8 }}>
            AI MODELS & PROMPT CONFIGURATION
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {isDirty && (
            <Btn onClick={handleSave} variant="primary">SAVE CHANGES</Btn>
          )}
          <Btn
            onClick={handleClose}
            variant="secondary"
            className={flashing ? 'flash-pulse' : ''}
            style={flashing ? { borderColor: 'var(--accent)', boxShadow: '0 0 20px var(--accent-soft)', transform: 'scale(1.1)' } : {}}
          >
            CLOSE [ESC]
          </Btn>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 40, borderBottom: '1px solid var(--border)' }}>
        {['MODELS', 'PROMPTS', 'PLUGINS', 'ABOUT'].map((t, i) => (
          <button
            key={t}
            onClick={() => setActiveTab(t.toLowerCase())}
            style={{
              padding: '10px 24px', border: 'none',
              background: activeTab === t.toLowerCase() ? 'var(--accent)' : 'transparent',
              color: activeTab === t.toLowerCase() ? '#FFF' : 'var(--text-2)',
              fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.1s'
            }}
          >
            {String(i + 1).padStart(2, '0')} {t}
          </button>
        ))}
      </div>

      {activeTab === 'models' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 60 }} className="fade-in">
          {/* Left Column: Model Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

            {/* Code Review Model */}
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)', letterSpacing: '0.1em', fontWeight: 800, marginBottom: 12 }}>
                CODE ANALYSIS ENGINE
              </div>
              <ModelSelect
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
              <ModelSelect
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
      )}

      {activeTab === 'prompts' && (
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
      )}

      {activeTab === 'plugins' && (
        <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 60 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 20, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
                PLUGIN REGISTRY
              </h2>
              <p style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                EXTEND REPOTOPITCH WITH SPECIALIZED ANALYSIS UNITS
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <PluginItem
                name="DEEP DIVE"
                description="High-fidelity file analysis and cross-reference engine."
                status={status.deep_dive_bundled ? 'BUNDLED' : 'LOCKED'}
                tierRequired="PRO"
              />
              <PluginItem
                name="REPORT BRANDING"
                description="Custom white-label PDF and PPTX export themes."
                status={status.report_brand_price > 0 ? 'PURCHASED' : 'LOCKED'}
                tierRequired="PRO"
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={{ background: 'var(--bg-1)', border: '1px solid var(--accent)', padding: '24px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', marginBottom: 16, letterSpacing: '0.1em', fontWeight: 700 }}>
                ABOUT PLUGINS
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
                Plugins are specialized modules that enhance the core analysis engine. Some are bundled with the <strong>Pro Edition</strong>, while others can be purchased individually.
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'about' && (
        <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 60 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 20, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
                REPOTOPITCH V1.1.1
              </h2>
              <p style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                COMMERCIAL EDITION · BUILD 2026.05.05
              </p>
            </div>

            <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', padding: 24 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', marginBottom: 16, letterSpacing: '0.1em', fontWeight: 700 }}>
                CURRENT LICENSE STATUS
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  padding: '4px 12px', background: status.activated ? 'var(--success)' : 'var(--accent-soft)',
                  color: status.activated ? '#FFF' : 'var(--accent)',
                  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 900, borderRadius: 4
                }}>
                  {status.tier.toUpperCase()}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  {status.activated ? 'ACTIVATED & SECURED' : 'COMMUNITY EDITION'}
                </div>
              </div>
              {!status.activated && (
                <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>
                  The Community Edition is free without support, and self compilation. Upgrade to <strong>Desktop</strong> or <strong>Pro</strong> to get support, pre-built exes, and free upgrades.
                </p>
              )}
            </div>

            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', marginBottom: 12, letterSpacing: '0.1em', fontWeight: 700 }}>
                {status.activated ? 'MANAGE LICENSE' : 'ACTIVATE PRODUCT'}
              </div>

              {status.activated ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-2)' }}>
                    Your license is active on this machine. To move your license to another computer, please deactivate it here first.
                  </p>
                  <Btn
                    onClick={deactivate}
                    variant="secondary"
                    disabled={licenceLoading}
                    style={{ width: 'fit-content' }}
                  >
                    {licenceLoading ? 'DEACTIVATING...' : 'DEACTIVATE THIS MACHINE'}
                  </Btn>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', gap: 0, border: '2px solid var(--accent)' }}>
                    <input
                      type="password"
                      value={licenceKey}
                      onChange={(e) => setLicenceKey(e.target.value)}
                      placeholder="PASTE YOUR LICENSE KEY HERE"
                      style={{
                        flex: 1, border: 'none', background: 'transparent',
                        padding: '12px 16px', fontSize: 13, fontFamily: 'var(--font-mono)',
                        outline: 'none'
                      }}
                    />
                    <button
                      onClick={() => activate(licenceKey)}
                      disabled={licenceLoading || !licenceKey}
                      style={{
                        background: 'var(--accent)', color: '#FFF', border: 'none',
                        padding: '0 24px', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 800,
                        cursor: (licenceLoading || !licenceKey) ? 'not-allowed' : 'pointer',
                        opacity: (licenceLoading || !licenceKey) ? 0.7 : 1
                      }}
                    >
                      {licenceLoading ? '...' : 'ACTIVATE'}
                    </button>
                  </div>
                  {licenceError && (
                    <div style={{
                      padding: 12, background: 'var(--danger-soft)', borderLeft: '3px solid var(--danger)',
                      color: 'var(--danger)', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700
                    }}>
                      [ERROR]: {licenceError.toUpperCase()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={{ background: 'var(--bg-1)', border: '1px solid var(--accent)', padding: '24px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', marginBottom: 16, letterSpacing: '0.1em', fontWeight: 700 }}>
                UPGRADE OPTIONS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>DESKTOP EDITION</div>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>Advanced analysis for individual developers.</p>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>PRO EDITION</div>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>The ultimate tool for agencies and teams. Includes all plugins.</p>
                </div>
                <Btn 
                  onClick={() => open('https://repotopitch.lemonsqueezy.com/')}
                  style={{
                    display: 'block', textAlign: 'center', padding: '12px',
                    background: 'var(--accent)', color: '#FFF', textDecoration: 'none',
                    fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 900,
                    marginTop: 8, width: '100%'
                  }}
                >
                  VISIT STORE
                </Btn>
              </div>
            </div>

            <div style={{ padding: '0 24px' }}>
              <p style={{ fontSize: 10, color: 'var(--text-3)', lineHeight: 1.6, fontFamily: 'var(--font-mono)' }}>
                Need help? Contact support at<br />
                <a href="mailto:anuraag.jain@growthvariable.com" style={{ color: 'var(--accent)' }}>anuraag.jain@growthvariable.com</a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ModelSelect({ models, selected, onSelect, loading, connected }) {
  if (!connected && !loading) return (
    <div style={{
      padding: '12px 16px', background: 'var(--bg-1)', border: '1px solid var(--border)',
      color: 'var(--text-3)', fontSize: 11, fontFamily: 'var(--font-mono)'
    }}>
      [LINK OLLAMA TO LOAD REGISTRY]
    </div>
  )

  return (
    <select
      value={selected}
      onChange={(e) => onSelect(e.target.value)}
      style={{
        width: '100%', padding: '10px 16px', background: '#FFF',
        border: '2px solid var(--accent)', borderRadius: 0,
        fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
        color: 'var(--text)', cursor: 'pointer', outline: 'none'
      }}
    >
      <option value="">[CHOOSE MODEL]</option>
      {models.map((m) => (
        <option key={m.name || m.model} value={m.name || m.model}>
          {(m.name || m.model).toUpperCase()} ({(m.size / 1e9).toFixed(1)}GB)
        </option>
      ))}
    </select>
  )
}

function PluginItem({ name, description, status, tierRequired }) {
  return (
    <div style={{
      padding: '20px', background: 'var(--bg-1)', border: '1px solid var(--border)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 800 }}>{name}</div>
          <div style={{
            padding: '2px 8px', background: status === 'LOCKED' ? 'var(--bg-2)' : 'var(--success-soft)',
            color: status === 'LOCKED' ? 'var(--text-3)' : 'var(--success)',
            fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 900, borderRadius: 2
          }}>
            {status}
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-2)', maxWidth: 400 }}>{description}</p>
      </div>
      {status === 'LOCKED' && (
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)', marginBottom: 4 }}>REQUIRES</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 800, color: 'var(--accent)' }}>{tierRequired}</div>
        </div>
      )}
    </div>
  )
}
