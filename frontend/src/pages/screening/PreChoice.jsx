import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSession } from '../../hooks/useSession.jsx'
import { CheckCircle, XCircle, AlertTriangle, ChevronRight, ChevronLeft, Baby } from 'lucide-react'

const CHECKLIST_QUESTIONS = [
  {
    id: 'q1_lam',
    question: 'Did you have a baby less than 6 months ago, are you fully or nearly-fully breastfeeding, and have you had no menstrual period since then?',
    tag: 'LAM Criteria',
    color: 'blue',
  },
  {
    id: 'q2_abstained',
    question: 'Have you abstained from sexual intercourse since your last menstrual period or delivery?',
    tag: 'Abstinence',
    color: 'purple',
  },
  {
    id: 'q3_recent_birth',
    question: 'Have you had a baby in the last 4 weeks?',
    tag: 'Recent Delivery',
    color: 'teal',
  },
  {
    id: 'q4_recent_period',
    question: 'Did your last menstrual period start within the past 7 days? (or within 12 days if planning to use an IUCD?)',
    tag: 'Recent LMP',
    color: 'green',
  },
  {
    id: 'q5_recent_abortion',
    question: 'Have you had a miscarriage or abortion in the past 7 days? (or within 12 days if planning to use an IUCD?)',
    tag: 'Post-Abortion',
    color: 'orange',
  },
  {
    id: 'q6_contraceptive',
    question: 'Have you been using a reliable contraceptive method consistently and correctly?',
    tag: 'Current Contraceptive',
    color: 'indigo',
  },
]

