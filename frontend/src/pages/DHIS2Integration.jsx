import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Upload, Eye, CheckCircle, AlertTriangle, Database, Globe } from 'lucide-react'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

const METHOD_NAMES = {
  COC:'Combined Oral Contraceptives', POP:'Progestogen-Only Pills',
  DMPA_IM:'DMPA Injection (IM)', DMPA_SC:'DMPA-SC (Sayana Press)',
  NET_EN:'NET-EN Injection', IMPLANT:'Implants',
  CU_IUD:'Copper IUD', LNG_IUS:'LNG-IUS (Mirena)',
  CONDOM_M:'Male Condoms', CONDOM_F:'Female Condoms',
  BTL:'Female Sterilisation', VASECTOMY:'Vasectomy',
  LAM:'LAM', FAM:'FAM/Cycle Beads',
}

export default function DHIS2Integration() {
  const navigate = useNavigate()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [pushing, setPushing] = useState(false)
  const [preview, setPreview] = useState(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [pushResult, setPushResult] = useState(null)

  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)

  const period = `${selectedYear}${String(selectedMonth).padStart(2, '0')}`

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/dhis2/status')
        const data = await res.json()
        setStatus(data)
      } catch (e) {
        console.error(e)
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleTest = async () => {
    setTesting(true)
    try {
      const res = await fetch('/api/dhis2/test')
      const data = await res.json()
      alert(data.success
        ? `✅ Connected! Logged in as: ${data.display_name}`
        : `❌ Failed: ${data.message}`)
    } catch (e) {
      alert('Connection error: ' + e.message)
    }
    setTesting(false)
  }

  const handlePreview = async () => {
    setLoadingPreview(true)
    setPushResult(null)
    try {
      const res = await fetch(`/api/dhis2/preview/${period}`)
      const data = await res.json()
      setPreview(data)
    } catch (e) {
      console.error(e)
    }
    setLoadingPreview(false)
  }

  const handlePush = async () => {
    if (!status?.enabled) {
      alert('DHIS2 integration is disabled. Configure credentials in backend/.env first.')
      return
    }
    if (!confirm(`Push MOH 711 data for ${MONTHS[selectedMonth-1]} ${selectedYear} to KHIS?`)) return
    setPushing(true)
    try {
      const res = await fetch('/api/dhis2/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period })
      })
      const data = await res.json()
      setPushResult(data)
    } catch (e) {
      setPushResult({ success: false, message: e.message })
    }
    setPushing(false)
  }

  if (loading) return (
    <div className="text-center py-16 text-gray-400">
      <RefreshCw size={32} className="animate-spin mx-auto mb-3"/>
      Loading DHIS2 module...
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate('/settings')}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-4">
        <ArrowLeft size={15}/> Back to Settings
      </button>

      <div className="mb-5">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Globe className="text-blue-600" size={24}/> KHIS / DHIS2 Integration
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Push MOH 711 family planning data to Kenya Health Information System
        </p>
      </div>

      {/* Status Card */}
      <div className={`rounded-xl p-4 mb-5 border ${
        status?.enabled ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {status?.enabled
              ? <CheckCircle size={18} className="text-green-500"/>
              : <AlertTriangle size={18} className="text-yellow-500"/>}
            <p className={`font-semibold text-sm ${status?.enabled ? 'text-green-700' : 'text-yellow-700'}`}>
              {status?.enabled ? '✅ DHIS2 Active' : '⚠️ DHIS2 Disabled — Sandbox Mode'}
            </p>
          </div>
          {status?.enabled && (
            <button onClick={handleTest} disabled={testing}
              className="flex items-center gap-1 bg-white border border-green-300 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-50">
              {testing ? <RefreshCw size={12} className="animate-spin"/> : <Globe size={12}/>}
              Test Connection
            </button>
          )}
        </div>

        {/* Config checklist */}
        <div className="space-y-1.5">
          {[
            { label: 'DHIS2 URL', ok: !!status?.base_url },
            { label: 'Username', ok: status?.username_configured },
            { label: 'Password', ok: status?.password_configured },
            { label: 'Org Unit ID', ok: !!status?.org_unit },
            { label: 'Data Elements', ok: status?.data_elements_configured },
            { label: 'Integration Enabled', ok: status?.enabled },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2 text-xs">
              <span className={item.ok ? 'text-green-500' : 'text-gray-300'}>
                {item.ok ? '✓' : '○'}
              </span>
              <span className={item.ok ? 'text-gray-700' : 'text-gray-400'}>{item.label}</span>
              {!item.ok && <span className="text-gray-300">— not configured</span>}
            </div>
          ))}
        </div>

        {!status?.enabled && (
          <div className="mt-3 bg-white rounded-lg p-3 border border-yellow-100">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              To enable DHIS2 integration:
            </p>
            <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
              <li>Contact Kenya MOH for KHIS API credentials</li>
              <li>Get your facility Org Unit UID from KHIS admin</li>
              <li>Get data element UIDs for MOH 711 FP indicators</li>
              <li>Update <code className="bg-gray-100 px-1 rounded">backend\.env</code> with credentials</li>
              <li>Set <code className="bg-gray-100 px-1 rounded">DHIS2_ENABLED=true</code></li>
              <li>Update <code className="bg-gray-100 px-1 rounded">backend\app\core\dhis2.py</code> with real UIDs</li>
              <li>Restart backend</li>
            </ol>
            <div className="mt-2 bg-blue-50 rounded p-2">
              <p className="text-xs text-blue-700 font-medium">
                💡 You can still preview MOH 711 data and generate reports while in sandbox mode
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
        <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
          <Database size={16} className="text-blue-500"/> Generate MOH 711 Report
        </h3>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={selectedMonth}
              onChange={e => { setSelectedMonth(parseInt(e.target.value)); setPreview(null) }}>
              {MONTHS.map((m, i) => (
                <option key={i+1} value={i+1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={selectedYear}
              onChange={e => { setSelectedYear(parseInt(e.target.value)); setPreview(null) }}>
              {[2023, 2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={handlePreview} disabled={loadingPreview}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-blue-300 text-blue-600 font-semibold rounded-xl text-sm hover:bg-blue-50 disabled:opacity-40">
            {loadingPreview
              ? <RefreshCw size={14} className="animate-spin"/>
              : <Eye size={14}/>}
            Preview Data
          </button>
          <button onClick={handlePush} disabled={pushing || !status?.enabled}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 font-semibold rounded-xl text-sm transition-colors
              ${status?.enabled && !pushing
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            {pushing
              ? <RefreshCw size={14} className="animate-spin"/>
              : <Upload size={14}/>}
            {status?.enabled ? 'Push to KHIS' : 'Push (Disabled)'}
          </button>
        </div>

        {!status?.enabled && (
          <p className="text-xs text-gray-400 text-center mt-2">
            Configure DHIS2 credentials to enable pushing
          </p>
        )}
      </div>

      {/* Preview Data */}
      {preview && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              📋 MOH 711 — {MONTHS[selectedMonth-1]} {selectedYear}
            </h3>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              {preview.total_visits} visits
            </span>
          </div>

          {preview.summary.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">
              No visits recorded for this period
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 text-xs">Method</th>
                    <th className="text-center px-3 py-2 font-semibold text-gray-600 text-xs">New</th>
                    <th className="text-center px-3 py-2 font-semibold text-gray-600 text-xs">Revisit</th>
                    <th className="text-center px-3 py-2 font-semibold text-gray-600 text-xs">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.summary.map((row, i) => (
                    <tr key={i} className={`border-b border-gray-100 ${i%2===0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-3 py-2 text-gray-700 text-xs font-medium">{row.method_name}</td>
                      <td className="px-3 py-2 text-center text-blue-600 font-semibold text-xs">{row.new}</td>
                      <td className="px-3 py-2 text-center text-gray-500 text-xs">{row.revisit}</td>
                      <td className="px-3 py-2 text-center font-bold text-gray-700 text-xs">{row.total}</td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50 border-t-2 border-blue-200 font-bold">
                    <td className="px-3 py-2 text-blue-700 text-xs">TOTAL</td>
                    <td className="px-3 py-2 text-center text-blue-600 text-xs">
                      {preview.summary.reduce((a,b) => a + b.new, 0)}
                    </td>
                    <td className="px-3 py-2 text-center text-blue-600 text-xs">
                      {preview.summary.reduce((a,b) => a + b.revisit, 0)}
                    </td>
                    <td className="px-3 py-2 text-center text-blue-700 text-xs">
                      {preview.total_visits}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Payload preview for developers */}
          {preview.payload && (
            <details className="mt-3">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                View DHIS2 payload (for developers)
              </summary>
              <pre className="mt-2 bg-gray-900 text-green-400 text-xs p-3 rounded-lg overflow-x-auto max-h-48">
                {JSON.stringify(preview.payload, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Push Result */}
      {pushResult && (
        <div className={`rounded-xl border p-4 ${
          pushResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className={`font-bold text-sm mb-1 ${pushResult.success ? 'text-green-700' : 'text-red-700'}`}>
            {pushResult.success ? '✅ Push Successful' : '❌ Push Failed'}
          </p>
          <p className={`text-sm ${pushResult.success ? 'text-green-600' : 'text-red-600'}`}>
            {pushResult.message}
          </p>
          {pushResult.sandbox && (
            <p className="text-xs text-yellow-600 mt-1">
              Sandbox mode — data was not actually sent to KHIS
            </p>
          )}
        </div>
      )}
    </div>
  )
}