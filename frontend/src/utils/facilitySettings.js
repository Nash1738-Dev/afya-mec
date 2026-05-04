const FACILITY_KEY = 'digital_mec_facility'

export const getFacilitySettings = () => {
  try {
    const stored = localStorage.getItem(FACILITY_KEY)
    if (stored) return JSON.parse(stored)
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

export const saveFacilitySettings = (settings) => {
  try {
    localStorage.setItem(FACILITY_KEY, JSON.stringify(settings))
    return true
  } catch {
    return false
  }
}

export const isFacilityConfigured = () => {
  const s = getFacilitySettings()
  return s.facility_name !== '' && s.provider_name !== ''
}