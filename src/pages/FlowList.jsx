import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../config/axios'
import Header from '../components/Header'

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
    if (!confirm('Tem certeza que deseja excluir este fluxo?')) {
      return
    }

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
      await api.put(`/api/v1/flows/${id}`, {
        is_active: !currentState,
      })
      loadFlows()
    } catch (error) {
      console.error('Error toggling flow:', error)
      alert('Erro ao ativar/desativar fluxo')
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="flow-list">
          <h1>Carregando...</h1>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="flow-list">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>Fluxos de Conversação</h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/flow/new')}
            >
              + Novo Fluxo
            </button>
          </div>
        </div>

      <div className="flow-grid">
        {flows.map((flow) => (
          <div
            key={flow.id}
            className={`flow-card ${flow.is_active ? 'active' : ''} ${selectedFlowId === flow.id ? 'selected' : ''}`}
            onClick={() => setSelectedFlowId(flow.id)}
            style={{ cursor: 'pointer' }}
          >
            <h3>{flow.name}</h3>
            <p>{flow.description || 'Sem descrição'}</p>

            <div className="flow-card-meta">
              <span>
                {flow.is_active ? (
                  <strong style={{ color: '#4CAF50' }}>● Ativo</strong>
                ) : (
                  <span style={{ color: '#999' }}>○ Inativo</span>
                )}
              </span>
              <span>
                Criado em {new Date(flow.created_at).toLocaleDateString()}
              </span>
            </div>

            <div className="flow-card-actions">
              <button
                className="btn btn-primary"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/flow/${flow.id}`)
                }}
              >
                ✏️ Editar
              </button>
              <button
                className={`btn ${flow.is_active ? 'btn-secondary' : 'btn-success'}`}
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleActive(flow.id, flow.is_active)
                }}
              >
                {flow.is_active ? 'Desativar' : 'Ativar'}
              </button>
              <button
                className="btn btn-danger"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(flow.id)
                }}
                disabled={flow.is_active}
              >
                Excluir
              </button>
            </div>
          </div>
        ))}

        {flows.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#999' }}>
            <p>Nenhum fluxo criado ainda.</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/flow/new')}
              style={{ marginTop: '1rem' }}
            >
              Criar Primeiro Fluxo
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  )
}

export default FlowList
