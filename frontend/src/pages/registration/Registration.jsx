import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../../hooks/useSession.jsx'
import { User, Phone, MapPin, Calendar, AlertCircle, ChevronRight } from 'lucide-react'

export default function Registration() {
  const navigate = useNavigate()
  const { session, updateSession } = useSession()
  const [form, setForm] = useState(session.client)
  const [errors, setErrors] = useState({})

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const calcBMI = (weight, height) => {
    if (weight && height) {
      const bmi = (weight / ((height / 100) ** 2)).toFixed(1)
      return parseFloat(bmi)
    }
    return null
  }

  const handleVitalChange = (field, value) => {
    const updated = { ...session.vitals, [field]: value }
    if (field === 'weight_kg' || field === 'height_cm') {
      const w = field === 'weight_kg' ? value : session.vitals.weight_kg
      const h = field === 'height_cm' ? value : session.vitals.height_cm
      updated.bmi = calcBMI(w, h)
    }
    if (field === 'bp_systolic' || field === 'bp_diastolic') {
      const sys = field === 'bp_systolic' ? parseFloat(value) : parseFloat(session.vitals.bp_systolic)
      const dia = field === 'bp_diastolic' ? parseFloat(value) : parseFloat(session.vitals.bp_diastolic)
      if (sys >= 180 || dia >= 110) updated.bp_category = 'Crisis'
      else if (sys >= 160 || dia >= 100) updated.bp_category = 'Stage 2'
      else if (sys >= 140 || dia >= 90) updated.bp_category = 'Stage 1'
      else if (sys >= 130 || dia >= 80) updated.bp_category = 'Elevated'
      else if (sys && dia) updated.bp_category = 'Normal'
      else updated.bp_category = ''
    }
    updateSession('vitals', updated)
  }

  const bpColor = {
    'Normal': 'text-green-600 bg-green-50 border-green-300',
    'Elevated': 'text-yellow-600 bg-yellow-50 border-yellow-300',
    'Stage 1': 'text-orange-600 bg-orange-50 border-orange-300',
    'Stage 2': 'text-red-600 bg-red-50 border-red-300',
    'Crisis': 'text-red-800 bg-red-100 border-red-500',
  }

  const validate = () => {
    const e = {}
    if (!form.first_name.trim()) e.first_name = 'First name is required'
    if (!form.last_name.trim()) e.last_name = 'Last name is required'
    if (!form.age || form.age < 10 || form.age > 65) e.age = 'Valid age required (10–65)'
    if (!form.sex) e.sex = 'Sex is required'
    if (!form.visit_type) e.visit_type = 'Visit type is required'
    if (!session.vitals.bp_systolic) e.bp_systolic = 'Blood pressure is required'
    if (!session.vitals.bp_diastolic) e.bp_diastolic = 'Blood pressure is required'
    if (!session.vitals.weight_kg) e.weight_kg = 'Weight is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => {
    if (!validate()) return
    updateSession('client', form)
    navigate('/session/pre-choice')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <User className="text-teal-600" size={24} /> Client Registration & Vitals
        </h2>
        <p className="text-gray-500 text-sm mt-1">Stage 1 of 6 — Fill in client details and take vitals</p>
      </div>

      {/* SECTION A: Client Identity */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
        <h3 className="font-bold text-gray-700 text-base mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
          <User size={16} className="text-blue-500" /> Client Identity
        </h3>

        <div className="grid grid-cols-2 gap-4">
          {/* Service Reg Number */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Service Registration Number <span className="text-gray-400 font-normal">(MOH 512 — optional)</span>
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
              placeholder="e.g. FP/2025/001"
              value={form.service_reg_number}
              onChange={e => handleChange('service_reg_number', e.target.value)}
            />
          </div>

          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">First Name <span className="text-red-500">*</span></label>
            <input
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm ${errors.first_name ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="First name"
              value={form.first_name}
              onChange={e => handleChange('first_name', e.target.value)}
            />
            {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Last Name / Surname <span className="text-red-500">*</span></label>
            <input
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm ${errors.last_name ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="Last name"
              value={form.last_name}
              onChange={e => handleChange('last_name', e.target.value)}
            />
            {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Age (years) <span className="text-red-500">*</span></label>
            <input
              type="number" min="10" max="65"
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm ${errors.age ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="Age"
              value={form.age}
              onChange={e => handleChange('age', e.target.value)}
            />
            {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
            {form.age && form.age < 18 && (
              <p className="text-orange-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={12}/> Adolescent — special counselling required
              </p>
            )}
          </div>

          {/* Sex */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Sex <span className="text-red-500">*</span></label>
            <select
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm ${errors.sex ? 'border-red-400' : 'border-gray-300'}`}
              value={form.sex}
              onChange={e => handleChange('sex', e.target.value)}
            >
              <option value="">Select...</option>
              <option value="F">Female</option>
              <option value="M">Male</option>
              <option value="I">Intersex</option>
            </select>
            {errors.sex && <p className="text-red-500 text-xs mt-1">{errors.sex}</p>}
          </div>

          {/* Telephone */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              <Phone size={13} className="inline mr-1"/>Telephone
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
              placeholder="e.g. 0712345678"
              value={form.telephone}
              onChange={e => handleChange('telephone', e.target.value)}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              <MapPin size={13} className="inline mr-1"/>Location / Landmark
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
              placeholder="Village, estate, landmark"
              value={form.location}
              onChange={e => handleChange('location', e.target.value)}
            />
          </div>

          {/* Disability */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Disability Status</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
              value={form.disability_status}
              onChange={e => handleChange('disability_status', e.target.value)}
            >
              <option value="0">0 — None</option>
              <option value="1">1 — Visual</option>
              <option value="2">2 — Hearing</option>
              <option value="3">3 — Physical</option>
              <option value="4">4 — Mental/Cognitive</option>
            </select>
          </div>
        </div>

        {/* Visit Type */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Visit Type <span className="text-red-500">*</span></label>
            <div className="flex gap-3">
              {[{val:'1',label:'New Client'},{val:'2',label:'Revisit'}].map(opt => (
                <button key={opt.val}
                  onClick={() => handleChange('visit_type', opt.val)}
                  className={`flex-1 py-2 rounded-lg border-2 text-sm font-semibold transition-colors
                    ${form.visit_type === opt.val ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-600 hover:border-blue-300'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
            {errors.visit_type && <p className="text-red-500 text-xs mt-1">{errors.visit_type}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">First Ever FP User?</label>
            <div className="flex gap-3">
              {[{val:'true',label:'Yes'},{val:'false',label:'No'}].map(opt => (
                <button key={opt.val}
                  onClick={() => handleChange('first_ever_user', opt.val)}
                  className={`flex-1 py-2 rounded-lg border-2 text-sm font-semibold transition-colors
                    ${form.first_ever_user === opt.val ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-600 hover:border-blue-300'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION B: Vitals */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
        <h3 className="font-bold text-gray-700 text-base mb-4 pb-2 border-b border-gray-100">
          📊 Vitals
        </h3>

        {/* Blood Pressure */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Blood Pressure (mmHg) <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Systolic"
              className={`w-28 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-center ${errors.bp_systolic ? 'border-red-400' : 'border-gray-300'}`}
              value={session.vitals.bp_systolic}
              onChange={e => handleVitalChange('bp_systolic', e.target.value)}
            />
            <span className="text-gray-400 font-bold text-lg">/</span>
            <input
              type="number"
              placeholder="Diastolic"
              className={`w-28 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-center ${errors.bp_diastolic ? 'border-red-400' : 'border-gray-300'}`}
              value={session.vitals.bp_diastolic}
              onChange={e => handleVitalChange('bp_diastolic', e.target.value)}
            />
            <span className="text-sm text-gray-400">mmHg</span>
            {session.vitals.bp_category && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${bpColor[session.vitals.bp_category]}`}>
                {session.vitals.bp_category}
              </span>
            )}
          </div>
          {(errors.bp_systolic || errors.bp_diastolic) && (
            <p className="text-red-500 text-xs mt-1">Blood pressure readings are required</p>
          )}
          {session.vitals.bp_category === 'Crisis' && (
            <p className="text-red-700 text-xs mt-2 bg-red-50 p-2 rounded-lg flex items-center gap-1">
              <AlertCircle size={13}/> <strong>Hypertensive Crisis</strong> — refer immediately. Do not initiate hormonal methods.
            </p>
          )}
        </div>

        {/* Weight & Height */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Weight (kg) <span className="text-red-500">*</span></label>
            <input
              type="number"
              placeholder="kg"
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm ${errors.weight_kg ? 'border-red-400' : 'border-gray-300'}`}
              value={session.vitals.weight_kg}
              onChange={e => handleVitalChange('weight_kg', e.target.value)}
            />
            {errors.weight_kg && <p className="text-red-500 text-xs mt-1">Required</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Height (cm) <span className="text-gray-400 font-normal text-xs">optional</span></label>
            <input
              type="number"
              placeholder="cm"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
              value={session.vitals.height_cm}
              onChange={e => handleVitalChange('height_cm', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">BMI</label>
            <div className={`w-full border rounded-lg px-3 py-2 text-sm text-center font-bold
              ${session.vitals.bmi >= 30 ? 'bg-orange-50 border-orange-300 text-orange-700' :
                session.vitals.bmi ? 'bg-green-50 border-green-300 text-green-700' :
                'bg-gray-50 border-gray-200 text-gray-400'}`}>
              {session.vitals.bmi ? (
                <>
                  {session.vitals.bmi}
                  <span className="text-xs font-normal ml-1">
                    {session.vitals.bmi >= 30 ? '⚠ Obese' : session.vitals.bmi >= 25 ? 'Overweight' : 'Normal'}
                  </span>
                </>
              ) : '—'}
            </div>
            {session.vitals.bmi >= 30 && (
              <p className="text-orange-500 text-xs mt-1">BMI ≥30 — MEC trigger active</p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium">
          ← Back to Dashboard
        </button>
        <button
          onClick={handleNext}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow transition-colors">
          Next: Pregnancy Screening <ChevronRight size={18}/>
        </button>
      </div>
    </div>
  )
}