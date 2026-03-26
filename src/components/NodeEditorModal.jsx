import { useState, useEffect } from 'react'
import api from '../config/axios'
import ContextFieldsModal from './ContextFieldsModal'
import AutocompleteTextarea from './AutocompleteTextarea'
import FieldHelper from './FieldHelper'
import ApiKeyField from './ApiKeyField'
import KnowledgeBasePanel from './KnowledgeBasePanel'

// Extrai todos os caminhos possíveis de um JSON
function extractJsonPaths(obj, prefix = '', maxDepth = 5) {
  const paths = []
  const _extract = (value, currentPath, depth) => {
    if (depth > maxDepth) return
    if (Array.isArray(value)) {
      paths.push({ path: currentPath, isArray: true, example: `[${value.length} items]` })
      // Entra no primeiro item para extrair campos do array
      if (value.length > 0 && typeof value[0] === 'object') {
        _extract(value[0], currentPath, depth + 1)
      }
    } else if (value !== null && typeof value === 'object') {
      for (const [key, val] of Object.entries(value)) {
        const newPath = currentPath ? `${currentPath}.${key}` : key
        if (Array.isArray(val)) {
          paths.push({ path: newPath, isArray: true, example: `[${val.length} items]` })
          if (val.length > 0 && typeof val[0] === 'object') {
            _extract(val[0], newPath, depth + 1)
          } else if (val.length > 0) {
            paths.push({ path: `${newPath}.*`, example: val[0] })
          }
        } else if (val !== null && typeof val === 'object') {
          paths.push({ path: newPath, example: '{...}' })
          _extract(val, newPath, depth + 1)
        } else {
          paths.push({ path: newPath, example: val })
        }
      }
    }
  }
  _extract(obj, prefix)
  return paths
}

