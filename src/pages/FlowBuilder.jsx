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

const nodeTypes = {
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
  end: CustomNode,
  input: CustomNode,
}

let id = 0
const getId = () => `node_${id++}`

function FlowBuilderInner() {
  const { id: flowId } = useParams()
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

  useEffect(() => {
    if (flowId && flowId !== 'new') {
      loadFlow()
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
          const confirmDelete = window.confirm('Deseja excluir este nó?')
          if (confirmDelete) {
            onDeleteNode(selectedNodeId)
            setSelectedNodeId(null)
          }
        }
      }

      // Ctrl+C - Copiar nó
      if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        if (selectedNodeId) {
          const node = nodes.find(n => n.id === selectedNodeId)
          if (node) {
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

    const handleDeleteNode = (event) => {
      const { nodeId } = event.detail
      console.log('DeleteNode event fired, nodeId:', nodeId)

      const confirmDelete = window.confirm('Deseja excluir este nó?')
      if (confirmDelete) {
        onDeleteNode(nodeId)
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
    window.addEventListener('nodeExecutionResult', handleNodeExecutionResult)

    return () => {
      window.removeEventListener('editNode', handleEditNode)
      window.removeEventListener('deleteNode', handleDeleteNode)
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
        setNodes(flow.data.nodes)
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
      alert('Erro ao carregar fluxo')
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
    (nodeType) => {
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
        data: getDefaultNodeData(nodeType),
      }

      // Adiciona o nó
      setNodes((nds) => nds.concat(newNode))

      // Cria a conexão
      const newEdge = {
        id: `${connectionMenu.sourceNodeId}-${newNodeId}`,
        source: connectionMenu.sourceNodeId,
        sourceHandle: connectionMenu.sourceHandle,
        target: newNodeId,
        markerEnd: { type: MarkerType.ArrowClosed },
        data: {},
        style: { stroke: '#b1b1b7' },
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
    [screenToFlowPosition, setNodes]
  )

  const getDefaultNodeData = (type) => {
    const defaults = {
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
        message: 'A Client agradece o seu contato!',
        label: 'Finalizar',
      },
      input: {
        input_type: 'text',
        context_key: 'user_input',
        validation: {},
        label: 'Input do usuário',
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
        alert('Fluxo atualizado com sucesso!')
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
        alert('Fluxo criado com sucesso!')
        navigate(`/flow/${response.data.data.id}`)
      }
    } catch (error) {
      console.error('Error saving flow:', error)
      alert('Erro ao salvar fluxo')
    }
  }

  return (
    <>
      <Header />
      <div className="flow-builder">
        <div className="flow-builder-header">
        <div>
          <input
            type="text"
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            style={{
              fontSize: '1.5rem',
              border: 'none',
              background: 'transparent',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
            }}
          />
          <br />
          <input
            type="text"
            value={flowDescription}
            onChange={(e) => setFlowDescription(e.target.value)}
            placeholder="Descrição do fluxo"
            style={{
              fontSize: '0.9rem',
              border: 'none',
              background: 'transparent',
              color: '#666',
              width: '400px',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Auto-save toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoSaveEnabled}
              onChange={(e) => setAutoSaveEnabled(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span>Salvar automaticamente</span>
          </label>

          {/* Save indicator */}
          {autoSaveEnabled && (
            <div style={{ fontSize: '0.75rem', color: '#666', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              {saving ? (
                <>⏳ Salvando...</>
              ) : lastSaved ? (
                <>✅ Salvo {new Date(lastSaved).toLocaleTimeString()}</>
              ) : (
                <>💾 Aguardando alterações...</>
              )}
            </div>
          )}
        </div>

        <div className="flow-builder-actions">
          <button
            className="btn btn-secondary"
            onClick={async () => {
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
            }}
            style={{ marginRight: '0.5rem' }}
          >
            📤 Exportar
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = '.json'
              input.onchange = (e) => {
                const file = e.target.files[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = (ev) => {
                  try {
                    const flowData = JSON.parse(ev.target.result)
                    if (!flowData.nodes || !flowData.edges) {
                      alert('Arquivo inválido: não contém nodes ou edges')
                      return
                    }
                    const secretsWarning = flowData.secrets?.length
                      ? `\n\nCredenciais necessárias (${flowData.secrets.length}):\n${flowData.secrets.map(s => '  - ' + s).join('\n')}\n\nVocê precisará configurá-las em "Credenciais" após importar.`
                      : ''
                    const confirmImport = window.confirm(
                      `Importar fluxo "${flowData.name || 'Sem nome'}"?\n\nIsso substituirá todo o fluxo atual.${secretsWarning}`
                    )
                    if (!confirmImport) return
                    if (flowData.name) setFlowName(flowData.name)
                    if (flowData.description) setFlowDescription(flowData.description)
                    setNodes(flowData.nodes)
                    setEdges(flowData.edges)
                  } catch (err) {
                    alert('Erro ao ler arquivo: ' + err.message)
                  }
                }
                reader.readAsText(file)
              }
              input.click()
            }}
            style={{ marginRight: '0.5rem' }}
          >
            📥 Importar
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowSecrets(true)}
            style={{
              marginRight: '0.5rem',
            }}
          >
            Credenciais
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            style={{
              marginRight: '0.5rem',
              backgroundColor: showDebugPanel ? '#4CAF50' : undefined,
              color: showDebugPanel ? '#fff' : undefined,
            }}
          >
            🔍 Debug
          </button>
          <button
            className="btn btn-primary"
            onClick={async () => {
              if (showPlayground) {
                setShowPlayground(false)
                return
              }
              // Salva o flow antes de abrir o Playground
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
                  return // navigate vai recarregar, o user abre o playground depois
                }
              } catch (error) {
                console.error('Error saving flow before playground:', error)
                alert('Erro ao salvar fluxo. Salve manualmente antes de testar.')
                return
              }
              setShowPlayground(true)
            }}
            style={{
              marginRight: '0.5rem',
              backgroundColor: showPlayground ? '#25D366' : undefined,
              color: showPlayground ? '#fff' : undefined,
            }}
          >
            🎮 Playground
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            Voltar
          </button>
          <button className="btn btn-success" onClick={handleSave}>
            Salvar Fluxo
          </button>
        </div>
      </div>

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
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  padding: '0.5rem',
                  zIndex: 1000,
                  minWidth: '200px',
                }}
              >
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  color: '#666',
                  padding: '0.5rem 0.5rem 0.25rem',
                  borderBottom: '1px solid #eee',
                  marginBottom: '0.25rem'
                }}>
                  ➕ Adicionar Nó
                </div>
                {[
                  { type: 'message', icon: '💬', label: 'Mensagem' },
                  { type: 'button', icon: '🔘', label: 'Botões' },
                  { type: 'list', icon: '📋', label: 'Lista' },
                  { type: 'input', icon: '⌨️', label: 'Input' },
                  { type: 'condition', icon: '🔀', label: 'Condição' },
                  { type: 'router', icon: '🎯', label: 'Router' },
                  { type: 'ai_router', icon: '🤖', label: 'AI Router' },
                  { type: 'api_call', icon: '🔌', label: 'API' },
                  { type: 'api_request', icon: '🌐', label: 'HTTP Request' },
                  { type: 'set_context', icon: '💾', label: 'Salvar Contexto' },
                  { type: 'transfer', icon: '👤', label: 'Transferir' },
                  { type: 'media', icon: '📎', label: 'Mídia' },
                  { type: 'jump_to', icon: '↗️', label: 'Pular para' },
                  { type: 'end', icon: '🏁', label: 'Fim' },
                ].map((item) => (
                  <button
                    key={item.type}
                    onClick={() => handleAddNodeFromConnection(item.type)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      padding: '0.5rem',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      borderRadius: '4px',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#f5f5f5'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent'
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
