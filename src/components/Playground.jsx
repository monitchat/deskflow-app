import { useState, useEffect, useRef } from 'react'
import api from '../config/axios'

function Playground({ flowId, onClose }) {
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
      // Passa o flow_id para criar a sessão no flow correto
      const response = await api.post('/api/v1/flows/playground/session', {
        flow_id: flowId
      })
      const newMsisdn = response.data.data.msisdn

      // Adiciona à lista
      await loadSessions()

      // Seleciona a nova sessão
      setSelectedSession(newMsisdn)
      setMessages([])

      // Foca no input para o usuário digitar
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

    // Adiciona mensagem do usuário (se não for mensagem inicial vazia)
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

      // Notifica o canvas sobre resultados de execução de nós
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

      // Adiciona respostas do bot (filtra debug do chat)
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
      // Retorna o foco ao input após enviar
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  // Scroll automático para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Carrega sessões ao montar
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

          // Adiciona todas as mensagens pendentes de uma vez
          const newMessages = pendingMessages.map(msg => ({
            type: 'bot',  // Usa 'type' ao invés de 'sender' para compatibilidade
            data: msg
          }))

          setMessages(prev => [...prev, ...newMessages])
          console.log('✅ Added', newMessages.length, 'messages to chat')
        }
      } catch (error) {
        console.error('❌ Error polling pending messages:', error)
      }
    }

    // Busca imediatamente e depois a cada 2 segundos
    pollPendingMessages()
    const intervalId = setInterval(pollPendingMessages, 2000)

    // Limpa o intervalo quando o componente desmonta ou muda de sessão
    return () => clearInterval(intervalId)
  }, [selectedSession, flowId])

  // Renderiza uma mensagem do bot
  const renderBotMessage = (messageData) => {
    const { type, text, body, header, footer, buttons, sections, items, url, file_name, message: caption } = messageData.data

    // Renderiza card de debug (erros de nós)
    if (type === 'debug') {
      const { title, error, status_code, api_response, node_id, department_id } = messageData.data
      return (
        <div style={{
          backgroundColor: '#FFF3E0',
          border: '1px solid #FF9800',
          borderLeft: '4px solid #F44336',
          padding: '0.75rem',
          borderRadius: '8px',
          maxWidth: '90%',
          fontSize: '0.8rem',
        }}>
          <div style={{ fontWeight: 'bold', color: '#E65100', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>⚠️</span> {title || 'Erro'}
          </div>
          <div style={{ color: '#333', marginBottom: '0.25rem' }}>
            <strong>Motivo:</strong> {error}
          </div>
          {status_code && (
            <div style={{ color: '#666', marginBottom: '0.25rem' }}>
              <strong>Status HTTP:</strong> {status_code}
            </div>
          )}
          {api_response && (
            <div style={{ color: '#666', marginBottom: '0.25rem' }}>
              <strong>Response:</strong>{' '}
              <code style={{ backgroundColor: '#fff', padding: '0.15rem 0.3rem', borderRadius: '3px', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                {typeof api_response === 'object' ? JSON.stringify(api_response) : api_response}
              </code>
            </div>
          )}
          {node_id && (
            <div style={{ color: '#999', fontSize: '0.7rem', marginTop: '0.4rem', borderTop: '1px solid #FFE0B2', paddingTop: '0.3rem' }}>
              Node: {node_id}{department_id ? ` | Dept: ${department_id}` : ''}
            </div>
          )}
        </div>
      )
    }

    // Renderiza mídia (document ou image)
    if (type === 'document' || type === 'image') {
      return (
        <div style={{
          backgroundColor: '#fff',
          padding: '0.75rem',
          borderRadius: '8px',
          maxWidth: '80%',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        }}>
          {type === 'image' && url && (
            <img
              src={url}
              alt={caption || 'Imagem'}
              style={{ maxWidth: '100%', borderRadius: '4px', marginBottom: caption ? '0.5rem' : 0 }}
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex') }}
            />
          )}
          {type === 'image' && url && (
            <div style={{ display: 'none', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#f5f5f5', borderRadius: '4px', marginBottom: caption ? '0.5rem' : 0 }}>
              <span>🖼️</span>
              <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: '#1976D2', wordBreak: 'break-all' }}>
                {file_name || 'Ver imagem'}
              </a>
            </div>
          )}
          {type === 'document' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#f5f5f5', borderRadius: '4px', marginBottom: caption ? '0.5rem' : 0 }}>
              <span style={{ fontSize: '1.5rem' }}>📄</span>
              <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: '#1976D2', wordBreak: 'break-all' }}>
                {file_name || url || 'Download'}
              </a>
            </div>
          )}
          {caption && (
            <div style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{caption}</div>
          )}
        </div>
      )
    }

    return (
      <div style={{
        backgroundColor: '#fff',
        padding: '0.75rem',
        borderRadius: '8px',
        maxWidth: '80%',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      }}>
        {/* Header (para botões) */}
        {header && (
          <div style={{
            fontSize: '0.85rem',
            fontWeight: 'bold',
            color: '#128C7E',
            marginBottom: '0.5rem',
            paddingBottom: '0.5rem',
            borderBottom: '1px solid #e0e0e0',
          }}>
            {header}
          </div>
        )}

        {/* Texto (mensagens simples) ou Body (mensagens de botão) */}
        {(text || body) && (
          <div style={{
            whiteSpace: 'pre-wrap',
            marginBottom: buttons || sections ? '0.75rem' : '0',
            fontSize: '0.9rem',
          }}>
            {body || text}
          </div>
        )}

        {/* Botões */}
        {buttons && buttons.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {buttons.map((button, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage('', selectedSession, button.id)}
                disabled={loading}
                style={{
                  padding: '0.6rem',
                  backgroundColor: '#25D366',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#128C7E')}
                onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#25D366')}
              >
                {button.title}
              </button>
            ))}
          </div>
        )}

        {/* Footer (para botões) */}
        {footer && (
          <div style={{
            fontSize: '0.75rem',
            color: '#666',
            marginTop: '0.5rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid #e0e0e0',
          }}>
            {footer}
          </div>
        )}

        {/* Lista */}
        {sections && sections.length > 0 && (
          <div style={{ borderTop: '1px solid #eee', paddingTop: '0.75rem' }}>
            {sections.map((section, sIdx) => (
              <div key={sIdx} style={{ marginBottom: '0.75rem' }}>
                {section.title && (
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    color: '#666',
                    marginBottom: '0.5rem',
                  }}>
                    {section.title}
                  </div>
                )}
                {section.rows && section.rows.map((row, rIdx) => (
                  <button
                    key={rIdx}
                    onClick={() => sendMessage('', selectedSession, row.id)}
                    disabled={loading}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '0.6rem',
                      marginBottom: '0.4rem',
                      backgroundColor: '#f5f5f5',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      fontSize: '0.85rem',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#e8e8e8')}
                    onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#f5f5f5')}
                  >
                    <div style={{ fontWeight: '500' }}>{row.title}</div>
                    {row.description && (
                      <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                        {row.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Items (opções de router) */}
        {items && items.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {items.map((item, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(item.value || item.label, selectedSession)}
                disabled={loading}
                style={{
                  padding: '0.6rem',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#e8e8e8')}
                onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#f5f5f5')}
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
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '400px',
      height: '100vh',
      backgroundColor: '#fff',
      boxShadow: '-4px 0 12px rgba(0,0,0,0.15)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem',
        backgroundColor: '#128C7E',
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>🎮 Playground</h3>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', opacity: 0.9 }}>
            Teste o fluxo em tempo real
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0.25rem',
          }}
        >
          ✕
        </button>
      </div>

      {/* Session Selector */}
      <div style={{
        padding: '0.75rem',
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #ddd',
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <select
            value={selectedSession || ''}
            onChange={(e) => {
              setSelectedSession(e.target.value)
              setMessages([])
            }}
            disabled={loadingSessions}
            style={{
              flex: 1,
              padding: '0.5rem',
              fontSize: '0.85rem',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontFamily: 'monospace',
            }}
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
            style={{
              padding: '0.5rem 0.75rem',
              fontSize: '1rem',
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: loadingSessions ? 'not-allowed' : 'pointer',
            }}
          >
            🔄
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={createNewSession}
            style={{
              flex: 1,
              padding: '0.5rem',
              fontSize: '0.85rem',
              backgroundColor: '#25D366',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            ➕ Nova Sessão
          </button>
          {selectedSession && (
            <button
              onClick={deleteCurrentSession}
              title="Deletar sessão atual"
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '1rem',
                backgroundColor: '#F44336',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        padding: '1rem',
        overflowY: 'auto',
        backgroundColor: '#ECE5DD',
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h100v100H0z\' fill=\'%23ece5dd\'/%3E%3C/svg%3E")',
      }}>
        {messages.length === 0 && !selectedSession && (
          <div style={{
            textAlign: 'center',
            color: '#666',
            marginTop: '2rem',
            fontSize: '0.9rem',
          }}>
            👆 Selecione ou crie uma sessão para começar
          </div>
        )}

        {messages.length === 0 && selectedSession && (
          <div style={{
            textAlign: 'center',
            color: '#666',
            marginTop: '2rem',
            fontSize: '0.9rem',
          }}>
            Sessão pronta! Digite sua primeira mensagem abaixo para iniciar o fluxo. 💬
          </div>
        )}

        {messages.map((message, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: '0.75rem',
              display: 'flex',
              justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            {message.type === 'user' && (
              <div style={{
                backgroundColor: '#DCF8C6',
                padding: '0.75rem',
                borderRadius: '8px',
                maxWidth: '80%',
                fontSize: '0.9rem',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              }}>
                {message.text}
              </div>
            )}

            {message.type === 'bot' && renderBotMessage(message)}

            {message.type === 'error' && (
              <div style={{
                backgroundColor: '#ffebee',
                padding: '0.75rem',
                borderRadius: '8px',
                maxWidth: '80%',
                fontSize: '0.85rem',
                color: '#c62828',
                border: '1px solid #ef5350',
              }}>
                ⚠️ {message.text}
              </div>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '0.75rem',
        backgroundColor: '#f5f5f5',
        borderTop: '1px solid #ddd',
      }}>
        {selectedSession && messages.length === 0 && (
          <button
            onClick={() => inputRef.current?.focus()}
            style={{
              width: '100%',
              padding: '0.75rem',
              marginBottom: '0.5rem',
              backgroundColor: '#2196F3',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
            }}
          >
            💬 Digite sua mensagem abaixo
          </button>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (inputText.trim() && !loading) {
              sendMessage()
            }
          }}
          style={{ display: 'flex', gap: '0.5rem' }}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={selectedSession ? "Digite uma mensagem..." : "Selecione uma sessão primeiro"}
            disabled={!selectedSession || loading}
            style={{
              flex: 1,
              padding: '0.75rem',
              fontSize: '0.9rem',
              border: '1px solid #ddd',
              borderRadius: '20px',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={!selectedSession || !inputText.trim() || loading}
            style={{
              padding: '0.75rem 1.25rem',
              backgroundColor: '#25D366',
              color: '#fff',
              border: 'none',
              borderRadius: '20px',
              cursor: (!selectedSession || !inputText.trim() || loading) ? 'not-allowed' : 'pointer',
              fontSize: '1.2rem',
              opacity: (!selectedSession || !inputText.trim() || loading) ? 0.5 : 1,
            }}
          >
            {loading ? '⏳' : '📤'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Playground
