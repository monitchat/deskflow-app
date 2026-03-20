import { useState, useEffect } from 'react'
import ContextFieldsModal from './ContextFieldsModal'
import AutocompleteTextarea from './AutocompleteTextarea'

const CONDITION_TYPES = [
  { value: 'none', label: 'Sem condição (Default)' },
  { value: 'equals', label: 'Igual a (texto exato)' },
  { value: 'contains', label: 'Contém (texto parcial)' },
  { value: 'context', label: 'Valor no Contexto (1 condição)' },
  { value: 'multi_context', label: 'Múltiplas Condições (E / OU)' },
  { value: 'is_positive', label: 'Resposta Positiva (Sim/OK)' },
  { value: 'is_digit', label: 'É Número' },
  { value: 'regex', label: 'Expressão Regular' },
]

const COMMON_CONTEXT_KEYS = [
  // Campos de identificação
  { value: 'cpf', label: 'cpf (CPF do usuário)' },
  { value: 'tipo_contato', label: 'tipo_contato (M=Montador, C=Cliente)' },
  { value: 'codparc', label: 'codparc (código do parceiro)' },
  { value: 'nomeparc', label: 'nomeparc (nome do parceiro)' },
  { value: 'nomectt', label: 'nomectt (nome do contato)' },

  // Dados de cliente/parceiro
  { value: 'customer', label: 'customer (dados completos do cliente)' },
  { value: 'partner', label: 'partner (dados completos do parceiro)' },

  // Pedidos e serviços
  { value: 'customer_orders', label: 'customer_orders (produtos/pedidos)' },
  { value: 'customer_services', label: 'customer_services (serviços)' },

  // Estado da conversa
  { value: 'is_logged_in', label: 'is_logged_in (está autenticado?)' },
  { value: 'conversation_id', label: 'conversation_id (ID da conversa)' },
  { value: 'ticket_id', label: 'ticket_id (ID do ticket de atendimento)' },

  // Opções de menu e seleções
  { value: 'menu_option', label: 'menu_option (opção do menu)' },
  { value: 'menu_parceiro_option', label: 'menu_parceiro_option' },
  { value: 'menu_principal_option', label: 'menu_principal_option' },
  { value: 'loja_selecionada', label: 'loja_selecionada (loja escolhida)' },

  // Outros
  { value: 'receber_atualizacoes', label: 'receber_atualizacoes (aceita alertas?)' },
  { value: 'stage', label: 'stage (estágio atual)' },
  { value: 'previous_stage', label: 'previous_stage (estágio anterior)' },
  { value: 'last_message_sent', label: 'last_message_sent (última mensagem)' },
  { value: 'last_input', label: 'last_input (último input capturado)' },
]

