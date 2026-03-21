import { useState, useEffect, useCallback } from 'react'
import api from '../config/axios'
import { useToast } from '../contexts/ToastContext'
import ScheduleTimeGrid from './ScheduleTimeGrid'
import ScheduleBlockedDates from './ScheduleBlockedDates'
import ScheduleTargets from './ScheduleTargets'
import ScheduleExecutionHistory from './ScheduleExecutionHistory'

const TABS = [
  { id: 'config', label: 'Configuracao' },
  { id: 'blocks', label: 'Bloqueios' },
  { id: 'targets', label: 'Destinatarios' },
  { id: 'history', label: 'Historico' },
]

const SCHEDULE_TYPES = [
  { value: 'interval', label: 'Intervalo' },
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
]

const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom']

const DEFAULT_SCHEDULE = {
  name: '',
  is_active: false,
  schedule_type: 'daily',
  interval_minutes: 30,
  execution_times: ['08:00'],
  weekdays: [0, 1, 2, 3, 4],
  cron_expression: '',
  start_time: '08:00',
  end_time: '18:00',
  valid_from: null,
  valid_until: null,
  block_weekends: true,
  block_holidays: false,
  blocked_dates: [],
  target_type: 'none',
  target_config: { numbers: [] },
  execution_config: { initial_context: {}, max_concurrent: 10 },
  timezone: 'America/Sao_Paulo',
}

