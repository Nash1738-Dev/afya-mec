import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { isLoggedIn } from '../../utils/auth.js'

export default function AuthGuard({ children }) {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!isLoggedIn() && location.pathname !== '/login') {
      navigate('/login')
    }
  }, [location.pathname])

  if (!isLoggedIn() && location.pathname !== '/login') {
    return null
  }

  return children
}