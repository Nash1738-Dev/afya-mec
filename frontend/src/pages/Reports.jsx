import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Users, Pill, Calendar, Download, RefreshCw, ArrowLeft, BarChart3, FileText, Send } from 'lucide-react'
import API, { exportMOH512 } from '../utils/api.js'

const METHOD_SHORT = {
  COC:'COC', POP:'POP', DMPA_IM:'DMPA-IM', DMPA_SC:'DMPA-SC',
  NET_EN:'NET-EN', IMPLANT:'Implant', CU_IUD:'Cu-IUD', LNG_IUS:'LNG-IUS',
  CONDOM_M:'Condom(M)', CONDOM_F:'Condom(F)', LAM:'LAM', FAM:'FAM',
  BTL:'BTL', VASECTOMY:'Vasectomy', EC_PILL:'ECP', EC_IUD:'EC-IUD',
}

const METHOD_COLORS = {
  COC:'bg-pink-500', POP:'bg-pink-300', DMPA_IM:'bg-blue-500',
  DMPA_SC:'bg-blue-400', NET_EN:'bg-blue-300', IMPLANT:'bg-purple-500',
  CU_IUD:'bg-green-500', LNG_IUS:'bg-green-400', CONDOM_M:'bg-yellow-500',
  CONDOM_F:'bg-yellow-400', LAM:'bg-orange-400', FAM:'bg-orange-300',
  BTL:'bg-red-500', VASECTOMY:'bg-red-400', EC_PILL:'bg-gray-500',
  EC_IUD:'bg-gray-400',
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function Reports() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')

  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, vRes] = await Promise.all([
          API.get('/clients/'),
          API.get('/visits/')
        ])
        setClients(cRes.data)
        setVisits(vRes.data)
      } catch (e) {
        console.error('Load error:', e)
      }
      setLoading(false)
    }
    load()
  }, [])

  const now = new Date()

  const stats = useMemo(() => {
    // Method mix
    const methodCounts = {}
    clients.forEach(c => {
      if (c.last_method) {
        methodCounts[c.last_method] = (methodCounts[c.last_method] || 0) + 1
      }
    })
    const totalWithMethod = Object.values(methodCounts).reduce((a, b) => a + b, 0)

    // Monthly trend (last 6 months)
    const monthlyData = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthClients = clients.filter(c => {
        if (!c.last_visit) return false
        const v = new Date(c.last_visit)
        return v.getMonth() === d.getMonth() && v.getFullYear() === d.getFullYear()
      })
      monthlyData.push({
        month: MONTHS[d.getMonth()],
        year: d.getFullYear(),
        count: monthClients.length,
        new: monthClients.filter(c => c.total_visits === 1).length,
        revisit: monthClients.filter(c => c.total_visits > 1).length,
      })
    }

    // This month stats
    const thisMonth = clients.filter(c => {
      if (!c.last_visit) return false
      const v = new Date(c.last_visit)
      return v.getMonth() === now.getMonth() && v.getFullYear() === now.getFullYear()
    })

    // Overdue
    const overdue = clients.filter(c => {
      const lastVisit = c.last_visit ? new Date(c.last_visit) : null
      if (!lastVisit) return false
      const weeksAgo = (Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24 * 7)
      return weeksAgo >= 16
    })

    // Age distribution
    const ageGroups = {
      '10-17': 0, '18-24': 0, '25-34': 0,
      '35-44': 0, '45-54': 0, '55+': 0
    }
    clients.forEach(c => {
      const age = parseInt(c.age)
      if (age < 18) ageGroups['10-17']++
      else if (age < 25) ageGroups['18-24']++
      else if (age < 35) ageGroups['25-34']++
      else if (age < 45) ageGroups['35-44']++
      else if (age < 55) ageGroups['45-54']++
      else ageGroups['55+']++
    })

    // New vs revisit this month
    const newClients = clients.filter(c => c.total_visits === 1).length
    const revisitClients = clients.filter(c => c.total_visits > 1).length

    return {
      methodCounts,
      totalWithMethod,
      monthlyData,
      thisMonth: thisMonth.length,
      overdue: overdue.length,
      ageGroups,
      newClients,
      revisitClients,
      total: clients.length,
    }
  }, [clients])

  const maxMonthly = Math.max(...stats.monthlyData.map(m => m.count), 1)
  const maxMethodCount = Math.max(...Object.values(stats.methodCounts), 1)

  if (loading) return (
    <div className="text-center py-16 text-gray-400">
      <RefreshCw size={32} className="animate-spin mx-auto mb-3"/>
      Loading reports...
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="text-blue-600" size={24}/> Statistics & Reports
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString('en-KE', { month:'long', year:'numeric' })}
          </p>
        </div>
        <button onClick={exportMOH512}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
          <Download size={16}/> Export MOH 512
        </button>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <button onClick={() => navigate('/reports/moh711')}
          className="flex items-center gap-2 text-white p-3 rounded-xl"
          style={{background: 'linear-gradient(135deg, #0d7377 0%, #0f766e 100%)'}}>
          <FileText size={20}/>
          <div className="text-left">
            <p className="font-bold text-sm">MOH 711 Generator</p>
            <p className="text-xs opacity-75">Auto-generate monthly report</p>
          </div>
        </button>
        <button onClick={() => navigate('/reports/disc')}
          className="flex items-center gap-2 text-white p-3 rounded-xl"
          style={{background: 'linear-gradient(135deg, #14a044 0%, #0d7377 100%)'}}>
          <Send size={20}/>
          <div className="text-left">
            <p className="font-bold text-sm">DISC Submission</p>
            <p className="text-xs opacity-75">ONA Enketo monthly data</p>
          </div>
        </button>
        <button onClick={() => navigate('/reports/moh747a')}
          className="flex items-center gap-2 text-white p-3 rounded-xl col-span-2 sm:col-span-1"
          style={{background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'}}>
          <FileText size={20}/>
          <div className="text-left">
            <p className="font-bold text-sm">MOH 747A — FCDRR</p>
            <p className="text-xs opacity-75">Commodity stock management</p>
          </div>
        </button>
        <button onClick={() => navigate('/reports/moh512')}
          className="flex items-center gap-2 text-white p-3 rounded-xl col-span-2 sm:col-span-1"
          style={{background: 'linear-gradient(135deg, #1e40af 0%, #0d7377 100%)'}}>
          <FileText size={20}/>
          <div className="text-left">
            <p className="font-bold text-sm">MOH 512 Register</p>
            <p className="text-xs opacity-75">Monthly client register view</p>
          </div>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Clients', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50', icon: <Users size={20} className="text-blue-400"/> },
          { label: 'This Month', value: stats.thisMonth, color: 'text-green-600', bg: 'bg-green-50', icon: <Calendar size={20} className="text-green-400"/> },
          { label: 'New Clients', value: stats.newClients, color: 'text-purple-600', bg: 'bg-purple-50', icon: <TrendingUp size={20} className="text-purple-400"/> },
          { label: 'Overdue', value: stats.overdue, color: 'text-orange-600', bg: 'bg-orange-50', icon: <RefreshCw size={20} className="text-orange-400"/> },
        ].map(card => (
          <div key={card.label} className={`${card.bg} rounded-xl p-4 border border-gray-100`}>
            <div className="flex items-center justify-between mb-2">
              {card.icon}
            </div>
            <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-xs text-gray-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Monthly Trend */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-blue-500"/> Monthly Client Visits (Last 6 Months)
        </h3>
        <div className="flex items-end gap-3 h-40">
          {stats.monthlyData.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-xs font-bold text-gray-600">{m.count || ''}</div>
              <div className="w-full flex flex-col gap-0.5" style={{ height: '100px' }}>
                {m.count > 0 && (
                  <>
                    <div
                      className="w-full bg-blue-500 rounded-t-md transition-all"
                      style={{ height: `${(m.new / maxMonthly) * 100}px` }}
                      title={`New: ${m.new}`}
                    />
                    <div
                      className="w-full bg-blue-200 rounded-b-md transition-all"
                      style={{ height: `${(m.revisit / maxMonthly) * 100}px` }}
                      title={`Revisit: ${m.revisit}`}
                    />
                  </>
                )}
                {m.count === 0 && (
                  <div className="w-full bg-gray-100 rounded-md h-full"/>
                )}
              </div>
              <div className="text-xs text-gray-500 font-medium">{m.month}</div>
              <div className="text-xs text-gray-400">{m.year}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-blue-500 rounded-sm inline-block"/>New clients
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-blue-200 rounded-sm inline-block"/>Revisits
          </span>
        </div>
      </div>

      {/* Method Mix */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
          <Pill size={16} className="text-blue-500"/> Contraceptive Method Mix
        </h3>
        {Object.keys(stats.methodCounts).length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No method data yet</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(stats.methodCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([method, count]) => {
                const pct = Math.round((count / stats.totalWithMethod) * 100)
                return (
                  <div key={method} className="flex items-center gap-3">
                    <div className="w-20 text-right text-xs font-semibold text-gray-600">
                      {METHOD_SHORT[method] || method}
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div
                        className={`${METHOD_COLORS[method] || 'bg-blue-500'} h-5 rounded-full flex items-center justify-end pr-2 transition-all`}
                        style={{ width: `${(count / maxMethodCount) * 100}%`, minWidth: '2rem' }}>
                        <span className="text-white text-xs font-bold">{pct}%</span>
                      </div>
                    </div>
                    <div className="w-8 text-xs text-gray-500 font-medium">{count}</div>
                  </div>
                )
              })}
          </div>
        )}
      </div>

      {/* New vs Revisit + Age Distribution */}
      <div className="grid grid-cols-2 gap-4 mb-4">

        {/* New vs Revisit */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-bold text-gray-700 mb-4 text-sm">New vs Revisit Clients</h3>
          {stats.total === 0 ? (
            <p className="text-gray-400 text-xs text-center py-4">No data yet</p>
          ) : (
            <>
              <div className="flex gap-2 h-32 items-end mb-3">
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-sm font-bold text-purple-600">{stats.newClients}</div>
                  <div
                    className="w-full bg-purple-400 rounded-t-lg"
                    style={{ height: `${(stats.newClients / stats.total) * 100}px` }}
                  />
                  <div className="text-xs text-gray-500">New</div>
                </div>
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-sm font-bold text-blue-600">{stats.revisitClients}</div>
                  <div
                    className="w-full bg-blue-400 rounded-t-lg"
                    style={{ height: `${(stats.revisitClients / stats.total) * 100}px` }}
                  />
                  <div className="text-xs text-gray-500">Revisit</div>
                </div>
              </div>
              <div className="text-xs text-gray-400 text-center">
                {stats.total > 0
                  ? `${Math.round((stats.newClients / stats.total) * 100)}% new clients`
                  : ''}
              </div>
            </>
          )}
        </div>

        {/* Age Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-bold text-gray-700 mb-4 text-sm">Age Distribution</h3>
          {stats.total === 0 ? (
            <p className="text-gray-400 text-xs text-center py-4">No data yet</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(stats.ageGroups).map(([group, count]) => {
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                return (
                  <div key={group} className="flex items-center gap-2">
                    <div className="w-12 text-xs text-gray-500 font-medium">{group}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-blue-400 h-4 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-8 text-xs text-gray-500">{count}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Overdue Clients */}
      {stats.overdue > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
          <h3 className="font-bold text-orange-700 mb-2 flex items-center gap-2">
            <RefreshCw size={16}/> {stats.overdue} Overdue Client{stats.overdue > 1 ? 's' : ''}
          </h3>
          <p className="text-orange-600 text-sm">
            These clients have not been seen in 16+ weeks. Consider follow-up.
          </p>
          <button
            onClick={() => navigate('/clients')}
            className="mt-2 text-orange-700 hover:text-orange-800 text-sm font-medium underline">
            View in Client Records →
          </button>
        </div>
      )}

      {/* MOH 711 Summary Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
          📋 MOH 711 Summary — Current Month
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-2 font-semibold text-gray-600">Method</th>
                <th className="text-center px-3 py-2 font-semibold text-gray-600">New</th>
                <th className="text-center px-3 py-2 font-semibold text-gray-600">Revisit</th>
                <th className="text-center px-3 py-2 font-semibold text-gray-600">Total</th>
                <th className="text-center px-3 py-2 font-semibold text-gray-600">% Mix</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.methodCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([method, count]) => {
                  const pct = stats.totalWithMethod > 0
                    ? Math.round((count / stats.totalWithMethod) * 100)
                    : 0
                  return (
                    <tr key={method} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-700">
                        {METHOD_SHORT[method] || method}
                      </td>
                      <td className="px-3 py-2 text-center text-gray-600">—</td>
                      <td className="px-3 py-2 text-center text-gray-600">—</td>
                      <td className="px-3 py-2 text-center font-bold text-blue-600">{count}</td>
                      <td className="px-3 py-2 text-center">
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                <td className="px-3 py-2 text-gray-800">TOTAL</td>
                <td className="px-3 py-2 text-center">—</td>
                <td className="px-3 py-2 text-center">—</td>
                <td className="px-3 py-2 text-center text-blue-700">{stats.totalWithMethod}</td>
                <td className="px-3 py-2 text-center">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}