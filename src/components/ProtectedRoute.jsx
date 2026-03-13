import { Navigate, useSearchParams } from 'react-router-dom'

function ProtectedRoute({ children }) {
  const [searchParams] = useSearchParams()
  const tokenFromUrl = searchParams.get('token')

  // Se veio token pela URL (ex: aberto pelo app01.monitchat.com), salva no localStorage
  if (tokenFromUrl) {
    localStorage.setItem('token', tokenFromUrl)

    // Decodifica JWT para extrair info do usuário
    try {
      const base64Url = tokenFromUrl.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      const userInfo = JSON.parse(jsonPayload)
      localStorage.setItem('user_name', userInfo.name || '')
      localStorage.setItem('user_email', userInfo.email || '')
      localStorage.setItem('user_avatar', userInfo.avatar || '')
      localStorage.setItem('user_company_id', userInfo.company_id || '')
    } catch (e) {
      console.error('Error decoding JWT from URL:', e)
    }
  }

  const token = localStorage.getItem('token')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
