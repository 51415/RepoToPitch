import { useState } from 'react'

export function FolderTree({ treeData, onToggleIgnore, os = 'unix' }) {
  const [collapsed, setCollapsed] = useState(new Set())

  const toggleCollapse = (path) => {
    const next = new Set(collapsed)
    if (next.has(path)) next.delete(path)
    else next.add(path)
    setCollapsed(next)
  }

  const sep = os === 'windows' ? '\\' : '/'

  function renderNode(node, parentIgnored = false) {
    const isFolder = node.kind === 'directory'
    const isCollapsed = collapsed.has(node.path)
    const hasChildren = node.children && node.children.length > 0
    const isIgnored = node.ignored || parentIgnored

    return (
      <div key={node.path} style={{ marginLeft: 16 }}>
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: 10, padding: '2px 0',
          opacity: isIgnored ? 0.5 : 1,
          transition: 'all 0.1s'
        }}>
          {isFolder ? (
            <button 
              onClick={() => toggleCollapse(node.path)}
              style={{ 
                background: 'transparent', border: 'none', cursor: 'pointer', 
                fontSize: 10, color: isIgnored ? '#ef4444' : '#22c55e', padding: 0, width: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)', fontWeight: 800
              }}
            >
              {hasChildren ? (isCollapsed ? '+' : '—') : '•'}
            </button>
          ) : (
            <div style={{ width: 12, display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 4, height: 4, background: isIgnored ? '#ef4444' : '#22c55e' }} />
            </div>
          )}

          <span style={{ 
            fontFamily: 'var(--font-mono)', fontSize: 11, 
            color: isIgnored ? '#ef4444' : '#22c55e',
            textDecoration: isIgnored ? 'line-through' : 'none',
            flex: 1,
            cursor: isFolder ? 'pointer' : 'default',
            fontWeight: isFolder ? 700 : 400,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
          }} onClick={() => isFolder && toggleCollapse(node.path)}>
            {node.name}{isFolder ? sep : ''}
          </span>

          <button 
            onClick={() => onToggleIgnore(node.path)}
            disabled={parentIgnored}
            style={{ 
              background: isIgnored ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.05)', 
              border: `1px solid ${isIgnored ? '#ef444433' : '#22c55e33'}`, 
              borderRadius: 0, cursor: parentIgnored ? 'not-allowed' : 'pointer', fontSize: 8, 
              padding: '1px 4px', color: isIgnored ? '#ef4444' : '#22c55e',
              fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', fontWeight: 800,
              opacity: parentIgnored ? 0.5 : 1
            }}
            title={parentIgnored ? "Parent folder is ignored" : ""}
          >
            {isIgnored ? 'RESTORE' : 'IGNORE'}
          </button>
        </div>

        {isFolder && !isCollapsed && node.children.length > 0 && (
          <div style={{ borderLeft: `1px solid ${isIgnored ? '#ef444422' : '#22c55e22'}`, marginLeft: 5 }}>
            {node.children.map(c => renderNode(c, isIgnored))}
          </div>
        )}
      </div>
    )
  }

  if (!treeData || treeData.length === 0) return null

  return (
    <div style={{ padding: '8px 0' }}>
      {treeData.map(node => renderNode(node, false))}
    </div>
  )
}
