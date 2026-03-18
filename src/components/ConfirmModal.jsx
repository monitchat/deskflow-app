function ConfirmModal({ title, message, items, confirmText, cancelText, onConfirm, onCancel, variant }) {
  const isDestructive = variant === 'destructive'
  const isWarning = variant === 'warning'

  const accentColor = isDestructive ? '#DC2626' : isWarning ? '#D97706' : '#7C3AED'
  const accentBg = isDestructive ? 'rgba(220, 38, 38, 0.08)' : isWarning ? 'rgba(217, 119, 6, 0.08)' : 'rgba(124, 58, 237, 0.08)'
  const accentBorder = isDestructive ? 'rgba(220, 38, 38, 0.2)' : isWarning ? 'rgba(217, 119, 6, 0.2)' : 'rgba(124, 58, 237, 0.2)'
  const icon = isDestructive ? '⚠️' : isWarning ? '💡' : 'ℹ️'

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20000,
        animation: 'confirmFadeIn 0.15s ease-out',
      }}
      onClick={onCancel}
    >
      <style>{`
        @keyframes confirmFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes confirmSlideIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg, #fff)',
          borderRadius: '14px',
          width: '460px',
          maxWidth: '90vw',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.25)',
          animation: 'confirmSlideIn 0.2s ease-out',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem 0.75rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: accentBg,
            border: `1px solid ${accentBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            flexShrink: 0,
          }}>
            {icon}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{
              margin: 0,
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--text, #111)',
              lineHeight: 1.3,
            }}>
              {title}
            </h3>
            <p style={{
              margin: '0.4rem 0 0',
              fontSize: '0.85rem',
              color: 'var(--text-dim, #6B7280)',
              lineHeight: 1.5,
            }}>
              {message}
            </p>
          </div>
        </div>

        {/* Items list */}
        {items && items.length > 0 && (
          <div style={{
            margin: '0.5rem 1.5rem',
            padding: '0.6rem 0.75rem',
            backgroundColor: 'var(--bg-secondary, #F9FAFB)',
            borderRadius: '8px',
            border: '1px solid var(--border, #E5E7EB)',
            maxHeight: '180px',
            overflowY: 'auto',
          }}>
            {items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.35rem 0',
                  borderBottom: idx < items.length - 1 ? '1px solid var(--border, #F3F4F6)' : 'none',
                  fontSize: '0.82rem',
                  color: 'var(--text, #374151)',
                }}
              >
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: accentColor,
                  flexShrink: 0,
                }} />
                <span style={{ flex: 1 }}>{item}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '0.75rem 1.5rem 1.25rem',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.5rem',
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--bg-hover, #F3F4F6)',
              color: 'var(--text, #374151)',
              border: '1px solid var(--border, #E5E7EB)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--bg-hover-active, #E5E7EB)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'var(--bg-hover, #F3F4F6)'
            }}
          >
            {cancelText || 'Cancelar'}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: accentColor,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.target.style.opacity = '0.9'
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = '1'
            }}
          >
            {confirmText || 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
