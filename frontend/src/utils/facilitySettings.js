const FACILITY_PREFIX = 'digital_mec_facility_'
const LEGACY_KEY = 'digital_mec_facility'

// Get current username from auth
const getCurrentUsername = () => {
  try {
    const user = JSON.parse(localStorage.getItem('afyamec_current_user') || '{}')
    return user?.name?.toLowerCase().replace(/\s+/g, '_') || null
  } catch { return null }
}

const getFacilityKey = (username = null) => {
  const name = username || getCurrentUsername()
  return name ? `${FACILITY_PREFIX}${name}` : LEGACY_KEY
}

export const getFacilitySettings = (username = null) => {
  try {
    // Try user-specific key first
    const key = getFacilityKey(username)
    const stored = localStorage.getItem(key)
    if (stored) return JSON.parse(stored)

    // Fall back to legacy key (existing data)
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy) return JSON.parse(legacy)
  } catch {}
  return {
    facility_name: '',
    facility_code: '',
    county: '',
    sub_county: '',
    ward: '',
    provider_name: '',
    provider_cadre: '',
    provider_number: '',
  }
}

export const saveFacilitySettings = (settings, username = null) => {
  try {
    const key = getFacilityKey(username)
    localStorage.setItem(key, JSON.stringify(settings))
    // Also keep legacy key in sync for compatibility
    localStorage.setItem(LEGACY_KEY, JSON.stringify(settings))
    return true
  } catch { return false }
}

export const isFacilityConfigured = () => {
  const s = getFacilitySettings()
  return s.facility_name !== '' && s.provider_name !== ''
}

// Get all facilities saved across all users (for admin dashboard)
export const getAllFacilityProfiles = () => {
  const profiles = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(FACILITY_PREFIX)) {
        const username = key.replace(FACILITY_PREFIX, '')
        const data = JSON.parse(localStorage.getItem(key) || '{}')
        if (data.facility_name || data.provider_name) {
          profiles.push({ username, ...data })
        }
      }
    }
  } catch {}
  return profiles
}

// Migrate legacy settings to current user
export const migrateLegacySettings = (username) => {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (!legacy) return
    const key = `${FACILITY_PREFIX}${username.toLowerCase().replace(/\s+/g, '_')}`
    // Only migrate if user doesn't already have settings
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, legacy)
    }
  } catch {}
}