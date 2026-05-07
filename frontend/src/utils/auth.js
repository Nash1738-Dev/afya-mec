const AUTH_KEY = 'afyamec_auth_token'
const USER_KEY = 'afyamec_current_user'

// Session timeout — 8 hours (matches backend token)
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000
// Inactivity timeout — 30 minutes
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000

let inactivityTimer = null

export const resetInactivityTimer = () => {
  clearTimeout(inactivityTimer)
  inactivityTimer = setTimeout(() => {
    logout()
    window.location.href = '/login?reason=timeout'
  }, INACTIVITY_TIMEOUT_MS)
}

// Start inactivity tracking
if (typeof window !== 'undefined') {
  ['mousedown', 'keydown', 'touchstart', 'scroll'].forEach(event => {
    window.addEventListener(event, resetInactivityTimer, { passive: true })
  })
}

export const login = async (name, pin) => {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), pin })
    })
    const data = await res.json()

    if (!res.ok) {
      return { success: false, error: data.detail || 'Login failed' }
    }

    // Store JWT token
    localStorage.setItem(AUTH_KEY, data.access_token)
    localStorage.setItem(USER_KEY, JSON.stringify({
      ...data.user,
      loginTime: new Date().toISOString(),
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString()
    }))

    resetInactivityTimer()
    return { success: true, user: data.user }
  } catch (e) {
    return { success: false, error: 'Cannot connect to server — check backend is running' }
  }
}

export const register = async (data) => {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const result = await res.json()
    if (!res.ok) {
      return { success: false, error: result.detail || 'Registration failed' }
    }
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Cannot connect to server' }
  }
}

export const logout = () => {
  clearTimeout(inactivityTimer)
  localStorage.removeItem(AUTH_KEY)
  localStorage.removeItem(USER_KEY)
}

export const getToken = () => {
  return localStorage.getItem(AUTH_KEY)
}

export const getCurrentUser = () => {
  try {
    const stored = localStorage.getItem(USER_KEY)
    if (!stored) return null
    const user = JSON.parse(stored)
    // Check session expiry
    if (new Date() > new Date(user.expiresAt)) {
      logout()
      return null
    }
    return user
  } catch {
    return null
  }
}

export const isLoggedIn = () => {
  const token = getToken()
  const user = getCurrentUser()
  return !!(token && user)
}

export const isAdmin = () => {
  return getCurrentUser()?.role === 'admin'
}

export const getPendingUsers = async () => {
  try {
    const res = await fetch('/api/auth/pending', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

export const approveUser = async (userId, action = 'approve') => {
  try {
    const res = await fetch('/api/auth/approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ user_id: userId, action })
    })
    return res.ok
  } catch {
    return false
  }
}

export const rejectUser = async (userId) => {
  return approveUser(userId, 'reject')
}

export const changePin = async (oldPin, newPin) => {
  try {
    const res = await fetch('/api/auth/change-pin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ old_pin: oldPin, new_pin: newPin })
    })
    const data = await res.json()
    if (!res.ok) return { success: false, error: data.detail }
    return { success: true }
  } catch {
    return { success: false, error: 'Connection error' }
  }
}

export const getUsers = async () => {
  try {
    const res = await fetch('/api/auth/users', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}