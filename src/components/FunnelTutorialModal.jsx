import { useState } from 'react'

const slides = [
  {
    title: 'Bem-vindo aos Funis CRM',
    subtitle: 'Gerencie seus contatos visualmente em pipelines personalizados',
    icon: '📊',
    content: (
      <>
        <p>Os Funis CRM permitem acompanhar a jornada de cada contato em etapas visuais, com automacoes integradas ao MonitChat.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
          {[
            { icon: '🏗️', text: 'Crie funis com etapas personalizadas e cores' },
            { icon: '🖱️', text: 'Arraste cards entre etapas no kanban' },
            { icon: '⚡', text: 'Configure automacoes por etapa' },
            { icon: '🤖', text: 'Integre com flows para mover cards automaticamente' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
              padding: '0.6rem', borderRadius: '8px',
              backgroundColor: 'var(--bg-secondary, #F9FAFB)',
              border: '1px solid var(--border, #E5E7EB)',
            }}>
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text, #374151)', lineHeight: 1.4 }}>{item.text}</span>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    title: 'Criando um Funil',
    subtitle: 'Configure etapas que representam seu processo',
    icon: '🏗️',
    content: (
      <>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim, #6B7280)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
          Um funil e composto por etapas que representam cada fase do seu processo. Exemplos:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{
            padding: '0.75rem', borderRadius: '10px',
            backgroundColor: 'var(--bg-secondary, #F9FAFB)',
            border: '1px solid var(--border, #E5E7EB)',
          }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text, #111)', marginBottom: '0.4rem' }}>
              Funil de Vendas
            </div>
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
              {['Novo Lead', 'Qualificado', 'Proposta', 'Negociacao', 'Fechado'].map((s, i) => (
                <span key={i} style={{
                  fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '10px',
                  backgroundColor: ['#3b82f620', '#f59e0b20', '#8b5cf620', '#06b6d420', '#22c55e20'][i],
                  color: ['#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#22c55e'][i],
                  fontWeight: 500,
                }}>{s}</span>
              ))}
            </div>
          </div>

          <div style={{
            padding: '0.75rem', borderRadius: '10px',
            backgroundColor: 'var(--bg-secondary, #F9FAFB)',
            border: '1px solid var(--border, #E5E7EB)',
          }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text, #111)', marginBottom: '0.4rem' }}>
              Funil de Suporte
            </div>
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
              {['Aberto', 'Em Analise', 'Aguardando Cliente', 'Resolvido'].map((s, i) => (
                <span key={i} style={{
                  fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '10px',
                  backgroundColor: ['#ef444420', '#f59e0b20', '#06b6d420', '#22c55e20'][i],
                  color: ['#ef4444', '#f59e0b', '#06b6d4', '#22c55e'][i],
                  fontWeight: 500,
                }}>{s}</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          padding: '0.6rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem',
          backgroundColor: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.15)',
          color: 'var(--text-dim, #6B7280)', lineHeight: 1.5, marginTop: '0.75rem',
        }}>
          <strong>Dica:</strong> Cada etapa pode ter uma cor diferente para facilitar a visualizacao. Clique em "Configurar" no kanban para editar etapas a qualquer momento.
        </div>
      </>
    ),
  },
  {
    title: 'Kanban Board',
    subtitle: 'Visualize e gerencie seus contatos em colunas',
    icon: '🖱️',
    content: (
      <>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim, #6B7280)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
          O kanban exibe cada etapa como uma coluna. Os cards representam contatos que voce pode gerenciar:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {[
            { icon: '➕', name: 'Adicionar card', desc: 'Clique em "+ Adicionar contato" na base de qualquer coluna. Informe o telefone e opcionalmente o nome.' },
            { icon: '🖱️', name: 'Arrastar e soltar', desc: 'Arraste um card de uma coluna para outra para mover o contato de etapa. As automacoes configuradas serao executadas automaticamente.' },
            { icon: '🔍', name: 'Buscar', desc: 'Use o campo de busca no header para encontrar contatos por nome ou telefone.' },
            { icon: '📋', name: 'Detalhe do card', desc: 'Clique em um card para ver detalhes, alterar etapa pelo dropdown, ver historico de movimentacoes e remover do funil.' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
              padding: '0.5rem 0',
              borderBottom: i < 3 ? '1px solid var(--border, #F3F4F6)' : 'none',
            }}>
              <span style={{ fontSize: '1.1rem', flexShrink: 0, width: '28px', textAlign: 'center' }}>{item.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text, #111)' }}>{item.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim, #6B7280)', lineHeight: 1.4 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    title: 'Automacoes por Etapa',
    subtitle: 'Acoes automaticas quando um card muda de etapa',
    icon: '⚡',
    content: (
      <>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim, #6B7280)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
          Configure acoes que sao executadas automaticamente quando um card entra em uma etapa. Acesse pelo botao "Configurar" no kanban.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {[
            { icon: '💬', name: 'Enviar mensagem', desc: 'Envia uma mensagem de texto via WhatsApp para o contato.' },
            { icon: '📨', name: 'Enviar template', desc: 'Envia um template WhatsApp aprovado, com suporte a parametros dinamicos.' },
            { icon: '👤', name: 'Transferir departamento', desc: 'Transfere o atendimento para um departamento especifico do MonitChat.' },
            { icon: '🏷️', name: 'Atribuir tag', desc: 'Adiciona uma tag ao contato no MonitChat para categorizar.' },
            { icon: '🎫', name: 'Alterar status do ticket', desc: 'Muda o status do ticket ativo do contato.' },
            { icon: '👑', name: 'Alterar dono do ticket', desc: 'Atribui o ticket a um usuario especifico.' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
              padding: '0.5rem 0',
              borderBottom: i < 5 ? '1px solid var(--border, #F3F4F6)' : 'none',
            }}>
              <span style={{ fontSize: '1.1rem', flexShrink: 0, width: '28px', textAlign: 'center' }}>{item.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text, #111)' }}>{item.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim, #6B7280)', lineHeight: 1.4 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          padding: '0.6rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem',
          backgroundColor: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.15)',
          color: 'var(--text-dim, #6B7280)', lineHeight: 1.5, marginTop: '0.75rem',
        }}>
          <strong>Importante:</strong> As automacoes precisam de dados do contexto (token, ticket_id) para funcionar. Contatos que ja interagiram com o bot terao esses dados automaticamente. Para contatos adicionados manualmente, apenas "Enviar template" funciona sem contexto previo.
        </div>
      </>
    ),
  },
  {
    title: 'Integracao com Flows',
    subtitle: 'O bot move cards automaticamente durante a conversa',
    icon: '🤖',
    content: (
      <>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim, #6B7280)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
          Use o no "Mover no Funil" no Flow Builder para que o bot mova contatos entre etapas automaticamente durante a conversa.
        </p>

        <div style={{
          padding: '0.75rem', borderRadius: '10px',
          backgroundColor: 'var(--bg-secondary, #F9FAFB)',
          border: '1px solid var(--border, #E5E7EB)',
          marginBottom: '0.75rem',
        }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text, #111)', marginBottom: '0.5rem' }}>
            📊 No "Mover no Funil"
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim, #6B7280)', lineHeight: 1.6 }}>
            <strong>Configuracao:</strong>
            <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.2rem' }}>
              <li><strong>Funil</strong> - Selecione qual funil usar</li>
              <li><strong>Etapa</strong> - Para qual etapa mover o contato</li>
              <li><strong>Criar se nao existir</strong> - Cria o card automaticamente se o contato ainda nao esta no funil</li>
            </ul>
          </div>
        </div>

        <div style={{
          padding: '0.75rem', borderRadius: '10px',
          backgroundColor: 'var(--bg-secondary, #F9FAFB)',
          border: '1px solid var(--border, #E5E7EB)',
        }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text, #111)', marginBottom: '0.4rem' }}>
            Exemplo de fluxo
          </div>
          <div style={{
            fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: 1.8,
            color: 'var(--text-dim, #6B7280)',
          }}>
            <div>1. Cliente manda mensagem</div>
            <div>2. Bot coleta nome e interesse</div>
            <div>3. <span style={{ color: '#6366f1', fontWeight: 600 }}>📊 Mover no Funil → "Novo Lead"</span></div>
            <div>4. Bot qualifica o lead</div>
            <div>5. <span style={{ color: '#6366f1', fontWeight: 600 }}>📊 Mover no Funil → "Qualificado"</span></div>
            <div>6. Transfere para vendedor</div>
          </div>
        </div>
      </>
    ),
  },
  {
    title: 'Fluxo Completo',
    subtitle: 'Como tudo se conecta',
    icon: '✨',
    content: (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {[
            { icon: '1️⃣', title: 'Crie o funil', desc: 'Na pagina de Funis, crie um funil com as etapas do seu processo (vendas, suporte, onboarding, etc).' },
            { icon: '2️⃣', title: 'Configure automacoes', desc: 'Em cada etapa, adicione acoes automaticas: enviar mensagem, transferir, atribuir tag, alterar status.' },
            { icon: '3️⃣', title: 'Integre com o flow', desc: 'No Flow Builder, use o no "Mover no Funil" para que o bot mova contatos automaticamente conforme a conversa avanca.' },
            { icon: '4️⃣', title: 'Gerencie no kanban', desc: 'Acompanhe visualmente onde cada contato esta. Arraste cards entre etapas, veja historico e gerencie atribuicoes.' },
            { icon: '5️⃣', title: 'Automacoes disparam', desc: 'Ao mover um card (pelo bot ou manualmente), as automacoes da etapa destino sao executadas automaticamente.' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
              padding: '0.6rem',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-secondary, #F9FAFB)',
              border: '1px solid var(--border, #E5E7EB)',
            }}>
              <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text, #111)' }}>{item.title}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim, #6B7280)', lineHeight: 1.4 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          padding: '0.6rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem',
          backgroundColor: 'rgba(34, 197, 94, 0.08)',
          border: '1px solid rgba(34, 197, 94, 0.15)',
          color: 'var(--text-dim, #6B7280)', lineHeight: 1.5, marginTop: '0.75rem',
        }}>
          <strong>Resultado:</strong> Voce tem uma visao completa de onde cada contato esta no processo, com o bot alimentando automaticamente e as automacoes executando acoes em cada transicao.
        </div>
      </>
    ),
  },
]

function FunnelTutorialModal({ onClose }) {
  const [step, setStep] = useState(0)
  const slide = slides[step]
  const isLast = step === slides.length - 1
  const isFirst = step === 0

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 20000,
        animation: 'tutFadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes tutFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tutSlideIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg, #fff)',
          borderRadius: '16px',
          width: '620px',
          maxWidth: '92vw',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.3)',
          animation: 'tutSlideIn 0.25s ease-out',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          borderBottom: '1px solid var(--border, #eee)',
          flexShrink: 0,
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.3rem', flexShrink: 0,
          }}>
            {slide.icon}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text, #111)' }}>
              {slide.title}
            </h3>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-dim, #9CA3AF)' }}>
              {slide.subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', fontSize: '1.3rem',
              cursor: 'pointer', color: 'var(--text-dim, #999)', lineHeight: 1,
              padding: '0.25rem',
            }}
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '1.25rem 1.5rem',
          overflowY: 'auto',
          flex: 1,
          color: 'var(--text, #374151)',
          fontSize: '0.85rem',
          lineHeight: 1.5,
        }}>
          {slide.content}
        </div>

        {/* Footer */}
        <div style={{
          padding: '0.75rem 1.5rem 1rem',
          borderTop: '1px solid var(--border, #eee)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          {/* Progress dots */}
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                style={{
                  width: i === step ? '20px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  backgroundColor: i === step ? '#f59e0b' : 'var(--border, #D1D5DB)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.2s',
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim, #9CA3AF)', marginRight: '0.25rem' }}>
              {step + 1} / {slides.length}
            </span>

            {!isFirst && (
              <button
                onClick={() => setStep(step - 1)}
                style={{
                  padding: '0.45rem 0.9rem',
                  backgroundColor: 'var(--bg-hover, #F3F4F6)',
                  color: 'var(--text, #374151)',
                  border: '1px solid var(--border, #E5E7EB)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                }}
              >
                Anterior
              </button>
            )}

            <button
              onClick={() => {
                if (isLast) onClose()
                else setStep(step + 1)
              }}
              style={{
                padding: '0.45rem 0.9rem',
                backgroundColor: isLast ? '#22c55e' : '#f59e0b',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.target.style.opacity = '0.9' }}
              onMouseLeave={(e) => { e.target.style.opacity = '1' }}
            >
              {isLast ? 'Comecar!' : 'Proximo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FunnelTutorialModal
