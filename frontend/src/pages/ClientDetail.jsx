import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getClient } from '../utils/api.js'
import { User, Calendar, Pill, ArrowLeft, RefreshCw, AlertCircle, Edit2, Save, X, Phone, MapPin, CheckCircle } from 'lucide-react'

const METHOD_SHORT = {
  COC:'COC', POP:'POP', DMPA_IM:'DMPA-IM', DMPA_SC:'DMPA-SC',
  NET_EN:'NET-EN', IMPLANT:'Implant', CU_IUD:'Cu-IUD', LNG_IUS:'LNG-IUS',
  CONDOM_M:'Condom(M)', CONDOM_F:'Condom(F)', LAM:'LAM', FAM:'FAM',
  BTL:'BTL', VASECTOMY:'Vasectomy', EC_PILL:'ECP', EC_IUD:'EC-IUD',
}

const METHOD_FULL = {
  COC:'Combined Oral Contraceptive', POP:'Progestogen-Only Pill',
  DMPA_IM:'DMPA Injection (Depo)', DMPA_SC:'DMPA-SC (Sayana Press)',
  NET_EN:'NET-EN (Noristerat)', IMPLANT:'Implant (Implanon/Jadelle)',
  CU_IUD:'Copper IUD', LNG_IUS:'LNG-IUS (Mirena)',
  CONDOM_M:'Male Condom', CONDOM_F:'Female Condom',
  LAM:'LAM', FAM:'FAM / Cycle Beads',
  BTL:'Female Sterilisation (BTL)', VASECTOMY:'Vasectomy',
}

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    const load = async () => {
      const result = await getClient(id)
      if (result.success) {
        setClient(result.data)
        setEditForm({
          first_name: result.data.first_name,
          last_name: result.data.last_name,
          telephone: result.data.telephone || '',
          location: result.data.location || '',
          age: result.data.age,
          sex: result.data.sex,
        })
      }
      setLoading(false)
    }
    load()
  }, [id])

  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })
      if (res.ok) {
        const updated = await res.json()
        setClient(prev => ({ ...prev, ...editForm }))
        setEditing(false)
        setSaveMsg('✅ Client details updated successfully')
        setTimeout(() => setSaveMsg(''), 3000)
      }
    } catch (e) {
      setSaveMsg('❌ Failed to update — check connection')
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="text-center py-16 text-gray-400">
      <RefreshCw size={32} className="animate-spin mx-auto mb-3"/>
      Loading client record...
    </div>
  )

  if (!client) return (
    <div className="text-center py-16 text-gray-400">
      <p className="font-semibold">Client not found</p>
      <button onClick={() => navigate('/clients')}
        className="mt-3 text-blue-600 hover:underline text-sm">
        ← Back to records
      </button>
    </div>
  )

  const lastVisit = client.visits?.[0]
  const lastVisitDate = lastVisit ? new Date(lastVisit.visit_date) : null
  const weeksAgo = lastVisitDate
    ? (Date.now() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
    : 0
  const isOverdue = weeksAgo >= 16

  const returnDate = lastVisit?.return_date
    ? new Date(lastVisit.return_date)
    : null
  const isReturnOverdue = returnDate && returnDate < new Date()

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate('/clients')}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-4">
        <ArrowLeft size={15}/> Back to Client Records
      </button>

      {/* Save message */}
      {saveMsg && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium
          ${saveMsg.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {saveMsg}
        </div>
      )}

      {/* Overdue Alert */}
      {(isOverdue || isReturnOverdue) && (
        <div className="bg-orange-50 border border-orange-300 rounded-xl p-4 mb-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-orange-500 flex-shrink-0 mt-0.5"/>
          <div>
            <p className="font-bold text-orange-700">
              {isReturnOverdue ? '⚠️ Return Date Overdue' : '⚠️ Client Overdue for Follow-up'}
            </p>
            <p className="text-orange-600 text-sm mt-1">
              {isReturnOverdue
                ? `Return date was ${returnDate.toLocaleDateString('en-KE')} — client has not returned.`
                : `Client has not been seen in ${Math.round(weeksAgo)} weeks.`}
            </p>
            <button
              onClick={() => { window.location.href = '/session/registration' }}
              className="mt-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
              + Start Follow-up Visit
            </button>
          </div>
        </div>
      )}

      {/* Client Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <User size={24} className="text-blue-600"/>
            </div>
            <div>
              {editing ? (
                <div className="flex gap-2">
                  <input
                    className="border border-gray-300 rounded-lg px-2 py-1 text-sm font-bold w-28 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={editForm.first_name}
                    onChange={e => setEditForm(p => ({ ...p, first_name: e.target.value }))}
                    placeholder="First name"
                  />
                  <input
                    className="border border-gray-300 rounded-lg px-2 py-1 text-sm font-bold w-28 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={editForm.last_name}
                    onChange={e => setEditForm(p => ({ ...p, last_name: e.target.value }))}
                    placeholder="Last name"
                  />
                </div>
              ) : (
                <h2 className="text-xl font-bold text-gray-800">
                  {client.first_name} {client.last_name}
                </h2>
              )}
              <p className="text-gray-400 text-sm">{client.service_reg_number}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button onClick={() => setEditing(false)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm">
                  <X size={14}/> Cancel
                </button>
                <button onClick={handleSaveEdit} disabled={saving}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">
                  {saving ? <RefreshCw size={14} className="animate-spin"/> : <Save size={14}/>}
                  Save
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm">
                  <Edit2 size={14}/> Edit
                </button>
                <button
                  onClick={() => { window.location.href = '/session/registration' }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors">
                  + New Visit
                </button>
              </>
            )}
          </div>
        </div>

        {/* Client Details */}
        <div className="grid grid-cols-2 gap-3">
          {/* Age */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Age</p>
            {editing ? (
              <input type="number"
                className="border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={editForm.age}
                onChange={e => setEditForm(p => ({ ...p, age: e.target.value }))}
              />
            ) : (
              <p className="font-semibold text-gray-700">{client.age} years</p>
            )}
          </div>

          {/* Sex */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Sex</p>
            {editing ? (
              <select
                className="border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={editForm.sex}
                onChange={e => setEditForm(p => ({ ...p, sex: e.target.value }))}>
                <option value="F">Female</option>
                <option value="M">Male</option>
                <option value="I">Intersex</option>
              </select>
            ) : (
              <p className="font-semibold text-gray-700">
                {client.sex === 'F' ? 'Female' : client.sex === 'M' ? 'Male' : client.sex}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <Phone size={10}/> Telephone
            </p>
            {editing ? (
              <input
                className="border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={editForm.telephone}
                onChange={e => setEditForm(p => ({ ...p, telephone: e.target.value }))}
                placeholder="Phone number"
              />
            ) : (
              <p className="font-semibold text-gray-700">{client.telephone || '—'}</p>
            )}
          </div>

          {/* Location */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <MapPin size={10}/> Location
            </p>
            {editing ? (
              <input
                className="border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={editForm.location}
                onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))}
                placeholder="Location / landmark"
              />
            ) : (
              <p className="font-semibold text-gray-700">{client.location || '—'}</p>
            )}
          </div>
        </div>

        {/* Current Method & Return Date */}
        {lastVisit && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
            <div className={`rounded-lg p-3 ${lastVisit.primary_method ? 'bg-green-50' : 'bg-gray-50'}`}>
              <p className="text-xs text-gray-400 mb-1">Current Method</p>
              <p className="font-semibold text-green-700 text-sm">
                {METHOD_FULL[lastVisit.primary_method] || lastVisit.primary_method || '—'}
              </p>
            </div>
            <div className={`rounded-lg p-3 ${isReturnOverdue ? 'bg-red-50' : 'bg-blue-50'}`}>
              <p className="text-xs text-gray-400 mb-1">Return Date</p>
              <p className={`font-semibold text-sm ${isReturnOverdue ? 'text-red-600' : 'text-blue-700'}`}>
                {returnDate
                  ? returnDate.toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric' })
                  : '—'}
                {isReturnOverdue && <span className="ml-1 text-xs">⚠ Overdue</span>}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Visit History */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
          <Calendar size={16} className="text-blue-500"/>
          Visit History
          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full ml-1">
            {client.visits?.length || 0} visits
          </span>
        </h3>

        {(!client.visits || client.visits.length === 0) ? (
          <p className="text-center text-gray-400 py-6 text-sm">No visits recorded yet</p>
        ) : (
          <div className="space-y-2">
            {client.visits.map((v, idx) => {
              const vDate = new Date(v.visit_date)
              const vReturn = v.return_date ? new Date(v.return_date) : null
              const vReturnOverdue = vReturn && vReturn < new Date() && idx === 0

              return (
                <div key={v.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors
                    ${idx === 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                      ${idx === 0 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {client.visits.length - idx}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-700 text-sm">
                        {vDate.toLocaleDateString('en-KE', {
                          weekday:'short', year:'numeric', month:'short', day:'numeric'
                        })}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-2">
                        <span>{v.visit_type === 1 ? 'New Client' : 'Revisit'}</span>
                        {vReturn && (
                          <span className={vReturnOverdue ? 'text-red-500 font-medium' : 'text-blue-500'}>
                            → Return: {vReturn.toLocaleDateString('en-KE', { day:'numeric', month:'short' })}
                            {vReturnOverdue && ' ⚠'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {v.primary_method && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                      <Pill size={10}/> {METHOD_SHORT[v.primary_method] || v.primary_method}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}