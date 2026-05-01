import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// ── Button ─────────────────────────────────────────────────────────────────────
export function Btn({ children, onClick, disabled, variant = 'primary', size = 'md', style = {}, title, loading = false, className }) {
  const sizes = {
    sm: { padding: '6px 14px', fontSize: '12px' },
    md: { padding: '8px 18px', fontSize: '13px' },
    lg: { padding: '10px 22px', fontSize: '15px' },
  }
  const variants = {
    primary: {
      background: 'var(--accent)',
      color: '#FFF', border: '1px solid var(--accent)', fontWeight: 800,
      letterSpacing: '0.1em'
    },
    secondary: {
      background: 'var(--bg-1)', color: 'var(--text)',
      border: '1px solid var(--border-strong)',
      boxShadow: 'var(--shadow)',
      letterSpacing: '0.1em', fontWeight: 800
    },
    accent: {
      background: 'var(--accent-soft)', color: 'var(--accent-deep)',
      border: '1px solid var(--accent)',
      letterSpacing: '0.1em', fontWeight: 800
    },
    ghost: {
      background: 'transparent', color: 'var(--text-2)',
      border: '1px solid var(--border-dim)',
      fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700
    },
    danger: {
      background: 'transparent', color: 'var(--danger)',
      border: '1px solid var(--danger)',
      letterSpacing: '0.1em', fontWeight: 800
    },
  }
  const isCurrentlyDisabled = disabled || loading
  return (
    <button
      onClick={onClick}
      disabled={isCurrentlyDisabled}
      title={title}
      className={className}
      style={{
        borderRadius: 'var(--radius)',
        cursor: loading ? 'wait' : (disabled ? 'not-allowed' : 'pointer'),
        opacity: isCurrentlyDisabled ? 0.3 : 1,
        fontFamily: 'var(--font-mono)',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'inline-flex', alignItems: 'center', gap: 12,
        whiteSpace: 'nowrap',
        justifyContent: 'center',
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        ...sizes[size],
        ...variants[variant],
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!isCurrentlyDisabled) {
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
          if (variant === 'primary') e.currentTarget.style.background = 'var(--accent-deep)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isCurrentlyDisabled) {
          e.currentTarget.style.transform = 'none'
          e.currentTarget.style.boxShadow = variant === 'secondary' ? 'var(--shadow)' : 'none'
          if (variant === 'primary') e.currentTarget.style.background = 'var(--accent)'
        }
      }}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{children}</span>
    </button>
  )
}

// ── Card ───────────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, variant = 'blue', ...props }) {
  const isBlue = variant === 'blue'
  return (
    <div className="glass-panel" {...props} style={{
      padding: '24px',
      border: isBlue ? '1px solid var(--accent)' : '1px solid var(--border-strong)',
      boxShadow: isBlue ? 'var(--shadow-lg)' : 'var(--shadow)',
      position: 'relative',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── VerticalTabs ──────────────────────────────────────────────────────────────
export function VerticalTabs({ tabs, activeId, onChange, style = {} }) {
  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', gap: 4, 
      borderRight: '1px solid var(--border)', paddingRight: 24,
      ...style 
    }}>
      {tabs.map(t => {
        const active = t.id === activeId
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderRadius: 'var(--radius)',
              background: active ? 'var(--accent-soft)' : 'transparent',
              color: active ? 'var(--accent-deep)' : 'var(--text-3)',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              transition: 'all 0.2s',
              letterSpacing: '0.05em'
            }}
          >
            {t.label}
            {t.done && (
              <div style={{ 
                width: 6, height: 6, borderRadius: '50%', 
                background: active ? 'var(--accent)' : 'var(--success)' 
              }} />
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Tag ────────────────────────────────────────────────────────────────────────
export function Tag({ children, color = 'accent' }) {
  const colors = {
    accent: { bg: 'var(--accent)', color: '#FFF', border: 'var(--accent)' },
    indigo: { bg: 'var(--accent-soft)', color: 'var(--accent-deep)', border: 'var(--accent-soft)' },
    gray:   { bg: 'var(--bg-1)', color: 'var(--text-3)', border: 'var(--border-dim)' },
  }
  const theme = colors[color] || colors.accent
  return (
    <span style={{
      background: theme.bg,
      color: theme.color,
      border: `1px solid ${theme.border}`,
      fontFamily: 'var(--font-mono)',
      fontSize: '11px',
      padding: '4px 12px',
      borderRadius: '0',
      letterSpacing: '0.1em',
      fontWeight: 800,
    }}>
      {children}
    </span>
  )
}

// ── StreamBox ──────────────────────────────────────────────────────────────────
export function StreamBox({ text, loading, style = {} }) {
  if (!text && !loading) return null
  return (
    <div style={{
      background: 'var(--bg-1)',
      border: '1px solid var(--accent)',
      borderRadius: 'var(--radius)',
      padding: '32px',
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      lineHeight: 1.6,
      color: 'var(--text-2)',
      whiteSpace: 'pre-wrap',
      minHeight: 120,
      maxHeight: 520,
      overflowY: 'auto',
      position: 'relative',
      ...style
    }}>
      {!text && loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--accent)' }}>
          <Spinner size={16} />
          <span style={{ letterSpacing: '0.1em' }}>[Linking Streaming Node]</span>
        </div>
      )}
      {!text && !loading && <span style={{ color: 'var(--text-3)' }}>[AWAITING_INITIALISATION]</span>}
      {text}
      {loading && text && (
        <span style={{
          display: 'inline-block', width: 8, height: 14,
          background: 'var(--accent-soft)', marginLeft: 6,
          animation: 'blink 0.8s step-end infinite',
          verticalAlign: 'middle',
        }} />
      )}
    </div>
  )
}

// ── MarkdownView ───────────────────────────────────────────────────────────────
export function MarkdownView({ content, loading, style = {} }) {
  if (!content && !loading) return null
  return (
    <div style={{
      background: '#FFF',
      border: '1px solid var(--accent)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      maxHeight: 800,
      overflowY: 'auto',
      boxShadow: 'var(--shadow)',
      position: 'relative',
      ...style
    }}>
      {loading && !content && (
        <div style={{ 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
          minHeight: 200, color: 'var(--accent)', gap: 24 
        }}>
          <Spinner size={40} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 800, letterSpacing: '0.15em' }}>
            [Executing Deep Analysis]
          </div>
        </div>
      )}
      {content && (
        <div className="md-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content
              .replace(/\$\s*([→↔←])\s*\$/g, '$1')
              .replace(/\$\\(?:leftrightarrow|longleftrightarrow)\$/g, '↔')
              .replace(/\$\\(?:rightarrow|longrightarrow)\$/g, '→')
              .replace(/\$\\(?:leftarrow|longleftarrow)\$/g, '←')
              .replace(/\\leftrightarrow/g, '↔')
              .replace(/\\rightarrow/g, '→')
              .replace(/\\leftarrow/g, '←')
            }
          </ReactMarkdown>
        </div>
      )}
    </div>
  )
}

