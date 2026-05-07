import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{background: 'linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%)'}}>
      <div className="text-center max-w-sm">
        <div className="text-8xl mb-4">🌿</div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
        <p className="text-gray-500 mb-6">Page not found</p>
        <button
          onClick={() => navigate('/')}
          className="text-white font-bold px-6 py-3 rounded-xl"
          style={{background: '#0d7377'}}>
          Back to Dashboard
        </button>
      </div>
    </div>
  )
}