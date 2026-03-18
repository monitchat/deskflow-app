import { useState, useEffect, useRef } from 'react'
import api from '../config/axios'

const EVENT_STYLES = {
  node_start: { icon: '▶️', color: '#6366f1', label: 'Nó iniciado' },
  node_end: { icon: '✅', color: '#22c55e', label: 'Nó concluído' },
  tool_call: { icon: '🔧', color: '#f59e0b', label: 'Tool chamada' },
  tool_result: { icon: '📦', color: '#8B5CF6', label: 'Tool resultado' },
  agent_response: { icon: '🤖', color: '#3b82f6', label: 'Resposta IA' },
}

function ExecutionLogsPanel({ flowId, onClose }) {
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [msisdnFilter, setMsisdnFilter] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [expandedLogs, setExpandedLogs] = useState(new Set())
  const intervalRef = useRef(null)

  useEffect(() => {
    loadLogs()
    if (autoRefresh) {
      intervalRef.current = setInterval(loadLogs, 3000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [flowId, msisdnFilter, autoRefresh])

  const loadLogs = async () => {
    try {
      const params = new URLSearchParams({ limit: '200' })
      if (msisdnFilter) params.set('msisdn', msisdnFilter)
      const res = await api.get(`/api/v1/logs/${flowId}?${params}`)
      if (res.data.success) {
        setLogs(res.data.data)
        setTotal(res.data.total)
      }
    } catch (err) {
      console.error('Error loading logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = async () => {
    if (!window.confirm('Limpar todos os logs deste fluxo?')) return
    try {
      const params = msisdnFilter ? `?msisdn=${msisdnFilter}` : ''
      await api.delete(`/api/v1/logs/${flowId}${params}`)
      loadLogs()
    } catch (err) {
      console.error('Error clearing logs:', err)
    }
  }

  const formatTime = (iso) => {
    const d = new Date(iso)
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })
  }

  const formatDuration = (ms) => {
    if (!ms) return ''
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  // Agrupa por msisdn
  const sessions = [...new Set(logs.map(l => l.msisdn))]

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 10000,
    }}
    onClick={(e) => e.stopPropagation()}
    onMouseDown={(e) => e.stopPropagation()}
    >
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: '14px',
        width: '750px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.25rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid #334155',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              📊 Execution Logs
            </h3>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
              {total} eventos registrados
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              style={{
                padding: '0.3rem 0.6rem', fontSize: '0.72rem',
                backgroundColor: autoRefresh ? '#22c55e20' : 'transparent',
                color: autoRefresh ? '#22c55e' : '#64748b',
                border: `1px solid ${autoRefresh ? '#22c55e40' : '#334155'}`,
                borderRadius: '4px', cursor: 'pointer',
              }}
            >
              {autoRefresh ? '● Live' : '○ Paused'}
            </button>
            <button onClick={loadLogs} style={btnStyle} title="Atualizar">🔄</button>
            <button onClick={handleClear} style={{ ...btnStyle, color: '#ef4444' }} title="Limpar">🗑️</button>
            <button onClick={onClose} style={{ ...btnStyle, fontSize: '1.2rem' }}>&times;</button>
          </div>
        </div>

        {/* Filtro */}
        <div style={{ padding: '0.5rem 1.25rem', borderBottom: '1px solid #0f172a', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Sessão:</span>
          <select
            value={msisdnFilter}
            onChange={(e) => setMsisdnFilter(e.target.value)}
            style={{
              padding: '0.3rem 0.5rem', fontSize: '0.78rem', borderRadius: '4px',
              border: '1px solid #334155', backgroundColor: '#0f172a', color: '#e2e8f0',
              flex: 1,
            }}
          >
            <option value="">Todas as sessões</option>
            {sessions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Logs */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 1.25rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Carregando...</div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
              <p>Nenhum log registrado ainda.</p>
              <p style={{ fontSize: '0.78rem' }}>Execute o fluxo para ver os logs aqui.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {logs.map((l) => {
                const style = EVENT_STYLES[l.event_type] || { icon: '📝', color: '#64748b', label: l.event_type }
                const isExpanded = expandedLogs.has(l.id)

                return (
                  <div key={l.id}>
                    <div
                      onClick={() => setExpandedLogs((prev) => {
                        const next = new Set(prev)
                        if (next.has(l.id)) next.delete(l.id)
                        else next.add(l.id)
                        return next
                      })}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.4rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: isExpanded ? '#334155' : 'transparent',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        transition: 'background-color 0.1s',
                      }}
                      onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.backgroundColor = '#33415520' }}
                      onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>{style.icon}</span>
                      <span style={{ color: '#64748b', fontSize: '0.68rem', fontFamily: 'monospace', flexShrink: 0, width: '85px' }}>
                        {formatTime(l.created_at)}
                      </span>
                      <span style={{
                        fontSize: '0.65rem', fontWeight: 600,
                        padding: '0.1rem 0.35rem', borderRadius: '3px',
                        backgroundColor: `${style.color}20`, color: style.color,
                        flexShrink: 0,
                      }}>
                        {style.label}
                      </span>
                      {l.node_id && (
                        <span style={{ color: '#94a3b8', fontSize: '0.72rem', fontFamily: 'monospace' }}>
                          {l.node_id}
                        </span>
                      )}
                      {l.node_type && (
                        <span style={{ color: '#475569', fontSize: '0.68rem' }}>
                          ({l.node_type})
                        </span>
                      )}
                      {l.event_type === 'tool_call' && l.data?.tool_name && (
                        <span style={{ color: '#f59e0b', fontSize: '0.72rem', fontFamily: 'monospace' }}>
                          → {l.data.tool_name}
                        </span>
                      )}
                      <span style={{ flex: 1 }} />
                      {l.duration_ms > 0 && (
                        <span style={{
                          color: l.duration_ms > 5000 ? '#ef4444' : l.duration_ms > 1000 ? '#f59e0b' : '#22c55e',
                          fontSize: '0.68rem', fontFamily: 'monospace',
                        }}>
                          {formatDuration(l.duration_ms)}
                        </span>
                      )}
                      {!msisdnFilter && (
                        <span style={{ color: '#475569', fontSize: '0.62rem', fontFamily: 'monospace', flexShrink: 0 }}>
                          {l.msisdn.slice(-4)}
                        </span>
                      )}
                    </div>

                    {/* Detalhes expandidos */}
                    {isExpanded && l.data && Object.keys(l.data).length > 0 && (
                      <div style={{
                        padding: '0.5rem 0.6rem 0.5rem 2.2rem',
                        fontSize: '0.75rem',
                        borderBottom: '1px solid #1e293b',
                      }}>
                        <pre style={{
                          margin: 0, padding: '0.5rem',
                          borderRadius: '6px',
                          backgroundColor: '#0f172a',
                          color: '#a5b4fc',
                          fontFamily: 'monospace',
                          fontSize: '0.72rem',
                          lineHeight: 1.5,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          maxHeight: '200px',
                          overflowY: 'auto',
                        }}>
                          {JSON.stringify(l.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const btnStyle = {
  padding: '0.3rem 0.5rem',
  backgroundColor: 'transparent',
  color: '#94a3b8',
  border: '1px solid #334155',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.85rem',
}

export default ExecutionLogsPanel
