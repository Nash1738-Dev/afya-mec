import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Plus, Trash2, ArrowLeft, Eye, EyeOff, Shield, Save } from 'lucide-react'
import { getUsers, saveUsers, getCurrentUser, getPendingUsers, approveUser, rejectUser } from '../utils/auth.js'

const ROLES = ['admin', 'provider', 'viewer']

export default function ManageUsers() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const [users, setUsers] = useState(getUsers())
  const [showForm, setShowForm] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', pin: '', role: 'provider' })
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState('')

  const handleAddUser = () => {
    if (!newUser.name.trim()) { setError('Name is required'); return }
    if (newUser.pin.length < 4) { setError('PIN must be at least 4 digits'); return }
    if (users.find(u => u.name.toLowerCase() === newUser.name.toLowerCase())) {
      setError('A user with this name already exists'); return
    }
    const updated = [...users, {
      id: Date.now().toString(),
      name: newUser.name.trim(),
      pin: newUser.pin,
      role: newUser.role,
    }]
    setUsers(updated)
    saveUsers(updated)
    setNewUser({ name: '', pin: '', role: 'provider' })
    setShowForm(false)
    setError('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleDelete = (id) => {
    if (id === '1') { alert('Cannot delete the default admin user'); return }
    if (currentUser?.id === id) { alert('Cannot delete your own account'); return }
    if (!confirm('Delete this user?')) return
    const updated = users.filter(u => u.id !== id)
    setUsers(updated)
    saveUsers(updated)
  }

  const handleChangePIN = (id, newPin) => {
    if (newPin.length < 4) return
    const updated = users.map(u => u.id === id ? { ...u, pin: newPin } : u)
    setUsers(updated)
    saveUsers(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate('/settings')}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-4">
        <ArrowLeft size={15}/> Back to Settings
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-blue-600" size={24}/> Manage Users
          </h2>
          <p className="text-gray-500 text-sm mt-1">Add or remove provider accounts</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
          <Plus size={14}/> Add User
        </button>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-green-700 text-sm font-medium">
          ✅ Changes saved successfully
        </div>
      )}

      {/* Pending Approvals */}
      {getPendingUsers().length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <h3 className="font-bold text-amber-700 mb-3 flex items-center gap-2">
            ⏳ Pending Approval Requests ({getPendingUsers().length})
          </h3>
          <div className="space-y-3">
            {getPendingUsers().map(u => (
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
                    <button
                      onClick={() => {
                        approveUser(u.id)
                        setSaved(true)
                        setTimeout(() => setSaved(false), 2000)
                        window.location.reload()
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Reject ${u.name}'s request?`)) {
                          rejectUser(u.id)
                          window.location.reload()
                        }
                      }}
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

      {/* Add User Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-5 mb-4">
          <h3 className="font-bold text-gray-700 mb-3">New User</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Provider name"
                value={newUser.name}
                onChange={e => { setNewUser(p => ({ ...p, name: e.target.value })); setError('') }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">PIN (4-6 digits)</label>
              <div className="relative">
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 pr-9"
                  placeholder="e.g. 1234"
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={6}
                  value={newUser.pin}
                  onChange={e => {
                    setNewUser(p => ({ ...p, pin: e.target.value.replace(/\D/g,'').slice(0,6) }))
                    setError('')
                  }}
                />
                <button onClick={() => setShowPin(!showPin)}
                  className="absolute right-2 top-2.5 text-gray-400">
                  {showPin ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={newUser.role}
                onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}>
                <option value="provider">Provider (full access)</option>
                <option value="admin">Admin (+ manage users)</option>
                <option value="viewer">Viewer (read only)</option>
              </select>
            </div>
          </div>
          {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleAddUser}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm">
              Add User
            </button>
            <button onClick={() => { setShowForm(false); setError('') }}
              className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {users.map((u, idx) => (
          <div key={u.id}
            className={`flex items-center justify-between p-4 ${idx < users.length-1 ? 'border-b border-gray-100' : ''}`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm
                ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                {u.name[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm flex items-center gap-1">
                  {u.name}
                  {u.role === 'admin' && <Shield size={12} className="text-purple-500"/>}
                  {u.id === currentUser?.id && (
                    <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full">You</span>
                  )}
                </p>
                <p className="text-xs text-gray-400 capitalize">{u.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ChangePINButton userId={u.id} onSave={handleChangePIN}/>
              {u.id !== '1' && u.id !== currentUser?.id && (
                <button onClick={() => handleDelete(u.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 size={15}/>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChangePINButton({ userId, onSave }) {
  const [open, setOpen] = useState(false)
  const [newPin, setNewPin] = useState('')

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50">
      Change PIN
    </button>
  )

  return (
    <div className="flex items-center gap-1">
      <input
        className="border border-gray-300 rounded px-2 py-1 text-xs w-20 focus:outline-none focus:ring-1 focus:ring-blue-400"
        placeholder="New PIN"
        type="password"
        inputMode="numeric"
        maxLength={6}
        value={newPin}
        onChange={e => setNewPin(e.target.value.replace(/\D/g,'').slice(0,6))}
      />
      <button onClick={() => { onSave(userId, newPin); setOpen(false); setNewPin('') }}
        disabled={newPin.length < 4}
        className="bg-blue-600 text-white text-xs px-2 py-1 rounded disabled:opacity-40">
        <Save size={12}/>
      </button>
      <button onClick={() => { setOpen(false); setNewPin('') }}
        className="text-gray-400 hover:text-gray-600">
        <ArrowLeft size={14}/>
      </button>
    </div>
  )
}