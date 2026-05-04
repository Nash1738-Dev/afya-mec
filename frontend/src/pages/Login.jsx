import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, registerUser } from '../utils/auth.js'
import { getFacilitySettings } from '../utils/facilitySettings.js'
import { Eye, EyeOff, Shield, UserPlus, ArrowLeft, CheckCircle } from 'lucide-react'

const CADRES = [
  'Medical Officer','Clinical Officer','Registered Nurse','Enrolled Nurse',
  'Midwife','Pharmaceutical Technologist','Community Health Promoter','Other'
]

const KENYA_COUNTIES = [
  'Baringo','Bomet','Bungoma','Busia','Elgeyo-Marakwet','Embu','Garissa',
  'Homa Bay','Isiolo','Kajiado','Kakamega','Kericho','Kiambu','Kilifi',
  'Kirinyaga','Kisii','Kisumu','Kitui','Kwale','Laikipia','Lamu','Machakos',
  'Makueni','Mandera','Marsabit','Meru','Migori','Mombasa','Murang\'a',
  'Nairobi','Nakuru','Nandi','Narok','Nyamira','Nyandarua','Nyeri',
  'Samburu','Siaya','Taita-Taveta','Tana River','Tharaka-Nithi','Trans Nzoia',
  'Turkana','Uasin Gishu','Vihiga','Wajir','West Pokot'
]

