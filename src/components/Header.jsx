import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'

function Header() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const userName = localStorage.getItem('user_name') || 'Usuário'
  const userAvatar = localStorage.getItem('user_avatar') || ''
  const firstName = userName.split(' ')[0]

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user_name')
    localStorage.removeItem('user_email')
    localStorage.removeItem('user_avatar')
    localStorage.removeItem('user_company_id')
    navigate('/login')
  }

  return (
    <header style={{
      background: 'var(--header-bg)',
      padding: '0.75rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: 'var(--header-shadow)',
      borderBottom: '1px solid var(--border)',
      transition: 'background 0.3s, box-shadow 0.3s',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        cursor: 'pointer'
      }} onClick={() => navigate('/')}>
        <img
          src="https://monitchat.nyc3.cdn.digitaloceanspaces.com/logo/logo-vipdesk-mobile.png"
          alt="VipDesk Logo"
          style={{
            height: '38px',
            width: 'auto',
          }}
        />
        <span style={{
          fontSize: '1.2rem',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #818cf8, #6366f1)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.01em',
        }}>
          DeskFlow
        </span>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          style={{
            width: '34px',
            height: '34px',
            padding: 0,
            backgroundColor: 'transparent',
            color: 'var(--header-btn-text)',
            border: '1px solid var(--header-btn-border)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
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

        {userAvatar && (
          <img
            src={userAvatar}
            alt={firstName}
            style={{
              width: '36px',
              height: '36px',
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
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #818cf8)',
          color: 'white',
          display: userAvatar ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '0.9rem',
        }}>
          {firstName.charAt(0).toUpperCase()}
        </div>

        <span style={{
          fontWeight: '500',
          color: 'var(--header-text)',
          fontSize: '0.9rem',
        }}>
          {firstName}
        </span>

        <button
          onClick={handleLogout}
          style={{
            padding: '0.4rem 0.9rem',
            backgroundColor: 'transparent',
            color: 'var(--header-btn-text)',
            border: '1px solid var(--header-btn-border)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '0.8rem',
            transition: 'all 0.2s',
            marginLeft: '0.25rem',
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
      </div>
    </header>
  )
}

export default Header
