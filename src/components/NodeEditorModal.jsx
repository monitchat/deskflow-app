import { useState, useEffect } from 'react'
import api from '../config/axios'
import ContextFieldsModal from './ContextFieldsModal'
import AutocompleteTextarea from './AutocompleteTextarea'
import FieldHelper from './FieldHelper'

function NodeEditorModal({ node, nodes = [], edges = [], onSave, onDelete, onClose }) {
  const [data, setData] = useState(node.data)
  const [showFieldsModal, setShowFieldsModal] = useState(false)
  const [expandedOption, setExpandedOption] = useState(null)
  const [apiFields, setApiFields] = useState([])
  const [apiFieldsLoading, setApiFieldsLoading] = useState(false)
  const [apiFieldsError, setApiFieldsError] = useState(null)
  const [apiRawResult, setApiRawResult] = useState(null)
  const [showRawPayload, setShowRawPayload] = useState(false)

  // Estados para teste de API Request
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [testError, setTestError] = useState(null)
  const [showTestResult, setShowTestResult] = useState(false)
  const [testResultExpanded, setTestResultExpanded] = useState(true)

  // Estados para seleção de sessão
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [loadingSessions, setLoadingSessions] = useState(false)

  // Estados para departamentos (nó transfer)
  const [departments, setDepartments] = useState([])
  const [loadingDepartments, setLoadingDepartments] = useState(false)
  const [departmentsError, setDepartmentsError] = useState(null)

  // Estados para status de tickets (nó set_ticket_status)
  const [ticketStatuses, setTicketStatuses] = useState([])
  const [loadingTicketStatuses, setLoadingTicketStatuses] = useState(false)
  const [ticketStatusesError, setTicketStatusesError] = useState(null)

  // Estados para modelos de IA (nó ai_router)
  const [aiModels, setAiModels] = useState([])
  const [loadingAiModels, setLoadingAiModels] = useState(false)
  const [aiModelsError, setAiModelsError] = useState(null)

  // Estados para colapsar seções do API Request
  const [queryParamsExpanded, setQueryParamsExpanded] = useState(false)
  const [headersExpanded, setHeadersExpanded] = useState(false)
  const [bodyExpanded, setBodyExpanded] = useState(false)

  // Detecta se o nó anterior é uma chamada API
  const getPreviousApiNode = () => {
    // Encontra edges que conectam PARA este nó
    const incomingEdges = edges.filter(edge => edge.target === node.id)
    if (incomingEdges.length === 0) return null

    // Pega o nó de origem da primeira conexão
    const sourceNodeId = incomingEdges[0].source
    const sourceNode = nodes.find(n => n.id === sourceNodeId)

    // Verifica se é um nó api_call
    if (sourceNode && sourceNode.type === 'api_call') {
      return sourceNode
    }

    return null
  }

  // Função para buscar campos da API
  const fetchApiFields = (nodeId) => {
    setApiFieldsLoading(true)
    setApiFieldsError(null)

    api.get(`/api/v1/flows/nodes/${nodeId}/last-result`)
      .then(response => {
        setApiFields(response.data.data.fields || [])
        setApiRawResult(response.data.data.raw_result || null)
        setApiFieldsLoading(false)
      })
      .catch(error => {
        console.error('Error fetching API fields:', error)
        setApiFieldsError(error.response?.data?.message || 'Erro ao buscar campos da API')
        setApiFieldsLoading(false)
      })
  }

  // Busca sessões disponíveis quando é um nó api_request
  const fetchSessions = async () => {
    setLoadingSessions(true)
    try {
      const response = await api.get('/api/v1/flows/sessions?limit=10')
      const sessionsList = response.data.data.sessions || []
      setSessions(sessionsList)
      // Seleciona automaticamente a sessão mais recente se houver
      if (sessionsList.length > 0 && !selectedSession) {
        setSelectedSession(sessionsList[0].msisdn)
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoadingSessions(false)
    }
  }

  // Busca departamentos da API do MonitChat
  const fetchDepartments = async () => {
    setLoadingDepartments(true)
    setDepartmentsError(null)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        'https://api-v2.monitchat.com/api/v1/department?skip=0&search=&take=500&filter=%7B%22created%22:%22month%22%7D&order=id&order_direction=desc',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      const departmentsList = result.data || []
      setDepartments(departmentsList)
    } catch (error) {
      console.error('Error fetching departments:', error)
      setDepartmentsError(error.message || 'Erro ao buscar departamentos')
    } finally {
      setLoadingDepartments(false)
    }
  }

  // Busca status de tickets da API do MonitChat
  const fetchTicketStatuses = async () => {
    setLoadingTicketStatuses(true)
    setTicketStatusesError(null)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        'https://api-v2.monitchat.com/api/v1/ticket-status?take=100&skip=0&search=&take=10&order=id&order_direction=desc',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      const statusesList = result.data || []
      // Ordena do menor para o maior pela porcentagem de progresso
      const sortedStatuses = statusesList.sort((a, b) => {
        const progressA = a.progress_percentage || 0
        const progressB = b.progress_percentage || 0
        return progressA - progressB
      })
      setTicketStatuses(sortedStatuses)
    } catch (error) {
      console.error('Error fetching ticket statuses:', error)
      setTicketStatusesError(error.message || 'Erro ao buscar status de tickets')
    } finally {
      setLoadingTicketStatuses(false)
    }
  }

  // Busca modelos disponíveis da OpenAI
  const fetchOpenAIModels = async (apiKey) => {
    setLoadingAiModels(true)
    setAiModelsError(null)
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      const modelsList = result.data || []

      // Filtra apenas modelos GPT relevantes para chat
      const chatModels = modelsList
        .filter(m => m.id.includes('gpt'))
        .map(m => m.id)
        .sort()
        .reverse() // Modelos mais recentes primeiro

      setAiModels(chatModels)
    } catch (error) {
      console.error('Error fetching OpenAI models:', error)
      setAiModelsError(error.message || 'Erro ao buscar modelos da OpenAI')
      // Define modelos padrão em caso de erro
      setAiModels(['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'])
    } finally {
      setLoadingAiModels(false)
    }
  }

  // Busca modelos disponíveis do Gemini
  const fetchGeminiModels = async (apiKey) => {
    setLoadingAiModels(true)
    setAiModelsError(null)
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      const modelsList = result.models || []

      // Filtra modelos relevantes para geração de conteúdo
      const chatModels = modelsList
        .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
        .map(m => m.name.replace('models/', ''))
        .sort()
        .reverse()

      setAiModels(chatModels)
    } catch (error) {
      console.error('Error fetching Gemini models:', error)
      setAiModelsError(error.message || 'Erro ao buscar modelos do Gemini')
      // Define modelos padrão em caso de erro
      setAiModels(['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'])
    } finally {
      setLoadingAiModels(false)
    }
  }

  // Função para testar API Request
  const testApiRequest = async () => {
    setTestLoading(true)
    setTestError(null)
    setTestResult(null)
    setShowTestResult(true)

    try {
      const response = await api.post('/api/v1/flows/test-api-request', {
        method: data.method || 'GET',
        url: data.url || '',
        query_params: data.query_params || [],
        headers: data.headers || [],
        body: data.body || '',
        msisdn: selectedSession || null, // Envia sessão selecionada para substituir variáveis
      })

      setTestResult(response.data.data)
      setTestLoading(false)
    } catch (error) {
      console.error('Error testing API request:', error)
      setTestError(error.response?.data?.error || error.message || 'Erro ao testar requisição')
      setTestLoading(false)
    }
  }

  // Busca os campos disponíveis da API executada ao abrir o modal
  useEffect(() => {
    const previousApiNode = getPreviousApiNode()

    if (node.type === 'set_context' && previousApiNode) {
      fetchApiFields(previousApiNode.id)
    }

    // Carrega sessões se for api_request
    if (node.type === 'api_request') {
      fetchSessions()
    }

    // Carrega departamentos se for transfer
    if (node.type === 'transfer') {
      fetchDepartments()
    }

    // Carrega status de tickets se for set_ticket_status
    if (node.type === 'set_ticket_status') {
      fetchTicketStatuses()
    }
  }, [node.type, node.id])

  // Busca modelos de IA quando API key ou provedor mudar
  useEffect(() => {
    if (node.type !== 'ai_router' && node.type !== 'ai_agent') return

    const apiKey = data.api_key
    const provider = data.ai_provider || 'openai'

    // Só busca se houver API key configurada
    if (!apiKey || apiKey.trim().length < 10) {
      setAiModels([])
      return
    }

    // Debounce de 500ms para evitar múltiplas chamadas durante digitação
    const timer = setTimeout(() => {
      if (provider === 'openai') {
        fetchOpenAIModels(apiKey)
      } else if (provider === 'gemini') {
        fetchGeminiModels(apiKey)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [node.type, data.api_key, data.ai_provider])

  // Listener para fechar modal com ESC
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const handleSave = () => {
    onSave(data)
  }

  const updateData = (key, value) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  const toggleOption = (optionId) => {
    setExpandedOption(expandedOption === optionId ? null : optionId)
  }

  const renderForm = () => {
    switch (node.type) {
      case 'message':
        return (
          <>
            <div className="form-group">
              <label>Mensagem</label>
              <AutocompleteTextarea
                value={data.message || ''}
                onChange={(e) => updateData('message', e.target.value)}
                placeholder="Digite a mensagem que será enviada"
                rows={4}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowFieldsModal(true)}
                style={{ width: '100%' }}
              >
                🔍 Ver Campos Disponíveis no Contexto
              </button>
            </div>
          </>
        )

      case 'button':
        return (
          <>
            <div className="form-group">
              <label>Header (opcional)</label>
              <AutocompleteTextarea
                value={data.header || ''}
                onChange={(e) => updateData('header', e.target.value)}
                placeholder="Título do cartão de botões (digite $ para autocompletar)"
                rows={1}
              />
            </div>
            <div className="form-group">
              <label>Mensagem</label>
              <AutocompleteTextarea
                value={data.message || ''}
                onChange={(e) => updateData('message', e.target.value)}
                placeholder="Digite a mensagem acima dos botões (digite $ para autocompletar)"
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>Footer (opcional)</label>
              <AutocompleteTextarea
                value={data.footer || ''}
                onChange={(e) => updateData('footer', e.target.value)}
                placeholder="Rodapé do cartão de botões (digite $ para autocompletar)"
                rows={1}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowFieldsModal(true)}
                style={{ width: '100%' }}
              >
                🔍 Ver Campos Disponíveis no Contexto
              </button>
            </div>
            <div className="form-group">
              <label>Botões (um por linha)</label>
              <textarea
                value={data.buttons?.join('\n') || ''}
                onChange={(e) =>
                  updateData('buttons', e.target.value.split('\n'))
                }
                placeholder="Botão 1&#10;Botão 2&#10;Botão 3"
              />
              <small style={{ color: '#666' }}>
                Máximo 3 botões. Digite um botão por linha.
              </small>
            </div>
          </>
        )

      case 'list':
        return (
          <>
            <div className="form-group">
              <label>Texto</label>
              <input
                type="text"
                value={data.text || ''}
                onChange={(e) => updateData('text', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Corpo da mensagem</label>
              <input
                type="text"
                value={data.body || ''}
                onChange={(e) => updateData('body', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Rodapé</label>
              <input
                type="text"
                value={data.footer || ''}
                onChange={(e) => updateData('footer', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Texto do botão</label>
              <input
                type="text"
                value={data.action?.button || ''}
                onChange={(e) =>
                  updateData('action', {
                    ...data.action,
                    button: e.target.value,
                  })
                }
              />
            </div>
            <div className="form-group">
              <label>Opções (JSON)</label>
              <textarea
                value={JSON.stringify(data.action?.sections, null, 2) || ''}
                onChange={(e) => {
                  try {
                    const sections = JSON.parse(e.target.value)
                    updateData('action', { ...data.action, sections })
                  } catch (err) {
                    // Ignora erro de parse durante digitação
                  }
                }}
                placeholder='[{"title": "Seção", "rows": [{"id": "1", "title": "Opção 1"}]}]'
                style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
              />
            </div>
          </>
        )

      case 'condition':
        return (
          <div className="form-group">
            <label>Rótulo da condição</label>
            <input
              type="text"
              value={data.label || ''}
              onChange={(e) => updateData('label', e.target.value)}
            />
            <small style={{ color: '#666' }}>
              Conecte este nó a múltiplos destinos e configure condições nas
              conexões.
            </small>
          </div>
        )

      case 'router':
        return (
          <>
            <div className="form-group">
              <label>Rótulo</label>
              <input
                type="text"
                value={data.label || ''}
                onChange={(e) => updateData('label', e.target.value)}
                placeholder="Nome do router"
              />
            </div>

            <div className="form-group">
              <label>Mensagem de Erro</label>
              <textarea
                value={data.error_message || ''}
                onChange={(e) => updateData('error_message', e.target.value)}
                placeholder="Mensagem exibida quando nenhuma opção for atendida"
                rows={2}
              />
            </div>

            <div className="form-group">
              <label>Salvar input em (opcional)</label>
              <input
                type="text"
                value={data.context_key || ''}
                onChange={(e) => updateData('context_key', e.target.value)}
                placeholder="Ex: menu_option"
              />
            </div>

            <hr style={{ margin: '1rem 0', borderColor: '#ddd' }} />

            <div className="form-group">
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>⚡ Opções do Router</span>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    const options = data.options || []
                    const newOptionId = `opt_${Date.now()}`
                    const newOption = {
                      id: newOptionId,
                      label: `Opção ${options.length + 1}`,
                      condition: {
                        type: 'equals',
                        values: [(options.length + 1).toString()]
                      }
                    }
                    updateData('options', [...options, newOption])
                    setExpandedOption(newOptionId)
                  }}
                  style={{ padding: '0.4rem 0.75rem', fontSize: '1rem' }}
                  title="Adicionar Opção"
                >
                  ➕
                </button>
              </label>

              {(data.options || []).map((option, index) => {
                const isExpanded = expandedOption === option.id

                return (
                  <div
                    key={option.id}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      marginBottom: '0.5rem',
                      backgroundColor: isExpanded ? '#f9f9f9' : '#fff',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Header - sempre visível */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem',
                        cursor: 'pointer',
                        backgroundColor: isExpanded ? '#f9f9f9' : '#fff',
                        borderBottom: isExpanded ? '1px solid #ddd' : 'none'
                      }}
                      onClick={() => toggleOption(option.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1rem' }}>{isExpanded ? '▼' : '▶'}</span>
                        <strong style={{ fontSize: '0.9rem' }}>
                          {option.label || `Opção ${index + 1}`}
                        </strong>
                        <small style={{ color: '#666', fontSize: '0.75rem' }}>
                          ({option.condition?.type || 'equals'})
                        </small>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          const options = [...(data.options || [])]
                          options.splice(index, 1)
                          updateData('options', options)
                          if (expandedOption === option.id) {
                            setExpandedOption(null)
                          }
                        }}
                        style={{
                          padding: '0.3rem 0.5rem',
                          fontSize: '1.2rem',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          opacity: 0.6,
                          transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.opacity = 1}
                        onMouseLeave={(e) => e.target.style.opacity = 0.6}
                        title="Remover opção"
                      >
                        🗑️
                      </button>
                    </div>

                    {/* Conteúdo - só visível quando expandido */}
                    {isExpanded && (
                      <div style={{ padding: '0.75rem' }}>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>Label (nome da saída)</label>
                          <input
                            type="text"
                            value={option.label || ''}
                            onChange={(e) => {
                              const options = [...(data.options || [])]
                              options[index] = { ...option, label: e.target.value }
                              updateData('options', options)
                            }}
                            placeholder="Ex: Produtos"
                            style={{ fontSize: '0.85rem' }}
                          />
                        </div>

                        <div style={{ marginBottom: '0.5rem' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>Tipo de Condição</label>
                          <select
                            value={option.condition?.type || 'equals'}
                            onChange={(e) => {
                              const options = [...(data.options || [])]
                              options[index] = {
                                ...option,
                                condition: { ...option.condition, type: e.target.value }
                              }
                              updateData('options', options)
                            }}
                            style={{ fontSize: '0.85rem' }}
                          >
                            <option value="equals">Igual a (texto exato)</option>
                            <option value="contains">Contém (texto parcial)</option>
                            <option value="is_positive">Resposta Positiva (sim/ok)</option>
                            <option value="is_digit">É Número</option>
                            <option value="regex">Regex</option>
                          </select>
                        </div>

                        {(option.condition?.type === 'equals' || option.condition?.type === 'contains') && (
                          <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span>{option.condition?.type === 'equals' ? 'Valores exatos' : 'Valores que devem conter'}</span>
                              <small style={{ color: '#666', fontSize: '0.7rem', fontWeight: 'normal' }}>
                                ({option.condition?.values?.length || 0} valor{(option.condition?.values?.length || 0) !== 1 ? 'es' : ''})
                              </small>
                            </label>
                            <textarea
                              value={option.condition?.values?.join('\n') || ''}
                              onChange={(e) => {
                                const newValue = e.target.value
                                // NÃO filtrar linhas vazias aqui - permite que o usuário continue digitando
                                const values = newValue.split('\n')

                                const options = [...(data.options || [])]
                                options[index] = {
                                  ...option,
                                  condition: {
                                    ...option.condition,
                                    values: values
                                  }
                                }
                                updateData('options', options)
                              }}
                              onBlur={(e) => {
                                // Quando sair do campo, filtra linhas vazias
                                const values = e.target.value.split('\n').filter(v => v.trim())
                                const options = [...(data.options || [])]
                                options[index] = {
                                  ...option,
                                  condition: {
                                    ...option.condition,
                                    values: values
                                  }
                                }
                                updateData('options', options)
                              }}
                              placeholder="Digite um valor por linha&#10;Exemplo:&#10;produto&#10;produtos&#10;ver produtos"
                              rows={5}
                              style={{
                                fontSize: '0.85rem',
                                fontFamily: 'monospace',
                                resize: 'vertical',
                                minHeight: '80px',
                                whiteSpace: 'pre-wrap'
                              }}
                            />
                            <small style={{ color: '#666', fontSize: '0.7rem', display: 'block', marginTop: '0.25rem' }}>
                              💡 Digite um valor por linha. Pressione Enter para adicionar nova linha.
                            </small>
                          </div>
                        )}

                        {option.condition?.type === 'regex' && (
                          <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>Padrão Regex</label>
                            <input
                              type="text"
                              value={option.condition?.pattern || ''}
                              onChange={(e) => {
                                const options = [...(data.options || [])]
                                options[index] = {
                                  ...option,
                                  condition: { ...option.condition, pattern: e.target.value }
                                }
                                updateData('options', options)
                              }}
                              placeholder="Ex: ^\d+$"
                              style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {(!data.options || data.options.length === 0) && (
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#fff3cd',
                  borderRadius: '4px',
                  textAlign: 'center',
                  color: '#856404',
                  fontSize: '0.85rem'
                }}>
                  ⚠️ Nenhuma opção configurada. Clique em "Adicionar Opção" acima.
                </div>
              )}
            </div>

            <div style={{
              padding: '0.75rem',
              backgroundColor: '#e8f5e9',
              borderRadius: '4px',
              marginTop: '1rem',
              fontSize: '0.8rem'
            }}>
              <strong>💡 Cada opção cria uma saída (handle) no nó.</strong>
              <br />
              Conecte cada saída a um nó diferente!
            </div>
          </>
        )

      case 'api_call':
        return (
          <>
            <div className="form-group">
              <label>Tipo de API</label>
              <select
                value={data.api_type || 'get_customer'}
                onChange={(e) => updateData('api_type', e.target.value)}
              >
                <option value="get_partner">Buscar Parceiro (por telefone)</option>
                <option value="get_customer">Buscar Cliente (por CPF)</option>
                <option value="get_products">Buscar Produtos</option>
                <option value="get_services">Buscar Serviços</option>
              </select>
            </div>
            <div className="form-group">
              <label>Rótulo</label>
              <input
                type="text"
                value={data.label || ''}
                onChange={(e) => updateData('label', e.target.value)}
              />
            </div>
          </>
        )

      case 'api_request':
        return (
          <>
            {/* Seletor de Sessão para Teste */}
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                backgroundColor: '#e3f2fd',
                borderRadius: '4px',
                border: '1px solid #2196F3',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <strong style={{ fontSize: '0.85rem' }}>🧪 Sessão de Teste:</strong>
                {loadingSessions && <span style={{ fontSize: '0.75rem', color: '#666' }}>Carregando...</span>}
              </div>

              {sessions.length > 0 ? (
                <>
                  <select
                    value={selectedSession || ''}
                    onChange={(e) => setSelectedSession(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      fontSize: '0.85rem',
                      borderRadius: '4px',
                      border: '1px solid #90CAF9',
                      fontFamily: 'monospace',
                    }}
                  >
                    {sessions.map((session) => (
                      <option key={session.msisdn} value={session.msisdn}>
                        {session.msisdn} {session.stage ? `(${session.stage})` : ''}
                      </option>
                    ))}
                  </select>
                  <small style={{ fontSize: '0.75rem', color: '#1565C0', marginTop: '0.25rem', display: 'block' }}>
                    💡 Variáveis como $&#123;&#123;cep&#125;&#125; serão substituídas pelo contexto desta sessão
                  </small>
                </>
              ) : (
                <div style={{ fontSize: '0.75rem', color: '#666' }}>
                  Nenhuma sessão ativa encontrada. Variáveis $&#123;&#123;campo&#125;&#125; não serão substituídas.
                </div>
              )}
            </div>

            {/* Painel de Resultado do Teste - Sempre visível */}
            {(testResult || testError) && (
              <div
                style={{
                  marginBottom: '1.5rem',
                  border: `2px solid ${testError ? '#F44336' : '#4CAF50'}`,
                  borderRadius: '6px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                <div
                  onClick={() => setTestResultExpanded(!testResultExpanded)}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: testError ? '#ffebee' : '#e8f5e9',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    userSelect: 'none',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{testResultExpanded ? '▼' : '▶'}</span>
                    <span>
                      {testError ? '❌ Erro no Teste' : `✅ Teste Executado (${testResult?.status_code})`}
                    </span>
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>
                    {testResult?.elapsed_time && `${testResult.elapsed_time}s`}
                  </span>
                </div>

                {testResultExpanded && (
                  <div style={{ padding: '1rem', backgroundColor: '#fff' }}>
                    {testError && (
                      <div style={{ color: '#F44336', marginBottom: '1rem' }}>
                        <strong>Erro:</strong> {testError}
                      </div>
                    )}

                    {testResult && (
                      <>
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '3px',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                backgroundColor: testResult.ok ? '#4CAF50' : '#F44336',
                                color: '#fff',
                              }}
                            >
                              {testResult.status_code}
                            </span>
                            <span
                              style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '3px',
                                fontSize: '0.8rem',
                                backgroundColor: '#2196F3',
                                color: '#fff',
                              }}
                            >
                              {testResult.request.method}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#666', wordBreak: 'break-all' }}>
                            <strong>URL:</strong> {testResult.request.url}
                          </div>
                        </div>

                        {Object.keys(testResult.request.params || {}).length > 0 && (
                          <div style={{ marginBottom: '0.75rem' }}>
                            <strong style={{ fontSize: '0.85rem' }}>Query Params:</strong>
                            <pre
                              style={{
                                backgroundColor: '#f5f5f5',
                                padding: '0.5rem',
                                borderRadius: '3px',
                                fontSize: '0.75rem',
                                overflow: 'auto',
                                marginTop: '0.25rem',
                              }}
                            >
                              {JSON.stringify(testResult.request.params, null, 2)}
                            </pre>
                          </div>
                        )}

                        {Object.keys(testResult.request.headers || {}).length > 0 && (
                          <div style={{ marginBottom: '0.75rem' }}>
                            <strong style={{ fontSize: '0.85rem' }}>Headers:</strong>
                            <pre
                              style={{
                                backgroundColor: '#f5f5f5',
                                padding: '0.5rem',
                                borderRadius: '3px',
                                fontSize: '0.75rem',
                                overflow: 'auto',
                                marginTop: '0.25rem',
                              }}
                            >
                              {JSON.stringify(testResult.request.headers, null, 2)}
                            </pre>
                          </div>
                        )}

                        <div style={{ marginBottom: '0.75rem' }}>
                          <strong style={{ fontSize: '0.85rem' }}>Resposta:</strong>
                          <pre
                            style={{
                              backgroundColor: '#f5f5f5',
                              padding: '0.75rem',
                              borderRadius: '3px',
                              fontSize: '0.75rem',
                              maxHeight: '300px',
                              overflow: 'auto',
                              marginTop: '0.25rem',
                              fontFamily: 'monospace',
                            }}
                          >
                            {JSON.stringify(testResult.response, null, 2)}
                          </pre>
                        </div>

                        <div
                          style={{
                            padding: '0.75rem',
                            backgroundColor: '#fff3cd',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            color: '#856404',
                          }}
                        >
                          <strong>💡 Dica:</strong> Esta resposta será salva em{' '}
                          <code style={{ background: '#fff', padding: '0.1rem 0.3rem' }}>
                            {data.context_key || 'api_response'}
                          </code>{' '}
                          quando o fluxo for executado.
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label>Rótulo</label>
              <input
                type="text"
                value={data.label || ''}
                onChange={(e) => updateData('label', e.target.value)}
                placeholder="Nome do nó"
              />
            </div>

            <div className="form-group">
              <label>Método HTTP</label>
              <select
                value={data.method || 'GET'}
                onChange={(e) => updateData('method', e.target.value)}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>

            <div className="form-group">
              <label>URL do Endpoint</label>
              <AutocompleteTextarea
                value={data.url || ''}
                onChange={(e) => updateData('url', e.target.value)}
                placeholder="https://api.exemplo.com/endpoint ou use ${​{campo}} para valores dinâmicos"
                rows={2}
              />
              <small style={{ color: '#666', fontSize: '0.8rem' }}>
                💡 Use $&#123;&#123;campo&#125;&#125; para inserir valores do contexto na URL
              </small>
            </div>

            <hr style={{ margin: '1rem 0', borderColor: '#ddd' }} />

            <div className="form-group">
              <div
                onClick={() => setQueryParamsExpanded(!queryParamsExpanded)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  marginBottom: queryParamsExpanded ? '0.75rem' : '0',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem' }}>{queryParamsExpanded ? '▼' : '▶'}</span>
                  <span style={{ fontWeight: '500' }}>🔗 Query Parameters</span>
                  {(data.query_params || []).length > 0 && (
                    <span style={{ fontSize: '0.75rem', color: '#666', backgroundColor: '#e0e0e0', padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
                      {(data.query_params || []).length}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={(e) => {
                    e.stopPropagation()
                    const params = data.query_params || []
                    updateData('query_params', [...params, { key: '', value: '' }])
                    setQueryParamsExpanded(true)
                  }}
                  style={{ padding: '0.4rem 0.75rem', fontSize: '1rem' }}
                  title="Adicionar Query Param"
                >
                  ➕
                </button>
              </div>

              {queryParamsExpanded && (data.query_params || []).map((param, index) => (
                <div
                  key={index}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    backgroundColor: '#f9f9f9',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <strong style={{ fontSize: '0.9rem' }}>Param {index + 1}</strong>
                    <button
                      type="button"
                      onClick={() => {
                        const params = [...(data.query_params || [])]
                        params.splice(index, 1)
                        updateData('query_params', params)
                      }}
                      style={{
                        padding: '0.3rem 0.5rem',
                        fontSize: '1.2rem',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        opacity: 0.6,
                      }}
                      title="Remover"
                    >
                      🗑️
                    </button>
                  </div>

                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>Key</label>
                    <input
                      type="text"
                      value={param.key || ''}
                      onChange={(e) => {
                        const params = [...(data.query_params || [])]
                        params[index] = { ...param, key: e.target.value }
                        updateData('query_params', params)
                      }}
                      placeholder="Ex: page, limit, filter"
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>Value</label>
                    <AutocompleteTextarea
                      value={param.value || ''}
                      onChange={(e) => {
                        const params = [...(data.query_params || [])]
                        params[index] = { ...param, value: e.target.value }
                        updateData('query_params', params)
                      }}
                      placeholder="Valor estático ou ${​{campo}} do contexto"
                      rows={1}
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <hr style={{ margin: '1rem 0', borderColor: '#ddd' }} />

            <div className="form-group">
              <div
                onClick={() => setHeadersExpanded(!headersExpanded)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  marginBottom: headersExpanded ? '0.75rem' : '0',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem' }}>{headersExpanded ? '▼' : '▶'}</span>
                  <span style={{ fontWeight: '500' }}>📋 Headers</span>
                  {(data.headers || []).length > 0 && (
                    <span style={{ fontSize: '0.75rem', color: '#666', backgroundColor: '#e0e0e0', padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
                      {(data.headers || []).length}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={(e) => {
                    e.stopPropagation()
                    const headers = data.headers || []
                    updateData('headers', [...headers, { key: '', value: '' }])
                    setHeadersExpanded(true)
                  }}
                  style={{ padding: '0.4rem 0.75rem', fontSize: '1rem' }}
                  title="Adicionar Header"
                >
                  ➕
                </button>
              </div>

              {headersExpanded && (data.headers || []).map((header, index) => (
                <div
                  key={index}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    backgroundColor: '#f9f9f9',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <strong style={{ fontSize: '0.9rem' }}>Header {index + 1}</strong>
                    <button
                      type="button"
                      onClick={() => {
                        const headers = [...(data.headers || [])]
                        headers.splice(index, 1)
                        updateData('headers', headers)
                      }}
                      style={{
                        padding: '0.3rem 0.5rem',
                        fontSize: '1.2rem',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        opacity: 0.6,
                      }}
                      title="Remover"
                    >
                      🗑️
                    </button>
                  </div>

                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>Key</label>
                    <input
                      type="text"
                      value={header.key || ''}
                      onChange={(e) => {
                        const headers = [...(data.headers || [])]
                        headers[index] = { ...header, key: e.target.value }
                        updateData('headers', headers)
                      }}
                      placeholder="Ex: Authorization, Content-Type"
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>Value</label>
                    <AutocompleteTextarea
                      value={header.value || ''}
                      onChange={(e) => {
                        const headers = [...(data.headers || [])]
                        headers[index] = { ...header, value: e.target.value }
                        updateData('headers', headers)
                      }}
                      placeholder="Valor do header ou ${​{campo}} do contexto"
                      rows={1}
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {(data.method === 'POST' || data.method === 'PUT' || data.method === 'PATCH') && (
              <>
                <hr style={{ margin: '1rem 0', borderColor: '#ddd' }} />
                <div className="form-group">
                  <div
                    onClick={() => setBodyExpanded(!bodyExpanded)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      padding: '0.5rem',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                      marginBottom: bodyExpanded ? '0.75rem' : '0',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.9rem' }}>{bodyExpanded ? '▼' : '▶'}</span>
                      <span style={{ fontWeight: '500' }}>📝 Body da Requisição (JSON)</span>
                      {data.body && data.body.trim().length > 0 && (
                        <span style={{ fontSize: '0.75rem', color: '#666', backgroundColor: '#e0e0e0', padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
                          {data.body.trim().length} chars
                        </span>
                      )}
                    </div>
                  </div>

                  {bodyExpanded && (
                    <>
                      <AutocompleteTextarea
                        value={data.body || ''}
                        onChange={(e) => updateData('body', e.target.value)}
                        placeholder={'{\n  "campo": "valor",\n  "dinamico": "${​{contexto.campo}}"\n}'}
                        rows={6}
                        style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                      />
                      <small style={{ color: '#666', fontSize: '0.8rem' }}>
                        💡 Use $&#123;&#123;campo&#125;&#125; para inserir valores dinâmicos
                      </small>
                    </>
                  )}
                </div>
              </>
            )}

            <hr style={{ margin: '1rem 0', borderColor: '#ddd' }} />

            <div className="form-group">
              <label>Salvar Resposta em (Context Key)</label>
              <input
                type="text"
                value={data.context_key || 'api_response'}
                onChange={(e) => updateData('context_key', e.target.value)}
                placeholder="Ex: api_response, user_data"
                style={{ fontFamily: 'monospace' }}
              />
              <small style={{ color: '#666', fontSize: '0.8rem' }}>
                A resposta da API será salva nesta chave do contexto
              </small>
            </div>

            <div
              style={{
                padding: '0.75rem',
                backgroundColor: '#e3f2fd',
                borderRadius: '4px',
                marginTop: '1rem',
                fontSize: '0.8rem',
              }}
            >
              <strong>💡 Como usar:</strong>
              <br />
              • A resposta completa será salva em <code style={{background: '#fff', padding: '0.1rem 0.3rem'}}>{data.context_key || 'api_response'}</code>
              <br />
              • Use $&#123;&#123;{data.context_key || 'api_response'}.campo&#125;&#125; para acessar campos da resposta
              <br />
              • Variáveis do contexto podem ser usadas na URL, query params, headers e body
            </div>

          </>
        )

      case 'set_context':
        const previousApiNode = getPreviousApiNode()

        return (
          <>
            <div className="form-group">
              <label>Rótulo</label>
              <input
                type="text"
                value={data.label || ''}
                onChange={(e) => updateData('label', e.target.value)}
                placeholder="Nome do nó"
              />
            </div>

            {/* Mostra campos disponíveis da API anterior */}
            {previousApiNode && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  backgroundColor: apiFieldsError ? '#fff3cd' : '#e3f2fd',
                  borderRadius: '4px',
                  border: `1px solid ${apiFieldsError ? '#ffc107' : '#90caf9'}`,
                }}
              >
                <div style={{
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  color: apiFieldsError ? '#856404' : '#1976d2',
                  fontSize: '0.85rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>
                    🔌 Campos disponíveis da API anterior ({previousApiNode.data?.label || previousApiNode.data?.api_type}):
                  </span>
                  <button
                    type="button"
                    onClick={() => fetchApiFields(previousApiNode.id)}
                    disabled={apiFieldsLoading}
                    style={{
                      padding: '0.3rem 0.6rem',
                      fontSize: '0.75rem',
                      border: '1px solid #1976d2',
                      borderRadius: '4px',
                      backgroundColor: '#fff',
                      color: '#1976d2',
                      cursor: apiFieldsLoading ? 'not-allowed' : 'pointer',
                      opacity: apiFieldsLoading ? 0.6 : 1,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!apiFieldsLoading) {
                        e.target.style.backgroundColor = '#1976d2'
                        e.target.style.color = '#fff'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#fff'
                      e.target.style.color = '#1976d2'
                    }}
                    title="Recarregar campos da API"
                  >
                    🔄 Atualizar
                  </button>
                </div>

                {apiFieldsLoading && (
                  <div style={{ textAlign: 'center', padding: '1rem', color: '#666' }}>
                    Carregando campos...
                  </div>
                )}

                {apiFieldsError && (
                  <div style={{ padding: '0.5rem', color: '#856404', fontSize: '0.8rem' }}>
                    ⚠️ {apiFieldsError}
                    <br />
                    <small>Execute o fluxo ao menos uma vez para ver os campos disponíveis.</small>
                  </div>
                )}

                {!apiFieldsLoading && !apiFieldsError && (
                  <>
                    {apiFields.length > 0 && (
                      <>
                        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                          {apiFields.map((field, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '0.3rem 0',
                                borderBottom: idx < apiFields.length - 1 ? '1px solid #e3f2fd' : 'none',
                                fontSize: '0.75rem',
                              }}
                            >
                              <code
                                style={{
                                  backgroundColor: '#fff',
                                  padding: '0.2rem 0.4rem',
                                  borderRadius: '3px',
                                  fontFamily: 'monospace',
                                  fontSize: '0.75rem',
                                  color: '#d32f2f',
                                  cursor: 'pointer',
                                }}
                                onClick={() => {
                                  navigator.clipboard.writeText(field.field)
                                }}
                                title="Clique para copiar"
                              >
                                {field.field}
                              </code>
                              <span style={{ color: '#666', fontSize: '0.7rem', marginLeft: '0.5rem' }}>
                                {field.description}
                              </span>
                            </div>
                          ))}
                        </div>
                        <small style={{ display: 'block', marginTop: '0.5rem', color: '#1976d2', fontSize: '0.7rem' }}>
                          💡 Clique nos campos para copiar. Use esses nomes no campo "Valor" com tipo "Do Contexto"
                        </small>
                      </>
                    )}

                    {/* Botão para mostrar payload RAW */}
                    {apiRawResult && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <button
                          type="button"
                          onClick={() => setShowRawPayload(!showRawPayload)}
                          style={{
                            padding: '0.4rem 0.6rem',
                            fontSize: '0.75rem',
                            border: '1px solid #1976d2',
                            borderRadius: '4px',
                            backgroundColor: '#fff',
                            color: '#1976d2',
                            cursor: 'pointer',
                            width: '100%',
                          }}
                        >
                          {showRawPayload ? '▼' : '▶'} {showRawPayload ? 'Ocultar' : 'Mostrar'} Payload Completo da API
                        </button>

                        {showRawPayload && (
                          <div
                            style={{
                              marginTop: '0.5rem',
                              padding: '0.75rem',
                              backgroundColor: '#f5f5f5',
                              borderRadius: '4px',
                              maxHeight: '300px',
                              overflowY: 'auto',
                              border: '1px solid #ddd',
                            }}
                          >
                            <pre
                              style={{
                                margin: 0,
                                fontSize: '0.7rem',
                                fontFamily: 'monospace',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-all',
                              }}
                            >
                              {JSON.stringify(apiRawResult, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <hr style={{ margin: '1rem 0', borderColor: '#ddd' }} />

            <div className="form-group">
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>💾 Mapeamentos de Contexto</span>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    const mappings = data.mappings || []
                    updateData('mappings', [
                      ...mappings,
                      { key: '', value: '', source: 'static' }
                    ])
                  }}
                  style={{ padding: '0.4rem 0.75rem', fontSize: '1rem' }}
                  title="Adicionar Mapeamento"
                >
                  ➕
                </button>
              </label>

              <div style={{ marginBottom: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowFieldsModal(true)}
                  style={{ width: '100%' }}
                >
                  🔍 Ver Campos Disponíveis no Contexto
                </button>
              </div>

              {(data.mappings || []).map((mapping, index) => (
                <div
                  key={index}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    backgroundColor: '#f9f9f9',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <strong style={{ fontSize: '0.9rem' }}>Campo {index + 1}</strong>
                    <button
                      type="button"
                      onClick={() => {
                        const mappings = [...(data.mappings || [])]
                        mappings.splice(index, 1)
                        updateData('mappings', mappings)
                      }}
                      style={{
                        padding: '0.3rem 0.5rem',
                        fontSize: '1.2rem',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        opacity: 0.6,
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={(e) => (e.target.style.opacity = 1)}
                      onMouseLeave={(e) => (e.target.style.opacity = 0.6)}
                      title="Remover mapeamento"
                    >
                      🗑️
                    </button>
                  </div>

                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>
                      Chave no Contexto
                    </label>
                    <AutocompleteTextarea
                      value={mapping.key || ''}
                      onChange={(e) => {
                        const mappings = [...(data.mappings || [])]
                        mappings[index] = { ...mapping, key: e.target.value }
                        updateData('mappings', mappings)
                      }}
                      placeholder="Ex: nome_cliente, total_pedidos (digite $ para autocompletar)"
                      rows={1}
                      style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}
                    />
                  </div>

                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>
                      Tipo de Valor
                    </label>
                    <select
                      value={mapping.source || 'static'}
                      onChange={(e) => {
                        const mappings = [...(data.mappings || [])]
                        mappings[index] = { ...mapping, source: e.target.value }
                        updateData('mappings', mappings)
                      }}
                      style={{ fontSize: '0.85rem' }}
                    >
                      <option value="static">Valor Fixo</option>
                      <option value="context">Do Contexto</option>
                      <option value="input">Input do Usuário</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>
                      Valor
                    </label>
                    <AutocompleteTextarea
                      value={mapping.value || ''}
                      onChange={(e) => {
                        const mappings = [...(data.mappings || [])]
                        mappings[index] = { ...mapping, value: e.target.value }
                        updateData('mappings', mappings)
                      }}
                      placeholder={
                        mapping.source === 'context'
                          ? 'Ex: cpf, customer.NOMEPARC (digite $ para autocompletar)'
                          : mapping.source === 'input'
                          ? 'Último input do usuário'
                          : 'Valor fixo'
                      }
                      rows={1}
                      style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}
                    />
                    <small style={{ color: '#666', fontSize: '0.7rem', display: 'block', marginTop: '0.25rem' }}>
                      {mapping.source === 'context'
                        ? '💡 Use notação de ponto para acessar campos aninhados ou digite $ para autocompletar'
                        : mapping.source === 'input'
                        ? '💡 Salva o último texto digitado pelo usuário'
                        : '💡 Valor estático que será salvo'}
                    </small>
                  </div>
                </div>
              ))}

              {(!data.mappings || data.mappings.length === 0) && (
                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: '#fff3cd',
                    borderRadius: '4px',
                    textAlign: 'center',
                    color: '#856404',
                    fontSize: '0.85rem',
                  }}
                >
                  ⚠️ Nenhum mapeamento configurado. Clique em ➕ para adicionar.
                </div>
              )}
            </div>

            <div
              style={{
                padding: '0.75rem',
                backgroundColor: '#e8f5e9',
                borderRadius: '4px',
                marginTop: '1rem',
                fontSize: '0.8rem',
              }}
            >
              <strong>💡 Como usar:</strong>
              <br />
              • <strong>Valor Fixo:</strong> Salva um valor estático (ex: "Aprovado")
              <br />
              • <strong>Do Contexto:</strong> Copia valor de outro campo do contexto
              <br />
              • <strong>Input do Usuário:</strong> Salva o que o usuário digitou
              <br /><br />
              <strong>📚 Notação para acessar campos:</strong>
              <br />
              • <code style={{background: '#fff', padding: '0.1rem 0.3rem', borderRadius: '3px'}}>cpf</code> → Campo simples
              <br />
              • <code style={{background: '#fff', padding: '0.1rem 0.3rem', borderRadius: '3px'}}>customer.NOMEPARC</code> → Campo aninhado
              <br />
              • <code style={{background: '#fff', padding: '0.1rem 0.3rem', borderRadius: '3px'}}>tags[0].label</code> → Primeiro item de um array
              <br />
              • <code style={{background: '#fff', padding: '0.1rem 0.3rem', borderRadius: '3px'}}>tags.*.label</code> → Todos os labels (retorna array)
              <br />
              • <code style={{background: '#fff', padding: '0.1rem 0.3rem', borderRadius: '3px'}}>customer.responseBody.records.record[0].CODPARC.$</code> → Estruturas complexas
            </div>
          </>
        )

      case 'delay':
        return (
          <>
            <div className="form-group">
              <label>Tempo de espera (segundos)</label>
              <input
                type="number"
                min="1"
                max="300"
                value={data.seconds || 1}
                onChange={(e) => updateData('seconds', parseInt(e.target.value) || 1)}
                placeholder="Ex: 5"
              />
              <small style={{ color: '#666' }}>
                Tempo em segundos para aguardar antes de continuar (máx: 300s)
              </small>
            </div>
            <div className="form-group">
              <label>Rótulo (opcional)</label>
              <input
                type="text"
                value={data.label || ''}
                onChange={(e) => updateData('label', e.target.value)}
                placeholder="Ex: Aguardar 5s"
              />
            </div>
          </>
        )

      case 'transfer':
        return (
          <>
            <div className="form-group">
              <label>Departamento</label>
              {loadingDepartments ? (
                <div style={{ padding: '0.75rem', textAlign: 'center', color: '#666', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                  Carregando departamentos...
                </div>
              ) : departmentsError ? (
                <>
                  <div style={{ padding: '0.75rem', marginBottom: '0.5rem', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '4px', fontSize: '0.85rem' }}>
                    ⚠️ {departmentsError}
                  </div>
                  <input
                    type="number"
                    value={data.department_id || ''}
                    onChange={(e) =>
                      updateData('department_id', parseInt(e.target.value))
                    }
                    placeholder="Digite o ID do departamento manualmente"
                  />
                </>
              ) : departments.length > 0 ? (
                <>
                  <select
                    value={data.department_id || ''}
                    onChange={(e) => {
                      const value = e.target.value
                      updateData('department_id', value ? parseInt(value) : null)
                    }}
                    style={{ fontSize: '0.9rem' }}
                  >
                    <option value="">Selecione um departamento</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} (ID: {dept.id})
                      </option>
                    ))}
                  </select>
                  <small style={{ color: '#666', display: 'block', marginTop: '0.5rem' }}>
                    {departments.length} departamento{departments.length !== 1 ? 's' : ''} disponível{departments.length !== 1 ? 'is' : ''}
                  </small>
                </>
              ) : (
                <>
                  <div style={{ padding: '0.75rem', marginBottom: '0.5rem', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '4px', fontSize: '0.85rem' }}>
                    ⚠️ Nenhum departamento encontrado
                  </div>
                  <input
                    type="number"
                    value={data.department_id || ''}
                    onChange={(e) =>
                      updateData('department_id', parseInt(e.target.value))
                    }
                    placeholder="Digite o ID do departamento manualmente"
                  />
                </>
              )}
            </div>
            <div className="form-group">
              <label>Mensagem de sucesso</label>
              <textarea
                value={data.message || ''}
                onChange={(e) => updateData('message', e.target.value)}
                placeholder="Mensagem enviada ao transferir com sucesso"
              />
            </div>
            <div className="form-group">
              <label>Mensagem de erro</label>
              <textarea
                value={data.error_message || ''}
                onChange={(e) => updateData('error_message', e.target.value)}
                placeholder="Mensagem enviada quando a transferência falhar"
              />
              <small style={{ color: '#666', display: 'block', marginTop: '0.25rem' }}>
                Se vazio, usa: "Não foi possível transferir o atendimento. Tente novamente mais tarde."
              </small>
            </div>
            <div className="form-group">
              <label>Rótulo</label>
              <input
                type="text"
                value={data.label || ''}
                onChange={(e) => updateData('label', e.target.value)}
              />
            </div>
          </>
        )

      case 'set_ticket_status':
        return (
          <>
            <div className="form-group">
              <label>Status</label>
              {loadingTicketStatuses ? (
                <div style={{ padding: '0.75rem', textAlign: 'center', color: '#666', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                  Carregando status...
                </div>
              ) : ticketStatusesError ? (
                <>
                  <div style={{ padding: '0.75rem', marginBottom: '0.5rem', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '4px', fontSize: '0.85rem' }}>
                    ⚠️ {ticketStatusesError}
                  </div>
                  <input
                    type="number"
                    value={data.status_id || ''}
                    onChange={(e) =>
                      updateData('status_id', parseInt(e.target.value))
                    }
                    placeholder="Digite o ID do status manualmente"
                  />
                </>
              ) : ticketStatuses.length > 0 ? (
                <>
                  <select
                    value={data.status_id || ''}
                    onChange={(e) => {
                      const value = e.target.value
                      updateData('status_id', value ? parseInt(value) : null)
                    }}
                    style={{ fontSize: '0.9rem' }}
                  >
                    <option value="">Selecione um status</option>
                    {ticketStatuses.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.name} - {status.description || 'Sem descrição'} ({status.progress_percentage || 0}%)
                      </option>
                    ))}
                  </select>
                  {data.status_id && (() => {
                    const selectedStatus = ticketStatuses.find(s => s.id === data.status_id)
                    return selectedStatus ? (
                      <div style={{
                        marginTop: '0.75rem',
                        padding: '0.75rem',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '4px',
                        fontSize: '0.85rem'
                      }}>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <strong>{selectedStatus.name}</strong>
                        </div>
                        <div style={{ color: '#666', marginBottom: '0.25rem' }}>
                          📝 {selectedStatus.description || 'Sem descrição'}
                        </div>
                        <div style={{ color: '#666' }}>
                          📊 Progresso: {selectedStatus.progress_percentage || 0}%
                        </div>
                      </div>
                    ) : null
                  })()}
                  <small style={{ color: '#666', display: 'block', marginTop: '0.5rem' }}>
                    {ticketStatuses.length} status disponíve{ticketStatuses.length !== 1 ? 'is' : 'l'}
                  </small>
                </>
              ) : (
                <>
                  <div style={{ padding: '0.75rem', marginBottom: '0.5rem', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '4px', fontSize: '0.85rem' }}>
                    ⚠️ Nenhum status encontrado
                  </div>
                  <input
                    type="number"
                    value={data.status_id || ''}
                    onChange={(e) =>
                      updateData('status_id', parseInt(e.target.value))
                    }
                    placeholder="Digite o ID do status manualmente"
                  />
                </>
              )}
            </div>
            <div className="form-group">
              <label>Rótulo</label>
              <input
                type="text"
                value={data.label || ''}
                onChange={(e) => updateData('label', e.target.value)}
              />
            </div>
          </>
        )

      case 'jump_to':
        // Filtra o próprio nó da lista de destinos
        const availableNodes = nodes.filter(n => n.id !== node.id && n.type !== 'jump_to')
        return (
          <>
            <div className="form-group">
              <label>Nó de destino</label>
              <select
                value={data.target_node_id || ''}
                onChange={(e) => {
                  const targetId = e.target.value || null
                  const targetNode = nodes.find(n => n.id === targetId)
                  const targetLabel = targetNode
                    ? (targetNode.data?.label || targetNode.data?.message?.substring(0, 30) || targetNode.type)
                    : ''
                  updateData('target_node_id', targetId)
                  updateData('target_node_label', targetLabel)
                }}
                style={{ fontSize: '0.9rem' }}
              >
                <option value="">Selecione o nó de destino</option>
                {availableNodes.map((n) => {
                  const nodeLabel = n.data?.label || n.data?.message?.substring(0, 30) || n.type
                  const nodeIcons = {
                    message: '💬', button: '🔘', list: '📋', condition: '🔀',
                    router: '🎯', ai_router: '🤖', api_call: '🔌', api_request: '🌐',
                    set_context: '💾', delay: '⏱️', transfer: '👤',
                    set_ticket_status: '🎫', media: '📎', end: '🏁', input: '⌨️',
                  }
                  const icon = nodeIcons[n.type] || '📦'
                  return (
                    <option key={n.id} value={n.id}>
                      {icon} {nodeLabel} ({n.id})
                    </option>
                  )
                })}
              </select>
              <small style={{ color: '#666', display: 'block', marginTop: '0.25rem' }}>
                {availableNodes.length} nó(s) disponível(is) como destino
              </small>
            </div>
            <div className="form-group">
              <label>Rótulo</label>
              <input
                type="text"
                value={data.label || ''}
                onChange={(e) => updateData('label', e.target.value)}
                placeholder="Pular para..."
              />
            </div>
          </>
        )

      case 'end':
        return (
          <>
            <div className="form-group">
              <label>Mensagem de despedida</label>
              <textarea
                value={data.message || ''}
                onChange={(e) => updateData('message', e.target.value)}
                placeholder="A Client agradece o seu contato!"
              />
            </div>
            <div className="form-group">
              <label>Rótulo</label>
              <input
                type="text"
                value={data.label || ''}
                onChange={(e) => updateData('label', e.target.value)}
              />
            </div>
          </>
        )

      case 'ai_router':
        return (
          <>
            <div className="form-group">
              <label>Rótulo</label>
              <input
                type="text"
                value={data.label || ''}
                onChange={(e) => updateData('label', e.target.value)}
                placeholder="Nome do AI Router"
              />
            </div>

            <div className="form-group">
              <label>Provedor de IA</label>
              <select
                value={data.ai_provider || 'openai'}
                onChange={(e) => updateData('ai_provider', e.target.value)}
              >
                <option value="openai">OpenAI</option>
                <option value="gemini">Google Gemini</option>
              </select>
            </div>

            <div className="form-group">
              <label>API Key</label>
              <input
                type="password"
                value={data.api_key || ''}
                onChange={(e) => updateData('api_key', e.target.value)}
                placeholder={data.ai_provider === 'gemini' ? 'AIza...' : 'sk-...'}
              />
              <small style={{ color: '#666' }}>
                {data.ai_provider === 'openai'
                  ? 'Obtenha em: https://platform.openai.com/api-keys'
                  : 'Obtenha em: https://aistudio.google.com/apikey'
                }
              </small>
            </div>

            <div className="form-group">
              <label>
                Modelo
                {loadingAiModels && <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#666' }}>🔄 Carregando...</span>}
              </label>

              {aiModels.length > 0 ? (
                <>
                  <select
                    value={data.model || ''}
                    onChange={(e) => updateData('model', e.target.value)}
                    disabled={loadingAiModels}
                  >
                    <option value="">
                      {data.ai_provider === 'openai' ? 'gpt-4o-mini (padrão)' : 'gemini-2.0-flash-exp (padrão)'}
                    </option>
                    {aiModels.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                  <small style={{ color: '#666' }}>
                    {aiModels.length} modelo{aiModels.length !== 1 ? 's' : ''} disponível{aiModels.length !== 1 ? 'is' : ''}
                    {aiModelsError && <span style={{ color: '#ff9800', marginLeft: '0.5rem' }}>⚠️ {aiModelsError}</span>}
                  </small>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    value={data.model || ''}
                    onChange={(e) => updateData('model', e.target.value)}
                    placeholder={
                      data.ai_provider === 'openai'
                        ? 'gpt-4o-mini (padrão)'
                        : 'gemini-2.0-flash-exp (padrão)'
                    }
                    disabled={loadingAiModels}
                  />
                  <small style={{ color: '#666' }}>
                    {data.api_key && data.api_key.trim().length >= 10
                      ? (loadingAiModels ? 'Buscando modelos disponíveis...' : 'Digite ou aguarde carregar modelos')
                      : 'Configure a API Key para ver modelos disponíveis'
                    }
                    {aiModelsError && <span style={{ color: '#ff9800', display: 'block', marginTop: '0.25rem' }}>⚠️ {aiModelsError}</span>}
                  </small>
                </>
              )}
            </div>

            <div className="form-group">
              <label>Prompt do Sistema</label>
              <textarea
                value={data.prompt || ''}
                onChange={(e) => updateData('prompt', e.target.value)}
                placeholder="Você é um assistente que identifica intenções do usuário. Analise a mensagem e determine qual ação o usuário deseja realizar."
                rows={4}
              />
              <FieldHelper
                title="Como escrever um bom prompt"
                description="Explique o contexto do seu negócio e quais tipos de pedidos os clientes costumam fazer. Quanto mais contexto, melhor a classificação das intenções."
                example={`Você é o assistente virtual da loja de móveis Casa Nova. Os clientes geralmente querem: consultar status de pedidos, verificar disponibilidade de produtos, solicitar assistência técnica ou falar com um vendedor. Classifique a intenção do cliente com base na mensagem.`}
                onUseExample={(ex) => updateData('prompt', ex)}
              />
              <small style={{ color: '#666' }}>
                Este prompt guiará a IA na identificação das intenções
              </small>
            </div>

            <div className="form-group">
              <label>Mensagem de Erro</label>
              <textarea
                value={data.error_message || ''}
                onChange={(e) => updateData('error_message', e.target.value)}
                placeholder="Desculpe, não entendi sua mensagem. Pode reformular?"
                rows={2}
              />
            </div>

            <div className="form-group">
              <label>Salvar intenção em (opcional)</label>
              <input
                type="text"
                value={data.context_key || ''}
                onChange={(e) => updateData('context_key', e.target.value)}
                placeholder="Ex: ai_intent"
              />
            </div>

            <hr style={{ margin: '1rem 0', borderColor: '#ddd' }} />

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={data.enable_response || false}
                  onChange={(e) => updateData('enable_response', e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span>💬 Permitir que a IA responda diretamente (intenção padrão)</span>
              </label>
              <small style={{ color: '#666', display: 'block', marginTop: '0.5rem' }}>
                Quando ativado, se nenhuma intenção for detectada, a IA irá gerar uma resposta
                ao invés de mostrar mensagem de erro. Útil para conversas abertas.
              </small>
            </div>

            {data.enable_response && (
              <div className="form-group">
                <label>Prompt para Resposta (opcional)</label>
                <textarea
                  value={data.response_prompt || ''}
                  onChange={(e) => updateData('response_prompt', e.target.value)}
                  placeholder="Você é um assistente prestativo. Responda de forma clara e objetiva."
                  rows={3}
                />
                <small style={{ color: '#666' }}>
                  Este prompt será usado quando a IA gerar uma resposta direta.
                  Se vazio, usa o prompt do sistema.
                </small>
              </div>
            )}

            <hr style={{ margin: '1rem 0', borderColor: '#ddd' }} />

            <div className="form-group">
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🎯 Intenções (Saídas)</span>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    const intents = data.intents || []
                    const newIntentId = `intent_${Date.now()}`
                    const newIntent = {
                      id: newIntentId,
                      label: `Intenção ${intents.length + 1}`,
                      description: ''
                    }
                    updateData('intents', [...intents, newIntent])
                    setExpandedOption(newIntentId)
                  }}
                  style={{ padding: '0.4rem 0.75rem', fontSize: '1rem' }}
                  title="Adicionar Intenção"
                >
                  ➕
                </button>
              </label>

              {(data.intents || []).map((intent, index) => {
                const isExpanded = expandedOption === intent.id

                return (
                  <div
                    key={intent.id}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      marginBottom: '0.5rem',
                      backgroundColor: isExpanded ? '#f9f9f9' : '#fff',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Header - sempre visível */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem',
                        cursor: 'pointer',
                        backgroundColor: isExpanded ? '#f9f9f9' : '#fff',
                        borderBottom: isExpanded ? '1px solid #ddd' : 'none'
                      }}
                      onClick={() => toggleOption(intent.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1rem' }}>{isExpanded ? '▼' : '▶'}</span>
                        <strong style={{ fontSize: '0.9rem' }}>
                          {intent.label || `Intenção ${index + 1}`}
                        </strong>
                        {intent.description && (
                          <small style={{ color: '#666', fontSize: '0.75rem' }}>
                            ({intent.description.substring(0, 30)}{intent.description.length > 30 ? '...' : ''})
                          </small>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          const intents = [...(data.intents || [])]
                          intents.splice(index, 1)
                          updateData('intents', intents)
                          if (expandedOption === intent.id) {
                            setExpandedOption(null)
                          }
                        }}
                        style={{
                          padding: '0.3rem 0.5rem',
                          fontSize: '1.2rem',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          opacity: 0.6,
                          transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.opacity = 1}
                        onMouseLeave={(e) => e.target.style.opacity = 0.6}
                        title="Remover intenção"
                      >
                        🗑️
                      </button>
                    </div>

                    {/* Conteúdo - só visível quando expandido */}
                    {isExpanded && (
                      <div style={{ padding: '0.75rem' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>ID da Intenção (único)</label>
                          <input
                            type="text"
                            defaultValue={intent.id || ''}
                            onBlur={(e) => {
                              const newId = e.target.value
                              const oldId = intent.id
                              const intents = [...(data.intents || [])]
                              intents[index] = { ...intent, id: newId }
                              updateData('intents', intents)
                              // Atualiza o expandedOption se esta intenção está expandida
                              if (expandedOption === oldId) {
                                setExpandedOption(newId)
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Ex: consultar_produtos, falar_atendente"
                            style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}
                          />
                          <small style={{ color: '#666', fontSize: '0.7rem', display: 'block', marginTop: '0.25rem' }}>
                            💡 Use snake_case sem espaços ou caracteres especiais
                          </small>
                        </div>

                        <div style={{ marginBottom: '0.5rem' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>Label (nome da saída)</label>
                          <input
                            type="text"
                            defaultValue={intent.label || ''}
                            onBlur={(e) => {
                              const intents = [...(data.intents || [])]
                              intents[index] = { ...intent, label: e.target.value }
                              updateData('intents', intents)
                            }}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Ex: Consultar Produtos, Falar com Atendente"
                            style={{ fontSize: '0.85rem' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>Descrição (ajuda a IA)</label>
                          <textarea
                            defaultValue={intent.description || ''}
                            onBlur={(e) => {
                              const intents = [...(data.intents || [])]
                              intents[index] = { ...intent, description: e.target.value }
                              updateData('intents', intents)
                            }}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Ex: Quando o usuário quer ver produtos, consultar catálogo, perguntar sobre itens disponíveis"
                            rows={3}
                            style={{
                              fontSize: '0.85rem',
                              resize: 'vertical',
                            }}
                          />
                          <small style={{ color: '#666', fontSize: '0.7rem', display: 'block', marginTop: '0.25rem' }}>
                            💡 Descreva quando essa intenção deve ser detectada. Quanto mais detalhes, melhor!
                          </small>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {(!data.intents || data.intents.length === 0) && (
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#fff3cd',
                  borderRadius: '4px',
                  textAlign: 'center',
                  color: '#856404',
                  fontSize: '0.85rem'
                }}>
                  ⚠️ Nenhuma intenção configurada. Clique em ➕ para adicionar.
                </div>
              )}
            </div>

            <div style={{
              padding: '0.75rem',
              backgroundColor: '#e3f2fd',
              borderRadius: '4px',
              marginTop: '1rem',
              fontSize: '0.8rem'
            }}>
              <strong>💡 Como funciona:</strong>
              <br />
              • A IA analisa o texto do usuário usando o prompt fornecido
              <br />
              • Identifica qual intenção melhor se encaixa
              <br />
              • Roteia para a saída correspondente à intenção detectada
              <br />
              • Cada intenção cria uma saída (handle) no nó
              <br />
              {data.enable_response ? (
                <>
                  • Se nenhuma intenção for detectada, <strong>a IA gera uma resposta direta</strong> (saída padrão)
                </>
              ) : (
                <>
                  • Se nenhuma intenção for detectada, segue pela saída de erro
                </>
              )}
            </div>
          </>
        )

      case 'ai_agent':
        return (
          <>
            <div className="form-group">
              <label>Rótulo</label>
              <input
                type="text"
                value={data.label || ''}
                onChange={(e) => updateData('label', e.target.value)}
                placeholder="Nome do agente"
              />
            </div>

            <div className="form-group">
              <label>Provedor de IA</label>
              <select
                value={data.ai_provider || 'openai'}
                onChange={(e) => updateData('ai_provider', e.target.value)}
              >
                <option value="openai">OpenAI</option>
                <option value="gemini">Google Gemini</option>
                <option value="azure">Microsoft Azure</option>
              </select>
            </div>

            <div className="form-group">
              <label>API Key</label>
              <input
                type="password"
                value={data.api_key || ''}
                onChange={(e) => updateData('api_key', e.target.value)}
                placeholder={
                  data.ai_provider === 'gemini' ? 'AIza...' :
                  data.ai_provider === 'azure' ? 'Azure API Key' :
                  'sk-...'
                }
              />
              <small style={{ color: '#666' }}>
                {data.ai_provider === 'openai' && 'Obtenha em: https://platform.openai.com/api-keys'}
                {data.ai_provider === 'gemini' && 'Obtenha em: https://aistudio.google.com/apikey'}
                {data.ai_provider === 'azure' && 'Obtenha no Azure Portal'}
              </small>
            </div>

            {data.ai_provider === 'azure' && (
              <>
                <div className="form-group">
                  <label>Azure API Base URL</label>
                  <input
                    type="text"
                    value={data.azure_api_base || ''}
                    onChange={(e) => updateData('azure_api_base', e.target.value)}
                    placeholder="https://seu-recurso.openai.azure.com"
                  />
                </div>
                <div className="form-group">
                  <label>Azure API Version</label>
                  <input
                    type="text"
                    value={data.azure_api_version || ''}
                    onChange={(e) => updateData('azure_api_version', e.target.value)}
                    placeholder="2024-02-01"
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label>
                Modelo
                {loadingAiModels && <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#666' }}>🔄 Carregando...</span>}
              </label>

              {aiModels.length > 0 ? (
                <>
                  <select
                    value={data.model || ''}
                    onChange={(e) => updateData('model', e.target.value)}
                    disabled={loadingAiModels}
                  >
                    <option value="">
                      {data.ai_provider === 'gemini' ? 'gemini-2.0-flash (padrão)' :
                       data.ai_provider === 'azure' ? 'Selecione um modelo' :
                       'gpt-4o-mini (padrão)'}
                    </option>
                    {aiModels.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                  <small style={{ color: '#666' }}>
                    {aiModels.length} modelo{aiModels.length !== 1 ? 's' : ''} disponível{aiModels.length !== 1 ? 'is' : ''}
                  </small>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    value={data.model || ''}
                    onChange={(e) => updateData('model', e.target.value)}
                    placeholder={
                      data.ai_provider === 'gemini' ? 'gemini-2.0-flash' :
                      data.ai_provider === 'azure' ? 'nome-do-deployment' :
                      'gpt-4o-mini'
                    }
                    disabled={loadingAiModels}
                  />
                  <small style={{ color: '#666' }}>
                    {data.ai_provider === 'azure'
                      ? 'Use o nome do deployment do Azure'
                      : data.api_key && data.api_key.trim().length >= 10
                        ? (loadingAiModels ? 'Buscando modelos...' : 'Digite ou aguarde carregar modelos')
                        : 'Configure a API Key para ver modelos'
                    }
                  </small>
                </>
              )}
            </div>

            <div className="form-group">
              <label>Instruções do Agente (System Prompt)</label>
              <textarea
                value={data.prompt || ''}
                onChange={(e) => updateData('prompt', e.target.value)}
                placeholder="Você é um assistente virtual da empresa X. Responda de forma educada e objetiva."
                rows={6}
              />
              <FieldHelper
                title="Como escrever instruções eficazes"
                description="O prompt define quem o agente é, como ele deve se comportar e quais limites tem. Use variáveis do contexto para personalizar. Quanto mais detalhado, melhor a qualidade das respostas."
                example={`Você é o assistente virtual da loja Casa Nova Móveis.

Regras:
- Responda sempre em português, de forma educada e objetiva
- Use as tools disponíveis para buscar dados antes de responder
- Nunca invente informações — se não encontrar, diga que vai verificar
- O nome do cliente é $\{{nome}} — use para personalizar
- Se o cliente pedir algo fora do escopo, direcione para atendimento humano
- Mantenha respostas curtas (máx 3 parágrafos)`}
                onUseExample={(ex) => updateData('prompt', ex)}
              />
              <small style={{ color: '#666' }}>
                Defina o comportamento, personalidade e regras do agente.
                Use {'${{campo}}'} para variáveis do contexto.
              </small>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Temperatura</label>
                <input
                  type="number"
                  value={data.temperature ?? 0.7}
                  onChange={(e) => updateData('temperature', parseFloat(e.target.value))}
                  min="0"
                  max="2"
                  step="0.1"
                />
                <small style={{ color: '#666' }}>0 = preciso, 2 = criativo</small>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Max Tokens</label>
                <input
                  type="number"
                  value={data.max_tokens ?? 1000}
                  onChange={(e) => updateData('max_tokens', parseInt(e.target.value))}
                  min="50"
                  max="4096"
                  step="50"
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Max Iterações</label>
                <input
                  type="number"
                  value={data.max_iterations ?? 10}
                  onChange={(e) => updateData('max_iterations', parseInt(e.target.value))}
                  min="1"
                  max="30"
                />
                <small style={{ color: '#666' }}>Loop de tools</small>
              </div>
            </div>

            <div className="form-group">
              <label>Mensagem de Erro</label>
              <textarea
                value={data.error_message || ''}
                onChange={(e) => updateData('error_message', e.target.value)}
                placeholder="Desculpe, ocorreu um erro ao processar sua mensagem."
                rows={2}
              />
            </div>

            <div className="form-group">
              <label>Salvar resposta em (opcional)</label>
              <input
                type="text"
                value={data.context_key || ''}
                onChange={(e) => updateData('context_key', e.target.value)}
                placeholder="Ex: ai_agent_response"
              />
            </div>

            <hr style={{ margin: '1rem 0', borderColor: '#ddd' }} />

            <div className="form-group">
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🔧 Tools (Ferramentas)</span>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => {
                      const tools = data.tools || []
                      updateData('tools', [...tools, {
                        name: `tool_${Date.now()}`,
                        type: 'http_request',
                        description: '',
                        method: 'GET',
                        url: '',
                        headers: {},
                        parameters: { type: 'object', properties: {}, required: [] },
                      }])
                    }}
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                    title="Adicionar Tool HTTP"
                  >
                    🌐 HTTP
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => {
                      const tools = data.tools || []
                      updateData('tools', [...tools, {
                        name: `context_${Date.now()}`,
                        type: 'context_lookup',
                        description: 'Busca informações do contexto da conversa',
                        parameters: {
                          type: 'object',
                          properties: {
                            key: { type: 'string', description: 'A chave do contexto a buscar' }
                          },
                          required: ['key'],
                        },
                      }])
                    }}
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', backgroundColor: '#FF9800', color: '#fff', border: 'none', borderRadius: '4px' }}
                    title="Adicionar Tool de Contexto"
                  >
                    💾 Contexto
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => {
                      const tools = data.tools || []
                      updateData('tools', [...tools, {
                        name: `function_${Date.now()}`,
                        type: 'function',
                        description: '',
                        parameters: { type: 'object', properties: {}, required: [] },
                      }])
                    }}
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', backgroundColor: '#4CAF50', color: '#fff', border: 'none', borderRadius: '4px' }}
                    title="Adicionar Tool Customizada"
                  >
                    ⚡ Custom
                  </button>
                </div>
              </label>

              {(data.tools || []).map((tool, index) => {
                const isExpanded = expandedOption === `tool_${index}`
                const toolTypeLabel = {
                  http_request: '🌐 HTTP Request',
                  context_lookup: '💾 Contexto',
                  function: '⚡ Custom',
                }

                return (
                  <div
                    key={index}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      marginBottom: '0.5rem',
                      backgroundColor: isExpanded ? '#f9f9f9' : '#fff',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem',
                        cursor: 'pointer',
                        backgroundColor: isExpanded ? '#f9f9f9' : '#fff',
                        borderBottom: isExpanded ? '1px solid #ddd' : 'none'
                      }}
                      onClick={() => toggleOption(`tool_${index}`)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1rem' }}>{isExpanded ? '▼' : '▶'}</span>
                        <strong style={{ fontSize: '0.85rem' }}>
                          {tool.name || `Tool ${index + 1}`}
                        </strong>
                        <small style={{ color: '#666', fontSize: '0.75rem' }}>
                          {toolTypeLabel[tool.type] || tool.type}
                        </small>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          const tools = [...(data.tools || [])]
                          tools.splice(index, 1)
                          updateData('tools', tools)
                        }}
                        style={{
                          padding: '0.3rem 0.5rem',
                          fontSize: '1.2rem',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          opacity: 0.6,
                        }}
                        title="Remover tool"
                      >
                        🗑️
                      </button>
                    </div>

                    {isExpanded && (
                      <div style={{ padding: '0.75rem' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>Nome da Tool</label>
                          <input
                            type="text"
                            value={tool.name || ''}
                            onChange={(e) => {
                              const tools = [...(data.tools || [])]
                              tools[index] = { ...tool, name: e.target.value }
                              updateData('tools', tools)
                            }}
                            placeholder="Ex: buscar_produtos, consultar_pedido"
                            style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}
                          />
                          <FieldHelper
                            description="Use snake_case sem espaços ou caracteres especiais. Escolha um nome que descreva claramente a ação, como buscar_cliente, criar_pedido, verificar_estoque."
                          />
                        </div>

                        <div style={{ marginBottom: '0.5rem' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>Descrição</label>
                          <textarea
                            value={tool.description || ''}
                            onChange={(e) => {
                              const tools = [...(data.tools || [])]
                              tools[index] = { ...tool, description: e.target.value }
                              updateData('tools', tools)
                            }}
                            placeholder="Descreva o que esta tool faz. A IA usa isso para decidir quando chamá-la."
                            rows={2}
                            style={{ fontSize: '0.85rem' }}
                          />
                          <FieldHelper
                            title="Por que a descrição é importante?"
                            description="A IA lê a descrição para decidir QUANDO usar esta tool. Seja claro e específico. Diga exatamente o que a tool faz e em qual situação deve ser usada."
                            example={`Busca dados de um cliente pelo CPF no sistema ERP. Use quando o usuário informar seu CPF ou pedir informações sobre sua conta, pedidos ou cadastro.`}
                            onUseExample={(ex) => {
                              const tools = [...(data.tools || [])]
                              tools[index] = { ...tool, description: ex }
                              updateData('tools', tools)
                            }}
                          />
                        </div>

                        {tool.type === 'http_request' && (
                          <>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <div style={{ width: '120px' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>Método</label>
                                <select
                                  value={tool.method || 'GET'}
                                  onChange={(e) => {
                                    const tools = [...(data.tools || [])]
                                    tools[index] = { ...tool, method: e.target.value }
                                    updateData('tools', tools)
                                  }}
                                  style={{ fontSize: '0.85rem' }}
                                >
                                  <option value="GET">GET</option>
                                  <option value="POST">POST</option>
                                  <option value="PUT">PUT</option>
                                  <option value="DELETE">DELETE</option>
                                  <option value="PATCH">PATCH</option>
                                </select>
                              </div>
                              <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>URL</label>
                                <input
                                  type="text"
                                  value={tool.url || ''}
                                  onChange={(e) => {
                                    const tools = [...(data.tools || [])]
                                    tools[index] = { ...tool, url: e.target.value }
                                    updateData('tools', tools)
                                  }}
                                  placeholder="https://api.example.com/endpoint"
                                  style={{ fontSize: '0.85rem' }}
                                />
                                <FieldHelper
                                  title="Variáveis na URL"
                                  description={`Use \${{campo}} para valores do contexto e {param} para a IA preencher automaticamente. Parâmetros definidos no JSON Schema que não estão na URL vão como query string (GET) ou body (POST).`}
                                  example="https://api.erp.com/clientes/{cpf}?incluir=${{flag}}"
                                />
                              </div>
                            </div>

                            <div style={{ marginBottom: '0.5rem' }}>
                              <label style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>Headers (JSON)</label>
                              <textarea
                                value={typeof tool.headers === 'object' ? JSON.stringify(tool.headers, null, 2) : tool.headers || '{}'}
                                onChange={(e) => {
                                  const tools = [...(data.tools || [])]
                                  try {
                                    tools[index] = { ...tool, headers: JSON.parse(e.target.value) }
                                  } catch {
                                    tools[index] = { ...tool, headers: e.target.value }
                                  }
                                  updateData('tools', tools)
                                }}
                                placeholder='{"Authorization": "Bearer ${{secret.API_KEY}}"}'
                                rows={2}
                                style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}
                              />
                              <FieldHelper
                                description="Headers enviados na requisição HTTP. Use ${{secret.NOME}} para credenciais guardadas nas configurações do fluxo."
                                example={JSON.stringify({
                                  "Authorization": "Bearer ${{secret.API_KEY}}",
                                  "Content-Type": "application/json"
                                }, null, 2)}
                                onUseExample={(ex) => {
                                  const tools = [...(data.tools || [])]
                                  try {
                                    tools[index] = { ...tool, headers: JSON.parse(ex) }
                                  } catch {
                                    tools[index] = { ...tool, headers: ex }
                                  }
                                  updateData('tools', tools)
                                }}
                              />
                            </div>
                          </>
                        )}

                        <div style={{ marginBottom: '0.5rem' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>
                            Parâmetros (JSON Schema)
                          </label>
                          <textarea
                            value={typeof tool.parameters === 'object' ? JSON.stringify(tool.parameters, null, 2) : tool.parameters || '{}'}
                            onChange={(e) => {
                              const tools = [...(data.tools || [])]
                              try {
                                tools[index] = { ...tool, parameters: JSON.parse(e.target.value) }
                              } catch {
                                tools[index] = { ...tool, parameters: e.target.value }
                              }
                              updateData('tools', tools)
                            }}
                            placeholder='{"type": "object", "properties": {}, "required": []}'
                            rows={4}
                            style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}
                          />
                          <FieldHelper
                            title="Como definir parâmetros"
                            description="Os parâmetros dizem à IA quais dados ela precisa extrair da conversa para executar esta tool. Use JSON Schema. O campo 'description' é o mais importante — a IA usa ele para entender o que preencher."
                            example={JSON.stringify({
                              type: "object",
                              properties: {
                                cpf: {
                                  type: "string",
                                  description: "CPF do cliente, somente números (11 dígitos)"
                                },
                                tipo_pessoa: {
                                  type: "string",
                                  enum: ["fisica", "juridica"],
                                  description: "Tipo de pessoa: fisica ou juridica"
                                },
                                incluir_pedidos: {
                                  type: "boolean",
                                  description: "Se deve incluir pedidos na resposta"
                                }
                              },
                              required: ["cpf"]
                            }, null, 2)}
                            onUseExample={(ex) => {
                              const tools = [...(data.tools || [])]
                              try {
                                tools[index] = { ...tool, parameters: JSON.parse(ex) }
                              } catch {
                                tools[index] = { ...tool, parameters: ex }
                              }
                              updateData('tools', tools)
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {(!data.tools || data.tools.length === 0) && (
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  textAlign: 'center',
                  color: '#666',
                  fontSize: '0.85rem'
                }}>
                  Nenhuma tool configurada. O agente responderá apenas com base no prompt.
                </div>
              )}
            </div>

            <div style={{
              padding: '0.75rem',
              backgroundColor: '#e8eaf6',
              borderRadius: '4px',
              marginTop: '1rem',
              fontSize: '0.8rem'
            }}>
              <strong>🧠 Como funciona o Agente IA:</strong>
              <br />
              • O agente recebe a mensagem do usuário e executa o prompt
              <br />
              • Se tools estão configuradas, a IA pode chamá-las automaticamente
              <br />
              • O agente executa um loop: responde → chama tool → recebe resultado → responde
              <br />
              • O histórico da conversa é mantido enquanto o usuário estiver neste nó
              <br />
              • <strong>HTTP:</strong> faz requisições a APIs externas
              <br />
              • <strong>Contexto:</strong> busca dados da conversa
              <br />
              • <strong>Custom:</strong> tool genérica (para extensibilidade futura)
            </div>
          </>
        )

      case 'ai_tool':
        return (
          <>
            <div className="form-group">
              <label>Nome da Tool</label>
              <input
                type="text"
                value={data.name || ''}
                onChange={(e) => updateData('name', e.target.value)}
                placeholder="Ex: buscar_cep, consultar_pedido"
                style={{ fontFamily: 'monospace' }}
              />
              <FieldHelper
                description="Use snake_case sem espaços ou caracteres especiais. Escolha um nome que descreva claramente a ação, como buscar_cliente, criar_pedido, verificar_estoque."
              />
            </div>

            <div className="form-group">
              <label>Tipo da Tool</label>
              <select
                value={data.tool_type || 'http_request'}
                onChange={(e) => updateData('tool_type', e.target.value)}
              >
                <option value="http_request">🌐 HTTP Request</option>
                <option value="context_lookup">💾 Buscar Contexto</option>
                <option value="function">⚡ Custom Function</option>
              </select>
            </div>

            <div className="form-group">
              <label>Descrição</label>
              <textarea
                value={data.description || ''}
                onChange={(e) => updateData('description', e.target.value)}
                placeholder="Descreva o que esta tool faz. A IA usa isso para decidir quando chamá-la."
                rows={3}
              />
              <FieldHelper
                title="Por que a descrição é importante?"
                description="A IA lê a descrição para decidir QUANDO usar esta tool. Seja claro e específico. Diga exatamente o que a tool faz e em qual situação deve ser usada."
                example={`Busca dados de um cliente pelo CPF no sistema ERP. Use quando o usuário informar seu CPF ou pedir informações sobre sua conta, pedidos ou cadastro.`}
                onUseExample={(ex) => updateData('description', ex)}
              />
            </div>

            {(data.tool_type || 'http_request') === 'http_request' && (
              <>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0' }}>
                  <div className="form-group" style={{ width: '120px' }}>
                    <label>Método</label>
                    <select
                      value={data.method || 'GET'}
                      onChange={(e) => updateData('method', e.target.value)}
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                      <option value="PATCH">PATCH</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>URL</label>
                    <input
                      type="text"
                      value={data.url || ''}
                      onChange={(e) => updateData('url', e.target.value)}
                      placeholder="https://api.example.com/endpoint/{param}"
                    />
                    <FieldHelper
                      title="Variáveis na URL"
                      description={`Use \${{campo}} para valores do contexto e {param} para a IA preencher automaticamente. Parâmetros que não estão na URL vão como query string (GET) ou body (POST).`}
                      example="https://api.erp.com/clientes/{cpf}?incluir=${{flag}}"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Headers (JSON)</label>
                  <textarea
                    value={typeof data.headers === 'object' ? JSON.stringify(data.headers, null, 2) : data.headers || '{}'}
                    onChange={(e) => {
                      try {
                        updateData('headers', JSON.parse(e.target.value))
                      } catch {
                        updateData('headers', e.target.value)
                      }
                    }}
                    placeholder='{"Authorization": "Bearer ${{secret.API_KEY}}"}'
                    rows={3}
                    style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                  />
                  <FieldHelper
                    description="Headers enviados na requisição HTTP. Use ${{secret.NOME}} para credenciais guardadas nas configurações do fluxo."
                    example={JSON.stringify({
                      "Authorization": "Bearer ${{secret.API_KEY}}",
                      "Content-Type": "application/json"
                    }, null, 2)}
                    onUseExample={(ex) => {
                      try { updateData('headers', JSON.parse(ex)) } catch { updateData('headers', ex) }
                    }}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Parâmetros (JSON Schema)</label>
              <textarea
                value={typeof data.parameters === 'object' ? JSON.stringify(data.parameters, null, 2) : data.parameters || '{}'}
                onChange={(e) => {
                  try {
                    updateData('parameters', JSON.parse(e.target.value))
                  } catch {
                    updateData('parameters', e.target.value)
                  }
                }}
                placeholder='{"type": "object", "properties": {}, "required": []}'
                rows={5}
                style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
              />
              <FieldHelper
                title="Como definir parâmetros"
                description="Os parâmetros dizem à IA quais dados ela precisa extrair da conversa para executar esta tool. Use JSON Schema. O campo 'description' é o mais importante — a IA usa ele para entender o que preencher."
                example={JSON.stringify({
                  type: "object",
                  properties: {
                    cpf: {
                      type: "string",
                      description: "CPF do cliente, somente números (11 dígitos)"
                    },
                    tipo_pessoa: {
                      type: "string",
                      enum: ["fisica", "juridica"],
                      description: "Tipo de pessoa: fisica ou juridica"
                    },
                    incluir_pedidos: {
                      type: "boolean",
                      description: "Se deve incluir pedidos na resposta"
                    }
                  },
                  required: ["cpf"]
                }, null, 2)}
                onUseExample={(ex) => {
                  try { updateData('parameters', JSON.parse(ex)) } catch { updateData('parameters', ex) }
                }}
              />
            </div>

            <div style={{
              padding: '0.75rem',
              backgroundColor: '#fff3e0',
              borderRadius: '4px',
              marginTop: '1rem',
              fontSize: '0.8rem'
            }}>
              <strong>🔧 Como usar:</strong>
              <br />
              • Conecte este nó na entrada (topo) de um nó <strong>🧠 Agente IA</strong>
              <br />
              • O agente descobrirá automaticamente as tools conectadas
              <br />
              • Você pode conectar várias tools no mesmo agente
              <br />
              • Tools inline (dentro do agente) e tools conectadas funcionam juntas
            </div>
          </>
        )

      case 'input':
        return (
          <>
            <div className="form-group">
              <label>Tipo de Input</label>
              <select
                value={data.input_type || 'text'}
                onChange={(e) => updateData('input_type', e.target.value)}
              >
                <option value="text">Texto</option>
                <option value="number">Número</option>
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
                <option value="cpf_cnpj">CPF ou CNPJ</option>
                <option value="email">Email</option>
                <option value="regex">Regex (Personalizado)</option>
              </select>
            </div>

            {/* Campo de padrão regex - só aparece quando tipo for regex */}
            {data.input_type === 'regex' && (
              <div className="form-group">
                <label>Padrão Regex</label>
                <input
                  type="text"
                  value={data.validation?.pattern || ''}
                  onChange={(e) =>
                    updateData('validation', {
                      ...data.validation,
                      pattern: e.target.value,
                    })
                  }
                  placeholder="Ex: ^[0-9]{4}$ para 4 dígitos"
                />
                <small style={{ color: '#666' }}>
                  Expressão regular para validar o input. Exemplos:
                  <br />• ^[0-9]{'{4}'}$ - 4 dígitos
                  <br />• ^[A-Z]{'{3}'}[0-9]{'{4}'}$ - 3 letras maiúsculas + 4 números
                  <br />• ^\d{'{2}'}/\d{'{2}'}/\d{'{4}'}$ - Data DD/MM/AAAA
                </small>
              </div>
            )}

            <div className="form-group">
              <label>Chave no contexto</label>
              <input
                type="text"
                value={data.context_key || ''}
                onChange={(e) => updateData('context_key', e.target.value)}
                placeholder="Ex: cpf, phone, email"
              />
              <small style={{ color: '#666' }}>
                Nome da variável onde o valor será salvo
              </small>
            </div>
            <div className="form-group">
              <label>Mensagem de erro (opcional)</label>
              <input
                type="text"
                value={data.validation?.error_message || ''}
                onChange={(e) =>
                  updateData('validation', {
                    ...data.validation,
                    error_message: e.target.value,
                  })
                }
                placeholder="Mensagem quando a validação falhar"
              />
            </div>
            <div className="form-group">
              <label>Rótulo</label>
              <input
                type="text"
                value={data.label || ''}
                onChange={(e) => updateData('label', e.target.value)}
              />
            </div>
          </>
        )

      case 'media':
        return (
          <>
            <div className="form-group">
              <label>Tipo de Mídia</label>
              <select
                value={data.media_type || 'document'}
                onChange={(e) => updateData('media_type', e.target.value)}
              >
                <option value="document">Documento (PDF, etc)</option>
                <option value="image">Imagem (JPG, PNG, etc)</option>
              </select>
            </div>
            <div className="form-group">
              <label>URL do Arquivo</label>
              <AutocompleteTextarea
                value={data.url || ''}
                onChange={(e) => updateData('url', e.target.value)}
                placeholder="https://exemplo.com/arquivo.pdf ou ${{variavel}}"
                rows={2}
              />
              <small style={{ color: '#666' }}>
                URL direta para o arquivo. Suporta variáveis do contexto.
              </small>
            </div>
            {data.media_type !== 'image' && (
              <div className="form-group">
                <label>Nome do Arquivo (opcional)</label>
                <input
                  type="text"
                  value={data.file_name || ''}
                  onChange={(e) => updateData('file_name', e.target.value)}
                  placeholder="Ex: boleto.pdf"
                />
              </div>
            )}
            <div className="form-group">
              <label>Legenda (opcional)</label>
              <AutocompleteTextarea
                value={data.caption || ''}
                onChange={(e) => updateData('caption', e.target.value)}
                placeholder="Texto enviado junto com a mídia"
                rows={2}
              />
            </div>
            <div className="form-group">
              <label>Rótulo do Nó</label>
              <input
                type="text"
                value={data.label || ''}
                onChange={(e) => updateData('label', e.target.value)}
                placeholder="Nome exibido no editor"
              />
            </div>
          </>
        )

      default:
        return (
          <div className="form-group">
            <label>Dados (JSON)</label>
            <textarea
              value={JSON.stringify(data, null, 2)}
              onChange={(e) => {
                try {
                  setData(JSON.parse(e.target.value))
                } catch (err) {
                  // Ignora erro de parse durante digitação
                }
              }}
              style={{ fontFamily: 'monospace' }}
            />
          </div>
        )
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* Header fixo */}
        <div style={{
          padding: '2rem 2rem 1rem 2rem',
          borderBottom: '1px solid #e0e0e0',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0 }}>Editar Nó: {node.type}</h2>
              <p style={{ color: '#666', margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>ID: {node.id}</p>
            </div>

            {/* Botão Play para testar API Request */}
            {node.type === 'api_request' && (
            <button
              type="button"
              onClick={testApiRequest}
              disabled={testLoading || !data.url}
              title={!data.url ? "Preencha a URL antes de testar" : "Testar requisição"}
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.9rem',
                border: '1px solid',
                borderColor: testLoading ? '#ddd' : (!data.url ? '#ddd' : '#2196F3'),
                borderRadius: '6px',
                backgroundColor: testLoading ? '#f5f5f5' : (!data.url ? '#f5f5f5' : '#fff'),
                color: testLoading ? '#999' : (!data.url ? '#999' : '#2196F3'),
                cursor: testLoading || !data.url ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                fontWeight: '500',
                boxShadow: 'none',
              }}
              onMouseEnter={(e) => {
                if (!testLoading && data.url) {
                  e.target.style.backgroundColor = '#2196F3'
                  e.target.style.color = '#fff'
                  e.target.style.borderColor = '#2196F3'
                }
              }}
              onMouseLeave={(e) => {
                if (!testLoading && data.url) {
                  e.target.style.backgroundColor = '#fff'
                  e.target.style.color = '#2196F3'
                  e.target.style.borderColor = '#2196F3'
                }
              }}
            >
              {testLoading ? '⏳' : '▶'} {!testLoading && 'Testar'}
            </button>
          )}
          </div>
        </div>

        {/* Conteúdo com scroll */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem 2rem',
        }}>
          {renderForm()}
        </div>

        {/* Footer fixo */}
        <div style={{
          padding: '1rem 2rem 2rem 2rem',
          borderTop: '1px solid #e0e0e0',
          flexShrink: 0
        }}>
          <div className="modal-actions" style={{ margin: 0 }}>
            <button className="btn btn-danger" onClick={onDelete}>
              Excluir Nó
            </button>
            <button className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              Salvar
            </button>
          </div>
        </div>
      </div>

      {showFieldsModal && (
        <ContextFieldsModal onClose={() => setShowFieldsModal(false)} />
      )}
    </div>
  )
}

export default NodeEditorModal
