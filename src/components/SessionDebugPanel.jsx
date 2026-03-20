import { useState, useEffect } from 'react'
import api from '../config/axios'

// Componente JSON colapsável
function JsonNode({ name, value, defaultExpanded = false, depth = 0 }) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  if (value === null) return <span style={{ color: 'var(--text-dim, #777)' }}>{name && <><span style={{ color: '#9C27B0' }}>"{name}"</span>: </>}null</span>
  if (typeof value === 'boolean') return <span>{name && <><span style={{ color: '#9C27B0' }}>"{name}"</span>: </>}<span style={{ color: '#f59e0b' }}>{value ? 'true' : 'false'}</span></span>
  if (typeof value === 'number') return <span>{name && <><span style={{ color: '#9C27B0' }}>"{name}"</span>: </>}<span style={{ color: '#2196F3' }}>{value}</span></span>
  if (typeof value === 'string') {
    const truncated = value.length > 80 ? value.substring(0, 80) + '...' : value
    return <span>{name && <><span style={{ color: '#9C27B0' }}>"{name}"</span>: </>}<span style={{ color: 'var(--accent, #7c3aed)' }}>"{truncated}"</span></span>
  }

  const isArray = Array.isArray(value)
  const entries = isArray ? value.map((v, i) => [i, v]) : Object.entries(value)
  const count = entries.length
  const bracket = isArray ? ['[', ']'] : ['{', '}']

  return (
    <div style={{ marginLeft: depth > 0 ? '1rem' : 0 }}>
      <span
        onClick={() => setExpanded(!expanded)}
        style={{ cursor: 'pointer', userSelect: 'none' }}
      >
        <span style={{ color: 'var(--text-secondary, #888)', fontSize: '0.7rem', marginRight: '0.3rem' }}>
          {expanded ? '▼' : '▶'}
        </span>
        {name && <><span style={{ color: '#9C27B0' }}>"{name}"</span>: </>}
        <span style={{ color: 'var(--text-secondary, #888)' }}>
          {bracket[0]}{!expanded && `...${count} items...${bracket[1]}`}
        </span>
      </span>
      {expanded && (
        <div>
          {entries.map(([key, val]) => (
            <div key={key} style={{ marginLeft: '0.5rem', lineHeight: 1.6 }}>
              <JsonNode name={isArray ? undefined : key} value={val} depth={depth + 1} />
            </div>
          ))}
          <span style={{ color: 'var(--text-secondary, #888)' }}>{bracket[1]}</span>
        </div>
      )}
    </div>
  )
}

function SessionDebugPanel({ isOpen, onClose }) {
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [context, setContext] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expandAll, setExpandAll] = useState(null)

  useEffect(() => {
    if (isOpen) {
      loadSessions()
    }
  }, [isOpen])

  const loadSessions = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/v1/flows/sessions?limit=50')
      setSessions(response.data.data.sessions || [])
      setError(null)
    } catch (err) {
      setError('Erro ao carregar sessões')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadContext = async (msisdn) => {
    try {
      setLoading(true)
      const response = await api.get(`/api/v1/flows/sessions/${msisdn}/context`)
      setContext(response.data.data)
      setSelectedSession(msisdn)
      setError(null)
    } catch (err) {
      setError('Erro ao carregar contexto')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '400px',
        height: '100vh',
        backgroundColor: 'var(--bg-primary, #1a1a2e)',
        boxShadow: '-2px 0 12px rgba(0,0,0,0.4)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1rem',
          borderBottom: '1px solid var(--border, #333)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-secondary, #16213e)',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>🔍 Debug de Sessões</h3>
        <button
          onClick={onClose}
          style={{
            border: 'none',
            background: 'transparent',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0.25rem',
          }}
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {error && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              margin: '1rem',
              borderRadius: '4px',
            }}
          >
            {error}
          </div>
        )}

        {/* Sessions List */}
        {!selectedSession && (
          <div style={{ padding: '1rem' }}>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
              <strong>Sessões Ativas ({sessions.length})</strong>
              <button
                onClick={loadSessions}
                style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.8rem',
                  border: '1px solid var(--border, #333)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-primary, #1a1a2e)',
                }}
              >
                🔄 Atualizar
              </button>
            </div>

            {loading && <p style={{ textAlign: 'center', color: 'var(--text-secondary, #aaa)' }}>Carregando...</p>}

            {!loading && sessions.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-dim, #777)', padding: '2rem' }}>
                Nenhuma sessão ativa encontrada
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {sessions.map((session) => (
                <div
                  key={session.msisdn}
                  onClick={() => loadContext(session.msisdn)}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid var(--border, #333)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: 'var(--bg-primary, #1a1a2e)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa'
                    e.currentTarget.style.borderColor = '#4CAF50'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff'
                    e.currentTarget.style.borderColor = '#ddd'
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    📱 {session.msisdn}
                  </div>
                  {session.preview.nomeparc && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #aaa)' }}>
                      👤 {session.preview.nomeparc}
                    </div>
                  )}
                  {session.stage && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim, #777)', marginTop: '0.25rem' }}>
                      📍 Stage: {session.stage}
                    </div>
                  )}
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim, #777)', marginTop: '0.25rem' }}>
                    🕒 {new Date(session.updated_at).toLocaleString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Context View */}
        {selectedSession && context && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                padding: '1rem',
                borderBottom: '1px solid var(--border, #333)',
                backgroundColor: 'var(--bg-secondary, #16213e)',
              }}
            >
              <button
                onClick={() => {
                  setSelectedSession(null)
                  setContext(null)
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  color: 'var(--accent, #7c3aed)',
                  marginBottom: '0.5rem',
                }}
              >
                ← Voltar para lista
              </button>
              <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                📱 {selectedSession}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #aaa)', marginTop: '0.25rem' }}>
                Última atualização: {new Date(context.updated_at).toLocaleString('pt-BR')}
              </div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <strong>Contexto:</strong>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <button
                    onClick={() => setExpandAll(true)}
                    style={{
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.7rem',
                      border: '1px solid var(--border, #ddd)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      backgroundColor: 'var(--bg-surface, #f8f9fa)',
                      color: 'var(--text-primary, #333)',
                    }}
                  >
                    📂 Expandir
                  </button>
                  <button
                    onClick={() => setExpandAll(false)}
                    style={{
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.7rem',
                      border: '1px solid var(--border, #ddd)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      backgroundColor: 'var(--bg-surface, #f8f9fa)',
                      color: 'var(--text-primary, #333)',
                    }}
                  >
                    📁 Colapsar
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(context.context, null, 2))
                    }}
                    style={{
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.7rem',
                      border: '1px solid var(--border, #ddd)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      backgroundColor: 'var(--bg-surface, #f8f9fa)',
                      color: 'var(--text-primary, #333)',
                    }}
                  >
                    📋 Copiar
                  </button>
                </div>
              </div>
              <div
                key={expandAll === null ? 'init' : expandAll ? 'expanded' : 'collapsed'}
                style={{
                  backgroundColor: 'var(--input-bg, #f5f5f5)',
                  padding: '1rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  lineHeight: '1.4',
                  fontFamily: 'monospace',
                }}
              >
                <JsonNode value={context.context} defaultExpanded={expandAll !== false} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SessionDebugPanel
