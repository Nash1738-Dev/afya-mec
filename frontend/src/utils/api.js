import axios from 'axios'
import { saveSessionOffline, getPendingSessions, markSynced } from './offlineQueue.js'
import { getToken, logout } from './auth.js'
import { getFacilitySettings as getFacility } from './facilitySettings.js'

const API = axios.create({
  baseURL: '/api',
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' }
})

// Attach JWT token to every request
API.interceptors.request.use(config => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 — redirect to login
API.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      logout()
      window.location.href = '/login?reason=expired'
    }
    return Promise.reject(error)
  }
)

export const saveSession = async (sessionData) => {
  const payload = {
    client: {
      ...sessionData.client,
      facility_code: getFacility().facility_code || '',
      provider_name: getFacility().provider_name || '',
    },
    vitals: sessionData.vitals || {},
    pregnancy: sessionData.pregnancy || {},
    conditions: sessionData.conditions || [],
    conditionDetails: sessionData.conditionDetails || {},
    selectedMethod: sessionData.selectedMethod || null,
    methodVisitCategory: sessionData.methodVisitCategory || null,
    methodChangeReason: sessionData.methodChangeReason || null,
    quantityDispensed: sessionData.quantityDispensed || null,
    dmpaAdminType: sessionData.dmpaAdminType || null,
    dmpaTakeHomeDoses: sessionData.dmpaTakeHomeDoses || null,
    larcRemovalReason: sessionData.larcRemovalReason || null,
    counsellingDone: sessionData.counsellingDone || false,
    comprehensionConfirmed: sessionData.comprehensionConfirmed || false,
    sti: sessionData.sti || {},
    returnDate: sessionData.returnDate || null,
    sessionDate: sessionData.sessionDate || new Date().toISOString(),
  }

  try {
    const response = await API.post('/visits/save', payload)
    return { success: true, data: response.data, offline: false }
  } catch (error) {
    // Fallback to offline storage
    console.warn('Backend unavailable — saving offline')
    const offlineResult = await saveSessionOffline(payload)
    if (offlineResult.success) {
      return {
        success: true,
        offline: true,
        message: 'Saved offline — will sync when connected'
      }
    }
    return { success: false, error: error.message }
  }
}

export const syncPendingSessions = async () => {
  try {
    const { getPendingSessions, markSynced } = await import('./offlineQueue.js')
    const pending = await getPendingSessions()
    let synced = 0
    for (const item of pending) {
      try {
        const response = await API.post('/visits/save', item.data)
        if (response.data?.success) {
          await markSynced(item.id)
          synced++
        } else {
          break
        }
      } catch {
        break
      }
    }
    return synced
  } catch {
    return 0
  }
}

export const getClients = async () => {
  try {
    const response = await fetch(`/api/clients/?t=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    })
    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    return { success: false, data: [] }
  }
}

export const getClient = async (clientId) => {
  try {
    const response = await API.get(`/clients/${clientId}`)
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, data: null }
  }
}

export const exportMOH512 = () => {
  window.open('/api/export/moh512', '_blank')
}

export default API