import React from 'react'
import { Btn } from '../UI'

export function AboutTab({
  status,
  activate,
  deactivate,
  licenceLoading,
  licenceError,
  licenceKey,
  setLicenceKey,
  open
}) {
  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 60 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, margin: 0, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, var(--accent), #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ABOUT STUDIO
            </h2>
            <div style={{ background: 'var(--accent-soft)', color: 'var(--accent)', padding: '2px 8px', fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 900, borderRadius: 4 }}>
              SYSTEM_CORE
            </div>
          </div>
          <p style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 11, margin: 0 }}>
            REPOTOPITCH V1.1.5 · COMMUNITY PLATFORM ENGINE LAYER
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
  )
}