// ── Input / Textarea ───────────────────────────────────────────────────────────
export function Input({ value, onChange, placeholder, style = {} }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background: 'var(--bg-1)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius)',
        padding: '12px 16px',
        color: 'var(--text)',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        fontWeight: 700,
        outline: 'none',
        width: '100%',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        ...style,
      }}
      onFocus={(e) => {
        e.target.style.borderColor = 'var(--accent)'
        e.target.style.boxShadow = '0 0 0 4px var(--accent-soft)'
      }}
      onBlur={(e) => {
        e.target.style.borderColor = 'var(--border-strong)'
        e.target.style.boxShadow = 'none'
      }}
    />
  )
}

export function Textarea({ value, onChange, placeholder, rows = 6, style = {}, mono = false }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        background: '#FFF',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius)',
        padding: '16px',
        color: 'var(--text)',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        fontWeight: 700,
        lineHeight: 1.6,
        outline: 'none',
        width: '100%',
        resize: 'vertical',
        transition: 'all 0.2s',
        ...style,
      }}
      onFocus={(e) => {
        e.target.style.background = 'var(--bg-1)'
        e.target.style.borderColor = 'var(--accent)'
      }}
      onBlur={(e) => {
        e.target.style.background = '#FFF'
        e.target.style.borderColor = 'var(--border-strong)'
      }}
    />
  )
}

// ── Spinner ────────────────────────────────────────────────────────────────────
export function Spinner({ size = 20 }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid var(--bg-3)`,
      borderTopColor: 'var(--accent)',
      borderRadius: '50%',
      animation: 'spin 0.6s linear infinite',
      flexShrink: 0,
    }} />
  )
}

export function SectionTitle({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900, color: 'var(--text)', marginBottom: 10 }}>{title}</h1>
      <p style={{ color: 'var(--text-3)', fontSize: 15, fontWeight: 500 }}>{subtitle}</p>
    </div>
  )
}

// ── Copy button ────────────────────────────────────────────────────────────────
export function CopyBtn({ text, style = {} }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <Btn variant="secondary" size="sm" onClick={copy} style={style}>
      {copied ? 'COPIED' : 'COPY'}
    </Btn>
  )
}

// ── StatusLog ──────────────────────────────────────────────────────────────────
export function StatusLog({ messages = [] }) {
  const [visible, setVisible] = useState([])
  
  useEffect(() => {
    if (messages.length > visible.length) {
      const next = messages[visible.length]
      const timer = setTimeout(() => {
        setVisible(prev => [...prev, next])
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [messages, visible])

  return (
    <div style={{
      background: 'var(--bg-1)', color: 'var(--text)',
      fontFamily: 'var(--font-mono)', fontSize: 11, padding: '24px',
      borderRadius: 'var(--radius)', maxHeight: 160, overflowY: 'auto',
      border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow)',
      fontWeight: 700
    }}>
      {visible.map((m, i) => (
        <div key={i} style={{ marginBottom: 6, display: 'flex', gap: 16 }}>
          <span style={{ color: 'var(--text-3)', opacity: 0.6 }}>[{new Date().toLocaleTimeString([], {hour12:false})}]</span>
          <span>{m}</span>
        </div>
      ))}
      <div style={{ width: 8, height: 12, background: 'var(--accent-soft)', display: 'inline-block', animation: 'blink 0.8s infinite', verticalAlign: 'middle' }} />
    </div>
  )
}
// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ isOpen, onClose, title, children, footer }) {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(15, 23, 42, 0.1)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000, padding: 20
    }}>
      <div 
        className="fade-in"
        style={{
          background: '#FFF', width: '100%', maxWidth: 500,
          borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border)', overflow: 'hidden',
          display: 'flex', flexDirection: 'column'
        }}
      >
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 900, margin: 0, letterSpacing: '0.05em' }}>
            {title}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-3)' }}>×</button>
        </div>
        <div style={{ padding: '24px' }}>
          {children}
        </div>
        {footer && (
          <div style={{ padding: '16px 24px', background: 'var(--bg-1)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