function SchedulePanel({ flowId, isNewFlow, flowName, flowDescription, nodes, edges, onFlowCreated, onClose }) {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('config')
  const [loading, setLoading] = useState(!isNewFlow)
  const [saving, setSaving] = useState(false)
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE)
  const [scheduleId, setScheduleId] = useState(null)
  const [currentFlowId, setCurrentFlowId] = useState(isNewFlow ? null : flowId)
  const [executionMode, setExecutionMode] = useState('passive')
  const [newTimeValue, setNewTimeValue] = useState('12:00')
  const [lastSavedAt, setLastSavedAt] = useState(null)

  useEffect(() => {
    if (currentFlowId) {
      loadSchedules()
      loadExecutionMode()
    }
  }, [currentFlowId])

  const loadSchedules = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/v1/flows/${currentFlowId}/schedules`)
      if (res.data?.success && res.data.data?.length > 0) {
        const existing = res.data.data[0]
        setScheduleId(existing.id)
        setSchedule({
          name: existing.name || '',
          is_active: existing.is_active || false,
          schedule_type: existing.schedule_type || 'daily',
          interval_minutes: existing.interval_minutes || 30,
          execution_times: existing.execution_times || ['08:00'],
          weekdays: existing.weekdays || [0, 1, 2, 3, 4],
          cron_expression: existing.cron_expression || '',
          start_time: existing.start_time || '08:00',
          end_time: existing.end_time || '18:00',
          valid_from: existing.valid_from || null,
          valid_until: existing.valid_until || null,
          block_weekends: existing.block_weekends ?? true,
          block_holidays: existing.block_holidays ?? false,
          blocked_dates: existing.blocked_dates || [],
          target_type: existing.target_type || 'none',
          target_config: existing.target_config || { numbers: [] },
          execution_config: existing.execution_config || { initial_context: {}, max_concurrent: 10 },
          timezone: existing.timezone || 'America/Sao_Paulo',
        })
      }
    } catch (err) {
      console.warn('Schedule API not available yet:', err.message)
    }
    setLoading(false)
  }

  const loadExecutionMode = async () => {
    try {
      const res = await api.get(`/api/v1/flows/${currentFlowId}`)
      if (res.data?.success) {
        setExecutionMode(res.data.data?.execution_mode || 'passive')
      }
    } catch (err) {
      console.warn('Could not load execution mode:', err.message)
    }
  }

  const saveExecutionMode = async (mode) => {
    setExecutionMode(mode)
    if (!currentFlowId) return
    try {
      await api.put(`/api/v1/flows/${currentFlowId}`, { execution_mode: mode })
      toast.success(
        mode === 'passive' ? 'Modo passivo: responde apenas mensagens'
        : mode === 'active' ? 'Modo ativo: executa apenas por agendamento'
        : 'Modo ambos: responde mensagens e executa agendamentos'
      )
    } catch (err) {
      console.error('Error saving execution mode:', err)
      toast.error('Erro ao salvar modo de execucao')
    }
  }

  const updateField = useCallback((field, value) => {
    setSchedule(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleSave = async () => {
    if (!schedule.name.trim()) {
      toast.error('Informe um nome para o agendamento')
      return
    }

    try {
      setSaving(true)
      let targetFlowId = currentFlowId

      // Se é um flow novo, salva o flow primeiro
      if (!targetFlowId) {
        const companyId = localStorage.getItem('user_company_id')
        const flowData = {
          nodes: nodes || [],
          edges: edges || [],
          metadata: { version: '1.0.0', updated_at: new Date().toISOString() },
        }
        const flowRes = await api.post('/api/v1/flows', {
          name: flowName || 'Novo Fluxo',
          description: flowDescription || '',
          data: flowData,
          is_active: false,
          company_id: companyId ? parseInt(companyId) : null,
        })

        if (!flowRes.data?.success || !flowRes.data.data?.id) {
          toast.error('Erro ao salvar o fluxo')
          return
        }

        targetFlowId = flowRes.data.data.id
        setCurrentFlowId(targetFlowId)
        toast.success('Fluxo criado com sucesso!')

        if (onFlowCreated) {
          onFlowCreated(targetFlowId)
        }
      }

      // Agora salva o agendamento
      let res
      if (scheduleId) {
        res = await api.put(`/api/v1/flows/${targetFlowId}/schedules/${scheduleId}`, schedule)
      } else {
        res = await api.post(`/api/v1/flows/${targetFlowId}/schedules`, schedule)
      }

      if (res.data.success) {
        if (!scheduleId && res.data.data?.id) {
          setScheduleId(res.data.data.id)
        }
        setLastSavedAt(new Date())
        toast.success('Agendamento salvo com sucesso')
      }
    } catch (err) {
      console.error('Error saving schedule:', err)
      toast.error('Erro ao salvar agendamento')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async () => {
    if (!scheduleId) {
      updateField('is_active', !schedule.is_active)
      return
    }

    try {
      const res = await api.post(`/api/v1/flows/${flowId}/schedules/${scheduleId}/toggle`)
      if (res.data.success) {
        updateField('is_active', res.data.data.is_active)
        toast.success(res.data.data.is_active ? 'Agendamento ativado' : 'Agendamento desativado')
      }
    } catch (err) {
      console.error('Error toggling schedule:', err)
      toast.error('Erro ao alterar status do agendamento')
    }
  }

  const handleDelete = async () => {
    if (!scheduleId) {
      onClose()
      return
    }

    if (!window.confirm('Tem certeza que deseja excluir este agendamento?')) return

    try {
      await api.delete(`/api/v1/flows/${flowId}/schedules/${scheduleId}`)
      toast.success('Agendamento excluido')
      onClose()
    } catch (err) {
      console.error('Error deleting schedule:', err)
      toast.error('Erro ao excluir agendamento')
    }
  }

  const handleExecuteNow = async () => {
    if (!scheduleId) return
    try {
      await api.post(`/api/v1/flows/${flowId}/schedules/${scheduleId}/execute-now`)
      toast.success('Execucao iniciada')
    } catch (err) {
      console.error('Error executing now:', err)
      toast.error('Erro ao executar agendamento')
    }
  }

  const addExecutionTime = () => {
    if (!newTimeValue) return
    if (schedule.execution_times.includes(newTimeValue)) return
    const times = [...schedule.execution_times, newTimeValue].sort()
    updateField('execution_times', times)
  }

  const removeExecutionTime = (time) => {
    updateField('execution_times', schedule.execution_times.filter(t => t !== time))
  }

  const toggleWeekday = (dayIndex) => {
    const has = schedule.weekdays.includes(dayIndex)
    if (has) {
      updateField('weekdays', schedule.weekdays.filter(d => d !== dayIndex))
    } else {
      updateField('weekdays', [...schedule.weekdays, dayIndex].sort())
    }
  }

  const toggleBlockedDate = (dateStr) => {
    if (schedule.blocked_dates.includes(dateStr)) {
      updateField('blocked_dates', schedule.blocked_dates.filter(d => d !== dateStr))
    } else {
      updateField('blocked_dates', [...schedule.blocked_dates, dateStr])
    }
  }

  const tabStyle = (tabId) => ({
    flex: 1,
    padding: '0.55rem 0.5rem',
    backgroundColor: 'transparent',
    color: activeTab === tabId ? 'var(--text-primary, #f1f5f9)' : 'var(--text-dim, #64748b)',
    border: 'none',
    borderBottom: activeTab === tabId ? '2px solid var(--accent, #6366f1)' : '2px solid transparent',
    cursor: 'pointer',
    fontSize: '0.78rem',
    fontWeight: activeTab === tabId ? 600 : 400,
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  })

  // ─── Render ────────────────────────────────────────────────

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        backgroundColor: 'var(--bg-surface, #1e293b)',
        borderRadius: '12px',
        width: '620px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* ── Header ── */}
        <div style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border, #334155)',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              margin: 0,
              fontSize: '1.05rem',
              fontWeight: 700,
              color: 'var(--text-primary, #f1f5f9)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              Agendamento Automatico
            </h3>
            <p style={{
              margin: '0.15rem 0 0',
              fontSize: '0.75rem',
              color: 'var(--text-dim, #64748b)',
            }}>
              Configure a execucao automatica deste fluxo
            </p>
          </div>

          {/* Active toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0, marginRight: '0.75rem' }}>
            <span style={{
              fontSize: '0.75rem',
              color: schedule.is_active ? '#22c55e' : 'var(--text-dim, #64748b)',
              fontWeight: 600,
            }}>
              {schedule.is_active ? 'Ativo' : 'Inativo'}
            </span>
            <button
              onClick={handleToggleActive}
              style={{
                width: '40px',
                height: '22px',
                borderRadius: '11px',
                border: 'none',
                backgroundColor: schedule.is_active ? '#22c55e' : 'var(--border, #334155)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background-color 0.2s',
                flexShrink: 0,
              }}
            >
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#fff',
                position: 'absolute',
                top: '3px',
                left: schedule.is_active ? '21px' : '3px',
                transition: 'left 0.2s',
              }} />
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--text-dim, #64748b)',
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            &times;
          </button>
        </div>

        {/* ── Tabs ── */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border, #334155)',
          padding: '0 1.25rem',
        }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              style={tabStyle(tab.id)}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div style={{
          padding: '1.25rem',
          overflowY: 'auto',
          flex: 1,
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim, #64748b)' }}>
              Carregando...
            </div>
          ) : (
            <>
              {activeTab === 'config' && renderConfigTab()}
              {activeTab === 'blocks' && renderBlocksTab()}
              {activeTab === 'targets' && renderTargetsTab()}
              {activeTab === 'history' && renderHistoryTab()}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '0.75rem 1.25rem',
          borderTop: '1px solid var(--border, #334155)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
            {lastSavedAt && (
              <span style={{
                fontSize: '0.7rem',
                color: 'var(--text-dim, #64748b)',
              }}>
                Salvo as {lastSavedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {scheduleId && (
              <button
                onClick={handleDelete}
                style={{
                  padding: '0.4rem 0.7rem',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '6px',
                  color: '#ef4444',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
              >
                Excluir
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--bg-hover, #1a2540)',
                color: 'var(--text-secondary, #cbd5e1)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500,
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '0.5rem 1.25rem',
                backgroundColor: saving ? 'var(--border, #334155)' : 'var(--accent, #6366f1)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                opacity: saving ? 0.7 : 1,
                transition: 'background-color 0.15s',
              }}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // ─── Tab Renderers ────────────────────────────────────────

  function renderConfigTab() {
    const EXECUTION_MODES = [
      { value: 'passive', label: 'Passivo', desc: 'Responde apenas mensagens recebidas' },
      { value: 'active', label: 'Ativo', desc: 'Executa apenas por agendamento' },
      { value: 'both', label: 'Ambos', desc: 'Responde mensagens e executa agendamentos' },
    ]

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Execution mode */}
        <div>
          <label style={labelStyle}>Modo de execucao do fluxo</label>
          <p style={descStyle}>Define como este fluxo pode ser acionado.</p>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {EXECUTION_MODES.map(mode => {
              const isSelected = executionMode === mode.value
              return (
                <button
                  key={mode.value}
                  onClick={() => saveExecutionMode(mode.value)}
                  title={mode.desc}
                  style={{
                    flex: 1,
                    padding: '0.55rem 0.5rem',
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-input, #0f172a)',
                    color: isSelected ? 'var(--accent-light, #818cf8)' : 'var(--text-muted, #94a3b8)',
                    border: `1px solid ${isSelected ? 'rgba(99, 102, 241, 0.4)' : 'var(--border, #334155)'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: isSelected ? 600 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  {mode.label}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ height: '1px', backgroundColor: 'var(--border, #334155)' }} />

        {/* Schedule name */}
        <div>
          <label style={labelStyle}>Nome do agendamento</label>
          <input
            type="text"
            value={schedule.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Ex: Disparo diario de boas-vindas"
            style={inputStyle}
          />
        </div>

        {/* Schedule type */}
        <div>
          <label style={labelStyle}>Tipo de recorrencia</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {SCHEDULE_TYPES.map(type => {
              const isSelected = schedule.schedule_type === type.value
              return (
                <button
                  key={type.value}
                  onClick={() => updateField('schedule_type', type.value)}
                  style={{
                    flex: 1,
                    padding: '0.55rem 0.75rem',
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-input, #0f172a)',
                    color: isSelected ? 'var(--accent-light, #818cf8)' : 'var(--text-muted, #94a3b8)',
                    border: `1px solid ${isSelected ? 'rgba(99, 102, 241, 0.4)' : 'var(--border, #334155)'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: isSelected ? 600 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  {type.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Interval config */}
        {schedule.schedule_type === 'interval' && (
          <div>
            <label style={labelStyle}>Intervalo em minutos</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)' }}>A cada</span>
              <input
                type="number"
                min={1}
                max={1440}
                value={schedule.interval_minutes}
                onChange={(e) => updateField('interval_minutes', parseInt(e.target.value, 10) || 30)}
                style={{ ...inputStyle, width: '80px', textAlign: 'center' }}
              />
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)' }}>minutos</span>
            </div>
          </div>
        )}

        {/* Daily config */}
        {schedule.schedule_type === 'daily' && (
          <div>
            <label style={labelStyle}>Horarios de execucao</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
              {schedule.execution_times.map(time => (
                <div key={time} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.25rem 0.6rem',
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: '14px',
                  fontSize: '0.8rem',
                  color: 'var(--accent-light, #818cf8)',
                  fontWeight: 500,
                }}>
                  {time}
                  <button
                    onClick={() => removeExecutionTime(time)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-light, #818cf8)',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      lineHeight: 1,
                      padding: 0,
                    }}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <input
                type="time"
                value={newTimeValue}
                onChange={(e) => setNewTimeValue(e.target.value)}
                style={{ ...inputStyle, width: '120px' }}
              />
              <button
                onClick={addExecutionTime}
                style={{
                  padding: '0.45rem 0.75rem',
                  backgroundColor: 'var(--accent, #6366f1)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                Adicionar
              </button>
            </div>
          </div>
        )}

        {/* Weekly config */}
        {schedule.schedule_type === 'weekly' && (
          <>
            <div>
              <label style={labelStyle}>Dias da semana</label>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {WEEKDAY_LABELS.map((label, idx) => {
                  const isSelected = schedule.weekdays.includes(idx)
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleWeekday(idx)}
                      style={{
                        padding: '0.4rem 0.65rem',
                        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-input, #0f172a)',
                        color: isSelected ? 'var(--accent-light, #818cf8)' : 'var(--text-dim, #64748b)',
                        border: `1px solid ${isSelected ? 'rgba(99, 102, 241, 0.35)' : 'var(--border, #334155)'}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        fontWeight: isSelected ? 600 : 400,
                        transition: 'all 0.15s',
                        minWidth: '42px',
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Horarios de execucao</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
                {schedule.execution_times.map(time => (
                  <div key={time} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.25rem 0.6rem',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    borderRadius: '14px',
                    fontSize: '0.8rem',
                    color: 'var(--accent-light, #818cf8)',
                    fontWeight: 500,
                  }}>
                    {time}
                    <button
                      onClick={() => removeExecutionTime(time)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-light, #818cf8)',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        lineHeight: 1,
                        padding: 0,
                      }}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <input
                  type="time"
                  value={newTimeValue}
                  onChange={(e) => setNewTimeValue(e.target.value)}
                  style={{ ...inputStyle, width: '120px' }}
                />
                <button
                  onClick={addExecutionTime}
                  style={{
                    padding: '0.45rem 0.75rem',
                    backgroundColor: 'var(--accent, #6366f1)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  Adicionar
                </button>
              </div>
            </div>
          </>
        )}

        {/* Execution window */}
        <div>
          <label style={labelStyle}>Janela de execucao</label>
          <p style={descStyle}>Horario permitido para execucoes automaticas.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="time"
              value={schedule.start_time}
              onChange={(e) => updateField('start_time', e.target.value)}
              style={{ ...inputStyle, width: '120px' }}
            />
            <span style={{ fontSize: '0.82rem', color: 'var(--text-dim, #64748b)' }}>ate</span>
            <input
              type="time"
              value={schedule.end_time}
              onChange={(e) => updateField('end_time', e.target.value)}
              style={{ ...inputStyle, width: '120px' }}
            />
          </div>
        </div>

        {/* Validity period */}
        <div>
          <label style={labelStyle}>Periodo de validade (opcional)</label>
          <p style={descStyle}>Defina um periodo em que o agendamento estara ativo.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="date"
              value={schedule.valid_from || ''}
              onChange={(e) => updateField('valid_from', e.target.value || null)}
              style={{ ...inputStyle, width: '150px' }}
            />
            <span style={{ fontSize: '0.82rem', color: 'var(--text-dim, #64748b)' }}>ate</span>
            <input
              type="date"
              value={schedule.valid_until || ''}
              onChange={(e) => updateField('valid_until', e.target.value || null)}
              style={{ ...inputStyle, width: '150px' }}
            />
          </div>
        </div>

        {/* Time grid preview */}
        <div>
          <label style={labelStyle}>Visualizacao semanal</label>
          <p style={descStyle}>Preview de quando o fluxo sera executado.</p>
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'var(--bg-input, #0f172a)',
            borderRadius: '8px',
            border: '1px solid var(--border, #334155)',
          }}>
            <ScheduleTimeGrid
              scheduleType={schedule.schedule_type}
              executionTimes={schedule.execution_times}
              weekdays={schedule.weekdays}
              intervalMinutes={schedule.interval_minutes}
              startTime={schedule.start_time}
              endTime={schedule.end_time}
              blockWeekends={schedule.block_weekends}
            />
          </div>
        </div>
      </div>
    )
  }

  function renderBlocksTab() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Toggle: block weekends */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem',
          backgroundColor: 'var(--bg-input, #0f172a)',
          borderRadius: '8px',
          border: '1px solid var(--border, #334155)',
        }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary, #f1f5f9)' }}>
              Bloquear finais de semana
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim, #64748b)', marginTop: '0.15rem' }}>
              Nao executar aos sabados e domingos
            </div>
          </div>
          <button
            onClick={() => updateField('block_weekends', !schedule.block_weekends)}
            style={{
              width: '40px',
              height: '22px',
              borderRadius: '11px',
              border: 'none',
              backgroundColor: schedule.block_weekends ? '#22c55e' : 'var(--border, #334155)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background-color 0.2s',
              flexShrink: 0,
            }}
          >
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: '#fff',
              position: 'absolute',
              top: '3px',
              left: schedule.block_weekends ? '21px' : '3px',
              transition: 'left 0.2s',
            }} />
          </button>
        </div>

        {/* Toggle: block holidays */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem',
          backgroundColor: 'var(--bg-input, #0f172a)',
          borderRadius: '8px',
          border: '1px solid var(--border, #334155)',
        }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary, #f1f5f9)' }}>
              Bloquear feriados
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim, #64748b)', marginTop: '0.15rem' }}>
              Nao executar em feriados nacionais
            </div>
          </div>
          <button
            onClick={() => updateField('block_holidays', !schedule.block_holidays)}
            style={{
              width: '40px',
              height: '22px',
              borderRadius: '11px',
              border: 'none',
              backgroundColor: schedule.block_holidays ? '#22c55e' : 'var(--border, #334155)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background-color 0.2s',
              flexShrink: 0,
            }}
          >
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: '#fff',
              position: 'absolute',
              top: '3px',
              left: schedule.block_holidays ? '21px' : '3px',
              transition: 'left 0.2s',
            }} />
          </button>
        </div>

        {/* Blocked dates calendar */}
        <div>
          <label style={labelStyle}>Datas especificas bloqueadas</label>
          <p style={descStyle}>Clique nos dias do calendario para bloquear/desbloquear datas especificas.</p>
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'var(--bg-input, #0f172a)',
            borderRadius: '8px',
            border: '1px solid var(--border, #334155)',
          }}>
            <ScheduleBlockedDates
              blockedDates={schedule.blocked_dates}
              blockWeekends={schedule.block_weekends}
              onToggleDate={toggleBlockedDate}
              onRemoveDate={(date) => {
                updateField('blocked_dates', schedule.blocked_dates.filter(d => d !== date))
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  function renderTargetsTab() {
    return (
      <ScheduleTargets
        targetType={schedule.target_type}
        targetConfig={schedule.target_config}
        executionConfig={schedule.execution_config}
        onChangeTargetType={(val) => updateField('target_type', val)}
        onChangeTargetConfig={(val) => updateField('target_config', val)}
        onChangeExecutionConfig={(val) => updateField('execution_config', val)}
      />
    )
  }

  function renderHistoryTab() {
    return (
      <ScheduleExecutionHistory
        flowId={flowId}
        scheduleId={scheduleId}
        onExecuteNow={handleExecuteNow}
      />
    )
  }
}

// ─── Shared Styles ────────────────────────────────────────

const labelStyle = {
  display: 'block',
  fontSize: '0.82rem',
  fontWeight: 600,
  color: 'var(--text-secondary, #cbd5e1)',
  marginBottom: '0.35rem',
}

const descStyle = {
  margin: '0 0 0.5rem',
  fontSize: '0.75rem',
  color: 'var(--text-dim, #64748b)',
  lineHeight: 1.4,
}

const inputStyle = {
  padding: '0.5rem 0.75rem',
  backgroundColor: 'var(--bg-input, #0f172a)',
  border: '1px solid var(--border, #334155)',
  borderRadius: '6px',
  color: 'var(--text-primary, #f1f5f9)',
  fontSize: '0.85rem',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
}

export default SchedulePanel
