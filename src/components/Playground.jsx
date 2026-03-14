import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import api from '../config/axios'

function Playground({ flowId, onClose }) {
  const { theme } = useTheme()
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingSessions, setLoadingSessions] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Carrega sessões disponíveis
  const loadSessions = async () => {
    setLoadingSessions(true)
    try {
      const response = await api.get('/api/v1/flows/sessions?limit=20')
      const sessionsList = response.data.data.sessions || []
      setSessions(sessionsList)
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setLoadingSessions(false)
    }
  }

  // Cria nova sessão
  const createNewSession = async () => {
    try {
      const response = await api.post('/api/v1/flows/playground/session', {
        flow_id: flowId
      })
      const newMsisdn = response.data.data.msisdn

      await loadSessions()
      setSelectedSession(newMsisdn)
      setMessages([])
      setTimeout(() => inputRef.current?.focus(), 100)
    } catch (error) {
      console.error('Error creating session:', error)
      alert('Erro ao criar sessão: ' + (error.response?.data?.error || error.message))
    }
  }

  // Deleta sessão atual
  const deleteCurrentSession = async () => {
    if (!selectedSession) return
    if (!confirm(`Deseja deletar a sessão ${selectedSession}?`)) return

    try {
      await api.delete(`/api/v1/flows/playground/session/${selectedSession}?flow_id=${flowId}`)
      setSelectedSession(null)
      setMessages([])
      loadSessions()
    } catch (error) {
      console.error('Error deleting session:', error)
      alert('Erro ao deletar sessão: ' + (error.response?.data?.error || error.message))
    }
  }

  // Envia mensagem
  const sendMessage = async (text = inputText, msisdn = selectedSession, buttonId = null) => {
    if (!msisdn) {
      alert('Selecione ou crie uma sessão primeiro')
      return
    }

    if (text.trim() || buttonId) {
      setMessages(prev => [...prev, {
        type: 'user',
        text: buttonId || text,
        timestamp: new Date()
      }])
    }

    setLoading(true)
    setInputText('')

    try {
      const response = await api.post('/api/v1/flows/playground/message', {
        flow_id: flowId,
        msisdn: msisdn,
        text: text,
        button_id: buttonId
      })

      const replies = response.data.data.replies || []

      replies.forEach(reply => {
        if (reply.type === 'debug' && reply.node_id) {
          window.dispatchEvent(new CustomEvent('nodeExecutionResult', {
            detail: {
              nodeId: reply.node_id,
              success: false,
              title: reply.title,
              error: reply.error,
              status_code: reply.status_code,
              api_response: reply.api_response,
              timestamp: new Date().toLocaleTimeString(),
            }
          }))
        }
        if (reply.type === 'transfer_success' && reply.node_id) {
          window.dispatchEvent(new CustomEvent('nodeExecutionResult', {
            detail: {
              nodeId: reply.node_id,
              success: true,
              title: 'Transferência realizada',
              timestamp: new Date().toLocaleTimeString(),
            }
          }))
        }
      })

      const botMessages = replies
        .filter(reply => reply.type !== 'debug' && reply.type !== 'transfer_success' && reply.type !== 'end')
        .map(reply => ({
          type: 'bot',
          data: reply,
          timestamp: new Date()
        }))

      setMessages(prev => [...prev, ...botMessages])
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, {
        type: 'error',
        text: 'Erro ao processar mensagem: ' + (error.response?.data?.error || error.message),
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    loadSessions()
  }, [])

  // Polling para buscar mensagens pendentes (para nós com delay)
  useEffect(() => {
    if (!selectedSession || !flowId) return

    const pollPendingMessages = async () => {
      try {
        const response = await api.get(`/api/v1/flows/playground/pending/${selectedSession}?flow_id=${flowId}`)
        const pendingMessages = response.data.data?.messages || []

        if (pendingMessages.length > 0) {
          console.log('📨 Received pending messages:', pendingMessages)
          const newMessages = pendingMessages.map(msg => ({
            type: 'bot',
            data: msg
          }))
          setMessages(prev => [...prev, ...newMessages])
          console.log('✅ Added', newMessages.length, 'messages to chat')
        }
      } catch (error) {
        console.error('❌ Error polling pending messages:', error)
      }
    }

    pollPendingMessages()
    const intervalId = setInterval(pollPendingMessages, 2000)
    return () => clearInterval(intervalId)
  }, [selectedSession, flowId])

  // Renderiza uma mensagem do bot
  const renderBotMessage = (messageData) => {
    const { type, text, body, header, footer, buttons, sections, items, url, file_name, message: caption } = messageData.data

    if (type === 'debug') {
      const { title, error, status_code, api_response, node_id, department_id } = messageData.data
      return (
        <div className="pg-bubble pg-bubble-debug">
          <div className="pg-debug-title">
            <span>⚠️</span> {title || 'Erro'}
          </div>
          <div className="pg-debug-row">
            <strong>Motivo:</strong> {error}
          </div>
          {status_code && (
            <div className="pg-debug-row pg-debug-muted">
              <strong>Status HTTP:</strong> {status_code}
            </div>
          )}
          {api_response && (
            <div className="pg-debug-row pg-debug-muted">
              <strong>Response:</strong>{' '}
              <code className="pg-debug-code">
                {typeof api_response === 'object' ? JSON.stringify(api_response) : api_response}
              </code>
            </div>
          )}
          {node_id && (
            <div className="pg-debug-footer">
              Node: {node_id}{department_id ? ` | Dept: ${department_id}` : ''}
            </div>
          )}
        </div>
      )
    }

    if (type === 'document' || type === 'image') {
      return (
        <div className="pg-bubble pg-bubble-bot">
          {type === 'image' && url && (
            <img
              src={url}
              alt={caption || 'Imagem'}
              className="pg-media-image"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex') }}
            />
          )}
          {type === 'image' && url && (
            <div className="pg-media-fallback">
              <span>🖼️</span>
              <a href={url} target="_blank" rel="noopener noreferrer" className="pg-media-link">
                {file_name || 'Ver imagem'}
              </a>
            </div>
          )}
          {type === 'document' && (
            <div className="pg-media-file">
              <span style={{ fontSize: '1.5rem' }}>📄</span>
              <a href={url} target="_blank" rel="noopener noreferrer" className="pg-media-link">
                {file_name || url || 'Download'}
              </a>
            </div>
          )}
          {caption && (
            <div className="pg-text">{caption}</div>
          )}
        </div>
      )
    }

    return (
      <div className="pg-bubble pg-bubble-bot">
        {header && (
          <div className="pg-msg-header">{header}</div>
        )}

        {(text || body) && (
          <div className="pg-text" style={{ marginBottom: buttons || sections ? '0.75rem' : '0' }}>
            {body || text}
          </div>
        )}

        {buttons && buttons.length > 0 && (
          <div className="pg-buttons">
            {buttons.map((button, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage('', selectedSession, button.id)}
                disabled={loading}
                className="pg-btn pg-btn-action"
              >
                {button.title}
              </button>
            ))}
          </div>
        )}

        {footer && (
          <div className="pg-msg-footer">{footer}</div>
        )}

        {sections && sections.length > 0 && (
          <div className="pg-sections">
            {sections.map((section, sIdx) => (
              <div key={sIdx} className="pg-section">
                {section.title && (
                  <div className="pg-section-title">{section.title}</div>
                )}
                {section.rows && section.rows.map((row, rIdx) => (
                  <button
                    key={rIdx}
                    onClick={() => sendMessage('', selectedSession, row.id)}
                    disabled={loading}
                    className="pg-btn pg-btn-list"
                  >
                    <div style={{ fontWeight: '500' }}>{row.title}</div>
                    {row.description && (
                      <div className="pg-btn-desc">{row.description}</div>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {items && items.length > 0 && (
          <div className="pg-buttons">
            {items.map((item, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(item.value || item.label, selectedSession)}
                disabled={loading}
                className="pg-btn pg-btn-list"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="pg-container">
      {/* Header */}
      <div className="pg-header">
        <div>
          <h3 className="pg-header-title">Playground</h3>
          <p className="pg-header-subtitle">Teste o fluxo em tempo real</p>
        </div>
        <button onClick={onClose} className="pg-close-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Session Selector */}
      <div className="pg-session-bar">
        <div className="pg-session-row">
          <select
            value={selectedSession || ''}
            onChange={(e) => {
              setSelectedSession(e.target.value)
              setMessages([])
            }}
            disabled={loadingSessions}
            className="pg-select"
          >
            <option value="">Selecione uma sessão...</option>
            {sessions.map((session, idx) => (
              <option key={`${session.msisdn}-${idx}`} value={session.msisdn}>
                {session.msisdn} {session.stage ? `(${session.stage})` : ''}
              </option>
            ))}
          </select>
          <button
            onClick={loadSessions}
            disabled={loadingSessions}
            title="Recarregar sessões"
            className="pg-icon-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loadingSessions ? 'pg-spin' : ''}>
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>

        <div className="pg-session-row">
          <button onClick={createNewSession} className="pg-btn pg-btn-new">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nova Sessão
          </button>
          {selectedSession && (
            <button
              onClick={deleteCurrentSession}
              title="Deletar sessão atual"
              className="pg-icon-btn pg-icon-btn-danger"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="pg-messages">
        {messages.length === 0 && !selectedSession && (
          <div className="pg-empty-state">
            <div className="pg-empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p>Selecione ou crie uma sessão para começar</p>
          </div>
        )}

        {messages.length === 0 && selectedSession && (
          <div className="pg-empty-state">
            <div className="pg-empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <line x1="9" y1="10" x2="15" y2="10" />
              </svg>
            </div>
            <p>Sessão pronta! Digite sua primeira mensagem abaixo.</p>
          </div>
        )}

        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`pg-message-row ${message.type === 'user' ? 'pg-message-right' : 'pg-message-left'}`}
          >
            {message.type === 'user' && (
              <div className="pg-bubble pg-bubble-user">
                {message.text}
              </div>
            )}

            {message.type === 'bot' && renderBotMessage(message)}

            {message.type === 'error' && (
              <div className="pg-bubble pg-bubble-error">
                ⚠️ {message.text}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="pg-message-row pg-message-left">
            <div className="pg-bubble pg-bubble-bot pg-typing">
              <span className="pg-dot" /><span className="pg-dot" /><span className="pg-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="pg-input-bar">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (inputText.trim() && !loading) {
              sendMessage()
            }
          }}
          className="pg-input-form"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={selectedSession ? "Digite uma mensagem..." : "Selecione uma sessão primeiro"}
            disabled={!selectedSession || loading}
            className="pg-input"
          />
          <button
            type="submit"
            disabled={!selectedSession || !inputText.trim() || loading}
            className="pg-send-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}

export default Playground
