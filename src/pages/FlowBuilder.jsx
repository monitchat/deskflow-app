import { useCallback, useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow'
import 'reactflow/dist/style.css'
import api from '../config/axios'

import Sidebar from '../components/Sidebar'
import NodeEditorModal from '../components/NodeEditorModal'
import EdgeEditorModal from '../components/EdgeEditorModal'
import CustomNode from '../components/CustomNode'
import SessionDebugPanel from '../components/SessionDebugPanel'
import Playground from '../components/Playground'
import Header from '../components/Header'
import SecretsPanel from '../components/SecretsPanel'
import AccountsPanel from '../components/AccountsPanel'
import ApiKeysPanel from '../components/ApiKeysPanel'
import UsersPanel from '../components/UsersPanel'
import ConfirmModal from '../components/ConfirmModal'
import KnowledgeBasePanel from '../components/KnowledgeBasePanel'
import ExecutionLogsPanel from '../components/ExecutionLogsPanel'
import TutorialModal from '../components/TutorialModal'
import { useToast as __useToast } from '../contexts/ToastContext'

const nodeTypes = {
  start: CustomNode,
  message: CustomNode,
  button: CustomNode,
  list: CustomNode,
  condition: CustomNode,
  router: CustomNode,
  ai_router: CustomNode,
  ai_agent: CustomNode,
  ai_tool: CustomNode,
  api_call: CustomNode,
  api_request: CustomNode,
  set_context: CustomNode,
  delay: CustomNode,
  transfer: CustomNode,
  set_ticket_status: CustomNode,
  media: CustomNode,
  jump_to: CustomNode,
  loop: CustomNode,
  expression: CustomNode,
  data_structure: CustomNode,
  end: CustomNode,
  input: CustomNode,
  audio_transcription: CustomNode,
}

let id = 0
const getId = () => `node_${id++}`

function FlowBuilderInner() {
  const { id: flowId } = useParams()
  const toast = __useToast()
  const navigate = useNavigate()
  const { screenToFlowPosition } = useReactFlow()

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [flowName, setFlowName] = useState('Novo Fluxo')
  const [flowDescription, setFlowDescription] = useState('')
  const [selectedNode, setSelectedNode] = useState(null)
  const [showNodeEditor, setShowNodeEditor] = useState(false)
  const [selectedEdge, setSelectedEdge] = useState(null)
  const [showEdgeEditor, setShowEdgeEditor] = useState(false)
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [showPlayground, setShowPlayground] = useState(false)
  const [showSecrets, setShowSecrets] = useState(false)
  const [showAccounts, setShowAccounts] = useState(false)
  const [showApiKeys, setShowApiKeys] = useState(false)
  const [showUsers, setShowUsers] = useState(false)
  const [showKnowledge, setShowKnowledge] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const isAdmin = localStorage.getItem('user_is_admin') === 'true'
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [connectionMenu, setConnectionMenu] = useState(null) // { x, y, sourceNodeId }
  const [copiedNode, setCopiedNode] = useState(null)
  const [sidebarPinned, setSidebarPinned] = useState(() => {
    const saved = localStorage.getItem('deskflow-sidebar-pinned')
    return saved !== null ? saved === 'true' : true
  })
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const connectingNodeId = useRef(null) // Armazena o ID do nó de origem durante drag
  const [confirmModal, setConfirmModal] = useState(null)
  const confirmResolveRef = useRef(null)
  const [showTutorial, setShowTutorial] = useState(() => {
    const seen = localStorage.getItem('deskflow-tutorial-seen')
    return !seen
  })

  const showConfirm = useCallback((config) => {
    return new Promise((resolve) => {
      confirmResolveRef.current = resolve
      setConfirmModal(config)
    })
  }, [])

  const START_NODE = {
    id: 'node_start',
    type: 'start',
    position: { x: 250, y: 50 },
    data: { label: 'Início' },
    deletable: false,
  }

  useEffect(() => {
    if (flowId && flowId !== 'new') {
      loadFlow()
    } else {
      // Fluxo novo — já coloca o nó start no canvas
      setNodes([START_NODE])
    }
  }, [flowId])

  // Auto-save com debounce
  useEffect(() => {
    // Não salva se auto-save estiver desabilitado, for fluxo novo ou se ainda não carregou
    if (!autoSaveEnabled || !flowId || flowId === 'new' || nodes.length === 0) {
      return
    }

    // Debounce de 2 segundos
    const timer = setTimeout(() => {
      autoSave()
    }, 2000)

    return () => clearTimeout(timer)
  }, [nodes, edges, flowName, flowDescription, autoSaveEnabled])

  // Listener de teclado para deletar, copiar e colar nós
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ignora se estiver editando um input
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'SELECT') {
        return
      }

      // Delete ou Backspace
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedNodeId) {
          event.preventDefault()
          showConfirm({
            title: 'Excluir nó',
            message: 'Deseja excluir este nó e todas as suas conexões?',
            confirmText: 'Excluir',
            variant: 'destructive',
          }).then((accepted) => {
            if (accepted) {
              onDeleteNode(selectedNodeId)
              setSelectedNodeId(null)
            }
          })
        }
      }

      // Ctrl+C - Copiar nó (exceto start)
      if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        if (selectedNodeId) {
          const node = nodes.find(n => n.id === selectedNodeId)
          if (node && node.type !== 'start') {
            setCopiedNode(node)
          }
        }
      }

      // Ctrl+V - Colar nó
      if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        if (copiedNode) {
          event.preventDefault()
          const newNodeId = getId()
          const newNode = {
            ...copiedNode,
            id: newNodeId,
            position: {
              x: copiedNode.position.x + 50,
              y: copiedNode.position.y + 50,
            },
            selected: false,
            data: { ...copiedNode.data },
          }
          // Remove dados de execução temporários
          delete newNode.data._executionResult
          setNodes((nds) => [...nds, newNode])
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedNodeId, nodes, copiedNode])

  // Atualiza o nó selecionado quando ocorre seleção no ReactFlow
  const onSelectionChange = useCallback((params) => {
    if (params.nodes.length > 0) {
      setSelectedNodeId(params.nodes[0].id)
    } else {
      setSelectedNodeId(null)
    }
  }, [])

  // Listeners para eventos dos botões no nó
  useEffect(() => {
    const handleEditNode = (event) => {
      const { nodeId, nodeType, nodeData } = event.detail
      console.log('EditNode event fired, nodeId:', nodeId, 'type:', nodeType)

      // Busca o nó completo na lista de nós
      const node = nodes.find(n => n.id === nodeId)
      if (node) {
        console.log('Opening editor for node:', node.id)
        setSelectedNode(node)
        setShowNodeEditor(true)
      } else {
        console.warn('Node not found:', nodeId)
      }
    }

    const handleDeleteNode = async (event) => {
      const { nodeId } = event.detail
      const accepted = await showConfirm({
        title: 'Excluir nó',
        message: 'Deseja excluir este nó e todas as suas conexões?',
        confirmText: 'Excluir',
        variant: 'destructive',
      })
      if (accepted) {
        onDeleteNode(nodeId)
      }
    }

    const handleExecuteNode = async (event) => {
      const { nodeId } = event.detail
      try {
        // Pega uma sessão ativa para usar como contexto
        let msisdn = 'standalone_exec'
        try {
          const sessionsResp = await api.get('/api/v1/flows/sessions?limit=1')
          const sessions = sessionsResp.data?.data?.sessions || []
          if (sessions.length > 0) {
            msisdn = sessions[0].msisdn
          }
        } catch {}

        const resp = await api.post('/api/v1/flows/playground/execute-node', {
          flow_id: parseInt(flowId),
          node_id: nodeId,
          msisdn,
        })

        if (resp.data.success) {
          // Atualiza o nó com resultado visual
          setNodes((nds) =>
            nds.map((node) => {
              if (node.id === nodeId) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    _executionResult: {
                      success: true,
                      timestamp: new Date().toLocaleTimeString('pt-BR'),
                      message: `Executado com sucesso`,
                    }
                  }
                }
              }
              return node
            })
          )
        } else {
          setNodes((nds) =>
            nds.map((node) => {
              if (node.id === nodeId) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    _executionResult: {
                      success: false,
                      timestamp: new Date().toLocaleTimeString('pt-BR'),
                      message: resp.data.error || 'Erro desconhecido',
                    }
                  }
                }
              }
              return node
            })
          )
        }
      } catch (err) {
        console.error('Error executing node:', err)
      }
    }

    const handleNodeExecutionResult = (event) => {
      const { nodeId, ...result } = event.detail
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: { ...node.data, _executionResult: result }
            }
          }
          return node
        })
      )
    }

    window.addEventListener('editNode', handleEditNode)
    window.addEventListener('deleteNode', handleDeleteNode)
    window.addEventListener('executeNode', handleExecuteNode)
    window.addEventListener('nodeExecutionResult', handleNodeExecutionResult)

    return () => {
      window.removeEventListener('editNode', handleEditNode)
      window.removeEventListener('deleteNode', handleDeleteNode)
      window.removeEventListener('executeNode', handleExecuteNode)
      window.removeEventListener('nodeExecutionResult', handleNodeExecutionResult)
    }
  }, [nodes])

  const loadFlow = async () => {
    try {
      const response = await api.get(`/api/v1/flows/${flowId}`)
      const flow = response.data.data

      setFlowName(flow.name)
      setFlowDescription(flow.description || '')

      if (flow.data.nodes) {
        const hasStart = flow.data.nodes.some((n) => n.type === 'start')
        const loadedNodes = hasStart
          ? flow.data.nodes
          : [START_NODE, ...flow.data.nodes]
        setNodes(loadedNodes)
      }
      if (flow.data.edges) {
        setEdges(applyEdgeStyles(flow.data.edges))
      }

      // Atualiza o contador de IDs para evitar conflitos
      const maxId = Math.max(
        ...flow.data.nodes.map((n) =>
          parseInt(n.id.replace('node_', '')) || 0
        ),
        0
      )
      id = maxId + 1
    } catch (error) {
      console.error('Error loading flow:', error)
      toast.error('Erro ao carregar fluxo')
    }
  }

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            markerEnd: { type: MarkerType.ArrowClosed },
            data: {},
            style: { stroke: '#b1b1b7' },
          },
          eds
        )
      ),
    [setEdges]
  )

  const isValidConnection = useCallback(
    (connection) => {
      // Handle "tools" do ai_agent só aceita conexão de ai_tool
      if (connection.targetHandle === 'tools') {
        const sourceNode = nodes.find((n) => n.id === connection.source)
        return sourceNode?.type === 'ai_tool'
      }
      // ai_tool só pode conectar no handle "tools"
      const sourceNode = nodes.find((n) => n.id === connection.source)
      if (sourceNode?.type === 'ai_tool') {
        return connection.targetHandle === 'tools'
      }
      // Handle "subagents" só aceita conexão com ai_agent
      if (connection.sourceHandle === 'subagents') {
        const targetNode = nodes.find((n) => n.id === connection.target)
        return targetNode?.type === 'ai_agent'
      }
      // Handle "config" do start só aceita helpers (audio_transcription, etc)
      if (connection.targetHandle === 'config') {
        const srcNode = nodes.find((n) => n.id === connection.source)
        return srcNode?.type === 'audio_transcription'
      }
      // audio_transcription só pode conectar no handle "config" do start
      if (sourceNode?.type === 'audio_transcription') {
        return connection.targetHandle === 'config'
      }
      return true
    },
    [nodes]
  )

  const onConnectStart = useCallback((event, { nodeId, handleId, handleType }) => {
    connectingNodeId.current = { nodeId, handleId, handleType }
  }, [])

  const onConnectEnd = useCallback(
    (event) => {
      // Verifica se foi solto no pane (canvas vazio)
      const targetIsPane = event.target.classList.contains('react-flow__pane')

      if (targetIsPane && connectingNodeId.current) {
        const { handleType, handleId } = connectingNodeId.current

        // Não mostra menu ao arrastar do handle "config" (target) do Start
        if (handleType === 'target' && handleId === 'config') {
          connectingNodeId.current = null
          return
        }

        // Pega a posição do mouse
        setConnectionMenu({
          x: event.clientX,
          y: event.clientY,
          sourceNodeId: connectingNodeId.current.nodeId,
          sourceHandle: connectingNodeId.current.handleId
        })
      }

      // Limpa a ref
      connectingNodeId.current = null
    },
    []
  )

  const handleAddNodeFromConnection = useCallback(
    (nodeType, extraData) => {
      if (!connectionMenu) return

      // Converte coordenadas da tela para coordenadas do canvas
      const position = screenToFlowPosition({
        x: connectionMenu.x,
        y: connectionMenu.y,
      })

      // Cria o novo nó
      const newNodeId = getId()
      const newNode = {
        id: newNodeId,
        type: nodeType,
        position,
        data: { ...getDefaultNodeData(nodeType), ...extraData },
      }

      // Adiciona o nó
      setNodes((nds) => nds.concat(newNode))

      // Cria a conexão
      // Para handle "tools", a direção é invertida:
      // ai_tool (novo) → ai_agent (existente, handle tools)
      const isToolsHandle = connectionMenu.sourceHandle === 'tools'
      const newEdge = {
        id: `${connectionMenu.sourceNodeId}-${newNodeId}`,
        source: isToolsHandle ? newNodeId : connectionMenu.sourceNodeId,
        sourceHandle: isToolsHandle ? null : connectionMenu.sourceHandle,
        target: isToolsHandle ? connectionMenu.sourceNodeId : newNodeId,
        targetHandle: isToolsHandle ? 'tools' : null,
        markerEnd: { type: MarkerType.ArrowClosed },
        data: {},
        style: { stroke: isToolsHandle ? '#FF9800' : '#b1b1b7' },
      }
      setEdges((eds) => [...eds, newEdge])

      // Fecha o menu
      setConnectionMenu(null)
    },
    [connectionMenu, screenToFlowPosition, setNodes, setEdges]
  )

  // Função para aplicar estilos visuais nas edges baseado nas condições
  const applyEdgeStyles = (edgeList) => {
    return edgeList.map((edge) => {
      const hasCondition = edge.data?.condition
      const conditionType = edge.data?.condition?.type

      // Define cor baseada no tipo de condição
      let color = '#b1b1b7' // default gray
      if (hasCondition) {
        if (conditionType === 'equals') color = '#4CAF50' // green
        else if (conditionType === 'contains') color = '#2196F3' // blue
        else if (conditionType === 'context') color = '#FF9800' // orange
        else if (conditionType === 'is_positive') color = '#9C27B0' // purple
        else if (conditionType === 'is_digit') color = '#00BCD4' // cyan
        else if (conditionType === 'regex') color = '#F44336' // red
        else color = '#4CAF50' // green para outros tipos
      }

      return {
        ...edge,
        style: {
          ...edge.style,
          stroke: color,
          strokeWidth: hasCondition ? 2 : 1,
        },
        label: edge.data?.label || (hasCondition ? `✓ ${conditionType}` : ''),
        labelStyle: { fill: color, fontWeight: 600, fontSize: 11 },
        labelBgStyle: { fill: '#fff', fillOpacity: 0.8 },
      }
    })
  }

  const onDragOver = useCallback((event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow')
      if (!type) {
        return
      }

      // Bloqueia mais de um nó start por fluxo
      if (type === 'start') {
        const hasStart = nodes.some((n) => n.type === 'start')
        if (hasStart) {
          toast.warning('Já existe um nó de Início neste fluxo.')
          return
        }
      }

      // Converte coordenadas da tela para coordenadas do canvas do ReactFlow
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const newNode = {
        id: getId(),
        type,
        position,
        data: getDefaultNodeData(type),
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [screenToFlowPosition, setNodes, nodes]
  )

  const getDefaultNodeData = (type) => {
    const defaults = {
      start: { label: 'Início' },
      message: { message: 'Nova mensagem' },
      button: { message: 'Escolha uma opção', buttons: ['Opção 1', 'Opção 2'] },
      list: {
        text: 'Escolha uma opção',
        body: 'Selecione',
        footer: '',
        action: {
          button: 'Ver opções',
          sections: [
            {
              title: 'Opções',
              rows: [
                { id: '1', title: 'Opção 1', description: '' },
                { id: '2', title: 'Opção 2', description: '' },
              ],
            },
          ],
        },
      },
      condition: { label: 'Condição' },
      router: {
        label: 'Router Inteligente',
        error_message: 'Opção inválida! Por favor, digite uma das opções válidas.',
        context_key: 'user_input',
      },
      ai_router: {
        label: 'AI Router',
        ai_provider: 'openai',
        api_key: '',
        model: '',
        prompt: 'Você é um assistente que identifica intenções do usuário. Analise a mensagem e determine qual ação o usuário deseja realizar.',
        error_message: 'Desculpe, não entendi sua mensagem. Pode reformular?',
        context_key: 'ai_intent',
        intents: [],
      },
      api_call: { api_type: 'get_customer', label: 'Buscar Cliente' },
      api_request: {
        label: 'API Request',
        method: 'GET',
        url: '',
        query_params: [],
        headers: [],
        body: '',
        context_key: 'api_response',
      },
      set_context: {
        label: 'Salvar no Contexto',
        mappings: [
          {
            key: 'campo_exemplo',
            value: 'valor_exemplo',
            source: 'static',
          },
        ],
      },
      transfer: {
        department_id: null,
        message: 'Transferindo para atendente...',
        label: 'Transferir',
      },
      media: {
        media_type: 'document',
        url: '',
        file_name: '',
        caption: '',
        label: 'Enviar Mídia',
      },
      jump_to: {
        target_node_id: null,
        target_node_label: '',
        label: 'Pular para',
      },
      end: {
        message: 'Agradecemos o seu contato! Encerrando o atendimento.',
        label: 'Finalizar',
      },
      input: {
        input_type: 'text',
        context_key: 'user_input',
        validation: {},
        label: 'Input do usuário',
      },
      audio_transcription: {
        provider: 'openai',
        model: 'whisper-1',
        language: 'pt',
        api_key: '',
        fallback_message: 'Não foi possível processar seu áudio. Por favor, envie sua mensagem por texto.',
        label: 'Transcrição de Áudio',
      },
      loop: {
        source_variable: '',
        item_variable: 'item',
        max_iterations: 50,
        label: 'Loop',
      },
      expression: {
        template: '',
        context_key: 'resultado',
        mode: 'set',
        separator: '',
        operations: [],
        label: 'Expressão',
      },
      data_structure: {
        operation: 'create_list',
        context_key: 'dados',
        source_variable: '',
        item_template: '',
        condition_field: '',
        condition_operator: 'eq',
        condition_value: '',
        sort_field: '',
        sort_order: 'asc',
        group_field: '',
        initial_data: '',
        label: 'Estrutura de Dados',
      },
    }

    return defaults[type] || { label: type }
  }

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node)
    // Não abre o modal automaticamente - apenas seleciona
  }, [])

  const onEdgeClick = useCallback((event, edge) => {
    setSelectedEdge(edge)
    setShowEdgeEditor(true)  // Abre modal automaticamente para edges
  }, [])

  const onNodeUpdate = (nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: newData }
        }
        return node
      })
    )
    setShowNodeEditor(false)
    setSelectedNode(null)
  }

  const onDeleteNode = (nodeId) => {
    const node = nodes.find((n) => n.id === nodeId)
    if (node && node.type === 'start') return
    setNodes((nds) => nds.filter((n) => n.id !== nodeId))
    setEdges((eds) =>
      eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
    )
    setShowNodeEditor(false)
    setSelectedNode(null)
  }

  const onEdgeUpdate = (updatedEdge) => {
    setEdges((eds) => {
      const newEdges = eds.map((edge) => {
        if (edge.id === updatedEdge.id) {
          return updatedEdge
        }
        return edge
      })
      return applyEdgeStyles(newEdges)
    })
    setShowEdgeEditor(false)
    setSelectedEdge(null)
  }

  const onDeleteEdge = (edgeId) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId))
    setShowEdgeEditor(false)
    setSelectedEdge(null)
  }

  // Auto-save silencioso (sem alert)
  const autoSave = async () => {
    if (saving) return // Evita salvamento concorrente

    const flowData = {
      nodes,
      edges,
      metadata: {
        version: '1.0.0',
        updated_at: new Date().toISOString(),
      },
    }

    try {
      setSaving(true)
      await api.put(`/api/v1/flows/${flowId}`, {
        name: flowName,
        description: flowDescription,
        data: flowData,
      })
      setLastSaved(new Date())
      console.log('✅ Auto-save successful')
    } catch (error) {
      console.error('❌ Auto-save error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    const flowData = {
      nodes,
      edges,
      metadata: {
        version: '1.0.0',
        updated_at: new Date().toISOString(),
      },
    }

    try {
      if (flowId && flowId !== 'new') {
        // Atualizar fluxo existente
        await api.put(`/api/v1/flows/${flowId}`, {
          name: flowName,
          description: flowDescription,
          data: flowData,
        })
        setLastSaved(new Date())
        toast.success('Fluxo atualizado com sucesso!')
      } else {
        // Criar novo fluxo
        const companyId = localStorage.getItem('user_company_id')
        const response = await api.post('/api/v1/flows', {
          name: flowName,
          description: flowDescription,
          data: flowData,
          is_active: false,
          company_id: companyId ? parseInt(companyId) : null,
        })
        toast.success('Fluxo criado com sucesso!')
        navigate(`/flow/${response.data.data.id}`)
      }
    } catch (error) {
      console.error('Error saving flow:', error)
      toast.error('Erro ao salvar fluxo')
    }
  }

  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  // Fecha menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    if (showMenu) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  const handleExport = async () => {
    setShowMenu(false)
    let secretKeys = []
    try {
      const resp = await api.get(`/api/v1/flows/${flowId}/secrets`)
      if (resp.data.success && resp.data.data.secrets) {
        secretKeys = Object.keys(resp.data.data.secrets)
      }
    } catch (e) {
      console.error('Error fetching secrets for export:', e)
    }
    const flowData = {
      name: flowName,
      description: flowDescription,
      nodes,
      edges,
      secrets: secretKeys,
      metadata: {
        version: '1.0.0',
        exported_at: new Date().toISOString(),
      },
    }
    const blob = new Blob([JSON.stringify(flowData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${flowName.replace(/\s+/g, '_').toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    setShowMenu(false)
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
              ? 'Isso substituirá todo o fluxo atual. O fluxo contém credenciais que precisarão ser configuradas em "Credenciais" após a importação.'
              : 'Isso substituirá todo o fluxo atual.',
            items: secretItems.length > 0 ? secretItems : undefined,
            confirmText: 'Importar',
            cancelText: 'Cancelar',
            variant: secretItems.length > 0 ? 'warning' : undefined,
          })

          if (!accepted) return
          if (flowData.name) setFlowName(flowData.name)
          if (flowData.description) setFlowDescription(flowData.description)
          setNodes(flowData.nodes)
          setEdges(flowData.edges)
        } catch (err) {
          await showConfirm({
            title: 'Erro ao ler arquivo',
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

  const handlePlayground = async () => {
    setShowMenu(false)
    if (showPlayground) {
      setShowPlayground(false)
      return
    }
    const flowData = {
      nodes,
      edges,
      metadata: {
        version: '1.0.0',
        updated_at: new Date().toISOString(),
      },
    }
    try {
      if (flowId && flowId !== 'new') {
        await api.put(`/api/v1/flows/${flowId}`, {
          name: flowName,
          description: flowDescription,
          data: flowData,
        })
        setLastSaved(new Date())
      } else {
        const companyId = localStorage.getItem('user_company_id')
        const response = await api.post('/api/v1/flows', {
          name: flowName,
          description: flowDescription,
          data: flowData,
          is_active: false,
          company_id: companyId ? parseInt(companyId) : null,
        })
        navigate(`/flow/${response.data.data.id}`)
        return
      }
    } catch (error) {
      console.error('Error saving flow before playground:', error)
      toast.error('Erro ao salvar fluxo. Salve manualmente antes de testar.')
      return
    }
    setShowPlayground(true)
  }

  const menuItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    width: '100%',
    padding: '0.5rem 0.75rem',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.82rem',
    fontWeight: '500',
    textAlign: 'left',
    transition: 'background-color 0.15s',
    whiteSpace: 'nowrap',
  }

  const isEmbedded = localStorage.getItem('deskflow-embedded') === 'true'

  return (
    <>
      <Header>
        {/* Conteúdo do flow builder integrado no header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
          {/* Esquerda: voltar + nome + descrição */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
            <button
              onClick={() => navigate('/')}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                fontSize: '1rem',
                padding: '0.2rem',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
              title="Voltar"
            >
              {'\u2190'}
            </button>
            <div style={{ minWidth: 0, flex: 1 }}>
              <input
                type="text"
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                style={{
                  fontSize: '0.9rem',
                  border: 'none',
                  background: 'transparent',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  width: '100%',
                  outline: 'none',
                  padding: '0',
                  lineHeight: 1.2,
                }}
              />
              <input
                type="text"
                value={flowDescription}
                onChange={(e) => setFlowDescription(e.target.value)}
                placeholder="Descrição do fluxo"
                style={{
                  fontSize: '0.68rem',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-dim)',
                  width: '100%',
                  outline: 'none',
                  padding: '0',
                }}
              />
            </div>
          </div>

          {/* Centro: status de salvamento */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', cursor: 'pointer', color: 'var(--text-dim)' }}>
              <input
                type="checkbox"
                checked={autoSaveEnabled}
                onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Auto-save
            </label>
            {autoSaveEnabled && (
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                {saving ? 'Salvando...' : lastSaved ? new Date(lastSaved).toLocaleTimeString() : null}
              </div>
            )}
          </div>

          {/* Direita: botões de ação + menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
            {isAdmin && (
              <button className="btn btn-success" onClick={handleSave} style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}>
                Salvar
              </button>
            )}

            {/* Menu dropdown */}
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                style={{
                  width: '28px',
                  height: '28px',
                  padding: 0,
                  backgroundColor: 'transparent',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.color = 'var(--accent)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.color = 'var(--text-muted)'
                }}
                title="Menu"
              >
                {'\u22EE'}
              </button>

              {showMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.4rem',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '0.4rem',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
                  zIndex: 1100,
                  minWidth: '180px',
                }}>
                  <button
                    style={menuItemStyle}
                    onClick={handlePlayground}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span>Playground</span>
                    {showPlayground && <span style={{ color: '#22c55e', fontSize: '0.7rem' }}>(ativo)</span>}
                  </button>
                  <button
                    style={menuItemStyle}
                    onClick={() => { setShowMenu(false); setShowDebugPanel(!showDebugPanel) }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span>Debug</span>
                    {showDebugPanel && <span style={{ color: '#22c55e', fontSize: '0.7rem' }}>(ativo)</span>}
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        style={menuItemStyle}
                        onClick={() => { setShowMenu(false); setShowSecrets(true) }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span>Variáveis de Ambiente</span>
                      </button>
                      <button
                        style={menuItemStyle}
                        onClick={() => { setShowMenu(false); setShowAccounts(true) }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span>Contas Permitidas</span>
                      </button>
                      <button
                        style={menuItemStyle}
                        onClick={() => { setShowMenu(false); setShowApiKeys(true) }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span>API Keys</span>
                      </button>
                      <button
                        style={menuItemStyle}
                        onClick={() => { setShowMenu(false); setShowLogs(true) }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span>📊 Execution Logs</span>
                      </button>
                      <button
                        style={menuItemStyle}
                        onClick={() => { setShowMenu(false); setShowKnowledge(true) }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span>🧠 Base de Conhecimento</span>
                      </button>
                      <button
                        style={menuItemStyle}
                        onClick={() => { setShowMenu(false); setShowUsers(true) }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span>Usuários</span>
                      </button>
                      <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '0.3rem 0' }} />
                      <button
                        style={menuItemStyle}
                        onClick={handleExport}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span>Exportar JSON</span>
                      </button>
                      <button
                        style={menuItemStyle}
                        onClick={handleImport}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span>Importar JSON</span>
                      </button>
                    </>
                  )}
                  <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '0.3rem 0' }} />
                  <button
                    style={menuItemStyle}
                    onClick={() => { setShowMenu(false); setShowTutorial(true) }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span>Tutorial</span>
                  </button>
                  <button
                    style={{ ...menuItemStyle, color: 'var(--text-dim)' }}
                    onClick={() => { setShowMenu(false); navigate('/') }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span>Voltar para lista</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Header>
      <div className="flow-builder">

        <div className="flow-builder-content">
          {/* Aba visível para abrir sidebar quando escondida */}
          {!sidebarPinned && !sidebarVisible && (
            <div
              onClick={() => setSidebarVisible(true)}
              style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 50,
                width: '24px',
                height: '60px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderLeft: 'none',
                borderRadius: '0 8px 8px 0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
                transition: 'all 0.2s',
                color: 'var(--text-dim)',
                fontSize: '0.7rem',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent)'
                e.currentTarget.style.color = '#fff'
                e.currentTarget.style.width = '28px'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-surface)'
                e.currentTarget.style.color = 'var(--text-dim)'
                e.currentTarget.style.width = '24px'
              }}
            >
              {'\u276F'}
            </div>
          )}

          <div
            onMouseLeave={() => {
              if (!sidebarPinned) setSidebarVisible(false)
            }}
            style={{
              position: sidebarPinned ? 'relative' : 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              zIndex: sidebarPinned ? 'auto' : 40,
              transform: sidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.25s ease',
              boxShadow: !sidebarPinned && sidebarVisible ? '4px 0 20px rgba(0,0,0,0.2)' : 'none',
            }}
          >
            <Sidebar sidebarPinned={sidebarPinned} onTogglePin={() => {
              const next = !sidebarPinned
              setSidebarPinned(next)
              localStorage.setItem('deskflow-sidebar-pinned', String(next))
              if (!next) setSidebarVisible(false)
              else setSidebarVisible(true)
            }} />
          </div>

          <div className="flow-builder-canvas">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              isValidConnection={isValidConnection}
              onConnectStart={onConnectStart}
              onConnectEnd={onConnectEnd}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              onSelectionChange={onSelectionChange}
              nodeTypes={nodeTypes}
              fitView
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>

            {/* Menu contextual para adicionar nó após arrastar conexão */}
            {connectionMenu && (
              <>
                {/* Overlay para fechar o menu ao clicar fora */}
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 999,
                  }}
                  onClick={() => setConnectionMenu(null)}
                />

                {/* Menu de opções */}
                <div
                  style={{
                    position: 'fixed',
                    left: connectionMenu.x,
                    top: connectionMenu.y,
                    backgroundColor: 'var(--bg-surface, #1e293b)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                    padding: '0.5rem',
                    zIndex: 1000,
                    minWidth: '200px',
                    border: '1px solid var(--border, #334155)',
                  }}
                >
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    color: 'var(--text-dim, #94a3b8)',
                    padding: '0.5rem 0.5rem 0.25rem',
                    borderBottom: '1px solid var(--border, #334155)',
                    marginBottom: '0.25rem'
                  }}>
                    {connectionMenu.sourceHandle === 'subagents' ? '🧠 Adicionar Sub Agente'
                      : connectionMenu.sourceHandle === 'tools' ? '🔧 Adicionar Tool'
                        : nodes.find(n => n.id === connectionMenu.sourceNodeId)?.type === 'ai_tool' ? '🧠 Conectar ao Agente'
                          : '➕ Adicionar Nó'}
                  </div>
                  {(() => {
                    const handle = connectionMenu.sourceHandle
                    const sourceNode = nodes.find(n => n.id === connectionMenu.sourceNodeId)
                    const sourceType = sourceNode?.type

                    // Handle de subagentes → só ai_agent
                    if (handle === 'subagents') {
                      return [{ type: 'ai_agent', icon: '🧠', label: 'Sub Agente' }]
                    }

                    // ai_tool → só pode conectar em ai_agent (handle tools)
                    if (sourceType === 'ai_tool') {
                      return [{ type: 'ai_agent', icon: '🧠', label: 'Agente IA' }]
                    }

                    // Handle config_out do audio_transcription → não cria nó
                    if (handle === 'config_out' || sourceType === 'audio_transcription') {
                      return [{ type: 'start', icon: '▶️', label: 'Conectar ao Início (arraste até o nó Início)' }]
                    }

                    // Handle de tools (do ai_agent) → tipos de tool
                    if (handle === 'tools') {
                      return [
                        { type: 'ai_tool', icon: '🔧', label: 'Tool HTTP', toolDefaults: { tool_type: 'http_request', name: '', method: 'GET', url: '' } },
                        { type: 'ai_tool', icon: '🧠', label: 'Tool RAG', toolDefaults: { tool_type: 'knowledge_search', name: 'buscar_conhecimento', description: 'Busca informações na base de conhecimento.' } },
                        { type: 'ai_tool', icon: '💾', label: 'Tool Contexto', toolDefaults: { tool_type: 'context_lookup', name: 'buscar_contexto', description: 'Busca dados do contexto da conversa.' } },
                        { type: 'ai_tool', icon: '⚡', label: 'Tool Custom', toolDefaults: { tool_type: 'function', name: 'custom', description: '', code: '# args, context, secrets\n\nresult = {"status": "ok"}' } },
                      ]
                    }

                    return [
                      { type: 'message', icon: '💬', label: 'Mensagem' },
                      { type: 'button', icon: '🔘', label: 'Botões' },
                      { type: 'list', icon: '📋', label: 'Lista' },
                      { type: 'input', icon: '⌨️', label: 'Input' },
                      { type: 'router', icon: '🎯', label: 'Router' },
                      { type: 'ai_router', icon: '🤖', label: 'AI Router' },
                      { type: 'ai_agent', icon: '🧠', label: 'Agente IA' },
                      { type: 'api_request', icon: '🌐', label: 'HTTP Request' },
                      { type: 'set_context', icon: '💾', label: 'Salvar Contexto' },
                      { type: 'delay', icon: '⏱️', label: 'Delay' },
                      { type: 'transfer', icon: '👤', label: 'Transferir' },
                      { type: 'media', icon: '📎', label: 'Mídia' },
                      { type: 'loop', icon: '🔄', label: 'Loop' },
                      { type: 'expression', icon: '📝', label: 'Expressão' },
                      { type: 'data_structure', icon: '📊', label: 'Dados' },
                      { type: 'jump_to', icon: '↗️', label: 'Pular para' },
                      { type: 'end', icon: '🏁', label: 'Fim' },
                    ]
                  })().map((item) => (
                    <button
                      key={item.type}
                      onClick={() => handleAddNodeFromConnection(item.type, item.toolDefaults)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        width: '100%',
                        padding: '0.5rem',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#e2e8f0',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        borderRadius: '4px',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#334155'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {showNodeEditor && selectedNode && (
          <NodeEditorModal
            node={selectedNode}
            nodes={nodes}
            edges={edges}
            flowId={flowId}
            onSave={(newData) => onNodeUpdate(selectedNode.id, newData)}
            onDelete={() => onDeleteNode(selectedNode.id)}
            onClose={() => {
              setShowNodeEditor(false)
              setSelectedNode(null)
            }}
          />
        )}

        {showEdgeEditor && selectedEdge && (
          <EdgeEditorModal
            edge={selectedEdge}
            nodes={nodes}
            edges={edges}
            onSave={onEdgeUpdate}
            onDelete={() => onDeleteEdge(selectedEdge.id)}
            onClose={() => {
              setShowEdgeEditor(false)
              setSelectedEdge(null)
            }}
          />
        )}

        <SessionDebugPanel
          isOpen={showDebugPanel}
          onClose={() => setShowDebugPanel(false)}
        />

        {showPlayground && (
          <Playground
            flowId={flowId}
            onClose={() => setShowPlayground(false)}
          />
        )}

        {showSecrets && flowId && flowId !== 'new' && (
          <SecretsPanel
            flowId={flowId}
            onClose={() => setShowSecrets(false)}
          />
        )}

        {showAccounts && flowId && flowId !== 'new' && (
          <AccountsPanel
            flowId={flowId}
            onClose={() => setShowAccounts(false)}
          />
        )}

        {showApiKeys && (
          <ApiKeysPanel
            onClose={() => setShowApiKeys(false)}
          />
        )}

        {showUsers && (
          <UsersPanel
            onClose={() => setShowUsers(false)}
          />
        )}

        {showLogs && (
          <ExecutionLogsPanel
            flowId={flowId}
            onClose={() => setShowLogs(false)}
          />
        )}

        {showKnowledge && (
          <KnowledgeBasePanel
            flowId={flowId}
            onClose={() => setShowKnowledge(false)}
          />
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

        {showTutorial && (
          <TutorialModal onClose={() => {
            setShowTutorial(false)
            localStorage.setItem('deskflow-tutorial-seen', 'true')
          }} />
        )}
      </div>
    </>
  )
}

// Wrapper component para fornecer o contexto do ReactFlow
function FlowBuilder() {
  return (
    <ReactFlowProvider>
      <FlowBuilderInner />
    </ReactFlowProvider>
  )
}

export default FlowBuilder
