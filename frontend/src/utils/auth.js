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

// Offline-capable admin credentials (fallback when backend unreachable)
const OFFLINE_USERS = [
  { name: 'Admin', pin: '1234', role: 'admin', id: 'offline-admin' },
  // Add more known providers here if needed
]

export const login = async (name, pin) => {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), pin }),
      // Fail fast if no connection — don't hang for 30s
      signal: AbortSignal.timeout(5000),
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

    // ✅ Cache credentials for offline use (pin stored as hash-equivalent)
    const cachedUsers = JSON.parse(localStorage.getItem('offline_users') || '{}')
    cachedUsers[name.trim().toLowerCase()] = { pin, user: data.user }
    localStorage.setItem('offline_users', JSON.stringify(cachedUsers))

    // Auto-load this user's facility settings
    // migrateLegacySettings migrates old shared data to this user if they have none
    const { migrateLegacySettings, getFacilitySettings, saveFacilitySettings } = await import('./facilitySettings.js')
    const username = data.user.name
    migrateLegacySettings(username)

    // If user registered with facility/county data, pre-populate settings
    const existing = getFacilitySettings(username.toLowerCase().replace(/\s+/g, '_'))
    if (!existing.facility_name && data.user.facility) {
      saveFacilitySettings({
        ...existing,
        facility_name: data.user.facility || '',
        county: data.user.county || '',
        sub_county: data.user.sub_county || '',
        provider_name: data.user.name || '',
        provider_cadre: data.user.cadre || '',
      }, username.toLowerCase().replace(/\s+/g, '_'))
    }

    resetInactivityTimer()
    return { success: true, user: data.user }
    
  } catch (err) {
    // ── Offline fallback ──────────────────────────────────────────
    // 1. Check cached real users first
    const cachedUsers = JSON.parse(localStorage.getItem('offline_users') || '{}')
    const cached = cachedUsers[name.trim().toLowerCase()]

    if (cached && cached.pin === pin) {
      const offlineUser = { 
        ...cached.user, 
        offline: true,
        loginTime: new Date().toISOString(),
        expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString()
      }
      localStorage.setItem(USER_KEY, JSON.stringify(offlineUser))
      localStorage.removeItem(AUTH_KEY) // no real token
      resetInactivityTimer()
      return { success: true, offline: true }
    }

    // 2. Fall back to hardcoded emergency users (Admin only)
    const match = OFFLINE_USERS.find(
      u => u.name.toLowerCase() === name.trim().toLowerCase() && u.pin === pin
    )
    
    if (match) {
      const offlineUser = { 
        ...match, 
        offline: true,
        loginTime: new Date().toISOString(),
        expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString()
      }
      localStorage.setItem(USER_KEY, JSON.stringify(offlineUser))
      localStorage.removeItem(AUTH_KEY) // no real token
      resetInactivityTimer()
      return { success: true, offline: true }
    }

    return {
      success: false,
      error: '📡 No internet. If you have logged in before, your credentials will work offline.'
    }
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
  // Ensure token-less offline users aren't rejected
  if (user && user.offline) return true 
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