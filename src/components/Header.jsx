import { useNavigate } from 'react-router-dom'

function Header() {
  const navigate = useNavigate()

  // Busca informações do usuário do localStorage
  const userName = localStorage.getItem('user_name') || 'Usuário'
  const userAvatar = localStorage.getItem('user_avatar') || ''

  // Pega apenas o primeiro nome
  const firstName = userName.split(' ')[0]

  const handleLogout = () => {
    // Remove token e informações do usuário
    localStorage.removeItem('token')
    localStorage.removeItem('user_name')
    localStorage.removeItem('user_email')
    localStorage.removeItem('user_avatar')
    localStorage.removeItem('user_company_id')
    navigate('/login')
  }

  return (
    <header style={{
      backgroundColor: '#fff',
      borderBottom: '1px solid #e0e0e0',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
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
            height: '45px',
            width: 'auto'
          }}
        />
        <span style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: '#2196F3'
        }}>
          DeskFlow
        </span>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        {userAvatar && (
          <img
            src={userAvatar}
            alt={firstName}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid #2196F3'
            }}
            onError={(e) => {
              // Se a imagem falhar ao carregar, substitui por iniciais
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        )}

        {/* Fallback para quando não há avatar ou falha ao carregar */}
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#2196F3',
          color: 'white',
          display: userAvatar ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '1rem'
        }}>
          {firstName.charAt(0).toUpperCase()}
        </div>

        <span style={{
          fontWeight: '600',
          color: '#333'
        }}>
          {firstName}
        </span>

        <button
          onClick={handleLogout}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.9rem',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#d32f2f'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#f44336'}
        >
          Sair
        </button>
      </div>
    </header>
  )
}

export default Header
