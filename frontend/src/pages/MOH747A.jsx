import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Download, ChevronLeft, ChevronRight, Plus, RefreshCw } from 'lucide-react'
import { getFacilitySettings } from '../utils/facilitySettings.js'
import * as XLSX from 'xlsx'

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']

const COMMODITIES = [
  { id: 'dmpa_im', name: 'DMPA Injection 150mg/mL IM', unit: 'Vial' },
  { id: 'dmpa_sc', name: 'DMPA Injection 104mg/0.65mL SC (Sayana Press)', unit: 'Vial' },
  { id: 'implant_1rod', name: '1 Rod Implant (Etonogestrel 68mg)', unit: 'Set' },
  { id: 'implant_2rod_5yr', name: '2 Rod Implant 5 years (Levonorgestrel 75mg)', unit: 'Set' },
  { id: 'implant_2rod_3yr', name: '2 Rod Implant 3 years (Levonorgestrel 75mg)', unit: 'Set' },
  { id: 'iud_hormonal', name: 'IUD Hormonal', unit: 'Set' },
  { id: 'iud_non_hormonal', name: 'IUD Non-hormonal (Copper T)', unit: 'Set' },
  { id: 'coc', name: 'Combined Oral Contraceptive Pills (COC)', unit: 'Cycle' },
  { id: 'ecp', name: 'Emergency Contraceptive Pills (EC)', unit: 'Dose' },
  { id: 'pop', name: 'Progestin Only Pills (POP)', unit: 'Cycle' },
  { id: 'condom_m', name: 'Condoms, Male', unit: 'Piece' },
  { id: 'condom_f', name: 'Condoms, Female', unit: 'Piece' },
  { id: 'cycle_beads', name: 'Cycle Beads', unit: 'Piece' },
]

const STORAGE_KEY = 'moh747a_records'

const emptyRecord = () => ({
  beginning_balance: '',
  received_kemsa: '',
  received_red_cross: '',
  dispensed: '',
  expired: '',
  damaged: '',
  missing: '',
  positive_adjustment: '',
  negative_adjustment: '',
  remarks: '',
})

const emptyMonth = () => {
  const record = {}
  COMMODITIES.forEach(c => { record[c.id] = emptyRecord() })
  return record
}

