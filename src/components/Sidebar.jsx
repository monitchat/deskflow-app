import { useState } from 'react'

const onDragStart = (event, nodeType) => {
  event.dataTransfer.setData('application/reactflow', nodeType)
  event.dataTransfer.effectAllowed = 'move'
}

const categories = [
  {
    id: 'mensagens',
    label: 'Mensagens',
    icon: '💬',
    nodes: [
      { type: 'message', label: 'Mensagem de Texto', icon: '💬', description: 'Envia uma mensagem de texto simples' },
      { type: 'button', label: 'Botões', icon: '🔘', description: 'Envia botões interativos' },
      { type: 'list', label: 'Lista', icon: '📋', description: 'Envia uma lista de opções' },
      { type: 'media', label: 'Enviar Mídia', icon: '📎', description: 'Envia documento, imagem ou link' },
      { type: 'whatsapp_template', label: 'Template WhatsApp', icon: '📨', description: 'Envia um template aprovado do WhatsApp' },
    ],
  },
  {
    id: 'interacao',
    label: 'Interação',
    icon: '⌨️',
    nodes: [
      { type: 'input', label: 'Capturar Input', icon: '⌨️', description: 'Recebe e valida input do usuário' },
      { type: 'router', label: 'Router Inteligente', icon: '🎯', description: 'Roteador com múltiplas saídas e mensagem de erro' },
      { type: 'audio_transcription', label: 'Transcrição de Áudio', icon: '🎤', description: 'Conecte ao Início para ativar STT' },
    ],
  },
  {
    id: 'ia',
    label: 'Inteligência Artificial',
    icon: '🤖',
    nodes: [
      { type: 'ai_router', label: 'AI Router', icon: '🤖', description: 'Classifica intenções usando IA (OpenAI/Gemini)' },
      { type: 'ai_agent', label: 'Agente IA', icon: '🧠', description: 'Agente conversacional com IA e tools' },
      { type: 'ai_tool', label: 'Tool (Agente)', icon: '🔧', description: 'Ferramenta conectável a um Agente IA' },
    ],
  },
  {
    id: 'dados',
    label: 'Dados e Lógica',
    icon: '💾',
    nodes: [
      { type: 'api_request', label: 'API Request', icon: '🌐', description: 'Requisição HTTP customizável (GET/POST/PUT/DELETE)' },
      { type: 'set_context', label: 'Salvar no Contexto', icon: '💾', description: 'Salva valores no contexto da conversa' },
      { type: 'expression', label: 'Expressão', icon: '📝', description: 'Concatena, formata e calcula valores' },
      { type: 'data_structure', label: 'Estrutura de Dados', icon: '📊', description: 'Cria e manipula listas, objetos e tabelas' },
      { type: 'loop', label: 'Loop (Repetição)', icon: '🔄', description: 'Itera sobre uma lista/dict do contexto' },
    ],
  },
  {
    id: 'atendimento',
    label: 'Atendimento',
    icon: '👤',
    nodes: [
      { type: 'transfer', label: 'Transferir', icon: '👤', description: 'Transfere para atendimento humano' },
      { type: 'set_ticket_status', label: 'Alterar Status', icon: '🎫', description: 'Altera o status do ticket/atendimento' },
      { type: 'set_ticket_owner', label: 'Alterar Dono', icon: '👑', description: 'Altera o responsável pelo ticket' },
    ],
  },
  {
    id: 'fluxo',
    label: 'Controle de Fluxo',
    icon: '↗️',
    nodes: [
      { type: 'delay', label: 'Delay', icon: '⏱️', description: 'Aguarda X segundos antes de continuar' },
      { type: 'jump_to', label: 'Pular para', icon: '↗️', description: 'Pula para outro nó do fluxo' },
      { type: 'end', label: 'Finalizar', icon: '🏁', description: 'Finaliza a conversa' },
    ],
  },
]

