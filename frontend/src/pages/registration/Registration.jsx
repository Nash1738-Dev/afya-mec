import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../../hooks/useSession.jsx'
import { getToken } from '../../utils/auth.js'
import { getFacilitySettings } from '../../utils/facilitySettings.js'
import {
  Phone, User, ArrowRight, ArrowLeft, CheckCircle,
  RefreshCw, UserPlus, Clock, AlertTriangle
} from 'lucide-react'

const VISIT_TYPES = [
  { value: '1', label: 'New Client', desc: 'First time at this facility' },
  { value: '2', label: 'Revisit', desc: 'Has visited before' },
]

const SEX_OPTIONS = [
  { value: 'F', label: '♀ Female' },
  { value: 'M', label: '♂ Male' },
  { value: 'I', label: '⚧ Other' },
]

const BP_CATEGORIES = [
  { label: 'Normal', range: 'SBP <120 AND DBP <80', color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Elevated', range: 'SBP 120-129 AND DBP <80', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { label: 'Stage 1 HTN', range: 'SBP 130-139 OR DBP 80-89', color: 'text-orange-600', bg: 'bg-orange-50' },
  { label: 'Stage 2 HTN', range: 'SBP 140-159 OR DBP 90-99', color: 'text-red-600', bg: 'bg-red-50' },
  { label: 'Severe HTN', range: 'SBP 160-179 OR DBP 100-109', color: 'text-red-700', bg: 'bg-red-100' },
  { label: '🚨 HTN CRISIS', range: 'SBP ≥180 OR DBP ≥110', color: 'text-red-800 font-bold', bg: 'bg-red-200' },
]

function classifyBP(sys, dia) {
  const s = parseFloat(sys), d = parseFloat(dia)
  if (!s || !d) return null
  if (s >= 180 || d >= 110) return BP_CATEGORIES[5]
  if (s >= 160 || d >= 100) return BP_CATEGORIES[4]
  if (s >= 140 || d >= 90) return BP_CATEGORIES[3]
  if (s >= 130 || d >= 80) return BP_CATEGORIES[2]
  if (s >= 120 && d < 80) return BP_CATEGORIES[1]
  return BP_CATEGORIES[0]
}

// ─── STEP 1: Phone Lookup ──────────────────────────────────
function PhoneLookupStep({ onFound, onNew }) {
  const [phone, setPhone] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSearch = useCallback(async (val) => {
    const cleaned = val.replace(/\s/g, '')
    setPhone(val)
    setError('')
    setResults(null)
    if (cleaned.length < 6) return
    setSearching(true)
    try {
      const res = await fetch(
        `/api/clients/search?q=${encodeURIComponent(cleaned)}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      )
      if (res.ok) {
        const data = await res.json()
        setResults(data)
      }
    } catch { setError('Connection error') }
    setSearching(false)
  }, [])

  const formatPhone = (val) => {
    const digits = val.replace(/\D/g, '')
    if (digits.length <= 4) return digits
    if (digits.length <= 7) return `${digits.slice(0,4)} ${digits.slice(4)}`
    return `${digits.slice(0,4)} ${digits.slice(4,7)} ${digits.slice(7,10)}`
  }

  return (
    <div className="max-w-sm mx-auto">
      {/* Header */}
      <div className="rounded-2xl p-5 mb-6 text-white text-center"
        style={{ background: 'linear-gradient(135deg, #0d7377 0%, #14a044 100%)' }}>
        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
          <Phone size={28} />
        </div>
        <h2 className="text-xl font-bold">Start New Session</h2>
        <p className="text-teal-100 text-sm mt-1">Enter client's phone number to check records</p>
      </div>

      {/* Phone Input */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Client Phone Number
        </label>
        <div className="relative">
          <div className="absolute left-3 top-3 text-gray-400 text-sm font-medium">🇰🇪</div>
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-4 py-3 text-lg font-bold tracking-widest focus:outline-none focus:border-teal-500 transition-colors"
            placeholder="0712 345 678"
            value={phone}
            maxLength={13}
            onChange={e => handleSearch(formatPhone(e.target.value))}
          />
          {searching && (
            <RefreshCw size={16} className="absolute right-3 top-4 text-teal-500 animate-spin" />
          )}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          We'll check if this client has visited before
        </p>
      </div>

      {/* Search Results */}
      {results !== null && (
        <div className="mb-4">
          {results.length === 0 ? (
            /* No match → New client */
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <div className="text-center mb-3">
                <UserPlus size={32} className="mx-auto text-blue-400 mb-2"/>
                <p className="font-bold text-blue-700">No records found for this number</p>
                <p className="text-blue-500 text-sm mt-1">
                  This appears to be a new client at this facility
                </p>
              </div>
              <button
                onClick={() => onNew(phone.replace(/\s/g,''))}
                className="w-full text-white font-bold py-3 rounded-xl transition-colors mb-2"
                style={{background:'#0d7377'}}>
                ✅ Confirm New Client — Register Now
              </button>
              <button
                onClick={() => { setResults(null); setPhone('') }}
                className="w-full border border-blue-300 text-blue-600 font-medium py-2.5 rounded-xl hover:bg-blue-100 transition-colors text-sm">
                ← Try a different number
              </button>
            </div>
          ) : (
            /* Match found */
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 px-1">
                {results.length} matching record{results.length > 1 ? 's' : ''} found
              </p>
              {results.map(client => (
                <ClientMatchCard
                  key={client.id}
                  client={client}
                  onSelect={() => onFound(client, phone.replace(/\s/g, ''))}
                />
              ))}
              <button
                onClick={() => onNew(phone.replace(/\s/g, ''))}
                className="w-full mt-3 border-2 border-dashed border-gray-300 text-gray-500 font-medium py-3 rounded-xl hover:border-teal-300 hover:text-teal-600 transition-colors text-sm">
                + None of these — Register as New Client
              </button>
            </div>
          )}
        </div>
      )}

      {/* Skip / New Client options */}
      {results === null && (
        <div className="space-y-2 mt-2">
          <button
            onClick={() => onNew('')}
            className="w-full flex items-center justify-center gap-2 text-white font-bold py-3 rounded-xl transition-colors"
            style={{background:'linear-gradient(135deg,#0d7377,#14a044)'}}>
            <UserPlus size={18}/>
            New Client — Register at this facility
          </button>
          <button
            onClick={() => onNew('nophone')}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 text-gray-500 font-medium py-2.5 rounded-xl hover:border-teal-300 hover:text-teal-600 transition-colors text-sm">
            📵 Client has no phone — skip lookup
          </button>
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}
    </div>
  )
}

function ClientMatchCard({ client, onSelect }) {
  const [visits, setVisits] = useState([])
  const [loadingVisits, setLoadingVisits] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const token = localStorage.getItem('afyamec_auth_token')

  const loadVisits = async () => {
    if (visits.length > 0) { setShowHistory(true); return }
    setLoadingVisits(true)
    try {
      const res = await fetch(`/api/clients/${client.id}/visits`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setVisits(data)
        setShowHistory(true)
      }
    } catch {}
    setLoadingVisits(false)
  }

  const daysSince = client.last_visit
    ? Math.floor((Date.now() - new Date(client.last_visit)) / (1000 * 60 * 60 * 24))
    : null
  const isOverdue = daysSince && daysSince > 112

  const METHOD_LABELS = {
    COC:'COC', POP:'POP', DMPA_IM:'DMPA-IM', DMPA_SC:'DMPA-SC',
    NET_EN:'NET-EN', IMPLANT:'Implant', CU_IUD:'Cu-IUD',
    LNG_IUS:'LNG-IUS', CONDOM_M:'Male Condom', CONDOM_F:'Female Condom',
    BTL:'BTL', VASECTOMY:'Vasectomy', LAM:'LAM', FAM:'FAM',
    EC_PILL:'ECP', EC_IUD:'EC-IUD'
  }

  return (
    <div className="bg-white border-2 border-teal-200 rounded-2xl p-4 mb-3 shadow-sm">
      {/* Client identity */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
          style={{background:'linear-gradient(135deg,#0d7377,#14a044)'}}>
          {client.first_name?.[0]}{client.last_name?.[0]}
        </div>
        <div className="flex-1">
          <p className="font-bold text-gray-800 text-base">
            {client.first_name} {client.last_name}
          </p>
          <p className="text-gray-500 text-sm">
            {client.age} yrs · {client.sex === 'F' ? 'Female' : client.sex === 'M' ? 'Male' : 'Other'}
            {client.location && ` · 📍 ${client.location}`}
          </p>
          {client.telephone && (
            <p className="text-xs text-gray-400">📞 {client.telephone}</p>
          )}
        </div>
        {isOverdue && (
          <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full flex-shrink-0">
            ⚠️ OVERDUE
          </span>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-teal-50 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-teal-600">{client.total_visits}</p>
          <p className="text-xs text-gray-400">Visits</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <p className="text-sm font-bold text-gray-700 truncate">
            {METHOD_LABELS[client.last_method] || client.last_method || '—'}
          </p>
          <p className="text-xs text-gray-400">Last method</p>
        </div>
        <div className={`rounded-lg p-2 text-center ${isOverdue ? 'bg-red-50' : 'bg-gray-50'}`}>
          <p className={`text-sm font-bold ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
            {daysSince !== null ? `${daysSince}d` : '—'}
          </p>
          <p className="text-xs text-gray-400">Since visit</p>
        </div>
      </div>

      {/* Visit History Toggle */}
      <button
        onClick={loadVisits}
        className="w-full text-xs text-teal-600 hover:text-teal-800 font-medium py-1.5 border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors mb-3 flex items-center justify-center gap-1">
        {loadingVisits
          ? <><RefreshCw size={11} className="animate-spin"/> Loading history...</>
          : showHistory
            ? '▲ Hide visit history'
            : `📋 View visit history (${client.total_visits} visits)`}
      </button>

      {/* Visit History Panel */}
      {showHistory && visits.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-3 mb-3 border border-gray-200">
          <p className="text-xs font-bold text-gray-600 mb-2">
            📋 Visit History — last {visits.length} visits
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {visits.map((v, i) => {
              const isLast = i === 0
              const visitDate = new Date(v.visit_date)
              const daysAgo = Math.floor((Date.now() - visitDate) / (1000 * 60 * 60 * 24))
              const returnDate = v.return_date ? new Date(v.return_date) : null
              const isPastReturn = returnDate && returnDate < new Date()

              return (
                <div key={v.id}
                  className={`bg-white rounded-lg p-2.5 border text-xs
                    ${isLast ? 'border-teal-300 bg-teal-50' : 'border-gray-100'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-bold ${isLast ? 'text-teal-700' : 'text-gray-600'}`}>
                      {isLast ? '🔵 Latest: ' : ''}
                      {visitDate.toLocaleDateString('en-KE', {
                        day:'numeric', month:'short', year:'numeric'
                      })}
                      <span className="text-gray-400 font-normal ml-1">({daysAgo}d ago)</span>
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium
                      ${v.visit_type === 1 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                      {v.visit_type === 1 ? 'New' : 'Revisit'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                    <p className="text-gray-600">
                      💊 <strong>{METHOD_LABELS[v.primary_method] || v.primary_method || '—'}</strong>
                      {v.dmpa_sc_mode && <span className="text-teal-600 ml-1">({v.dmpa_sc_mode})</span>}
                    </p>
                    {(v.bp_systolic && v.bp_diastolic) && (
                      <p className="text-gray-500">
                        🩺 BP: {v.bp_systolic}/{v.bp_diastolic}
                        {v.bp_category && <span className="ml-1 text-gray-400">({v.bp_category})</span>}
                      </p>
                    )}
                    {v.weight_kg && (
                      <p className="text-gray-500">⚖️ {v.weight_kg} kg</p>
                    )}
                    {v.quantity_dispensed && (
                      <p className="text-gray-500">📦 {v.quantity_dispensed} dose(s)</p>
                    )}
                    {returnDate && (
                      <p className={isPastReturn ? 'text-red-500 font-medium' : 'text-green-600'}>
                        📅 Return: {returnDate.toLocaleDateString('en-KE', {day:'numeric', month:'short'})}
                        {isPastReturn ? ' ⚠️ OVERDUE' : ''}
                      </p>
                    )}
                    {v.provider_name && (
                      <p className="text-gray-400">👤 {v.provider_name}</p>
                    )}
                  </div>
                  {v.mec_conditions && v.mec_conditions.length > 0 && (
                    <p className="text-orange-500 mt-1">
                      ⚕️ Conditions: {v.mec_conditions.slice(0,3).join(', ')}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Action button */}
      <button
        onClick={onSelect}
        className="w-full text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-md"
        style={{background:'linear-gradient(135deg,#0d7377,#14a044)'}}>
        <CheckCircle size={18}/>
        This is the client — Load Records & Start Session
      </button>
    </div>
  )
}

// ─── STEP 2: Biodata ──────────────────────────────────────
function BiodataStep({ initialData, isReturning, onNext, onBack }) {
  const [form, setForm] = useState({
    first_name: initialData.first_name || '',
    last_name: initialData.last_name || '',
    age: initialData.age || '',
    sex: initialData.sex || '',
    telephone: initialData.telephone || '',
    service_registration_number: initialData.service_registration_number || '',
    location_landmark: initialData.location_landmark || '',
    disability_status: initialData.disability_status || '0',
    visit_type: isReturning ? '2' : '',
    first_ever_user: '',
  })
  const [errors, setErrors] = useState({})

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }))
    setErrors(p => ({ ...p, [k]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.first_name.trim()) e.first_name = 'Required'
    if (!form.last_name.trim()) e.last_name = 'Required'
    if (!form.age) e.age = 'Required'
    if (form.age && (parseInt(form.age) < 10 || parseInt(form.age) > 65))
      e.age = 'Must be 10–65'
    if (!form.sex) e.sex = 'Required'
    if (!form.visit_type) e.visit_type = 'Required'
    if (form.telephone && form.telephone.length > 4 &&
      !/^(\+254|0)[17]\d{8}$/.test(form.telephone.replace(/\s/g, '')))
      e.telephone = 'Invalid Kenya number (e.g. 0712345678)'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => {
    if (!validate()) return
    onNext(form)
  }

  const isAdolescent = parseInt(form.age) < 18 && parseInt(form.age) >= 10

  return (
    <div className="max-w-lg mx-auto">
      <button onClick={onBack}
        className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm mb-4">
        <ArrowLeft size={15} /> Change phone number
      </button>

      {/* Returning client banner */}
      {isReturning && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 mb-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-teal-500 flex-shrink-0" />
          <div>
            <p className="font-bold text-teal-700 text-sm">Returning Client — Biodata Pre-filled</p>
            <p className="text-teal-600 text-xs">Please verify details are current and update if needed</p>
          </div>
        </div>
      )}

      {/* Adolescent alert */}
      {isAdolescent && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-4">
          <p className="font-bold text-purple-700 text-sm flex items-center gap-2">
            👤 Adolescent Client — ARSH Guidelines Apply
          </p>
          <p className="text-purple-600 text-xs mt-1">
            Ensure privacy, use youth-friendly language, assess for coercion, offer dual protection counselling.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {/* Name */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 className="font-bold text-gray-700 text-sm mb-3">
            👤 Client Identity
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                First Name *
              </label>
              <input
                className={`w-full border-2 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition-colors
                  ${errors.first_name ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                placeholder="e.g. Jane"
                value={form.first_name}
                onChange={e => set('first_name', e.target.value)}
              />
              {errors.first_name && (
                <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Last Name *
              </label>
              <input
                className={`w-full border-2 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition-colors
                  ${errors.last_name ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                placeholder="e.g. Wanjiku"
                value={form.last_name}
                onChange={e => set('last_name', e.target.value)}
              />
              {errors.last_name && (
                <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Age (years) *
              </label>
              <input
                type="number"
                inputMode="numeric"
                min="10" max="65"
                className={`w-full border-2 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition-colors
                  ${errors.age ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                placeholder="e.g. 28"
                value={form.age}
                onChange={e => set('age', e.target.value)}
              />
              {errors.age && (
                <p className="text-red-500 text-xs mt-1">{errors.age}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Sex *
              </label>
              <div className="grid grid-cols-3 gap-1">
                {SEX_OPTIONS.map(o => (
                  <button key={o.value}
                    onClick={() => set('sex', o.value)}
                    className={`py-2 rounded-lg border-2 text-xs font-bold transition-colors
                      ${form.sex === o.value
                        ? 'text-white border-transparent'
                        : 'border-gray-200 text-gray-600 hover:border-teal-300'}`}
                    style={form.sex === o.value ? { background: '#0d7377' } : {}}>
                    {o.label}
                  </button>
                ))}
              </div>
              {errors.sex && (
                <p className="text-red-500 text-xs mt-1">{errors.sex}</p>
              )}
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              inputMode="numeric"
              className={`w-full border-2 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition-colors
                ${errors.telephone ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
              placeholder="0712 345 678"
              value={form.telephone}
              onChange={e => set('telephone', e.target.value)}
            />
            {errors.telephone && (
              <p className="text-red-500 text-xs mt-1">{errors.telephone}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Service Reg. No.
              </label>
              <input
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500"
                placeholder="MOH 512 number"
                value={form.service_registration_number}
                onChange={e => set('service_registration_number', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Location / Landmark
              </label>
              <input
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500"
                placeholder="Village / estate"
                value={form.location_landmark}
                onChange={e => set('location_landmark', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Visit Type */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 className="font-bold text-gray-700 text-sm mb-3">
            📋 Visit Details
          </h3>
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Visit Type *
          </label>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {VISIT_TYPES.map(v => (
              <button key={v.value}
                onClick={() => set('visit_type', v.value)}
                className={`p-3 rounded-xl border-2 text-left transition-colors
                  ${form.visit_type === v.value
                    ? 'text-white border-transparent'
                    : 'border-gray-200 hover:border-teal-300'}`}
                style={form.visit_type === v.value ? { background: '#0d7377' } : {}}>
                <p className={`font-bold text-sm ${form.visit_type === v.value ? 'text-white' : 'text-gray-700'}`}>
                  {v.label}
                </p>
                <p className={`text-xs mt-0.5 ${form.visit_type === v.value ? 'text-teal-100' : 'text-gray-400'}`}>
                  {v.desc}
                </p>
              </button>
            ))}
          </div>
          {errors.visit_type && (
            <p className="text-red-500 text-xs mb-2">{errors.visit_type}</p>
          )}

          {form.visit_type === '1' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                First ever FP user?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[{ v: 'true', l: '✅ Yes — 1st ever FP user' }, { v: 'false', l: 'No — Used FP before' }].map(o => (
                  <button key={o.v}
                    onClick={() => set('first_ever_user', o.v)}
                    className={`py-2 px-3 rounded-lg border-2 text-xs font-semibold transition-colors text-left
                      ${form.first_ever_user === o.v
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-gray-200 text-gray-500 hover:border-teal-200'}`}>
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Disability status
            </label>
            <select
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
              value={form.disability_status}
              onChange={e => set('disability_status', e.target.value)}>
              <option value="0">No disability</option>
              <option value="1">Physical disability</option>
              <option value="2">Visual impairment</option>
              <option value="3">Hearing impairment</option>
              <option value="4">Intellectual disability</option>
              <option value="5">Other disability</option>
            </select>
          </div>
        </div>

        {/* Continue button */}
        <button
          onClick={handleNext}
          className="w-full flex items-center justify-center gap-2 text-white font-bold py-4 rounded-2xl shadow-lg transition-all hover:shadow-xl"
          style={{ background: 'linear-gradient(135deg, #0d7377 0%, #14a044 100%)' }}>
          Continue to Vitals <ArrowRight size={20} />
        </button>
      </div>
    </div>
  )
}

// ─── STEP 3: Vitals ───────────────────────────────────────
function VitalsStep({ onNext, onBack, clientName }) {
  const [vitals, setVitals] = useState({
    bp_systolic: '',
    bp_diastolic: '',
    weight_kg: '',
    height_cm: '',
  })
  const [errors, setErrors] = useState({})
  const bpCategory = classifyBP(vitals.bp_systolic, vitals.bp_diastolic)
  const bmi = vitals.weight_kg && vitals.height_cm
    ? (parseFloat(vitals.weight_kg) / Math.pow(parseFloat(vitals.height_cm) / 100, 2)).toFixed(1)
    : null

  const set = (k, v) => {
    setVitals(p => ({ ...p, [k]: v }))
    setErrors(p => ({ ...p, [k]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!vitals.bp_systolic) e.bp_systolic = 'Required'
    if (!vitals.bp_diastolic) e.bp_diastolic = 'Required'
    if (vitals.bp_systolic && (parseFloat(vitals.bp_systolic) < 60 || parseFloat(vitals.bp_systolic) > 250))
      e.bp_systolic = 'Must be 60–250 mmHg'
    if (vitals.bp_diastolic && (parseFloat(vitals.bp_diastolic) < 40 || parseFloat(vitals.bp_diastolic) > 150))
      e.bp_diastolic = 'Must be 40–150 mmHg'
    if (!vitals.weight_kg) e.weight_kg = 'Required'
    if (vitals.weight_kg && (parseFloat(vitals.weight_kg) < 20 || parseFloat(vitals.weight_kg) > 250))
      e.weight_kg = 'Must be 20–250 kg'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => {
    if (!validate()) return
    // Crisis alert
    const sys = parseFloat(vitals.bp_systolic)
    const dia = parseFloat(vitals.bp_diastolic)
    if (sys >= 180 || dia >= 110) {
      const proceed = confirm(
        '🚨 HYPERTENSIVE CRISIS DETECTED\n\n' +
        `BP: ${sys}/${dia} mmHg\n\n` +
        'ACTION REQUIRED:\n' +
        '• Do NOT initiate hormonal contraceptives\n' +
        '• Refer for emergency BP management\n' +
        '• Only non-hormonal FP methods (Cu-IUD, condoms) after stabilisation\n\n' +
        'Document this and proceed with non-hormonal counselling only.\n\n' +
        'Press OK to continue and document this visit.'
      )
      if (!proceed) return
    } else if (sys >= 160 || dia >= 100) {
      alert(
        '⚠️ SEVERE HYPERTENSION\n\n' +
        `BP: ${sys}/${dia} mmHg\n\n` +
        '• COC/patch/ring are CATEGORY 4 — Do NOT use\n' +
        '• DMPA/NET-EN/Implants are Category 3 — Use with caution\n' +
        '• Cu-IUD and condoms are safe options\n\n' +
        'Document BP and discuss only appropriate methods.'
      )
    }
    onNext({ ...vitals, bp_category: bpCategory?.label || '', bmi: bmi || '' })
  }

  return (
    <div className="max-w-lg mx-auto">
      <button onClick={onBack}
        className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm mb-4">
        <ArrowLeft size={15} /> Back to biodata
      </button>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
        <h3 className="font-bold text-gray-700 mb-1">
          📊 Vitals — {clientName}
        </h3>
        <p className="text-xs text-gray-400 mb-4">Measure before counselling</p>

        {/* BP */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-gray-600 mb-2">
            Blood Pressure (mmHg) *
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="number"
                inputMode="numeric"
                className={`w-full border-2 rounded-xl px-3 py-3 text-lg font-bold text-center focus:outline-none focus:border-teal-500 transition-colors
                  ${errors.bp_systolic ? 'border-red-300' : 'border-gray-200'}`}
                placeholder="120"
                value={vitals.bp_systolic}
                onChange={e => set('bp_systolic', e.target.value)}
              />
              <p className="text-xs text-center text-gray-400 mt-1">Systolic</p>
            </div>
            <span className="text-2xl font-bold text-gray-300">/</span>
            <div className="flex-1">
              <input
                type="number"
                inputMode="numeric"
                className={`w-full border-2 rounded-xl px-3 py-3 text-lg font-bold text-center focus:outline-none focus:border-teal-500 transition-colors
                  ${errors.bp_diastolic ? 'border-red-300' : 'border-gray-200'}`}
                placeholder="80"
                value={vitals.bp_diastolic}
                onChange={e => set('bp_diastolic', e.target.value)}
              />
              <p className="text-xs text-center text-gray-400 mt-1">Diastolic</p>
            </div>
            <div className="text-sm text-gray-400">mmHg</div>
          </div>

          {/* BP Category Badge */}
          {bpCategory && (
            <div className={`mt-2 px-3 py-2 rounded-lg text-sm font-bold text-center ${bpCategory.bg} ${bpCategory.color}`}>
              {bpCategory.label}
              <span className="font-normal ml-2 text-xs opacity-75">({bpCategory.range})</span>
            </div>
          )}
          {(errors.bp_systolic || errors.bp_diastolic) && (
            <p className="text-red-500 text-xs mt-1">{errors.bp_systolic || errors.bp_diastolic}</p>
          )}
        </div>

        {/* Weight & Height */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Weight (kg) *
            </label>
            <input
              type="number"
              inputMode="decimal"
              className={`w-full border-2 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition-colors
                ${errors.weight_kg ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
              placeholder="e.g. 65"
              value={vitals.weight_kg}
              onChange={e => set('weight_kg', e.target.value)}
            />
            {errors.weight_kg && (
              <p className="text-red-500 text-xs mt-1">{errors.weight_kg}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Height (cm) — optional
            </label>
            <input
              type="number"
              inputMode="numeric"
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500"
              placeholder="e.g. 162"
              value={vitals.height_cm}
              onChange={e => set('height_cm', e.target.value)}
            />
          </div>
        </div>

        {/* BMI */}
        {bmi && (
          <div className={`mt-3 px-3 py-2 rounded-lg text-sm font-semibold text-center
            ${parseFloat(bmi) >= 35 ? 'bg-red-50 text-red-600' :
              parseFloat(bmi) >= 30 ? 'bg-orange-50 text-orange-600' :
              parseFloat(bmi) >= 25 ? 'bg-yellow-50 text-yellow-600' :
              parseFloat(bmi) < 18.5 ? 'bg-blue-50 text-blue-600' :
              'bg-green-50 text-green-600'}`}>
            BMI: {bmi} kg/m² — {
              parseFloat(bmi) >= 35 ? '⚠️ Obese Class II+ (COC is Cat 3)' :
              parseFloat(bmi) >= 30 ? 'Obese Class I' :
              parseFloat(bmi) >= 25 ? 'Overweight' :
              parseFloat(bmi) < 18.5 ? 'Underweight' : 'Normal weight'
            }
          </div>
        )}
      </div>

      <button
        onClick={handleNext}
        className="w-full flex items-center justify-center gap-2 text-white font-bold py-4 rounded-2xl shadow-lg transition-all hover:shadow-xl"
        style={{ background: 'linear-gradient(135deg, #0d7377 0%, #14a044 100%)' }}>
        Continue to Screening <ArrowRight size={20} />
      </button>
    </div>
  )
}

// ─── MAIN REGISTRATION COMPONENT ──────────────────────────
export default function Registration() {
  const navigate = useNavigate()
  const { session, updateSession } = useSession()
  const facility = getFacilitySettings()

  // Steps: 'phone' → 'biodata' → 'vitals'
  const [step, setStep] = useState('phone')
  const [phoneFromLookup, setPhoneFromLookup] = useState('')
  const [prefillData, setPrefillData] = useState({})
  const [isReturning, setIsReturning] = useState(false)

  // Progress indicator
  const steps = [
    { key: 'phone', label: 'Lookup', icon: '📱' },
    { key: 'biodata', label: 'Biodata', icon: '👤' },
    { key: 'vitals', label: 'Vitals', icon: '📊' },
  ]
  const currentStepIdx = steps.findIndex(s => s.key === step)

  const handleClientFound = (client, phone) => {
    setPhoneFromLookup(phone)
    setIsReturning(true)
    setPrefillData({
      first_name: client.first_name,
      last_name: client.last_name,
      age: client.age,
      sex: client.sex,
      telephone: client.telephone || phone,
      location_landmark: client.location || '',
      service_registration_number: client.service_reg_number || '',
      disability_status: '0',
      existing_client_id: client.id,
    })
    setStep('biodata')
  }

  const handleNewClient = (phone) => {
    setPhoneFromLookup(phone === 'nophone' ? '' : phone)
    setIsReturning(false)
    setPrefillData({ telephone: phone === 'nophone' ? '' : phone })
    setStep('biodata')
  }

  const handleBiodataDone = (formData) => {
    updateSession('client', {
      ...formData,
      facility_code: facility.facility_code || '',
      provider_name: facility.provider_name || '',
      existing_client_id: prefillData.existing_client_id || null,
    })
    setStep('vitals')
  }

  const handleVitalsDone = (vitalsData) => {
    updateSession('vitals', vitalsData)
    navigate('/session/pre-choice')
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center flex-1">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all
                ${i < currentStepIdx ? 'bg-green-100 text-green-700' :
                  i === currentStepIdx ? 'text-white' : 'bg-gray-100 text-gray-400'}`}
                style={i === currentStepIdx ? { background: '#0d7377' } : {}}>
                <span>{s.icon}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 rounded
                  ${i < currentStepIdx ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      {step === 'phone' && (
        <PhoneLookupStep
          onFound={handleClientFound}
          onNew={handleNewClient}
        />
      )}
      {step === 'biodata' && (
        <BiodataStep
          initialData={prefillData}
          isReturning={isReturning}
          onNext={handleBiodataDone}
          onBack={() => setStep('phone')}
        />
      )}
      {step === 'vitals' && (
        <VitalsStep
          onNext={handleVitalsDone}
          onBack={() => setStep('biodata')}
          clientName={`${session.client?.first_name || ''} ${session.client?.last_name || ''}`.trim()}
        />
      )}
    </div>
  )
}