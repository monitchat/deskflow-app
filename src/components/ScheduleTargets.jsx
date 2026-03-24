import { useState, useEffect } from 'react'

const TARGET_TYPES = [
  {
    value: 'none',
    label: 'Sem destinatario fixo',
    description: 'O fluxo sera executado e decidira internamente quais contatos alcancar, usando nos como api_request ou logica interna.',
  },
  {
    value: 'list',
    label: 'Lista de numeros',
    description: 'Cole uma lista de numeros de telefone (um por linha). O fluxo sera executado uma vez para cada numero.',
  },
  {
    value: 'monitchat_group',
    label: 'Grupo do MonitChat',
    description: 'Selecione grupos de contatos do MonitChat. Os contatos serao buscados automaticamente a cada execucao.',
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

  // MonitChat group states
  const [groups, setGroups] = useState([])
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [groupsError, setGroupsError] = useState(null)
  const [groupSearch, setGroupSearch] = useState('')

  const selectedGroupIds = targetConfig?.group_ids || []
  const selectedGroups = targetConfig?.groups || []

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

  // Fetch MonitChat contact groups
  const fetchContactGroups = async () => {
    setLoadingGroups(true)
    setGroupsError(null)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        'https://api-v2.monitchat.com/api/v1/group?skip=0&take=500&order=name&order_direction=asc',
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
      const groupsList = result.data || result || []
      setGroups(Array.isArray(groupsList) ? groupsList : [])
    } catch (error) {
      console.error('Error fetching contact groups:', error)
      setGroupsError(error.message || 'Erro ao buscar grupos de contatos')
    } finally {
      setLoadingGroups(false)
    }
  }

  useEffect(() => {
    if (targetType === 'monitchat_group') {
      fetchContactGroups()
    }
  }, [targetType])

  const toggleGroup = (group) => {
    const isSelected = selectedGroupIds.includes(group.id)
    let newGroupIds
    let newGroups

    if (isSelected) {
      newGroupIds = selectedGroupIds.filter(id => id !== group.id)
      newGroups = selectedGroups.filter(g => g.id !== group.id)
    } else {
      newGroupIds = [...selectedGroupIds, group.id]
      newGroups = [...selectedGroups, {
        id: group.id,
        name: group.name,
        contacts_count: group.contacts_count || group.total_contacts || 0,
      }]
    }

    onChangeTargetConfig({
      ...targetConfig,
      group_ids: newGroupIds,
      groups: newGroups,
    })
  }

  const filteredGroups = groups.filter(g => {
    if (!groupSearch.trim()) return true
    const search = groupSearch.toLowerCase()
    return (g.name || '').toLowerCase().includes(search)
  })

  const totalContacts = selectedGroups.reduce(
    (sum, g) => sum + (g.contacts_count || g.total_contacts || 0), 0
  )

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

      {/* MonitChat group selector */}
      {targetType === 'monitchat_group' && (
        <div>
          <label style={labelStyle}>
            Grupos de contatos
            {selectedGroupIds.length > 0 && (
              <span style={{
                fontWeight: 400,
                color: 'var(--accent, #6366f1)',
                marginLeft: '0.5rem',
              }}>
                ({selectedGroupIds.length} {selectedGroupIds.length === 1 ? 'grupo selecionado' : 'grupos selecionados'}
                {totalContacts > 0 && ` ~ ${totalContacts} contatos`})
              </span>
            )}
          </label>

          {/* Search input */}
          <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
            <input
              type="text"
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
              placeholder="Buscar grupo..."
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                paddingLeft: '2rem',
                backgroundColor: 'var(--bg-input, #0f172a)',
                border: '1px solid var(--border, #334155)',
                borderRadius: '6px',
                color: 'var(--text-primary, #f1f5f9)',
                fontSize: '0.82rem',
                boxSizing: 'border-box',
              }}
            />
            <span style={{
              position: 'absolute',
              left: '0.6rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-dim, #64748b)',
              fontSize: '0.85rem',
              pointerEvents: 'none',
            }}>
              &#x1F50D;
            </span>
          </div>

          {/* Loading state */}
          {loadingGroups && (
            <div style={{
              padding: '1.5rem',
              textAlign: 'center',
              color: 'var(--text-dim, #64748b)',
              fontSize: '0.82rem',
            }}>
              Carregando grupos...
            </div>
          )}

          {/* Error state */}
          {groupsError && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              fontSize: '0.78rem',
              color: '#f87171',
              lineHeight: 1.5,
            }}>
              <div>{groupsError}</div>
              <button
                onClick={fetchContactGroups}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.3rem 0.6rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '4px',
                  color: '#f87171',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                }}
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Groups list */}
          {!loadingGroups && !groupsError && (
            <div style={{
              maxHeight: '280px',
              overflowY: 'auto',
              border: '1px solid var(--border, #334155)',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-input, #0f172a)',
            }}>
              {filteredGroups.length === 0 ? (
                <div style={{
                  padding: '1.5rem',
                  textAlign: 'center',
                  color: 'var(--text-dim, #64748b)',
                  fontSize: '0.82rem',
                }}>
                  {groups.length === 0
                    ? 'Nenhum grupo de contatos encontrado'
                    : 'Nenhum grupo corresponde a busca'
                  }
                </div>
              ) : (
                filteredGroups.map((group, idx) => {
                  const isSelected = selectedGroupIds.includes(group.id)
                  const contactCount = group.contacts_count || group.total_contacts || 0
                  return (
                    <div
                      key={group.id}
                      onClick={() => toggleGroup(group)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.6rem 0.75rem',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                        borderBottom: idx < filteredGroups.length - 1 ? '1px solid var(--border, #1e293b)' : 'none',
                        transition: 'background-color 0.1s',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isSelected ? 'rgba(99, 102, 241, 0.08)' : 'transparent'
                      }}
                    >
                      {/* Checkbox */}
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '3px',
                        border: `2px solid ${isSelected ? 'var(--accent, #6366f1)' : 'var(--border, #475569)'}`,
                        backgroundColor: isSelected ? 'var(--accent, #6366f1)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.1s',
                      }}>
                        {isSelected && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>

                      {/* Group info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.82rem',
                          fontWeight: isSelected ? 600 : 400,
                          color: isSelected ? 'var(--text-primary, #f1f5f9)' : 'var(--text-secondary, #cbd5e1)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {group.name}
                        </div>
                      </div>

                      {/* Contact count badge */}
                      {contactCount > 0 && (
                        <span style={{
                          fontSize: '0.7rem',
                          padding: '0.15rem 0.45rem',
                          backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '10px',
                          color: isSelected ? 'var(--accent, #818cf8)' : 'var(--text-dim, #64748b)',
                          fontWeight: 500,
                          flexShrink: 0,
                        }}>
                          {contactCount} {contactCount === 1 ? 'contato' : 'contatos'}
                        </span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* Selected groups summary */}
          {selectedGroups.length > 0 && (
            <div style={{
              marginTop: '0.5rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.3rem',
            }}>
              {selectedGroups.map(g => (
                <span
                  key={g.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.2rem 0.5rem',
                    backgroundColor: 'rgba(99, 102, 241, 0.12)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    borderRadius: '12px',
                    fontSize: '0.72rem',
                    color: 'var(--accent, #818cf8)',
                    fontWeight: 500,
                  }}
                >
                  {g.name}
                  <span
                    onClick={(e) => { e.stopPropagation(); toggleGroup(g) }}
                    style={{
                      cursor: 'pointer',
                      opacity: 0.7,
                      fontSize: '0.8rem',
                      lineHeight: 1,
                    }}
                  >
                    &times;
                  </span>
                </span>
              ))}
            </div>
          )}

          <div style={{
            fontSize: '0.72rem',
            color: 'var(--text-dim, #64748b)',
            marginTop: '0.3rem',
            lineHeight: 1.4,
          }}>
            Os contatos dos grupos selecionados serao buscados automaticamente a cada execucao do agendamento.
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
