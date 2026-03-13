import { useNavigate } from 'react-router-dom'

function Header() {
  const navigate = useNavigate()
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
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '0.75rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
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
          color: '#cbd5e1',
          fontSize: '0.9rem',
        }}>
          {firstName}
        </span>

        <button
          onClick={handleLogout}
          style={{
            padding: '0.4rem 0.9rem',
            backgroundColor: 'transparent',
            color: '#94a3b8',
            border: '1px solid #334155',
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
            e.target.style.borderColor = '#334155'
            e.target.style.color = '#94a3b8'
          }}
        >
          Sair
        </button>
      </div>
    </header>
  )
}

export default Header
