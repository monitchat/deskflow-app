import { useState } from 'react'

const TARGET_TYPES = [
  {
    value: 'none',
    label: 'Sem destinatario fixo',
    description: 'O fluxo sera executado e decidira internamente quais contatos alcançar, usando nos como api_request ou logica interna.',
  },
  {
    value: 'list',
    label: 'Lista de numeros',
    description: 'Cole uma lista de numeros de telefone (um por linha). O fluxo sera executado uma vez para cada numero.',
  },
  {
    value: 'dynamic',
    label: 'Dinamico',
    description: 'O fluxo utiliza nos api_request ou logica customizada para buscar a lista de destinatarios a cada execucao.',
  },
]

function ScheduleTargets({ targetType, targetConfig, executionConfig, onChangeTargetType, onChangeTargetConfig, onChangeExecutionConfig }) {
  const [numbersText, setNumbersText] = useState(() => {
    const nums = targetConfig?.numbers || []
    return nums.join('\n')
  })

  const handleNumbersChange = (text) => {
    setNumbersText(text)
    const numbers = text
      .split('\n')
      .map(n => n.trim().replace(/\D/g, ''))
      .filter(n => n.length >= 10)
    onChangeTargetConfig({ ...targetConfig, numbers })
  }

  const numbersCount = (targetConfig?.numbers || []).length

  const [contextText, setContextText] = useState(() => {
    try {
      return JSON.stringify(executionConfig?.initial_context || {}, null, 2)
    } catch {
      return '{}'
    }
  })
  const [contextError, setContextError] = useState(null)

  const handleContextChange = (text) => {
    setContextText(text)
    try {
      const parsed = JSON.parse(text)
      setContextError(null)
      onChangeExecutionConfig({ ...executionConfig, initial_context: parsed })
    } catch {
      setContextError('JSON invalido')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Target type selector */}
      <div>
        <label style={labelStyle}>Tipo de destinatario</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {TARGET_TYPES.map(type => {
            const isSelected = targetType === type.value
            return (
              <button
                key={type.value}
                onClick={() => onChangeTargetType(type.value)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '0.2rem',
                  padding: '0.75rem',
                  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-input, #0f172a)',
                  border: `1px solid ${isSelected ? 'rgba(99, 102, 241, 0.4)' : 'var(--border, #334155)'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    border: `2px solid ${isSelected ? 'var(--accent, #6366f1)' : 'var(--border, #334155)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {isSelected && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent, #6366f1)',
                      }} />
                    )}
                  </div>
                  <span style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: isSelected ? 'var(--text-primary, #f1f5f9)' : 'var(--text-secondary, #cbd5e1)',
                  }}>
                    {type.label}
                  </span>
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-dim, #64748b)',
                  paddingLeft: '1.6rem',
                  lineHeight: 1.4,
                }}>
                  {type.description}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Numbers list for 'list' type */}
      {targetType === 'list' && (
        <div>
          <label style={labelStyle}>
            Numeros de telefone
            {numbersCount > 0 && (
              <span style={{
                fontWeight: 400,
                color: 'var(--accent, #6366f1)',
                marginLeft: '0.5rem',
              }}>
                ({numbersCount} {numbersCount === 1 ? 'numero valido' : 'numeros validos'})
              </span>
            )}
          </label>
          <textarea
            value={numbersText}
            onChange={(e) => handleNumbersChange(e.target.value)}
            placeholder={'5511999998888\n5511999997777\n5521988886666'}
            rows={8}
            style={{
              width: '100%',
              padding: '0.6rem 0.75rem',
              backgroundColor: 'var(--bg-input, #0f172a)',
              border: '1px solid var(--border, #334155)',
              borderRadius: '6px',
              color: 'var(--text-primary, #f1f5f9)',
              fontSize: '0.82rem',
              fontFamily: 'monospace',
              resize: 'vertical',
              lineHeight: 1.5,
              boxSizing: 'border-box',
            }}
          />
          <div style={{
            fontSize: '0.72rem',
            color: 'var(--text-dim, #64748b)',
            marginTop: '0.3rem',
          }}>
            Um numero por linha. Apenas numeros com 10+ digitos serao considerados.
          </div>
        </div>
      )}

      {/* Info box for 'dynamic' type */}
      {targetType === 'dynamic' && (
        <div style={infoBoxStyle}>
          O fluxo buscara os destinatarios dinamicamente a cada execucao. Certifique-se de que o fluxo
          possui nos do tipo <strong>api_request</strong> configurados para retornar a lista de contatos.
        </div>
      )}

      {/* Info box for 'none' type */}
      {targetType === 'none' && (
        <div style={infoBoxStyle}>
          O fluxo sera executado sem um destinatario pre-definido. Ele podera decidir internamente
          para quais contatos enviar mensagens usando sua propria logica.
        </div>
      )}

      {/* Initial context */}
      <div>
        <label style={labelStyle}>Contexto inicial (JSON)</label>
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--text-dim, #64748b)',
          marginBottom: '0.4rem',
          lineHeight: 1.4,
        }}>
          Variaveis que estarao disponiveis no contexto do fluxo em cada execucao agendada.
        </div>
        <textarea
          value={contextText}
          onChange={(e) => handleContextChange(e.target.value)}
          placeholder={'{\n  "campanha": "black-friday",\n  "prioridade": "alta"\n}'}
          rows={5}
          style={{
            width: '100%',
            padding: '0.6rem 0.75rem',
            backgroundColor: 'var(--bg-input, #0f172a)',
            border: `1px solid ${contextError ? '#ef4444' : 'var(--border, #334155)'}`,
            borderRadius: '6px',
            color: 'var(--text-primary, #f1f5f9)',
            fontSize: '0.8rem',
            fontFamily: 'monospace',
            resize: 'vertical',
            lineHeight: 1.5,
            boxSizing: 'border-box',
          }}
        />
        {contextError && (
          <div style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '0.25rem' }}>
            {contextError}
          </div>
        )}
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: '0.82rem',
  fontWeight: 600,
  color: 'var(--text-secondary, #cbd5e1)',
  marginBottom: '0.4rem',
}

const infoBoxStyle = {
  padding: '0.75rem',
  backgroundColor: 'rgba(99, 102, 241, 0.06)',
  border: '1px solid rgba(99, 102, 241, 0.15)',
  borderRadius: '8px',
  fontSize: '0.78rem',
  color: 'var(--text-muted, #94a3b8)',
  lineHeight: 1.5,
}

export default ScheduleTargets
