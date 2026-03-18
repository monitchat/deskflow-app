import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext()

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }
  }, [])

  const success = useCallback((msg) => addToast(msg, 'success'), [addToast])
  const error = useCallback((msg) => addToast(msg, 'error', 5000), [addToast])
  const warning = useCallback((msg) => addToast(msg, 'warning', 4000), [addToast])
  const info = useCallback((msg) => addToast(msg, 'info'), [addToast])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const STYLES = {
    success: { bg: '#22c55e15', border: '#22c55e40', color: '#22c55e', icon: '✓' },
    error: { bg: '#ef444415', border: '#ef444440', color: '#ef4444', icon: '✕' },
    warning: { bg: '#f59e0b15', border: '#f59e0b40', color: '#f59e0b', icon: '!' },
    info: { bg: '#6366f115', border: '#6366f140', color: '#818cf8', icon: 'i' },
  }

  return (
    <ToastContext.Provider value={{ success, error, warning, info }}>
      {children}

      {/* Toast container */}
      <div style={{
        position: 'fixed',
        top: '60px',
        right: '16px',
        zIndex: 50000,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: '380px',
      }}>
        {toasts.map((toast) => {
          const s = STYLES[toast.type] || STYLES.info
          return (
            <div
              key={toast.id}
              style={{
                padding: '0.6rem 1rem',
                borderRadius: '10px',
                backgroundColor: '#1e293b',
                border: `1px solid ${s.border}`,
                boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem',
                animation: 'toastSlideIn 0.2s ease-out',
              }}
            >
              <style>{`
                @keyframes toastSlideIn {
                  from { opacity: 0; transform: translateX(20px); }
                  to { opacity: 1; transform: translateX(0); }
                }
              `}</style>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: s.bg,
                border: `1px solid ${s.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: s.color,
                flexShrink: 0,
                marginTop: '1px',
              }}>
                {s.icon}
              </div>
              <div style={{
                flex: 1,
                fontSize: '0.82rem',
                color: '#e2e8f0',
                lineHeight: 1.4,
              }}>
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  padding: '0',
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