function Sidebar({ sidebarPinned, onTogglePin, onAddNode, nodes = [] }) {
  const hasStartNode = nodes.some((n) => n.type === 'start')
  const [search, setSearch] = useState('')

  // Carrega estado das categorias do localStorage (padrão: todas fechadas)
  const [collapsedCategories, setCollapsedCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar_categories')
      if (saved) return JSON.parse(saved)
    } catch {}
    // Padrão: todas fechadas
    const defaults = {}
    categories.forEach((cat) => { defaults[cat.id] = true })
    return defaults
  })

  const searchLower = search.toLowerCase().trim()

  const toggleCategory = (id) => {
    setCollapsedCategories((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      localStorage.setItem('sidebar_categories', JSON.stringify(next))
      return next
    })
  }

  // Filtra nós por busca
  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      nodes: cat.nodes.filter(
        (n) =>
          !searchLower ||
          n.label.toLowerCase().includes(searchLower) ||
          n.description.toLowerCase().includes(searchLower) ||
          n.type.toLowerCase().includes(searchLower)
      ),
    }))
    .filter((cat) => cat.nodes.length > 0)

  // Start node visível na busca?
  const showStart =
    !searchLower ||
    'início'.includes(searchLower) ||
    'start'.includes(searchLower) ||
    'ponto de entrada'.includes(searchLower)

  return (
    <div className="flow-builder-sidebar">
      <div className="sidebar-section">
        <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Componentes
          {onTogglePin && (
            <button
              onClick={onTogglePin}
              title={sidebarPinned ? 'Desafixar sidebar' : 'Fixar sidebar'}
              style={{
                width: '22px',
                height: '22px',
                padding: 0,
                backgroundColor: 'transparent',
                color: sidebarPinned ? 'var(--accent)' : 'var(--text-dim)',
                border: '1px solid var(--border)',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '0.65rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                transform: sidebarPinned ? 'rotate(0deg)' : 'rotate(45deg)',
              }}
            >
              {'\uD83D\uDCCC'}
            </button>
          )}
        </h3>

        {/* Campo de busca */}
        <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar componente..."
            style={{
              width: '100%',
              padding: '0.45rem 0.6rem 0.45rem 1.8rem',
              fontSize: '0.8rem',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <span style={{
            position: 'absolute',
            left: '0.55rem',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '0.8rem',
            color: 'var(--text-dim)',
            pointerEvents: 'none',
          }}>
            🔍
          </span>
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '0.4rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                color: 'var(--text-dim)',
                padding: '0.15rem',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Nó Start */}
        {showStart && (
          <div
            className="node-type"
            onDragStart={(event) => {
              if (hasStartNode) {
                event.preventDefault()
                return
              }
              onDragStart(event, 'start')
            }}
            onClick={() => !hasStartNode && onAddNode && onAddNode('start')}
            draggable={!hasStartNode}
            style={{
              border: hasStartNode ? '1px solid var(--border)' : '1px dashed var(--accent)',
              borderRadius: '8px',
              opacity: hasStartNode ? 0.4 : 1,
              cursor: hasStartNode ? 'not-allowed' : 'grab',
            }}
            title={hasStartNode ? 'Já existe um nó Início neste fluxo' : 'Arraste para o canvas'}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="node-type-icon">{'▶️'}</span>
              <div>
                <div style={{ fontWeight: 600, color: hasStartNode ? 'var(--text-dim)' : 'var(--accent)', fontSize: '0.85rem' }}>
                  Início (Start) {hasStartNode && '✓'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--sidebar-item-desc)' }}>
                  {hasStartNode ? 'Já existe no fluxo' : 'Ponto de entrada do fluxo (obrigatório)'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Categorias */}
        {filteredCategories.map((cat) => {
          const isCollapsed = collapsedCategories[cat.id] && !searchLower
          return (
            <div key={cat.id} style={{ marginTop: '0.5rem' }}>
              {/* Header da categoria */}
              <div
                onClick={() => !searchLower && toggleCategory(cat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.35rem 0.4rem',
                  cursor: searchLower ? 'default' : 'pointer',
                  borderRadius: '4px',
                  userSelect: 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!searchLower) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-dim)',
                }}>
                  {cat.icon} {cat.label}
                </span>
                {!searchLower && (
                  <span style={{
                    fontSize: '0.6rem',
                    color: 'var(--text-dim)',
                    transition: 'transform 0.2s',
                    transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                  }}>
                    ▼
                  </span>
                )}
              </div>

              {/* Nós da categoria */}
              {!isCollapsed && cat.nodes.map((node) => (
                <div
                  key={node.type}
                  className="node-type"
                  onDragStart={(event) => onDragStart(event, node.type)}
                  onClick={() => onAddNode && onAddNode(node.type)}
                  draggable
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="node-type-icon">{node.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--sidebar-item-label)', fontSize: '0.85rem' }}>{node.label}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--sidebar-item-desc)' }}>
                        {node.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        })}

        {/* Sem resultados */}
        {filteredCategories.length === 0 && !showStart && (
          <div style={{
            padding: '1rem',
            textAlign: 'center',
            color: 'var(--text-dim)',
            fontSize: '0.8rem',
          }}>
            Nenhum componente encontrado
          </div>
        )}
      </div>

      <div className="sidebar-section">
        <h3>Instruções</h3>
        <ul style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '1.2rem', lineHeight: 1.8 }}>
          <li>Arraste componentes para o canvas</li>
          <li>Clique em um nó para editar</li>
          <li>Clique em uma conexão para adicionar condição</li>
          <li>Conecte nós arrastando das bordas</li>
          <li>Salve o fluxo antes de ativar</li>
        </ul>
      </div>

      <div className="sidebar-section">
        <h3>Legenda de Condições</h3>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.4rem' }}>
            <div style={{ width: '20px', height: '3px', backgroundColor: 'var(--text-dim)', marginRight: '0.5rem', borderRadius: '2px' }}></div>
            <span>Sem condição</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.4rem' }}>
            <div style={{ width: '20px', height: '3px', backgroundColor: '#22c55e', marginRight: '0.5rem', borderRadius: '2px' }}></div>
            <span>Equals (igual a)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.4rem' }}>
            <div style={{ width: '20px', height: '3px', backgroundColor: '#3b82f6', marginRight: '0.5rem', borderRadius: '2px' }}></div>
            <span>Contains (contém)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.4rem' }}>
            <div style={{ width: '20px', height: '3px', backgroundColor: '#f59e0b', marginRight: '0.5rem', borderRadius: '2px' }}></div>
            <span>Context (contexto)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.4rem' }}>
            <div style={{ width: '20px', height: '3px', backgroundColor: '#a855f7', marginRight: '0.5rem', borderRadius: '2px' }}></div>
            <span>Positive (sim/ok)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.4rem' }}>
            <div style={{ width: '20px', height: '3px', backgroundColor: '#06b6d4', marginRight: '0.5rem', borderRadius: '2px' }}></div>
            <span>Digit (número)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.4rem' }}>
            <div style={{ width: '20px', height: '3px', backgroundColor: '#ef4444', marginRight: '0.5rem', borderRadius: '2px' }}></div>
            <span>Regex</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
