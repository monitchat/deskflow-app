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

function Sidebar() {
  return (
    <div className="flow-builder-sidebar">
      <div className="sidebar-section">
        <h3>Componentes</h3>
        <p style={{ fontSize: '0.8rem', color: '#999', marginBottom: '1rem' }}>
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
                <div style={{ fontWeight: 600 }}>{node.label}</div>
                <div style={{ fontSize: '0.75rem', color: '#999' }}>
                  {node.description}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="sidebar-section">
        <h3>Instruções</h3>
        <ul style={{ fontSize: '0.8rem', color: '#666', paddingLeft: '1.2rem' }}>
          <li>Arraste componentes para o canvas</li>
          <li>Clique em um nó para editar</li>
          <li>Clique em uma conexão para adicionar condição</li>
          <li>Conecte nós arrastando das bordas</li>
          <li>Salve o fluxo antes de ativar</li>
        </ul>
      </div>

      <div className="sidebar-section">
        <h3>Legenda de Condições</h3>
        <div style={{ fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ width: '20px', height: '3px', backgroundColor: '#b1b1b7', marginRight: '0.5rem' }}></div>
            <span>Sem condição</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ width: '20px', height: '3px', backgroundColor: '#4CAF50', marginRight: '0.5rem' }}></div>
            <span>Equals (igual a)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ width: '20px', height: '3px', backgroundColor: '#2196F3', marginRight: '0.5rem' }}></div>
            <span>Contains (contém)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ width: '20px', height: '3px', backgroundColor: '#FF9800', marginRight: '0.5rem' }}></div>
            <span>Context (contexto)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ width: '20px', height: '3px', backgroundColor: '#9C27B0', marginRight: '0.5rem' }}></div>
            <span>Positive (sim/ok)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ width: '20px', height: '3px', backgroundColor: '#00BCD4', marginRight: '0.5rem' }}></div>
            <span>Digit (número)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ width: '20px', height: '3px', backgroundColor: '#F44336', marginRight: '0.5rem' }}></div>
            <span>Regex</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
