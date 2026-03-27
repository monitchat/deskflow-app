import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import Header from '../components/Header'
import api from '../config/axios'

function Funnels() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const [funnels, setFunnels] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newStages, setNewStages] = useState([
    { name: 'Novo Lead', color: '#3b82f6' },
    { name: 'Qualificado', color: '#f59e0b' },
    { name: 'Proposta', color: '#8b5cf6' },
    { name: 'Fechado', color: '#22c55e' },
  ])

  useEffect(() => { loadFunnels() }, [])

  const loadFunnels = async () => {
    try {
      const res = await api.get('/api/v1/funnels')
      if (res.data.success) setFunnels(res.data.data || [])
    } catch (err) {
      console.error('Error loading funnels:', err)
    } finally {
      setLoading(false)
    }
  }

  const createFunnel = async () => {
    if (!newName.trim()) return
    try {
      const res = await api.post('/api/v1/funnels', {
        name: newName,
        description: newDesc,
        stages: newStages.filter(s => s.name.trim()),
      })
      if (res.data.success) {
        setShowCreate(false)
        setNewName('')
        setNewDesc('')
        loadFunnels()
      }
    } catch (err) {
      console.error('Error creating funnel:', err)
    }
  }

  const deleteFunnel = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este funil?')) return
    try {
      await api.delete(`/api/v1/funnels/${id}`)
      loadFunnels()
    } catch (err) {
      console.error('Error deleting funnel:', err)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: '6px',
              color: 'var(--text-primary)', cursor: 'pointer', padding: '0.3rem 0.6rem',
              fontSize: '0.78rem', fontWeight: 600,
            }}
          >
            Fluxos
          </button>
          <span style={{
            fontSize: '1rem', fontWeight: 700,
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Funis CRM
          </span>
        </div>
      </Header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Funis
          </h1>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600,
              background: 'linear-gradient(135deg, #6366f1, #818cf8)', color: '#fff',
              border: 'none', borderRadius: '8px', cursor: 'pointer',
            }}
          >
            + Novo Funil
          </button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>
        ) : funnels.length === 0 ? (
          <div style={{
            padding: '3rem', textAlign: 'center', color: 'var(--text-muted)',
            border: '2px dashed var(--border)', borderRadius: '12px',
          }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Nenhum funil criado</p>
            <p style={{ fontSize: '0.85rem' }}>Crie seu primeiro funil para gerenciar leads e contatos.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {funnels.map(f => (
              <div
                key={f.id}
                style={{
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  borderRadius: '12px', padding: '1.2rem', cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => navigate(`/funnels/${f.id}`)}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.3rem' }}>
                      {f.name}
                    </h3>
                    {f.description && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.8rem' }}>
                        {f.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteFunnel(f.id) }}
                    style={{
                      background: 'none', border: 'none', color: 'var(--text-muted)',
                      cursor: 'pointer', fontSize: '1rem', padding: '0.2rem',
                    }}
                    title="Excluir funil"
                  >
                    🗑
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                  {(f.stages || []).map((s, i) => (
                    <span key={i} style={{
                      padding: '0.15rem 0.5rem', fontSize: '0.68rem', fontWeight: 600,
                      borderRadius: '4px', backgroundColor: `${s.color}20`, color: s.color,
                    }}>
                      {s.name}
                    </span>
                  ))}
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {f.card_count || 0} contato{(f.card_count || 0) !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal criar funil */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
        }} onClick={() => setShowCreate(false)}>
          <div style={{
            background: 'var(--bg-surface)', borderRadius: '12px', padding: '1.5rem',
            width: '90%', maxWidth: '500px', border: '1px solid var(--border)',
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 1rem' }}>
              Novo Funil
            </h2>

            <div style={{ marginBottom: '0.8rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem', color: 'var(--text-primary)' }}>Nome</label>
              <input
                type="text" value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Ex: Funil de Vendas"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '0.8rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem', color: 'var(--text-primary)' }}>Etapas</label>
              {newStages.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.3rem', alignItems: 'center' }}>
                  <input
                    type="color" value={s.color} onChange={e => {
                      const u = [...newStages]; u[i] = { ...u[i], color: e.target.value }; setNewStages(u)
                    }}
                    style={{ width: '32px', height: '32px', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                  />
                  <input
                    type="text" value={s.name} onChange={e => {
                      const u = [...newStages]; u[i] = { ...u[i], name: e.target.value }; setNewStages(u)
                    }}
                    placeholder={`Etapa ${i + 1}`}
                    style={{ flex: 1, padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  />
                  <button onClick={() => setNewStages(newStages.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
                </div>
              ))}
              <button onClick={() => setNewStages([...newStages, { name: '', color: '#64748b' }])}
                style={{
                  padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: 'none',
                  color: '#6366f1', border: '1px dashed #6366f160', borderRadius: '6px',
                  cursor: 'pointer', marginTop: '0.3rem',
                }}>+ Etapa</button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button onClick={() => setShowCreate(false)}
                style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', background: 'none', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={createFunnel}
                style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 600, background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Criar Funil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Funnels
