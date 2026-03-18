import { useState } from 'react'

function FieldHelper({ title, description, example, onUseExample }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ marginTop: '0.25rem' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          fontSize: '0.72rem',
          color: '#6366f1',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
        }}
      >
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          backgroundColor: 'rgba(99, 102, 241, 0.12)',
          fontSize: '0.6rem',
          fontWeight: 700,
          color: '#6366f1',
          flexShrink: 0,
        }}>?</span>
        <span>{open ? 'Ocultar ajuda' : 'Como preencher?'}</span>
      </button>

      {open && (
        <div style={{
          marginTop: '0.35rem',
          padding: '0.6rem 0.75rem',
          borderRadius: '8px',
          backgroundColor: 'rgba(99, 102, 241, 0.06)',
          border: '1px solid rgba(99, 102, 241, 0.15)',
          fontSize: '0.78rem',
          lineHeight: 1.6,
          color: 'var(--text, #374151)',
          animation: 'helperSlide 0.15s ease-out',
        }}>
          <style>{`
            @keyframes helperSlide {
              from { opacity: 0; transform: translateY(-4px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {title && (
            <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text, #111)' }}>
              {title}
            </div>
          )}

          {description && (
            <div style={{ color: 'var(--text-dim, #6B7280)', marginBottom: example ? '0.5rem' : 0 }}>
              {description}
            </div>
          )}

          {example && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.25rem',
              }}>
                <span style={{ fontWeight: 600, fontSize: '0.72rem', color: 'var(--text-dim, #9CA3AF)' }}>
                  EXEMPLO
                </span>
                {onUseExample && (
                  <button
                    type="button"
                    onClick={() => {
                      onUseExample(example)
                      setOpen(false)
                    }}
                    style={{
                      background: 'none',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '4px',
                      padding: '0.15rem 0.4rem',
                      cursor: 'pointer',
                      fontSize: '0.68rem',
                      color: '#6366f1',
                      fontWeight: 500,
                    }}
                  >
                    Usar exemplo
                  </button>
                )}
              </div>
              <pre style={{
                margin: 0,
                padding: '0.5rem',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-secondary, #1a1a2e)',
                color: '#a5b4fc',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                border: '1px solid var(--border, #333)',
                lineHeight: 1.5,
              }}>
                {typeof example === 'string' ? example : JSON.stringify(example, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FieldHelper
