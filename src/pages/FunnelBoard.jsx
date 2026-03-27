import { useState, useEffect, useRef, useCallback } from 'react'
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
  const [mcTags, setMcTags] = useState([])
  const [mcDepartments, setMcDepartments] = useState([])
  const [mcStatuses, setMcStatuses] = useState([])
  const [mcUsers, setMcUsers] = useState([])
  const [waAccounts, setWaAccounts] = useState([])
  const [waTemplates, setWaTemplates] = useState({})

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
    loadMonitchatData()
    setShowConfig(true)
  }

  const loadMonitchatData = async () => {
    const token = localStorage.getItem('token')
    const headers = { Authorization: `Bearer ${token}` }
    try {
      const [tagsRes, deptRes, statusRes, usersRes, waRes] = await Promise.allSettled([
        fetch('https://alb.monitchat.com/api/v1/tag?take=2000', { headers }).then(r => r.json()),
        fetch('https://api-v2.monitchat.com/api/v1/department?take=500', { headers }).then(r => r.json()),
        fetch('https://api-v2.monitchat.com/api/v1/ticket-status', { headers }).then(r => r.json()),
        fetch('https://api-v2.monitchat.com/api/v1/user?take=500', { headers }).then(r => r.json()),
        fetch('https://api-v2.monitchat.com/api/v1/social/whatsapp', { headers }).then(r => r.json()),
      ])
      if (tagsRes.status === 'fulfilled') setMcTags(tagsRes.value?.payload?.data || tagsRes.value?.data || [])
      if (deptRes.status === 'fulfilled') setMcDepartments(deptRes.value?.data || [])
      if (statusRes.status === 'fulfilled') setMcStatuses(statusRes.value?.data || statusRes.value?.payload?.data || [])
      if (usersRes.status === 'fulfilled') setMcUsers(usersRes.value?.data || [])
      if (waRes.status === 'fulfilled') {
        const accounts = (waRes.value?.data || []).filter(a => a.whatsapp_account_key)
        setWaAccounts(accounts)
      }
    } catch (err) {
      console.error('Error loading MonitChat data:', err)
    }
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

  const debounceTimers = useRef({})

  const updateAutomation = (autoId, updates) => {
    // Atualiza estado local imediatamente
    setAutomations(prev => prev.map(a =>
      a.id === autoId ? { ...a, ...updates, action_config: updates.action_config || a.action_config } : a
    ))

    // Debounce da chamada API (800ms)
    if (debounceTimers.current[autoId]) clearTimeout(debounceTimers.current[autoId])
    debounceTimers.current[autoId] = setTimeout(async () => {
      try {
        await api.put(`/api/v1/funnels/${id}/automations/${autoId}`, updates)
      } catch (err) {
        console.error(err)
      }
    }, 800)
  }

  const deleteAutomation = async (autoId) => {
    try {
      await api.delete(`/api/v1/funnels/${id}/automations/${autoId}`)
      loadAutomations()
    } catch (err) {
      console.error(err)
    }
  }

  const loadTemplatesForAccount = async (accountId) => {
    if (waTemplates[accountId]) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(
        `https://api-v2.monitchat.com/api/v1/social/${accountId}/templates`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await res.json()
      const approved = (data.templates || [])
        .filter(t => t.status?.toUpperCase() === 'APPROVED')
        .sort((a, b) => a.name.localeCompare(b.name))
      setWaTemplates(prev => ({ ...prev, [accountId]: approved }))
    } catch (err) {
      console.error('Error loading templates:', err)
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
      <Header />

      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-surface)', flexWrap: 'wrap',
      }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, marginRight: 'auto' }}>
          {funnel.name}
        </h2>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar contato..."
          style={{
            padding: '0.3rem 0.6rem', fontSize: '0.78rem', borderRadius: '6px',
            border: '1px solid var(--border)', background: 'var(--bg-input)',
            color: 'var(--text-primary)', width: '180px',
          }}
        />
        <button
          onClick={openConfig}
          style={{
            padding: '0.3rem 0.7rem', fontSize: '0.78rem', fontWeight: 600,
            background: 'none', border: '1px solid var(--border)', borderRadius: '6px',
            color: 'var(--text-primary)', cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: '0.3rem',
          }}
        >
          &#9881; Configurar
        </button>
      </div>

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
            background: 'var(--bg-surface)', borderRadius: '12px',
            width: '90%', maxWidth: '650px', maxHeight: '85vh',
            border: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column',
          }} onClick={e => e.stopPropagation()}>
            {/* Header fixo */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', flexShrink: 0,
            }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Configurar Funil
              </h2>
              <button onClick={() => setShowConfig(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>
                ✕
              </button>
            </div>

            {/* Body scrollavel */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>

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
              <button onClick={() => setEditStages([...editStages, { id: crypto.randomUUID(), name: '', color: '#64748b', position: editStages.length }])}
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: 'none', color: '#6366f1', border: '1px dashed #6366f160', borderRadius: '6px', cursor: 'pointer', marginTop: '0.5rem' }}>
                + Etapa
              </button>
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
                      <option value="send_template">Enviar template WhatsApp</option>
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
                              {{ send_message: 'Enviar mensagem', send_template: 'Template WhatsApp', transfer_department: 'Transferir dept.', set_tag: 'Atribuir tag', set_ticket_status: 'Alterar status', set_ticket_owner: 'Alterar dono' }[auto.action_type] || auto.action_type}
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

                          {auto.action_type === 'send_template' && (() => {
                            const cfg = auto.action_config || {}
                            const accId = cfg.account_id
                            const tpls = waTemplates[accId] || []
                            const selectedTpl = accId && cfg.template_name
                              ? tpls.find(t => t.name === cfg.template_name && t.language === cfg.template_language)
                              : null
                            const extractVars = (text) => {
                              if (!text) return []
                              const matches = text.match(/\{\{(\w+)\}\}/g)
                              if (!matches) return []
                              return [...new Set(matches)].map(m => ({ placeholder: m, index: m.replace(/[{}]/g, '') }))
                            }
                            const headerComp = selectedTpl?.components?.find(c => c.type === 'HEADER')
                            const bodyComp = selectedTpl?.components?.find(c => c.type === 'BODY')
                            const headerVars = headerComp?.format === 'TEXT' ? extractVars(headerComp.text) : []
                            const bodyVars = bodyComp ? extractVars(bodyComp.text) : []

                            const updateCfg = (updates) => {
                              updateAutomation(auto.id, { action_config: { ...cfg, ...updates } })
                            }

                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                {/* Conta WhatsApp */}
                                <select
                                  value={accId || ''}
                                  onChange={(e) => {
                                    const id = e.target.value
                                    const acc = waAccounts.find(a => String(a.id) === id)
                                    updateCfg({
                                      account_id: id ? parseInt(id) : null,
                                      account_number: acc?.phone_number || '',
                                      template_name: null, template_language: null,
                                      template: null, header_params: {}, body_params: {},
                                    })
                                    if (id) loadTemplatesForAccount(id)
                                  }}
                                  style={{ width: '100%', padding: '0.3rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                >
                                  <option value="">Selecione a conta WhatsApp</option>
                                  {waAccounts.map(a => (
                                    <option key={a.id} value={a.id}>{a.phone_number} - {a.company || 'Sem nome'}</option>
                                  ))}
                                </select>

                                {/* Template */}
                                {accId && (
                                  <select
                                    value={cfg.template_name && cfg.template_language ? `${cfg.template_name}|${cfg.template_language}` : ''}
                                    onChange={(e) => {
                                      if (!e.target.value) {
                                        updateCfg({ template_name: null, template_language: null, template: null, header_params: {}, body_params: {} })
                                        return
                                      }
                                      const [name, lang] = e.target.value.split('|')
                                      const tpl = tpls.find(t => t.name === name && t.language === lang)
                                      updateCfg({
                                        template_name: name, template_language: lang,
                                        template_category: tpl?.category || 'UTILITY',
                                        header_params: {}, body_params: {},
                                      })
                                    }}
                                    onFocus={() => loadTemplatesForAccount(accId)}
                                    style={{ width: '100%', padding: '0.3rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                  >
                                    <option value="">Selecione o template</option>
                                    {tpls.map(t => (
                                      <option key={`${t.name}-${t.language}`} value={`${t.name}|${t.language}`}>
                                        {t.name} ({t.language})
                                      </option>
                                    ))}
                                  </select>
                                )}

                                {/* Preview */}
                                {selectedTpl && (
                                  <div style={{ padding: '0.4rem', fontSize: '0.7rem', background: 'var(--bg-primary)', borderRadius: '4px', border: '1px solid var(--border)' }}>
                                    {headerComp && <div style={{ fontWeight: 600, marginBottom: '0.2rem', color: 'var(--text-primary)' }}>{headerComp.format === 'TEXT' ? headerComp.text : `[${headerComp.format}]`}</div>}
                                    {bodyComp && <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-muted)', lineHeight: 1.4 }}>{bodyComp.text}</div>}
                                  </div>
                                )}

                                {/* Parametros do Header */}
                                {headerVars.length > 0 && (
                                  <div>
                                    <small style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.7rem' }}>Parametros do Header</small>
                                    {headerVars.map(v => (
                                      <input
                                        key={`h-${v.index}`}
                                        type="text"
                                        value={(cfg.header_params || {})[v.index] || ''}
                                        onChange={(e) => updateCfg({ header_params: { ...(cfg.header_params || {}), [v.index]: e.target.value } })}
                                        placeholder={`Valor para {{${v.index}}}`}
                                        style={{ width: '100%', padding: '0.25rem', fontSize: '0.72rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', marginTop: '0.2rem', boxSizing: 'border-box' }}
                                      />
                                    ))}
                                  </div>
                                )}

                                {/* Header de midia */}
                                {headerComp && headerComp.format !== 'TEXT' && (
                                  <div>
                                    <small style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.7rem' }}>URL da midia ({headerComp.format})</small>
                                    <input
                                      type="text"
                                      value={cfg.header_media_url || ''}
                                      onChange={(e) => updateCfg({ header_media_url: e.target.value })}
                                      placeholder="https://..."
                                      style={{ width: '100%', padding: '0.25rem', fontSize: '0.72rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', marginTop: '0.2rem', boxSizing: 'border-box' }}
                                    />
                                  </div>
                                )}

                                {/* Parametros do Body */}
                                {bodyVars.length > 0 && (
                                  <div>
                                    <small style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.7rem' }}>Parametros do Body</small>
                                    {bodyVars.map(v => (
                                      <input
                                        key={`b-${v.index}`}
                                        type="text"
                                        value={(cfg.body_params || {})[v.index] || ''}
                                        onChange={(e) => updateCfg({ body_params: { ...(cfg.body_params || {}), [v.index]: e.target.value } })}
                                        placeholder={`Valor para {{${v.index}}}`}
                                        style={{ width: '100%', padding: '0.25rem', fontSize: '0.72rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', marginTop: '0.2rem', boxSizing: 'border-box' }}
                                      />
                                    ))}
                                    <small style={{ color: 'var(--text-muted)', fontSize: '0.65rem', display: 'block', marginTop: '0.2rem' }}>
                                      Use ${'{{campo}}'} para variaveis do contexto
                                    </small>
                                  </div>
                                )}
                              </div>
                            )
                          })()}

                          {auto.action_type === 'transfer_department' && (
                            mcDepartments.length > 0 ? (
                              <select
                                value={auto.action_config?.department_id || ''}
                                onChange={(e) => updateAutomation(auto.id, { action_config: { ...auto.action_config, department_id: e.target.value ? parseInt(e.target.value) : null } })}
                                style={{ width: '100%', padding: '0.3rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                              >
                                <option value="">Selecione um departamento</option>
                                {mcDepartments.map(d => (
                                  <option key={d.id} value={d.id}>{d.name} (ID: {d.id})</option>
                                ))}
                              </select>
                            ) : (
                              <input type="number" value={auto.action_config?.department_id || ''}
                                onChange={(e) => updateAutomation(auto.id, { action_config: { ...auto.action_config, department_id: parseInt(e.target.value) || null } })}
                                placeholder="ID do departamento"
                                style={{ width: '100%', padding: '0.3rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                              />
                            )
                          )}

                          {auto.action_type === 'set_tag' && (
                            mcTags.length > 0 ? (
                              <select
                                value={auto.action_config?.tag_id || ''}
                                onChange={(e) => updateAutomation(auto.id, { action_config: { ...auto.action_config, tag_id: e.target.value ? parseInt(e.target.value) : null } })}
                                style={{ width: '100%', padding: '0.3rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                              >
                                <option value="">Selecione uma tag</option>
                                {mcTags.map(t => (
                                  <option key={t.id} value={t.id}>{t.tag || t.name} (ID: {t.id})</option>
                                ))}
                              </select>
                            ) : (
                              <input type="number" value={auto.action_config?.tag_id || ''}
                                onChange={(e) => updateAutomation(auto.id, { action_config: { ...auto.action_config, tag_id: parseInt(e.target.value) || null } })}
                                placeholder="ID da tag"
                                style={{ width: '100%', padding: '0.3rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                              />
                            )
                          )}

                          {auto.action_type === 'set_ticket_status' && (
                            mcStatuses.length > 0 ? (
                              <select
                                value={auto.action_config?.status_id || ''}
                                onChange={(e) => updateAutomation(auto.id, { action_config: { ...auto.action_config, status_id: e.target.value ? parseInt(e.target.value) : null } })}
                                style={{ width: '100%', padding: '0.3rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                              >
                                <option value="">Selecione um status</option>
                                {mcStatuses.map(s => (
                                  <option key={s.id} value={s.id}>{s.description || s.name} ({s.progress_percentage || 0}%)</option>
                                ))}
                              </select>
                            ) : (
                              <input type="number" value={auto.action_config?.status_id || ''}
                                onChange={(e) => updateAutomation(auto.id, { action_config: { ...auto.action_config, status_id: parseInt(e.target.value) || null } })}
                                placeholder="ID do status"
                                style={{ width: '100%', padding: '0.3rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                              />
                            )
                          )}

                          {auto.action_type === 'set_ticket_owner' && (
                            mcUsers.length > 0 ? (
                              <select
                                value={auto.action_config?.user_id || ''}
                                onChange={(e) => updateAutomation(auto.id, { action_config: { ...auto.action_config, user_id: e.target.value ? parseInt(e.target.value) : null } })}
                                style={{ width: '100%', padding: '0.3rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                              >
                                <option value="">Selecione um usuario</option>
                                {mcUsers.map(u => (
                                  <option key={u.id} value={u.id}>{u.name} ({u.email || `ID: ${u.id}`})</option>
                                ))}
                              </select>
                            ) : (
                              <input type="number" value={auto.action_config?.user_id || ''}
                                onChange={(e) => updateAutomation(auto.id, { action_config: { ...auto.action_config, user_id: parseInt(e.target.value) || null } })}
                                placeholder="ID do usuario"
                                style={{ width: '100%', padding: '0.3rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                              />
                            )
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

            {/* Footer fixo */}
            <div style={{
              padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', flexShrink: 0,
              display: 'flex', justifyContent: 'flex-end', gap: '0.5rem',
              background: 'var(--bg-surface)', borderRadius: '0 0 12px 12px',
            }}>
              <button onClick={() => setShowConfig(false)}
                style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', background: 'none', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}>
                Fechar
              </button>
              <button onClick={async () => { await saveStages(); setShowConfig(false) }}
                style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 600, background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FunnelBoard
