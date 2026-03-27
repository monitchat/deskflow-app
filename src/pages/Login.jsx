import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API_BASE_URL } from '../config/api'

const styles = {
  page: {
    display: 'flex',
    height: '100vh',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  leftPanel: {
    flex: 1,
    background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '3rem',
    position: 'relative',
    overflow: 'hidden',
  },
  leftOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at 30% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  leftContent: {
    position: 'relative',
    zIndex: 1,
    textAlign: 'center',
    maxWidth: '400px',
  },
  leftTitle: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#fff',
    marginBottom: '1rem',
    letterSpacing: '-0.02em',
    lineHeight: 1.1,
  },
  leftAccent: {
    background: 'linear-gradient(135deg, #818cf8, #6366f1)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  leftDescription: {
    fontSize: '1.05rem',
    color: '#94a3b8',
    lineHeight: 1.7,
  },
  rightPanel: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: '2rem',
  },
  formWrapper: {
    width: '100%',
    maxWidth: '400px',
  },
  logoContainer: {
    marginBottom: '2.5rem',
    textAlign: 'center',
  },
  logo: {
    maxWidth: '200px',
    height: 'auto',
  },
  subtitle: {
    fontSize: '0.95rem',
    color: '#64748b',
    marginTop: '0.75rem',
  },
  errorBox: {
    padding: '0.875rem 1rem',
    marginBottom: '1.5rem',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: '10px',
    fontSize: '0.875rem',
    borderLeft: '4px solid #dc2626',
  },
  fieldGroup: {
    marginBottom: '1.25rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.4rem',
    fontWeight: '600',
    color: '#334155',
    fontSize: '0.85rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    width: '100%',
    padding: '0.85rem 1rem',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '0.95rem',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
    outline: 'none',
    backgroundColor: '#fff',
    color: '#1e293b',
  },
  button: {
    width: '100%',
    padding: '0.95rem',
    background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
    letterSpacing: '0.02em',
    marginTop: '0.5rem',
  },
  buttonDisabled: {
    background: '#94a3b8',
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  spinner: {
    display: 'inline-block',
    width: '18px',
    height: '18px',
    border: '2.5px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite',
    verticalAlign: 'middle',
    marginRight: '0.5rem',
  },
}

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const decodeJWT = (token) => {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      return JSON.parse(jsonPayload)
    } catch (error) {
      console.error('Error decoding JWT:', error)
      return null
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      navigate('/', { replace: true })
    }
  }, [navigate])

  const [mfaRequired, setMfaRequired] = useState(false)
  const [mfaToken, setMfaToken] = useState('')
  const [mfaCode, setMfaCode] = useState('')

  const handleLoginSuccess = (access_token, auth_source, user) => {
    const userInfo = auth_source === 'local' && user
      ? user
      : decodeJWT(access_token)

    if (userInfo) {
      localStorage.setItem('token', access_token)
      localStorage.setItem('user_name', userInfo.name || '')
      localStorage.setItem('user_email', userInfo.email || '')
      localStorage.setItem('user_avatar', userInfo.avatar || '')
      localStorage.setItem('user_company_id', userInfo.company_id || '')
      localStorage.setItem('user_is_master', userInfo.is_master ? 'true' : 'false')
      localStorage.setItem('user_role', userInfo.role || userInfo.roles?.[0] || 'admin')
      localStorage.setItem('user_is_admin', (userInfo.is_admin || userInfo.is_master || userInfo.role === 'admin' || userInfo.roles?.includes('admin')) ? 'true' : 'false')
      localStorage.setItem('auth_source', auth_source || '')
      localStorage.setItem('deskflow-embedded', 'false')
    }
    navigate('/')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
        email,
        password
      })

      const data = response.data.data

      if (data.mfa_required) {
        setMfaRequired(true)
        setMfaToken(data.mfa_token)
        setLoading(false)
        return
      }

      if (data.access_token) {
        handleLoginSuccess(data.access_token, data.auth_source, data.user)
      } else {
        setError('Token não retornado pela API')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(err.response?.data?.error || 'Erro ao fazer login. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  const handleMfaSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/mfa/verify`, {
        mfa_token: mfaToken,
        code: mfaCode,
      })

      const data = response.data.data
      if (data.access_token) {
        handleLoginSuccess(data.access_token, data.auth_source)
      } else {
        setError('Token não retornado após MFA')
      }
    } catch (err) {
      console.error('MFA error:', err)
      setError(err.response?.data?.error || 'Código MFA inválido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .login-left-panel { display: none !important; }
          .login-right-panel { flex: 1 !important; }
        }
      `}</style>
      <div style={styles.page}>
        <div className="login-left-panel" style={styles.leftPanel}>
          <div style={styles.leftOverlay} />
          <div style={styles.leftContent}>
            <img
              src="https://monitchat.nyc3.cdn.digitaloceanspaces.com/logo/logo-vipdesk-full.png"
              alt="VipDesk Logo"
              style={{ maxWidth: '220px', height: 'auto', marginBottom: '2rem' }}
            />
            <h1 style={styles.leftTitle}>
              Construa fluxos<br />
              <span style={styles.leftAccent}>inteligentes</span>
            </h1>
            <p style={styles.leftDescription}>
              Crie automações visuais para seus chatbots com drag & drop.
              Simples, rápido e poderoso.
            </p>
          </div>
        </div>

        <div className="login-right-panel" style={styles.rightPanel}>
          <div style={styles.formWrapper}>
            <div style={styles.logoContainer}>
              <img
                src="https://monitchat.nyc3.cdn.digitaloceanspaces.com/logo/logo-vipdesk-mobile.png"
                alt="VipDesk Logo"
                style={styles.logo}
              />
              <p style={styles.subtitle}>Acesse sua conta DeskFlow</p>
            </div>

            {error && (
              <div style={styles.errorBox}>{error}</div>
            )}

            {mfaRequired ? (
              <form onSubmit={handleMfaSubmit}>
                <div style={{
                  padding: '1rem', marginBottom: '1.25rem', borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(129,140,248,0.05))',
                  border: '1px solid rgba(99,102,241,0.15)', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔐</div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', margin: '0 0 0.3rem' }}>
                    Verificacao em duas etapas
                  </p>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                    Digite o codigo do seu aplicativo autenticador
                  </p>
                </div>

                <div style={{ ...styles.fieldGroup, marginBottom: '1.75rem' }}>
                  <label style={styles.label}>Codigo MFA</label>
                  <input
                    type="text"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    disabled={loading}
                    autoFocus
                    maxLength={6}
                    style={{
                      ...styles.input,
                      textAlign: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      letterSpacing: '0.5rem',
                      fontFamily: 'monospace',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#6366f1'
                      e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0'
                      e.target.style.boxShadow = 'none'
                    }}
                    placeholder="000000"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || mfaCode.length < 6}
                  style={{
                    ...styles.button,
                    ...(loading ? styles.buttonDisabled : {}),
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.target.style.transform = 'translateY(-1px)'
                      e.target.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.5)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.target.style.transform = 'translateY(0)'
                      e.target.style.boxShadow = '0 4px 14px rgba(99, 102, 241, 0.4)'
                    }
                  }}
                >
                  {loading ? (
                    <><span style={styles.spinner} /> Verificando...</>
                  ) : (
                    'Verificar Codigo'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setMfaRequired(false); setMfaToken(''); setMfaCode(''); setError('') }}
                  style={{
                    marginTop: '0.75rem', width: '100%', padding: '0.6rem',
                    background: 'none', border: '1px solid #e2e8f0', borderRadius: '10px',
                    color: '#64748b', fontSize: '0.85rem', cursor: 'pointer',
                  }}
                >
                  Voltar ao login
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    style={styles.input}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#6366f1'
                      e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0'
                      e.target.style.boxShadow = 'none'
                    }}
                    placeholder="seu@email.com"
                  />
                </div>

                <div style={{ ...styles.fieldGroup, marginBottom: '1.75rem' }}>
                  <label style={styles.label}>Senha</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    style={styles.input}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#6366f1'
                      e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0'
                      e.target.style.boxShadow = 'none'
                    }}
                    placeholder="Digite sua senha"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...styles.button,
                    ...(loading ? styles.buttonDisabled : {}),
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.target.style.transform = 'translateY(-1px)'
                      e.target.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.5)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.target.style.transform = 'translateY(0)'
                      e.target.style.boxShadow = '0 4px 14px rgba(99, 102, 241, 0.4)'
                    }
                  }}
                >
                  {loading ? (
                    <><span style={styles.spinner} /> Entrando...</>
                  ) : (
                    'Entrar'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default Login
