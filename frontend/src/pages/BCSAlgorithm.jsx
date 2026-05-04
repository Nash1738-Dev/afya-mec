import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BCS_ALGORITHM } from '../data/methodDetails.js'
import { ArrowLeft, ChevronDown, ChevronUp, BookOpen, CheckCircle } from 'lucide-react'

const STAGE_COLORS = {
  blue: { bg: 'bg-blue-600', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  green: { bg: 'bg-green-600', light: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700' },
  purple: { bg: 'bg-purple-600', light: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
  orange: { bg: 'bg-orange-500', light: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
}

export default function BCSAlgorithm() {
  const navigate = useNavigate()
  const [openStage, setOpenStage] = useState(0)
  const [openStep, setOpenStep] = useState(null)

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-4">
        <ArrowLeft size={15}/> Back
      </button>

      <div className="mb-5">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <BookOpen className="text-blue-600" size={24}/> BCS+ Algorithm
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Balanced Counseling Strategy Plus — Kenya MOH (2023)
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Source: {BCS_ALGORITHM.source}
        </p>
      </div>

      {/* Overview */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
        <h3 className="font-bold text-blue-800 text-sm mb-2">About BCS+</h3>
        <p className="text-xs text-blue-700 leading-relaxed">
          The Balanced Counseling Strategy Plus (BCS+) is an evidence-based, client-centred approach
          for family planning counselling developed and tested in Kenya and South Africa.
          It guides providers through 4 stages and 15 steps to ensure clients receive
          complete, high-quality FP counselling in line with WHO MEC guidelines.
        </p>
        <div className="grid grid-cols-4 gap-2 mt-3">
          {BCS_ALGORITHM.stages.map(stage => {
            const c = STAGE_COLORS[stage.color]
            return (
              <div key={stage.id} className={`${c.light} ${c.border} border rounded-lg p-2 text-center`}>
                <div className="text-lg">{stage.icon}</div>
                <div className={`text-xs font-semibold ${c.text} mt-1`}>Stage {stage.number}</div>
                <div className="text-xs text-gray-500">{stage.title.replace(' Stage', '')}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Stages */}
      <div className="space-y-3">
        {BCS_ALGORITHM.stages.map((stage, sIdx) => {
          const c = STAGE_COLORS[stage.color]
          const isOpen = openStage === sIdx

          return (
            <div key={stage.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Stage Header */}
              <button
                onClick={() => setOpenStage(isOpen ? null : sIdx)}
                className={`w-full flex items-center justify-between p-4 ${isOpen ? c.bg + ' text-white' : 'hover:bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg
                    ${isOpen ? 'bg-white bg-opacity-20' : c.light}`}>
                    {stage.icon}
                  </div>
                  <div className="text-left">
                    <div className={`font-bold ${isOpen ? 'text-white' : 'text-gray-800'}`}>
                      Stage {stage.number}: {stage.title}
                    </div>
                    <div className={`text-xs ${isOpen ? 'text-white text-opacity-80' : 'text-gray-400'}`}>
                      {stage.steps.length} steps
                    </div>
                  </div>
                </div>
                {isOpen ? <ChevronUp size={18}/> : <ChevronDown size={18} className="text-gray-400"/>}
              </button>

              {/* Steps */}
              {isOpen && (
                <div className="divide-y divide-gray-100">
                  {stage.steps.map((step, stepIdx) => {
                    const stepKey = `${sIdx}-${stepIdx}`
                    const stepOpen = openStep === stepKey

                    return (
                      <div key={stepIdx}>
                        <button
                          onClick={() => setOpenStep(stepOpen ? null : stepKey)}
                          className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 text-left">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${c.badge}`}>
                            {step.step}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-700 text-sm">{step.title}</p>
                          </div>
                          {stepOpen
                            ? <ChevronUp size={15} className="text-gray-400 flex-shrink-0"/>
                            : <ChevronDown size={15} className="text-gray-400 flex-shrink-0"/>}
                        </button>

                        {stepOpen && (
                          <div className={`px-4 pb-4 ml-10 ${c.light} mx-3 mb-3 rounded-lg p-3`}>
                            <p className={`text-sm ${c.text} mb-3`}>{step.detail}</p>
                            {step.tips && step.tips.length > 0 && (
                              <div>
                                <p className="text-xs font-bold text-gray-600 mb-1">💡 Tips for provider:</p>
                                <ul className="space-y-1">
                                  {step.tips.map((tip, tIdx) => (
                                    <li key={tIdx} className="text-xs text-gray-600 flex items-start gap-1">
                                      <CheckCircle size={11} className={`${c.text} mt-0.5 flex-shrink-0`}/>
                                      {tip}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Quick Reference Card */}
      <div className="mt-5 bg-gray-800 text-white rounded-xl p-5">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          📌 Quick Reference — BCS+ Steps Summary
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {BCS_ALGORITHM.stages.flatMap(stage =>
            stage.steps.map(step => (
              <div key={step.step} className="flex items-start gap-1.5">
                <span className="text-gray-400 font-bold flex-shrink-0">{step.step}.</span>
                <span className="text-gray-300">{step.title}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}