import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, Send, Users, Clock, CheckCircle, AlertTriangle, ArrowLeft, RefreshCw, Eye } from 'lucide-react'

export default function SMSReminders() {
  const navigate = useNavigate()
  const [status, setStatus] = useState(null)
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [results, setResults] = useState(null)
  const [preview, setPreview] = useState(null)
  const [selectedClient, setSelectedClient] = useState('')
  const [messageType, setMessageType] = useState('reminder')
  const [customMessage, setCustomMessage] = useState('')
  const [bulkDays, setBulkDays] = useState(7)
  const [activeTab, setActiveTab] = useState('bulk')

  // We need to fetch facility settings to pass to BulkReminders
  const [facility, setFacility] = useState({})

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, cRes] = await Promise.all([
          fetch('/api/sms/status'),
          fetch(`/api/clients/?t=${Date.now()}`)
        ])
        const sData = await sRes.json()
        const cData = await cRes.json()
        setStatus(sData)
        setClients(cData.filter(c => c.telephone))

        // Get local facility settings
        const facSettings = localStorage.getItem('afyamec_facility')
        if (facSettings) setFacility(JSON.parse(facSettings))

      } catch (e) {
        console.error(e)
      }
      setLoading(false)
    }
    load()
  }, [])

  const handlePreview = async () => {
    if (!selectedClient) return
    try {
      const res = await fetch(`/api/sms/preview/${selectedClient}?message_type=${messageType}`)
      const data = await res.json()
      setPreview(data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSendSingle = async () => {
    if (!selectedClient) return
    setSending(true)
    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClient,
          message_type: messageType,
          custom_message: customMessage || null
        })
      })
      const data = await res.json()
      setResults({ type: 'single', ...data })
    } catch (e) {
      setResults({ type: 'single', success: false, error: e.message })
    }
    setSending(false)
  }

  const handleSendBulk = async () => {
    setSending(true)
    setResults(null)
    try {
      const res = await fetch('/api/sms/send-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_type: activeTab === 'overdue' ? 'overdue' : 'reminder',
          days_before: parseInt(bulkDays)
        })
      })
      const data = await res.json()
      setResults({ type: 'bulk', ...data })
    } catch (e) {
      setResults({ type: 'bulk', success: false, error: e.message })
    }
    setSending(false)
  }

  if (loading) return (
    <div className="text-center py-16 text-gray-400">
      <RefreshCw size={32} className="animate-spin mx-auto mb-3"/>
      Loading SMS module...
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
          <MessageSquare className="text-blue-600" size={24}/> SMS Reminders
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Send appointment reminders to clients via Africa's Talking
        </p>
      </div>

      {/* SMS Status Banner */}
      {status && (
        <div className={`rounded-xl p-4 mb-5 border ${
          status.enabled
            ? 'bg-green-50 border-green-200'
            : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {status.enabled
                ? <CheckCircle size={18} className="text-green-500"/>
                : <AlertTriangle size={18} className="text-yellow-500"/>}
              <div>
                <p className={`font-semibold text-sm ${status.enabled ? 'text-green-700' : 'text-yellow-700'}`}>
                  {status.enabled ? '✅ SMS Active — Live Mode' : '📋 Sandbox Mode — Messages logged only'}
                </p>
                <p className={`text-xs mt-0.5 ${status.enabled ? 'text-green-600' : 'text-yellow-600'}`}>
                  {status.message}
                </p>
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              status.mode === 'live'
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'}`}>
              {status.mode}
            </span>
          </div>
          {!status.enabled && (
            <div className="mt-3 bg-white rounded-lg p-3 border border-yellow-100">
              <p className="text-xs font-semibold text-gray-700 mb-1">To enable live SMS:</p>
              <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                <li>Sign up at <strong>account.africastalking.com</strong> (free)</li>
                <li>Get your API key from the dashboard</li>
                <li>Set <code className="bg-gray-100 px-1 rounded">AT_API_KEY=your_key</code> in <code className="bg-gray-100 px-1 rounded">backend\.env</code></li>
                <li>Set <code className="bg-gray-100 px-1 rounded">SMS_ENABLED=true</code> in <code className="bg-gray-100 px-1 rounded">backend\.env</code></li>
                <li>Restart the backend</li>
              </ol>
            </div>
          )}

          {/* Callback URL info */}
          <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-xs font-bold text-gray-600 mb-1">
              📡 Two-Way SMS Callback URL
            </p>
            <p className="text-xs text-gray-500 mb-2">
              Set this URL in your Africa's Talking dashboard to receive incoming messages:
            </p>
            <div className="bg-gray-800 text-green-400 text-xs px-3 py-2 rounded font-mono break-all">
              https://your-domain.com/api/sms/callback
            </div>
            <p className="text-xs text-gray-400 mt-1">
              (Update with your actual deployed URL after deployment)
            </p>
          </div>

        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
          <div className="text-2xl font-bold text-blue-600">{clients.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">Clients with phone</div>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
          <div className="text-2xl font-bold text-green-600">—</div>
          <div className="text-xs text-gray-500 mt-0.5">Due this week</div>
        </div>
        <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-100">
          <div className="text-2xl font-bold text-orange-600">—</div>
          <div className="text-xs text-gray-500 mt-0.5">Overdue</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { id: 'bulk', label: '📅 Bulk Reminders' },
          { id: 'overdue', label: '⚠️ Overdue Alerts' },
          { id: 'single', label: '👤 Single Client' },
        ].map(tab => (
          <button key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors
              ${activeTab === tab.id
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bulk Reminders Tab */}
      {activeTab === 'bulk' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
          <h3 className="font-bold text-gray-700 mb-3">Send Appointment Reminders</h3>
          <p className="text-sm text-gray-500 mb-4">
            Sends reminders to all clients whose return date is coming up.
          </p>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Send reminders to clients due in the next:
            </label>
            <div className="flex gap-2">
              {[3, 7, 14].map(d => (
                <button key={d}
                  onClick={() => setBulkDays(d)}
                  className={`flex-1 py-2 rounded-lg border-2 text-sm font-semibold transition-colors
                    ${bulkDays === d
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                  {d} days
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleSendBulk} disabled={sending}
            className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl transition-colors
              ${sending ? 'bg-gray-200 text-gray-400' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
            {sending ? <><RefreshCw size={16} className="animate-spin"/> Sending...</> :
              <><Send size={16}/> Send Reminders</>}
          </button>
        </div>
      )}

      {/* Overdue Tab */}
      {activeTab === 'overdue' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
          <h3 className="font-bold text-gray-700 mb-3">Send Overdue Alerts</h3>
          <p className="text-sm text-gray-500 mb-4">
            Sends alerts to clients who have not been seen in 16+ weeks.
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-orange-700">
              <strong>Note:</strong> This will message all overdue clients who have a phone number on record.
              Please review the client list first.
            </p>
          </div>
          <button onClick={handleSendBulk} disabled={sending}
            className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl transition-colors
              ${sending ? 'bg-gray-200 text-gray-400' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}>
            {sending ? <><RefreshCw size={16} className="animate-spin"/> Sending...</> :
              <><Send size={16}/> Send Overdue Alerts</>}
          </button>
        </div>
      )}

      {/* Single Client Tab */}
      {activeTab === 'single' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
          <h3 className="font-bold text-gray-700 mb-3">Send to Single Client</h3>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-600 mb-1">Select Client</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={selectedClient}
              onChange={e => { setSelectedClient(e.target.value); setPreview(null) }}>
              <option value="">Choose client...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name} — {c.telephone}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-600 mb-1">Message Type</label>
            <div className="flex gap-2">
              {[
                { val: 'reminder', label: 'Appointment Reminder' },
                { val: 'overdue', label: 'Overdue Alert' },
                { val: 'custom', label: 'Custom Message' },
              ].map(opt => (
                <button key={opt.val}
                  onClick={() => setMessageType(opt.val)}
                  className={`flex-1 py-2 rounded-lg border-2 text-xs font-semibold transition-colors
                    ${messageType === opt.val
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {messageType === 'custom' && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-600 mb-1">Custom Message</label>
              <textarea rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Type your message here..."
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">{customMessage.length} chars / {Math.ceil(customMessage.length/160)} SMS</p>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
              <p className="text-xs font-semibold text-gray-600 mb-1">Message Preview:</p>
              <p className="text-sm text-gray-700 mb-2">{preview.message}</p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>To: {preview.phone}</span>
                <span>{preview.char_count} chars / {preview.sms_count} SMS</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={handlePreview} disabled={!selectedClient}
              className="flex-1 flex items-center justify-center gap-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40">
              <Eye size={14}/> Preview
            </button>
            <button onClick={handleSendSingle} disabled={sending || !selectedClient}
              className={`flex-1 flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl transition-colors
                ${sending || !selectedClient ? 'bg-gray-200 text-gray-400' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
              {sending ? <RefreshCw size={14} className="animate-spin"/> : <Send size={14}/>}
              Send
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className={`rounded-xl border p-4 ${results.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <h3 className={`font-bold text-sm mb-2 ${results.success ? 'text-green-700' : 'text-red-700'}`}>
            {results.success ? '✅ Done' : '❌ Failed'}
          </h3>
          {results.type === 'bulk' && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">{results.sent || 0}</div>
                <div className="text-xs text-gray-500">Sent</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-500">{results.failed || 0}</div>
                <div className="text-xs text-gray-500">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-400">{results.skipped || 0}</div>
                <div className="text-xs text-gray-500">Skipped</div>
              </div>
            </div>
          )}
          {results.type === 'single' && results.success && (
            <p className="text-sm text-green-700">
              Message sent to {results.client_name} ({results.phone})
              {results.sandbox && ' [SANDBOX — not actually sent]'}
            </p>
          )}
          {results.error && <p className="text-sm text-red-600">{results.error}</p>}

          {/* Detailed results for bulk */}
          {results.results && results.results.length > 0 && (
            <details className="mt-2">
              <summary className="text-xs text-gray-500 cursor-pointer">View details</summary>
              <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                {results.results.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-gray-100">
                    <span className="text-gray-700">{r.client}</span>
                    <span className={r.success ? 'text-green-600' : 'text-red-500'}>
                      {r.success ? '✓ Sent' : '✗ ' + (r.error || 'Failed')}
                      {r.sandbox && ' [sandbox]'}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* SMS Inbox */}
      <SMSInbox />

      {/* Bulk Overdue Reminders */}
      <BulkReminders facilityName={facility.facility_name} />

      {/* DMPA-SC SI Reminders */}
      <SIRemindersManager />
    </div>
  )
}

function SMSInbox() {
  const [inbox, setInbox] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/sms/inbox', {
        headers: { Authorization: `Bearer ${localStorage.getItem('afyamec_auth_token')}` }
      })
      if (res.ok) setInbox(await res.json())
    } catch {}
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-gray-700 flex items-center gap-2">
          📨 SMS Inbox
          {inbox.length > 0 && (
            <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {inbox.length}
            </span>
          )}
        </h3>
        <button
          onClick={() => { setOpen(!open); if (!open) load() }}
          className="text-xs text-teal-600 hover:underline">
          {open ? 'Hide' : 'View Inbox'}
        </button>
      </div>
      {open && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {loading && <p className="text-gray-400 text-sm text-center py-3">Loading...</p>}
          {!loading && inbox.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-3">No incoming messages yet</p>
          )}
          {inbox.map((msg, i) => (
            <div key={i} className={`p-3 rounded-lg text-sm border
              ${msg.action === 'opted_out' ? 'bg-red-50 border-red-200' :
                msg.action === 'opted_in' ? 'bg-green-50 border-green-200' :
                'bg-gray-50 border-gray-200'}`}>
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-gray-700">{msg.from}</span>
                <span className="text-xs text-gray-400">
                  {new Date(msg.received_at).toLocaleString('en-KE')}
                </span>
              </div>
              <p className="text-gray-600">"{msg.text}"</p>
              {msg.action && (
                <span className={`text-xs font-bold mt-1 inline-block
                  ${msg.action === 'opted_out' ? 'text-red-600' :
                    msg.action === 'opted_in' ? 'text-green-600' : 'text-gray-500'}`}>
                  Action: {msg.action.replace('_', ' ')}
                </span>
              )}
              {msg.auto_response && (
                <p className="text-xs text-teal-600 mt-1 italic">
                  Auto-reply: "{msg.auto_response}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BulkReminders({ facilityName }) {
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [weeks, setWeeks] = useState(16)

  const handleSend = async () => {
    if (!confirm(`Send reminders to ALL overdue clients (${weeks}+ weeks since last visit)?`)) return
    setSending(true)
    try {
      const res = await fetch('/api/sms/send-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('afyamec_auth_token')}`
        },
        body: JSON.stringify({ weeks_overdue: weeks, facility_name: facilityName || 'your health facility' })
      })
      if (res.ok) setResult(await res.json())
    } catch (e) {
      setResult({ success: false, message: e.message })
    }
    setSending(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mt-4">
      <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
        📣 Bulk Overdue Reminders
      </h3>
      <p className="text-xs text-gray-500 mb-3">
        Send appointment reminders to all clients who are overdue for their next visit.
      </p>
      <div className="flex items-center gap-3 mb-3">
        <label className="text-xs font-medium text-gray-500 flex-shrink-0">
          Overdue after:
        </label>
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          value={weeks}
          onChange={e => setWeeks(parseInt(e.target.value))}>
          <option value={8}>8 weeks</option>
          <option value={12}>12 weeks</option>
          <option value={16}>16 weeks (default)</option>
          <option value={20}>20 weeks</option>
        </select>
      </div>
      <button
        onClick={handleSend}
        disabled={sending}
        className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl text-sm transition-colors
          ${sending ? 'bg-gray-200 text-gray-400' : 'text-white'}`}
        style={!sending ? { background: '#0d7377' } : {}}>
        {sending ? '⏳ Sending...' : '📣 Send Bulk Reminders'}
      </button>

      {result && (
        <div className={`mt-3 p-3 rounded-lg text-sm ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          {result.success ? (
            <>
              <p className="font-bold text-green-700 mb-1">
                ✅ {result.sandbox ? 'Sandbox — ' : ''}Reminders processed
              </p>
              <p className="text-green-600">
                Sent: {result.sent} | Failed: {result.failed} | Skipped: {result.skipped}
              </p>
            </>
          ) : (
            <p className="text-red-600">❌ {result.message}</p>
          )}
        </div>
      )}
    </div>
  )
}

function SIRemindersManager() {
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [open, setOpen] = useState(false)
  const token = localStorage.getItem('afyamec_auth_token')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/sms/si-reminders', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) setReminders(await res.json())
    } catch {}
    setLoading(false)
  }

  const sendDue = async () => {
    setSending(true)
    try {
      const res = await fetch('/api/sms/send-due-reminders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        setResult(await res.json())
        load()
      }
    } catch {}
    setSending(false)
  }

  const pending = reminders.filter(r => !r.sent)
  const sent = reminders.filter(r => r.sent)
  const today = new Date()
  const due = pending.filter(r =>
    new Date(r.reminder_date) <= today
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm">
          💉 DMPA-SC SI Reminders
          {due.length > 0 && (
            <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
              {due.length} due
            </span>
          )}
        </h3>
        <button
          onClick={() => { setOpen(!open); if (!open) load() }}
          className="text-xs text-teal-600 hover:underline">
          {open ? 'Hide' : 'Manage'}
        </button>
      </div>

      {open && (
        <>
          <div className="grid grid-cols-3 gap-2 mb-3 text-center">
            {[
              { label: 'Total scheduled', value: reminders.length, color: 'text-gray-700' },
              { label: 'Due today', value: due.length, color: 'text-red-600' },
              { label: 'Sent', value: sent.length, color: 'text-green-600' },
            ].map((s, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-2">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          {due.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
              <p className="text-xs font-bold text-red-700 mb-1">
                ⏰ {due.length} reminder(s) due to be sent
              </p>
              {due.slice(0,3).map((r, i) => (
                <p key={i} className="text-xs text-red-600">
                  • {r.client_name} — Dose {r.dose_number}/{r.total_doses} —
                  inject {new Date(r.injection_date).toLocaleDateString('en-KE')}
                </p>
              ))}
            </div>
          )}

          <button
            onClick={sendDue}
            disabled={sending || due.length === 0}
            className={`w-full flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl text-sm mb-3 transition-colors
              ${due.length > 0 && !sending ? 'text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            style={due.length > 0 && !sending ? {background:'#0d7377'} : {}}>
            {sending ? '⏳ Sending...' : `💌 Send ${due.length} Due Reminder(s)`}
          </button>

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-3 text-xs text-green-700">
              ✅ Sent {result.sent} reminder(s)
              {result.sandbox && ' (sandbox mode)'}
            </div>
          )}

          {/* Upcoming reminders list */}
          {pending.length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-1">
              <p className="text-xs font-bold text-gray-500 mb-1">Upcoming:</p>
              {pending.slice(0,10).map((r, i) => (
                <div key={i}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50">
                  <div>
                    <span className="font-medium text-gray-700">{r.client_name}</span>
                    <span className="text-gray-400 ml-1">
                      Dose {r.dose_number}/{r.total_doses}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500">
                      Inject: {new Date(r.injection_date).toLocaleDateString('en-KE')}
                    </p>
                    <p className={new Date(r.reminder_date) <= today
                      ? 'text-red-500 font-bold' : 'text-gray-400'}>
                      Remind: {new Date(r.reminder_date).toLocaleDateString('en-KE')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}