function EdgeEditorModal({ edge, nodes = [], edges = [], onSave, onDelete, onClose }) {
  const [conditionType, setConditionType] = useState(
    edge.data?.condition?.type || 'none'
  )

  // Estados para diferentes tipos de condição
  const [values, setValues] = useState(
    edge.data?.condition?.values?.join('\n') || ''
  )
  const [contextKey, setContextKey] = useState(
    edge.data?.condition?.key || ''
  )
  const [contextValue, setContextValue] = useState(
    edge.data?.condition?.value || ''
  )
  const [contextOperator, setContextOperator] = useState(
    edge.data?.condition?.operator || 'eq'
  )
  const [regexPattern, setRegexPattern] = useState(
    edge.data?.condition?.pattern || ''
  )
  const [label, setLabel] = useState(edge.data?.label || '')
  const [showFieldsModal, setShowFieldsModal] = useState(false)
  const [multiConditions, setMultiConditions] = useState(
    edge.data?.condition?.conditions || [{ key: '', operator: 'eq', value: '' }]
  )
  const [multiLogic, setMultiLogic] = useState(
    edge.data?.condition?.logic || 'and'
  )

  // Detecta se a edge sai de um nó dentro de um loop
  const loopContext = (() => {
    const sourceNode = nodes.find(n => n.id === edge.source)
    if (!sourceNode) return null
    // Se a source é o próprio loop (handle loop_body), pega os dados do loop
    if (sourceNode.type === 'loop') return sourceNode.data
    // Verifica se a source está dentro de um loop (cadeia de edges)
    const visited = new Set()
    const findLoop = (nodeId) => {
      if (visited.has(nodeId)) return null
      visited.add(nodeId)
      for (const e of edges) {
        if (e.target === nodeId) {
          if (e.sourceHandle === 'loop_body') {
            const loopNode = nodes.find(n => n.id === e.source)
            if (loopNode && loopNode.type === 'loop') return loopNode.data
          }
          const result = findLoop(e.source)
          if (result) return result
        }
      }
      return null
    }
    return findLoop(edge.source)
  })()

  // Sugestões de campos do loop + API ancestral
  const loopFieldSuggestions = (() => {
    if (!loopContext) return []
    const itemVar = loopContext.item_variable || 'item'
    const suggestions = [
      { value: itemVar, label: `${itemVar} (item atual do loop)` },
      { value: 'loop.index', label: 'loop.index (índice 0, 1, 2...)' },
      { value: 'loop.key', label: 'loop.key (chave se dict)' },
      { value: 'loop.total', label: 'loop.total (total de itens)' },
      { value: 'loop.first', label: 'loop.first (true se primeiro)' },
      { value: 'loop.last', label: 'loop.last (true se último)' },
    ]
    // Busca campos da API ancestral
    const visited = new Set()
    const findApi = (nodeId) => {
      if (visited.has(nodeId)) return null
      visited.add(nodeId)
      for (const e of edges) {
        if (e.target === nodeId) {
          const src = nodes.find(n => n.id === e.source)
          if (src && src.type === 'api_request' && src.data._extracted_paths) {
            return src.data
          }
          const result = findApi(e.source)
          if (result) return result
        }
      }
      return null
    }
    const apiData = findApi(edge.source)
    if (apiData && apiData._extracted_paths && loopContext.source_variable) {
      const sourceVar = loopContext.source_variable
      for (const p of apiData._extracted_paths) {
        if (p.path.startsWith(sourceVar + '.') && !p.isArray) {
          const fieldName = p.path.replace(sourceVar + '.', '')
          suggestions.push({
            value: `${itemVar}.${fieldName}`,
            label: `${itemVar}.${fieldName} (ex: ${p.example !== undefined ? String(p.example).substring(0, 30) : '...'})`,
          })
        }
      }
    }
    return suggestions
  })()

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
    const edgeData = { ...edge }

    // Remove condição anterior
    if (!edgeData.data) {
      edgeData.data = {}
    }

    // Adiciona label
    if (label) {
      edgeData.data.label = label
    }

    // Configura condição baseada no tipo
    if (conditionType === 'none') {
      delete edgeData.data.condition
    } else if (conditionType === 'equals' || conditionType === 'contains') {
      edgeData.data.condition = {
        type: conditionType,
        values: values.split('\n').filter(v => v.trim()),
      }
    } else if (conditionType === 'context') {
      edgeData.data.condition = {
        type: 'context',
        key: contextKey,
        value: contextValue,
        operator: contextOperator,
      }
    } else if (conditionType === 'multi_context') {
      edgeData.data.condition = {
        type: 'multi_context',
        logic: multiLogic,
        conditions: multiConditions.filter(c => c.key),
      }
    } else if (conditionType === 'regex') {
      edgeData.data.condition = {
        type: 'regex',
        pattern: regexPattern,
      }
    } else if (conditionType === 'is_positive' || conditionType === 'is_digit') {
      edgeData.data.condition = {
        type: conditionType,
      }
    }

    onSave(edgeData)
  }

  const renderConditionFields = () => {
    switch (conditionType) {
      case 'equals':
      case 'contains':
        return (
          <>
            <div className="form-group">
              <label>
                {conditionType === 'equals' ? 'Valores exatos' : 'Valores que devem conter'}
                <small style={{ display: 'block', color: '#666', marginTop: '0.25rem' }}>
                  Um valor por linha. Digite $ para autocompletar campos do contexto.
                  <br />
                  Exemplo: {conditionType === 'equals' ? '1, um, primeiro' : 'goiabeira, laranjeira, vila velha'}
                </small>
              </label>
              <AutocompleteTextarea
                value={values}
                onChange={(e) => setValues(e.target.value)}
                placeholder={conditionType === 'equals' ? '1\n2\n3\nou ${{campo}}' : 'goiabeira\nlaranjeira\nou ${{campo}}'}
                rows={5}
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

      case 'context':
        return (
          <>
            <div className="form-group">
              <label>Chave no Contexto</label>
              <AutocompleteTextarea
                value={contextKey}
                onChange={(e) => setContextKey(e.target.value)}
                placeholder="Ex: cpf, customer.NOMEPARC.$, campo1.campo2 (digite $ para autocompletar)"
                rows={1}
                extraSuggestions={loopFieldSuggestions.map(f => ({ label: f.value, value: f.value, example: f.label }))}
              />
              <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
                💡 Digite $ para autocompletar ou o nome do campo do contexto (sem $&#123;&#123; &#125;&#125;)
                <br />
                Exemplos: <code>cpf</code>, <code>tipo_contato</code>, <code>customer.NOMEPARC</code>
                <br />
                <strong>💬 Para usar em mensagens:</strong> Use <code>$&#123;&#123;cpf&#125;&#125;</code> ou <code>$&#123;&#123;nomeparc&#125;&#125;</code>
              </small>
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
            {/* Sugestões de campos do Loop */}
            {loopFieldSuggestions.length > 0 && (
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ color: '#f59e0b' }}>🔄 Campos do Loop (clique para usar)</label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '0.5rem',
                  marginTop: '0.5rem'
                }}>
                  {loopFieldSuggestions.map((field) => (
                    <button
                      key={field.value}
                      type="button"
                      onClick={() => setContextKey(field.value)}
                      style={{
                        padding: '0.5rem',
                        textAlign: 'left',
                        backgroundColor: contextKey === field.value ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-surface, #f8f9fa)',
                        border: `1px solid ${contextKey === field.value ? '#f59e0b' : 'var(--border, #dee2e6)'}`,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        color: 'var(--text-primary, inherit)',
                      }}
                    >
                      <strong>{field.value}</strong>
                      <br />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #666)' }}>
                        {field.label.replace(field.value + ' ', '')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Sugestões de Campos Comuns (clique para usar)</label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '0.5rem',
                marginTop: '0.5rem'
              }}>
                {COMMON_CONTEXT_KEYS.map((key) => (
                  <button
                    key={key.value}
                    type="button"
                    onClick={() => setContextKey(key.value)}
                    style={{
                      padding: '0.5rem',
                      fontSize: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: contextKey === key.value ? '#e3f2fd' : '#fff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'monospace'
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{key.value}</div>
                    <div style={{ fontSize: '0.7rem', color: '#666' }}>
                      {key.label.split('(')[1]?.replace(')', '') || ''}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Operador</label>
              <select
                value={contextOperator}
                onChange={(e) => setContextOperator(e.target.value)}
                style={{ fontSize: '0.9rem' }}
              >
                <option value="eq">= Igual</option>
                <option value="neq">≠ Diferente</option>
                <option value="gt">&gt; Maior que</option>
                <option value="gte">≥ Maior ou igual</option>
                <option value="lt">&lt; Menor que</option>
                <option value="lte">≤ Menor ou igual</option>
                <option value="exists">Existe (não vazio)</option>
              </select>
            </div>
            {contextOperator !== 'exists' && (
              <div className="form-group">
                <label>Valor Esperado</label>
                <AutocompleteTextarea
                  value={contextValue}
                  onChange={(e) => setContextValue(e.target.value)}
                  placeholder='Ex: 1, texto, ${{campo}} (digite $ para autocompletar)'
                  rows={1}
                />
                <small style={{ color: '#666', marginTop: '0.25rem', display: 'block' }}>
                  Para comparações numéricas, use valores numéricos. Use $ para autocompletar campos.
                </small>
              </div>
            )}
          </>
        )

      case 'multi_context':
        return (
          <>
            <div className="form-group">
              <label>Lógica entre condições</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setMultiLogic('and')}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    backgroundColor: multiLogic === 'and' ? 'var(--accent, #7c3aed)' : 'var(--bg-surface, #2a2a3e)',
                    color: multiLogic === 'and' ? '#fff' : 'var(--text-primary, #e0e0e0)',
                    border: `1px solid ${multiLogic === 'and' ? 'var(--accent, #7c3aed)' : 'var(--border, #333)'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  E (AND) — Todas devem ser verdadeiras
                </button>
                <button
                  type="button"
                  onClick={() => setMultiLogic('or')}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    backgroundColor: multiLogic === 'or' ? '#f59e0b' : 'var(--bg-surface, #2a2a3e)',
                    color: multiLogic === 'or' ? '#000' : 'var(--text-primary, #e0e0e0)',
                    border: `1px solid ${multiLogic === 'or' ? '#f59e0b' : 'var(--border, #333)'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  OU (OR) — Pelo menos uma
                </button>
              </div>
            </div>

            {multiConditions.map((cond, index) => (
              <div key={index} style={{
                padding: '0.8rem',
                marginBottom: '0.5rem',
                backgroundColor: 'var(--card-bg, #1a1a2e)',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #333)',
                position: 'relative',
              }}>
                {index > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '-14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: multiLogic === 'and' ? 'var(--accent, #7c3aed)' : '#f59e0b',
                    color: multiLogic === 'and' ? '#fff' : '#000',
                    padding: '0.1rem 0.6rem',
                    borderRadius: '10px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                  }}>
                    {multiLogic === 'and' ? 'E' : 'OU'}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <strong style={{ fontSize: '0.8rem' }}>Condição {index + 1}</strong>
                  {multiConditions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...multiConditions]
                        updated.splice(index, 1)
                        setMultiConditions(updated)
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#F44336', cursor: 'pointer', fontSize: '1rem' }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
                <div className="form-group" style={{ marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem' }}>Chave</label>
                  <AutocompleteTextarea
                    value={cond.key || ''}
                    onChange={(e) => {
                      const updated = [...multiConditions]
                      updated[index] = { ...updated[index], key: e.target.value }
                      setMultiConditions(updated)
                    }}
                    placeholder="item.userId"
                    rows={1}
                    extraSuggestions={loopFieldSuggestions.map(f => ({ label: f.value, value: f.value, example: f.label }))}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <div className="form-group" style={{ flex: '0 0 140px', marginBottom: 0 }}>
                    <select
                      value={cond.operator || 'eq'}
                      onChange={(e) => {
                        const updated = [...multiConditions]
                        updated[index] = { ...updated[index], operator: e.target.value }
                        setMultiConditions(updated)
                      }}
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
                  {!['exists', 'not_exists'].includes(cond.operator) && (
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <input
                        type="text"
                        value={cond.value || ''}
                        onChange={(e) => {
                          const updated = [...multiConditions]
                          updated[index] = { ...updated[index], value: e.target.value }
                          setMultiConditions(updated)
                        }}
                        placeholder="Valor"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setMultiConditions([...multiConditions, { key: '', operator: 'eq', value: '' }])}
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: 'var(--bg-surface, #2a2a3e)',
                color: 'var(--text-primary, #e0e0e0)',
                border: '1px dashed var(--border, #444)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                marginBottom: '1rem',
              }}
            >
              + Adicionar Condição
            </button>

            {/* Sugestões de campos do Loop */}
            {loopFieldSuggestions.length > 0 && (
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ color: '#f59e0b', fontSize: '0.85rem' }}>🔄 Campos do Loop disponíveis:</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.3rem' }}>
                  {loopFieldSuggestions.map((field) => (
                    <span key={field.value} style={{
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.7rem',
                      fontFamily: 'monospace',
                      backgroundColor: 'var(--bg-surface, #2a2a3e)',
                      border: '1px solid var(--border, #444)',
                      borderRadius: '4px',
                      color: 'var(--text-primary, #e0e0e0)',
                    }}>
                      {field.value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )

      case 'regex':
        return (
          <div className="form-group">
            <label>Padrão Regex</label>
            <input
              type="text"
              value={regexPattern}
              onChange={(e) => setRegexPattern(e.target.value)}
              placeholder="Ex: ^\d{11}$ (11 dígitos)"
              style={{ fontFamily: 'monospace' }}
            />
            <small style={{ color: '#666', marginTop: '0.25rem', display: 'block' }}>
              Exemplos:<br />
              • ^\d{'{11}'}$ → Exatamente 11 dígitos<br />
              • ^[0-9]+$ → Apenas números<br />
              • ^\d{'{3}'}\.\d{'{3}'}\.\d{'{3}'}-\d{'{2}'}$ → CPF formatado
            </small>
          </div>
        )

      case 'is_positive':
        return (
          <div className="form-group">
            <div style={{ padding: '1rem', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
              <strong>ℹ️ Condição: Resposta Positiva</strong>
              <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
                Esta condição detecta automaticamente respostas afirmativas como:
                "sim", "yes", "ok", "okay", "claro", "com certeza", etc.
              </p>
            </div>
          </div>
        )

      case 'is_digit':
        return (
          <div className="form-group">
            <div style={{ padding: '1rem', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
              <strong>ℹ️ Condição: É Número</strong>
              <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
                Esta condição verifica se o input é composto apenas por dígitos numéricos.
                Exemplos que passam: "1", "123", "9999"
              </p>
            </div>
          </div>
        )

      case 'none':
        return (
          <div className="form-group">
            <div style={{ padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
              <strong>⚠️ Sem Condição (Default)</strong>
              <p style={{ margin: '0.5rem 0 0 0', color: '#856404' }}>
                Esta conexão será usada quando nenhuma outra condição for satisfeita.
                É recomendado ter sempre uma edge default em nós de condição.
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const getPreview = () => {
    if (conditionType === 'none') {
      return 'Conexão default (sem condição)'
    } else if (conditionType === 'equals') {
      const vals = values.split('\n').filter(v => v.trim())
      return `Texto igual a: ${vals.join(' OU ')}`
    } else if (conditionType === 'contains') {
      const vals = values.split('\n').filter(v => v.trim())
      return `Texto contém: ${vals.join(' OU ')}`
    } else if (conditionType === 'context') {
      const opSymbols = { eq: '=', neq: '≠', gt: '>', gte: '≥', lt: '<', lte: '≤', exists: 'existe' }
      const op = opSymbols[contextOperator] || '='
      if (contextOperator === 'exists') return `Contexto[${contextKey}] existe`
      return `Contexto[${contextKey}] ${op} "${contextValue}"`
    } else if (conditionType === 'regex') {
      return `Regex: ${regexPattern}`
    } else if (conditionType === 'is_positive') {
      return 'Resposta positiva (sim, ok, etc)'
    } else if (conditionType === 'is_digit') {
      return 'É número'
    }
    return ''
  }

  return (
    <>
      {showFieldsModal && (
        <ContextFieldsModal onClose={() => setShowFieldsModal(false)} />
      )}

      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
          <h2>⚡ Configurar Condição da Conexão</h2>

        <div style={{
          padding: '0.75rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          marginBottom: '1.5rem',
          fontSize: '0.9rem'
        }}>
          <strong>De:</strong> {edge.source} → <strong>Para:</strong> {edge.target}
        </div>

        <div className="form-group">
          <label>Rótulo da Conexão (opcional)</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex: Se for montador, Opção 1"
          />
          <small style={{ color: '#666' }}>
            Este rótulo ajuda a identificar a conexão visualmente
          </small>
        </div>

        <div className="form-group">
          <label>Tipo de Condição</label>
          <select
            value={conditionType}
            onChange={(e) => setConditionType(e.target.value)}
            style={{ fontSize: '1rem' }}
          >
            {CONDITION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {renderConditionFields()}

        {conditionType !== 'none' && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#e8f5e9',
            borderRadius: '4px',
            marginTop: '1rem'
          }}>
            <strong>📋 Preview:</strong>
            <div style={{ marginTop: '0.5rem', fontFamily: 'monospace', fontSize: '0.9rem' }}>
              {getPreview()}
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-danger" onClick={onDelete}>
            Excluir Conexão
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Salvar Condição
          </button>
        </div>
      </div>
    </div>
    </>
  )
}

export default EdgeEditorModal
