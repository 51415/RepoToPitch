import React from 'react'

export function PluginItem({ name, description, status, tierRequired, onUpdate, onRemove }) {
  return (
    <div style={{ 
      padding: '20px', background: 'var(--bg-1)', border: '1px solid var(--border)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 800 }}>{name}</div>
          <div style={{ 
            padding: '2px 8px', 
            background: status === 'LOCKED' ? 'var(--bg-2)' : status === 'ACTIVATED' ? 'var(--success)' : 'var(--success-soft)',
            color: status === 'LOCKED' ? 'var(--text-3)' : status === 'ACTIVATED' ? '#FFF' : 'var(--success)',
            fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 900, borderRadius: 2
          }}>
            {status}
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-2)', maxWidth: 400 }}>{description}</p>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {status === 'LOCKED' && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-3)', marginBottom: 4 }}>REQUIRES</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 800, color: 'var(--accent)' }}>{tierRequired}</div>
          </div>
        )}
        {status === 'ACTIVATED' && onUpdate && (
          <button
            onClick={onUpdate}
            title="Reload code payload from disk without losing verification state"
            style={{
              background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text)',
              padding: '6px 12px', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 800,
              borderRadius: 4, cursor: 'pointer'
            }}
          >
            UPDATE SCRIPT
          </button>
        )}
        {onRemove && (
          <button
            onClick={onRemove}
            title="Uninstall plugin and revoke license status"
            style={{
              background: 'var(--danger-soft)', border: '1px solid var(--danger)', color: 'var(--danger)',
              padding: '6px 12px', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 800,
              borderRadius: 4, cursor: 'pointer'
            }}
          >
            REMOVE
          </button>
        )}
      </div>
    </div>
  )
}
