import { useState, useEffect } from 'react'
import api from '../config/axios'

function SecretsPanel({ flowId, onClose }) {
  const [activeTab, setActiveTab] = useState('secrets')

  // Secrets state
  const [secrets, setSecrets] = useState({})
  const [newSecretKey, setNewSecretKey] = useState('')
  const [newSecretValue, setNewSecretValue] = useState('')
  const [editingSecretKey, setEditingSecretKey] = useState(null)
  const [editSecretValue, setEditSecretValue] = useState('')

  // Variables state
  const [variables, setVariables] = useState({})
  const [newVarKey, setNewVarKey] = useState('')
  const [newVarValue, setNewVarValue] = useState('')
  const [editingVarKey, setEditingVarKey] = useState(null)
  const [editVarValue, setEditVarValue] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadAll()
  }, [flowId])

  const loadAll = async () => {
    try {
      setLoading(true)
      setError(null)
      const [secretsRes, varsRes] = await Promise.all([
        api.get(`/api/v1/flows/${flowId}/secrets`),
        api.get(`/api/v1/flows/${flowId}/variables`).catch(() => ({ data: { success: true, data: { variables: {} } } })),
      ])
      if (secretsRes.data.success) {
        setSecrets(secretsRes.data.data.secrets || {})
      }
      if (varsRes.data.success) {
        setVariables(varsRes.data.data.variables || {})
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  // === Secrets handlers ===
  const handleAddSecret = async () => {
    const key = newSecretKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_')
    if (!key || !newSecretValue.trim()) return
    try {
      setSaving(true)
      setError(null)
      await api.put(`/api/v1/flows/${flowId}/secrets`, { secrets: { [key]: newSecretValue.trim() } })
      setNewSecretKey('')
      setNewSecretValue('')
      await loadAll()
    } catch (err) {
      console.error('Error saving secret:', err)
      setError('Erro ao salvar credencial')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateSecret = async (key) => {
    if (!editSecretValue.trim()) return
    try {
      setSaving(true)
      setError(null)
      await api.put(`/api/v1/flows/${flowId}/secrets`, { secrets: { [key]: editSecretValue.trim() } })
      setEditingSecretKey(null)
      setEditSecretValue('')
      await loadAll()
    } catch (err) {
      console.error('Error updating secret:', err)
      setError('Erro ao atualizar credencial')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSecret = async (key) => {
    if (!window.confirm(`Remover a credencial "${key}"?`)) return
    try {
      setSaving(true)
      setError(null)
      await api.delete(`/api/v1/flows/${flowId}/secrets/${key}`)
      await loadAll()
    } catch (err) {
      console.error('Error deleting secret:', err)
      setError('Erro ao remover credencial')
    } finally {
      setSaving(false)
    }
  }

  // === Variables handlers ===
  const handleAddVariable = async () => {
    const key = newVarKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_')
    if (!key || !newVarValue.trim()) return
    try {
      setSaving(true)
      setError(null)
      await api.put(`/api/v1/flows/${flowId}/variables`, { variables: { [key]: newVarValue.trim() } })
      setNewVarKey('')
      setNewVarValue('')
      await loadAll()
    } catch (err) {
      console.error('Error saving variable:', err)
      setError('Erro ao salvar variável')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateVariable = async (key) => {
    if (!editVarValue.trim()) return
    try {
      setSaving(true)
      setError(null)
      await api.put(`/api/v1/flows/${flowId}/variables`, { variables: { [key]: editVarValue.trim() } })
      setEditingVarKey(null)
      setEditVarValue('')
      await loadAll()
    } catch (err) {
      console.error('Error updating variable:', err)
      setError('Erro ao atualizar variável')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteVariable = async (key) => {
    if (!window.confirm(`Remover a variável "${key}"?`)) return
    try {
      setSaving(true)
      setError(null)
      await api.delete(`/api/v1/flows/${flowId}/variables/${key}`)
      await loadAll()
    } catch (err) {
      console.error('Error deleting variable:', err)
      setError('Erro ao remover variável')
    } finally {
      setSaving(false)
    }
  }

  const copyUsage = (prefix, key) => {
    navigator.clipboard.writeText(`\${{${prefix}.${key}}}`)
  }

  const tabStyle = (tab) => ({
    flex: 1,
    padding: '0.6rem 1rem',
    backgroundColor: activeTab === tab ? 'var(--bg, #fff)' : 'transparent',
    color: activeTab === tab ? 'var(--text, #374151)' : 'var(--text-dim, #9CA3AF)',
    border: 'none',
    borderBottom: activeTab === tab ? '2px solid #7C3AED' : '2px solid transparent',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: activeTab === tab ? 600 : 400,
    transition: 'all 0.2s',
  })

  const renderItemList = ({ items, prefix, isMasked, editingKey, setEditingKey, editValue, setEditValue, handleUpdate, handleDelete }) => {
    const entries = Object.entries(items)
    if (entries.length === 0) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '1.5rem',
          color: '#9CA3AF',
          fontSize: '0.85rem',
          marginBottom: '1rem',
        }}>
          {prefix === 'secret' ? 'Nenhuma credencial cadastrada' : 'Nenhuma variável cadastrada'}
        </div>
      )
    }

    return (
      <div style={{ marginBottom: '1.5rem' }}>
        {entries.map(([key, value]) => (
          <div key={key} style={{
            padding: '0.75rem',
            backgroundColor: 'var(--bg-secondary, #F9FAFB)',
            borderRadius: '8px',
            marginBottom: '0.5rem',
            border: '1px solid var(--border, #E5E7EB)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  fontFamily: 'monospace',
                  color: 'var(--text, #374151)',
                }}>
                  {key}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-dim, #9CA3AF)',
                  fontFamily: 'monospace',
                  marginTop: '0.15rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {editingKey === key ? '' : value}
                </div>
              </div>

              {editingKey !== key && (
                <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0, marginLeft: '0.5rem' }}>
                  <button
                    onClick={() => copyUsage(prefix, key)}
                    title={`Copiar: \${{${prefix}.${key}}}`}
                    style={{
                      padding: '0.25rem 0.4rem',
                      background: 'none',
                      border: '1px solid var(--border, #D1D5DB)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      whiteSpace: 'nowrap',
                      color: 'var(--text, inherit)',
                    }}
                  >
                    Copiar
                  </button>
                  <button
                    onClick={() => {
                      setEditingKey(key)
                      setEditValue('')
                    }}
                    title="Editar valor"
                    style={{
                      padding: '0.25rem 0.4rem',
                      background: 'none',
                      border: '1px solid var(--border, #D1D5DB)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      whiteSpace: 'nowrap',
                      color: 'var(--text, inherit)',
                    }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(key)}
                    title="Remover"
                    disabled={saving}
                    style={{
                      padding: '0.25rem 0.4rem',
                      background: 'none',
                      border: '1px solid #FCA5A5',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      color: '#DC2626',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Remover
                  </button>
                </div>
              )}
            </div>

            {editingKey === key && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input
                  type={isMasked ? 'password' : 'text'}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Novo valor"
                  style={{
                    flex: 1,
                    padding: '0.4rem 0.6rem',
                    border: '1px solid var(--border, #D1D5DB)',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                    minWidth: 0,
                    backgroundColor: 'var(--input-bg, #fff)',
                    color: 'var(--text, #374151)',
                  }}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdate(key)
                    if (e.key === 'Escape') setEditingKey(null)
                  }}
                />
                <button
                  onClick={() => handleUpdate(key)}
                  disabled={saving}
                  style={{
                    padding: '0.4rem 0.6rem',
                    backgroundColor: '#7C3AED',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Salvar
                </button>
                <button
                  onClick={() => setEditingKey(null)}
                  style={{
                    padding: '0.4rem 0.6rem',
                    backgroundColor: 'var(--bg-hover, #E5E7EB)',
                    color: 'var(--text, #374151)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderAddForm = ({ isMasked, prefix, label, keyValue, setKeyValue, valueValue, setValueValue, handleAdd, keyPlaceholder, valuePlaceholder }) => (
    <div style={{
      padding: '1rem',
      backgroundColor: 'var(--bg-secondary, #F3F4F6)',
      borderRadius: '8px',
      border: '1px dashed var(--border, #D1D5DB)',
    }}>
      <div style={{
        fontSize: '0.85rem',
        fontWeight: 600,
        color: 'var(--text, #374151)',
        marginBottom: '0.75rem',
      }}>
        Adicionar {label}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
        <input
          type="text"
          value={keyValue}
          onChange={(e) => setKeyValue(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
          placeholder={keyPlaceholder}
          style={{
            padding: '0.5rem 0.75rem',
            border: '1px solid var(--border, #D1D5DB)',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontFamily: 'monospace',
            backgroundColor: 'var(--input-bg, #fff)',
            color: 'var(--text, #374151)',
          }}
        />
        <input
          type={isMasked ? 'password' : 'text'}
          value={valueValue}
          onChange={(e) => setValueValue(e.target.value)}
          placeholder={valuePlaceholder}
          style={{
            padding: '0.5rem 0.75rem',
            border: '1px solid var(--border, #D1D5DB)',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontFamily: 'monospace',
            backgroundColor: 'var(--input-bg, #fff)',
            color: 'var(--text, #374151)',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd()
          }}
        />
        <button
          onClick={handleAdd}
          disabled={saving || !keyValue.trim() || !valueValue.trim()}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: !keyValue.trim() || !valueValue.trim() ? '#D1D5DB' : '#7C3AED',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: !keyValue.trim() || !valueValue.trim() ? 'not-allowed' : 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          {saving ? 'Salvando...' : 'Adicionar'}
        </button>
      </div>

      {keyValue && (
        <div style={{
          marginTop: '0.5rem',
          fontSize: '0.75rem',
          color: 'var(--text-dim, #6B7280)',
        }}>
          Uso no fluxo: <code style={{
            background: 'var(--bg-hover, #E5E7EB)',
            padding: '0.1rem 0.3rem',
            borderRadius: '3px',
          }}>{`\${{${prefix}.${keyValue || 'NOME'}}}`}</code>
        </div>
      )}
    </div>
  )

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000,
    }}>
      <div style={{
        backgroundColor: 'var(--bg, #fff)',
        borderRadius: '12px',
        width: '600px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text, #111)' }}>Variáveis de Ambiente</h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-dim, #888)' }}>
              Gerencie variáveis e credenciais sensíveis do fluxo
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--text-dim, #999)',
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border, #eee)',
          margin: '0.75rem 1.5rem 0',
        }}>
          <button style={tabStyle('variables')} onClick={() => setActiveTab('variables')}>
            Variáveis de Ambiente
          </button>
          <button style={tabStyle('secrets')} onClick={() => setActiveTab('secrets')}>
            Credenciais (Secrets)
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '1.25rem 1.5rem',
          overflowY: 'auto',
          flex: 1,
        }}>
          {error && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              borderRadius: '6px',
              marginBottom: '1rem',
              fontSize: '0.85rem',
            }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim, #888)' }}>
              Carregando...
            </div>
          ) : activeTab === 'secrets' ? (
            <>
              <div style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: 'rgba(124, 58, 237, 0.08)',
                borderRadius: '6px',
                marginBottom: '1rem',
                fontSize: '0.78rem',
                color: 'var(--text-dim, #6B7280)',
                border: '1px solid rgba(124, 58, 237, 0.15)',
              }}>
                Valores sensíveis (tokens, senhas, API keys). Ficam mascarados após salvar. Use <code style={{ background: 'var(--bg-hover, #f0f0f0)', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>{'${{secret.NOME}}'}</code>
              </div>
              {renderItemList({
                items: secrets,
                prefix: 'secret',
                isMasked: true,
                editingKey: editingSecretKey,
                setEditingKey: setEditingSecretKey,
                editValue: editSecretValue,
                setEditValue: setEditSecretValue,
                handleUpdate: handleUpdateSecret,
                handleDelete: handleDeleteSecret,
              })}
              {renderAddForm({
                isMasked: true,
                prefix: 'secret',
                label: 'credencial',
                keyValue: newSecretKey,
                setKeyValue: setNewSecretKey,
                valueValue: newSecretValue,
                setValueValue: setNewSecretValue,
                handleAdd: handleAddSecret,
                keyPlaceholder: 'NOME_DA_CHAVE (ex: API_TOKEN)',
                valuePlaceholder: 'Valor sensível (token, senha...)',
              })}
            </>
          ) : (
            <>
              <div style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: 'rgba(34, 197, 94, 0.08)',
                borderRadius: '6px',
                marginBottom: '1rem',
                fontSize: '0.78rem',
                color: 'var(--text-dim, #6B7280)',
                border: '1px solid rgba(34, 197, 94, 0.15)',
              }}>
                Valores não sensíveis (URLs base, nomes de filas, configurações). Ficam visíveis. Use <code style={{ background: 'var(--bg-hover, #f0f0f0)', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>{'${{env.NOME}}'}</code>
              </div>
              {renderItemList({
                items: variables,
                prefix: 'env',
                isMasked: false,
                editingKey: editingVarKey,
                setEditingKey: setEditingVarKey,
                editValue: editVarValue,
                setEditValue: setEditVarValue,
                handleUpdate: handleUpdateVariable,
                handleDelete: handleDeleteVariable,
              })}
              {renderAddForm({
                isMasked: false,
                prefix: 'env',
                label: 'variável',
                keyValue: newVarKey,
                setKeyValue: setNewVarKey,
                valueValue: newVarValue,
                setValueValue: setNewVarValue,
                handleAdd: handleAddVariable,
                keyPlaceholder: 'NOME_DA_VARIAVEL (ex: BASE_URL)',
                valuePlaceholder: 'Valor (URL, configuração...)',
              })}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default SecretsPanel
