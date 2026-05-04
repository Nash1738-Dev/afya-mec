import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Activity, Home, Settings, BarChart3, Menu, X, Users, LogOut, BookOpen } from 'lucide-react'
import { syncPendingSessions } from '../../utils/api.js'
import { getPendingCount } from '../../utils/offlineQueue.js'
import { logout, getCurrentUser } from '../../utils/auth.js'

const steps = [
  { path: '/session/registration', label: 'Client', step: 1 },
  { path: '/session/pre-choice', label: 'Pregnancy', step: 2 },
  { path: '/session/screener', label: 'Screening', step: 3 },
  { path: '/session/methods', label: 'Methods', step: 4 },
  { path: '/session/counselling', label: 'Counselling', step: 5 },
  { path: '/session/summary', label: 'Summary', step: 6 },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const isSession = location.pathname.startsWith('/session')
  const currentStep = steps.findIndex(s => s.path === location.pathname) + 1
  const [pendingCount, setPendingCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const currentUser = getCurrentUser()

  useEffect(() => {
    const checkPending = async () => {
      const count = await getPendingCount()
      setPendingCount(count)
    }
    const syncOnReconnect = async () => {
      const synced = await syncPendingSessions()
      if (synced > 0) {
        setPendingCount(0)
        alert(`✅ ${synced} offline session(s) synced.`)
      }
    }
    checkPending()
    const interval = setInterval(async () => {
      const count = await getPendingCount()
      setPendingCount(count)
      if (count > 0) syncOnReconnect()
    }, 30000)
    window.addEventListener('online', syncOnReconnect)
    return () => {
      window.removeEventListener('online', syncOnReconnect)
      clearInterval(interval)
    }
  }, [])

  const handleLogout = () => {
    if (confirm('Log out?')) {
      logout()
      window.location.href = '/login'
    }
  }

  const navItems = [
    { icon: <Home size={18}/>, label: 'Dashboard', path: '/' },
    { icon: <Users size={18}/>, label: 'Clients', path: '/clients' },
    { icon: <BarChart3 size={18}/>, label: 'Reports', path: '/reports' },
    { icon: <BookOpen size={18}/>, label: 'Resources', path: '/resources' },
    { icon: <Settings size={18}/>, label: 'Settings', path: '/settings' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Nav */}
      <header className="text-white shadow-lg sticky top-0 z-50" style={{background: 'linear-gradient(135deg, #0d7377 0%, #0f766e 100%)'}}>
        <div className="max-w-5xl mx-auto px-3 py-2.5 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer flex-shrink-0"
            onClick={() => navigate('/')}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold"
              style={{background: 'rgba(255,255,255,0.2)'}}>
              🌿
            </div>
            <div>
              <div className="font-bold text-base leading-tight tracking-wide">AfyaMEC</div>
              <div className="text-xs opacity-75 hidden sm:block">Informed Choice · Better Health</div>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-1">
            {navItems.map(item => (
              <button key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors
                  ${location.pathname === item.path
                    ? 'bg-white bg-opacity-20 text-white'
                    : 'text-blue-200 hover:text-white hover:bg-white hover:bg-opacity-10'}`}>
                {item.icon} {item.label}
              </button>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <button
                onClick={async () => {
                  const synced = await syncPendingSessions()
                  if (synced > 0) {
                    setPendingCount(0)
                    alert(`✅ ${synced} synced!`)
                  }
                }}
                className="flex items-center gap-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                📱 {pendingCount}
              </button>
            )}

            {/* New Session button */}
            <button
              onClick={() => { window.location.href = '/session/registration' }}
              className="bg-white text-blue-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-50 hidden sm:block">
              + New Session
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden p-1.5 rounded-lg hover:bg-blue-600">
              {menuOpen ? <X size={22}/> : <Menu size={22}/>}
            </button>

            {/* Desktop logout */}
            <div className="hidden sm:flex items-center gap-2 border-l border-blue-600 pl-3">
              <span className="text-xs text-blue-200">{currentUser?.name}</span>
              <button onClick={handleLogout}
                className="text-xs text-blue-200 hover:text-white border border-blue-500 px-2 py-1 rounded">
                <LogOut size={14}/>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {menuOpen && (
          <div className="sm:hidden bg-blue-800 border-t border-blue-600 px-3 py-3 space-y-1">
            {navItems.map(item => (
              <button key={item.path}
                onClick={() => { navigate(item.path); setMenuOpen(false) }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-100 hover:bg-blue-700 hover:text-white">
                {item.icon} {item.label}
              </button>
            ))}
            <button
              onClick={() => { window.location.href = '/session/registration'; setMenuOpen(false) }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm bg-white text-blue-700 font-bold mt-2">
              + New Session
            </button>
            <div className="border-t border-blue-600 pt-2 mt-2 flex items-center justify-between px-3">
              <span className="text-xs text-blue-300">{currentUser?.name}</span>
              <button onClick={handleLogout}
                className="flex items-center gap-1 text-xs text-blue-300 hover:text-white">
                <LogOut size={14}/> Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Progress Steps — mobile optimized */}
      {isSession && (
        <div className="bg-white border-b border-gray-200 shadow-sm overflow-x-auto">
          <div className="min-w-max mx-auto px-4 py-2">
            <div className="flex items-center">
              {steps.map((step, idx) => {
                const done = currentStep > step.step
                const active = currentStep === step.step
                return (
                  <div key={step.path} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors
                        ${done ? 'bg-green-500 border-green-500 text-white' :
                          active ? 'bg-blue-600 border-blue-600 text-white' :
                          'bg-white border-gray-300 text-gray-400'}`}>
                        {done ? '✓' : step.step}
                      </div>
                      <span className={`text-xs mt-0.5 font-medium whitespace-nowrap
                        ${active ? 'text-blue-600' : done ? 'text-green-600' : 'text-gray-400'}`}>
                        {step.label}
                      </span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`h-0.5 w-6 sm:w-12 mx-1 mb-4 flex-shrink-0
                        ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Page Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="flex">
          {navItems.map(item => (
            <button key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors
                ${location.pathname === item.path
                  ? 'text-blue-600'
                  : 'text-gray-400 hover:text-gray-600'}`}>
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          <button
            onClick={() => { window.location.href = '/session/registration' }}
            className="flex-1 flex flex-col items-center gap-0.5 py-2 text-xs text-blue-600 font-bold">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center -mt-4 shadow-lg">
              <span className="text-white text-lg font-bold">+</span>
            </div>
            <span className="mt-0.5">New</span>
          </button>
        </div>
      </nav>

      {/* Bottom padding for mobile nav */}
      <div className="sm:hidden h-16"/>

      {/* Footer - desktop only */}
      <footer className="hidden sm:block bg-gray-800 text-gray-400 text-center text-xs py-3">
        AfyaMEC Platform — Kenya MOH | WHO MEC 6th Edition (2025) | BCS+ Protocol
      </footer>
    </div>
  )
}