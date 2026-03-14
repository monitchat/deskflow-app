import { useState, useEffect } from 'react'
import api from '../config/axios'

function SecretsPanel({ flowId, onClose }) {
  const [secrets, setSecrets] = useState({}) // { key: maskedValue }
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [editingKey, setEditingKey] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadSecrets()
  }, [flowId])

  const loadSecrets = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/api/v1/flows/${flowId}/secrets`)
      if (response.data.success) {
        setSecrets(response.data.data.secrets || {})
      }
    } catch (err) {
      console.error('Error loading secrets:', err)
      setError('Erro ao carregar credenciais')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    const key = newKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_')
    if (!key || !newValue.trim()) return

    try {
      setSaving(true)
      setError(null)
      await api.put(`/api/v1/flows/${flowId}/secrets`, {
        secrets: { [key]: newValue.trim() }
      })
      setNewKey('')
      setNewValue('')
      await loadSecrets()
    } catch (err) {
      console.error('Error saving secret:', err)
      setError('Erro ao salvar credencial')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (key) => {
    if (!editValue.trim()) return

    try {
      setSaving(true)
      setError(null)
      await api.put(`/api/v1/flows/${flowId}/secrets`, {
        secrets: { [key]: editValue.trim() }
      })
      setEditingKey(null)
      setEditValue('')
      await loadSecrets()
    } catch (err) {
      console.error('Error updating secret:', err)
      setError('Erro ao atualizar credencial')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (key) => {
    if (!window.confirm(`Remover a credencial "${key}"?`)) return

    try {
      setSaving(true)
      setError(null)
      await api.delete(`/api/v1/flows/${flowId}/secrets/${key}`)
      await loadSecrets()
    } catch (err) {
      console.error('Error deleting secret:', err)
      setError('Erro ao remover credencial')
    } finally {
      setSaving(false)
    }
  }

  const copyUsage = (key) => {
    navigator.clipboard.writeText(`\${{secret.${key}}}`)
  }

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
        backgroundColor: '#fff',
        borderRadius: '12px',
        width: '600px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Credenciais do Fluxo</h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#888' }}>
              Use <code style={{ background: '#f0f0f0', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>{'${{secret.NOME}}'}</code> nos campos do fluxo para referenciar
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#999',
              lineHeight: 1,
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
            <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
              Carregando...
            </div>
          ) : (
            <>
              {/* Lista de segredos existentes */}
              {Object.keys(secrets).length > 0 ? (
                <div style={{ marginBottom: '1.5rem' }}>
                  {Object.entries(secrets).map(([key, maskedValue]) => (
                    <div key={key} style={{
                      padding: '0.75rem',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '8px',
                      marginBottom: '0.5rem',
                      border: '1px solid #E5E7EB',
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
                            color: '#374151',
                          }}>
                            {key}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#9CA3AF',
                            fontFamily: 'monospace',
                            marginTop: '0.15rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {editingKey === key ? '' : maskedValue}
                          </div>
                        </div>

                        {editingKey !== key && (
                          <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0, marginLeft: '0.5rem' }}>
                            <button
                              onClick={() => copyUsage(key)}
                              title={`Copiar: \${{secret.${key}}}`}
                              style={{
                                padding: '0.25rem 0.4rem',
                                background: 'none',
                                border: '1px solid #D1D5DB',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                                whiteSpace: 'nowrap',
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
                                border: '1px solid #D1D5DB',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                                whiteSpace: 'nowrap',
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
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder="Novo valor"
                            style={{
                              flex: 1,
                              padding: '0.4rem 0.6rem',
                              border: '1px solid #D1D5DB',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              fontFamily: 'monospace',
                              minWidth: 0,
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
                              backgroundColor: '#E5E7EB',
                              color: '#374151',
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
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '1.5rem',
                  color: '#9CA3AF',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                }}>
                  Nenhuma credencial cadastrada
                </div>
              )}

              {/* Adicionar nova credencial */}
              <div style={{
                padding: '1rem',
                backgroundColor: '#F3F4F6',
                borderRadius: '8px',
                border: '1px dashed #D1D5DB',
              }}>
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.75rem',
                }}>
                  Adicionar credencial
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                  <input
                    type="text"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
                    placeholder="NOME_DA_CHAVE (ex: SIENGE_AUTH_TOKEN)"
                    style={{
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                    }}
                  />
                  <input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="Valor (token, api key, senha...)"
                    style={{
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAdd()
                    }}
                  />
                  <button
                    onClick={handleAdd}
                    disabled={saving || !newKey.trim() || !newValue.trim()}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: !newKey.trim() || !newValue.trim() ? '#D1D5DB' : '#7C3AED',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: !newKey.trim() || !newValue.trim() ? 'not-allowed' : 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}
                  >
                    {saving ? 'Salvando...' : 'Adicionar'}
                  </button>
                </div>

                {newKey && (
                  <div style={{
                    marginTop: '0.5rem',
                    fontSize: '0.75rem',
                    color: '#6B7280',
                  }}>
                    Uso no fluxo: <code style={{
                      background: '#E5E7EB',
                      padding: '0.1rem 0.3rem',
                      borderRadius: '3px',
                    }}>{`\${{secret.${newKey || 'NOME'}}}`}</code>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default SecretsPanel
