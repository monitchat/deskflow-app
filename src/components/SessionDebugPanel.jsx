import { useState, useEffect } from 'react'
import api from '../config/axios'

function SessionDebugPanel({ isOpen, onClose }) {
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [context, setContext] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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
        backgroundColor: '#fff',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1rem',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8f9fa',
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
              backgroundColor: '#ffebee',
              color: '#c62828',
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
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: '#fff',
                }}
              >
                🔄 Atualizar
              </button>
            </div>

            {loading && <p style={{ textAlign: 'center', color: '#666' }}>Carregando...</p>}

            {!loading && sessions.length === 0 && (
              <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
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
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: '#fff',
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
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      👤 {session.preview.nomeparc}
                    </div>
                  )}
                  {session.stage && (
                    <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>
                      📍 Stage: {session.stage}
                    </div>
                  )}
                  <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '0.25rem' }}>
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
                borderBottom: '1px solid #ddd',
                backgroundColor: '#f8f9fa',
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
                  color: '#4CAF50',
                  marginBottom: '0.5rem',
                }}
              >
                ← Voltar para lista
              </button>
              <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                📱 {selectedSession}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                Última atualização: {new Date(context.updated_at).toLocaleString('pt-BR')}
              </div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
              <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Contexto:</strong>
              <pre
                style={{
                  backgroundColor: '#f5f5f5',
                  padding: '1rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  lineHeight: '1.4',
                  fontFamily: 'monospace',
                }}
              >
                {JSON.stringify(context.context, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SessionDebugPanel