function NodeEditorModal({ node, nodes = [], edges = [], onSave, onDelete, onClose, flowId }) {
  const [data, setData] = useState(node.data)
  const [showFieldsModal, setShowFieldsModal] = useState(false)
  const [expandedOption, setExpandedOption] = useState(null)
  const [apiFields, setApiFields] = useState([])
  const [apiFieldsLoading, setApiFieldsLoading] = useState(false)
  const [apiFieldsError, setApiFieldsError] = useState(null)
  const [apiRawResult, setApiRawResult] = useState(null)
  const [showRawPayload, setShowRawPayload] = useState(false)

  // Estado para exemplo de resposta
  const [showResponseExample, setShowResponseExample] = useState(false)

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

  // Detecta se o nó está dentro de um loop (conectado a loop_body)
  const loopContext = (() => {
    // Verifica se algum edge aponta para este nó vindo de um handle loop_body
    for (const edge of edges) {
      if (edge.target === node.id && edge.sourceHandle === 'loop_body') {
        const loopNode = nodes.find(n => n.id === edge.source)
        if (loopNode && loopNode.type === 'loop') {
          return loopNode.data
        }
      }
    }
    // Verifica indiretamente — se algum nó pai na cadeia vem de um loop
    // (para nós mais profundos no corpo do loop)
    const visited = new Set()
    const findLoopParent = (nodeId) => {
      if (visited.has(nodeId)) return null
      visited.add(nodeId)
      for (const edge of edges) {
        if (edge.target === nodeId) {
          if (edge.sourceHandle === 'loop_body') {
            const loopNode = nodes.find(n => n.id === edge.source)
            if (loopNode && loopNode.type === 'loop') return loopNode.data
          }
          const result = findLoopParent(edge.source)
          if (result) return result
        }
      }
      return null
    }
    return findLoopParent(node.id)
  })()

  const loopSuggestions = loopContext ? [
    { label: `${loopContext.item_variable || 'item'}`, value: loopContext.item_variable || 'item', example: 'Item atual do loop' },
    { label: `${loopContext.item_variable || 'item'}.campo`, value: `${loopContext.item_variable || 'item'}.campo`, example: 'Campo do item' },
    { label: 'loop.index', value: 'loop.index', example: 'Índice (0, 1, 2...)' },
    { label: 'loop.key', value: 'loop.key', example: 'Chave (se dict)' },
    { label: 'loop.total', value: 'loop.total', example: 'Total de itens' },
    { label: 'loop.first', value: 'loop.first', example: 'true se primeiro' },
    { label: 'loop.last', value: 'loop.last', example: 'true se último' },
  ] : []

  // Estados para departamentos (nó transfer)
  const [departments, setDepartments] = useState([])
  const [loadingDepartments, setLoadingDepartments] = useState(false)
  const [departmentsError, setDepartmentsError] = useState(null)

  // Estados para status de tickets (nó set_ticket_status)
  const [ticketStatuses, setTicketStatuses] = useState([])
  const [loadingTicketStatuses, setLoadingTicketStatuses] = useState(false)
  const [ticketStatusesError, setTicketStatusesError] = useState(null)

  // Estados para usuários MonitChat (nó set_ticket_owner)
  const [mcUsers, setMcUsers] = useState([])
  const [loadingMcUsers, setLoadingMcUsers] = useState(false)
  const [mcUsersError, setMcUsersError] = useState(null)

  // Estados para contas WhatsApp e templates (nó whatsapp_template)
  const [waAccounts, setWaAccounts] = useState([])
  const [loadingWaAccounts, setLoadingWaAccounts] = useState(false)
  const [waAccountsError, setWaAccountsError] = useState(null)
  const [waTemplates, setWaTemplates] = useState([])
  const [loadingWaTemplates, setLoadingWaTemplates] = useState(false)
  const [waTemplatesError, setWaTemplatesError] = useState(null)

  // Estados para modelos de IA (nó ai_router)
  const [aiModels, setAiModels] = useState([])
  const [loadingAiModels, setLoadingAiModels] = useState(false)
  const [aiModelsError, setAiModelsError] = useState(null)

  // Estados para bases de conhecimento (RAG)
  const [knowledgeBases, setKnowledgeBases] = useState([])
  const [loadingKnowledgeBases, setLoadingKnowledgeBases] = useState(false)
  const [showKBPanel, setShowKBPanel] = useState(false) // abre o painel completo
  const [kbPanelCallback, setKbPanelCallback] = useState(null) // callback ao fechar

  // Estados para colapsar seções do API Request
  const [queryParamsExpanded, setQueryParamsExpanded] = useState(false)
  const [headersExpanded, setHeadersExpanded] = useState(false)
  const [bodyExpanded, setBodyExpanded] = useState(false)

  // Detecta se o nó anterior é uma chamada API
  // Encontra nó api_request ancestral com response_example
  const getAncestorApiExample = () => {
    const visited = new Set()
    const findApi = (nodeId) => {
      if (visited.has(nodeId)) return null
      visited.add(nodeId)
      for (const edge of edges) {
        if (edge.target === nodeId) {
          const sourceNode = nodes.find(n => n.id === edge.source)
          if (sourceNode) {
            if (sourceNode.type === 'api_request' && sourceNode.data.response_example) {
              return sourceNode.data
            }
            const result = findApi(sourceNode.id)
            if (result) return result
          }
        }
      }
      return null
    }
    return findApi(node.id)
  }

  const ancestorApiData = getAncestorApiExample()
  const apiExampleSuggestions = (() => {
    if (!ancestorApiData || !ancestorApiData._extracted_paths) return []

    // Se dentro de um loop, converte caminhos da API para item.campo
    if (loopContext && loopContext.source_variable) {
      const sourceVar = loopContext.source_variable
      const itemVar = loopContext.item_variable || 'item'
      const itemSuggestions = []
      for (const p of ancestorApiData._extracted_paths) {
        // Campos filhos do array selecionado → item.campo
        if (p.path.startsWith(sourceVar + '.') && !p.isArray) {
          const fieldName = p.path.replace(sourceVar + '.', '')
          itemSuggestions.push({
            label: `${itemVar}.${fieldName}`,
            value: `${itemVar}.${fieldName}`,
            example: p.example !== undefined ? String(p.example) : '',
          })
        }
      }
      // Retorna apenas campos do item (os de loop já estão em loopSuggestions)
      return itemSuggestions
    }

    // Sem loop: mostra caminhos completos da API
    return ancestorApiData._extracted_paths.map(p => ({
      label: p.path,
      value: p.path,
      example: p.isArray ? '📋 array' : (p.example !== undefined ? String(p.example) : ''),
    }))
  })()

  // Sugestões de variáveis do agendamento (arquivo CSV)
  const [scheduleSuggestions, setScheduleSuggestions] = useState([])
  useEffect(() => {
    if (!flowId) return
    api.get(`/api/v1/flows/${flowId}/schedules`).then(res => {
      if (!res.data?.success) return
      const schedules = res.data.data || []
      const fileSchedule = schedules.find(s => s.target_type === 'file' && s.target_config?.columns?.length > 0)
      if (!fileSchedule) return
      const tc = fileSchedule.target_config
      const cols = tc.columns || []
      const groupBy = tc.group_by
      const suggestions = []
      cols.forEach(col => {
        if (col === 'telefone') return
        suggestions.push({
          label: col,
          value: col,
          example: groupBy ? `Valores concatenados (\\n)` : 'Coluna do arquivo',
          source: '📄 Arquivo CSV',
        })
      })
      if (groupBy) {
        suggestions.push({
          label: 'linhas',
          value: 'linhas',
          example: 'Array com todas as linhas do grupo',
          source: '📄 Arquivo CSV',
        })
        suggestions.push({
          label: 'total_linhas',
          value: 'total_linhas',
          example: 'Quantidade de linhas no grupo',
          source: '📄 Arquivo CSV',
        })
        cols.filter(c => c !== 'telefone').forEach(col => {
          suggestions.push({
            label: `linhas[].${col}`,
            value: `linhas[].${col}`,
            example: `Campo "${col}" de cada item (para format_list)`,
            source: '📄 Arquivo CSV',
          })
        })
      }
      setScheduleSuggestions(suggestions)
    }).catch(() => {})
  }, [flowId])

  // Combina sugestões de loop + API example + agendamento
  const allExtraSuggestions = [...loopSuggestions, ...apiExampleSuggestions, ...scheduleSuggestions]

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
  const fetchKnowledgeBases = async () => {
    if (!flowId) return
    try {
      setLoadingKnowledgeBases(true)
      const res = await api.get(`/api/v1/knowledge/bases/${flowId}`)
      if (res.data.success) {
        setKnowledgeBases(res.data.data || [])
      }
    } catch (err) {
      console.error('Error loading knowledge bases:', err)
    } finally {
      setLoadingKnowledgeBases(false)
    }
  }

  const openKBPanel = (callback) => {
    setKbPanelCallback(() => callback)
    setShowKBPanel(true)
  }

  const closeKBPanel = () => {
    setShowKBPanel(false)
    fetchKnowledgeBases() // recarrega lista ao fechar
  }

  // Busca usuários da API do MonitChat
  const fetchMonitchatUsers = async () => {
    setLoadingMcUsers(true)
    setMcUsersError(null)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        'https://api-v2.monitchat.com/api/v1/user?skip=0&take=500&order=name&order_direction=asc',
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
      const users = (result.data || []).filter((u) => u.active)
      users.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      setMcUsers(users)
    } catch (error) {
      console.error('Error fetching MonitChat users:', error)
      setMcUsersError(error.message || 'Erro ao buscar usuários')
    } finally {
      setLoadingMcUsers(false)
    }
  }

  // Busca contas WhatsApp da API do MonitChat
  const fetchWhatsAppAccounts = async () => {
    setLoadingWaAccounts(true)
    setWaAccountsError(null)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        'https://api-v2.monitchat.com/api/v1/social/whatsapp',
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
      const accountsList = (result.data || []).filter(
        (acc) => acc.whatsapp_account_key
      )
      setWaAccounts(accountsList)

      // Se já tem account_id selecionado, busca templates
      if (data.account_id) {
        fetchWhatsAppTemplates(data.account_id)
      }
    } catch (error) {
      console.error('Error fetching WhatsApp accounts:', error)
      setWaAccountsError(error.message || 'Erro ao buscar contas WhatsApp')
    } finally {
      setLoadingWaAccounts(false)
    }
  }

  // Busca templates WhatsApp de uma conta específica
  const fetchWhatsAppTemplates = async (accountId) => {
    setLoadingWaTemplates(true)
    setWaTemplatesError(null)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `https://api-v2.monitchat.com/api/v1/social/${accountId}/templates`,
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
      const templates = (result.templates || []).filter(
        (t) => t.status?.toUpperCase() === 'APPROVED'
      )
      // Ordena por nome
      templates.sort((a, b) => a.name.localeCompare(b.name))
      setWaTemplates(templates)
    } catch (error) {
      console.error('Error fetching WhatsApp templates:', error)
      setWaTemplatesError(error.message || 'Erro ao buscar templates')
    } finally {
      setLoadingWaTemplates(false)
    }
  }

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
      setAiModels([])
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
      setAiModels([])
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

    // Carrega departamentos se for transfer ou ai_agent
    if (node.type === 'transfer' || node.type === 'ai_agent') {
      fetchDepartments()
    }

    // Carrega bases de conhecimento se for ai_agent ou ai_tool
    if ((node.type === 'ai_agent' || node.type === 'ai_tool') && flowId) {
      fetchKnowledgeBases()
    }

    // Carrega status de tickets se for set_ticket_status
    if (node.type === 'set_ticket_status') {
      fetchTicketStatuses()
    }

    // Carrega usuários se for set_ticket_owner
    if (node.type === 'set_ticket_owner') {
      fetchMonitchatUsers()
    }

    // Carrega contas WhatsApp se for whatsapp_template
    if (node.type === 'whatsapp_template') {
      fetchWhatsAppAccounts()
    }
  }, [node.type, node.id])

  // Busca modelos de IA quando API key ou provedor mudar
  useEffect(() => {
    if (node.type !== 'ai_router' && node.type !== 'ai_agent') return

    const apiKey = data.api_key
    const provider = data.ai_provider || 'openai'

    if (!apiKey || apiKey.trim().length < 10) {
      setAiModels([])
      return
    }

    // env — não resolve no frontend
    if (apiKey.includes('${{env.')) {
      setAiModels([])
      return
    }

    const timer = setTimeout(async () => {
      let resolvedKey = apiKey

      // Se for variável de secret, resolve o valor real
      if (apiKey.includes('${{secret.')) {
        const match = apiKey.match(/\$\{\{secret\.(.+?)\}\}/)
        if (match && flowId) {
          try {
            const res = await api.get(`/api/v1/flows/${flowId}/secrets/resolve/${match[1]}`)
            if (res.data.success && res.data.data) {
              resolvedKey = res.data.data
            } else {
              setAiModels([])
              return
            }
          } catch {
            setAiModels([])
            return
          }
        } else {
          setAiModels([])
          return
        }
      }

      if (provider === 'openai') {
        fetchOpenAIModels(resolvedKey)
      } else if (provider === 'gemini') {
        fetchGeminiModels(resolvedKey)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [node.type, data.api_key, data.ai_provider, flowId])

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
                  extraSuggestions={allExtraSuggestions}
                value={data.message || ''}
                onChange={(e) => updateData('message', e.target.value)}
                placeholder="Digite a mensagem que será enviada"
                rows={4}
              />
              <FieldHelper
                description="Texto enviado ao usuário. Use variáveis para personalizar: ${{nome}} insere o nome do contexto. Digite $ no campo para ver as variáveis disponíveis."
                example={`Olá $\{{nome}}! 👋\nSeja bem-vindo à nossa loja. Como posso ajudar?`}
                onUseExample={(ex) => updateData('message', ex)}
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
                  extraSuggestions={allExtraSuggestions}
                value={data.header || ''}
                onChange={(e) => updateData('header', e.target.value)}
                placeholder="Título do cartão de botões (digite $ para autocompletar)"
                rows={1}
              />
            </div>
            <div className="form-group">
              <label>Mensagem</label>
              <AutocompleteTextarea
                  extraSuggestions={allExtraSuggestions}
                value={data.message || ''}
                onChange={(e) => updateData('message', e.target.value)}
                placeholder="Digite a mensagem acima dos botões (digite $ para autocompletar)"
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>Footer (opcional)</label>
              <AutocompleteTextarea
                  extraSuggestions={allExtraSuggestions}
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
              <FieldHelper
                description="Máximo 3 botões (limitação do WhatsApp). Digite um texto por linha. O texto do botão que o usuário clicar será a resposta dele e pode ser avaliado pelo próximo nó (Router, Condição, etc)."
                example={`Consultar pedido\nFalar com vendedor\nAssistência técnica`}
                onUseExample={(ex) => updateData('buttons', ex.split('\n'))}
              />
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
              <FieldHelper
                title="Formato das opções da lista"
                description="A lista do WhatsApp organiza opções em seções. Cada seção tem um título e uma lista de itens (rows) com id, title e description opcional."
                example={JSON.stringify([{
                  title: "Atendimento",
                  rows: [
                    { id: "1", title: "Consultar pedido", description: "Veja o status do seu pedido" },
                    { id: "2", title: "2ª via de boleto", description: "Receba o boleto por aqui" },
                    { id: "3", title: "Falar com vendedor", description: "Atendimento humano" }
                  ]
                }], null, 2)}
                onUseExample={(ex) => {
                  try {
                    updateData('action', { ...data.action, sections: JSON.parse(ex) })
                  } catch {}
                }}
              />
            </div>
          </>
        )

      case 'condition': {
        const conditions = data.conditions || []
        const addCondition = () => {
          const updated = [...conditions, { key: '', operator: 'eq', value: '', label: '' }]
          updateData('conditions', updated)
        }
        const removeCondition = (idx) => {
          const updated = conditions.filter((_, i) => i !== idx)
          updateData('conditions', updated)
        }
        const updateCondition = (idx, field, value) => {
          const updated = conditions.map((c, i) => i === idx ? { ...c, [field]: value } : c)
          updateData('conditions', updated)
        }
        const operators = [
          { value: 'eq', label: '== Igual (texto exato)', noValue: false },
          { value: 'neq', label: '!= Diferente', noValue: false },
          { value: 'gt', label: '> Maior que', noValue: false },
          { value: 'gte', label: '>= Maior ou igual', noValue: false },
          { value: 'lt', label: '< Menor que', noValue: false },
          { value: 'lte', label: '<= Menor ou igual', noValue: false },
          { value: 'contains', label: 'Contém (texto parcial)', noValue: false },
          { value: 'not_contains', label: 'Não contém', noValue: false },
          { value: 'starts_with', label: 'Começa com', noValue: false },
          { value: 'ends_with', label: 'Termina com', noValue: false },
          { value: 'exists', label: 'Existe (não vazio)', noValue: true },
          { value: 'not_exists', label: 'Não existe (vazio)', noValue: true },
          { value: 'is_number', label: 'É número', noValue: true },
          { value: 'is_positive', label: 'Resposta positiva (sim/ok/yes)', noValue: true },
          { value: 'in_list', label: 'Está na lista (separar por vírgula)', noValue: false },
          { value: 'not_in_list', label: 'Não está na lista', noValue: false },
          { value: 'regex', label: 'Expressão Regular', noValue: false },
        ]
        const selectedOp = operators.find(o => o.value === (data.conditions?.[0]?.operator)) || {}

        return (
          <>
            <div className="form-group">
              <label>Rótulo</label>
              <input
                type="text"
                value={data.label || ''}
                onChange={(e) => updateData('label', e.target.value)}
                placeholder="Ex: Verificar tipo de cliente"
              />
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text, #e2e8f0)', marginBottom: '0.5rem', display: 'block' }}>
                Condições ({conditions.length})
              </label>

              {conditions.map((cond, idx) => (
                <div key={idx} style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--bg-secondary, #1e293b)',
                  border: '1px solid var(--border, #475569)',
                  borderRadius: '8px',
                  marginBottom: '0.5rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.8rem', color: idx === 0 ? '#22c55e' : '#f59e0b' }}>
                      {idx === 0 ? 'IF' : `ELSE IF #${idx}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeCondition(idx)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem' }}
                    >🗑</button>
                  </div>

                  <div style={{ marginBottom: '0.4rem' }}>
                    <input
                      type="text"
                      value={cond.label || ''}
                      onChange={(e) => updateCondition(idx, 'label', e.target.value)}
                      placeholder="Rótulo da saída (ex: Cliente VIP)"
                      style={{
                        width: '100%', padding: '0.4rem', fontSize: '0.8rem',
                        backgroundColor: 'var(--bg-surface, #0f172a)', color: 'var(--text, #e2e8f0)',
                        border: '1px solid var(--border, #475569)', borderRadius: '6px',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '0.4rem' }}>
                    <small style={{ color: 'var(--text-dim, #94a3b8)', fontSize: '0.72rem' }}>Fonte do valor</small>
                    <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.3rem' }}>
                      <button
                        type="button"
                        onClick={() => updateCondition(idx, 'source', 'context')}
                        style={{
                          flex: 1, padding: '0.3rem', fontSize: '0.75rem', fontWeight: 600,
                          backgroundColor: (cond.source || 'context') === 'context' ? '#7C3AED' : 'transparent',
                          color: (cond.source || 'context') === 'context' ? '#fff' : 'var(--text-dim, #94a3b8)',
                          border: `1px solid ${(cond.source || 'context') === 'context' ? '#7C3AED' : 'var(--border, #475569)'}`,
                          borderRadius: '5px', cursor: 'pointer',
                        }}
                      >📦 Contexto</button>
                      <button
                        type="button"
                        onClick={() => updateCondition(idx, 'source', 'user_input')}
                        style={{
                          flex: 1, padding: '0.3rem', fontSize: '0.75rem', fontWeight: 600,
                          backgroundColor: cond.source === 'user_input' ? '#7C3AED' : 'transparent',
                          color: cond.source === 'user_input' ? '#fff' : 'var(--text-dim, #94a3b8)',
                          border: `1px solid ${cond.source === 'user_input' ? '#7C3AED' : 'var(--border, #475569)'}`,
                          borderRadius: '5px', cursor: 'pointer',
                        }}
                      >💬 Texto do usuário</button>
                    </div>

                    {(cond.source || 'context') === 'context' && (
                      <>
                        <small style={{ color: 'var(--text-dim, #94a3b8)', fontSize: '0.72rem' }}>Chave do contexto</small>
                        <input
                          type="text"
                          value={cond.key || ''}
                          onChange={(e) => updateCondition(idx, 'key', e.target.value)}
                          placeholder="Ex: tipo_cliente, api_response.status"
                          style={{
                            width: '100%', padding: '0.4rem', fontSize: '0.8rem',
                            backgroundColor: 'var(--bg-surface, #0f172a)', color: 'var(--text, #e2e8f0)',
                            border: '1px solid var(--border, #475569)', borderRadius: '6px',
                          }}
                        />
                      </>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <select
                      value={cond.operator || 'eq'}
                      onChange={(e) => updateCondition(idx, 'operator', e.target.value)}
                      style={{
                        flex: 1, padding: '0.4rem', fontSize: '0.8rem',
                        backgroundColor: 'var(--bg-surface, #0f172a)', color: 'var(--text, #e2e8f0)',
                        border: '1px solid var(--border, #475569)', borderRadius: '6px',
                      }}
                    >
                      {operators.map(op => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </select>

                    {!operators.find(o => o.value === cond.operator)?.noValue !== false && !['exists', 'not_exists', 'is_number', 'is_positive'].includes(cond.operator) && (
                      <input
                        type="text"
                        value={cond.value || ''}
                        onChange={(e) => updateCondition(idx, 'value', e.target.value)}
                        placeholder="Valor"
                        style={{
                          flex: 1, padding: '0.4rem', fontSize: '0.8rem',
                          backgroundColor: 'var(--bg-surface, #0f172a)', color: 'var(--text, #e2e8f0)',
                          border: '1px solid var(--border, #475569)', borderRadius: '6px',
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addCondition}
                style={{
                  width: '100%', padding: '0.5rem', fontSize: '0.82rem',
                  backgroundColor: 'transparent', color: '#7C3AED',
                  border: '1px dashed #7C3AED', borderRadius: '8px',
                  cursor: 'pointer', fontWeight: 500,
                }}
              >
                + Adicionar Condição
              </button>

              <div style={{
                marginTop: '0.5rem', padding: '0.5rem 0.75rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px', fontSize: '0.78rem', color: '#f87171',
              }}>
                🔴 <strong>ELSE</strong> — Saída padrão quando nenhuma condição acima é atendida (automática)
              </div>
            </div>

            <div style={{
              padding: '0.75rem',
              backgroundColor: 'rgba(124, 58, 237, 0.08)',
              borderRadius: '8px',
              fontSize: '0.78rem',
              color: 'var(--text-dim, #94a3b8)',
              lineHeight: 1.5,
            }}>
              💡 Cada condição gera uma saída no nó. Conecte cada saída ao destino desejado.
              A saída <strong>ELSE</strong> é usada quando nenhuma condição é verdadeira.
              As condições são avaliadas na ordem — a primeira que for verdadeira é executada.
            </div>
          </>
        )
      }

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
              <FieldHelper
                description="Exibida quando a resposta do usuário não combina com nenhuma opção. Ele pode tentar novamente. Se houver uma saída de 'erro' conectada, o fluxo segue por ela ao invés de mostrar esta mensagem."
                example="Opção inválida! Por favor, escolha uma das opções disponíveis."
                onUseExample={(ex) => updateData('error_message', ex)}
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
              <FieldHelper
                description="Se preenchido, a resposta do usuário será salva nesta chave do contexto, podendo ser usada em nós seguintes com ${{chave}}."
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
                  extraSuggestions={allExtraSuggestions}
                value={data.url || ''}
                onChange={(e) => updateData('url', e.target.value)}
                placeholder="https://api.exemplo.com/endpoint"
                rows={2}
              />
              <FieldHelper
                title="Como montar a URL"
                description="Informe o endpoint completo da API. Use variáveis do contexto para valores dinâmicos e credenciais guardadas em secrets."
                example={`https://$\{{secret.API_BASE}}/api/v1/clientes/$\{{cpf}}`}
                onUseExample={(ex) => updateData('url', ex)}
              />
            </div>

            {/* === Autenticação === */}
            <hr style={{ margin: '1rem 0', borderColor: 'var(--border-color, #333)' }} />

            <div className="form-group">
              <label>🔐 Autenticação</label>
              <select
                value={data.auth_type || 'none'}
                onChange={(e) => {
                  updateData('auth_type', e.target.value)
                  if (!data.auth_config) updateData('auth_config', {})
                }}
                style={{ backgroundColor: 'var(--input-bg, #1e1e2e)', color: 'var(--text-primary, #e0e0e0)', borderColor: 'var(--border-color, #333)' }}
              >
                <option value="none">Sem autenticação</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth (Usuário/Senha)</option>
                <option value="api_key">API Key</option>
                <option value="session">Sessão/Cookie (Login automático)</option>
              </select>
            </div>

            {data.auth_type === 'bearer' && (
              <div className="form-group" style={{ marginLeft: '1rem', padding: '0.8rem', borderLeft: '3px solid #7c3aed', backgroundColor: 'var(--card-bg, #1a1a2e)' }}>
                <label>Token</label>
                <AutocompleteTextarea
                  extraSuggestions={allExtraSuggestions}
                  value={(data.auth_config || {}).token || ''}
                  onChange={(e) => updateData('auth_config', { ...data.auth_config, token: e.target.value })}
                  placeholder="${{secret.API_TOKEN}}"
                  rows={1}
                />
                <small style={{ color: 'var(--text-secondary, #888)' }}>Use <code>{'${{secret.NOME}}'}</code> para referenciar uma credencial</small>
              </div>
            )}

            {data.auth_type === 'basic' && (
              <div style={{ marginLeft: '1rem', padding: '0.8rem', borderLeft: '3px solid #2563eb', backgroundColor: 'var(--card-bg, #1a1a2e)' }}>
                <div className="form-group">
                  <label>Usuário</label>
                  <AutocompleteTextarea
                  extraSuggestions={allExtraSuggestions}
                    value={(data.auth_config || {}).username || ''}
                    onChange={(e) => updateData('auth_config', { ...data.auth_config, username: e.target.value })}
                    placeholder="${{secret.API_USER}}"
                    rows={1}
                  />
                </div>
                <div className="form-group">
                  <label>Senha</label>
                  <AutocompleteTextarea
                  extraSuggestions={allExtraSuggestions}
                    value={(data.auth_config || {}).password || ''}
                    onChange={(e) => updateData('auth_config', { ...data.auth_config, password: e.target.value })}
                    placeholder="${{secret.API_PASSWORD}}"
                    rows={1}
                  />
                </div>
              </div>
            )}

            {data.auth_type === 'api_key' && (
              <div style={{ marginLeft: '1rem', padding: '0.8rem', borderLeft: '3px solid #059669', backgroundColor: 'var(--card-bg, #1a1a2e)' }}>
                <div className="form-group">
                  <label>Nome da Chave</label>
                  <input
                    type="text"
                    value={(data.auth_config || {}).key_name || 'X-API-Key'}
                    onChange={(e) => updateData('auth_config', { ...data.auth_config, key_name: e.target.value })}
                    placeholder="X-API-Key"
                  />
                </div>
                <div className="form-group">
                  <label>Valor</label>
                  <AutocompleteTextarea
                  extraSuggestions={allExtraSuggestions}
                    value={(data.auth_config || {}).key_value || ''}
                    onChange={(e) => updateData('auth_config', { ...data.auth_config, key_value: e.target.value })}
                    placeholder="${{secret.API_KEY}}"
                    rows={1}
                  />
                </div>
                <div className="form-group">
                  <label>Enviar como</label>
                  <select
                    value={(data.auth_config || {}).add_to || 'header'}
                    onChange={(e) => updateData('auth_config', { ...data.auth_config, add_to: e.target.value })}
                    style={{ backgroundColor: 'var(--input-bg, #1e1e2e)', color: 'var(--text-primary, #e0e0e0)', borderColor: 'var(--border-color, #333)' }}
                  >
                    <option value="header">Header</option>
                    <option value="query">Query Parameter</option>
                  </select>
                </div>
              </div>
            )}

            {data.auth_type === 'session' && (
              <div style={{ marginLeft: '1rem', padding: '0.8rem', borderLeft: '3px solid #f59e0b', backgroundColor: 'var(--card-bg, #1a1a2e)' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #888)', marginBottom: '0.8rem' }}>
                  O sistema faz login automaticamente, salva os cookies/token e renova em caso de 401.
                </p>
                <div className="form-group">
                  <label>URL de Login</label>
                  <AutocompleteTextarea
                  extraSuggestions={allExtraSuggestions}
                    value={(data.auth_config || {}).login_url || ''}
                    onChange={(e) => updateData('auth_config', { ...data.auth_config, login_url: e.target.value })}
                    placeholder="https://api.exemplo.com/auth/login"
                    rows={1}
                  />
                </div>
                <div className="form-group">
                  <label>Método de Login</label>
                  <select
                    value={(data.auth_config || {}).login_method || 'POST'}
                    onChange={(e) => updateData('auth_config', { ...data.auth_config, login_method: e.target.value })}
                    style={{ backgroundColor: 'var(--input-bg, #1e1e2e)', color: 'var(--text-primary, #e0e0e0)', borderColor: 'var(--border-color, #333)' }}
                  >
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Body de Login (JSON)</label>
                  <AutocompleteTextarea
                  extraSuggestions={allExtraSuggestions}
                    value={(data.auth_config || {}).login_body || ''}
                    onChange={(e) => updateData('auth_config', { ...data.auth_config, login_body: e.target.value })}
                    placeholder={'{\n  "username": "${{secret.USER}}",\n  "password": "${{secret.PASS}}"\n}'}
                    rows={4}
                  />
                  <FieldHelper
                    title="Formato do body de login"
                    description="JSON com as credenciais. Use secrets para não expor senhas."
                    example={'{\n  "serviceName": "MobileLoginSP.login",\n  "requestBody": {\n    "NOMUSU": {"$": "${{secret.SANKHYA_USER}}"},\n    "INTERNO": {"$": "${{secret.SANKHYA_PASS}}"},\n    "KEEPCONNECTED": {"$": "S"}\n  }\n}'}
                    onUseExample={(ex) => updateData('auth_config', { ...data.auth_config, login_body: ex })}
                  />
                </div>
                <div className="form-group">
                  <label>Extrair Token do Body (opcional)</label>
                  <input
                    type="text"
                    value={(data.auth_config || {}).token_path || ''}
                    onChange={(e) => updateData('auth_config', { ...data.auth_config, token_path: e.target.value })}
                    placeholder="data.access_token"
                  />
                  <small style={{ color: 'var(--text-secondary, #888)' }}>
                    Caminho no JSON de resposta. Ex: <code>data.token</code>, <code>access_token</code>.
                    Se vazio, usa apenas cookies.
                  </small>
                </div>
                <div className="form-group">
                  <label>Header do Token (opcional)</label>
                  <input
                    type="text"
                    value={(data.auth_config || {}).token_header || ''}
                    onChange={(e) => updateData('auth_config', { ...data.auth_config, token_header: e.target.value })}
                    placeholder="Authorization"
                  />
                  <small style={{ color: 'var(--text-secondary, #888)' }}>
                    Nome do header onde o token extraído será enviado. Padrão: <code>Authorization</code>
                  </small>
                </div>
              </div>
            )}

            <hr style={{ margin: '1rem 0', borderColor: 'var(--border-color, #333)' }} />

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
                  extraSuggestions={allExtraSuggestions}
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
                  extraSuggestions={allExtraSuggestions}
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
                  extraSuggestions={allExtraSuggestions}
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
              <FieldHelper
                description={`A resposta da API será salva nesta chave. Depois use $\{{${data.context_key || 'api_response'}.campo}} para acessar campos da resposta. Também ficam disponíveis: $\{{${data.context_key || 'api_response'}_status}} (código HTTP) e $\{{${data.context_key || 'api_response'}_success}} (true/false).`}
              />
            </div>

            <div
              style={{
                padding: '0.75rem',
                backgroundColor: 'var(--card-bg, #e3f2fd)',
                borderRadius: '4px',
                marginTop: '1rem',
                fontSize: '0.8rem',
              }}
            >
              <strong>💡 Como usar:</strong>
              <br />
              • A resposta completa será salva em <code style={{background: 'var(--input-bg, #fff)', padding: '0.1rem 0.3rem'}}>{data.context_key || 'api_response'}</code>
              <br />
              • Use $&#123;&#123;{data.context_key || 'api_response'}.campo&#125;&#125; para acessar campos da resposta
              <br />
              • Variáveis do contexto podem ser usadas na URL, query params, headers e body
            </div>

            {/* Exemplo de Resposta */}
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <div
                onClick={() => setShowResponseExample(!showResponseExample)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  backgroundColor: 'var(--card-bg, #f5f5f5)',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color, #ddd)',
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  📋 Exemplo de Resposta (JSON)
                  {data.response_example && <span style={{ color: '#4CAF50', marginLeft: '0.5rem', fontSize: '0.75rem' }}>✓ configurado</span>}
                </span>
                <span style={{ transform: showResponseExample ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
              </div>
              {showResponseExample && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.3rem', marginBottom: '0.3rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const raw = data.response_example || ''
                        // Tenta corrigir JSON comum
                        let fixed = raw
                          // Remove quebras de linha dentro de strings (multiline)
                          .replace(/"([^"]*)"/gs, (match) => match.replace(/\n/g, ' '))
                          // Adiciona aspas em chaves sem aspas
                          .replace(/([{[,]\s*)(\w+)\s*:/g, '$1"$2":')
                          // Remove vírgulas antes de } ou ]
                          .replace(/,\s*([}\]])/g, '$1')
                        try {
                          const parsed = JSON.parse(fixed)
                          const pretty = JSON.stringify(parsed, null, 2)
                          updateData('response_example', pretty)
                          const paths = extractJsonPaths(parsed, data.context_key || 'api_response')
                          updateData('_extracted_paths', paths)
                        } catch {
                          // Tenta eval como último recurso (para JSON com aspas simples, etc)
                          try {
                            // eslint-disable-next-line no-eval
                            const parsed = eval('(' + raw + ')')
                            const pretty = JSON.stringify(parsed, null, 2)
                            updateData('response_example', pretty)
                            const paths = extractJsonPaths(parsed, data.context_key || 'api_response')
                            updateData('_extracted_paths', paths)
                          } catch {
                            alert('Não foi possível corrigir o JSON. Verifique a formatação.')
                          }
                        }
                      }}
                      style={{
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.75rem',
                        backgroundColor: 'var(--accent, #7c3aed)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      ✨ Formatar / Corrigir JSON
                    </button>
                    {data.response_example && (
                      <button
                        type="button"
                        onClick={() => {
                          updateData('response_example', '')
                          updateData('_extracted_paths', null)
                        }}
                        style={{
                          padding: '0.25rem 0.6rem',
                          fontSize: '0.75rem',
                          backgroundColor: 'transparent',
                          color: '#F44336',
                          border: '1px solid #F44336',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        🗑️ Limpar
                      </button>
                    )}
                  </div>
                  <textarea
                    value={data.response_example || ''}
                    onChange={(e) => {
                      updateData('response_example', e.target.value)
                      // Tenta parsear e extrair campos
                      try {
                        const parsed = JSON.parse(e.target.value)
                        const paths = extractJsonPaths(parsed, data.context_key || 'api_response')
                        updateData('_extracted_paths', paths)
                      } catch {
                        // JSON inválido - não atualiza paths (mantém os anteriores)
                      }
                    }}
                    placeholder={'Cole aqui um exemplo da resposta da API.\nPode ser JSON com ou sem aspas nas chaves.\nClique "Formatar" para corrigir automaticamente.'}
                    rows={8}
                    style={{
                      width: '100%',
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      backgroundColor: 'var(--input-bg, #1e1e2e)',
                      color: 'var(--text-primary, #e0e0e0)',
                      border: `1px solid ${data.response_example && !data._extracted_paths ? '#F44336' : 'var(--border-color, #333)'}`,
                      borderRadius: '4px',
                      padding: '0.5rem',
                      resize: 'vertical',
                    }}
                  />
                  <small style={{ color: data.response_example && !data._extracted_paths ? '#F44336' : 'var(--text-secondary, #888)' }}>
                    {data.response_example && !data._extracted_paths
                      ? '⚠️ JSON inválido — clique "Formatar / Corrigir" para tentar corrigir automaticamente'
                      : 'Cole um exemplo da resposta JSON. Os campos serão sugeridos nos nós seguintes.'
                    }
                  </small>

                  {/* Preview dos caminhos extraídos */}
                  {data._extracted_paths && data._extracted_paths.length > 0 && (
                    <div style={{
                      marginTop: '0.5rem',
                      padding: '0.5rem',
                      backgroundColor: 'rgba(76, 175, 80, 0.1)',
                      border: '1px solid rgba(76, 175, 80, 0.3)',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      maxHeight: '150px',
                      overflowY: 'auto',
                    }}>
                      <strong style={{ color: '#4CAF50' }}>Campos detectados ({data._extracted_paths.length}):</strong>
                      <div style={{ marginTop: '0.3rem', fontFamily: 'monospace', lineHeight: 1.6 }}>
                        {data._extracted_paths.slice(0, 20).map((p, i) => (
                          <div key={i}>
                            <code style={{ color: p.isArray ? '#f59e0b' : 'var(--text-primary, #e0e0e0)' }}>
                              {'${{' + p.path + '}}'}
                            </code>
                            {p.isArray && <span style={{ color: '#f59e0b', marginLeft: '0.3rem' }}>📋 array</span>}
                            {p.example !== undefined && (
                              <span style={{ color: 'var(--text-secondary, #888)', marginLeft: '0.5rem' }}>
                                = {typeof p.example === 'string' ? `"${p.example}"` : String(p.example)}
                              </span>
                            )}
                          </div>
                        ))}
                        {data._extracted_paths.length > 20 && (
                          <div style={{ color: 'var(--text-secondary, #888)' }}>... e mais {data._extracted_paths.length - 20} campos</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
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
                  extraSuggestions={allExtraSuggestions}
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
                  extraSuggestions={allExtraSuggestions}
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
              <FieldHelper
                description="Pausa a execução do fluxo pelo tempo definido (1 a 300 segundos). Útil para simular digitação, dar tempo ao usuário ler uma mensagem longa, ou aguardar um processamento."
              />
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
              <FieldHelper
                description="Enviada quando a transferência for bem-sucedida. Aceita variáveis do contexto para personalizar."
                example="Estamos transferindo seu atendimento para um especialista. Por favor, aguarde um momento."
                onUseExample={(ex) => updateData('message', ex)}
              />
            </div>
            <div className="form-group">
              <label>Mensagem de erro</label>
              <textarea
                value={data.error_message || ''}
                onChange={(e) => updateData('error_message', e.target.value)}
                placeholder="Mensagem enviada quando a transferência falhar"
              />
              <FieldHelper
                description="Enviada quando o departamento não está disponível ou ocorre um erro na transferência. Se vazio, usa uma mensagem padrão."
                example="Desculpe, nosso departamento está indisponível no momento. Tente novamente em alguns minutos."
                onUseExample={(ex) => updateData('error_message', ex)}
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

      case 'set_ticket_owner':
        return (
          <>
            <div className="form-group">
              <label>Usuário (novo dono)</label>
              {loadingMcUsers ? (
                <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-dim)', backgroundColor: 'var(--bg-input)', borderRadius: '4px' }}>
                  Carregando usuários...
                </div>
              ) : mcUsersError ? (
                <>
                  <div style={{ padding: '0.75rem', marginBottom: '0.5rem', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '4px', fontSize: '0.85rem' }}>
                    ⚠️ {mcUsersError}
                  </div>
                  <input
                    type="number"
                    value={data.user_id || ''}
                    onChange={(e) => {
                      updateData('user_id', parseInt(e.target.value))
                      updateData('user_name', '')
                    }}
                    placeholder="Digite o ID do usuário manualmente"
                  />
                </>
              ) : mcUsers.length > 0 ? (
                <>
                  <select
                    value={data.user_id || ''}
                    onChange={(e) => {
                      const value = e.target.value
                      const userId = value ? parseInt(value) : null
                      const user = mcUsers.find((u) => u.id === userId)
                      updateData('user_id', userId)
                      updateData('user_name', user?.name || '')
                    }}
                    style={{ fontSize: '0.9rem' }}
                  >
                    <option value="">Selecione um usuário</option>
                    {mcUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email || `ID: ${user.id}`})
                      </option>
                    ))}
                  </select>
                  <small style={{ color: 'var(--text-dim)', display: 'block', marginTop: '0.5rem' }}>
                    {mcUsers.length} usuário{mcUsers.length !== 1 ? 's' : ''} ativo{mcUsers.length !== 1 ? 's' : ''}
                  </small>
                </>
              ) : (
                <>
                  <div style={{ padding: '0.75rem', marginBottom: '0.5rem', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '4px', fontSize: '0.85rem' }}>
                    ⚠️ Nenhum usuário encontrado
                  </div>
                  <input
                    type="number"
                    value={data.user_id || ''}
                    onChange={(e) => {
                      updateData('user_id', parseInt(e.target.value))
                      updateData('user_name', '')
                    }}
                    placeholder="Digite o ID do usuário manualmente"
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

      case 'whatsapp_template': {
        // Extrai variáveis de um template component (suporta {{1}} e {{nome}})
        const extractVariables = (text) => {
          if (!text) return []
          const matches = text.match(/\{\{(\w+)\}\}/g)
          if (!matches) return []
          return [...new Set(matches)].map((m) => {
            const key = m.replace(/[{}]/g, '')
            return { placeholder: m, index: key }
          })
        }

        // Template selecionado
        const selectedTemplate = waTemplates.find(
          (t) => t.name === data.template_name && t.language === data.template_language
        )

        // Componentes do template
        const headerComp = selectedTemplate?.components?.find((c) => c.type === 'HEADER')
        const bodyComp = selectedTemplate?.components?.find((c) => c.type === 'BODY')
        const footerComp = selectedTemplate?.components?.find((c) => c.type === 'FOOTER')
        const buttonsComp = selectedTemplate?.components?.find((c) => c.type === 'BUTTONS')

        const headerVars = headerComp ? extractVariables(headerComp.text) : []
        const bodyVars = bodyComp ? extractVariables(bodyComp.text) : []

        return (
          <>
            {/* Seleção de conta WhatsApp */}
            <div className="form-group">
              <label>Conta WhatsApp</label>
              {loadingWaAccounts ? (
                <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-dim)', backgroundColor: 'var(--bg-input)', borderRadius: '4px' }}>
                  Carregando contas...
                </div>
              ) : waAccountsError ? (
                <>
                  <div style={{ padding: '0.75rem', marginBottom: '0.5rem', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '4px', fontSize: '0.85rem' }}>
                    ⚠️ {waAccountsError}
                  </div>
                  <input
                    type="number"
                    value={data.account_id || ''}
                    onChange={(e) => updateData('account_id', parseInt(e.target.value))}
                    placeholder="Digite o ID da conta manualmente"
                  />
                </>
              ) : waAccounts.length > 0 ? (
                <>
                  <select
                    value={data.account_id || ''}
                    onChange={(e) => {
                      const value = e.target.value
                      const accountId = value ? parseInt(value) : null
                      updateData('account_id', accountId)
                      // Preenche account_number com phone_number da conta
                      const selectedAcc = waAccounts.find((a) => a.id === accountId)
                      updateData('account_number', selectedAcc?.phone_number || '')
                      // Limpa template selecionado ao mudar conta
                      updateData('template_name', null)
                      updateData('template_language', null)
                      updateData('template_id', null)
                      updateData('header_params', {})
                      updateData('body_params', {})
                      setWaTemplates([])
                      if (accountId) {
                        fetchWhatsAppTemplates(accountId)
                      }
                    }}
                    style={{ fontSize: '0.9rem' }}
                  >
                    <option value="">Selecione uma conta</option>
                    {waAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.phone_number} - {acc.company || 'Sem nome'} (ID: {acc.id})
                      </option>
                    ))}
                  </select>
                  <small style={{ color: 'var(--text-dim)', display: 'block', marginTop: '0.5rem' }}>
                    {waAccounts.length} conta{waAccounts.length !== 1 ? 's' : ''} disponível{waAccounts.length !== 1 ? 'is' : ''}
                  </small>
                </>
              ) : (
                <div style={{ padding: '0.75rem', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '4px', fontSize: '0.85rem' }}>
                  ⚠️ Nenhuma conta WhatsApp com account_key encontrada
                </div>
              )}
            </div>

            {/* Account Number (editável, preenchido automaticamente) */}
            {data.account_id && (
              <div className="form-group">
                <label>Account Number (número de envio)</label>
                <input
                  type="text"
                  value={data.account_number || ''}
                  onChange={(e) => updateData('account_number', e.target.value)}
                  placeholder="Ex: 552730109500"
                />
                <small style={{ color: 'var(--text-dim)', display: 'block', marginTop: '0.25rem' }}>
                  Preenchido automaticamente pela conta selecionada. Altere para usar um número diferente no envio. Se preenchido, sobrescreve o account_number do contexto.
                </small>
              </div>
            )}

            {/* Seleção de template */}
            {data.account_id && (
              <div className="form-group">
                <label>Template</label>
                {loadingWaTemplates ? (
                  <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-dim)', backgroundColor: 'var(--bg-input)', borderRadius: '4px' }}>
                    Carregando templates...
                  </div>
                ) : waTemplatesError ? (
                  <>
                    <div style={{ padding: '0.75rem', marginBottom: '0.5rem', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '4px', fontSize: '0.85rem' }}>
                      ⚠️ {waTemplatesError}
                    </div>
                    <input
                      type="text"
                      value={data.template_name || ''}
                      onChange={(e) => updateData('template_name', e.target.value)}
                      placeholder="Digite o nome do template manualmente"
                    />
                  </>
                ) : waTemplates.length > 0 ? (
                  <>
                    <select
                      value={data.template_name && data.template_language ? `${data.template_name}|${data.template_language}` : ''}
                      onChange={(e) => {
                        const value = e.target.value
                        if (!value) {
                          updateData('template_name', null)
                          updateData('template_language', null)
                          updateData('template_id', null)
                          updateData('template_object', null)
                          updateData('header_params', {})
                          updateData('body_params', {})
                          return
                        }
                        const [name, lang] = value.split('|')
                        const tmpl = waTemplates.find((t) => t.name === name && t.language === lang)
                        updateData('template_name', name)
                        updateData('template_language', lang)
                        updateData('template_id', tmpl?.id || null)
                        updateData('template_object', tmpl || null)
                        updateData('header_params', {})
                        updateData('body_params', {})
                      }}
                      style={{ fontSize: '0.9rem' }}
                    >
                      <option value="">Selecione um template</option>
                      {waTemplates.map((tmpl) => {
                        const categoryIcons = { MARKETING: '📢', UTILITY: '🔧', AUTHENTICATION: '🔐' }
                        return (
                          <option key={`${tmpl.name}-${tmpl.language}`} value={`${tmpl.name}|${tmpl.language}`}>
                            {categoryIcons[tmpl.category] || '📄'} {tmpl.name} ({tmpl.language})
                          </option>
                        )
                      })}
                    </select>
                    <small style={{ color: 'var(--text-dim)', display: 'block', marginTop: '0.5rem' }}>
                      {waTemplates.length} template{waTemplates.length !== 1 ? 's' : ''} aprovado{waTemplates.length !== 1 ? 's' : ''}
                    </small>
                  </>
                ) : (
                  <div style={{ padding: '0.75rem', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '4px', fontSize: '0.85rem' }}>
                    ⚠️ Nenhum template aprovado encontrado para esta conta
                  </div>
                )}
              </div>
            )}

            {/* Preview do template */}
            {selectedTemplate && (
              <div className="form-group">
                <label>Preview do Template</label>
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--bg-input)',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}>
                  {/* Categoria e idioma */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                      backgroundColor: selectedTemplate.category === 'MARKETING' ? 'rgba(59,130,246,0.15)' : selectedTemplate.category === 'UTILITY' ? 'rgba(34,197,94,0.15)' : 'rgba(249,115,22,0.15)',
                      color: selectedTemplate.category === 'MARKETING' ? '#60a5fa' : selectedTemplate.category === 'UTILITY' ? '#4ade80' : '#fb923c',
                      fontWeight: 600,
                    }}>
                      {selectedTemplate.category}
                    </span>
                    <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                      {selectedTemplate.language}
                    </span>
                  </div>

                  {/* Header */}
                  {headerComp && (
                    <div style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {headerComp.format === 'TEXT' && <div>📝 {headerComp.text}</div>}
                      {headerComp.format === 'IMAGE' && <div>🖼️ Header: Imagem</div>}
                      {headerComp.format === 'VIDEO' && <div>🎬 Header: Vídeo</div>}
                      {headerComp.format === 'DOCUMENT' && <div>📄 Header: Documento</div>}
                    </div>
                  )}

                  {/* Body */}
                  {bodyComp && (
                    <div style={{ whiteSpace: 'pre-wrap', marginBottom: '0.5rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                      {bodyComp.text}
                    </div>
                  )}

                  {/* Footer */}
                  {footerComp && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                      {footerComp.text}
                    </div>
                  )}

                  {/* Buttons */}
                  {buttonsComp && buttonsComp.buttons && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.5rem' }}>
                      {buttonsComp.buttons.map((btn, idx) => (
                        <span key={idx} style={{
                          padding: '0.3rem 0.6rem',
                          borderRadius: '16px',
                          border: '1px solid var(--border)',
                          fontSize: '0.75rem',
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--text-secondary)',
                        }}>
                          {btn.type === 'URL' ? '🔗' : btn.type === 'OTP' ? '🔑' : btn.type === 'PHONE_NUMBER' ? '📞' : '↩️'} {btn.text}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Parâmetros do Header (se TEXT com variáveis) */}
            {headerComp && headerComp.format === 'TEXT' && headerVars.length > 0 && (
              <div className="form-group">
                <label>Parâmetros do Header</label>
                <small style={{ color: 'var(--text-dim)', display: 'block', marginBottom: '0.5rem' }}>
                  Preencha os valores para as variáveis do header. Use <code>{'${{campo}}'}</code> para variáveis do contexto.
                </small>
                {headerVars.map((v) => {
                  const namedParam = headerComp.example?.header_text_named_params?.find((p) => p.param_name === v.index)
                  const positionalExample = headerComp.example?.header_text?.[parseInt(v.index) - 1]
                  const exampleValue = namedParam?.example || positionalExample
                  return (
                  <div key={`header-${v.index}`} style={{ marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {`{{${v.index}}}`}
                      {exampleValue && (
                        <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
                          {' '} — ex: {exampleValue}
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={(data.header_params || {})[v.index] || ''}
                      onChange={(e) => {
                        const params = { ...(data.header_params || {}), [v.index]: e.target.value }
                        updateData('header_params', params)
                      }}
                      placeholder={`Valor para {{${v.index}}}`}
                    />
                  </div>
                  )
                })}
              </div>
            )}

            {/* Header de mídia (IMAGE, VIDEO, DOCUMENT) */}
            {headerComp && (headerComp.format === 'IMAGE' || headerComp.format === 'VIDEO' || headerComp.format === 'DOCUMENT') && (
              <div className="form-group">
                <label>URL da Mídia do Header ({headerComp.format === 'IMAGE' ? 'Imagem' : headerComp.format === 'VIDEO' ? 'Vídeo' : 'Documento'})</label>
                <input
                  type="text"
                  value={data.header_media_url || ''}
                  onChange={(e) => updateData('header_media_url', e.target.value)}
                  placeholder={`URL da ${headerComp.format === 'IMAGE' ? 'imagem' : headerComp.format === 'VIDEO' ? 'vídeo' : 'documento'}`}
                />
                {headerComp.format === 'DOCUMENT' && (
                  <input
                    type="text"
                    value={data.header_media_filename || ''}
                    onChange={(e) => updateData('header_media_filename', e.target.value)}
                    placeholder="Nome do arquivo (ex: documento.pdf)"
                    style={{ marginTop: '0.5rem' }}
                  />
                )}
                <small style={{ color: 'var(--text-dim)', display: 'block', marginTop: '0.25rem' }}>
                  Use <code>{'${{campo}}'}</code> para variáveis do contexto.
                </small>
              </div>
            )}

            {/* Parâmetros do Body */}
            {bodyVars.length > 0 && (
              <div className="form-group">
                <label>Parâmetros do Body</label>
                <small style={{ color: 'var(--text-dim)', display: 'block', marginBottom: '0.5rem' }}>
                  Preencha os valores para as variáveis do corpo. Use <code>{'${{campo}}'}</code> para variáveis do contexto.
                </small>
                {bodyVars.map((v) => {
                  const namedParam = bodyComp.example?.body_text_named_params?.find((p) => p.param_name === v.index)
                  const positionalExample = bodyComp.example?.body_text?.[0]?.[parseInt(v.index) - 1]
                  const exampleValue = namedParam?.example || positionalExample
                  return (
                  <div key={`body-${v.index}`} style={{ marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {`{{${v.index}}}`}
                      {exampleValue && (
                        <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
                          {' '} — ex: {exampleValue}
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={(data.body_params || {})[v.index] || ''}
                      onChange={(e) => {
                        const params = { ...(data.body_params || {}), [v.index]: e.target.value }
                        updateData('body_params', params)
                      }}
                      placeholder={`Valor para {{${v.index}}}`}
                    />
                  </div>
                  )
                })}
              </div>
            )}

            {/* Token MonitChat */}
            <div className="form-group">
              <label>Token MonitChat</label>
              <input
                type="text"
                value={data.monitchat_token || ''}
                onChange={(e) => updateData('monitchat_token', e.target.value)}
                placeholder="${{secret.MONITCHAT_TOKEN}}"
              />
              <small style={{ color: 'var(--text-dim)', display: 'block', marginTop: '0.25rem' }}>
                Use uma secret do fluxo (ex: <code>{'${{secret.MONITCHAT_TOKEN}}'}</code>) ou uma global secret. Obrigatório para agendamentos.
              </small>
            </div>

            {/* Rótulo */}
            <div className="form-group">
              <label>Rótulo (opcional)</label>
              <input
                type="text"
                value={data.label || ''}
                onChange={(e) => updateData('label', e.target.value)}
                placeholder="Ex: Enviar confirmação"
              />
            </div>
          </>
        )
      }

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

      case 'loop':
        return (
          <>
            <div className="form-group">
              <label>Rótulo</label>
              <input
                type="text"
                value={data.label || ''}
                onChange={(e) => updateData('label', e.target.value)}
                placeholder="Nome do loop"
              />
            </div>

            <div className="form-group">
              <label>Variável Fonte (lista ou dicionário)</label>
              <AutocompleteTextarea
                  extraSuggestions={allExtraSuggestions}
                value={data.source_variable || ''}
                onChange={(e) => updateData('source_variable', e.target.value.replace(/\$\{\{/g, '').replace(/\}\}/g, '').trim())}
                placeholder="api_response.data.pedidos"
                rows={1}
              />
              <FieldHelper
                title="Qual lista iterar"
                description="Caminho no contexto para a lista ou dicionário. O loop vai executar os nós conectados na saída 'Corpo' para cada item."
                example="api_response.data.items"
                onUseExample={(ex) => updateData('source_variable', ex)}
              />
              {/* Sugestões de arrays da API ancestral */}
              {ancestorApiData && ancestorApiData._extracted_paths && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                }}>
                  <strong style={{ color: '#f59e0b' }}>📋 Arrays detectados na API:</strong>
                  <div style={{ marginTop: '0.3rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {ancestorApiData._extracted_paths
                      .filter(p => p.isArray)
                      .map((p, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => updateData('source_variable', p.path)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            fontFamily: 'monospace',
                            backgroundColor: data.source_variable === p.path ? '#f59e0b' : 'var(--input-bg, #2a2a3e)',
                            color: data.source_variable === p.path ? '#000' : 'var(--text-primary, #e0e0e0)',
                            border: '1px solid var(--border-color, #444)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          {p.path} {p.example}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Nome da Variável de Item</label>
              <input
                type="text"
                value={data.item_variable || 'item'}
                onChange={(e) => updateData('item_variable', e.target.value)}
                placeholder="item"
              />
              <small style={{ color: 'var(--text-secondary, #888)', lineHeight: 1.5 }}>
                Use <code>{'${{' + (data.item_variable || 'item') + '.campo}}'}</code> dentro do corpo do loop para acessar cada item.
              </small>
              <div style={{
                marginTop: '0.5rem',
                padding: '0.5rem 0.75rem',
                backgroundColor: 'rgba(99, 102, 241, 0.06)',
                border: '1px solid rgba(99, 102, 241, 0.15)',
                borderRadius: '6px',
                fontSize: '0.72rem',
                color: 'var(--text-secondary, #888)',
                lineHeight: 1.6,
              }}>
                <strong style={{ color: 'var(--text-primary, #e0e0e0)' }}>Campos disponiveis dentro do loop:</strong>
                <div style={{ paddingLeft: '0.5rem', marginTop: '0.2rem' }}>
                  • <code style={{ color: '#818cf8' }}>{'${{' + (data.item_variable || 'item') + '}}'}</code> — item completo<br />
                  • <code style={{ color: '#818cf8' }}>{'${{' + (data.item_variable || 'item') + '.campo}}'}</code> — campo especifico do item<br />
                  • <code style={{ color: '#818cf8' }}>{'${{loop.index}}'}</code> — indice da iteracao (0, 1, 2...)<br />
                </div>
                <div style={{ marginTop: '0.3rem' }}>
                  <strong style={{ color: 'var(--text-primary, #e0e0e0)' }}>Se veio de "Agrupar lista":</strong>
                </div>
                <div style={{ paddingLeft: '0.5rem', marginTop: '0.2rem' }}>
                  • <code style={{ color: '#818cf8' }}>{'${{' + (data.item_variable || 'item') + '.key}}'}</code> — valor do agrupamento<br />
                  • <code style={{ color: '#818cf8' }}>{'${{' + (data.item_variable || 'item') + '.linhas}}'}</code> — array de itens do grupo (use com Formatar lista)<br />
                  • <code style={{ color: '#818cf8' }}>{'${{' + (data.item_variable || 'item') + '.total_linhas}}'}</code> — quantidade de itens no grupo<br />
                  • <code style={{ color: '#818cf8' }}>{'${{' + (data.item_variable || 'item') + '.campo}}'}</code> — valores concatenados com \\n
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Máximo de Iterações</label>
              <input
                type="number"
                value={data.max_iterations || 50}
                onChange={(e) => updateData('max_iterations', parseInt(e.target.value) || 50)}
                min={1}
                max={100}
              />
              <small style={{ color: 'var(--text-secondary, #888)' }}>
                Proteção contra loops infinitos. Máximo: 100.
              </small>
            </div>

            <div style={{
              padding: '0.8rem',
              backgroundColor: 'var(--card-bg, rgba(100,100,255,0.05))',
              borderRadius: '8px',
              marginTop: '0.5rem',
              border: '1px solid var(--border-color, #333)',
            }}>
              <strong style={{ fontSize: '0.85rem', color: '#f59e0b' }}>🔄 Variáveis disponíveis no corpo:</strong>
              <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', fontFamily: 'monospace', lineHeight: 1.8 }}>
                <div><code>{'${{' + (data.item_variable || 'item') + '}}'}</code> — item atual</div>
                {/* Campos do item detectados da API */}
                {(() => {
                  if (!ancestorApiData || !ancestorApiData._extracted_paths || !data.source_variable) return null
                  const sourceVar = data.source_variable
                  const itemVar = data.item_variable || 'item'
                  // Encontra campos filhos do array selecionado
                  const childFields = ancestorApiData._extracted_paths.filter(p => {
                    return p.path.startsWith(sourceVar + '.') && !p.isArray
                  })
                  if (childFields.length === 0) return null
                  return childFields.map((f, i) => {
                    const fieldName = f.path.replace(sourceVar + '.', '')
                    return (
                      <div key={i} style={{ color: '#4CAF50' }}>
                        <code>{'${{' + itemVar + '.' + fieldName + '}}'}</code>
                        {f.example !== undefined && (
                          <span style={{ color: 'var(--text-secondary, #888)', fontFamily: 'sans-serif' }}>
                            {' '}— ex: {typeof f.example === 'string' ? `"${f.example.substring(0, 30)}"` : String(f.example)}
                          </span>
                        )}
                      </div>
                    )
                  })
                })()}
                {(!ancestorApiData || !ancestorApiData._extracted_paths || !data.source_variable) && (
                  <div><code>{'${{' + (data.item_variable || 'item') + '.campo}}'}</code> — campo do item</div>
                )}
                <div style={{ marginTop: '0.3rem', borderTop: '1px solid var(--border-color, #444)', paddingTop: '0.3rem' }}>
                  <div><code>{'${{loop.index}}'}</code> — índice (0, 1, 2...)</div>
                  <div><code>{'${{loop.key}}'}</code> — chave (se for dict)</div>
                  <div><code>{'${{loop.total}}'}</code> — total de itens</div>
                  <div><code>{'${{loop.first}}'}</code> — true se primeiro</div>
                  <div><code>{'${{loop.last}}'}</code> — true se último</div>
                </div>
              </div>
            </div>

            <div style={{
              padding: '0.8rem',
              backgroundColor: 'var(--card-bg, rgba(100,100,255,0.05))',
              borderRadius: '8px',
              marginTop: '0.5rem',
              border: '1px solid var(--border-color, #333)',
            }}>
              <strong style={{ fontSize: '0.85rem' }}>💡 Como conectar:</strong>
              <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', lineHeight: 1.6 }}>
                <div>🟡 <strong>Corpo</strong> (saída lateral): conecte os nós que executam a cada iteração</div>
                <div>🟢 <strong>Fim</strong> (saída inferior): conecte o que vem depois do loop</div>
              </div>
            </div>
          </>
        )

      case 'expression':
        return (
          <>
            <div className="form-group">
              <label>Rótulo</label>
              <input
                type="text"
                value={data.label || ''}
                onChange={(e) => updateData('label', e.target.value)}
                placeholder="Nome da expressão"
              />
            </div>

            <div className="form-group">
              <label>Modo</label>
              <select
                value={data.mode || 'set'}
                onChange={(e) => updateData('mode', e.target.value)}
                style={{ backgroundColor: 'var(--input-bg, #1e1e2e)', color: 'var(--text-primary, #e0e0e0)', borderColor: 'var(--border-color, #333)' }}
              >
                <option value="set">✏️ Definir (substitui o valor)</option>
                <option value="append">➕ Acumular (concatena ao valor existente)</option>
              </select>
              <small style={{ color: 'var(--text-secondary, #888)' }}>
                {data.mode === 'append'
                  ? 'Ideal dentro de loops: cada iteração adiciona ao resultado.'
                  : 'Substitui o valor da variável a cada execução.'
                }
              </small>
            </div>

            {data.mode === 'append' && (
              <div className="form-group">
                <label>Separador</label>
                <input
                  type="text"
                  value={data.separator || ''}
                  onChange={(e) => updateData('separator', e.target.value)}
                  placeholder="Ex: \n (nova linha), , (vírgula)"
                />
                <small style={{ color: 'var(--text-secondary, #888)' }}>
                  Texto inserido entre cada concatenação. Use \n para nova linha.
                </small>
              </div>
            )}

            <div className="form-group">
              <label>Template</label>
              <AutocompleteTextarea
                  extraSuggestions={allExtraSuggestions}
                value={data.template || ''}
                onChange={(e) => updateData('template', e.target.value)}
                placeholder={'📦 Pedido #${{item.id}} - ${{item.title}}'}
                rows={3}
              />
              <FieldHelper
                title="Como montar o template"
                description="Use variáveis do contexto para montar o texto. Dentro de um loop, use as variáveis do item."
                example={'📦 #${{item.id}} - ${{item.title}} (R$ ${{item.valor}})'}
                onUseExample={(ex) => updateData('template', ex)}
              />
            </div>

            <div className="form-group">
              <label>Salvar em (Context Key)</label>
              <input
                type="text"
                value={data.context_key || 'resultado'}
                onChange={(e) => updateData('context_key', e.target.value)}
                placeholder="resultado"
                style={{ fontFamily: 'monospace' }}
              />
              <small style={{ color: 'var(--text-secondary, #888)' }}>
                Use <code>{'${{' + (data.context_key || 'resultado') + '}}'}</code> nos nós seguintes para acessar o valor.
              </small>
            </div>

            <div className="form-group">
              <label>Valor Inicial (opcional)</label>
              <input
                type="text"
                value={data.initial_value || ''}
                onChange={(e) => updateData('initial_value', e.target.value)}
                placeholder="0"
              />
              <small style={{ color: 'var(--text-secondary, #888)' }}>
                Usado quando a variável do template ainda não existe no contexto (ex: primeira iteração de um totalizador). Padrão: 0 para operações matemáticas.
              </small>
            </div>

            {/* Operações de Transformação */}
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ margin: 0 }}>🔧 Operações de Transformação</label>
                <button
                  type="button"
                  onClick={() => updateData('operations', [...(data.operations || []), { type: '' }])}
                  style={{
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.8rem',
                    backgroundColor: 'var(--accent, #7c3aed)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  + Adicionar
                </button>
              </div>

              {(data.operations || []).map((op, index) => (
                <div key={index} style={{
                  padding: '0.6rem',
                  marginBottom: '0.5rem',
                  backgroundColor: 'var(--card-bg, #1a1a2e)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color, #333)',
                }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select
                      value={op.type || ''}
                      onChange={(e) => {
                        const ops = [...(data.operations || [])]
                        ops[index] = { ...ops[index], type: e.target.value }
                        updateData('operations', ops)
                      }}
                      style={{ flex: 1, backgroundColor: 'var(--input-bg, #1e1e2e)', color: 'var(--text-primary, #e0e0e0)', borderColor: 'var(--border-color, #333)' }}
                    >
                      <option value="">Selecione...</option>
                      <optgroup label="Texto">
                        <option value="uppercase">MAIÚSCULAS</option>
                        <option value="lowercase">minúsculas</option>
                        <option value="trim">Remover espaços</option>
                        <option value="replace">Substituir texto</option>
                        <option value="prefix">Adicionar prefixo</option>
                        <option value="suffix">Adicionar sufixo</option>
                        <option value="substring">Recortar texto</option>
                      </optgroup>
                      <optgroup label="Matemática">
                        <option value="math">Operação matemática</option>
                        <option value="format_number">Formatar número</option>
                        <option value="format_currency">Formatar moeda</option>
                      </optgroup>
                      <optgroup label="Listas">
                        <option value="format_list">Formatar lista</option>
                        <option value="sum_field">Somar campo da lista</option>
                        <option value="group_list">Agrupar lista por campo</option>
                      </optgroup>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const ops = [...(data.operations || [])]
                        ops.splice(index, 1)
                        updateData('operations', ops)
                      }}
                      style={{
                        padding: '0.2rem 0.5rem',
                        background: 'transparent',
                        border: 'none',
                        color: '#F44336',
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                      }}
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Campos específicos por tipo de operação */}
                  {op.type === 'replace' && (
                    <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.3rem' }}>
                      <input
                        type="text"
                        placeholder="Buscar"
                        value={op.find || ''}
                        onChange={(e) => {
                          const ops = [...(data.operations || [])]
                          ops[index] = { ...ops[index], find: e.target.value }
                          updateData('operations', ops)
                        }}
                        style={{ flex: 1 }}
                      />
                      <input
                        type="text"
                        placeholder="Substituir por"
                        value={op.value || ''}
                        onChange={(e) => {
                          const ops = [...(data.operations || [])]
                          ops[index] = { ...ops[index], value: e.target.value }
                          updateData('operations', ops)
                        }}
                        style={{ flex: 1 }}
                      />
                    </div>
                  )}

                  {op.type === 'math' && (
                    <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                      <select
                        value={op.operator || '+'}
                        onChange={(e) => {
                          const ops = [...(data.operations || [])]
                          ops[index] = { ...ops[index], operator: e.target.value }
                          updateData('operations', ops)
                        }}
                        style={{ width: '80px', backgroundColor: 'var(--input-bg, #1e1e2e)', color: 'var(--text-primary, #e0e0e0)', borderColor: 'var(--border-color, #333)' }}
                      >
                        <option value="+">+ Somar</option>
                        <option value="-">- Subtrair</option>
                        <option value="*">× Multiplicar</option>
                        <option value="/">÷ Dividir</option>
                        <option value="%">% Módulo</option>
                        <option value="round">Arredondar</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Valor"
                        value={op.value || ''}
                        onChange={(e) => {
                          const ops = [...(data.operations || [])]
                          ops[index] = { ...ops[index], value: e.target.value }
                          updateData('operations', ops)
                        }}
                        style={{ flex: 1 }}
                      />
                    </div>
                  )}

                  {op.type === 'substring' && (
                    <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.3rem' }}>
                      <input
                        type="number"
                        placeholder="Início"
                        value={op.start || ''}
                        onChange={(e) => {
                          const ops = [...(data.operations || [])]
                          ops[index] = { ...ops[index], start: e.target.value }
                          updateData('operations', ops)
                        }}
                        style={{ flex: 1 }}
                      />
                      <input
                        type="number"
                        placeholder="Fim (opcional)"
                        value={op.end || ''}
                        onChange={(e) => {
                          const ops = [...(data.operations || [])]
                          ops[index] = { ...ops[index], end: e.target.value }
                          updateData('operations', ops)
                        }}
                        style={{ flex: 1 }}
                      />
                    </div>
                  )}

                  {(op.type === 'prefix' || op.type === 'suffix') && (
                    <div style={{ marginTop: '0.4rem' }}>
                      <input
                        type="text"
                        placeholder="Texto"
                        value={op.value || ''}
                        onChange={(e) => {
                          const ops = [...(data.operations || [])]
                          ops[index] = { ...ops[index], value: e.target.value }
                          updateData('operations', ops)
                        }}
                      />
                    </div>
                  )}

                  {op.type === 'format_number' && (
                    <div style={{ marginTop: '0.4rem' }}>
                      <input
                        type="number"
                        placeholder="Casas decimais (padrão: 2)"
                        value={op.value || ''}
                        onChange={(e) => {
                          const ops = [...(data.operations || [])]
                          ops[index] = { ...ops[index], value: e.target.value }
                          updateData('operations', ops)
                        }}
                      />
                    </div>
                  )}

                  {op.type === 'format_currency' && (
                    <div style={{ marginTop: '0.4rem' }}>
                      <input
                        type="text"
                        placeholder="Símbolo (padrão: R$)"
                        value={op.value || ''}
                        onChange={(e) => {
                          const ops = [...(data.operations || [])]
                          ops[index] = { ...ops[index], value: e.target.value }
                          updateData('operations', ops)
                        }}
                      />
                    </div>
                  )}

                  {op.type === 'format_list' && (
                    <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <input
                        type="text"
                        placeholder="Variavel da lista (ex: linhas)"
                        value={op.source || ''}
                        onChange={(e) => {
                          const ops = [...(data.operations || [])]
                          ops[index] = { ...ops[index], source: e.target.value }
                          updateData('operations', ops)
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Template por item (ex: {vencimento}: R$ {valor})"
                        value={op.value || ''}
                        onChange={(e) => {
                          const ops = [...(data.operations || [])]
                          ops[index] = { ...ops[index], value: e.target.value }
                          updateData('operations', ops)
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Separador (padrão: \n)"
                        value={op.separator || ''}
                        onChange={(e) => {
                          const ops = [...(data.operations || [])]
                          ops[index] = { ...ops[index], separator: e.target.value }
                          updateData('operations', ops)
                        }}
                      />
                      <div style={{
                        padding: '0.5rem 0.75rem',
                        backgroundColor: 'rgba(99, 102, 241, 0.06)',
                        border: '1px solid rgba(99, 102, 241, 0.15)',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        color: 'var(--text-secondary, #888)',
                        lineHeight: 1.5,
                      }}>
                        Percorre cada item da lista e aplica o template. Use <code style={{ color: '#818cf8' }}>{'{campo}'}</code> para inserir valores de cada item.
                        {loopContext && (
                          <span> Dentro de um loop, use <code style={{ color: '#818cf8' }}>{loopContext.item_variable || 'item'}.linhas</code> como variavel.</span>
                        )}
                        <br />
                        <span style={{ color: '#64748b' }}>Ex: <code>{'{vencimento}: R$ {valor}'}</code> → <code>27/01: R$ 50</code></span>
                      </div>
                    </div>
                  )}

                  {op.type === 'sum_field' && (
                    <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <input
                          type="text"
                          placeholder="Variavel da lista (ex: linhas)"
                          value={op.source || ''}
                          onChange={(e) => {
                            const ops = [...(data.operations || [])]
                            ops[index] = { ...ops[index], source: e.target.value }
                            updateData('operations', ops)
                          }}
                          style={{ flex: 1 }}
                        />
                        <input
                          type="text"
                          placeholder="Campo a somar (ex: valor)"
                          value={op.value || ''}
                          onChange={(e) => {
                            const ops = [...(data.operations || [])]
                            ops[index] = { ...ops[index], value: e.target.value }
                            updateData('operations', ops)
                          }}
                          style={{ flex: 1 }}
                        />
                      </div>
                      <small style={{ color: 'var(--text-secondary, #888)', lineHeight: 1.4 }}>
                        Soma todos os valores numericos do campo especificado em cada item da lista.
                        {loopContext && (
                          <span> Dentro de um loop, use <code style={{ color: '#818cf8' }}>{loopContext.item_variable || 'item'}.linhas</code> como variavel.</span>
                        )}
                      </small>
                    </div>
                  )}

                  {op.type === 'group_list' && (
                    <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <input
                        type="text"
                        placeholder="Variavel da lista (ex: pedidos)"
                        value={op.source || ''}
                        onChange={(e) => {
                          const ops = [...(data.operations || [])]
                          ops[index] = { ...ops[index], source: e.target.value }
                          updateData('operations', ops)
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Campo para agrupar (ex: cliente)"
                        value={op.value || ''}
                        onChange={(e) => {
                          const ops = [...(data.operations || [])]
                          ops[index] = { ...ops[index], value: e.target.value }
                          updateData('operations', ops)
                        }}
                      />
                      <div style={{
                        marginTop: '0.3rem',
                        padding: '0.6rem 0.75rem',
                        backgroundColor: 'rgba(99, 102, 241, 0.06)',
                        border: '1px solid rgba(99, 102, 241, 0.15)',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary, #888)',
                        lineHeight: 1.6,
                      }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-primary, #e0e0e0)' }}>
                          Como funciona:
                        </div>
                        <div>O resultado sera salvo em <code style={{ color: '#818cf8' }}>${'{{'}{data.context_key || 'resultado'}{'}}'}  </code> como um array de grupos.</div>
                        <div style={{ marginTop: '0.3rem' }}>Cada grupo contem:</div>
                        <div style={{ paddingLeft: '0.5rem', marginTop: '0.15rem' }}>
                          • <code style={{ color: '#818cf8' }}>key</code> — valor do campo agrupado<br />
                          • <code style={{ color: '#818cf8' }}>linhas</code> — array com os itens do grupo<br />
                          • <code style={{ color: '#818cf8' }}>total_linhas</code> — quantidade de itens<br />
                          • demais campos concatenados com quebra de linha
                        </div>
                        <div style={{ marginTop: '0.4rem', fontWeight: 600, color: 'var(--text-primary, #e0e0e0)' }}>
                          Proximo passo:
                        </div>
                        <div>
                          Conecte um no <strong>Loop</strong> com variavel fonte <code style={{ color: '#818cf8' }}>{data.context_key || 'resultado'}</code>.
                          Dentro do loop, use <strong>Formatar lista</strong> em <code style={{ color: '#818cf8' }}>item.linhas</code> para montar o texto de cada grupo.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {(!data.operations || data.operations.length === 0) && (
                <small style={{ color: 'var(--text-secondary, #888)' }}>
                  Nenhuma operação. O template será salvo diretamente.
                </small>
              )}
            </div>

            <div style={{
              padding: '0.8rem',
              backgroundColor: 'var(--card-bg, rgba(100,100,255,0.05))',
              borderRadius: '8px',
              marginTop: '0.5rem',
              border: '1px solid var(--border-color, #333)',
            }}>
              <strong style={{ fontSize: '0.85rem' }}>💡 Exemplo com Loop:</strong>
              <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', lineHeight: 1.6, fontFamily: 'monospace' }}>
                <div>Modo: <strong>Acumular</strong></div>
                <div>Template: <code>{'📦 #${{item.id}} - ${{item.title}}'}</code></div>
                <div>Separador: <code>\n</code></div>
                <div>Key: <code>lista</code></div>
                <div style={{ marginTop: '0.3rem', color: '#4CAF50' }}>
                  → Resultado: cada iteração adiciona uma linha
                </div>
              </div>
            </div>
          </>
        )

      case 'data_structure':
        const dsOperations = [
          { value: 'create_list', label: '📋 Criar Lista', group: 'Criar' },
          { value: 'create_object', label: '📦 Criar Objeto', group: 'Criar' },
          { value: 'add_item', label: '➕ Adicionar Item', group: 'Modificar' },
          { value: 'remove_item', label: '➖ Remover Item', group: 'Modificar' },
          { value: 'update_item', label: '✏️ Atualizar Item', group: 'Modificar' },
          { value: 'set_field', label: '📝 Definir Campo (em objeto)', group: 'Modificar' },
          { value: 'merge_lists', label: '🔗 Combinar Listas', group: 'Modificar' },
          { value: 'filter', label: '🔍 Filtrar', group: 'Consultar' },
          { value: 'sort', label: '↕️ Ordenar', group: 'Consultar' },
          { value: 'group_by', label: '📁 Agrupar por Campo', group: 'Consultar' },
          { value: 'count', label: '🔢 Contar Itens', group: 'Consultar' },
          { value: 'sum', label: '➕ Somar Campo', group: 'Consultar' },
        ]
        const dsOp = data.operation || 'create_list'
        const needsSource = ['filter', 'sort', 'group_by', 'count', 'sum', 'merge_lists'].includes(dsOp)
        const needsCondition = ['filter', 'remove_item', 'update_item', 'count'].includes(dsOp)
        const needsItem = ['add_item', 'update_item'].includes(dsOp)
        const needsSort = ['sort', 'sum'].includes(dsOp)
        const needsGroup = dsOp === 'group_by'
        const needsInitial = ['create_list', 'create_object'].includes(dsOp)
        const needsSetField = dsOp === 'set_field'
        return (
          <>
            <div className="form-group">
              <label>Rótulo</label>
              <input
                type="text"
                value={data.label || ''}
                onChange={(e) => updateData('label', e.target.value)}
                placeholder="Nome da operação"
              />
            </div>

            <div className="form-group">
              <label>Operação</label>
              <select
                value={dsOp}
                onChange={(e) => updateData('operation', e.target.value)}
                style={{ backgroundColor: 'var(--input-bg, #1e1e2e)', color: 'var(--text-primary, #e0e0e0)', borderColor: 'var(--border-color, #333)' }}
              >
                {['Criar', 'Modificar', 'Consultar'].map(group => (
                  <optgroup key={group} label={group}>
                    {dsOperations.filter(o => o.group === group).map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Salvar em (Context Key)</label>
              <input
                type="text"
                value={data.context_key || 'dados'}
                onChange={(e) => updateData('context_key', e.target.value)}
                placeholder="dados"
                style={{ fontFamily: 'monospace' }}
              />
              <small style={{ color: 'var(--text-secondary, #888)' }}>
                Use <code>{'${{' + (data.context_key || 'dados') + '}}'}</code> para acessar. Para listas: <code>{'${{' + (data.context_key || 'dados') + '.0.campo}}'}</code>
              </small>
            </div>

            {needsSource && (
              <div className="form-group">
                <label>Variável Fonte</label>
                <AutocompleteTextarea
                  extraSuggestions={allExtraSuggestions}
                  value={data.source_variable || ''}
                  onChange={(e) => updateData('source_variable', e.target.value.replace(/\$\{\{/g, '').replace(/\}\}/g, '').trim())}
                  placeholder="api_response.data.items"
                  rows={1}
                />
                <small style={{ color: 'var(--text-secondary, #888)' }}>
                  Lista ou objeto fonte para a operação.
                </small>
              </div>
            )}

            {needsInitial && (
              <div className="form-group">
                <label>Dados Iniciais (JSON, opcional)</label>
                <textarea
                  value={data.initial_data || ''}
                  onChange={(e) => updateData('initial_data', e.target.value)}
                  placeholder={dsOp === 'create_list' ? '[\n  {"nome": "Item 1"},\n  {"nome": "Item 2"}\n]' : '{\n  "campo1": "valor1"\n}'}
                  rows={4}
                  style={{
                    width: '100%',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    backgroundColor: 'var(--input-bg, #1e1e2e)',
                    color: 'var(--text-primary, #e0e0e0)',
                    border: '1px solid var(--border-color, #333)',
                    borderRadius: '4px',
                    padding: '0.5rem',
                  }}
                />
                <small style={{ color: 'var(--text-secondary, #888)' }}>
                  Deixe vazio para criar {dsOp === 'create_list' ? 'lista' : 'objeto'} vazio.
                </small>
              </div>
            )}

            {needsItem && (
              <div className="form-group">
                <label>{dsOp === 'add_item' ? 'Item a Adicionar (JSON)' : 'Campos a Atualizar (JSON)'}</label>
                <AutocompleteTextarea
                  extraSuggestions={allExtraSuggestions}
                  value={data.item_template || ''}
                  onChange={(e) => updateData('item_template', e.target.value)}
                  placeholder={'{"id": "${{item.id}}", "titulo": "${{item.title}}"}'}
                  rows={3}
                />
                <FieldHelper
                  title={dsOp === 'add_item' ? 'Formato do item' : 'Campos para atualizar'}
                  description="JSON com os campos. Use variáveis do contexto para valores dinâmicos."
                  example={'{"nome": "${{item.title}}", "valor": "${{item.id}}"}'}
                  onUseExample={(ex) => updateData('item_template', ex)}
                />
              </div>
            )}

            {needsSetField && (
              <>
                <div className="form-group">
                  <label>Nome do Campo</label>
                  <input
                    type="text"
                    value={data.field_name || ''}
                    onChange={(e) => updateData('field_name', e.target.value)}
                    placeholder="nome_do_campo"
                  />
                </div>
                <div className="form-group">
                  <label>Valor</label>
                  <AutocompleteTextarea
                    extraSuggestions={allExtraSuggestions}
                    value={data.field_value || ''}
                    onChange={(e) => updateData('field_value', e.target.value)}
                    placeholder="valor ou ${{variavel}}"
                    rows={1}
                  />
                </div>
              </>
            )}

            {needsCondition && (
              <div style={{
                padding: '0.8rem',
                backgroundColor: 'var(--card-bg, #1a1a2e)',
                borderRadius: '8px',
                marginTop: '0.5rem',
                border: '1px solid var(--border-color, #333)',
              }}>
                <strong style={{ fontSize: '0.85rem' }}>🔍 Condição</strong>
                <div className="form-group" style={{ marginTop: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem' }}>Campo</label>
                  <input
                    type="text"
                    value={data.condition_field || ''}
                    onChange={(e) => updateData('condition_field', e.target.value)}
                    placeholder="userId"
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <div className="form-group" style={{ flex: '0 0 130px' }}>
                    <select
                      value={data.condition_operator || 'eq'}
                      onChange={(e) => updateData('condition_operator', e.target.value)}
                      style={{ fontSize: '0.8rem', backgroundColor: 'var(--input-bg, #1e1e2e)', color: 'var(--text-primary, #e0e0e0)', borderColor: 'var(--border-color, #333)' }}
                    >
                      <option value="eq">= Igual</option>
                      <option value="neq">≠ Diferente</option>
                      <option value="gt">&gt; Maior</option>
                      <option value="gte">≥ Maior/igual</option>
                      <option value="lt">&lt; Menor</option>
                      <option value="lte">≤ Menor/igual</option>
                      <option value="contains">Contém</option>
                      <option value="not_contains">Não contém</option>
                      <option value="exists">Existe</option>
                      <option value="not_exists">Não existe</option>
                    </select>
                  </div>
                  {!['exists', 'not_exists'].includes(data.condition_operator) && (
                    <div className="form-group" style={{ flex: 1 }}>
                      <input
                        type="text"
                        value={data.condition_value || ''}
                        onChange={(e) => updateData('condition_value', e.target.value)}
                        placeholder="Valor"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {needsSort && (
              <div style={{
                padding: '0.8rem',
                backgroundColor: 'var(--card-bg, #1a1a2e)',
                borderRadius: '8px',
                marginTop: '0.5rem',
                border: '1px solid var(--border-color, #333)',
              }}>
                <strong style={{ fontSize: '0.85rem' }}>{dsOp === 'sum' ? '➕ Campo para Somar' : '↕️ Ordenação'}</strong>
                <div className="form-group" style={{ marginTop: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem' }}>Campo</label>
                  <input
                    type="text"
                    value={data.sort_field || ''}
                    onChange={(e) => updateData('sort_field', e.target.value)}
                    placeholder="preco"
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
                {dsOp === 'sort' && (
                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem' }}>Ordem</label>
                    <select
                      value={data.sort_order || 'asc'}
                      onChange={(e) => updateData('sort_order', e.target.value)}
                      style={{ backgroundColor: 'var(--input-bg, #1e1e2e)', color: 'var(--text-primary, #e0e0e0)', borderColor: 'var(--border-color, #333)' }}
                    >
                      <option value="asc">↑ Crescente (A→Z, 1→9)</option>
                      <option value="desc">↓ Decrescente (Z→A, 9→1)</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {needsGroup && (
              <div className="form-group">
                <label>Campo para Agrupar</label>
                <input
                  type="text"
                  value={data.group_field || ''}
                  onChange={(e) => updateData('group_field', e.target.value)}
                  placeholder="categoria"
                  style={{ fontFamily: 'monospace' }}
                />
                <small style={{ color: 'var(--text-secondary, #888)' }}>
                  O resultado será um objeto onde cada chave é um valor do campo, e o valor é a lista de itens daquele grupo.
                </small>
              </div>
            )}

            <div style={{
              padding: '0.8rem',
              backgroundColor: 'var(--card-bg, rgba(100,100,255,0.05))',
              borderRadius: '8px',
              marginTop: '1rem',
              border: '1px solid var(--border-color, #333)',
            }}>
              <strong style={{ fontSize: '0.85rem' }}>💡 Exemplos de uso:</strong>
              <div style={{ fontSize: '0.78rem', marginTop: '0.5rem', lineHeight: 1.7 }}>
                <div><strong>Filtrar pedidos:</strong> Fonte: <code>api_response</code> → Filtrar → Campo: <code>userId</code> = <code>1</code></div>
                <div><strong>Contar itens:</strong> Fonte: <code>pedidos</code> → Contar → Salvar em: <code>total_pedidos</code></div>
                <div><strong>Somar valores:</strong> Fonte: <code>pedidos</code> → Somar → Campo: <code>valor</code></div>
                <div><strong>Ordenar:</strong> Fonte: <code>produtos</code> → Ordenar → Campo: <code>preco</code> ↑</div>
                <div><strong>Montar objeto:</strong> Criar Objeto → Definir Campo → <code>nome</code> = <code>{'${{user_input}}'}</code></div>
              </div>
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
                placeholder="Agradecemos o seu contato!"
              />
              <FieldHelper
                description="Última mensagem enviada antes de encerrar a conversa. Após este nó, o contexto é resetado e a próxima mensagem do usuário reinicia o fluxo do início."
                example="Obrigado pelo contato, ${{nome}}! Foi um prazer atendê-lo. Até a próxima! 😊"
                onUseExample={(ex) => updateData('message', ex)}
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

      case 'audio_transcription':
        return (
          <>
            <div className="form-group">
              <label>Rótulo</label>
              <input
                type="text"
                value={data.label || ''}
                onChange={(e) => updateData('label', e.target.value)}
                placeholder="Transcrição de Áudio"
              />
            </div>
            <div className="form-group">
              <label>Provedor de STT</label>
              <select
                value={data.provider || 'openai'}
                onChange={(e) => updateData('provider', e.target.value)}
              >
                <option value="openai">OpenAI Whisper</option>
              </select>
              <FieldHelper
                description="Serviço de Speech-to-Text que converte áudio em texto. Novos provedores serão adicionados futuramente."
              />
            </div>
            <div className="form-group">
              <label>Modelo</label>
              <select
                value={data.model || 'whisper-1'}
                onChange={(e) => updateData('model', e.target.value)}
              >
                <option value="whisper-1">whisper-1 (padrão)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Idioma</label>
              <select
                value={data.language || 'pt'}
                onChange={(e) => updateData('language', e.target.value)}
              >
                <option value="pt">Português</option>
                <option value="en">Inglês</option>
                <option value="es">Espanhol</option>
                <option value="fr">Francês</option>
                <option value="de">Alemão</option>
                <option value="it">Italiano</option>
                <option value="ja">Japonês</option>
                <option value="ko">Coreano</option>
                <option value="zh">Chinês</option>
                <option value="ar">Árabe</option>
              </select>
              <FieldHelper
                description="Idioma principal do áudio. Definir o idioma correto melhora a precisão da transcrição."
              />
            </div>
            <ApiKeyField
              label="API Key"
              value={data.api_key || ''}
              onChange={(val) => updateData('api_key', val)}
              flowId={flowId}
              provider={data.provider || 'openai'}
              helpText="Necessária para transcrever áudios recebidos"
            />
            <div className="form-group">
              <label>Mensagem de fallback</label>
              <textarea
                value={data.fallback_message || ''}
                onChange={(e) => updateData('fallback_message', e.target.value)}
                placeholder="Não foi possível processar seu áudio. Por favor, envie sua mensagem por texto."
              />
              <FieldHelper
                description="Mensagem enviada quando a transcrição falha ou quando o usuário envia áudio e o STT não está configurado corretamente."
              />
            </div>
            <div style={{
              padding: '12px',
              background: 'rgba(255, 152, 0, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 152, 0, 0.3)',
              marginTop: '12px',
              fontSize: '0.85rem',
            }}>
              <strong>📌 Como usar:</strong>
              <p style={{ margin: '8px 0 0 0', lineHeight: 1.5 }}>
                Conecte este nó ao ponto <span style={{ color: '#FF9800' }}>●</span> lateral
                do nó <strong>Início</strong>. Quando conectado, mensagens de áudio
                serão transcritas automaticamente antes de chegar ao fluxo.
                O texto transcrito é processado como se o usuário tivesse digitado.
              </p>
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
              <ApiKeyField
                value={data.api_key || ''}
                onChange={(v) => updateData('api_key', v)}
                flowId={flowId}
                provider={data.ai_provider}
              />
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
              <FieldHelper
                title="O que são intenções?"
                description="Cada intenção é um caminho possível. A IA analisa a mensagem do usuário e identifica qual intenção combina. Cada intenção vira uma saída do nó que você conecta ao próximo passo. Dê um nome claro e uma descrição detalhada — a IA usa a descrição para decidir."
              />
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
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
              <ApiKeyField
                value={data.api_key || ''}
                onChange={(v) => updateData('api_key', v)}
                flowId={flowId}
                provider={data.ai_provider}
              />
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
              <label>Quebrar mensagens longas (caracteres)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="number"
                  value={data.max_message_length ?? 0}
                  onChange={(e) => updateData('max_message_length', parseInt(e.target.value) || 0)}
                  min="0"
                  max="4096"
                  step="100"
                  style={{ width: '100px' }}
                />
                <small style={{ color: '#666', flex: 1 }}>
                  {data.max_message_length > 0
                    ? `Quebra em mensagens de até ${data.max_message_length} caracteres`
                    : 'Desativado — envia tudo em uma mensagem'
                  }
                </small>
              </div>
              <FieldHelper
                description="Quando a resposta da IA é muito longa, divide em múltiplas mensagens menores. A quebra é feita de forma inteligente: primeiro por parágrafos, depois por frases, nunca no meio de uma palavra. Valor 0 = desativado. Recomendado: 800-1500 caracteres."
              />
            </div>

            {data.max_message_length > 0 && (
              <div className="form-group">
                <label>Delay entre mensagens quebradas (segundos)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="number"
                    value={data.message_split_delay ?? 0}
                    onChange={(e) => updateData('message_split_delay', parseFloat(e.target.value) || 0)}
                    min="0"
                    max="10"
                    step="0.5"
                    style={{ width: '80px' }}
                  />
                  <small style={{ color: '#666', flex: 1 }}>
                    {data.message_split_delay > 0
                      ? `Aguarda ${data.message_split_delay}s entre cada parte`
                      : 'Sem delay — envia todas as partes de uma vez'
                    }
                  </small>
                </div>
                <FieldHelper
                  description="Intervalo entre o envio de cada parte da mensagem quebrada. Simula uma digitação mais natural. Valor 0 = sem delay. Recomendado: 1-3 segundos."
                />
              </div>
            )}

            <div className="form-group">
              <label>Debounce (segundos)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="number"
                  value={data.debounce ?? 0}
                  onChange={(e) => updateData('debounce', parseInt(e.target.value) || 0)}
                  min="0"
                  max="30"
                  style={{ width: '80px' }}
                />
                <small style={{ color: '#666', flex: 1 }}>
                  {data.debounce > 0
                    ? `Aguarda ${data.debounce}s antes de processar (junta mensagens rápidas)`
                    : 'Desativado — processa cada mensagem imediatamente'
                  }
                </small>
              </div>
              <FieldHelper
                description="Quando o usuário manda várias mensagens seguidas (ex: 'oi' + 'quero ver meu pedido'), o debounce aguarda o tempo configurado antes de processar. Se chegar outra mensagem nesse intervalo, o timer reinicia e todas as mensagens são processadas juntas numa única chamada à IA. Valor 0 = desativado. Recomendado: 3-5 segundos."
              />
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
              <label>Mensagem de Transição (opcional)</label>
              <textarea
                value={data.transition_message || ''}
                onChange={(e) => updateData('transition_message', e.target.value)}
                placeholder="Ex: Vou transferir você para nosso especialista..."
                rows={2}
              />
              <FieldHelper
                description="Enviada quando este agente transfere a conversa para outro agente ou nó usando a tool 'Ir para'. Se vazio, transfere silenciosamente. Aceita variáveis do contexto."
                example="Um momento, vou transferir você para nosso especialista em ${{assunto}}. 😊"
                onUseExample={(ex) => updateData('transition_message', ex)}
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
              <label>🔧 Tools (Ferramentas)</label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.35rem',
                marginBottom: '0.75rem',
              }}>
                {[
                  { icon: '🌐', label: 'HTTP', color: '#6366f1', type: 'http_request', defaults: { name: `tool_${Date.now()}`, type: 'http_request', description: '', method: 'GET', url: '', headers: {}, parameters: { type: 'object', properties: {}, required: [] } } },
                  { icon: '💾', label: 'Contexto', color: '#F59E0B', type: 'context_lookup', defaults: { name: `context_${Date.now()}`, type: 'context_lookup', description: 'Busca informações do contexto da conversa', parameters: { type: 'object', properties: { key: { type: 'string', description: 'A chave do contexto a buscar' } }, required: ['key'] } } },
                  { icon: '🔘', label: 'Botões', color: '#2196F3', type: 'send_buttons', defaults: { name: 'enviar_botoes', type: 'send_buttons', description: 'Envia botões clicáveis para simplificar a escolha do usuário. Use quando houver até 3 opções claras.' } },
                  { icon: '📋', label: 'Lista', color: '#009688', type: 'send_list', defaults: { name: 'enviar_lista', type: 'send_list', description: 'Envia uma lista de opções para o usuário selecionar. Use quando houver mais de 3 opções.' } },
                  { icon: '🧠', label: 'RAG', color: '#8B5CF6', type: 'knowledge_search', defaults: { name: 'buscar_conhecimento', type: 'knowledge_search', description: 'Busca informações na base de conhecimento. Use para responder perguntas sobre produtos, políticas, procedimentos e qualquer informação documentada.', knowledge_base_id: null, top_k: 5, min_score: 0.3 } },
                  { icon: '👤', label: 'Transferir', color: '#7C3AED', type: 'transfer_department', defaults: { name: 'transferir_departamento', type: 'transfer_department', description: 'Transfere o atendimento para um departamento de atendimento humano.', departments: [] } },
                  { icon: '💾', label: 'Salvar', color: '#F59E0B', type: 'save_context', defaults: { name: 'salvar_dados', type: 'save_context', description: 'Salva informações do cliente extraídas da conversa (nome, CPF, endereço, preferências).' } },
                  { icon: '🏁', label: 'Finalizar', color: '#EF4444', type: 'end_chat', defaults: { name: 'finalizar_atendimento', type: 'end_chat', description: 'Finaliza o atendimento e encerra a conversa.' } },
                  { icon: '⚡', label: 'Custom', color: '#4CAF50', type: 'function', defaults: { name: `custom_${Date.now()}`, type: 'function', description: 'Descreva o que esta função faz.', parameters: { type: 'object', properties: {}, required: [] }, context_key: '', code: '# args = argumentos da IA\n# context = dados da conversa\n# secrets = credenciais\n\nresult = {"status": "ok"}' } },
                ].map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => {
                      const tools = data.tools || []
                      updateData('tools', [...tools, { ...item.defaults }])
                    }}
                    style={{
                      padding: '0.4rem 0.25rem',
                      fontSize: '0.72rem',
                      fontWeight: 500,
                      backgroundColor: 'transparent',
                      color: item.color,
                      border: `1px solid ${item.color}30`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.15rem',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${item.color}15`
                      e.currentTarget.style.borderColor = `${item.color}60`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.borderColor = `${item.color}30`
                    }}
                    title={`Adicionar ${item.label}`}
                  >
                    <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}</div>

              {(data.tools || []).map((tool, index) => {
                const isExpanded = expandedOption === `tool_${index}`
                const toolTypeLabel = {
                  http_request: '🌐 HTTP Request',
                  context_lookup: '💾 Contexto',
                  send_buttons: '🔘 Botões',
                  send_list: '📋 Lista',
                  knowledge_search: '🧠 RAG',
                  transfer_to_node: '🔀 Ir para',
                  transfer_department: '👤 Transferir',
                  save_context: '💾 Salvar Dados',
                  end_chat: '🏁 Finalizar',
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

                        {tool.type === 'transfer_department' && (
                          <div style={{ marginBottom: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>
                              Departamentos Disponíveis
                            </label>
                            {loadingDepartments ? (
                              <div style={{ padding: '0.5rem', color: '#666', fontSize: '0.8rem' }}>
                                Carregando departamentos...
                              </div>
                            ) : departments.length > 0 ? (
                              <>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.25rem' }}>
                                  {departments.map((dept) => {
                                    const isSelected = (tool.departments || []).some(d => d.id === dept.id)
                                    return (
                                      <label
                                        key={dept.id}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.5rem',
                                          padding: '0.4rem 0.5rem',
                                          borderRadius: '6px',
                                          border: `1px solid ${isSelected ? '#7C3AED40' : '#ddd'}`,
                                          backgroundColor: isSelected ? '#7C3AED08' : 'transparent',
                                          cursor: 'pointer',
                                          fontSize: '0.82rem',
                                        }}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => {
                                            const tools = [...(data.tools || [])]
                                            const current = tool.departments || []
                                            const updated = isSelected
                                              ? current.filter(d => d.id !== dept.id)
                                              : [...current, { id: dept.id, name: dept.name }]
                                            tools[index] = { ...tool, departments: updated }
                                            updateData('tools', tools)
                                          }}
                                        />
                                        <span>{dept.name}</span>
                                        <span style={{ color: '#999', fontSize: '0.72rem' }}>ID: {dept.id}</span>
                                      </label>
                                    )
                                  })}
                                </div>
                                <FieldHelper
                                  title="Como funciona a transferência por IA"
                                  description="Selecione os departamentos que a IA pode usar. Quando o usuário pedir para falar com alguém, a IA vai identificar o departamento mais adequado com base na conversa e transferir automaticamente. A IA também gera uma mensagem de despedida personalizada."
                                />
                              </>
                            ) : (
                              <div style={{ padding: '0.5rem', color: '#856404', backgroundColor: '#fff3cd', borderRadius: '4px', fontSize: '0.8rem' }}>
                                Nenhum departamento encontrado. Verifique a conexão com o MonitChat.
                              </div>
                            )}
                          </div>
                        )}

                        {tool.type === 'transfer_to_node' && (
                          <div style={{ marginBottom: '0.5rem' }}>
                            <FieldHelper
                              title="Como funciona"
                              description="Conecte os nós de destino na saída do agente. A IA vai detectar automaticamente quais nós estão conectados e transferir quando o prompt indicar. Exemplo: conecte um 'Agente Futebol' na saída e instrua no prompt 'se o assunto for futebol, transfira para o especialista'."
                            />
                          </div>
                        )}

                        {tool.type === 'knowledge_search' && (
                          <div style={{ marginBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div>
                              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Base de Conhecimento</label>
                              {loadingKnowledgeBases ? (
                                <div style={{ padding: '0.4rem', fontSize: '0.8rem', color: '#888' }}>Carregando...</div>
                              ) : (
                                <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.2rem' }}>
                                  <select
                                    value={tool.knowledge_base_id || ''}
                                    onChange={(e) => {
                                      const tools = [...(data.tools || [])]
                                      tools[index] = { ...tool, knowledge_base_id: e.target.value ? parseInt(e.target.value) : null }
                                      updateData('tools', tools)
                                    }}
                                    style={{ fontSize: '0.85rem', flex: 1, padding: '0.4rem' }}
                                  >
                                    <option value="">Selecione uma base...</option>
                                    {knowledgeBases.map((kb) => (
                                      <option key={kb.id} value={kb.id}>{kb.name} ({kb.chunk_count} chunks)</option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => openKBPanel((newKbId) => {
                                      if (newKbId) {
                                        const tools = [...(data.tools || [])]
                                        tools[index] = { ...tool, knowledge_base_id: newKbId }
                                        updateData('tools', tools)
                                      }
                                    })}
                                    style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem', backgroundColor: '#8B5CF6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                  >+ Nova</button>
                                </div>
                              )}
                              {tool.knowledge_base_id && (
                                <button
                                  type="button"
                                  onClick={() => openKBPanel()}
                                  style={{ marginTop: '0.35rem', padding: '0.35rem 0.6rem', fontSize: '0.75rem', backgroundColor: 'transparent', color: '#8B5CF6', border: '1px solid #8B5CF640', borderRadius: '6px', cursor: 'pointer', width: '100%' }}
                                >
                                  🧠 Gerenciar base (upload, textos, configurações)
                                </button>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                              <div>
                                <label style={{ fontSize: '0.78rem', fontWeight: 'normal', display: 'block', marginBottom: '0.2rem' }}>Top K</label>
                                <input type="number" value={tool.top_k || 5} onChange={(e) => { const t = [...(data.tools || [])]; t[index] = { ...tool, top_k: parseInt(e.target.value) || 5 }; updateData('tools', t) }} min={1} max={20} style={{ fontSize: '0.85rem', width: '70px', padding: '0.3rem' }} />
                                <small style={{ color: '#666', fontSize: '0.68rem', display: 'block' }}>Máx. trechos</small>
                              </div>
                              <div>
                                <label style={{ fontSize: '0.78rem', fontWeight: 'normal', display: 'block', marginBottom: '0.2rem' }}>Score Mín.</label>
                                <input type="number" value={tool.min_score ?? 0.3} onChange={(e) => { const t = [...(data.tools || [])]; t[index] = { ...tool, min_score: parseFloat(e.target.value) || 0 }; updateData('tools', t) }} min={0} max={1} step={0.05} style={{ fontSize: '0.85rem', width: '70px', padding: '0.3rem' }} />
                                <small style={{ color: '#666', fontSize: '0.68rem', display: 'block' }}>0-1 (0.3=30%)</small>
                              </div>
                            </div>
                            <FieldHelper
                              title="Como funciona o RAG"
                              description="A IA busca na base de conhecimento os trechos mais relevantes para a pergunta do usuário. Top K = quantos trechos retornar. Score Mínimo = relevância mínima (0.3 = 30%)."
                            />
                          </div>
                        )}

                        {tool.type === 'function' && (
                          <>
                          <div style={{ marginBottom: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>
                              Salvar resultado em (Context Key)
                            </label>
                            <input
                              type="text"
                              value={tool.context_key || ''}
                              onChange={(e) => {
                                const tools = [...(data.tools || [])]
                                tools[index] = { ...tool, context_key: e.target.value }
                                updateData('tools', tools)
                              }}
                              placeholder={tool.name || 'custom_result'}
                              style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}
                            />
                            <FieldHelper
                              description={`O resultado será salvo no contexto com esta chave. Se vazio, usa o nome da tool ("${tool.name || 'custom'}"). Depois acesse com $\{{${tool.context_key || tool.name || 'custom'}}}.`}
                            />
                          </div>
                          <div style={{ marginBottom: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>
                              Código Python
                            </label>
                            <textarea
                              value={tool.code || ''}
                              onChange={(e) => {
                                const tools = [...(data.tools || [])]
                                tools[index] = { ...tool, code: e.target.value }
                                updateData('tools', tools)
                              }}
                              placeholder="# Escreva seu código aqui&#10;# Use 'args' para acessar os argumentos da IA&#10;# Use 'context' para dados da conversa&#10;# Use 'secrets' para credenciais&#10;# Defina 'result' com o retorno&#10;&#10;result = {'status': 'ok'}"
                              rows={10}
                              style={{ fontSize: '0.82rem', fontFamily: 'monospace', lineHeight: 1.5 }}
                            />
                            <FieldHelper
                              title="Como escrever uma Custom Function"
                              description="Escreva código Python que será executado quando a IA chamar esta tool. Você tem acesso a variáveis pré-definidas e deve definir 'result' com o retorno."
                              example={`# Variáveis disponíveis:\n# args    → argumentos que a IA forneceu (dict)\n# context → dados da conversa (dict)\n# secrets → credenciais do fluxo (dict)\n# json    → módulo json do Python\n# re      → módulo de regex\n# math    → módulo math\n# datetime → módulo datetime\n\n# Exemplo: calcular parcelas\nvalor = float(args.get("valor", 0))\nparcelas = int(args.get("parcelas", 1))\ntaxa = 0.029  # 2.9% ao mês\n\nvalor_parcela = valor * (taxa * (1 + taxa) ** parcelas) / ((1 + taxa) ** parcelas - 1)\n\nresult = {\n    "valor_total": round(valor * (1 + taxa * parcelas), 2),\n    "valor_parcela": round(valor_parcela, 2),\n    "parcelas": parcelas\n}`}
                              onUseExample={(ex) => {
                                const tools = [...(data.tools || [])]
                                tools[index] = { ...tool, code: ex }
                                updateData('tools', tools)
                              }}
                            />
                          </div>
                          </>
                        )}

                        {!['transfer_department', 'save_context', 'end_chat', 'send_buttons', 'send_list', 'knowledge_search', 'transfer_to_node'].includes(tool.type) && (
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
                        )}
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
                <option value="save_context">💾 Salvar Dados na Conversa</option>
                <option value="send_buttons">🔘 Enviar Botões</option>
                <option value="send_list">📋 Enviar Lista</option>
                <option value="knowledge_search">🧠 Base de Conhecimento (RAG)</option>
                <option value="transfer_department">👤 Transferir Departamento</option>
                <option value="end_chat">🏁 Finalizar Atendimento</option>
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

            {(data.tool_type) === 'transfer_department' && (
              <div className="form-group">
                <label>Departamentos Disponíveis</label>
                {loadingDepartments ? (
                  <div style={{ padding: '0.5rem', color: '#666', fontSize: '0.8rem' }}>
                    Carregando departamentos...
                  </div>
                ) : departments.length > 0 ? (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {departments.map((dept) => {
                        const isSelected = (data.departments || []).some(d => d.id === dept.id)
                        return (
                          <label
                            key={dept.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.4rem 0.5rem',
                              borderRadius: '6px',
                              border: `1px solid ${isSelected ? '#7C3AED40' : '#ddd'}`,
                              backgroundColor: isSelected ? '#7C3AED08' : 'transparent',
                              cursor: 'pointer',
                              fontSize: '0.82rem',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                const current = data.departments || []
                                const updated = isSelected
                                  ? current.filter(d => d.id !== dept.id)
                                  : [...current, { id: dept.id, name: dept.name }]
                                updateData('departments', updated)
                              }}
                            />
                            <span>{dept.name}</span>
                            <span style={{ color: '#999', fontSize: '0.72rem' }}>ID: {dept.id}</span>
                          </label>
                        )
                      })}
                    </div>
                    <FieldHelper
                      title="Como funciona a transferência por IA"
                      description="Selecione os departamentos que a IA pode usar. Quando o usuário pedir para falar com alguém, a IA vai identificar o departamento mais adequado com base na conversa e transferir automaticamente."
                    />
                  </>
                ) : (
                  <div style={{ padding: '0.5rem', color: '#856404', backgroundColor: '#fff3cd', borderRadius: '4px', fontSize: '0.8rem' }}>
                    Nenhum departamento encontrado.
                  </div>
                )}
              </div>
            )}

            {(data.tool_type) === 'function' && (
              <>
              <div className="form-group">
                <label>Salvar resultado em (Context Key)</label>
                <input
                  type="text"
                  value={data.context_key || ''}
                  onChange={(e) => updateData('context_key', e.target.value)}
                  placeholder={data.name || 'custom_result'}
                  style={{ fontFamily: 'monospace' }}
                />
                <FieldHelper
                  description={`O resultado será salvo no contexto com esta chave. Se vazio, usa o nome da tool. Depois acesse com $\{{${data.context_key || data.name || 'custom'}}}.`}
                />
              </div>
              <div className="form-group">
                <label>Código Python</label>
                <textarea
                  value={data.code || ''}
                  onChange={(e) => updateData('code', e.target.value)}
                  placeholder="# Escreva seu código aqui&#10;# Defina 'result' com o retorno&#10;&#10;result = {'status': 'ok'}"
                  rows={12}
                  style={{ fontFamily: 'monospace', fontSize: '0.82rem', lineHeight: 1.5 }}
                />
                <FieldHelper
                  title="Como escrever uma Custom Function"
                  description="Escreva código Python que será executado quando a IA chamar esta tool. Você tem acesso a variáveis pré-definidas e deve definir 'result' com o retorno."
                  example={`# Variáveis disponíveis:\n# args    → argumentos que a IA forneceu (dict)\n# context → dados da conversa (dict)\n# secrets → credenciais do fluxo (dict)\n# json    → módulo json do Python\n# re      → módulo de regex\n# math    → módulo math\n# datetime → módulo datetime\n\n# Exemplo: formatar endereço\nrua = args.get("rua", "")\nnumero = args.get("numero", "")\ncidade = args.get("cidade", "")\nuf = args.get("uf", "")\n\nendereco = f"{rua}, {numero} - {cidade}/{uf}"\n\nresult = {\n    "endereco_formatado": endereco,\n    "completo": bool(rua and numero and cidade and uf)\n}`}
                  onUseExample={(ex) => updateData('code', ex)}
                />
              </div>
              </>
            )}

            {(data.tool_type) === 'knowledge_search' && (
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div>
                  <label>Base de Conhecimento</label>
                  {loadingKnowledgeBases ? (
                    <div style={{ padding: '0.4rem', fontSize: '0.8rem', color: '#888' }}>Carregando...</div>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <select
                        value={data.knowledge_base_id || ''}
                        onChange={(e) => updateData('knowledge_base_id', e.target.value ? parseInt(e.target.value) : null)}
                        style={{ fontSize: '0.9rem', flex: 1 }}
                      >
                        <option value="">Selecione uma base...</option>
                        {knowledgeBases.map((kb) => (
                          <option key={kb.id} value={kb.id}>{kb.name} ({kb.chunk_count} chunks)</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => openKBPanel((newKbId) => {
                          if (newKbId) updateData('knowledge_base_id', newKbId)
                        })}
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem', backgroundColor: '#8B5CF6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >+ Nova</button>
                    </div>
                  )}
                  {data.knowledge_base_id && (
                    <button
                      type="button"
                      onClick={() => openKBPanel()}
                      style={{ marginTop: '0.35rem', padding: '0.35rem 0.6rem', fontSize: '0.75rem', backgroundColor: 'transparent', color: '#8B5CF6', border: '1px solid #8B5CF640', borderRadius: '6px', cursor: 'pointer', width: '100%' }}
                    >
                      🧠 Gerenciar base (upload, textos, configurações)
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.2rem' }}>Top K</label>
                    <input type="number" value={data.top_k || 5} onChange={(e) => updateData('top_k', parseInt(e.target.value) || 5)} min={1} max={20} style={{ fontSize: '0.85rem' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.2rem' }}>Score Mín.</label>
                    <input type="number" value={data.min_score ?? 0.3} onChange={(e) => updateData('min_score', parseFloat(e.target.value) || 0)} min={0} max={1} step={0.05} style={{ fontSize: '0.85rem' }} />
                  </div>
                </div>
                <FieldHelper
                  title="Como funciona o RAG"
                  description="A IA busca na base de conhecimento os trechos mais relevantes para a pergunta do usuário. Top K = quantos trechos retornar. Score Mínimo = relevância mínima."
                />
              </div>
            )}

            {!['transfer_department', 'save_context', 'end_chat', 'send_buttons', 'send_list', 'knowledge_search', 'transfer_to_node'].includes(data.tool_type) && (
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
            )}

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
              <label>Mensagem (pergunta para o usuário)</label>
              <textarea
                value={data.message || ''}
                onChange={(e) => updateData('message', e.target.value)}
                placeholder="Ex: Por favor, digite seu CPF:"
                rows={2}
              />
              <FieldHelper
                description="Mensagem enviada ao usuário antes de esperar a resposta. Ex: 'Qual é o seu CPF?', 'Digite o número do pedido:'"
                example="Por favor, informe seu CPF para que possamos localizar seu cadastro:"
                onUseExample={(ex) => updateData('message', ex)}
              />
            </div>
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
              <FieldHelper
                description="O valor digitado pelo usuário será salvo nesta chave. Depois você pode usar ${{chave}} em outros nós. Ex: se a chave for 'cpf', use ${{cpf}} em mensagens ou URLs de API."
              />
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
              <FieldHelper
                description="Mensagem exibida quando o usuário digita algo inválido. Se vazio, usa uma mensagem padrão do tipo selecionado. O usuário pode tentar novamente."
                example="CPF inválido! Por favor, digite os 11 números do seu CPF."
                onUseExample={(ex) => updateData('validation', { ...data.validation, error_message: ex })}
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
                  extraSuggestions={allExtraSuggestions}
                value={data.url || ''}
                onChange={(e) => updateData('url', e.target.value)}
                placeholder="https://exemplo.com/arquivo.pdf"
                rows={2}
              />
              <FieldHelper
                description="URL pública e direta para o arquivo. Pode usar variáveis do contexto se a URL for dinâmica (ex: boleto gerado por API)."
                example={`https://cdn.empresa.com/boletos/$\{{boleto_id}}.pdf`}
                onUseExample={(ex) => updateData('url', ex)}
              />
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
                  extraSuggestions={allExtraSuggestions}
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

      case 'start':
        return (
          <>
            <div className="form-group">
              <label>Mensagem de Saída (quando o usuário digita "sair")</label>
              <AutocompleteTextarea
                extraSuggestions={allExtraSuggestions}
                value={data.exit_message || ''}
                onChange={(e) => updateData('exit_message', e.target.value)}
                placeholder="Conversa encerrada. Digite qualquer coisa para recomeçar."
                rows={3}
              />
              <FieldHelper
                description="Mensagem enviada quando o usuário digita uma palavra de saída (sair, encerrar, etc). Deixe vazio para usar a mensagem padrão."
                example="Obrigado pelo contato! Esperamos ter ajudado. 😊"
                onUseExample={(ex) => updateData('exit_message', ex)}
              />
            </div>
            <div className="form-group">
              <label>Mensagem de Voltar (quando o usuário digita "voltar")</label>
              <AutocompleteTextarea
                extraSuggestions={allExtraSuggestions}
                value={data.back_message || ''}
                onChange={(e) => updateData('back_message', e.target.value)}
                placeholder="Voltando ao passo anterior..."
                rows={2}
              />
              <FieldHelper
                description="Mensagem enviada quando o usuário digita 'voltar'. Deixe vazio para apenas voltar sem mensagem."
              />
            </div>
            <div className="form-group">
              <label>Rótulo</label>
              <input
                type="text"
                value={data.label || ''}
                onChange={(e) => updateData('label', e.target.value)}
                placeholder="Início do fluxo"
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

            {/* Banner de contexto de loop */}
            {loopContext && (
              <div style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '6px',
                fontSize: '0.8rem',
                marginTop: '-0.5rem',
              }}>
                <strong style={{ color: '#f59e0b' }}>🔄 Dentro de um Loop</strong>
                <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary, #888)' }}>
                  Variáveis: <code>{'${{' + (loopContext.item_variable || 'item') + '}}'}</code>,
                  <code>{'${{loop.index}}'}</code>,
                  <code>{'${{loop.key}}'}</code>
                </span>
              </div>
            )}

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

          {/* Limite de tentativas — disponível em nós interativos */}
          {!['start', 'end', 'ai_tool', 'expression', 'data_structure',
              'set_context', 'delay', 'loop'].includes(node.type) && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-input)',
            }}>
              <div
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontWeight: 'bold',
                  color: 'var(--text-primary)',
                }}
                onClick={() => {
                  const el = document.getElementById('retry-config')
                  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none'
                }}
              >
                <span>🔄 Limite de Tentativas</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  {data.max_retries > 0 ? `${data.max_retries} tentativas` : 'Desabilitado'}
                </span>
              </div>
              <div id="retry-config" style={{ display: data.max_retries > 0 ? 'block' : 'none', marginTop: '0.75rem' }}>
                <div className="form-group">
                  <label>Máximo de tentativas</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={data.max_retries || 0}
                    onChange={(e) => updateData('max_retries', parseInt(e.target.value) || 0)}
                    placeholder="0 = desabilitado"
                  />
                  <small style={{ color: 'var(--text-dim)' }}>
                    Se o usuário ficar preso neste nó por N tentativas, será redirecionado. 0 = sem limite.
                  </small>
                </div>
                {data.max_retries > 0 && (
                  <>
                    <div className="form-group">
                      <label>Nó de fallback (redirecionamento)</label>
                      <select
                        value={data.fallback_node || ''}
                        onChange={(e) => updateData('fallback_node', e.target.value)}
                      >
                        <option value="">Voltar ao início do fluxo</option>
                        {nodes
                          .filter(n => n.id !== node.id && n.type !== 'ai_tool')
                          .map(n => (
                            <option key={n.id} value={n.id}>
                              {n.data?.label || n.type} ({n.id})
                            </option>
                          ))
                        }
                      </select>
                      <small style={{ color: '#888' }}>
                        Para onde o usuário será enviado após atingir o limite. Vazio = volta ao início.
                      </small>
                    </div>
                    <div className="form-group">
                      <label>Mensagem de fallback</label>
                      <AutocompleteTextarea
                        extraSuggestions={allExtraSuggestions}
                        value={data.fallback_message || ''}
                        onChange={(e) => updateData('fallback_message', e.target.value)}
                        placeholder="Você atingiu o número máximo de tentativas."
                        rows={2}
                      />
                      <small style={{ color: '#888' }}>
                        Mensagem enviada antes de redirecionar. Deixe vazio para usar a padrão.
                      </small>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
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

      {showKBPanel && (
        <KnowledgeBasePanel
          flowId={flowId}
          onClose={closeKBPanel}
        />
      )}
    </div>
  )
}

export default NodeEditorModal
