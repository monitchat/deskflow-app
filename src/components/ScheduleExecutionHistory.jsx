import { useState, useEffect } from 'react'
import api from '../config/axios'

const STATUS_MAP = {
  completed: { label: 'Concluido', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)' },
  failed: { label: 'Falhou', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
  running: { label: 'Executando', color: '#eab308', bg: 'rgba(234, 179, 8, 0.12)' },
  partial: { label: 'Parcial', color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)' },
}

function ScheduleExecutionHistory({ flowId, scheduleId, onExecuteNow }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)
  const [expandedRow, setExpandedRow] = useState(null)
  const [expandedDetails, setExpandedDetails] = useState({})

  useEffect(() => {
    if (scheduleId) {
      loadHistory()
    } else {
      setLoading(false)
    }
  }, [flowId, scheduleId])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/api/v1/flows/${flowId}/schedules/${scheduleId}/history`)
      if (res.data.success) {
        // Normaliza campos do backend para o formato do frontend
        const entries = (res.data.data || []).map((e) => {
          let duration = null
          if (e.started_at && e.finished_at) {
            duration = Math.round(
              (new Date(e.finished_at) - new Date(e.started_at)) / 1000
            )
          }
          return {
            ...e,
            executed_at: e.started_at,
            targets_count: e.total_targets,
            success_count: e.successful,
            fail_count: e.failed,
            duration_seconds: duration,
          }
        })
        setHistory(entries)
      }
    } catch (err) {
      console.error('Error loading schedule history:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExecuteNow = async () => {
    try {
      setExecuting(true)
      await onExecuteNow()
      // Reload history after a brief delay
      setTimeout(loadHistory, 1500)
    } finally {
      setExecuting(false)
    }
  }

  const formatDate = (iso) => {
    if (!iso) return '-'
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    })
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '-'
    if (seconds < 60) return `${seconds}s`
    const min = Math.floor(seconds / 60)
    const sec = seconds % 60
    return `${min}m ${sec}s`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Execute now button */}
      {scheduleId && (
        <button
          onClick={handleExecuteNow}
          disabled={executing}
          style={{
            padding: '0.6rem 1rem',
            backgroundColor: executing ? 'var(--border, #334155)' : 'var(--accent, #6366f1)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: executing ? 'not-allowed' : 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            transition: 'background-color 0.15s',
            opacity: executing ? 0.7 : 1,
          }}
        >
          {executing ? 'Executando...' : 'Executar agora'}
        </button>
      )}

      {/* History table */}
      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: 'var(--text-dim, #64748b)',
          fontSize: '0.85rem',
        }}>
          Carregando historico...
        </div>
      ) : !scheduleId ? (
        <div style={{
          textAlign: 'center',
          padding: '2.5rem 1rem',
          color: 'var(--text-dim, #64748b)',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>&#128197;</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>Salve o agendamento primeiro</div>
          <div style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>
            O historico de execucoes aparecera aqui apos a primeira execucao.
          </div>
        </div>
      ) : history.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '2.5rem 1rem',
          color: 'var(--text-dim, #64748b)',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>&#128202;</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>Nenhuma execucao registrada</div>
          <div style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>
            O historico aparecera aqui apos a primeira execucao do agendamento.
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', maxHeight: '350px', overflowY: 'auto' }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 80px 70px 60px 60px 60px',
            gap: '0.5rem',
            padding: '0.5rem 0.6rem',
            fontSize: '0.7rem',
            fontWeight: 600,
            color: 'var(--text-dim, #64748b)',
            borderBottom: '1px solid var(--border, #334155)',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
          }}>
            <div>Data</div>
            <div>Status</div>
            <div style={{ textAlign: 'center' }}>Dest.</div>
            <div style={{ textAlign: 'center' }}>OK</div>
            <div style={{ textAlign: 'center' }}>Erro</div>
            <div style={{ textAlign: 'right' }}>Tempo</div>
          </div>

          {/* Table rows */}
          {history.map((entry, idx) => {
            const status = STATUS_MAP[entry.status] || STATUS_MAP.failed
            const hasDetails = entry.error_details && entry.error_details.length > 0
            const isExpanded = expandedRow === (entry.id || idx)
            return (
              <div key={entry.id || idx}>
                <div
                  onClick={() => hasDetails && setExpandedRow(isExpanded ? null : (entry.id || idx))}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 80px 70px 60px 60px 60px',
                    gap: '0.5rem',
                    padding: '0.55rem 0.6rem',
                    fontSize: '0.78rem',
                    borderBottom: isExpanded ? 'none' : '1px solid var(--border, #334155)',
                    alignItems: 'center',
                    cursor: hasDetails ? 'pointer' : 'default',
                    transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={(e) => { if (hasDetails) e.currentTarget.style.backgroundColor = 'var(--bg-hover, #1a2540)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <div style={{
                    color: 'var(--text-secondary, #cbd5e1)',
                    fontFamily: 'monospace',
                    fontSize: '0.72rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}>
                    {hasDetails && (
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', transition: 'transform 0.15s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                        ▶
                      </span>
                    )}
                    {formatDate(entry.executed_at)}
                  </div>
                  <div>
                    <span style={{
                      padding: '0.15rem 0.45rem',
                      borderRadius: '10px',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      backgroundColor: status.bg,
                      color: status.color,
                    }}>
                      {status.label}
                    </span>
                  </div>
                  <div style={{
                    textAlign: 'center',
                    color: 'var(--text-muted, #94a3b8)',
                    fontSize: '0.78rem',
                  }}>
                    {entry.targets_count ?? '-'}
                  </div>
                  <div style={{
                    textAlign: 'center',
                    color: '#22c55e',
                    fontSize: '0.78rem',
                  }}>
                    {entry.success_count ?? '-'}
                  </div>
                  <div style={{
                    textAlign: 'center',
                    color: entry.fail_count > 0 ? '#ef4444' : 'var(--text-muted, #94a3b8)',
                    fontSize: '0.78rem',
                  }}>
                    {entry.fail_count ?? '-'}
                  </div>
                  <div style={{
                    textAlign: 'right',
                    color: 'var(--text-dim, #64748b)',
                    fontFamily: 'monospace',
                    fontSize: '0.72rem',
                  }}>
                    {formatDuration(entry.duration_seconds)}
                  </div>
                </div>

                {/* Detalhes expandidos por destinatário */}
                {isExpanded && hasDetails && (
                  <div style={{
                    padding: '0.5rem 0.6rem 0.6rem 1.5rem',
                    borderBottom: '1px solid var(--border, #334155)',
                    backgroundColor: 'var(--bg-input, #0f172a)',
                    fontSize: '0.73rem',
                  }}>
                    {entry.error_details.map((item, i) => {
                      const isSuccess = item.success !== false && !item.error
                      const details = item.details || []
                      const hasPayload = details.length > 0 || item.error
                      return (
                        <div key={i} style={{
                          padding: '0.4rem 0',
                          borderBottom: i < entry.error_details.length - 1 ? '1px solid var(--border, #334155)' : 'none',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span style={{
                              width: '16px', height: '16px', borderRadius: '50%',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.6rem', fontWeight: 700, flexShrink: 0,
                              backgroundColor: isSuccess ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                              color: isSuccess ? '#22c55e' : '#ef4444',
                            }}>
                              {isSuccess ? '✓' : '✗'}
                            </span>
                            <span style={{ color: 'var(--text-secondary, #cbd5e1)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                              {item.target || 'N/A'}
                            </span>
                            <span style={{
                              fontSize: '0.65rem',
                              padding: '0.1rem 0.35rem',
                              borderRadius: '8px',
                              backgroundColor: isSuccess ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                              color: isSuccess ? '#22c55e' : '#ef4444',
                              fontWeight: 600,
                            }}>
                              {isSuccess ? 'Enviado' : 'Falhou'}
                            </span>
                            {(item.sent > 0 || item.failed > 0) && (
                              <span style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }}>
                                {item.sent > 0 && `${item.sent} enviada${item.sent > 1 ? 's' : ''}`}
                                {item.sent > 0 && item.failed > 0 && ', '}
                                {item.failed > 0 && <span style={{ color: '#ef4444' }}>{item.failed} falha{item.failed > 1 ? 's' : ''}</span>}
                              </span>
                            )}
                          </div>

                          {/* Erro geral */}
                          {item.error && (
                            <div style={{
                              color: '#ef4444',
                              fontSize: '0.7rem',
                              padding: '0.3rem 0.5rem',
                              marginTop: '0.3rem',
                              marginLeft: '1.4rem',
                              backgroundColor: 'rgba(239, 68, 68, 0.06)',
                              border: '1px solid rgba(239, 68, 68, 0.12)',
                              borderRadius: '4px',
                              wordBreak: 'break-word',
                              lineHeight: 1.4,
                            }}>
                              {item.error}
                            </div>
                          )}

                          {/* Detalhes de cada reply */}
                          {details.length > 0 && (
                            <div style={{
                              marginTop: '0.3rem',
                              marginLeft: '1.4rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.2rem',
                            }}>
                              {details.map((d, j) => {
                                const detailKey = `${entry.id || idx}-${i}-${j}`
                                const isDetailExpanded = expandedDetails[detailKey]
                                const previewText = d.preview || ''
                                const isLong = previewText.length > 100
                                return (
                                  <div key={j} style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.15rem',
                                    fontSize: '0.68rem',
                                    padding: '0.3rem 0.5rem',
                                    backgroundColor: d.sent
                                      ? 'rgba(34, 197, 94, 0.05)'
                                      : 'rgba(239, 68, 68, 0.05)',
                                    borderRadius: '4px',
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                      <span style={{
                                        color: d.sent ? '#22c55e' : '#ef4444',
                                        fontSize: '0.6rem',
                                      }}>
                                        {d.sent ? '✓' : '✗'}
                                      </span>
                                      <span style={{
                                        padding: '0.05rem 0.3rem',
                                        borderRadius: '3px',
                                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                        color: '#818cf8',
                                        fontFamily: 'monospace',
                                        fontSize: '0.65rem',
                                      }}>
                                        {d.type || '?'}
                                      </span>
                                      {d.error && (
                                        <span style={{ color: '#ef4444', wordBreak: 'break-word' }}>
                                          {d.error}
                                        </span>
                                      )}
                                      {previewText && (
                                        <span
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setExpandedDetails(prev => ({
                                              ...prev,
                                              [detailKey]: !prev[detailKey],
                                            }))
                                          }}
                                          style={{
                                            marginLeft: 'auto',
                                            cursor: 'pointer',
                                            color: '#818cf8',
                                            fontSize: '0.62rem',
                                            fontWeight: 500,
                                            whiteSpace: 'nowrap',
                                          }}
                                        >
                                          {isDetailExpanded ? 'ocultar' : 'ver payload'}
                                        </span>
                                      )}
                                    </div>
                                    {previewText && isDetailExpanded && (
                                      <div style={{
                                        color: 'var(--text-secondary, #cbd5e1)',
                                        fontSize: '0.7rem',
                                        lineHeight: 1.5,
                                        paddingLeft: '1rem',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        padding: '0.4rem 0.6rem',
                                        marginTop: '0.2rem',
                                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                        borderRadius: '4px',
                                        fontFamily: 'monospace',
                                      }}>
                                        {previewText}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Refresh button */}
      {scheduleId && history.length > 0 && (
        <button
          onClick={loadHistory}
          style={{
            padding: '0.4rem 0.75rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--border, #334155)',
            borderRadius: '6px',
            color: 'var(--text-muted, #94a3b8)',
            fontSize: '0.78rem',
            cursor: 'pointer',
            alignSelf: 'center',
            transition: 'border-color 0.15s',
          }}
        >
          Atualizar historico
        </button>
      )}
    </div>
  )
}

export default ScheduleExecutionHistory
