import React from 'react'
import { Btn, Input } from '../UI'
import { PluginItem } from './PluginItem'
import { open } from '@tauri-apps/plugin-shell'

export function PluginsTab({
  status,
  installedPlugins,
  handleUpdatePluginScript,
  handleRemovePlugin,
  handleLoadPluginFile,
  pendingPlugin,
  pluginLicenseKey,
  setPluginLicenseKey,
  handleVerifyAndInstallPlugin,
  pluginVerifying,
  pluginVerifyError
}) {
  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 60 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, margin: 0, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, var(--accent), #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              PLUGINS STUDIO
            </h2>
            <div style={{ background: 'var(--accent-soft)', color: 'var(--accent)', padding: '2px 8px', fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 900, borderRadius: 4 }}>
              EXTENSIONS
            </div>
          </div>
          <p style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 11, margin: 0 }}>
            EXTEND REPOTOPITCH WITH SPECIALIZED ANALYSIS & EXPORT OVERLAY UNITS
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {installedPlugins?.length > 0 ? (
            installedPlugins.map(plugin => (
              <PluginItem
                key={plugin.id}
                name={plugin.name?.toUpperCase() || plugin.id.toUpperCase()}
                description={plugin.description}
                status={status?.activated_plugins?.includes(plugin.id) || plugin.active ? 'ACTIVATED' : 'PURCHASED'}
                tierRequired="ANY"
                onUpdate={() => handleUpdatePluginScript(plugin.id, plugin.entry)}
                onRemove={() => handleRemovePlugin && handleRemovePlugin(plugin.id)}
              />
            ))
          ) : (
            <div style={{ 
              background: 'var(--bg-1)', border: '2px dashed var(--border)', padding: 36, 
              borderRadius: 8, textAlign: 'center', display: 'flex', flexDirection: 'column', 
              alignItems: 'center', gap: 16 
            }}>
              <div style={{ fontSize: 24 }}>🛍️</div>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>
                  NO PLUGINS DETECTED
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '4px 0 0 0', maxWidth: 280 }}>
                  Check out the store for plugins to enhance your analysis workflows.
                </p>
              </div>
              <Btn 
                variant="primary" 
                size="sm" 
                onClick={() => open('https://repotopitch.lemonsqueezy.com/')}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 800 }}
              >
                BROWSE REPOTOPITCH STORE
              </Btn>
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)', letterSpacing: '0.1em', fontWeight: 800, marginBottom: 4 }}>
              ADD PLUGIN
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>
              Select an individual downloaded compiled plugin file (.js) to install and verify its commercial license.
            </p>
          </div>

          <Btn variant="primary" onClick={handleLoadPluginFile} style={{ width: 'fit-content' }}>
            CHOOSE DOWNLOADED PLUGIN FILE
          </Btn>

          {pendingPlugin && (
            <div style={{
              background: 'var(--bg-2)', border: '1px solid var(--accent)', padding: 24,
              borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 16,
              marginTop: 8
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', fontWeight: 800, letterSpacing: '0.05em' }}>
                  LICENSE VERIFICATION REQUIRED
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, marginTop: 4 }}>
                  {pendingPlugin.name}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '4px 0 0 0' }}>
                  {pendingPlugin.description || 'Enter your LemonSqueezy license key to verify and activate this unit.'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 0, border: '2px solid var(--accent)' }}>
                <Input
                  value={pluginLicenseKey}
                  onChange={setPluginLicenseKey}
                  placeholder="PASTE PLUGIN LICENSE KEY"
                  style={{ flex: 1, border: 'none', background: '#FFF', padding: '10px 14px', fontSize: 12 }}
                />
                <button
                  onClick={handleVerifyAndInstallPlugin}
                  disabled={pluginVerifying || !pluginLicenseKey}
                  style={{
                    background: 'var(--accent)', color: '#FFF', border: 'none',
                    padding: '0 20px', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 800,
                    cursor: (pluginVerifying || !pluginLicenseKey) ? 'not-allowed' : 'pointer',
                    opacity: (pluginVerifying || !pluginLicenseKey) ? 0.7 : 1
                  }}
                >
                  {pluginVerifying ? 'VERIFYING...' : 'CONFIRM'}
                </button>
              </div>
              {pluginVerifyError && (
                <div style={{ fontSize: 11, color: 'var(--danger)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  [ERROR]: {pluginVerifyError}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ background: 'var(--bg-1)', border: '1px solid var(--accent)', padding: '24px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', marginBottom: 16, letterSpacing: '0.1em', fontWeight: 700 }}>
            ABOUT PLUGINS
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
            Plugins are specialized modules that enhance the core analysis engine. They can be purchased individually or as a bundle from the store.
          </div>
        </div>
      </div>

    </div>
  )
}