export default function Login() {
  const navigate = useNavigate()
  const facility = getFacilitySettings()
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'registered'
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Registration fields
  const [regData, setRegData] = useState({
    name: '', pin: '', confirmPin: '',
    facility: facility.facility_name || '',
    sub_county: '', county: facility.county || '',
    cadre: '', phone: ''
  })

  const handleNameChange = useCallback(e => { setName(e.target.value); setError('') }, [])
  const handlePinChange = useCallback(e => {
    setPin(e.target.value.replace(/\D/g,'').slice(0,6))
    setError('')
  }, [])

  const handleLogin = () => {
    if (!name.trim()) { setError('Please enter your name'); return }
    if (pin.length < 4) { setError('PIN must be at least 4 digits'); return }
    setLoading(true)
    setTimeout(() => {
      const result = login(name.trim(), pin)
      if (result.success) {
        navigate('/')
      } else {
        setError(result.error)
        setPin('')
      }
      setLoading(false)
    }, 400)
  }

  const handleRegister = () => {
    if (!regData.name.trim()) { setError('Full name is required'); return }
    if (regData.pin.length < 4) { setError('PIN must be at least 4 digits'); return }
    if (regData.pin !== regData.confirmPin) { setError('PINs do not match'); return }
    if (!regData.cadre) { setError('Please select your cadre'); return }
    if (!regData.county) { setError('Please select your county'); return }

    const result = registerUser(regData)
    if (result.success) {
      setMode('registered')
    } else {
      setError(result.error)
    }
  }

  const PinButton = ({ digit }) => (
    <button
      onClick={() => { if (pin.length < 6) { setPin(p => p + digit); setError('') } }}
      className="w-full h-12 bg-white hover:bg-teal-50 border border-gray-200 rounded-xl text-lg font-bold text-gray-700 transition-colors active:bg-teal-100">
      {digit}
    </button>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{background: 'linear-gradient(135deg, #0d7377 0%, #134e4a 100%)'}}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="w-18 h-18 rounded-2xl flex items-center justify-center text-4xl"
              style={{background: 'rgba(255,255,255,0.15)', padding: '16px'}}>
              🌿
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">AfyaMEC</h1>
          <p className="text-teal-200 text-sm mt-1">Informed Choice · Better Health</p>
          <p className="text-teal-300 text-xs mt-0.5">Digital MEC — Kenya Family Planning Platform</p>
          {facility.facility_name && (
            <div className="mt-3 border border-white border-opacity-30 rounded-xl px-4 py-3"
              style={{background: 'rgba(255,255,255,0.15)'}}>
              <p className="text-white font-bold text-sm">{facility.facility_name}</p>
              {facility.county && (
                <p className="text-white text-xs mt-0.5 opacity-80">📍 {facility.county} County</p>
              )}
              {facility.provider_name && (
                <p className="text-white text-xs mt-0.5 opacity-70">👤 {facility.provider_name}</p>
              )}
            </div>
          )}
        </div>

        {/* Registration Success */}
        {mode === 'registered' && (
          <div className="bg-white rounded-2xl shadow-2xl p-6 text-center">
            <div className="flex justify-center mb-3">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle size={32} className="text-green-500"/>
              </div>
            </div>
            <h2 className="font-bold text-gray-800 text-lg mb-2">Registration Submitted!</h2>
            <p className="text-gray-500 text-sm mb-4">
              Your account request has been sent to your sub-county admin for approval.
              You will be able to login once approved.
            </p>
            <div className="bg-teal-50 rounded-lg p-3 mb-4 text-left text-xs text-teal-700">
              <p className="font-semibold mb-1">What happens next:</p>
              <p>1. Sub-county admin reviews your request</p>
              <p>2. Admin approves your account</p>
              <p>3. You can then login with your name and PIN</p>
            </div>
            <button onClick={() => { setMode('login'); setRegData({name:'',pin:'',confirmPin:'',facility:facility.facility_name||'',sub_county:'',county:facility.county||'',cadre:'',phone:''}); setError('') }}
              className="w-full text-white font-bold py-3 rounded-xl transition-colors"
              style={{background: '#0d7377'}}>
              Back to Login
            </button>
          </div>
        )}

        {/* Login Form */}
        {mode === 'login' && (
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Shield size={20} className="text-teal-600"/>
              <h2 className="font-bold text-gray-800">Provider Login</h2>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">Your Name</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                style={{'--tw-ring-color': '#0d9488'}}
                placeholder="Enter your full name"
                value={name}
                onChange={handleNameChange}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoComplete="off"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">PIN</label>
              <div className="relative">
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 tracking-widest font-bold"
                  placeholder="Enter PIN"
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={handlePinChange}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  maxLength={6}
                  inputMode="numeric"
                />
                <button onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-3 text-gray-400">
                  {showPin ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            {/* PIN Pad */}
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {[1,2,3,4,5,6,7,8,9].map(d => <PinButton key={d} digit={String(d)}/>)}
              <button onClick={() => setPin(p => p.slice(0,-1))}
                className="w-full h-12 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-sm font-medium text-gray-600">
                ⌫
              </button>
              <PinButton digit="0"/>
              <button onClick={() => setPin('')}
                className="w-full h-12 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-xs font-medium text-gray-600">
                Clear
              </button>
            </div>

            {/* PIN dots */}
            <div className="flex justify-center gap-2 mb-4">
              {Array.from({length:6}).map((_,i) => (
                <div key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${i < pin.length ? 'bg-teal-600' : 'bg-gray-200'}`}/>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm text-center">
                {error}
              </div>
            )}

            <button onClick={handleLogin}
              disabled={loading || !name.trim() || pin.length < 4}
              className={`w-full py-3 rounded-xl font-bold text-base transition-colors mb-3
                ${loading || !name.trim() || pin.length < 4
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'text-white'}`}
              style={loading || !name.trim() || pin.length < 4 ? {} : {background: '#0d7377'}}>
              {loading ? '⏳ Logging in...' : '🔐 Login'}
            </button>

            <button onClick={() => { setMode('register'); setError('') }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-teal-200 text-teal-700 font-semibold text-sm hover:bg-teal-50 transition-colors">
              <UserPlus size={16}/> Register New Account
            </button>
          </div>
        )}

        {/* Registration Form */}
        {mode === 'register' && (
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <button onClick={() => { setMode('login'); setError('') }}
                className="text-gray-400 hover:text-gray-600">
                <ArrowLeft size={18}/>
              </button>
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <UserPlus size={18} className="text-teal-600"/> Register New Account
              </h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Full Name *</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  placeholder="Your full name"
                  value={regData.name}
                  onChange={e => setRegData(p => ({...p, name: e.target.value}))}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">PIN (4-6 digits) *</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    type="password" inputMode="numeric" maxLength={6} placeholder="Create PIN"
                    value={regData.pin}
                    onChange={e => setRegData(p => ({...p, pin: e.target.value.replace(/\D/g,'').slice(0,6)}))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Confirm PIN *</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    type="password" inputMode="numeric" maxLength={6} placeholder="Repeat PIN"
                    value={regData.confirmPin}
                    onChange={e => setRegData(p => ({...p, confirmPin: e.target.value.replace(/\D/g,'').slice(0,6)}))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Facility Name</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  placeholder="Your facility"
                  value={regData.facility}
                  onChange={e => setRegData(p => ({...p, facility: e.target.value}))}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">County *</label>
                  <select className="w-full border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2"
                    value={regData.county}
                    onChange={e => setRegData(p => ({...p, county: e.target.value}))}>
                    <option value="">Select...</option>
                    {KENYA_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Sub-County</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2"
                    placeholder="Sub-county"
                    value={regData.sub_county}
                    onChange={e => setRegData(p => ({...p, sub_county: e.target.value}))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Cadre *</label>
                  <select className="w-full border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2"
                    value={regData.cadre}
                    onChange={e => setRegData(p => ({...p, cadre: e.target.value}))}>
                    <option value="">Select cadre...</option>
                    {CADRES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2"
                    placeholder="0712..."
                    value={regData.phone}
                    onChange={e => setRegData(p => ({...p, phone: e.target.value}))}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button onClick={handleRegister}
              className="w-full mt-4 text-white font-bold py-3 rounded-xl transition-colors"
              style={{background: '#0d7377'}}>
              Submit Registration Request
            </button>

            <p className="text-xs text-gray-400 text-center mt-3">
              Your request will be reviewed by your sub-county admin before you can log in
            </p>
          </div>
        )}
      </div>
    </div>
  )
}