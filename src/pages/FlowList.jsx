import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../config/axios'
import Header from '../components/Header'

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#0f172a',
  },
  container: {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#f1f5f9',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#64748b',
    marginTop: '0.25rem',
  },
  newButton: {
    padding: '0.65rem 1.25rem',
    background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.25s',
    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1.25rem',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid #334155',
    transition: 'all 0.25s ease',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
  },
  cardActive: {
    borderColor: '#22c55e',
    boxShadow: '0 0 0 1px #22c55e, 0 4px 20px rgba(34, 197, 94, 0.1)',
  },
  cardSelected: {
    borderColor: '#6366f1',
    boxShadow: '0 0 0 1px #6366f1, 0 4px 20px rgba(99, 102, 241, 0.15)',
  },
  cardName: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: '0.4rem',
  },
  cardDesc: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    marginBottom: '1rem',
    lineHeight: 1.5,
  },
  cardMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.78rem',
    color: '#64748b',
    marginBottom: '1rem',
    paddingTop: '0.75rem',
    borderTop: '1px solid #334155',
  },
  statusActive: {
    color: '#22c55e',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
  },
  statusInactive: {
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
  },
  cardActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  btnEdit: {
    padding: '0.4rem 0.75rem',
    background: 'linear-gradient(135deg, #6366f1, #818cf8)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  btnToggle: {
    padding: '0.4rem 0.75rem',
    backgroundColor: 'transparent',
    border: '1px solid #334155',
    color: '#94a3b8',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  btnDelete: {
    padding: '0.4rem 0.75rem',
    backgroundColor: 'transparent',
    border: '1px solid #334155',
    color: '#64748b',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  empty: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '4rem 2rem',
    color: '#64748b',
  },
  emptyTitle: {
    fontSize: '1.1rem',
    color: '#94a3b8',
    marginBottom: '0.5rem',
    fontWeight: '600',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '6rem 0',
  },
  spinner: {
    width: '36px',
    height: '36px',
    border: '3px solid #334155',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
}

function FlowList() {
  const [flows, setFlows] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFlowId, setSelectedFlowId] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadFlows()
  }, [])

  const loadFlows = async () => {
    try {
      const response = await api.get('/api/v1/flows')
      setFlows(response.data.data)
      setLoading(false)
    } catch (error) {
      console.error('Error loading flows:', error)
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este fluxo?')) return

    try {
      await api.delete(`/api/v1/flows/${id}`)
      loadFlows()
    } catch (error) {
      console.error('Error deleting flow:', error)
      alert('Erro ao excluir fluxo')
    }
  }

  const handleToggleActive = async (id, currentState) => {
    try {
      await api.put(`/api/v1/flows/${id}`, { is_active: !currentState })
      loadFlows()
    } catch (error) {
      console.error('Error toggling flow:', error)
      alert('Erro ao ativar/desativar fluxo')
    }
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <Header />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <Header />
      <div style={styles.container}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.title}>Fluxos de Conversação</h1>
            <p style={styles.subtitle}>{flows.length} fluxo{flows.length !== 1 ? 's' : ''} criado{flows.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            style={styles.newButton}
            onClick={() => navigate('/flow/new')}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)'
              e.target.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 4px 14px rgba(99, 102, 241, 0.35)'
            }}
          >
            + Novo Fluxo
          </button>
        </div>

        <div style={styles.grid}>
          {flows.map((flow) => (
            <div
              key={flow.id}
              style={{
                ...styles.card,
                ...(flow.is_active ? styles.cardActive : {}),
                ...(selectedFlowId === flow.id ? styles.cardSelected : {}),
              }}
              onClick={() => setSelectedFlowId(flow.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)'
                e.currentTarget.style.boxShadow = selectedFlowId === flow.id
                  ? '0 0 0 1px #6366f1, 0 8px 30px rgba(99, 102, 241, 0.2)'
                  : '0 8px 30px rgba(0,0,0,0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                if (flow.is_active) {
                  e.currentTarget.style.boxShadow = '0 0 0 1px #22c55e, 0 4px 20px rgba(34, 197, 94, 0.1)'
                } else if (selectedFlowId === flow.id) {
                  e.currentTarget.style.boxShadow = '0 0 0 1px #6366f1, 0 4px 20px rgba(99, 102, 241, 0.15)'
                } else {
                  e.currentTarget.style.boxShadow = 'none'
                }
              }}
            >
              <h3 style={styles.cardName}>{flow.name}</h3>
              <p style={styles.cardDesc}>{flow.description || 'Sem descrição'}</p>

              <div style={styles.cardMeta}>
                <span style={flow.is_active ? styles.statusActive : styles.statusInactive}>
                  {flow.is_active ? '● Ativo' : '○ Inativo'}
                </span>
                <span>
                  Criado em {new Date(flow.created_at).toLocaleDateString()}
                </span>
              </div>

              <div style={styles.cardActions}>
                <button
                  style={styles.btnEdit}
                  onClick={(e) => { e.stopPropagation(); navigate(`/flow/${flow.id}`) }}
                >
                  Editar
                </button>
                <button
                  style={styles.btnToggle}
                  onClick={(e) => { e.stopPropagation(); handleToggleActive(flow.id, flow.is_active) }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = flow.is_active ? '#f59e0b' : '#22c55e'
                    e.target.style.color = flow.is_active ? '#f59e0b' : '#22c55e'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#334155'
                    e.target.style.color = '#94a3b8'
                  }}
                >
                  {flow.is_active ? 'Desativar' : 'Ativar'}
                </button>
                <button
                  style={{
                    ...styles.btnDelete,
                    ...(flow.is_active ? { opacity: 0.3, cursor: 'not-allowed' } : {}),
                  }}
                  onClick={(e) => { e.stopPropagation(); handleDelete(flow.id) }}
                  disabled={flow.is_active}
                  onMouseEnter={(e) => {
                    if (!flow.is_active) {
                      e.target.style.borderColor = '#dc2626'
                      e.target.style.color = '#dc2626'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#334155'
                    e.target.style.color = '#64748b'
                  }}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}

          {flows.length === 0 && (
            <div style={styles.empty}>
              <p style={styles.emptyTitle}>Nenhum fluxo criado ainda</p>
              <p style={{ marginBottom: '1.5rem' }}>Comece criando seu primeiro fluxo de conversação</p>
              <button
                style={styles.newButton}
                onClick={() => navigate('/flow/new')}
              >
                + Criar Primeiro Fluxo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FlowList
