import React from 'react'

export function SettingsModelSelect({ models, selected, onSelect, loading, connected }) {
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
