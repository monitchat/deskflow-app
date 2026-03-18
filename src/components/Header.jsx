import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'

function Header({ children }) {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const userName = localStorage.getItem('user_name') || 'Usuário'
  const userAvatar = localStorage.getItem('user_avatar') || ''
  const firstName = userName.split(' ')[0]
  const isEmbedded = localStorage.getItem('deskflow-embedded') === 'true'

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user_name')
    localStorage.removeItem('user_email')
    localStorage.removeItem('user_avatar')
    localStorage.removeItem('user_company_id')
    localStorage.removeItem('deskflow-embedded')
    navigate('/login')
  }

  return (
    <header style={{
      background: 'var(--header-bg)',
      padding: '0.5rem 1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: 'var(--header-shadow)',
      borderBottom: '1px solid var(--border)',
      transition: 'background 0.3s, box-shadow 0.3s',
      minHeight: '48px',
    }}>
      {/* Logo - esconde em modo embedded */}
      {!isEmbedded && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          flexShrink: 0,
        }} onClick={() => navigate('/')}>
          <img
            src="https://monitchat.nyc3.cdn.digitaloceanspaces.com/logo/logo-vipdesk-mobile.png"
            alt="VipDesk Logo"
            style={{
              height: '30px',
              width: 'auto',
            }}
          />
          <span style={{
            fontSize: '1rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #818cf8, #6366f1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.01em',
          }}>
            DeskFlow
          </span>
        </div>
      )}

      {/* Conteúdo central - children do FlowBuilder ou vazio */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {children}
      </div>

      {/* Controles à direita */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        flexShrink: 0,
      }}>
        <button
          onClick={() => window.open('/docs', '_blank')}
          title="Guia completo"
          style={{
            height: '30px',
            padding: '0 0.5rem',
            backgroundColor: 'transparent',
            color: 'var(--header-btn-text)',
            border: '1px solid var(--header-btn-border)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)'
            e.currentTarget.style.color = 'var(--accent)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--header-btn-border)'
            e.currentTarget.style.color = 'var(--header-btn-text)'
          }}
        >
          <span style={{ fontSize: '0.85rem' }}>📖</span>
          Guia
        </button>

        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          style={{
            width: '30px',
            height: '30px',
            padding: 0,
            backgroundColor: 'transparent',
            color: 'var(--header-btn-text)',
            border: '1px solid var(--header-btn-border)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)'
            e.currentTarget.style.color = 'var(--accent)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--header-btn-border)'
            e.currentTarget.style.color = 'var(--header-btn-text)'
          }}
        >
          {theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19'}
        </button>

        {/* Avatar, nome e logout - esconde em modo embedded */}
        {!isEmbedded && (
          <>
            {userAvatar && (
              <img
                src={userAvatar}
                alt={firstName}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #6366f1',
                }}
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
            )}

            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              color: 'white',
              display: userAvatar ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '0.8rem',
            }}>
              {firstName.charAt(0).toUpperCase()}
            </div>

            <span style={{
              fontWeight: '500',
              color: 'var(--header-text)',
              fontSize: '0.82rem',
            }}>
              {firstName}
            </span>

            <button
              onClick={handleLogout}
              style={{
                padding: '0.3rem 0.7rem',
                backgroundColor: 'transparent',
                color: 'var(--header-btn-text)',
                border: '1px solid var(--header-btn-border)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.75rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#dc2626'
                e.target.style.borderColor = '#dc2626'
                e.target.style.color = '#fff'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent'
                e.target.style.borderColor = 'var(--header-btn-border)'
                e.target.style.color = 'var(--header-btn-text)'
              }}
            >
              Sair
            </button>
          </>
        )}
      </div>
    </header>
  )
}

export default Header
