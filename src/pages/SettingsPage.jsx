import { useState, useEffect, useMemo, Suspense, lazy } from 'react'
import { listModels } from '../lib/ollama'
import { useStore } from '../lib/store'
import { Btn } from '../components/UI'
import { DEFAULT_PROMPTS } from '../lib/prompts'
import { useLicence } from '../hooks/useLicence'
import { open } from '@tauri-apps/plugin-shell'
import { readFile, writeTextFile, mkdir, exists, writeFile, BaseDirectory } from '@tauri-apps/plugin-fs'
import { open as openDialog } from '@tauri-apps/plugin-dialog'
import { getInstalledPlugins } from '../lib/pluginLoader'
import { invoke } from '@tauri-apps/api/core'
import { appDataDir, join } from '@tauri-apps/api/path'

// Core Tabs
import { ModelsTab } from '../components/Settings/ModelsTab'
import { PromptsTab } from '../components/Settings/PromptsTab'
import { PluginsTab } from '../components/Settings/PluginsTab'
import { AboutTab } from '../components/Settings/AboutTab'

// Specialized / Premium Tabs (Lazy loaded to keep community build clean)
const BrandTab = lazy(() => import('../components/Settings/BrandTab').catch(() => ({ default: () => null })));

export default function SettingsPage() {
  const {
    modelCode: storeModelCode, setModelCode,
    modelArtifacts: storeModelArtifacts, setModelArtifacts,
    ollamaHost: storeOllamaHost, setOllamaHost,
    customPrompts: storeCustomPrompts, setCustomPrompts,
    brandConfig, setBrandConfig,
    resetSystem,
    setShowSettings,
    settingsFlashCount
  } = useStore()

  const [activeTab, setActiveTab] = useState('models') 
  const { status, activate, deactivate, loading: licenceLoading, error: licenceError } = useLicence()
  const [licenceKey, setLicenceKey] = useState('')
  const [flashing, setFlashing] = useState(false)
  const [installedPlugins, setInstalledPlugins] = useState([])

  useEffect(() => {
    getInstalledPlugins().then(setInstalledPlugins);
  }, []);

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
  const [localBrandConfig, setLocalBrandConfig] = useState(brandConfig)

  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [connected, setConnected] = useState(false)
  const [selectedPromptKey, setSelectedPromptKey] = useState('repoOverview')

  const isDirty =
    localModelCode !== storeModelCode ||
    localModelArtifacts !== storeModelArtifacts ||
    localHost !== storeOllamaHost ||
    JSON.stringify(localCustomPrompts) !== JSON.stringify(storeCustomPrompts) ||
    JSON.stringify(localBrandConfig) !== JSON.stringify(brandConfig)

  const tryConnect = async (h) => {
    setLoading(true); setError(''); setConnected(false); setModels([]);
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

  const [pendingPlugin, setPendingPlugin] = useState(null)
  const [pluginLicenseKey, setPluginLicenseKey] = useState('')
  const [pluginVerifying, setPluginVerifying] = useState(false)
  const [pluginVerifyError, setPluginVerifyError] = useState('')

  const handleUpdatePluginScript = async (pluginId, entryName) => {
    try {
      const selected = await openDialog({ filters: [{ name: 'Compiled Plugin Scripts', extensions: ['js', 'json'] }] })
      if (selected) {
        const buffer = await readFile(selected)
        const content = new TextDecoder().decode(buffer)
        const baseConfig = await appDataDir()
        const pluginDir = await join(baseConfig, 'growthvariable', 'RepoToPitch', 'plugins', pluginId)
        await writeTextFile(await join(pluginDir, entryName || 'branding.js'), content)
        const updatedList = await getInstalledPlugins()
        setInstalledPlugins(updatedList)
        alert(`Successfully updated code payload for unit: ${pluginId}`)
      }
    } catch (err) {
      alert(`Update failed: ${err.message || err}`)
    }
  }

  const extractTemplateXML = async (type, arrayBuffer) => {
    try {
      const JSZip = (await import('jszip')).default;
      const loadedZip = await new JSZip().loadAsync(arrayBuffer);
      if (type === 'docx') {
        const docFile = loadedZip.file('word/document.xml');
        if (docFile) {
          const docXml = await docFile.async('string');
          let wipedDocXml = docXml;
          const bodyStart = docXml.indexOf('<w:body>') + '<w:body>'.length;
          const sectPrStart = docXml.lastIndexOf('<w:sectPr');
          if (bodyStart !== -1 && sectPrStart !== -1 && sectPrStart > bodyStart) {
            wipedDocXml = docXml.substring(0, bodyStart) + docXml.substring(sectPrStart);
          }
          await writeFile(`growthvariable/RepoToPitch/brand/docx_document_template.xml`, new TextEncoder().encode(wipedDocXml), { baseDir: BaseDirectory.AppData });
        }
      }
    } catch (e) { console.warn(`[SETTINGS] XML unpack fail:`, e); }
  }

  const handleSelectTemplate = async (type, fileObj) => {
    try {
      const baseConfig = await appDataDir()
      const brandConfigDir = await join(baseConfig, 'growthvariable', 'RepoToPitch', 'brand')
      await mkdir('growthvariable/RepoToPitch/brand', { baseDir: BaseDirectory.AppData, recursive: true })

      if (fileObj) {
        const reader = new FileReader()
        reader.onload = async (e) => {
          const arrayBuffer = e.target.result
          const name = fileObj.name || `template.${type}`
          await writeFile(`growthvariable/RepoToPitch/brand/${name}`, new Uint8Array(arrayBuffer), { baseDir: BaseDirectory.AppData })
          await extractTemplateXML(type, arrayBuffer)
          const fullPath = await join(brandConfigDir, name)
          setLocalBrandConfig(prev => ({ ...prev, templates: { ...(prev?.templates || {}), [type]: fullPath } }))
        }
        reader.readAsArrayBuffer(fileObj); return;
      }

      const selected = await openDialog({ filters: [type === 'docx' ? { name: 'Word Templates', extensions: ['docx'] } : { name: 'PowerPoint Templates', extensions: ['pptx'] }] })
      if (selected) {
        const fileName = selected.split(/[\\/]/).pop() || `template.${type}`
        const buffer = await readFile(selected)
        await writeFile(`growthvariable/RepoToPitch/brand/${fileName}`, buffer, { baseDir: BaseDirectory.AppData })
        await extractTemplateXML(type, buffer.buffer || buffer)
        const fullPath = await join(brandConfigDir, fileName)
        setLocalBrandConfig(prev => ({ ...prev, templates: { ...(prev?.templates || {}), [type]: fullPath } }))
      }
    } catch (err) { alert(`Copy failed: ${err.message || err}`) }
  }

  const handleLoadPluginFile = async () => {
    try {
      const selected = await openDialog({ filters: [{ name: 'Compiled Plugin Scripts', extensions: ['js', 'json'] }] })
      if (selected) {
        const buffer = await readFile(selected)
        const content = new TextDecoder().decode(buffer)
        let pluginObj = null
        if (selected.endsWith('.json')) {
          try { const p = JSON.parse(content); if (p.id && p.code) pluginObj = p; } catch (e) {}
        }
        if (!pluginObj) {
          const id = (content.match(/@plugin_id\s+([^\s]+)/) || [null, 'custom-plugin'])[1]
          const name = (content.match(/@plugin_name\s+([^\r\n]+)/) || [null, 'Specialized Extension Unit'])[1].trim()
          const tabName = (content.match(/@plugin_tab_name\s+([^\r\n]+)/) || [null, ''])[1].trim()
          pluginObj = { id, name, tabName, version: '1.0.0', entry: selected.split(/[\\/]/).pop(), code: content }
        }
        setPendingPlugin(pluginObj); setPluginLicenseKey(''); setPluginVerifyError('');
      }
    } catch (err) { alert(`Read fail: ${err.message || err}`) }
  }

  const handleVerifyAndInstallPlugin = async () => {
    if (!pendingPlugin || !pluginLicenseKey) return
    setPluginVerifying(true); setPluginVerifyError('')
    try {
      await invoke('activate_plugin_licence', { pluginId: pendingPlugin.id, key: pluginLicenseKey })
      const relPluginDir = `growthvariable/RepoToPitch/plugins/${pendingPlugin.id}`
      await mkdir(relPluginDir, { baseDir: BaseDirectory.AppData, recursive: true })
      await writeTextFile(`${relPluginDir}/manifest.json`, JSON.stringify({ ...pendingPlugin, code: undefined, active: true }, null, 2), { baseDir: BaseDirectory.AppData })
      await writeTextFile(`${relPluginDir}/${pendingPlugin.entry || 'branding.js'}`, pendingPlugin.code, { baseDir: BaseDirectory.AppData })
      const updatedList = await getInstalledPlugins()
      setInstalledPlugins(updatedList)
      const targetTab = pendingPlugin.tabName || (pendingPlugin.id === 'report-brand' ? 'BRAND' : '')
      setPendingPlugin(null)
      if (targetTab) setActiveTab(targetTab.toLowerCase())
    } catch (err) { setPluginVerifyError(err.message || err) } finally { setPluginVerifying(false) }
  }

  const handleRemovePlugin = async (pluginId) => {
    if (confirm(`REMOVE PLUGIN: ${pluginId.toUpperCase()}?`)) {
      try {
        await invoke('deactivate_plugin_licence', { pluginId })
        try { await (await import('@tauri-apps/plugin-fs')).remove(`growthvariable/RepoToPitch/plugins/${pluginId}`, { baseDir: BaseDirectory.AppData, recursive: true }) } catch (e) {}
        const updatedList = await getInstalledPlugins()
        setInstalledPlugins(updatedList)
        const removed = installedPlugins.find(p => p.id === pluginId)
        if (removed?.tabName && activeTab === removed.tabName.toLowerCase()) setActiveTab('plugins')
        if (pluginId === 'report-brand') setLocalBrandConfig({});
      } catch (err) { alert(`Remove failed: ${err.message || err}`) }
    }
  }

  const handleSave = async () => {
    try {
      await mkdir('growthvariable/RepoToPitch/brand', { baseDir: BaseDirectory.AppData, recursive: true })
      const c = localBrandConfig || {}
      const toml = `[brand]\ncompany_name = "${(c.companyName || '').replace(/"/g, '\\"')}"\n\n[colours]\nprimary = "${c.colours?.primary || '#2563eb'}"\nsecondary = "${c.colours?.secondary || '#64748b'}"\naccent = "${c.colours?.accent || '#f59e0b'}"\n\n[templates]\ndocx_path = "${(c.templates?.docx || '').replace(/"/g, '\\"')}"\npptx_path = "${(c.templates?.pptx || '').replace(/"/g, '\\"')}"\n`
      await writeTextFile('growthvariable/RepoToPitch/brand/brand.toml', toml, { baseDir: BaseDirectory.AppData })
    } catch (e) {}
    import('../lib/ollama').then(({ setOllamaHost: syncHost }) => {
      setModelCode(localModelCode); setModelArtifacts(localModelArtifacts);
      setOllamaHost(localHost); syncHost(localHost);
      setCustomPrompts(localCustomPrompts); setBrandConfig(localBrandConfig);
    })
  }

  const handleClose = () => {
    if (isDirty && !confirm('DISCARD UNSAVED CHANGES?')) return
    setShowSettings(false)
  }

  // --- Dynamic Tab Registry System ---
  const TABS_CONFIG = useMemo(() => {
    const core = [
      { id: 'models', label: 'MODELS', component: ModelsTab },
      { id: 'prompts', label: 'PROMPTS', component: PromptsTab },
    ];
    
    const plugins = installedPlugins
      .filter(p => p.tabName || p.id === 'report-brand')
      .map(p => {
        const id = p.id === 'report-brand' ? 'brand' : p.id.toLowerCase();
        const label = (p.tabName || 'BRAND').toUpperCase();
        // If it's the official brand plugin, use the specialized component
        const component = id === 'brand' ? BrandTab : null; 
        return { id, label, component, p };
      });

    const footer = [
      { id: 'plugins', label: 'PLUGINS', component: PluginsTab },
      { id: 'about', label: 'ABOUT', component: AboutTab },
    ];

    // Deduplicate and merge
    const all = [...core, ...plugins, ...footer];
    return all.filter((t, i, self) => self.findIndex(x => x.id === t.id) === i);
  }, [installedPlugins]);

  return (
    <div style={{ maxWidth: 750, margin: '0 auto', padding: '40px 30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 26, margin: 0, letterSpacing: '-0.04em' }}>SETTINGS</h1>
          <p style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 11, marginTop: 8 }}>AI MODELS & PROMPT CONFIGURATION</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {isDirty && <Btn onClick={handleSave} variant="primary">SAVE CHANGES</Btn>}
          <Btn onClick={handleClose} variant="secondary" className={flashing ? 'flash-pulse' : ''} style={flashing ? { borderColor: 'var(--accent)', boxShadow: '0 0 20px var(--accent-soft)', transform: 'scale(1.1)' } : {}}>CLOSE [ESC]</Btn>
        </div>
      </div>

      {/* Dynamic Tab Bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 40, borderBottom: '1px solid var(--border)' }}>
        {TABS_CONFIG.map((t, i) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '10px 24px', border: 'none', background: activeTab === t.id ? 'var(--accent)' : 'transparent', color: activeTab === t.id ? '#FFF' : 'var(--text-2)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.1s' }}>
            {String(i + 1).padStart(2, '0')} {t.label}
          </button>
        ))}
      </div>

      {/* Dynamic Content Area */}
      <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11 }}>INITIALIZING UNIT...</div>}>
        {TABS_CONFIG.map((t) => {
          if (activeTab !== t.id) return null;
          
          // Core or Registered Component
          if (t.component) {
            const Comp = t.component;
            return (
              <Comp key={t.id}
                models={models} localModelCode={localModelCode} setLocalModelCode={setLocalModelCode}
                localModelArtifacts={localModelArtifacts} setLocalModelArtifacts={setLocalModelArtifacts}
                localHost={localHost} setLocalHost={setLocalHost} tryConnect={tryConnect} loading={loading} connected={connected} resetSystem={resetSystem}
                promptKeys={Object.keys(DEFAULT_PROMPTS)} selectedPromptKey={selectedPromptKey} setSelectedPromptKey={setSelectedPromptKey}
                localCustomPrompts={localCustomPrompts} setLocalCustomPrompts={setLocalCustomPrompts}
                localBrandConfig={localBrandConfig} setLocalBrandConfig={setLocalBrandConfig} handleSelectTemplate={handleSelectTemplate}
                status={status} installedPlugins={installedPlugins} handleUpdatePluginScript={handleUpdatePluginScript}
                handleRemovePlugin={handleRemovePlugin} handleLoadPluginFile={handleLoadPluginFile} pendingPlugin={pendingPlugin}
                pluginLicenseKey={pluginLicenseKey} setPluginLicenseKey={setPluginLicenseKey} handleVerifyAndInstallPlugin={handleVerifyAndInstallPlugin}
                pluginVerifying={pluginVerifying} pluginVerifyError={pluginVerifyError}
                activate={activate} deactivate={deactivate} licenceLoading={licenceLoading} licenceError={licenceError}
                licenceKey={licenceKey} setLicenceKey={setLicenceKey} open={open}
              />
            );
          }

          // Generic Plugin Fallback
          return (
            <div key={t.id} className="fade-in" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', padding: 40, borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, margin: 0, color: 'var(--accent)' }}>{t.label} STUDIO</h2>
                <div style={{ background: 'var(--bg-2)', color: 'var(--text-3)', padding: '2px 8px', fontSize: 10, fontFamily: 'var(--font-mono)', borderRadius: 4 }}>{t.p.id}</div>
              </div>
              <p style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 32 }}>{t.p.description || 'Custom third-party runtime evaluation layout subsystem.'}</p>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', marginBottom: 12 }}>// UNIT RUNTIME PAYLOAD</div>
                <div style={{ background: 'var(--bg-2)', padding: 16, borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>
                  Active custom runtime layout interface initialized successfully. Payload hooks fully integrated into main execution bus.
                </div>
              </div>
            </div>
          );
        })}
      </Suspense>
    </div>
  )
}

