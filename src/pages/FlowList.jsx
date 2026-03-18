import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../config/axios'
import Header from '../components/Header'
import AccountsPanel from '../components/AccountsPanel'

const styles = {
  page: {
    flex: 1,
    overflow: 'auto',
    backgroundColor: 'var(--bg-page)',
    transition: 'background-color 0.3s',
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
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-dim)',
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
    backgroundColor: 'var(--bg-surface)',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid var(--border)',
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
    color: 'var(--text-primary)',
    marginBottom: '0.4rem',
  },
  cardDesc: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginBottom: '1rem',
    lineHeight: 1.5,
  },
  cardMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.78rem',
    color: 'var(--text-dim)',
    marginBottom: '1rem',
    paddingTop: '0.75rem',
    borderTop: '1px solid var(--border)',
  },
  statusActive: {
    color: '#22c55e',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
  },
  statusInactive: {
    color: 'var(--text-dim)',
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
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  btnDelete: {
    padding: '0.4rem 0.75rem',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text-dim)',
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
    color: 'var(--text-dim)',
  },
  emptyTitle: {
    fontSize: '1.1rem',
    color: 'var(--text-muted)',
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
    border: '3px solid var(--border)',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
}

function FlowList() {
  const [flows, setFlows] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFlowId, setSelectedFlowId] = useState(null)
  const [accountsFlowId, setAccountsFlowId] = useState(null)
  const [filterCompanyId, setFilterCompanyId] = useState('')
  const isMaster = localStorage.getItem('user_is_master') === 'true'
  const isAdmin = localStorage.getItem('user_is_admin') === 'true'
  const navigate = useNavigate()

  useEffect(() => {
    loadFlows()
  }, [filterCompanyId])

  const loadFlows = async () => {
    try {
      setLoading(true)
      const params = isMaster && filterCompanyId ? `?company_id=${filterCompanyId}` : ''
      const response = await api.get(`/api/v1/flows${params}`)
      setFlows(response.data.data)
      setLoading(false)
    } catch (error) {
      console.error('Error loading flows:', error)
      setLoading(false)
    }
  }

  // Extrai company_ids únicos dos flows (para o filtro master)
  const companyIds = [...new Set(flows.map(f => f.company_id).filter(Boolean))].sort((a, b) => a - b)

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
      const isActivating = !currentState

      if (isActivating) {
        // Busca as contas do fluxo que está sendo ativado
        const flow = flows.find((f) => f.id === id)
        const accounts = flow?.allowed_accounts || []

        if (accounts.length > 0) {
          // Checa se alguma conta já está em uso por outro fluxo ativo
          const res = await api.post('/api/v1/flows/account-conflicts', {
            flow_id: id,
            accounts,
          })

          if (res.data.success && res.data.data.conflicts.length > 0) {
            const conflicts = res.data.data.conflicts
            const lines = conflicts.map(
              (c) => `  - "${c.account}" (usado por "${c.flow_name}")`
            )
            const action = window.confirm(
              `As seguintes contas já estão em uso por outros fluxos ativos:\n\n` +
              lines.join('\n') +
              `\n\nDeseja remover essas contas dos outros fluxos e continuar ativando?`
            )

            if (!action) return

            // Remove as contas conflitantes dos outros fluxos
            for (const conflict of conflicts) {
              await api.post('/api/v1/flows/remove-account', {
                flow_id: conflict.flow_id,
                account: conflict.account,
              })
            }
          }
        }
      }

      await api.put(`/api/v1/flows/${id}`, { is_active: isActivating })
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isMaster && (
              <select
                value={filterCompanyId}
                onChange={(e) => setFilterCompanyId(e.target.value)}

                style={{
                  padding: '0.5rem 0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                <option value="">Todas as empresas</option>
                {companyIds.map((cid) => (
                  <option key={cid} value={cid}>Empresa {cid}</option>
                ))}
              </select>
            )}
            {isAdmin && (
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
            )}
          </div>
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
                  : '0 8px 30px rgba(0,0,0,0.15)'
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
              <h3 style={styles.cardName}>
                {flow.name}
                {isMaster && flow.company_id && (
                  <span style={{
                    marginLeft: '0.5rem',
                    fontSize: '0.65rem',
                    fontWeight: 500,
                    padding: '0.1rem 0.4rem',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    color: '#6366f1',
                    verticalAlign: 'middle',
                  }}>
                    Empresa {flow.company_id}
                  </span>
                )}
              </h3>
              <p style={styles.cardDesc}>{flow.description || 'Sem descrição'}</p>

              <div style={styles.cardMeta}>
                <span style={flow.is_active ? styles.statusActive : styles.statusInactive}>
                  {flow.is_active ? '\u25CF Ativo' : '\u25CB Inativo'}
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
                  {isAdmin ? 'Editar' : 'Visualizar'}
                </button>
                {isAdmin && (
                  <>
                    <button
                      style={styles.btnToggle}
                      onClick={(e) => { e.stopPropagation(); handleToggleActive(flow.id, flow.is_active) }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = flow.is_active ? '#f59e0b' : '#22c55e'
                        e.target.style.color = flow.is_active ? '#f59e0b' : '#22c55e'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = 'var(--border)'
                        e.target.style.color = 'var(--text-muted)'
                      }}
                    >
                      {flow.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      style={styles.btnToggle}
                      onClick={(e) => { e.stopPropagation(); setAccountsFlowId(flow.id) }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = '#6366f1'
                        e.target.style.color = '#6366f1'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = 'var(--border)'
                        e.target.style.color = 'var(--text-muted)'
                      }}
                    >
                      Contas
                    </button>
                  </>
                )}
                {isAdmin && (
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
                      e.target.style.borderColor = 'var(--border)'
                      e.target.style.color = 'var(--text-dim)'
                    }}
                  >
                    Excluir
                  </button>
                )}
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

      {accountsFlowId && (
        <AccountsPanel
          flowId={accountsFlowId}
          onClose={() => setAccountsFlowId(null)}
        />
      )}
    </div>
  )
}

export default FlowList
