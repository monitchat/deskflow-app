import { useState, useEffect } from 'react'
import api from '../config/axios'

function UsersPanel({ onClose }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formRole, setFormRole] = useState('user')
  const [filterCompanyId, setFilterCompanyId] = useState('')
  const isMaster = localStorage.getItem('user_is_master') === 'true'

  useEffect(() => {
    loadUsers()
  }, [filterCompanyId])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = isMaster && filterCompanyId ? `?company_id=${filterCompanyId}` : ''
      const res = await api.get(`/api/v1/auth/users${params}`)
      if (res.data.success) {
        setUsers(res.data.data || [])
      }
    } catch (err) {
      console.error('Error loading users:', err)
      setError('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormName('')
    setFormEmail('')
    setFormPassword('')
    setFormRole('user')
    setEditingUser(null)
    setShowForm(false)
  }

  const handleCreate = async () => {
    if (!formName.trim() || !formEmail.trim() || !formPassword) return
    try {
      setSaving(true)
      setError(null)
      await api.post('/api/v1/auth/users', {
        name: formName.trim(),
        email: formEmail.trim(),
        password: formPassword,
        role: formRole,
      })
      resetForm()
      await loadUsers()
    } catch (err) {
      console.error('Error creating user:', err)
      setError(err.response?.data?.error || 'Erro ao criar usuário')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingUser) return
    try {
      setSaving(true)
      setError(null)
      const payload = {
        name: formName.trim() || undefined,
        email: formEmail.trim() || undefined,
        role: formRole,
      }
      if (formPassword) {
        payload.password = formPassword
      }
      await api.put(`/api/v1/auth/users/${editingUser.id}`, payload)
      resetForm()
      await loadUsers()
    } catch (err) {
      console.error('Error updating user:', err)
      setError(err.response?.data?.error || 'Erro ao atualizar usuário')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (user) => {
    try {
      setSaving(true)
      await api.put(`/api/v1/auth/users/${user.id}`, {
        is_active: !user.is_active,
      })
      await loadUsers()
    } catch (err) {
      console.error('Error toggling user:', err)
      setError('Erro ao alterar status')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (userId) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return
    try {
      setSaving(true)
      await api.delete(`/api/v1/auth/users/${userId}`)
      await loadUsers()
    } catch (err) {
      console.error('Error deleting user:', err)
      setError('Erro ao excluir usuário')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (user) => {
    setEditingUser(user)
    setFormName(user.name)
    setFormEmail(user.email)
    setFormPassword('')
    setFormRole(user.role)
    setShowForm(true)
  }

  const inputStyle = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    border: '1px solid var(--border, #D1D5DB)',
    borderRadius: '6px',
    fontSize: '0.85rem',
    backgroundColor: 'var(--input-bg, #fff)',
    color: 'var(--text, #374151)',
    boxSizing: 'border-box',
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
        width: '650px',
        maxHeight: '85vh',
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
              Usuários
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-dim, #888)' }}>
              Gerencie usuários locais do Flow Builder
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
              Carregando...
            </div>
          ) : (
            <>
              {/* Company filter for master */}
              {isMaster && (
                <div style={{ marginBottom: '1rem' }}>
                  <select
                    value={filterCompanyId}
                    onChange={(e) => setFilterCompanyId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid var(--border, #D1D5DB)',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      backgroundColor: 'var(--input-bg, #fff)',
                      color: 'var(--text, #374151)',
                    }}
                  >
                    <option value="">Todas as empresas</option>
                    {[...new Set(users.map(u => u.company_id).filter(Boolean))].sort((a, b) => a - b).map((cid) => (
                      <option key={cid} value={cid}>Empresa {cid}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* User list */}
              <div style={{ marginBottom: '1.5rem' }}>
                {users.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '1.5rem',
                    color: '#9CA3AF',
                    fontSize: '0.85rem',
                  }}>
                    Nenhum usuário local criado
                  </div>
                ) : (
                  users.map((u) => (
                    <div key={u.id} style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--bg-secondary, #F9FAFB)',
                      borderRadius: '8px',
                      marginBottom: '0.5rem',
                      border: '1px solid var(--border, #E5E7EB)',
                      opacity: u.is_active ? 1 : 0.5,
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
                              {u.name}
                            </span>
                            <span style={{
                              padding: '0.1rem 0.4rem',
                              borderRadius: '10px',
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              backgroundColor: u.role === 'admin'
                                ? 'rgba(124, 58, 237, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                              color: u.role === 'admin' ? '#7C3AED' : '#6366f1',
                            }}>
                              {u.role}
                            </span>
                            {u.is_master && (
                              <span style={{
                                padding: '0.1rem 0.4rem',
                                borderRadius: '10px',
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                                color: '#CA8A04',
                              }}>
                                Master
                              </span>
                            )}
                            {!u.is_active && (
                              <span style={{
                                padding: '0.1rem 0.4rem',
                                borderRadius: '10px',
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                                color: '#DC2626',
                              }}>
                                Inativo
                              </span>
                            )}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-dim, #9CA3AF)',
                            marginTop: '0.15rem',
                          }}>
                            {u.email}
                          </div>
                          <div style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-dim, #9CA3AF)',
                            marginTop: '0.15rem',
                          }}>
                            {isMaster && u.company_id && `Empresa ${u.company_id} \u00B7 `}
                            Criado em {new Date(u.created_at).toLocaleDateString()}
                            {u.last_login_at && ` \u00B7 Ultimo login: ${new Date(u.last_login_at).toLocaleDateString()}`}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0, marginLeft: '0.5rem' }}>
                          <button
                            onClick={() => startEdit(u)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              background: 'none',
                              border: '1px solid var(--border, #D1D5DB)',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.7rem',
                              color: 'var(--text, inherit)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleToggleActive(u)}
                            disabled={saving}
                            style={{
                              padding: '0.25rem 0.5rem',
                              background: 'none',
                              border: `1px solid ${u.is_active ? '#FBBF24' : '#22c55e'}`,
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.7rem',
                              color: u.is_active ? '#D97706' : '#16a34a',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {u.is_active ? 'Desativar' : 'Ativar'}
                          </button>
                          <button
                            onClick={() => handleDelete(u.id)}
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

              {/* Create/Edit form */}
              {showForm ? (
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg-secondary, #F3F4F6)',
                  borderRadius: '8px',
                  border: '1px solid var(--border, #D1D5DB)',
                }}>
                  <div style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--text, #374151)',
                    marginBottom: '0.75rem',
                  }}>
                    {editingUser ? `Editar: ${editingUser.name}` : 'Novo Usuário'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Nome"
                      style={inputStyle}
                    />
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="Email"
                      style={inputStyle}
                    />
                    <input
                      type="password"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder={editingUser ? 'Nova senha (deixe vazio para manter)' : 'Senha (min. 6 caracteres)'}
                      style={inputStyle}
                    />
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="user">Usuário</option>
                      <option value="admin">Administrador</option>
                    </select>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <button
                        onClick={editingUser ? handleUpdate : handleCreate}
                        disabled={saving || !formName.trim() || !formEmail.trim() || (!editingUser && !formPassword)}
                        style={{
                          flex: 1,
                          padding: '0.5rem 1rem',
                          backgroundColor: '#7C3AED',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                        }}
                      >
                        {saving ? 'Salvando...' : editingUser ? 'Atualizar' : 'Criar'}
                      </button>
                      <button
                        onClick={resetForm}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: 'var(--bg-hover, #E5E7EB)',
                          color: 'var(--text, #374151)',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowForm(true)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: 'transparent',
                    border: '1px dashed var(--border, #D1D5DB)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    color: 'var(--text-muted, #6B7280)',
                    fontWeight: 500,
                  }}
                >
                  + Novo Usuário
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default UsersPanel
