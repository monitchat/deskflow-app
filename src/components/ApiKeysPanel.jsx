import { useState, useEffect } from 'react'
import api from '../config/axios'

function ApiKeysPanel({ onClose }) {
  const [keys, setKeys] = useState([])
  const [newKeyName, setNewKeyName] = useState('')
  const [createdKey, setCreatedKey] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadKeys()
  }, [])

  const loadKeys = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('/api/v1/flows/api-keys')
      if (res.data.success) {
        setKeys(res.data.data || [])
      }
    } catch (err) {
      console.error('Error loading API keys:', err)
      setError('Erro ao carregar API keys')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    const name = newKeyName.trim()
    if (!name) return
    try {
      setSaving(true)
      setError(null)
      const res = await api.post('/api/v1/flows/api-keys', { name })
      if (res.data.success) {
        setCreatedKey(res.data.data.key)
        setNewKeyName('')
        await loadKeys()
      }
    } catch (err) {
      console.error('Error creating API key:', err)
      setError('Erro ao criar API key')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (keyId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta API key? Qualquer integração usando esta key irá parar de funcionar.')) return
    try {
      setSaving(true)
      setError(null)
      await api.delete(`/api/v1/flows/api-keys/${keyId}`)
      await loadKeys()
    } catch (err) {
      console.error('Error deleting API key:', err)
      setError('Erro ao excluir API key')
    } finally {
      setSaving(false)
    }
  }

  const handleRevoke = async (keyId) => {
    if (!window.confirm('Revogar esta API key? Ela não poderá mais ser usada.')) return
    try {
      setSaving(true)
      setError(null)
      await api.put(`/api/v1/flows/api-keys/${keyId}/revoke`)
      await loadKeys()
    } catch (err) {
      console.error('Error revoking API key:', err)
      setError('Erro ao revogar API key')
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border, #eee)',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text, #111)' }}>
              API Keys
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-dim, #888)' }}>
              Gerencie chaves de acesso para integrações externas
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

          {/* Created key alert */}
          {createdKey && (
            <div style={{
              padding: '1rem',
              backgroundColor: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '8px',
              marginBottom: '1rem',
            }}>
              <div style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#16a34a',
                marginBottom: '0.5rem',
              }}>
                API Key criada com sucesso!
              </div>
              <div style={{
                fontSize: '0.78rem',
                color: 'var(--text-dim, #6B7280)',
                marginBottom: '0.5rem',
              }}>
                Copie agora. Esta chave não será exibida novamente.
              </div>
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
              }}>
                <code style={{
                  flex: 1,
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'var(--bg-secondary, #F9FAFB)',
                  border: '1px solid var(--border, #E5E7EB)',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                  color: 'var(--text, #374151)',
                }}>
                  {createdKey}
                </code>
                <button
                  onClick={() => copyToClipboard(createdKey)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: copied ? '#16a34a' : '#7C3AED',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    transition: 'background-color 0.2s',
                  }}
                >
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <button
                onClick={() => setCreatedKey(null)}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'var(--text-dim, #9CA3AF)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                }}
              >
                Fechar aviso
              </button>
            </div>
          )}

          {/* Info box */}
          <div style={{
            padding: '0.5rem 0.75rem',
            backgroundColor: 'rgba(99, 102, 241, 0.08)',
            borderRadius: '6px',
            marginBottom: '1rem',
            fontSize: '0.78rem',
            color: 'var(--text-dim, #6B7280)',
            border: '1px solid rgba(99, 102, 241, 0.15)',
          }}>
            Use API keys para permitir que sistemas externos (como o MonitChat) consultem seus fluxos.
            Header: <code style={{ background: 'var(--bg-hover, #f0f0f0)', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>X-API-Key: sua_chave</code>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim, #888)' }}>
              Carregando...
            </div>
          ) : (
            <>
              {/* Existing keys */}
              <div style={{ marginBottom: '1.5rem' }}>
                {keys.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '1.5rem',
                    color: '#9CA3AF',
                    fontSize: '0.85rem',
                  }}>
                    Nenhuma API key criada
                  </div>
                ) : (
                  keys.map((k) => (
                    <div key={k.id} style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--bg-secondary, #F9FAFB)',
                      borderRadius: '8px',
                      marginBottom: '0.5rem',
                      border: `1px solid ${k.is_active ? 'var(--border, #E5E7EB)' : '#FCA5A5'}`,
                      opacity: k.is_active ? 1 : 0.6,
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}>
                            <span style={{
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              color: 'var(--text, #374151)',
                            }}>
                              {k.name}
                            </span>
                            <span style={{
                              padding: '0.1rem 0.4rem',
                              borderRadius: '10px',
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              backgroundColor: k.is_active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                              color: k.is_active ? '#16a34a' : '#DC2626',
                            }}>
                              {k.is_active ? 'Ativa' : 'Revogada'}
                            </span>
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-dim, #9CA3AF)',
                            fontFamily: 'monospace',
                            marginTop: '0.15rem',
                          }}>
                            {k.key_preview}
                          </div>
                          <div style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-dim, #9CA3AF)',
                            marginTop: '0.25rem',
                          }}>
                            Criada em {new Date(k.created_at).toLocaleDateString()}
                            {k.created_by && ` por ${k.created_by}`}
                            {k.last_used_at && ` \u00B7 Usado em ${new Date(k.last_used_at).toLocaleDateString()}`}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0, marginLeft: '0.5rem' }}>
                          {k.is_active && (
                            <button
                              onClick={() => handleRevoke(k.id)}
                              disabled={saving}
                              style={{
                                padding: '0.25rem 0.5rem',
                                background: 'none',
                                border: '1px solid #FBBF24',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                                color: '#D97706',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Revogar
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(k.id)}
                            disabled={saving}
                            style={{
                              padding: '0.25rem 0.5rem',
                              background: 'none',
                              border: '1px solid #FCA5A5',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.7rem',
                              color: '#DC2626',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Create new key */}
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
                  Criar nova API Key
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Nome da key (ex: MonitChat Produção)"
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.75rem',
                      border: '1px solid var(--border, #D1D5DB)',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      backgroundColor: 'var(--input-bg, #fff)',
                      color: 'var(--text, #374151)',
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreate()
                    }}
                  />
                  <button
                    onClick={handleCreate}
                    disabled={saving || !newKeyName.trim()}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: !newKeyName.trim() ? '#D1D5DB' : '#7C3AED',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: !newKeyName.trim() ? 'not-allowed' : 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {saving ? 'Criando...' : 'Criar'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ApiKeysPanel
