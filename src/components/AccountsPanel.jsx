import { useState, useEffect } from 'react'
import api from '../config/axios'

function AccountsPanel({ flowId, onClose }) {
  const [availableAccounts, setAvailableAccounts] = useState([])
  const [selectedAccounts, setSelectedAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [flowId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [accountsRes, flowRes] = await Promise.all([
        api.get('/api/v1/flows/accounts'),
        api.get(`/api/v1/flows/${flowId}`),
      ])

      if (accountsRes.data.success) {
        setAvailableAccounts(accountsRes.data.data || [])
      }

      if (flowRes.data.success) {
        setSelectedAccounts(flowRes.data.data.allowed_accounts || [])
      }
    } catch (err) {
      console.error('Error loading accounts:', err)
      setError('Erro ao carregar contas')
    } finally {
      setLoading(false)
    }
  }

  const toggleAccount = (accountNumber) => {
    setSelectedAccounts((prev) => {
      if (prev.includes(accountNumber)) {
        return prev.filter((a) => a !== accountNumber)
      }
      return [...prev, accountNumber]
    })
  }

  const selectAll = () => {
    setSelectedAccounts(availableAccounts.map((a) => a.account_number))
  }

  const deselectAll = () => {
    setSelectedAccounts([])
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      await api.put(`/api/v1/flows/${flowId}`, {
        allowed_accounts: selectedAccounts,
      })
      onClose()
    } catch (err) {
      console.error('Error saving accounts:', err)
      setError('Erro ao salvar contas')
    } finally {
      setSaving(false)
    }
  }

  const channelIcons = {
    whatsapp: '📱',
    facebook: '👤',
    instagram: '📷',
    webchat: '💬',
    telegram: '✈️',
  }

  const channelColors = {
    whatsapp: { bg: 'rgba(37, 211, 102, 0.1)', border: 'rgba(37, 211, 102, 0.3)', text: '#25D366' },
    facebook: { bg: 'rgba(24, 119, 242, 0.1)', border: 'rgba(24, 119, 242, 0.3)', text: '#1877F2' },
    instagram: { bg: 'rgba(225, 48, 108, 0.1)', border: 'rgba(225, 48, 108, 0.3)', text: '#E1306C' },
    webchat: { bg: 'rgba(99, 102, 241, 0.1)', border: 'rgba(99, 102, 241, 0.3)', text: '#6366f1' },
    telegram: { bg: 'rgba(0, 136, 204, 0.1)', border: 'rgba(0, 136, 204, 0.3)', text: '#0088CC' },
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
        width: '550px',
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
              Contas Permitidas
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-dim, #888)' }}>
              Selecione quais contas este fluxo pode responder
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

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim, #888)' }}>
              Carregando contas...
            </div>
          ) : (
            <>
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
                Se nenhuma conta for selecionada, o fluxo não responde a nenhuma conta.
              </div>

              {/* Select/Deselect all */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1rem',
              }}>
                <button
                  onClick={selectAll}
                  style={{
                    padding: '0.35rem 0.75rem',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border, #D1D5DB)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted, #6B7280)',
                  }}
                >
                  Selecionar todas
                </button>
                <button
                  onClick={deselectAll}
                  style={{
                    padding: '0.35rem 0.75rem',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border, #D1D5DB)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted, #6B7280)',
                  }}
                >
                  Desmarcar todas
                </button>
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '0.78rem',
                  color: 'var(--text-dim, #9CA3AF)',
                  alignSelf: 'center',
                }}>
                  {selectedAccounts.length} selecionada{selectedAccounts.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Account list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {availableAccounts.map((account) => {
                  const isSelected = selectedAccounts.includes(account.account_number)
                  const colors = channelColors[account.channel] || channelColors.webchat
                  const icon = channelIcons[account.channel] || '📡'

                  return (
                    <div
                      key={account.account_number}
                      onClick={() => toggleAccount(account.account_number)}
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: isSelected ? colors.bg : 'var(--bg-secondary, #F9FAFB)',
                        borderRadius: '8px',
                        border: `1px solid ${isSelected ? colors.border : 'var(--border, #E5E7EB)'}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        transition: 'all 0.15s',
                      }}
                    >
                      {/* Checkbox */}
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        border: `2px solid ${isSelected ? colors.text : 'var(--border, #D1D5DB)'}`,
                        backgroundColor: isSelected ? colors.text : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.15s',
                      }}>
                        {isSelected && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>

                      {/* Icon */}
                      <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{icon}</span>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          color: 'var(--text, #374151)',
                        }}>
                          {account.name || account.account_number}
                        </div>
                        {account.name && (
                          <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-dim, #9CA3AF)',
                            fontFamily: 'monospace',
                            marginTop: '0.1rem',
                          }}>
                            {account.account_number}
                          </div>
                        )}
                      </div>

                      {/* Channel badge */}
                      <span style={{
                        padding: '0.15rem 0.5rem',
                        backgroundColor: colors.bg,
                        color: colors.text,
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        flexShrink: 0,
                      }}>
                        {account.channel}
                      </span>
                    </div>
                  )
                })}

                {availableAccounts.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: 'var(--text-dim, #9CA3AF)',
                    fontSize: '0.85rem',
                  }}>
                    Nenhuma conta encontrada
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border, #eee)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.5rem',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--bg-hover, #E5E7EB)',
              color: 'var(--text, #374151)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#7C3AED',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AccountsPanel
