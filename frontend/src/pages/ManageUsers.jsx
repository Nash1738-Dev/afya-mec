import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, isAdmin, getUsers, getPendingUsers, approveUser, rejectUser, changePin } from '../utils/auth.js'
import { Users, Plus, Trash2, ArrowLeft, Eye, EyeOff, Shield, Save } from 'lucide-react'

const ROLES = ['admin', 'provider', 'viewer']

export default function ManageUsers() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const [users, setUsers] = useState([])
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [newUser, setNewUser] = useState({ name: '', pin: '', role: 'provider' })
  const [showPin, setShowPin] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [u, p] = await Promise.all([getUsers(), getPendingUsers()])
    setUsers(u)
    setPending(p)
    setLoading(false)
  }

  const handleApprove = async (userId) => {
    await approveUser(userId, 'approve')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    loadData()
  }

  const handleReject = async (userId) => {
    if (!confirm('Reject this user?')) return
    await rejectUser(userId)
    loadData()
  }

  if (loading) return (
    <div className="text-center py-12 text-gray-400">Loading users...</div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate('/settings')}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-4">
        <ArrowLeft size={15}/> Back to Settings
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-teal-600" size={24}/> Manage Users
          </h2>
          <p className="text-gray-500 text-sm mt-1">Add or manage provider accounts</p>
        </div>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-green-700 text-sm font-medium">
          ✅ Changes saved successfully
        </div>
      )}

      {/* Pending Approvals */}
      {pending.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <h3 className="font-bold text-amber-700 mb-3 flex items-center gap-2">
            ⏳ Pending Approval Requests ({pending.length})
          </h3>
          <div className="space-y-3">
            {pending.map(u => (
              <div key={u.id} className="bg-white rounded-lg border border-amber-100 p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{u.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {u.cadre} | {u.facility}
                    </p>
                    <p className="text-xs text-gray-400">
                      {u.sub_county && `${u.sub_county}, `}{u.county} | {u.phone}
                    </p>
                    <p className="text-xs text-gray-300 mt-0.5">
                      Requested: {new Date(u.created_at).toLocaleDateString('en-KE')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(u.id)}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                      ✓ Approve
                    </button>
                    <button onClick={() => handleReject(u.id)}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                      ✗ Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-700">Active Users ({users.length})</h3>
        </div>
        {users.map((u, idx) => (
          <div key={u.id}
            className={`flex items-center justify-between p-4 ${idx < users.length-1 ? 'border-b border-gray-100' : ''}`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm
                ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-teal-100 text-teal-600'}`}>
                {u.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm flex items-center gap-1">
                  {u.name}
                  {u.role === 'admin' && <Shield size={12} className="text-purple-500"/>}
                  {u.id === currentUser?.id && (
                    <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full">You</span>
                  )}
                </p>
                <p className="text-xs text-gray-400 capitalize">{u.role} {u.cadre && `| ${u.cadre}`}</p>
                {u.facility && <p className="text-xs text-gray-300">{u.facility}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ChangePINButton userId={u.id} isCurrentUser={u.id === currentUser?.id}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChangePINButton({ userId, isCurrentUser }) {
  const [open, setOpen] = useState(false)
  const [oldPin, setOldPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [msg, setMsg] = useState('')

  if (!isCurrentUser) return null

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="text-xs text-teal-500 hover:text-teal-700 px-2 py-1 rounded border border-teal-200 hover:bg-teal-50">
      Change PIN
    </button>
  )

  return (
    <div className="flex items-center gap-1">
      <input className="border border-gray-300 rounded px-2 py-1 text-xs w-20 focus:outline-none"
        placeholder="Old PIN" type="password" inputMode="numeric" maxLength={6}
        value={oldPin} onChange={e => setOldPin(e.target.value.replace(/\D/g,''))}
      />
      <input className="border border-gray-300 rounded px-2 py-1 text-xs w-20 focus:outline-none"
        placeholder="New PIN" type="password" inputMode="numeric" maxLength={6}
        value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g,''))}
      />
      <button
        onClick={async () => {
          const result = await changePin(oldPin, newPin)
          setMsg(result.success ? '✅' : '❌ ' + result.error)
          if (result.success) { setOpen(false); setOldPin(''); setNewPin('') }
        }}
        disabled={newPin.length < 4 || oldPin.length < 4}
        className="bg-teal-600 text-white text-xs px-2 py-1 rounded disabled:opacity-40">
        <Save size={12}/>
      </button>
      <button onClick={() => { setOpen(false); setOldPin(''); setNewPin('') }}
        className="text-gray-400 hover:text-gray-600 text-xs px-1">✕</button>
      {msg && <span className="text-xs">{msg}</span>}
    </div>
  )
}