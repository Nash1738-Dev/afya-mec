import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { Activity, Home, Settings, BarChart3, Menu, X, Users, LogOut, BookOpen, GraduationCap, Shield, ChevronDown, User, Bell } from 'lucide-react'
import { syncPendingSessions } from '../../utils/api.js'
import { getPendingCount } from '../../utils/offlineQueue.js'
import { logout, getCurrentUser } from '../../utils/auth.js'
import FloatingActions from "../FloatingActions.jsx"
import { getFacilitySettings } from '../../utils/facilitySettings.js'

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
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false)
  const adminRef = useRef(null)
  const currentUser = getCurrentUser()

  const facilitySettings = getFacilitySettings()
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || ''

  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)
  const warningTimer = useRef(null)
  const logoutTimer = useRef(null)

  const resetTimers = () => {
    clearTimeout(warningTimer.current)
    clearTimeout(logoutTimer.current)
    setShowTimeoutWarning(false)
    warningTimer.current = setTimeout(() => {
      setShowTimeoutWarning(true)
    }, 25 * 60 * 1000)
    logoutTimer.current = setTimeout(() => {
      logout()
      window.location.href = '/login?reason=timeout'
    }, 30 * 60 * 1000)
  }

  useEffect(() => {
    resetTimers()
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach(e => window.addEventListener(e, resetTimers, { passive: true }))
    return () => {
      clearTimeout(warningTimer.current)
      clearTimeout(logoutTimer.current)
      events.forEach(e => window.removeEventListener(e, resetTimers))
    }
  }, [])

  // Close admin dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (adminRef.current && !adminRef.current.contains(e.target)) {
        setAdminDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
    setAdminDropdownOpen(false)
    if (confirm('Log out of AfyaNova?')) {
      logout()
      window.location.href = '/login'
    }
  }

  // Nav items — Admin removed (now lives in top-left dropdown)
  const navItems = [
    { icon: <Home size={16}/>, label: 'Dashboard', path: '/' },
    { icon: <Users size={16}/>, label: 'Clients', path: '/clients' },
    { icon: <BookOpen size={16}/>, label: 'Methods', path: '/methods' },
    { icon: <BarChart3 size={16}/>, label: 'Reports', path: '/reports' },
    { icon: <BookOpen size={16}/>, label: 'Resources', path: '/resources' },
    { icon: <GraduationCap size={16}/>, label: 'Mentor', path: '/mentor' },
    { icon: <Settings size={16}/>, label: 'Settings', path: '/settings' },
  ]

  // Initials from name
  const initials = currentUser?.name
    ? currentUser.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'AD'

  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Top Nav */}
      <header
        className="text-white shadow-lg sticky top-0 z-50"
        role="banner"
        style={{ background: 'linear-gradient(135deg, #0d7377 0%, #0f766e 100%)' }}
      >
        <div className="w-full px-0 flex items-center h-13" style={{ height: '52px' }}>

          {/* ── Admin block — top left ── */}
          <div
            ref={adminRef}
            className="relative flex items-center h-full flex-shrink-0"
            style={{ borderRight: '1px solid rgba(255,255,255,0.18)' }}
          >
            <button
              onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
              className="flex items-center gap-2 px-3 h-full hover:bg-white hover:bg-opacity-10 transition-colors"
              aria-label="Admin menu"
              aria-expanded={adminDropdownOpen}
            >
              {/* Avatar circle */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.22)', border: '1.5px solid rgba(255,255,255,0.35)' }}
              >
                {initials}
              </div>
              {/* Name + role — hidden on small screens */}
              <div className="hidden md:flex flex-col items-start leading-tight">
                <span className="text-white font-semibold text-xs">{currentUser?.name || 'Admin'}</span>
                <span className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {currentUser?.role || 'admin'}
                </span>
              </div>
              <ChevronDown
                size={13}
                className="hidden md:block transition-transform"
                style={{
                  color: 'rgba(255,255,255,0.6)',
                  transform: adminDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              />
            </button>

            {/* Admin dropdown */}
            {adminDropdownOpen && (
              <div
                className="absolute top-full left-0 bg-white rounded-b-xl shadow-xl overflow-hidden z-50"
                style={{ minWidth: '210px', border: '0.5px solid #e0e0e0' }}
              >
                {/* Dropdown header */}
                <div className="px-4 py-3" style={{ background: '#f8faf9', borderBottom: '1px solid #f0f0f0' }}>
                  <p className="font-semibold text-sm" style={{ color: '#0d7377' }}>{currentUser?.name || 'Administrator'}</p>
                  <p className="text-xs text-gray-500 capitalize">{currentUser?.role || 'Facility Admin'}</p>
                </div>

                {/* Admin panel — only for admin role */}
                {currentUser?.role === 'admin' && (
                  <button
                    onClick={() => { navigate('/admin'); setAdminDropdownOpen(false) }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-teal-50 transition-colors"
                  >
                    <Shield size={15} style={{ color: '#0d7377' }} />
                    Admin panel
                  </button>
                )}

                <button
                  onClick={() => { navigate('/settings'); setAdminDropdownOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-teal-50 transition-colors"
                >
                  <Settings size={15} style={{ color: '#0d7377' }} />
                  Settings
                </button>

                {/* Log out — red, separated */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                  style={{ color: '#c0392b', borderTop: '1px solid #f0f0f0' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={15} style={{ color: '#c0392b' }} />
                  Log out
                </button>
              </div>
            )}
          </div>

          {/* ── Brand — AfyaNova ── */}
          <div
            className="flex items-center gap-2.5 cursor-pointer flex-shrink-0 px-3 h-full hover:bg-white hover:bg-opacity-10 transition-colors"
            style={{ borderRight: '1px solid rgba(255,255,255,0.18)' }}
            onClick={() => navigate('/')}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              🌿
            </div>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="font-bold text-sm tracking-wide text-white">AfyaNova</span>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>Informed Choice · Better Health</span>
            </div>
          </div>

          {/* ── Desktop Nav links ── */}
          <nav className="hidden sm:flex items-center flex-1 h-full px-1 overflow-x-auto" aria-label="Main navigation">
            {navItems.map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-1.5 px-2.5 h-full text-xs font-medium whitespace-nowrap transition-colors relative flex-shrink-0"
                style={{
                  color: location.pathname === item.path ? '#fff' : 'rgba(255,255,255,0.72)',
                  fontWeight: location.pathname === item.path ? '700' : '500',
                }}
              >
                {item.icon}
                {item.label}
                {/* Active underline */}
                {location.pathname === item.path && (
                  <span
                    className="absolute bottom-0 left-0 right-0 rounded-t"
                    style={{ height: '3px', background: '#5de0b5' }}
                  />
                )}
              </button>
            ))}
          </nav>

          {/* ── Right side ── */}
          <div className="flex items-center gap-2 px-3 ml-auto flex-shrink-0" style={{ borderLeft: '1px solid rgba(255,255,255,0.18)' }}>
            {/* Offline badge */}
            {pendingCount > 0 && (
              <button
                onClick={async () => {
                  const synced = await syncPendingSessions()
                  if (synced > 0) {
                    setPendingCount(0)
                    alert(`✅ ${synced} synced!`)
                  }
                }}
                className="flex items-center gap-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full"
              >
                📱 {pendingCount}
              </button>
            )}

            {/* New Session button */}
            <button
              onClick={() => { window.location.href = '/session/registration' }}
              className="hidden sm:flex items-center gap-1 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: '#5de0b5', color: '#0d4a3e' }}
              onMouseEnter={e => e.currentTarget.style.background = '#3dcca0'}
              onMouseLeave={e => e.currentTarget.style.background = '#5de0b5'}
            >
              + New Session
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden p-1.5 rounded-lg hover:bg-white hover:bg-opacity-10"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={22}/> : <Menu size={22}/>}
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        {menuOpen && (
          <div className="sm:hidden border-t px-3 py-3 space-y-1" style={{ background: '#0a5c60', borderColor: 'rgba(255,255,255,0.15)' }}>
            {navItems.map(item => (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setMenuOpen(false) }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
                style={{
                  background: location.pathname === item.path ? 'rgba(255,255,255,0.18)' : 'transparent',
                  color: location.pathname === item.path ? '#fff' : 'rgba(255,255,255,0.8)',
                  fontWeight: location.pathname === item.path ? '700' : '400',
                }}
              >
                {item.icon} {item.label}
              </button>
            ))}
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => { navigate('/admin'); setMenuOpen(false) }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm"
                style={{ color: 'rgba(255,255,255,0.8)' }}
              >
                <Shield size={16}/> Admin panel
              </button>
            )}
            <button
              onClick={() => { window.location.href = '/session/registration'; setMenuOpen(false) }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold mt-2"
              style={{ background: '#5de0b5', color: '#0d4a3e' }}
            >
              + New Session
            </button>
            <div className="pt-2 mt-1 flex items-center justify-between px-1" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>{currentUser?.name}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs px-2 py-1 rounded"
                style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.4)' }}
              >
                <LogOut size={13}/> Log out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── Progress Steps (session flow) ── */}
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
                          active ? 'border-teal-600 text-white' :
                          'bg-white border-gray-300 text-gray-400'}`}
                        style={active ? { background: '#0d7377' } : {}}
                      >
                        {done ? '✓' : step.step}
                      </div>
                      <span className={`text-xs mt-0.5 font-medium whitespace-nowrap
                        ${active ? 'text-teal-700' : done ? 'text-green-600' : 'text-gray-400'}`}>
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

      {/* ── Page Content ── */}
      <main id="main-content" className="flex-1 max-w-5xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        <Outlet />
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 overflow-x-auto whitespace-nowrap"
        aria-label="Mobile navigation"
      >
        <div className="flex w-max">
          {navItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="px-4 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors"
              style={{ color: location.pathname === item.path ? '#0d7377' : '#9ca3af', fontWeight: location.pathname === item.path ? '700' : '400' }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          <button
            onClick={() => { window.location.href = '/session/registration' }}
            className="px-4 flex flex-col items-center gap-0.5 py-2 text-xs font-bold sticky right-0 bg-white"
            style={{ color: '#0d7377', boxShadow: '-10px 0 10px -10px rgba(0,0,0,0.1)' }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center -mt-4 shadow-lg" style={{ background: '#0d7377' }}>
              <span className="text-white text-lg font-bold">+</span>
            </div>
            <span className="mt-0.5">New</span>
          </button>
        </div>
      </nav>

      {/* Bottom padding for mobile nav */}
      <div className="sm:hidden h-16"/>

      {/* Footer */}
      <footer className="hidden sm:block bg-gray-800 text-gray-400 text-center text-xs py-3">
        AfyaNova Platform — Kenya MOH | WHO MEC 6th Edition (2025) | BCS+ Protocol
      </footer>

      {/* ── Session Timeout Warning ── */}
      {showTimeoutWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
            <div className="text-4xl mb-3">⏰</div>
            <h3 className="font-bold text-gray-800 text-lg mb-2">Session Expiring Soon</h3>
            <p className="text-gray-500 text-sm mb-4">
              You will be automatically logged out in <strong>5 minutes</strong> due to inactivity.
            </p>
            <button
              onClick={() => { resetTimers(); setShowTimeoutWarning(false) }}
              className="w-full text-white font-bold py-3 rounded-xl transition-colors"
              style={{ background: '#0d7377' }}
            >
              I'm still here — Continue Session
            </button>
          </div>
        </div>
      )}

      {/* Floating Actions */}
      <FloatingActions geminiApiKey={geminiApiKey}/>
    </div>
  )
}
