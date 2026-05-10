import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { exportMOH512, getClients } from '../utils/api.js'
import { Users, Search, Download, RefreshCw, Pill, Filter, X, AlertCircle } from 'lucide-react'

const METHOD_SHORT = {
  COC:'COC', POP:'POP', DMPA_IM:'DMPA-IM', DMPA_SC:'DMPA-SC',
  NET_EN:'NET-EN', IMPLANT:'Implant', CU_IUD:'Cu-IUD', LNG_IUS:'LNG-IUS',
  CONDOM_M:'Condom(M)', CONDOM_F:'Condom(F)', LAM:'LAM', FAM:'FAM',
  BTL:'BTL', VASECTOMY:'Vasectomy', EC_PILL:'ECP', EC_IUD:'EC-IUD',
}

const METHOD_OPTIONS = [
  {value:'', label:'All Methods'},
  {value:'COC', label:'COC — Combined Oral Contraceptive'},
  {value:'POP', label:'POP — Progestogen-Only Pill'},
  {value:'DMPA_IM', label:'DMPA-IM — Depo Injection'},
  {value:'DMPA_SC', label:'DMPA-SC — Sayana Press'},
  {value:'NET_EN', label:'NET-EN — Noristerat'},
  {value:'IMPLANT', label:'Implant — Implanon/Jadelle'},
  {value:'CU_IUD', label:'Cu-IUD — Copper IUD'},
  {value:'LNG_IUS', label:'LNG-IUS — Mirena'},
  {value:'CONDOM_M', label:'Male Condom'},
  {value:'CONDOM_F', label:'Female Condom'},
  {value:'LAM', label:'LAM'},
  {value:'FAM', label:'FAM / Cycle Beads'},
  {value:'BTL', label:'BTL — Female Sterilisation'},
  {value:'VASECTOMY', label:'Vasectomy'},
]

