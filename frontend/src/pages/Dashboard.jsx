import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity, Users, Plus, FileText, TrendingUp,
  Calendar, Pill, Building2, AlertTriangle, BarChart3,
  Clock, CheckCircle, ArrowRight, BookOpen, UserX
} from 'lucide-react'
import { getFacilitySettings, isFacilityConfigured } from '../utils/facilitySettings.js'
import { getCurrentUser } from '../utils/auth.js'

const METHOD_SHORT = {
  COC:'COC', POP:'POP', DMPA_IM:'DMPA-IM', DMPA_SC:'DMPA-SC',
  NET_EN:'NET-EN', IMPLANT:'Implant', CU_IUD:'Cu-IUD', LNG_IUS:'LNG-IUS',
  CONDOM_M:'Condom(M)', CONDOM_F:'Condom(F)', LAM:'LAM', FAM:'FAM',
  BTL:'BTL', VASECTOMY:'Vasectomy', EC_PILL:'ECP', EC_IUD:'EC-IUD',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const facility = getFacilitySettings()
  const currentUser = getCurrentUser()
  const [stats, setStats] = useState({
    total: 0, today: 0, thisWeek: 0, thisMonth: 0, overdue: 0,
    topMethod: '—', newThisMonth: 0, revisitsThisMonth: 0,
    methods: {}, recent: [], returning: []
  })
  const [todaySessions, setTodaySessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [backendOnline, setBackendOnline] = useState(true)

  // Assuming completedModules could be pulled from local storage or an API later
  const completedModules = parseInt(localStorage.getItem('afyamec_completed_modules') || '0', 10)

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true)
      try {
        const [clientsRes, visitsRes] = await Promise.all([
          fetch('/api/clients/', { headers: { Authorization: `Bearer ${localStorage.getItem('afyamec_auth_token')}` } }),
          fetch('/api/visits/', { headers: { Authorization: `Bearer ${localStorage.getItem('afyamec_auth_token')}` } })
        ])

        const clients = clientsRes.ok ? await clientsRes.json() : []
        const visits = visitsRes.ok ? await visitsRes.json() : []
        setBackendOnline(true)

        const today = new Date().toDateString()
        const thisWeekStart = new Date()
        thisWeekStart.setDate(thisWeekStart.getDate() - 7)
        const thisMonthStart = new Date()
        thisMonthStart.setDate(1)

        const todayVisits = visits.filter(v =>
          new Date(v.visit_date).toDateString() === today
        )
        const weekVisits = visits.filter(v =>
          new Date(v.visit_date) >= thisWeekStart
        )
        const monthVisits = visits.filter(v =>
          new Date(v.visit_date) >= thisMonthStart
        )
        const overdue = clients.filter(c => {
          if (!c.last_visit) return false
          const weeks = (Date.now() - new Date(c.last_visit)) / (1000 * 60 * 60 * 24 * 7)
          return weeks >= 16
        })

        // Method mix for this month
        const methodCounts = {}
        monthVisits.forEach(v => {
          if (v.primary_method) {
            methodCounts[v.primary_method] = (methodCounts[v.primary_method] || 0) + 1
          }
        })
        const topMethodEntry = Object.entries(methodCounts).sort((a,b) => b[1]-a[1])[0]

        setStats({
          total: clients.length,
          today: todayVisits.length,
          thisWeek: weekVisits.length,
          thisMonth: monthVisits.length,
          overdue: overdue.length,
          topMethod: topMethodEntry ? `${topMethodEntry[0]} (${topMethodEntry[1]})` : '—',
          newThisMonth: monthVisits.filter(v => v.visit_type === 1).length,
          revisitsThisMonth: monthVisits.filter(v => v.visit_type === 2).length,
          methods: methodCounts,
          recent: clients.slice(0, 4),
          returning: overdue.slice(0, 3)
        })

        setTodaySessions(todayVisits.slice(0, 5))
      } catch (e) {
        console.error('Stats error:', e)
        setBackendOnline(false)
      }
      setLoading(false)
    }

    loadStats()
    const interval = setInterval(loadStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const statCards = [
    { label: 'Today', value: loading ? '...' : stats.today, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', icon: <Calendar size={18} className="text-teal-400"/> },
    { label: 'This Month', value: loading ? '...' : stats.thisMonth, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', icon: <TrendingUp size={18} className="text-green-400"/> },
    { label: 'Total Clients', value: loading ? '...' : stats.total, color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-100', icon: <Users size={18} className="text-teal-500"/> },
    { label: 'Overdue', value: loading ? '...' : stats.overdue, color: stats.overdue > 0 ? 'text-amber-600' : 'text-gray-400', bg: stats.overdue > 0 ? 'bg-amber-50' : 'bg-gray-50', border: stats.overdue > 0 ? 'border-amber-100' : 'border-gray-100', icon: <Clock size={18} className={stats.overdue > 0 ? 'text-amber-400' : 'text-gray-300'}/> },
  ]

  return (
    <div className="pb-4">

      {/* Greeting Banner */}
      <div className="rounded-2xl p-5 mb-5 text-white"
        style={{background: 'linear-gradient(135deg, #0d7377 0%, #14a044 100%)'}}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white text-opacity-80 text-sm">
              {new Date().toLocaleDateString('en-KE', {
                weekday:'long', day:'numeric', month:'long', year:'numeric'
              })}
            </p>
            <h1 className="text-2xl font-bold mt-1">
              {greeting}, {currentUser?.name?.split(' ')[0] || 'Provider'} 👋
            </h1>
            <p className="text-white text-opacity-75 text-sm mt-1">
              {facility.facility_name || 'AfyaMEC — Digital MEC Platform'}
            </p>
          </div>
          <div className="text-4xl opacity-50">🌿</div>
        </div>
      </div>

      {/* Backend status */}
      {!backendOnline && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-3 mb-4 flex items-center gap-2">
          <AlertTriangle size={16} className="text-yellow-600"/>
          <p className="text-yellow-700 text-sm">
            <strong>Offline mode</strong> — sessions will save locally and sync when reconnected
          </p>
        </div>
      )}

      {/* Facility Banner */}
      {isFacilityConfigured() ? (
        <div className="bg-blue-700 text-white rounded-xl p-4 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 size={22} className="text-blue-200 flex-shrink-0"/>
            <div>
              <p className="font-bold">{facility.facility_name}</p>
              <p className="text-blue-200 text-xs">
                {[facility.ward, facility.sub_county, facility.county].filter(Boolean).join(', ')}
                {facility.facility_code && ` | Code: ${facility.facility_code}`}
              </p>
              {facility.provider_name && (
                <p className="text-blue-200 text-xs mt-0.5">
                  Provider: {facility.provider_name}
                  {facility.provider_cadre && ` (${facility.provider_cadre})`}
                </p>
              )}
            </div>
          </div>
          <button onClick={() => navigate('/settings')}
            className="text-blue-200 hover:text-white text-xs underline flex-shrink-0">
            Edit
          </button>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-yellow-600 flex-shrink-0"/>
            <div>
              <p className="font-semibold text-yellow-800 text-sm">Facility not configured</p>
              <p className="text-yellow-600 text-xs mt-0.5">
                Add facility details for complete MOH 512 records
              </p>
            </div>
          </div>
          <button onClick={() => navigate('/settings')}
            className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0">
            Configure
          </button>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {statCards.map(card => (
          <div key={card.label} className={`${card.bg} rounded-xl p-4 border ${card.border}`}>
            <div className="flex items-center justify-between mb-1">
              {card.icon}
            </div>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Today's Activity */}
      {todaySessions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2">
              📋 Today's Sessions ({todaySessions.length})
            </h3>
            <button onClick={() => navigate('/clients')}
              className="text-xs text-teal-600 hover:underline">
              View all →
            </button>
          </div>
          <div className="space-y-2">
            {todaySessions.map((v, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{background: '#0d7377'}}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {v.client_name || 'Client'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {v.primary_method || 'No method'} ·
                      {v.visit_type === 1 ? ' New' : ' Revisit'}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(v.visit_date).toLocaleTimeString('en-KE', {hour:'2-digit', minute:'2-digit'})}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Action */}
      <button
        onClick={() => { window.location.href = '/session/registration' }}
        className="w-full flex items-center justify-center gap-3 text-white font-bold py-4 px-6 rounded-2xl text-lg shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 mb-4"
        style={{background: 'linear-gradient(135deg, #0d7377 0%, #14a044 100%)'}}>
        <Plus size={24}/> Start New Client Session
      </button>

      <button
        onClick={() => navigate('/anonymous-entry')}
        className="w-full flex items-center justify-center gap-2 bg-white border-2 border-dashed border-teal-300 text-teal-700 font-semibold py-3 px-6 rounded-2xl text-sm hover:bg-teal-50 transition-colors mb-4">
        <UserX size={18}/> Anonymous Quick Entry (Client declined biodata)
      </button>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { icon: <Users size={20}/>, label: 'Client Records', path: '/clients', bg: 'bg-teal-50', border: 'border-teal-100', text: 'text-teal-700' },
          { icon: <BarChart3 size={20}/>, label: 'Reports', path: '/reports', bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-700' },
          { icon: <FileText size={20}/>, label: 'Settings', path: '/settings', bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700' },
        ].map(item => (
          <button key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${item.bg} ${item.border} ${item.text} hover:shadow-sm transition-all`}>
            {item.icon}
            <span className="text-xs font-semibold text-center">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Tools Quick Access */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <button onClick={() => navigate('/mec-wheel')}
          className="flex items-center gap-2 p-3 rounded-xl text-white transition-all hover:shadow-md"
          style={{background:'linear-gradient(135deg,#0d7377,#0f766e)'}}>
          <span className="text-2xl">🎡</span>
          <div className="text-left">
            <p className="font-bold text-sm">MEC Wheel</p>
            <p className="text-xs text-teal-100">WHO eligibility criteria</p>
          </div>
        </button>
        <button onClick={() => navigate('/methods')}
          className="flex items-center gap-2 p-3 rounded-xl text-white transition-all hover:shadow-md"
          style={{background:'linear-gradient(135deg,#7c3aed,#2563eb)'}}>
          <span className="text-2xl">📚</span>
          <div className="text-left">
            <p className="font-bold text-sm">Methods Library</p>
            <p className="text-xs" style={{color:'#c4b5fd'}}>Full guide + switching</p>
          </div>
        </button>
      </div>

      <button onClick={() => navigate('/mentor')}
        className="w-full flex items-center gap-3 p-4 rounded-2xl text-white mt-3 transition-all hover:shadow-lg"
        style={{background:'linear-gradient(135deg,#0d7377 0%,#14a044 50%,#2563eb 100%)'}}>
        <span className="text-3xl">🌿</span>
        <div className="text-left">
          <p className="font-bold">Afya Mentor — Provider Training</p>
          <p className="text-xs opacity-80">
            Microlearning · AI Simulations · Peer Learning · {completedModules || 0} modules completed
          </p>
        </div>
      </button>

      {/* Overdue Alert */}
      {stats.overdue > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4 mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-orange-700 text-sm flex items-center gap-2">
              <Clock size={15}/> {stats.overdue} Overdue Client{stats.overdue !== 1 ? 's' : ''}
            </h3>
            <button onClick={() => navigate('/clients')}
              className="text-xs text-orange-600 hover:text-orange-800 flex items-center gap-1">
              View all <ArrowRight size={12}/>
            </button>
          </div>
          {stats.returning.map(c => (
            <div key={c.id}
              onClick={() => navigate(`/clients/${c.id}`)}
              className="flex items-center justify-between py-1.5 cursor-pointer hover:bg-orange-100 rounded px-1">
              <span className="text-sm font-medium text-gray-700">{c.first_name} {c.last_name}</span>
              <span className="text-xs text-orange-500">
                {c.last_method ? METHOD_SHORT[c.last_method] : '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Method Mix */}
      {Object.keys(stats.methods).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2">
              <Pill size={15} className="text-blue-500"/> Method Mix (This Month)
            </h3>
            <button onClick={() => navigate('/reports')}
              className="text-xs text-blue-500 flex items-center gap-1">
              Full report <ArrowRight size={12}/>
            </button>
          </div>
          <div className="space-y-2">
            {Object.entries(stats.methods)
              .sort((a,b) => b[1]-a[1])
              .slice(0, 5)
              .map(([method, count]) => {
                const total = Object.values(stats.methods).reduce((a,b) => a+b, 0)
                const pct = Math.round((count/total)*100)
                return (
                  <div key={method} className="flex items-center gap-2">
                    <div className="w-16 text-xs font-medium text-gray-500 text-right">
                      {METHOD_SHORT[method] || method}
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div className="bg-blue-500 h-4 rounded-full flex items-center justify-end pr-1.5"
                        style={{ width: `${pct}%`, minWidth: '1.5rem' }}>
                        <span className="text-white text-xs font-bold">{pct}%</span>
                      </div>
                    </div>
                    <div className="w-6 text-xs text-gray-400">{count}</div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Recent Clients */}
      {stats.recent.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2">
              <Users size={15} className="text-blue-500"/> Recent Clients
            </h3>
            <button onClick={() => navigate('/clients')}
              className="text-xs text-blue-500 flex items-center gap-1">
              View all <ArrowRight size={12}/>
            </button>
          </div>
          <div className="space-y-2">
            {stats.recent.map(c => (
              <div key={c.id}
                onClick={() => navigate(`/clients/${c.id}`)}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 rounded px-1">
                <div>
                  <span className="font-semibold text-gray-800 text-sm">
                    {c.first_name} {c.last_name}
                  </span>
                  <span className="text-gray-400 text-xs ml-2">{c.age}y</span>
                </div>
                <div className="flex items-center gap-2">
                  {c.last_method && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                      {METHOD_SHORT[c.last_method]}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {c.last_visit
                      ? new Date(c.last_visit).toLocaleDateString('en-KE', { day:'numeric', month:'short' })
                      : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BCS+ Reference */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-blue-800 text-sm flex items-center gap-2">
            <FileText size={15}/> BCS+ Documentation
          </h3>
          <button onClick={() => navigate('/bcs-algorithm')}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium underline flex items-center gap-1">
            View full algorithm →
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { stage: '1', title: 'Pre-Choice', desc: 'Relationship, pregnancy check, display cards', color: 'blue' },
            { stage: '2', title: 'Method Choice', desc: 'Present methods, client chooses, confirm eligibility', color: 'green' },
            { stage: '3', title: 'Post-Choice', desc: 'Counsel on method, check comprehension, provide', color: 'purple' },
            { stage: '4', title: 'STI/HIV Screening', desc: 'Risk assessment, testing, referrals, follow-up', color: 'orange' },
          ].map(s => (
            <button key={s.stage}
              onClick={() => navigate('/bcs-algorithm')}
              className="bg-white rounded-lg px-3 py-2 border border-blue-100 text-left hover:border-blue-300 transition-colors">
              <p className="text-xs font-bold text-blue-700">Stage {s.stage}: {s.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
            </button>
          ))}
        </div>
        <button onClick={() => navigate('/resources')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
          <BookOpen size={15}/> Browse All Resources
        </button>
      </div>
    </div>
  )
}