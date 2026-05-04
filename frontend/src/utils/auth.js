const AUTH_KEY = 'digital_mec_auth'
const USERS_KEY = 'digital_mec_users'
const PENDING_KEY = 'digital_mec_pending_users'

const DEFAULT_USERS = [
  {
    id: '1',
    name: 'Admin',
    pin: '1234',
    role: 'admin',
    status: 'approved',
    facility: '',
    sub_county: '',
    cadre: '',
    created_at: new Date().toISOString(),
  }
]

export const getUsers = () => {
  try {
    const stored = localStorage.getItem(USERS_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return DEFAULT_USERS
}

export const saveUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export const getPendingUsers = () => {
  try {
    const stored = localStorage.getItem(PENDING_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return []
}

export const savePendingUsers = (pending) => {
  localStorage.setItem(PENDING_KEY, JSON.stringify(pending))
}

export const registerUser = (data) => {
  const pending = getPendingUsers()
  const users = getUsers()

  // Check name not already taken
  const allNames = [...users, ...pending].map(u => u.name.toLowerCase())
  if (allNames.includes(data.name.toLowerCase())) {
    return { success: false, error: 'A user with this name already exists' }
  }

  const newUser = {
    id: Date.now().toString(),
    name: data.name.trim(),
    pin: data.pin,
    role: 'provider',
    status: 'pending',
    facility: data.facility || '',
    sub_county: data.sub_county || '',
    county: data.county || '',
    cadre: data.cadre || '',
    phone: data.phone || '',
    created_at: new Date().toISOString(),
  }

  savePendingUsers([...pending, newUser])
  return { success: true, user: newUser }
}

export const approveUser = (userId) => {
  const pending = getPendingUsers()
  const user = pending.find(u => u.id === userId)
  if (!user) return false
  const users = getUsers()
  saveUsers([...users, { ...user, status: 'approved' }])
  savePendingUsers(pending.filter(u => u.id !== userId))
  return true
}

export const rejectUser = (userId) => {
  const pending = getPendingUsers()
  savePendingUsers(pending.filter(u => u.id !== userId))
  return true
}

export const getCurrentUser = () => {
  try {
    const stored = sessionStorage.getItem(AUTH_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return null
}

export const login = (name, pin) => {
  const users = getUsers()
  const user = users.find(u =>
    u.name.toLowerCase() === name.toLowerCase() &&
    u.pin === pin &&
    u.status === 'approved'
  )
  if (user) {
    const session = { ...user, loginTime: new Date().toISOString() }
    sessionStorage.setItem(AUTH_KEY, JSON.stringify(session))
    return { success: true, user: session }
  }
  // Check if pending
  const pending = getPendingUsers()
  const pendingUser = pending.find(u => u.name.toLowerCase() === name.toLowerCase())
  if (pendingUser) {
    return { success: false, error: 'Your account is pending approval by your sub-county admin' }
  }
  return { success: false, error: 'Invalid name or PIN' }
}

export const logout = () => {
  sessionStorage.removeItem(AUTH_KEY)
}

export const isLoggedIn = () => getCurrentUser() !== null
export const isAdmin = () => getCurrentUser()?.role === 'admin'