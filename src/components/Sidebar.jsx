const onDragStart = (event, nodeType) => {
  event.dataTransfer.setData('application/reactflow', nodeType)
  event.dataTransfer.effectAllowed = 'move'
}

const nodeDefinitions = [
  {
    type: 'message',
    label: 'Mensagem de Texto',
    icon: '💬',
    description: 'Envia uma mensagem de texto simples',
  },
  {
    type: 'button',
    label: 'Botões',
    icon: '🔘',
    description: 'Envia botões interativos',
  },
  {
    type: 'list',
    label: 'Lista',
    icon: '📋',
    description: 'Envia uma lista de opções',
  },
  {
    type: 'input',
    label: 'Capturar Input',
    icon: '⌨️',
    description: 'Recebe e valida input do usuário',
  },
  {
    type: 'condition',
    label: 'Condição',
    icon: '🔀',
    description: 'Direciona o fluxo baseado em condições',
  },
  {
    type: 'router',
    label: 'Router Inteligente',
    icon: '🎯',
    description: 'Roteador com múltiplas saídas e mensagem de erro',
  },
  {
    type: 'ai_router',
    label: 'AI Router',
    icon: '🤖',
    description: 'Classifica intenções usando IA (OpenAI/Gemini)',
  },
  {
    type: 'ai_agent',
    label: 'Agente IA',
    icon: '🧠',
    description: 'Agente conversacional com IA e tools',
  },
  {
    type: 'ai_tool',
    label: 'Tool (Agente)',
    icon: '🔧',
    description: 'Ferramenta conectável a um Agente IA',
  },
  {
    type: 'api_call',
    label: 'Chamada API',
    icon: '🔌',
    description: 'Faz uma chamada para API externa',
  },
  {
    type: 'api_request',
    label: 'API Request',
    icon: '🌐',
    description: 'Requisição HTTP customizável (GET/POST/PUT/DELETE)',
  },
  {
    type: 'set_context',
    label: 'Salvar no Contexto',
    icon: '💾',
    description: 'Salva valores no contexto da conversa',
  },
  {
    type: 'delay',
    label: 'Delay',
    icon: '⏱️',
    description: 'Aguarda X segundos antes de continuar',
  },
  {
    type: 'transfer',
    label: 'Transferir',
    icon: '👤',
    description: 'Transfere para atendimento humano',
  },
  {
    type: 'set_ticket_status',
    label: 'Alterar Status',
    icon: '🎫',
    description: 'Altera o status do ticket/atendimento',
  },
  {
    type: 'media',
    label: 'Enviar Mídia',
    icon: '📎',
    description: 'Envia documento, imagem ou link',
  },
  {
    type: 'jump_to',
    label: 'Pular para',
    icon: '↗️',
    description: 'Pula para outro nó do fluxo',
  },
  {
    type: 'end',
    label: 'Finalizar',
    icon: '🏁',
    description: 'Finaliza a conversa',
  },
]

function Sidebar({ sidebarPinned, onTogglePin }) {
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
        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>
          Arraste os componentes para o canvas
        </p>

        {nodeDefinitions.map((node) => (
          <div
            key={node.type}
            className="node-type"
            onDragStart={(event) => onDragStart(event, node.type)}
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