export default function Clients() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    method: '',
    visitType: '',
    sex: '',
    dateFrom: '',
    dateTo: '',
    overdue: false,
  })

  const load = async () => {
    setLoading(true)
    setError(false)
    const result = await getClients()
    if (result.success) {
      setClients(result.data)
    } else {
      setError(true)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [])

  const activeFilterCount = Object.values(filters).filter(v => v !== '' && v !== false).length

  const filtered = useMemo(() => {
    return clients.filter(c => {
      // Search
      if (search) {
        const q = search.toLowerCase()
        const match = `${c.first_name} ${c.last_name} ${c.telephone || ''} ${c.service_reg_number || ''} ${c.location || ''}`.toLowerCase()
        if (!match.includes(q)) return false
      }
      // Method filter
      if (filters.method && c.last_method !== filters.method) return false
      // Sex filter
      if (filters.sex && c.sex !== filters.sex) return false
      // Date range filter
      if (filters.dateFrom && c.last_visit) {
        if (new Date(c.last_visit) < new Date(filters.dateFrom)) return false
      }
      if (filters.dateTo && c.last_visit) {
        if (new Date(c.last_visit) > new Date(filters.dateTo + 'T23:59:59')) return false
      }
      // Overdue filter
      if (filters.overdue) {
        // Client is overdue if last visit was more than 16 weeks ago with no return date
        const lastVisit = c.last_visit ? new Date(c.last_visit) : null
        const weeksAgo = lastVisit
          ? (Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24 * 7)
          : 0
        if (weeksAgo < 16) return false
      }
      return true
    })
  }, [clients, search, filters])

  const clearFilters = () => {
    setFilters({ method: '', visitType: '', sex: '', dateFrom: '', dateTo: '', overdue: false })
    setSearch('')
  }

  const stats = useMemo(() => {
    const total = clients.length
    const today = new Date().toDateString()
    const todayCount = clients.filter(c =>
      c.last_visit && new Date(c.last_visit).toDateString() === today
    ).length
    const methods = {}
    clients.forEach(c => {
      if (c.last_method) methods[c.last_method] = (methods[c.last_method] || 0) + 1
    })
    return { total, todayCount, methods }
  }, [clients])

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-blue-600" size={24}/> Client Records
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {filtered.length} of {clients.length} clients
            {stats.todayCount > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                {stats.todayCount} seen today
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''}/> Refresh
          </button>
          <button onClick={exportMOH512}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold">
            <Download size={14}/> Export MOH 512
          </button>
          <button onClick={() => { window.location.href = '/session/registration' }}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">
            + New Session
          </button>
        </div>
      </div>

      {/* Quick stats bar */}
      {!loading && clients.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          {Object.entries(stats.methods)
            .sort((a,b) => b[1]-a[1])
            .slice(0,4)
            .map(([method, count]) => (
              <div key={method}
                onClick={() => setFilters(f => ({ ...f, method: f.method === method ? '' : method }))}
                className={`bg-white rounded-lg border px-3 py-2 text-center cursor-pointer transition-colors
                  ${filters.method === method ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                <div className="font-bold text-blue-600 text-sm">{count}</div>
                <div className="text-xs text-gray-500">{METHOD_SHORT[method] || method}</div>
              </div>
            ))}
        </div>
      )}

      {/* Search + Filter Bar */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-gray-400"/>
          <input
            className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Search by name, phone, location, or registration number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
              <X size={14}/>
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors
            ${showFilters || activeFilterCount > 0
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
          <Filter size={14}/>
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-white text-blue-600 text-xs font-bold px-1.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700 text-sm">Filter Clients</h3>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                <X size={12}/> Clear all filters
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

            {/* Method */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Method</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={filters.method}
                onChange={e => setFilters(f => ({ ...f, method: e.target.value }))}>
                {METHOD_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Sex */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Sex</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={filters.sex}
                onChange={e => setFilters(f => ({ ...f, sex: e.target.value }))}>
                <option value="">All</option>
                <option value="F">Female</option>
                <option value="M">Male</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Last Visit From</label>
              <input type="date"
                className="w-full border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={filters.dateFrom}
                onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Last Visit To</label>
              <input type="date"
                className="w-full border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={filters.dateTo}
                onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
              />
            </div>

            {/* Overdue */}
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox"
                  className="w-4 h-4 rounded accent-blue-600"
                  checked={filters.overdue}
                  onChange={e => setFilters(f => ({ ...f, overdue: e.target.checked }))}
                />
                <span className="text-xs font-medium text-gray-600">
                  Show overdue only <br/>
                  <span className="text-gray-400 font-normal">(not seen in 16+ weeks)</span>
                </span>
              </label>
            </div>

          </div>
        </div>
      )}

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {filters.method && (
            <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
              Method: {METHOD_SHORT[filters.method]}
              <button onClick={() => setFilters(f => ({ ...f, method: '' }))}><X size={10}/></button>
            </span>
          )}
          {filters.sex && (
            <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
              Sex: {filters.sex === 'F' ? 'Female' : 'Male'}
              <button onClick={() => setFilters(f => ({ ...f, sex: '' }))}><X size={10}/></button>
            </span>
          )}
          {filters.dateFrom && (
            <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
              From: {filters.dateFrom}
              <button onClick={() => setFilters(f => ({ ...f, dateFrom: '' }))}><X size={10}/></button>
            </span>
          )}
          {filters.dateTo && (
            <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
              To: {filters.dateTo}
              <button onClick={() => setFilters(f => ({ ...f, dateTo: '' }))}><X size={10}/></button>
            </span>
          )}
          {filters.overdue && (
            <span className="bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
              Overdue only
              <button onClick={() => setFilters(f => ({ ...f, overdue: false }))}><X size={10}/></button>
            </span>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-gray-400">
          <RefreshCw size={32} className="animate-spin mx-auto mb-3"/>
          Loading client records...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center text-red-700">
          <p className="font-semibold">Cannot connect to database</p>
          <p className="text-sm mt-1">Make sure the backend server is running on port 8000</p>
          <button onClick={load}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg text-sm">
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Users size={48} className="mx-auto mb-3 opacity-30"/>
          <p className="font-medium">
            {search || activeFilterCount > 0
              ? 'No clients match your search or filters'
              : 'No clients recorded yet'}
          </p>
          {(search || activeFilterCount > 0) && (
            <button onClick={clearFilters}
              className="mt-3 text-blue-600 hover:underline text-sm">
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Client Table */}
      {!loading && filtered.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Client</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Age/Sex</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Contact</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Visits</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Method</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Last Visit</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, idx) => {
                const lastVisit = c.last_visit ? new Date(c.last_visit) : null
                const weeksAgo = lastVisit
                  ? (Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24 * 7)
                  : 0
                const isOverdue = weeksAgo >= 16
                const isToday = lastVisit && lastVisit.toDateString() === new Date().toDateString()

                return (
                  <tr key={c.id}
                    className={`border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors
                      ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    onClick={() => navigate(`/clients/${c.id}`)}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">{c.first_name} {c.last_name}</div>
                      <div className="text-xs text-gray-400">{c.service_reg_number}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.age}y / {c.sex === 'F' ? '♀' : c.sex === 'M' ? '♂' : c.sex}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      <div>{c.telephone || '—'}</div>
                      <div className="text-gray-400">{c.location || ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">
                        {c.total_visits}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {c.last_method ? (
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                          <Pill size={10}/> {METHOD_SHORT[c.last_method] || c.last_method}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {lastVisit ? lastVisit.toLocaleDateString('en-KE') : '—'}
                      {isToday && (
                        <span className="ml-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">Today</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isOverdue ? (
                        <span className="flex items-center gap-1 text-xs text-orange-600 font-medium">
                          <AlertCircle size={12}/> Overdue
                        </span>
                      ) : isToday ? (
                        <span className="text-xs text-green-600 font-medium">✓ Seen today</span>
                      ) : (
                        <span className="text-xs text-gray-400">Active</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Table Footer */}
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Showing {filtered.length} of {clients.length} clients
            </p>
            <button onClick={exportMOH512}
              className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium">
              <Download size={12}/> Export filtered list
            </button>
          </div>
        </div>
      )}
    </div>
  )
}