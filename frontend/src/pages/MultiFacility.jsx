import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, Plus, Globe, CheckCircle, AlertTriangle } from 'lucide-react'
import { getFacilitySettings, saveFacilitySettings } from '../utils/facilitySettings.js'

const FACILITY_NETWORK_KEY = 'digital_mec_network'

export const getFacilityNetwork = () => {
  try {
    const stored = localStorage.getItem(FACILITY_NETWORK_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return { facilities: [], deployment_type: 'single' }
}

export const saveFacilityNetwork = (network) => {
  localStorage.setItem(FACILITY_NETWORK_KEY, JSON.stringify(network))
}

export default function MultiFacility() {
  const navigate = useNavigate()
  const [network, setNetwork] = useState(getFacilityNetwork())
  const currentFacility = getFacilitySettings()
  const [showForm, setShowForm] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newFacility, setNewFacility] = useState({
    name: '', code: '', county: '', contact: ''
  })

  const handleDeploymentType = (type) => {
    const updated = { ...network, deployment_type: type }
    setNetwork(updated)
    saveFacilityNetwork(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleAddFacility = () => {
    if (!newFacility.name || !newFacility.code) return
    const updated = {
      ...network,
      facilities: [...network.facilities, { ...newFacility, id: Date.now().toString() }]
    }
    setNetwork(updated)
    saveFacilityNetwork(updated)
    setNewFacility({ name: '', code: '', county: '', contact: '' })
    setShowForm(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleRemoveFacility = (id) => {
    const updated = {
      ...network,
      facilities: network.facilities.filter(f => f.id !== id)
    }
    setNetwork(updated)
    saveFacilityNetwork(updated)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate('/settings')}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-4">
        <ArrowLeft size={15}/> Back to Settings
      </button>

      <div className="mb-5">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Globe className="text-blue-600" size={24}/> Multi-Facility Setup
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Configure how this platform serves one or multiple facilities
        </p>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-green-700 text-sm font-medium flex items-center gap-2">
          <CheckCircle size={14}/> Settings saved
        </div>
      )}

      {/* Deployment Type */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
        <h3 className="font-bold text-gray-700 mb-3">Deployment Type</h3>
        <div className="grid grid-cols-1 gap-3">
          {[
            {
              type: 'single',
              title: '🏥 Single Facility',
              desc: 'One installation serves one facility. Simplest setup. Current mode.',
              recommended: true,
            },
            {
              type: 'network',
              title: '🌐 Facility Network',
              desc: 'One server shared by multiple facilities. Each facility sees only their own clients.',
              recommended: false,
            },
            {
              type: 'cloud',
              title: '☁️ Cloud Hosted (Coming Soon)',
              desc: 'Hosted centrally — any facility logs in from anywhere. Requires deployment.',
              recommended: false,
              disabled: true,
            },
          ].map(opt => (
            <div key={opt.type}
              onClick={() => !opt.disabled && handleDeploymentType(opt.type)}
              className={`p-4 rounded-xl border-2 transition-all
                ${opt.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                ${network.deployment_type === opt.type
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                    {opt.title}
                    {opt.recommended && (
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                        Recommended
                      </span>
                    )}
                    {opt.disabled && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                        Coming Soon
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                </div>
                {network.deployment_type === opt.type && (
                  <CheckCircle size={18} className="text-blue-600 flex-shrink-0"/>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Facility */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
        <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
          <Building2 size={16} className="text-blue-500"/> This Facility
        </h3>
        {currentFacility.facility_name ? (
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="font-bold text-blue-800">{currentFacility.facility_name}</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Code: {currentFacility.facility_code || 'Not set'} |
              {[currentFacility.sub_county, currentFacility.county].filter(Boolean).join(', ')}
            </p>
            <p className="text-xs text-blue-600">
              Provider: {currentFacility.provider_name || 'Not set'}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 rounded-lg p-3">
            <AlertTriangle size={16}/>
            <p className="text-sm">Facility not configured.
              <button onClick={() => navigate('/settings')} className="underline ml-1">
                Configure now
              </button>
            </p>
          </div>
        )}
      </div>

      {/* Network Facilities (only for network mode) */}
      {network.deployment_type === 'network' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <Globe size={16} className="text-blue-500"/> Network Facilities
            </h3>
            <button onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg">
              <Plus size={14}/> Add Facility
            </button>
          </div>

          {showForm && (
            <div className="bg-gray-50 rounded-lg p-4 mb-3 border border-gray-200">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="col-span-2">
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Facility name *"
                    value={newFacility.name}
                    onChange={e => setNewFacility(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="KHIS Code *"
                  value={newFacility.code}
                  onChange={e => setNewFacility(p => ({ ...p, code: e.target.value }))}
                />
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="County"
                  value={newFacility.county}
                  onChange={e => setNewFacility(p => ({ ...p, county: e.target.value }))}
                />
                <input
                  className="col-span-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Contact phone"
                  value={newFacility.contact}
                  onChange={e => setNewFacility(p => ({ ...p, contact: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddFacility}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm">
                  Add
                </button>
                <button onClick={() => setShowForm(false)}
                  className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {network.facilities.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">
              No network facilities added yet
            </p>
          ) : (
            <div className="space-y-2">
              {network.facilities.map(f => (
                <div key={f.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{f.name}</p>
                    <p className="text-xs text-gray-500">
                      Code: {f.code} {f.county && `| ${f.county}`}
                    </p>
                  </div>
                  <button onClick={() => handleRemoveFacility(f.id)}
                    className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded hover:bg-red-50">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-bold text-blue-800 text-sm mb-2">📋 Multi-Facility Roadmap</h3>
        <div className="space-y-1.5 text-xs text-blue-700">
          <p>✅ <strong>Phase 1 (Current):</strong> Single facility with facility code tagging on all records</p>
          <p>✅ <strong>Phase 2 (Current):</strong> Network mode — multiple facilities, shared database</p>
          <p>⏳ <strong>Phase 3 (Deployment):</strong> Cloud hosting — facilities access via browser from anywhere</p>
          <p>⏳ <strong>Phase 4 (Future):</strong> Role-based access per facility with separate logins</p>
          <p>⏳ <strong>Phase 5 (Future):</strong> County-level dashboard aggregating all facilities</p>
        </div>
      </div>
    </div>
  )
}