import { useState } from 'react'
import { Handle, Position } from 'reactflow'

const nodeIcons = {
  start: '▶️',
  message: '💬',
  button: '🔘',
  list: '📋',
  condition: '🔀',
  router: '🎯',
  ai_router: '🤖',
  ai_agent: '🧠',
  ai_tool: '🔧',
  api_call: '🔌',
  api_request: '🌐',
  set_context: '💾',
  delay: '⏱️',
  transfer: '👤',
  set_ticket_status: '🎫',
  media: '📎',
  jump_to: '↗️',
  end: '🏁',
  input: '⌨️',
}

const nodeLabels = {
  start: 'Início',
  message: 'Mensagem',
  button: 'Botões',
  list: 'Lista',
  condition: 'Condição',
  router: 'Router',
  ai_router: 'AI Router',
  ai_agent: 'Agente IA',
  ai_tool: 'Tool',
  api_call: 'API',
  api_request: 'HTTP Request',
  set_context: 'Salvar Contexto',
  delay: 'Delay',
  transfer: 'Transferir',
  set_ticket_status: 'Alterar Status',
  media: 'Mídia',
  jump_to: 'Pular para',
  end: 'Fim',
  input: 'Input',
}

function CustomNode({ data, type, selected, id }) {
  const [hovered, setHovered] = useState(false)
  const icon = nodeIcons[type] || '📦'
  const label = nodeLabels[type] || type

  const getTooltipContent = () => {
    const lines = []
    if (data.label) lines.push(`Rótulo: ${data.label}`)
    if (data.message) lines.push(`Mensagem: ${data.message}`)
    if (data.header) lines.push(`Header: ${data.header}`)
    if (data.body) lines.push(`Body: ${data.body}`)
    if (data.footer) lines.push(`Footer: ${data.footer}`)
    if (data.buttons && Array.isArray(data.buttons)) lines.push(`Botões: ${data.buttons.join(', ')}`)
    if (data.error_message) lines.push(`Erro: ${data.error_message}`)
    if (data.department_id) lines.push(`Dept ID: ${data.department_id}`)
    if (data.status_id) lines.push(`Status ID: ${data.status_id}`)
    if (data.target_node_id) lines.push(`Destino: ${data.target_node_label || data.target_node_id}`)
    if (data.url) lines.push(`URL: ${data.url}`)
    if (data.method) lines.push(`Método: ${data.method}`)
    if (data.context_key) lines.push(`Context key: ${data.context_key}`)
    if (data.input_type) lines.push(`Tipo input: ${data.input_type}`)
    if (data.seconds) lines.push(`Delay: ${data.seconds}s`)
    if (data.api_type) lines.push(`API: ${data.api_type}`)
    if (data.prompt) lines.push(`Prompt: ${data.prompt}`)
    if (data.mappings?.length) lines.push(`Mapeamentos: ${data.mappings.length} campo(s)`)
    if (data.options?.length) lines.push(`Opções: ${data.options.map(o => o.label).join(', ')}`)
    if (data.intents?.length) lines.push(`Intenções: ${data.intents.map(i => i.label).join(', ')}`)
    if (data.action?.sections?.[0]?.rows?.length) {
      lines.push(`Lista: ${data.action.sections[0].rows.map(r => r.title).join(', ')}`)
    }
    return lines.length > 0 ? lines.join('\n') : null
  }

  const renderActionButtons = () => {
    if (!selected) return null

    return (
      <div
        style={{
          position: 'absolute',
          top: '-26px',
          right: '-2px',
          display: 'flex',
          gap: '3px',
          zIndex: 1000,
        }}
        className="nodrag"
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            console.log('Edit button clicked, node id:', id, 'type:', type)
            window.dispatchEvent(new CustomEvent('editNode', {
              detail: { nodeId: id, nodeType: type, nodeData: data }
            }))
          }}
          style={{
            width: '22px',
            height: '22px',
            padding: '0',
            fontSize: '0.7rem',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            transition: 'all 0.15s',
          }}
          title="Editar"
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)'
            e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.25)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)'
            e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)'
          }}
        >
          ✏️
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            console.log('Delete button clicked, node id:', id, 'type:', type)
            window.dispatchEvent(new CustomEvent('deleteNode', {
              detail: { nodeId: id }
            }))
          }}
          style={{
            width: '22px',
            height: '22px',
            padding: '0',
            fontSize: '0.7rem',
            backgroundColor: '#F44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            transition: 'all 0.15s',
          }}
          title="Excluir"
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)'
            e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.25)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)'
            e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)'
          }}
        >
          🗑️
        </button>
      </div>
    )
  }

  const getNodeContent = () => {
    switch (type) {
      case 'start':
        return (
          <div className="node-content" style={{ textAlign: 'center', color: '#4CAF50', fontWeight: 600 }}>
            Início do fluxo
          </div>
        )
      case 'message':
        return (
          <div className="node-content">
            {data.message?.substring(0, 50)}
            {data.message?.length > 50 ? '...' : ''}
          </div>
        )
      case 'button':
        return (
          <div className="node-content">
            {data.message?.substring(0, 30)}
            <br />
            <small>
              {data.buttons?.length || 0} botões
            </small>
          </div>
        )
      case 'list':
        return (
          <div className="node-content">
            {data.body?.substring(0, 30)}
            <br />
            <small>
              {data.action?.sections?.[0]?.rows?.length || 0} opções
            </small>
          </div>
        )
      case 'condition':
        return <div className="node-content">{data.label || 'Condição'}</div>
      case 'router':
        const options = data.options || []
        return (
          <div className="node-content" style={{ minWidth: '150px' }}>
            <div style={{ marginBottom: '0.5rem', fontWeight: '600' }}>
              {data.label || 'Router'}
            </div>
            {options.length > 0 ? (
              <div style={{ fontSize: '0.75rem', color: 'var(--node-content-dim)' }}>
                {options.map((opt, idx) => (
                  <div
                    key={opt.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      height: '24px',
                      borderBottom: idx < options.length - 1 ? '1px solid var(--node-separator)' : 'none'
                    }}
                  >
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#4CAF50',
                        marginRight: '0.4rem',
                        flexShrink: 0
                      }}
                    ></div>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {opt.label}
                    </span>
                  </div>
                ))}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '24px',
                    borderTop: '1px solid var(--node-separator)'
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#F44336',
                      marginRight: '0.4rem',
                      flexShrink: 0
                    }}
                  ></div>
                  <span style={{ fontStyle: 'italic', color: 'var(--text-dim)' }}>erro</span>
                </div>
              </div>
            ) : (
              <small style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                Sem opções configuradas
              </small>
            )}
          </div>
        )
      case 'api_call':
        return (
          <div className="node-content">
            {data.label || data.api_type || 'API Call'}
          </div>
        )
      case 'api_request':
        const method = data.method || 'GET'
        const methodColors = {
          GET: '#2196F3',
          POST: '#4CAF50',
          PUT: '#FF9800',
          DELETE: '#F44336',
          PATCH: '#9C27B0',
        }
        return (
          <div className="node-content">
            <div style={{ marginBottom: '0.25rem' }}>
              {data.label || 'HTTP Request'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  color: '#fff',
                  backgroundColor: methodColors[method] || '#666',
                  padding: '0.1rem 0.3rem',
                  borderRadius: '3px',
                }}
              >
                {method}
              </span>
              <small style={{ fontSize: '0.7rem', color: 'var(--node-content-dim)' }}>
                → {data.context_key || 'api_response'}
              </small>
            </div>
          </div>
        )
      case 'set_context':
        const mappingCount = data.mappings?.length || 0
        return (
          <div className="node-content">
            {data.label || 'Salvar Contexto'}
            <br />
            <small>{mappingCount} campo(s)</small>
          </div>
        )
      case 'delay':
        return (
          <div className="node-content">
            {data.label || 'Aguardar'}
            <br />
            <small style={{ fontSize: '0.85rem', fontWeight: '600', color: '#2196F3' }}>
              ⏱️ {data.seconds || 1}s
            </small>
          </div>
        )
      case 'transfer':
        return (
          <div className="node-content" style={{ minWidth: '150px' }}>
            <div style={{ marginBottom: '0.25rem', fontWeight: '600' }}>
              {data.label || 'Transferir'}
            </div>
            <small>Dept: {data.department_id || 'N/A'}</small>
            <div style={{ fontSize: '0.75rem', color: 'var(--node-content-dim)', marginTop: '0.3rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.2rem 0',
                  borderBottom: '1px solid var(--node-separator)'
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#4CAF50',
                    marginRight: '0.4rem',
                    flexShrink: 0
                  }}
                ></div>
                <span>sucesso</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.2rem 0',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#F44336',
                    marginRight: '0.4rem',
                    flexShrink: 0
                  }}
                ></div>
                <span style={{ fontStyle: 'italic', color: 'var(--text-dim)' }}>erro</span>
              </div>
            </div>
          </div>
        )
      case 'set_ticket_status':
        return (
          <div className="node-content">
            {data.label || 'Alterar Status'}
            <br />
            <small>Status: {data.status_id || 'N/A'}</small>
          </div>
        )
      case 'media':
        const mediaTypeLabel = data.media_type === 'image' ? 'Imagem' : 'Documento'
        return (
          <div className="node-content">
            {data.label || 'Enviar Mídia'}
            <br />
            <small>{mediaTypeLabel}{data.url ? '' : ' (sem URL)'}</small>
          </div>
        )
      case 'jump_to':
        return (
          <div className="node-content">
            {data.label || 'Pular para'}
            <br />
            <small style={{ color: data.target_node_id ? '#4CAF50' : '#999' }}>
              {data.target_node_id ? `→ ${data.target_node_label || data.target_node_id}` : 'Nenhum destino'}
            </small>
          </div>
        )
      case 'end':
        return <div className="node-content">{data.label || 'Finalizar'}</div>
      case 'ai_router':
        const intents = data.intents || []
        const provider = data.ai_provider || 'openai'
        const enableResponse = data.enable_response || false
        const providerIcons = {
          openai: '🔵',
          gemini: '🟣'
        }
        return (
          <div className="node-content" style={{ minWidth: '150px' }}>
            <div style={{ marginBottom: '0.5rem', fontWeight: '600' }}>
              {data.label || 'AI Router'} {providerIcons[provider]}
            </div>
            {intents.length > 0 || enableResponse ? (
              <div style={{ fontSize: '0.75rem', color: 'var(--node-content-dim)' }}>
                {intents.map((intent, idx) => (
                  <div
                    key={intent.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      height: '24px',
                      borderBottom: '1px solid var(--node-separator)'
                    }}
                  >
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#9C27B0',
                        marginRight: '0.4rem',
                        flexShrink: 0
                      }}
                    ></div>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {intent.label}
                    </span>
                  </div>
                ))}
                {enableResponse && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      height: '24px',
                      borderBottom: '1px solid var(--node-separator)'
                    }}
                  >
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#4CAF50',
                        marginRight: '0.4rem',
                        flexShrink: 0
                      }}
                    ></div>
                    <span style={{ fontStyle: 'italic', color: '#4CAF50' }}>resposta padrão</span>
                  </div>
                )}
                {!enableResponse && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      height: '24px',
                      borderTop: '1px solid var(--node-separator)'
                    }}
                  >
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#F44336',
                        marginRight: '0.4rem',
                        flexShrink: 0
                      }}
                    ></div>
                    <span style={{ fontStyle: 'italic', color: 'var(--text-dim)' }}>erro</span>
                  </div>
                )}
              </div>
            ) : (
              <small style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                Sem intenções configuradas
              </small>
            )}
          </div>
        )
      case 'ai_agent':
        const agentProvider = data.ai_provider || 'openai'
        const agentTools = data.tools || []
        const agentProviderIcons = {
          openai: '🔵',
          gemini: '🟣',
          azure: '🔷'
        }
        return (
          <div className="node-content" style={{ minWidth: '150px' }}>
            <div style={{ marginBottom: '0.5rem', fontWeight: '600' }}>
              {data.label || 'Agente IA'} {agentProviderIcons[agentProvider]}
            </div>
            {data.prompt ? (
              <div style={{ fontSize: '0.7rem', color: 'var(--node-content-dim)', marginBottom: '0.3rem' }}>
                <em>{data.prompt.substring(0, 60)}{data.prompt.length > 60 ? '...' : ''}</em>
              </div>
            ) : (
              <small style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Sem prompt configurado</small>
            )}
            {agentTools.length > 0 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--node-content-dim)', borderTop: '1px solid var(--node-separator)', paddingTop: '0.3rem', marginTop: '0.3rem' }}>
                <div style={{ fontWeight: '500', marginBottom: '0.2rem', color: 'var(--node-content-muted)' }}>🔧 Tools ({agentTools.length})</div>
                {agentTools.map((tool, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      height: '20px',
                    }}
                  >
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: tool.type === 'http_request' ? '#2196F3' : tool.type === 'context_lookup' ? '#FF9800' : '#4CAF50',
                        marginRight: '0.3rem',
                        flexShrink: 0
                      }}
                    ></div>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.7rem' }}>
                      {tool.name || `Tool ${idx + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      case 'ai_tool':
        const toolType = data.tool_type || 'http_request'
        const toolTypeIcons = {
          http_request: '🌐',
          context_lookup: '💾',
          save_context: '💾',
          send_buttons: '🔘',
          send_list: '📋',
          transfer_department: '👤',
          end_chat: '🏁',
          function: '⚡'
        }
        const toolTypeLabels = {
          http_request: 'HTTP',
          context_lookup: 'Contexto',
          save_context: 'Salvar Dados',
          send_buttons: 'Botões',
          send_list: 'Lista',
          transfer_department: 'Transferir',
          end_chat: 'Finalizar',
          function: 'Custom'
        }
        return (
          <div className="node-content" style={{ minWidth: '130px' }}>
            <div style={{ marginBottom: '0.3rem', fontWeight: '600', fontSize: '0.85rem' }}>
              {data.name || 'Tool'} {toolTypeIcons[toolType]}
            </div>
            {data.description && (
              <div style={{ fontSize: '0.7rem', color: 'var(--node-content-dim)', marginBottom: '0.3rem' }}>
                <em>{data.description.substring(0, 50)}{data.description.length > 50 ? '...' : ''}</em>
              </div>
            )}
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
              {toolTypeLabels[toolType] || toolType}
              {toolType === 'http_request' && data.method && ` • ${data.method}`}
            </div>
            {toolType === 'http_request' && data.url && (
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>
                {data.url}
              </div>
            )}
          </div>
        )
      case 'input':
        return (
          <div className="node-content">
            {data.label || 'Input'}
            <br />
            <small>Tipo: {data.input_type || 'text'}</small>
          </div>
        )
      default:
        return <div className="node-content">{JSON.stringify(data)}</div>
    }
  }

  const tooltipContent = getTooltipContent()

  const renderTooltip = () => {
    if (!hovered || !tooltipContent) return null
    return (
      <div
        style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '32px',
          backgroundColor: '#1a1a1a',
          color: '#f0f0f0',
          padding: '0.6rem 0.8rem',
          borderRadius: '8px',
          fontSize: '0.75rem',
          lineHeight: '1.5',
          whiteSpace: 'pre-wrap',
          maxWidth: '320px',
          minWidth: '180px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 9999,
          pointerEvents: 'none',
          wordBreak: 'break-word',
        }}
      >
        {tooltipContent}
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid #1a1a1a',
        }} />
      </div>
    )
  }

  // Para transfer, usar handles de sucesso e erro
  if (type === 'transfer') {
    const execResult = data._executionResult
    const [showDetails, setShowDetails] = useState(false)
    const headerHeight = 52
    const deptLineHeight = 20
    const itemHeight = 20

    return (
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ position: 'relative', zIndex: hovered ? 1000 : 'auto' }}
      >
        {renderTooltip()}
        <Handle type="target" position={Position.Top} />

        <div style={{ padding: '5px', position: 'relative' }}>
          {renderActionButtons()}
          <div className="node-header">
            <span style={{ marginRight: '5px' }}>{icon}</span>
            {label}
          </div>
          {getNodeContent()}

          {/* Card de resultado da execução */}
          {execResult && (
            <div
              className="nodrag"
              style={{
                marginTop: '0.5rem',
                borderRadius: '6px',
                overflow: 'hidden',
                border: `1px solid ${execResult.success ? '#C8E6C9' : '#FFCDD2'}`,
                fontSize: '0.7rem',
              }}
            >
              {/* Header do resultado */}
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDetails(!showDetails)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.3rem 0.5rem',
                  backgroundColor: execResult.success ? '#E8F5E9' : '#FBE9E7',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: execResult.success ? '#4CAF50' : '#F44336',
                    display: 'inline-block',
                  }}></span>
                  <span style={{
                    fontWeight: '600',
                    color: execResult.success ? '#2E7D32' : '#C62828',
                  }}>
                    {execResult.success ? 'Sucesso' : 'Erro'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }}>
                    {execResult.timestamp}
                  </span>
                  <span style={{
                    fontSize: '0.6rem',
                    color: 'var(--text-dim)',
                    transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }}>
                    ▼
                  </span>
                </div>
              </div>

              {/* Detalhes expandíveis */}
              {showDetails && (
                <div style={{
                  padding: '0.4rem 0.5rem',
                  backgroundColor: 'var(--bg-surface)',
                  borderTop: `1px solid ${execResult.success ? '#C8E6C9' : '#FFCDD2'}`,
                }}>
                  {execResult.error && (
                    <div style={{ marginBottom: '0.3rem' }}>
                      <span style={{ color: 'var(--node-content-muted)', fontWeight: '600' }}>Motivo: </span>
                      <span style={{ color: 'var(--node-content-color)' }}>{execResult.error}</span>
                    </div>
                  )}
                  {execResult.status_code && (
                    <div style={{ marginBottom: '0.3rem' }}>
                      <span style={{ color: 'var(--node-content-muted)', fontWeight: '600' }}>HTTP: </span>
                      <span style={{
                        backgroundColor: execResult.status_code >= 400 ? '#FFEBEE' : '#E8F5E9',
                        color: execResult.status_code >= 400 ? '#C62828' : '#2E7D32',
                        padding: '0.1rem 0.3rem',
                        borderRadius: '3px',
                        fontFamily: 'monospace',
                        fontWeight: '600',
                      }}>
                        {execResult.status_code}
                      </span>
                    </div>
                  )}
                  {execResult.api_response && (
                    <div>
                      <span style={{ color: 'var(--node-content-muted)', fontWeight: '600' }}>Response: </span>
                      <pre style={{
                        margin: '0.2rem 0 0 0',
                        padding: '0.3rem',
                        backgroundColor: 'var(--bg-input)',
                        borderRadius: '3px',
                        fontSize: '0.65rem',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        maxHeight: '80px',
                        overflow: 'auto',
                        color: 'var(--node-content-color)',
                      }}>
                        {typeof execResult.api_response === 'object'
                          ? JSON.stringify(execResult.api_response, null, 2)
                          : execResult.api_response}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Handle de sucesso */}
          <Handle
            type="source"
            position={Position.Right}
            id="success"
            isConnectable={true}
            style={{
              top: `${headerHeight + deptLineHeight + (0 * itemHeight) + (itemHeight / 2)}px`,
              background: '#4CAF50',
              cursor: 'crosshair',
              pointerEvents: 'all',
            }}
          />

          {/* Handle de erro */}
          <Handle
            type="source"
            position={Position.Right}
            id="error"
            isConnectable={true}
            style={{
              top: `${headerHeight + deptLineHeight + (1 * itemHeight) + (itemHeight / 2)}px`,
              background: '#F44336',
              cursor: 'crosshair',
              pointerEvents: 'all',
            }}
          />
        </div>
      </div>
    )
  }

  // Para router e ai_router, usar handles customizados
  if (type === 'router' || type === 'ai_router') {
    const items = type === 'router' ? (data.options || []) : (data.intents || [])
    const itemColor = type === 'router' ? '#4CAF50' : '#9C27B0'
    const enableResponse = type === 'ai_router' && (data.enable_response || false)

    // Cálculo da posição das handles:
    // - Header: ~32px (node-header + marginBottom)
    // - Cada linha de opção: ~24px (padding + texto + border)
    const headerHeight = 52  // altura do header + label do router
    const itemHeight = 24  // altura de cada linha de opção/intenção

    return (
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ position: 'relative', zIndex: hovered ? 1000 : 'auto' }}
      >
        {renderTooltip()}
        <Handle type="target" position={Position.Top} />

        <div style={{ padding: '5px', position: 'relative' }}>
          {renderActionButtons()}
          <div className="node-header">
            <span style={{ marginRight: '5px' }}>{icon}</span>
            {label}
          </div>
          {getNodeContent()}

          {/* Handles dinâmicos para cada opção/intenção */}
          {items.map((item, index) => (
            <Handle
              key={item.id}
              type="source"
              position={Position.Right}
              id={item.id}
              isConnectable={true}
              style={{
                top: `${headerHeight + (index * itemHeight) + (itemHeight / 2)}px`,
                background: itemColor,
                cursor: 'crosshair',
                pointerEvents: 'all',
              }}
            />
          ))}

          {/* Handle de resposta padrão (AI Router com enable_response) */}
          {enableResponse && (
            <Handle
              type="source"
              position={Position.Right}
              id="default"
              isConnectable={true}
              style={{
                top: `${headerHeight + (items.length * itemHeight) + (itemHeight / 2)}px`,
                background: '#4CAF50',
                cursor: 'crosshair',
                pointerEvents: 'all',
              }}
            />
          )}

          {/* Handle de erro (só aparece se não tiver resposta padrão) */}
          {!enableResponse && (
            <Handle
              type="source"
              position={Position.Right}
              id="error"
              isConnectable={true}
              style={{
                top: `${headerHeight + (items.length * itemHeight) + (itemHeight / 2)}px`,
                background: '#F44336',
                cursor: 'crosshair',
                pointerEvents: 'all',
              }}
            />
          )}
        </div>
      </div>
    )
  }

  // Para ai_agent, usar handle especial de tools na esquerda
  if (type === 'ai_agent') {
    return (
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ position: 'relative', zIndex: hovered ? 1000 : 'auto' }}
      >
        {renderTooltip()}
        <Handle type="target" position={Position.Top} />

        <div style={{ padding: '5px', position: 'relative' }}>
          {renderActionButtons()}
          <div className="node-header">
            <span style={{ marginRight: '5px' }}>{icon}</span>
            {label}
          </div>
          {getNodeContent()}
        </div>

        <Handle type="source" position={Position.Bottom} />

        {/* Barra de tools abaixo do nó */}
        <div style={{
          borderTop: '1px dashed #FF9800',
          padding: '4px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          position: 'relative',
        }}>
          <Handle
            type="target"
            position={Position.Left}
            id="tools"
            isConnectable={true}
            style={{
              background: '#FF9800',
              width: '10px',
              height: '10px',
              left: '-5px',
              top: '50%',
              cursor: 'crosshair',
              pointerEvents: 'all',
            }}
          />
          <span style={{ fontSize: '0.65rem', color: '#FF9800', fontWeight: '600' }}>
            🔧 Tools
          </span>
        </div>
      </div>
    )
  }

  // Para ai_tool, handle de saída na direita (conecta no agente)
  if (type === 'ai_tool') {
    return (
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ position: 'relative', zIndex: hovered ? 1000 : 'auto' }}
      >
        {renderTooltip()}

        <div style={{ padding: '5px', position: 'relative' }}>
          {renderActionButtons()}
          <div className="node-header">
            <span style={{ marginRight: '5px' }}>{icon}</span>
            {label}
          </div>
          {getNodeContent()}
        </div>

        <Handle
          type="source"
          position={Position.Right}
          isConnectable={true}
          style={{
            background: '#FF9800',
            cursor: 'crosshair',
            pointerEvents: 'all',
          }}
        />
      </div>
    )
  }

  // Nó start: só saída, visual diferenciado, sem delete
  if (type === 'start') {
    return (
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative',
          zIndex: hovered ? 1000 : 'auto',
          border: '2px solid #4CAF50',
          borderRadius: '8px',
          background: 'var(--node-bg, #fff)',
        }}
      >
        <div style={{ padding: '5px', position: 'relative' }}>
          <div className="node-header" style={{ color: '#4CAF50' }}>
            <span style={{ marginRight: '5px' }}>{icon}</span>
            {label}
          </div>
          {getNodeContent()}
        </div>

        <Handle type="source" position={Position.Bottom} />
      </div>
    )
  }

  // Para outros tipos, usar handles normais
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative', zIndex: hovered ? 1000 : 'auto' }}
    >
      {renderTooltip()}
      <Handle type="target" position={Position.Top} />

      <div style={{ padding: '5px', position: 'relative' }}>
        {renderActionButtons()}
        <div className="node-header">
          <span style={{ marginRight: '5px' }}>{icon}</span>
          {label}
        </div>
        {getNodeContent()}
      </div>

      {type !== 'end' && type !== 'jump_to' && <Handle type="source" position={Position.Bottom} />}
    </div>
  )
}

export default CustomNode
