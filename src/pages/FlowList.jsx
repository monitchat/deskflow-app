import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../config/axios'
import Header from '../components/Header'
import AccountsPanel from '../components/AccountsPanel'
import ConfirmModal from '../components/ConfirmModal'
import TutorialModal from '../components/TutorialModal'
import { useToast } from '../contexts/ToastContext'

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
  const [confirmModal, setConfirmModal] = useState(null)
  const confirmResolveRef = useRef(null)
  const [showTutorial, setShowTutorial] = useState(false)
  const isMaster = localStorage.getItem('user_is_master') === 'true'
  const isAdmin = localStorage.getItem('user_is_admin') === 'true'
  const navigate = useNavigate()
  const toast = useToast()

  const showConfirm = useCallback((config) => {
    return new Promise((resolve) => {
      confirmResolveRef.current = resolve
      setConfirmModal(config)
    })
  }, [])

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
    const accepted = await showConfirm({
      title: 'Excluir fluxo',
      message: 'Tem certeza que deseja excluir este fluxo? Esta ação não pode ser desfeita.',
      confirmText: 'Excluir',
      variant: 'destructive',
    })
    if (!accepted) return

    try {
      await api.delete(`/api/v1/flows/${id}`)
      loadFlows()
    } catch (error) {
      console.error('Error deleting flow:', error)
      toast.error('Erro ao excluir fluxo')
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
            const conflictList = res.data.data.conflicts
            const activeConflicts = conflictList.filter((c) => c.is_active)

            if (activeConflicts.length > 0) {
              const accepted = await showConfirm({
                title: 'Contas em uso por outros fluxos ativos',
                message: 'As seguintes contas já estão em outros fluxos ativos. Para ativar este fluxo, elas serão removidas dos outros.',
                items: activeConflicts.map((c) => `${c.account} → ${c.flow_name} (ativo)`),
                confirmText: 'Remover e ativar',
                cancelText: 'Cancelar',
                variant: 'destructive',
              })

              if (!accepted) return

              for (const conflict of activeConflicts) {
                await api.post('/api/v1/flows/remove-account', {
                  flow_id: conflict.flow_id,
                  account: conflict.account,
                })
              }
            }
          }
        }
      }

      await api.put(`/api/v1/flows/${id}`, { is_active: isActivating })
      loadFlows()
    } catch (error) {
      console.error('Error toggling flow:', error)
      toast.error('Erro ao ativar/desativar fluxo')
    }
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = async (ev) => {
        try {
          const flowData = JSON.parse(ev.target.result)
          if (!flowData.nodes || !flowData.edges) {
            await showConfirm({
              title: 'Arquivo inválido',
              message: 'O arquivo não contém nodes ou edges.',
              confirmText: 'OK',
              variant: 'destructive',
            })
            return
          }

          const secretItems = flowData.secrets?.length
            ? flowData.secrets.map((s) => s)
            : []

          const accepted = await showConfirm({
            title: `Importar "${flowData.name || 'Sem nome'}"?`,
            message: secretItems.length > 0
              ? 'Será criado um novo fluxo. Ele contém credenciais que precisarão ser configuradas em "Credenciais" após a importação.'
              : 'Será criado um novo fluxo com os dados do arquivo.',
            items: secretItems.length > 0 ? secretItems : undefined,
            confirmText: 'Importar',
            cancelText: 'Cancelar',
            variant: secretItems.length > 0 ? 'warning' : undefined,
          })

          if (!accepted) return

          // Cria um novo fluxo via API
          const response = await api.post('/api/v1/flows', {
            name: flowData.name || 'Fluxo Importado',
            description: flowData.description || '',
            data: { nodes: flowData.nodes, edges: flowData.edges },
            is_active: false,
          })

          if (response.data.success) {
            loadFlows()
            await showConfirm({
              title: 'Fluxo importado',
              message: `O fluxo "${flowData.name || 'Fluxo Importado'}" foi criado com sucesso.`,
              confirmText: 'OK',
            })
          }
        } catch (err) {
          await showConfirm({
            title: 'Erro ao importar',
            message: err.message,
            confirmText: 'OK',
            variant: 'destructive',
          })
        }
      }
      reader.readAsText(file)
    }
    input.click()
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
            <button
              onClick={() => setShowTutorial(true)}
              style={{
                padding: '0.6rem',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '1rem',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-muted)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#6366f1'
                e.target.style.color = '#6366f1'
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'var(--border)'
                e.target.style.color = 'var(--text-muted)'
              }}
              title="Tutorial"
            >
              ?
            </button>
            {isAdmin && (
              <>
                <button
                  onClick={handleImport}
                  style={{
                    padding: '0.6rem 1.2rem',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-muted)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#6366f1'
                    e.target.style.color = '#6366f1'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = 'var(--border)'
                    e.target.style.color = 'var(--text-muted)'
                  }}
                >
                  Importar
                </button>
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
              </>
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
                {flow.updated_by && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    Editado por {flow.updated_by.split('@')[0]}
                  </span>
                )}
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
            <div style={{
              gridColumn: '1 / -1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '3rem 2rem',
              textAlign: 'center',
            }}>
              {/* Hero visual */}
              <div style={{
                fontSize: '3.5rem',
                marginBottom: '1.5rem',
                lineHeight: 1,
                filter: 'drop-shadow(0 0 20px rgba(99, 102, 241, 0.3))',
              }}>
                🧠
              </div>

              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '0.75rem',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Crie fluxos inteligentes com IA
              </h2>

              <p style={{
                fontSize: '0.95rem',
                color: 'var(--text-dim)',
                maxWidth: '520px',
                lineHeight: 1.7,
                marginBottom: '2rem',
              }}>
                Monte fluxos de atendimento com agentes de IA que entendem seus clientes,
                classificam intenções automaticamente e respondem de forma natural.
                Tudo visual, sem escrever uma linha de código.
              </p>

              {/* Feature cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
                maxWidth: '640px',
                width: '100%',
                marginBottom: '2.5rem',
              }}>
                {[
                  { icon: '🤖', title: 'AI Router', desc: 'Classifica intenções com OpenAI ou Gemini' },
                  { icon: '🧠', title: 'Agentes IA', desc: 'Conversação autônoma com tools conectáveis' },
                  { icon: '🔧', title: 'Tools', desc: 'APIs, contexto e funções como ferramentas do agente' },
                ].map((feat) => (
                  <div
                    key={feat.title}
                    style={{
                      padding: '1.25rem 1rem',
                      borderRadius: '12px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{feat.icon}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      {feat.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                      {feat.desc}
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA buttons */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
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
                  + Criar Primeiro Fluxo
                </button>
                <button
                  onClick={handleImport}
                  style={{
                    padding: '0.6rem 1.2rem',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-muted)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#6366f1'
                    e.target.style.color = '#6366f1'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = 'var(--border)'
                    e.target.style.color = 'var(--text-muted)'
                  }}
                >
                  Importar Fluxo
                </button>
              </div>
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

      {showTutorial && (
        <TutorialModal onClose={() => setShowTutorial(false)} />
      )}

      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          items={confirmModal.items}
          confirmText={confirmModal.confirmText}
          cancelText={confirmModal.cancelText}
          variant={confirmModal.variant}
          onConfirm={() => {
            setConfirmModal(null)
            confirmResolveRef.current?.(true)
          }}
          onCancel={() => {
            setConfirmModal(null)
            confirmResolveRef.current?.(false)
          }}
        />
      )}
    </div>
  )
}

export default FlowList