export default function MOH747A() {
  const navigate = useNavigate()
  const facility = getFacilitySettings()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const period = `${year}${String(month).padStart(2,'0')}`

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      setData(stored)
    } catch {}
  }, [])

  const getMonthData = () => {
    return data[period] || emptyMonth()
  }

  const updateField = useCallback((commodityId, field, value) => {
    setData(prev => ({
      ...prev,
      [period]: {
        ...(prev[period] || emptyMonth()),
        [commodityId]: {
          ...((prev[period] || emptyMonth())[commodityId] || emptyRecord()),
          [field]: value
        }
      }
    }))
    setSaved(false)
  }, [period])

  const handleSave = () => {
    setSaving(true)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {}
    setSaving(false)
  }

  const calcEndingBalance = (row) => {
    const b = parseFloat(row.beginning_balance) || 0
    const rk = parseFloat(row.received_kemsa) || 0
    const rc = parseFloat(row.received_red_cross) || 0
    const d = parseFloat(row.dispensed) || 0
    const exp = parseFloat(row.expired) || 0
    const dam = parseFloat(row.damaged) || 0
    const mis = parseFloat(row.missing) || 0
    const pos = parseFloat(row.positive_adjustment) || 0
    const neg = parseFloat(row.negative_adjustment) || 0
    return b + rk + rc - d - exp - dam - mis + pos - neg
  }

  const calcDaysOutOfStock = (row) => {
    const dispensed = parseFloat(row.dispensed) || 0
    const beginning = parseFloat(row.beginning_balance) || 0
    if (beginning === 0 && dispensed === 0) return 0
    return 0 // Placeholder — requires daily tracking
  }

  const exportToExcel = () => {
    const monthData = getMonthData()
    const rows = [
      ['MINISTRY OF HEALTH', '', '', '', '', '', '', '', '', '', '', ''],
      ['Facility Contraceptives Consumption Data Report & Request (FCDRR-FP) — MOH 747A', '', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', '', ''],
      [`County: ${facility.county || ''}`, '', `Sub-County: ${facility.sub_county || ''}`, '', '', '', '', '', '', '', '', ''],
      [`Facility: ${facility.facility_name || ''}`, '', `KMHFL Code: ${facility.facility_code || ''}`, '', '', '', '', '', '', '', '', ''],
      [`Reporting Period: ${MONTHS[month-1]} ${year}`, '', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', '', ''],
      [
        'Contraceptive Method', 'Unit',
        'Beginning Balance (A)',
        'Received from KEMSA',
        'Received from Kenya Red Cross',
        'Dispensed (C)',
        'Expired', 'Damaged', 'Missing',
        'Ending Balance (F)',
        'Days Out of Stock',
        'Remarks'
      ],
    ]

    COMMODITIES.forEach(c => {
      const row = monthData[c.id] || emptyRecord()
      const ending = calcEndingBalance(row)
      rows.push([
        c.name, c.unit,
        row.beginning_balance || 0,
        row.received_kemsa || 0,
        row.received_red_cross || 0,
        row.dispensed || 0,
        row.expired || 0,
        row.damaged || 0,
        row.missing || 0,
        ending,
        calcDaysOutOfStock(row),
        row.remarks || '',
      ])
    })

    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{wch:40},{wch:8},{wch:12},{wch:12},{wch:15},{wch:12},
      {wch:10},{wch:10},{wch:10},{wch:12},{wch:12},{wch:20}]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'MOH 747A')
    XLSX.writeFile(wb, `MOH747A_${facility.facility_name || 'Facility'}_${MONTHS[month-1]}_${year}.xlsx`)
  }

  const monthData = getMonthData()
  const savedPeriods = Object.keys(data).sort().reverse()

  const Input = ({ commodityId, field, small }) => (
    <input
      type="number"
      min="0"
      className={`border border-gray-200 rounded px-1.5 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400 w-full
        ${small ? 'w-14' : 'w-16'}`}
      value={monthData[commodityId]?.[field] || ''}
      onChange={e => updateField(commodityId, field, e.target.value)}
    />
  )

  return (
    <div className="max-w-full mx-auto">
      <button onClick={() => navigate('/reports')}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-4">
        <ArrowLeft size={15}/> Back to Reports
      </button>

      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">MOH 747A — FCDRR</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Facility Contraceptives Consumption Data Report & Request
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving}
            className={`flex items-center gap-1 font-bold px-4 py-2 rounded-xl text-sm transition-colors
              ${saved ? 'bg-green-500 text-white' : 'text-white'}`}
            style={!saved ? {background: '#0d7377'} : {}}>
            {saving ? <RefreshCw size={14} className="animate-spin"/> : <Save size={14}/>}
            {saved ? '✅ Saved' : 'Save'}
          </button>
          <button onClick={exportToExcel}
            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
            <Download size={14}/> Export Excel
          </button>
        </div>
      </div>

      {/* Facility Info */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div><span className="text-gray-400 text-xs">County:</span><p className="font-semibold">{facility.county || '—'}</p></div>
          <div><span className="text-gray-400 text-xs">Sub-County:</span><p className="font-semibold">{facility.sub_county || '—'}</p></div>
          <div><span className="text-gray-400 text-xs">Facility:</span><p className="font-semibold">{facility.facility_name || '—'}</p></div>
          <div><span className="text-gray-400 text-xs">KMHFL Code:</span><p className="font-semibold">{facility.facility_code || '—'}</p></div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => setMonth(m => m === 1 ? 12 : m-1)}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
            <ChevronLeft size={16}/>
          </button>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            value={month} onChange={e => setMonth(parseInt(e.target.value))}>
            {MONTHS.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            value={year} onChange={e => setYear(parseInt(e.target.value))}>
            {[2023,2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => setMonth(m => m === 12 ? 1 : m+1)}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
            <ChevronRight size={16}/>
          </button>
        </div>

        {/* Previous months */}
        {savedPeriods.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-400 self-center">Saved:</span>
            {savedPeriods.slice(0,6).map(p => (
              <button key={p}
                onClick={() => { setYear(parseInt(p.slice(0,4))); setMonth(parseInt(p.slice(4,6))) }}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors
                  ${period === p ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-200 text-gray-600 hover:border-teal-300'}`}>
                {MONTHS[parseInt(p.slice(4,6))-1].slice(0,3)} {p.slice(0,4)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
        <div className="p-3 text-white text-sm font-bold"
          style={{background: 'linear-gradient(135deg, #0d7377 0%, #0f766e 100%)'}}>
          Reporting Period: {MONTHS[month-1]} {year}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-2 font-semibold text-gray-600 min-w-48">Contraceptive Method</th>
                <th className="text-center px-2 py-2 font-semibold text-gray-500 w-12">Unit</th>
                <th className="text-center px-2 py-2 font-semibold text-teal-600 w-16">Begin Balance (A)</th>
                <th className="text-center px-2 py-2 font-semibold text-gray-600 w-16">From KEMSA</th>
                <th className="text-center px-2 py-2 font-semibold text-gray-600 w-16">Red Cross</th>
                <th className="text-center px-2 py-2 font-semibold text-blue-600 w-16">Dispensed (C)</th>
                <th className="text-center px-2 py-2 font-semibold text-red-500 w-14">Expired</th>
                <th className="text-center px-2 py-2 font-semibold text-red-500 w-14">Damaged</th>
                <th className="text-center px-2 py-2 font-semibold text-red-500 w-14">Missing</th>
                <th className="text-center px-2 py-2 font-semibold text-green-600 w-16">End Balance (F)</th>
                <th className="text-center px-2 py-2 font-semibold text-gray-500 w-20">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {COMMODITIES.map((c, idx) => {
                const row = monthData[c.id] || emptyRecord()
                const ending = calcEndingBalance(row)
                const isLow = ending < 3 && ending >= 0
                const isOut = ending <= 0

                return (
                  <tr key={c.id}
                    className={`border-b border-gray-100
                      ${isOut ? 'bg-red-50' : isLow ? 'bg-yellow-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-3 py-2 text-gray-700 font-medium">{c.name}</td>
                    <td className="px-2 py-2 text-center text-gray-400">{c.unit}</td>
                    <td className="px-2 py-2"><Input commodityId={c.id} field="beginning_balance"/></td>
                    <td className="px-2 py-2"><Input commodityId={c.id} field="received_kemsa"/></td>
                    <td className="px-2 py-2"><Input commodityId={c.id} field="received_red_cross"/></td>
                    <td className="px-2 py-2"><Input commodityId={c.id} field="dispensed"/></td>
                    <td className="px-2 py-2"><Input commodityId={c.id} field="expired" small/></td>
                    <td className="px-2 py-2"><Input commodityId={c.id} field="damaged" small/></td>
                    <td className="px-2 py-2"><Input commodityId={c.id} field="missing" small/></td>
                    <td className="px-2 py-2 text-center">
                      <div className={`font-bold text-sm px-2 py-1 rounded-lg
                        ${isOut ? 'bg-red-100 text-red-600' :
                          isLow ? 'bg-yellow-100 text-yellow-600' :
                          'bg-green-50 text-green-700'}`}>
                        {ending}
                        {isOut && <span className="block text-xs">OUT</span>}
                        {isLow && !isOut && <span className="block text-xs">LOW</span>}
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <input type="text"
                        className="border border-gray-200 rounded px-1.5 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-teal-400"
                        placeholder="Notes..."
                        value={row.remarks || ''}
                        onChange={e => updateField(c.id, 'remarks', e.target.value)}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="p-3 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-red-100 rounded inline-block"/>Out of stock
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-yellow-100 rounded inline-block"/>Low stock (&lt;3 units)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-green-50 rounded inline-block"/>Adequate stock
          </span>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <h3 className="font-bold text-gray-700 text-sm mb-2">Comments (Logistics & Clinical):</h3>
        <textarea rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          placeholder="Add any logistics or clinical comments..."
          value={data[period]?.comments || ''}
          onChange={e => setData(prev => ({...prev, [period]: {...(prev[period] || {}), comments: e.target.value}}))}
        />
      </div>

      {/* Submitted by */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <h3 className="font-bold text-gray-700 text-sm mb-3">Submitted by:</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Name:</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="Provider name"
              value={data[period]?.submitted_by || facility.provider_name || ''}
              onChange={e => setData(prev => ({...prev, [period]: {...(prev[period] || {}), submitted_by: e.target.value}}))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Designation:</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="Cadre/designation"
              value={data[period]?.designation || facility.provider_cadre || ''}
              onChange={e => setData(prev => ({...prev, [period]: {...(prev[period] || {}), designation: e.target.value}}))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Signature Date:</label>
            <input type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              value={data[period]?.signature_date || new Date().toISOString().slice(0,10)}
              onChange={e => setData(prev => ({...prev, [period]: {...(prev[period] || {}), signature_date: e.target.value}}))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Telephone:</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="Phone number"
              value={data[period]?.telephone || facility.provider_number || ''}
              onChange={e => setData(prev => ({...prev, [period]: {...(prev[period] || {}), telephone: e.target.value}}))}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button onClick={handleSave}
        className={`w-full flex items-center justify-center gap-2 font-bold py-4 rounded-2xl shadow-lg transition-all mb-4
          ${saved ? 'bg-green-500 text-white' : 'text-white'}`}
        style={!saved ? {background: 'linear-gradient(135deg, #0d7377 0%, #14a044 100%)'} : {}}>
        {saved ? '✅ Saved Successfully' : <><Save size={18}/> Save MOH 747A Record</>}
      </button>
    </div>
  )
}