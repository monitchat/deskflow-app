import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import api from '../config/axios'

function FunnelBoard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [funnel, setFunnel] = useState(null)
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [dragCard, setDragCard] = useState(null)
  const [dragOverStage, setDragOverStage] = useState(null)
  const [showAddCard, setShowAddCard] = useState(null)
  const [newCardMsisdn, setNewCardMsisdn] = useState('')
  const [newCardName, setNewCardName] = useState('')
  const [selectedCard, setSelectedCard] = useState(null)
  const [cardHistory, setCardHistory] = useState([])
  const [search, setSearch] = useState('')
  const [showConfig, setShowConfig] = useState(false)
  const [automations, setAutomations] = useState([])
  const [editStages, setEditStages] = useState([])

  useEffect(() => { loadFunnel(); loadCards() }, [id])

  const loadFunnel = async () => {
    try {
      const res = await api.get(`/api/v1/funnels/${id}`)
      if (res.data.success) setFunnel(res.data.data)
    } catch (err) {
      console.error(err)
    }
  }

  const loadCards = async () => {
    try {
      const res = await api.get(`/api/v1/funnels/${id}/cards`)
      if (res.data.success) setCards(res.data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadAutomations = async () => {
    try {
      const res = await api.get(`/api/v1/funnels/${id}/automations`)
      if (res.data.success) setAutomations(res.data.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const openConfig = () => {
    setEditStages([...(funnel?.stages || [])])
    loadAutomations()
    setShowConfig(true)
  }

  const saveStages = async () => {
    try {
      await api.put(`/api/v1/funnels/${id}`, { stages: editStages })
      loadFunnel()
    } catch (err) {
      console.error(err)
    }
  }

  const addAutomation = async (stageId, actionType) => {
    try {
      await api.post(`/api/v1/funnels/${id}/automations`, {
        stage_id: stageId,
        action_type: actionType,
        trigger_type: 'on_enter',
        action_config: {},
      })
      loadAutomations()
    } catch (err) {
      console.error(err)
    }
  }

  const updateAutomation = async (autoId, updates) => {
    try {
      await api.put(`/api/v1/funnels/${id}/automations/${autoId}`, updates)
      loadAutomations()
    } catch (err) {
      console.error(err)
    }
  }

  const deleteAutomation = async (autoId) => {
    try {
      await api.delete(`/api/v1/funnels/${id}/automations/${autoId}`)
      loadAutomations()
    } catch (err) {
      console.error(err)
    }
  }

  const moveCard = async (cardId, toStageId) => {
    try {
      await api.post(`/api/v1/funnels/${id}/cards/${cardId}/move`, { to_stage_id: toStageId })
      loadCards()
    } catch (err) {
      console.error(err)
    }
  }

  const addCard = async (stageId) => {
    if (!newCardMsisdn.trim()) return
    try {
      await api.post(`/api/v1/funnels/${id}/cards`, {
        msisdn: newCardMsisdn,
        stage_id: stageId,
        contact_name: newCardName || null,
      })
      setShowAddCard(null)
      setNewCardMsisdn('')
      setNewCardName('')
      loadCards()
    } catch (err) {
      console.error(err)
    }
  }

  const deleteCard = async (cardId) => {
    try {
      await api.delete(`/api/v1/funnels/${id}/cards/${cardId}`)
      setSelectedCard(null)
      loadCards()
    } catch (err) {
      console.error(err)
    }
  }

  const loadHistory = async (cardId) => {
    try {
      const res = await api.get(`/api/v1/funnels/${id}/cards/${cardId}/history`)
      if (res.data.success) setCardHistory(res.data.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const openCard = (card) => {
    setSelectedCard(card)
    loadHistory(card.id)
  }

  // Drag handlers
  const handleDragStart = (e, card) => {
    setDragCard(card)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, stageId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStage(stageId)
  }

  const handleDragLeave = () => setDragOverStage(null)

  const handleDrop = (e, stageId) => {
    e.preventDefault()
    setDragOverStage(null)
    if (dragCard && dragCard.stage_id !== stageId) {
      moveCard(dragCard.id, stageId)
    }
    setDragCard(null)
  }

  const getStageName = (stageId) => {
    const stage = (funnel?.stages || []).find(s => s.id === stageId)
    return stage?.name || stageId
  }

  const filteredCards = search
    ? cards.filter(c =>
        (c.contact_name || '').toLowerCase().includes(search.toLowerCase()) ||
        c.msisdn.includes(search)
      )
    : cards

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Carregando...</div>
  if (!funnel) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Funil nao encontrado</div>

  const stages = funnel.stages || []

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      <Header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <button
            onClick={() => navigate('/funnels')}
            style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: '6px',
              color: 'var(--text-primary)', cursor: 'pointer', padding: '0.3rem 0.6rem',
              fontSize: '0.78rem', fontWeight: 600,
            }}
          >
            Funis
          </button>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {funnel.name}
          </span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar contato..."
            style={{
              padding: '0.3rem 0.6rem', fontSize: '0.78rem', borderRadius: '6px',
              border: '1px solid var(--border)', background: 'var(--bg-input)',
              color: 'var(--text-primary)', width: '200px',
            }}
          />
          <button
            onClick={openConfig}
            style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: '6px',
              color: 'var(--text-primary)', cursor: 'pointer', padding: '0.3rem 0.6rem',
              fontSize: '0.78rem', fontWeight: 600,
            }}
          >
            &#9881; Configurar
          </button>
        </div>
      </Header>

      {/* Kanban Board */}
      <div style={{
        flex: 1, display: 'flex', gap: '0.8rem', padding: '1rem',
        overflowX: 'auto', alignItems: 'flex-start',
      }}>
        {stages.map(stage => {
          const stageCards = filteredCards.filter(c => c.stage_id === stage.id)
          const isDragOver = dragOverStage === stage.id

          return (
            <div
              key={stage.id}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
              style={{
                minWidth: '280px', width: '280px', flexShrink: 0,
                background: isDragOver ? 'var(--bg-surface)' : 'var(--bg-primary)',
                border: `2px ${isDragOver ? 'dashed' : 'solid'} ${isDragOver ? stage.color : 'var(--border)'}`,
                borderRadius: '10px', display: 'flex', flexDirection: 'column',
                maxHeight: 'calc(100vh - 100px)', transition: 'all 0.15s',
              }}
            >
              {/* Stage header */}
              <div style={{
                padding: '0.7rem 0.8rem', borderBottom: `3px solid ${stage.color}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: stage.color }} />
                  <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                    {stage.name}
                  </span>
                </div>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 600, padding: '0.1rem 0.4rem',
                  borderRadius: '10px', backgroundColor: `${stage.color}20`, color: stage.color,
                }}>
                  {stageCards.length}
                </span>
              </div>

              {/* Cards */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                {stageCards.map(card => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, card)}
                    onClick={() => openCard(card)}
                    style={{
                      background: 'var(--bg-surface)', border: '1px solid var(--border)',
                      borderRadius: '8px', padding: '0.6rem 0.7rem', marginBottom: '0.4rem',
                      cursor: 'grab', transition: 'all 0.15s',
                      opacity: dragCard?.id === card.id ? 0.4 : 1,
                      borderLeft: `3px solid ${stage.color}`,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = stage.color }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.borderLeftColor = stage.color }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                      {card.contact_name || card.msisdn}
                    </div>
                    {card.contact_name && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {card.msisdn}
                      </div>
                    )}
                    {card.assigned_to && (
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                        {card.assigned_to}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add card */}
              {showAddCard === stage.id ? (
                <div style={{ padding: '0.5rem', borderTop: '1px solid var(--border)' }}>
                  <input
                    type="text" value={newCardName} onChange={e => setNewCardName(e.target.value)}
                    placeholder="Nome do contato"
                    style={{ width: '100%', padding: '0.35rem', fontSize: '0.78rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', marginBottom: '0.3rem', boxSizing: 'border-box' }}
                  />
                  <input
                    type="text" value={newCardMsisdn} onChange={e => setNewCardMsisdn(e.target.value)}
                    placeholder="Telefone (ex: 5511999999999)"
                    style={{ width: '100%', padding: '0.35rem', fontSize: '0.78rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', marginBottom: '0.3rem', boxSizing: 'border-box' }}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <button onClick={() => addCard(stage.id)}
                      style={{ flex: 1, padding: '0.3rem', fontSize: '0.75rem', fontWeight: 600, background: stage.color, color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      Adicionar
                    </button>
                    <button onClick={() => { setShowAddCard(null); setNewCardMsisdn(''); setNewCardName('') }}
                      style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', background: 'none', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}>
                      X
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddCard(stage.id)}
                  style={{
                    padding: '0.5rem', fontSize: '0.78rem', background: 'none',
                    color: 'var(--text-muted)', border: 'none', borderTop: '1px solid var(--border)',
                    cursor: 'pointer', fontWeight: 500,
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = stage.color}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  + Adicionar contato
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Card Detail Modal */}
      {selectedCard && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
        }} onClick={() => setSelectedCard(null)}>
          <div style={{
            background: 'var(--bg-surface)', borderRadius: '12px', padding: '1.5rem',
            width: '90%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto',
            border: '1px solid var(--border)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {selectedCard.contact_name || selectedCard.msisdn}
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                  {selectedCard.msisdn}
                </p>
              </div>
              <button onClick={() => setSelectedCard(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>
                ✕
              </button>
            </div>

            {/* Stage atual e mover */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.3rem' }}>
                Etapa
              </label>
              <select
                value={selectedCard.stage_id}
                onChange={async (e) => {
                  await moveCard(selectedCard.id, e.target.value)
                  const updated = { ...selectedCard, stage_id: e.target.value }
                  setSelectedCard(updated)
                  loadHistory(selectedCard.id)
                }}
                style={{
                  width: '100%', padding: '0.4rem', borderRadius: '6px',
                  border: '1px solid var(--border)', background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                }}
              >
                {stages.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Historico */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>
                Historico
              </label>
              {cardHistory.length === 0 ? (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Sem movimentacoes</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {cardHistory.map(h => (
                    <div key={h.id} style={{
                      padding: '0.5rem', borderRadius: '6px', fontSize: '0.75rem',
                      background: 'var(--bg-input)', border: '1px solid var(--border)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-primary)' }}>
                          {h.from_stage_id ? `${getStageName(h.from_stage_id)} → ` : ''}
                          <strong>{getStageName(h.to_stage_id)}</strong>
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>
                          {new Date(h.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.15rem' }}>
                        por {h.moved_by} ({h.moved_by_type})
                      </div>
                      {h.note && (
                        <div style={{ color: 'var(--text-primary)', marginTop: '0.2rem', fontStyle: 'italic' }}>
                          {h.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Delete */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <button onClick={() => deleteCard(selectedCard.id)}
                style={{
                  padding: '0.4rem 0.8rem', fontSize: '0.78rem', fontWeight: 600,
                  background: 'none', color: '#ef4444', border: '1px solid #ef444440',
                  borderRadius: '6px', cursor: 'pointer',
                }}
              >
                Remover do funil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Config Modal */}
      {showConfig && funnel && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
        }} onClick={() => setShowConfig(false)}>
          <div style={{
            background: 'var(--bg-surface)', borderRadius: '12px', padding: '1.5rem',
            width: '90%', maxWidth: '650px', maxHeight: '85vh', overflowY: 'auto',
            border: '1px solid var(--border)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Configurar Funil
              </h2>
              <button onClick={() => setShowConfig(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>
                ✕
              </button>
            </div>

            {/* Etapas */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>
                Etapas
              </label>
              {editStages.map((s, i) => (
                <div key={s.id || i} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.3rem', alignItems: 'center' }}>
                  <input type="color" value={s.color} onChange={e => {
                    const u = [...editStages]; u[i] = { ...u[i], color: e.target.value }; setEditStages(u)
                  }} style={{ width: '32px', height: '32px', border: 'none', cursor: 'pointer', borderRadius: '4px' }} />
                  <input type="text" value={s.name} onChange={e => {
                    const u = [...editStages]; u[i] = { ...u[i], name: e.target.value }; setEditStages(u)
                  }} style={{ flex: 1, padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }} />
                  <button onClick={() => setEditStages(editStages.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button onClick={() => setEditStages([...editStages, { id: crypto.randomUUID(), name: '', color: '#64748b', position: editStages.length }])}
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: 'none', color: '#6366f1', border: '1px dashed #6366f160', borderRadius: '6px', cursor: 'pointer' }}>
                  + Etapa
                </button>
                <button onClick={saveStages}
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 600, background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  Salvar etapas
                </button>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1rem 0' }} />

            {/* Automacoes por etapa */}
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>
              Automacoes por etapa
            </label>
            <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block', marginBottom: '0.8rem' }}>
              Acoes executadas automaticamente quando um card entra em uma etapa.
            </small>

            {(funnel.stages || []).map(stage => {
              const stageAutos = automations.filter(a => a.stage_id === stage.id)

              return (
                <div key={stage.id} style={{
                  marginBottom: '0.8rem', border: '1px solid var(--border)', borderRadius: '8px',
                  borderLeft: `3px solid ${stage.color}`,
                }}>
                  <div style={{
                    padding: '0.5rem 0.7rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'var(--bg-input)', borderRadius: '5px 5px 0 0',
                  }}>
                    <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                      {stage.name}
                    </span>
                    <select
                      onChange={(e) => { if (e.target.value) { addAutomation(stage.id, e.target.value); e.target.value = '' } }}
                      value=""
                      style={{ padding: '0.2rem 0.4rem', fontSize: '0.72rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', cursor: 'pointer' }}
                    >
                      <option value="">+ Adicionar acao</option>
                      <option value="send_message">Enviar mensagem</option>
                      <option value="transfer_department">Transferir departamento</option>
                      <option value="set_tag">Atribuir tag</option>
                      <option value="set_ticket_status">Alterar status ticket</option>
                      <option value="set_ticket_owner">Alterar dono ticket</option>
                    </select>
                  </div>

                  {stageAutos.length > 0 && (
                    <div style={{ padding: '0.5rem' }}>
                      {stageAutos.map(auto => (
                        <div key={auto.id} style={{
                          padding: '0.5rem', marginBottom: '0.3rem', borderRadius: '6px',
                          background: 'var(--bg-primary)', border: '1px solid var(--border)',
                          fontSize: '0.78rem',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {{ send_message: 'Enviar mensagem', transfer_department: 'Transferir dept.', set_tag: 'Atribuir tag', set_ticket_status: 'Alterar status', set_ticket_owner: 'Alterar dono' }[auto.action_type] || auto.action_type}
                            </span>
                            <button onClick={() => deleteAutomation(auto.id)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
                          </div>

                          {auto.action_type === 'send_message' && (
                            <textarea
                              value={auto.action_config?.message || ''}
                              onChange={(e) => updateAutomation(auto.id, { action_config: { ...auto.action_config, message: e.target.value } })}
                              placeholder="Mensagem a enviar..."
                              rows={2}
                              style={{ width: '100%', padding: '0.3rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                            />
                          )}

                          {auto.action_type === 'transfer_department' && (
                            <input
                              type="number"
                              value={auto.action_config?.department_id || ''}
                              onChange={(e) => updateAutomation(auto.id, { action_config: { ...auto.action_config, department_id: parseInt(e.target.value) || null } })}
                              placeholder="ID do departamento"
                              style={{ width: '100%', padding: '0.3rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                            />
                          )}

                          {auto.action_type === 'set_tag' && (
                            <input
                              type="number"
                              value={auto.action_config?.tag_id || ''}
                              onChange={(e) => updateAutomation(auto.id, { action_config: { ...auto.action_config, tag_id: parseInt(e.target.value) || null } })}
                              placeholder="ID da tag"
                              style={{ width: '100%', padding: '0.3rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                            />
                          )}

                          {auto.action_type === 'set_ticket_status' && (
                            <input
                              type="number"
                              value={auto.action_config?.status_id || ''}
                              onChange={(e) => updateAutomation(auto.id, { action_config: { ...auto.action_config, status_id: parseInt(e.target.value) || null } })}
                              placeholder="ID do status"
                              style={{ width: '100%', padding: '0.3rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                            />
                          )}

                          {auto.action_type === 'set_ticket_owner' && (
                            <input
                              type="number"
                              value={auto.action_config?.user_id || ''}
                              onChange={(e) => updateAutomation(auto.id, { action_config: { ...auto.action_config, user_id: parseInt(e.target.value) || null } })}
                              placeholder="ID do usuario"
                              style={{ width: '100%', padding: '0.3rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {stageAutos.length === 0 && (
                    <div style={{ padding: '0.5rem 0.7rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Nenhuma automacao configurada
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default FunnelBoard
