import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Users, Building2, MapPin, ArrowLeft, 
  RefreshCw, Shield, CheckCircle, XCircle,
  BarChart3, Download
} from 'lucide-react'
import { getUsers, getPendingUsers, approveUser, rejectUser, isAdmin } from '../utils/auth.js'
import { getAllFacilityProfiles } from '../utils/facilitySettings.js'
import * as XLSX from 'xlsx'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [pending, setPending] = useState([])
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    if (!isAdmin()) { navigate('/'); return }
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [u, p] = await Promise.all([getUsers(), getPendingUsers()])
    setUsers(u)
    setPending(p)
    setFacilities(getAllFacilityProfiles())
    setLoading(false)
  }

  const handleApprove = async (userId, name) => {
    setActionLoading(userId)
    await approveUser(userId)
    await loadData()
    setActionLoading(null)
  }

  const handleReject = async (userId) => {
    if (!confirm('Reject this user?')) return
    setActionLoading(userId)
    await rejectUser(userId)
    await loadData()
    setActionLoading(null)
  }

  // Match users with their facility profiles
  const enrichedUsers = users.map(u => {
    const key = u.name?.toLowerCase().replace(/\s+/g, '_')
    const facility = facilities.find(f => f.username === key) || {}
    return { ...u, ...facility }
  })

  // Stats
  const byCounty = enrichedUsers.reduce((acc, u) => {
    if (u.county) acc[u.county] = (acc[u.county] || 0) + 1
    return acc
  }, {})

  const byCadre = enrichedUsers.reduce((acc, u) => {
    const cadre = u.provider_cadre || u.cadre || 'Unknown'
    acc[cadre] = (acc[cadre] || 0) + 1
    return acc
  }, {})

  const exportToExcel = () => {
    const rows = enrichedUsers.map(u => ({
      'Provider Name': u.name || u.provider_name || '',
      'Role': u.role || '',
      'Cadre': u.provider_cadre || u.cadre || '',
      'Facility Name': u.facility_name || u.facility || '',
      'KHIS Code': u.facility_code || '',
      'County': u.county || '',
      'Sub-County': u.sub_county || '',
      'Ward': u.ward || '',
      'Phone': u.phone || '',
      'Reg No': u.provider_number || '',
      'Status': u.status || 'approved',
      'Login Date': u.loginTime ? new Date(u.loginTime).toLocaleDateString('en-KE') : '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = Object.keys(rows[0] || {}).map(() => ({ wch: 20 }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Providers')
    XLSX.writeFile(wb, `AfyaMEC_Providers_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <RefreshCw size={24} className="animate-spin text-teal-600"/>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Shield size={24} className="text-teal-600"/> Admin Dashboard
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Platform overview — {users.length} providers, {pending.length} pending
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <RefreshCw size={14}/> Refresh
          </button>
          <button onClick={exportToExcel}
            className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold">
            <Download size={14}/> Export Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { key: 'overview', label: '📊 Overview' },
          { key: 'providers', label: `👩‍⚕️ Providers (${users.length})` },
          { key: 'pending', label: `⏳ Pending (${pending.length})` },
          { key: 'facilities', label: `🏥 Facilities (${facilities.length})` },
        ].map(tab => (
          <button key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px
              ${activeTab === tab.key
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
            {tab.key === 'pending' && pending.length > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {pending.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Providers', value: users.length, color: 'text-teal-600', bg: 'bg-teal-50' },
              { label: 'Pending Approval', value: pending.length, color: 'text-orange-600', bg: 'bg-orange-50' },
              { label: 'Facilities Configured', value: facilities.length, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Counties Covered', value: Object.keys(byCounty).length, color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map(card => (
              <div key={card.label} className={`${card.bg} rounded-xl p-4 border border-gray-100`}>
                <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-xs text-gray-500 mt-1">{card.label}</p>
              </div>
            ))}
          </div>

          {/* By County */}
          {Object.keys(byCounty).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-teal-500"/> Providers by County
              </h3>
              <div className="space-y-2">
                {Object.entries(byCounty).sort((a,b) => b[1]-a[1]).map(([county, count]) => (
                  <div key={county} className="flex items-center gap-3">
                    <div className="w-28 text-xs font-medium text-gray-600 text-right">{county}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div className="bg-teal-500 h-4 rounded-full"
                        style={{width: `${(count / users.length) * 100}%`}}/>
                    </div>
                    <div className="w-6 text-xs text-gray-500">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* By Cadre */}
          {Object.keys(byCadre).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Users size={16} className="text-blue-500"/> Providers by Cadre
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(byCadre).sort((a,b) => b[1]-a[1]).map(([cadre, count]) => (
                  <div key={cadre} className="bg-blue-50 rounded-lg px-3 py-2">
                    <p className="text-lg font-bold text-blue-600">{count}</p>
                    <p className="text-xs text-gray-600">{cadre}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PROVIDERS */}
      {activeTab === 'providers' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {enrichedUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No providers registered yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Provider</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Facility</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">County</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Cadre</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
                </tr>
              </thead>
              <tbody>
                {enrichedUsers.map((u, i) => (
                  <tr key={u.id || i} className={`border-b border-gray-100 hover:bg-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.phone || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{u.facility_name || u.facility || '—'}</p>
                      <p className="text-xs text-gray-400">{u.facility_code ? `KHIS: ${u.facility_code}` : ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-600">{u.county || '—'}</p>
                      <p className="text-xs text-gray-400">{u.sub_county || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.provider_cadre || u.cadre || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                        ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>
                        {u.role || 'provider'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* PENDING */}
      {activeTab === 'pending' && (
        <div className="space-y-3">
          {pending.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
              <CheckCircle size={32} className="mx-auto mb-2 opacity-30"/>
              No pending approvals
            </div>
          ) : pending.map(u => (
            <div key={u.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-bold text-gray-800">{u.name}</p>
                  <div className="grid grid-cols-2 gap-x-4 mt-2 text-xs text-gray-500">
                    <p>🏥 {u.facility || '—'}</p>
                    <p>📍 {u.county || '—'}</p>
                    <p>👤 {u.cadre || '—'}</p>
                    <p>📱 {u.phone || '—'}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleApprove(u.id, u.name)}
                    disabled={actionLoading === u.id}
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors disabled:opacity-50">
                    {actionLoading === u.id ? <RefreshCw size={12} className="animate-spin"/> : <CheckCircle size={12}/>}
                    Approve
                  </button>
                  <button onClick={() => handleReject(u.id)}
                    disabled={actionLoading === u.id}
                    className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors disabled:opacity-50">
                    <XCircle size={12}/> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FACILITIES */}
      {activeTab === 'facilities' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {facilities.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Building2 size={32} className="mx-auto mb-2 opacity-30"/>
              No facility profiles saved yet. Providers need to complete their facility settings after logging in.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Facility</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Location</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Provider</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">KHIS Code</th>
                </tr>
              </thead>
              <tbody>
                {facilities.map((f, i) => (
                  <tr key={i} className={`border-b border-gray-100 hover:bg-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">{f.facility_name || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-600">{f.county || '—'}</p>
                      <p className="text-xs text-gray-400">{[f.sub_county, f.ward].filter(Boolean).join(', ')}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{f.provider_name || f.username || '—'}</p>
                      <p className="text-xs text-gray-400">{f.provider_cadre || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {f.facility_code || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}