export default function PreChoice() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isAnon = searchParams.get('anon') === 'true'
  const { session, updateSession } = useSession()
  const [pdt_done, setPdtDone] = useState(session.pregnancy.pdt_done)
  const [pdt_result, setPdtResult] = useState(session.pregnancy.pdt_result)
  const [checklist, setChecklist] = useState(session.pregnancy.checklist)

  // Load anonymous client data into session on mount
  useEffect(() => {
    if (!isAnon) return
    try {
      const anonData = JSON.parse(sessionStorage.getItem('anon_session') || '{}')
      if (!anonData.is_anonymous) return
      updateSession('client', {
        first_name: 'Anonymous',
        last_name: 'Client',
        age: anonData.age || 25,
        sex: anonData.anon_sex || 'F',
        visit_type: anonData.visit_type || '1',
        first_ever_user: anonData.first_ever_user || '',
        disability_status: 0,
        facility_code: anonData.facility_code || '',
        provider_name: anonData.provider_name || '',
        is_anonymous: true,
        anon_sex: anonData.anon_sex,
        anon_age_bracket: anonData.anon_age_bracket,
      })
    } catch {}
  }, [isAnon])

  const anyYes = Object.values(checklist).some(v => v === true)
  const pdtNegative = pdt_done && pdt_result === 'negative'
  const pregnancyRuledOut = pdtNegative || anyYes
  const pdtPositive = pdt_done && pdt_result === 'positive'

  const toggleQuestion = (id) => {
    setChecklist(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleNext = () => {
    if (pdtPositive) return
    updateSession('pregnancy', {
      pdt_done,
      pdt_result,
      checklist,
      ruled_out: pregnancyRuledOut,
    })
    navigate('/session/screener')
  }

  const canProceed = pregnancyRuledOut && !pdtPositive

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Baby className="text-blue-600" size={24} /> Pregnancy Screening
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Stage 2 of 6 — BCS+ Pre-Choice | Client:{' '}
          {isAnon
            ? <strong className="text-teal-600">Anonymous Client</strong>
            : <strong>{session.client.first_name} {session.client.last_name}</strong>
          }
          {isAnon && <span className="ml-2 text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">Full Assessment</span>}
        </p>
      </div>

      {/* PDT Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
        <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
          🧪 Pregnancy Test (PDT)
          <span className="text-xs font-normal text-gray-400">— Most reliable method</span>
        </h3>

        <div className="flex gap-3 mb-4">
          {[{val: true, label: 'PDT Done'}, {val: false, label: 'PDT Not Done'}].map(opt => (
            <button key={String(opt.val)}
              onClick={() => { setPdtDone(opt.val); if (!opt.val) setPdtResult('') }}
              className={`flex-1 py-2 rounded-lg border-2 text-sm font-semibold transition-colors
                ${pdt_done === opt.val ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-600 hover:border-blue-300'}`}>
              {opt.label}
            </button>
          ))}
        </div>

        {pdt_done && (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">PDT Result:</label>
            <div className="flex gap-3">
              <button
                onClick={() => setPdtResult('negative')}
                className={`flex-1 py-3 rounded-lg border-2 text-sm font-bold flex items-center justify-center gap-2 transition-colors
                  ${pdt_result === 'negative' ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-600 hover:border-green-300'}`}>
                <CheckCircle size={16}/> Negative (Not Pregnant)
              </button>
              <button
                onClick={() => setPdtResult('positive')}
                className={`flex-1 py-3 rounded-lg border-2 text-sm font-bold flex items-center justify-center gap-2 transition-colors
                  ${pdt_result === 'positive' ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-gray-300 text-gray-600 hover:border-red-300'}`}>
                <XCircle size={16}/> Positive (Pregnant)
              </button>
            </div>

            {pdtNegative && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle size={18} className="text-green-500"/>
                <p className="text-green-700 text-sm font-medium">Pregnancy ruled out — PDT confirmed negative. Proceed to screening.</p>
              </div>
            )}

            {pdtPositive && (
              <div className="mt-3 bg-red-50 border border-red-300 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle size={18} className="text-red-500"/>
                  <p className="text-red-700 font-bold">Client is pregnant — contraception not required.</p>
                </div>
                <p className="text-red-600 text-sm">Refer client for Antenatal Care (ANC). Session cannot proceed for contraception provision.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* WHO Checklist — only show if PDT not done or not positive */}
      {!pdtNegative && !pdtPositive && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
          <h3 className="font-bold text-gray-700 mb-1 flex items-center gap-2">
            📋 WHO Pregnancy Exclusion Checklist
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Ask each question. If the client answers <strong>YES</strong> to any question and has no signs/symptoms of pregnancy — pregnancy is ruled out. Stop as soon as you get a YES.
          </p>

          <div className="space-y-3">
            {CHECKLIST_QUESTIONS.map((q, idx) => (
              <div key={q.id}
                onClick={() => toggleQuestion(q.id)}
                className={`rounded-lg border-2 p-4 cursor-pointer transition-all select-none
                  ${checklist[q.id]
                    ? 'bg-green-50 border-green-400'
                    : 'bg-white border-gray-200 hover:border-blue-300'}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 font-bold text-xs
                    ${checklist[q.id] ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 text-gray-400'}`}>
                    {checklist[q.id] ? '✓' : idx + 1}
                  </div>
                  <div className="flex-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full mr-2
                      ${checklist[q.id] ? 'bg-green-200 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                      {q.tag}
                    </span>
                    <p className={`mt-1 text-sm ${checklist[q.id] ? 'text-green-800 font-medium' : 'text-gray-700'}`}>
                      {q.question}
                    </p>
                  </div>
                  <div className={`text-sm font-bold px-3 py-1 rounded-lg flex-shrink-0
                    ${checklist[q.id] ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {checklist[q.id] ? 'YES' : 'NO'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Result */}
          <div className="mt-4">
            {anyYes && (
              <div className="bg-green-50 border border-green-300 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle size={18} className="text-green-500"/>
                <p className="text-green-700 text-sm font-medium">
                  Pregnancy reasonably ruled out — client answered YES to at least one question. Proceed to screening.
                </p>
              </div>
            )}
            {!anyYes && (
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 flex items-center gap-2">
                <AlertTriangle size={18} className="text-yellow-600"/>
                <p className="text-yellow-700 text-sm">
                  All answers are NO — pregnancy cannot be excluded. Client should await menses or perform a PDT before proceeding.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => navigate(isAnon ? '/anonymous-entry' : '/session/registration')}
          className="flex items-center gap-1 px-5 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium">
          <ChevronLeft size={16}/> Back
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className={`flex items-center gap-2 font-bold py-3 px-8 rounded-xl shadow transition-colors
            ${canProceed
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
          Next: Medical Screening <ChevronRight size={18}/>
        </button>
      </div>
    </div>
  )
}