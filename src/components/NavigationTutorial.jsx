import { useState, useEffect } from 'react'

const controls = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="6" y="2" width="12" height="20" rx="4" />
        <line x1="12" y1="6" x2="12" y2="10" strokeLinecap="round" />
      </svg>
    ),
    label: 'Botao esquerdo no canvas',
    desc: 'Selecao por area',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="6" y="2" width="12" height="20" rx="4" />
        <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
        <line x1="6" y1="11" x2="18" y2="11" strokeLinecap="round" opacity="0.4" />
      </svg>
    ),
    label: 'Botao do meio / dois dedos',
    desc: 'Mover o canvas (pan)',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="7" y="6" width="10" height="12" rx="3" />
        <path d="M12 3v3M12 18v3M8 9l-3-3M16 9l3-3" strokeLinecap="round" />
      </svg>
    ),
    label: 'Ctrl + Scroll',
    desc: 'Zoom in / out',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M5 3l14 8-14 8V3z" strokeLinejoin="round" />
      </svg>
    ),
    label: 'Clique no no',
    desc: 'Selecionar / editar',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M5 3l14 8-14 8V3z" strokeLinejoin="round" />
        <path d="M14 12h6M17 9l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      </svg>
    ),
    label: 'Arrastar no',
    desc: 'Mover no',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <circle cx="10" cy="12" r="2" />
        <circle cx="16" cy="12" r="2" opacity="0.5" />
      </svg>
    ),
    label: 'Touch: 1 dedo = mover',
    desc: '2 dedos = pan / zoom',
  },
]

export default function NavigationTutorial({ visible, onDismiss }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) {
      // Small delay so animation triggers
      requestAnimationFrame(() => setShow(true))
    } else {
      setShow(false)
    }
  }, [visible])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        backdropFilter: 'blur(2px)',
        opacity: show ? 1 : 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: show ? 'auto' : 'none',
      }}
      onClick={onDismiss}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface, #1e293b)',
          border: '1px solid var(--border, #334155)',
          borderRadius: '14px',
          padding: '1.5rem 1.75rem',
          maxWidth: '420px',
          width: '90%',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.35)',
          transform: show ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.96)',
          opacity: show ? 1 : 0,
          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem',
        }}>
          <span style={{
            fontSize: '1.1rem',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: 'var(--accent-glow, rgba(99, 102, 241, 0.15))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent, #6366f1)',
            flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" strokeLinecap="round" />
              <circle cx="12" cy="17" r="0.5" fill="currentColor" />
            </svg>
          </span>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: '0.95rem',
              fontWeight: 700,
              color: 'var(--text-primary, #f1f5f9)',
            }}>
              Controles de Navegacao
            </h3>
            <p style={{
              margin: 0,
              fontSize: '0.72rem',
              color: 'var(--text-dim, #64748b)',
            }}>
              Como interagir com o canvas
            </p>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem',
        }}>
          {controls.map((ctrl, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem',
                padding: '0.6rem',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-input, #0f172a)',
                border: '1px solid var(--border, #334155)',
              }}
            >
              <span style={{
                color: 'var(--accent-light, #818cf8)',
                flexShrink: 0,
                marginTop: '1px',
              }}>
                {ctrl.icon}
              </span>
              <div>
                <div style={{
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  color: 'var(--text-primary, #f1f5f9)',
                  lineHeight: 1.3,
                }}>
                  {ctrl.label}
                </div>
                <div style={{
                  fontSize: '0.68rem',
                  color: 'var(--text-muted, #94a3b8)',
                  lineHeight: 1.3,
                  marginTop: '2px',
                }}>
                  {ctrl.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onDismiss}
          style={{
            width: '100%',
            marginTop: '1rem',
            padding: '0.55rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'var(--accent, #6366f1)',
            color: '#fff',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          Entendi!
        </button>
      </div>
    </div>
  )
}
