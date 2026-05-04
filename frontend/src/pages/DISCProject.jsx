import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Send, CheckCircle, Calendar } from 'lucide-react'
import { getFacilitySettings } from '../utils/facilitySettings.js'

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']

const ONA_ENKETO_URL = 'https://enketo.ona.io/x/cEU4LnRS'

export default function DISCProject() {
  const navigate = useNavigate()
  const facility = getFacilitySettings()
  const now = new Date()
  const [submissions, setSubmissions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('disc_submissions') || '[]') }
    catch { return [] }
  })

  const recordSubmission = (month, year) => {
    const updated = [...submissions.filter(s => !(s.month === month && s.year === year)),
      { month, year, date: new Date().toISOString(), facility: facility.facility_name }
    ]
    setSubmissions(updated)
    localStorage.setItem('disc_submissions', JSON.stringify(updated))
  }

  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const hasSubmittedThisMonth = submissions.some(
    s => s.month === currentMonth && s.year === currentYear
  )

  const openForm = () => {
    window.open(ONA_ENKETO_URL, '_blank')
    // Record after short delay
    setTimeout(() => {
      recordSubmission(currentMonth, currentYear)
    }, 3000)
  }

  return (
    <div className="max-w-lg mx-auto">
      <button onClick={() => navigate('/reports')}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-4">
        <ArrowLeft size={15}/> Back to Reports
      </button>

      <div className="mb-5">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Send size={24} className="text-teal-600"/> DISC Project Data Submission
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Monthly FP data submission via ONA Enketo
        </p>
      </div>

      {/* Status Banner */}
      <div className={`rounded-xl p-4 mb-5 border ${
        hasSubmittedThisMonth
          ? 'bg-green-50 border-green-200'
          : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-center gap-3">
          {hasSubmittedThisMonth
            ? <CheckCircle size={24} className="text-green-500"/>
            : <Calendar size={24} className="text-amber-500"/>}
          <div>
            <p className={`font-bold ${hasSubmittedThisMonth ? 'text-green-700' : 'text-amber-700'}`}>
              {hasSubmittedThisMonth
                ? `✅ ${MONTHS[currentMonth-1]} ${currentYear} — Submitted`
                : `⏳ ${MONTHS[currentMonth-1]} ${currentYear} — Pending Submission`}
            </p>
            <p className={`text-sm mt-0.5 ${hasSubmittedThisMonth ? 'text-green-600' : 'text-amber-600'}`}>
              {hasSubmittedThisMonth
                ? 'Monthly data has been submitted for this period'
                : 'Monthly data submission is due for this period'}
            </p>
          </div>
        </div>
      </div>

      {/* Facility Info */}
      {facility.facility_name && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
          <h3 className="font-bold text-gray-700 text-sm mb-2">Submitting for:</h3>
          <p className="font-semibold text-gray-800">{facility.facility_name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {[facility.ward, facility.sub_county, facility.county].filter(Boolean).join(', ')}
            {facility.facility_code && ` | KHIS: ${facility.facility_code}`}
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
        <h3 className="font-bold text-gray-700 mb-3">How to Submit</h3>
        <ol className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 flex-shrink-0">1</span>
            Generate your MOH 711 report for the reporting month (use the MOH 711 Generator)
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 flex-shrink-0">2</span>
            Click the Submit button below — the ONA Enketo form will open
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 flex-shrink-0">3</span>
            Fill in your monthly FP data in the ONA form using your MOH 711 figures
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 flex-shrink-0">4</span>
            Submit the form — your submission will be recorded in this tracker
          </li>
        </ol>
      </div>

      {/* Submit Button */}
      <button onClick={openForm}
        className="w-full flex items-center justify-center gap-3 text-white font-bold py-4 rounded-2xl text-base shadow-lg mb-4 transition-all hover:shadow-xl"
        style={{background: 'linear-gradient(135deg, #0d7377 0%, #14a044 100%)'}}>
        <ExternalLink size={20}/>
        Open ONA Enketo Form — Submit {MONTHS[currentMonth-1]} Data
      </button>

      {/* Quick link */}
      <div className="text-center mb-4">
        <a href={ONA_ENKETO_URL} target="_blank" rel="noopener noreferrer"
          className="text-xs text-teal-600 hover:underline">
          Direct link: {ONA_ENKETO_URL}
        </a>
      </div>

      {/* Submission History */}
      {submissions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 className="font-bold text-gray-700 text-sm mb-3">Submission History</h3>
          <div className="space-y-2">
            {submissions
              .sort((a,b) => new Date(b.date) - new Date(a.date))
              .slice(0, 12)
              .map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-500"/>
                    <span className="font-medium text-gray-700">
                      {MONTHS[s.month-1]} {s.year}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(s.date).toLocaleDateString('en-KE')}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}