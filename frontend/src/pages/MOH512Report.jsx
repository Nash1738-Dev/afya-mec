import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Download, FileText, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { getFacilitySettings } from '../utils/facilitySettings.js'
import API from '../utils/api.js'
import * as XLSX from 'xlsx'

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']

const METHOD_LABELS = {
  COC:'COC', POP:'POP', DMPA_IM:'DMPA-IM', DMPA_SC:'DMPA-SC',
  NET_EN:'NET-EN', IMPLANT:'Implant', IMPLANT_1ROD:'Implant-1R',
  IMPLANT_2ROD:'Implant-2R', CU_IUD:'Cu-IUD', LNG_IUS:'LNG-IUS',
  CONDOM_M:'Condom(M)', CONDOM_F:'Condom(F)', CONDOM_BOTH:'Condom(B)',
  LAM:'LAM', FAM:'FAM', BTL:'BTL', VASECTOMY:'Vasectomy',
  EC_PILL:'ECP', EC_IUD:'EC-IUD',
}

const VISIT_CAT = { 1:'New', 2:'Removal', 3:'Reinsertion', 4:'Checkup' }

export default function MOH512Report() {
  const navigate = useNavigate()
  const facility = getFacilitySettings()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('register') // 'register' | 'summary'
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  const generateReport = async () => {
    setLoading(true)
    setReport(null)
    setPage(1)
    try {
      const res = await API.get(`/export/moh512/report?month=${month}&year=${year}`)
      setReport(res.data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const exportToExcel = () => {
    if (!report) return
    const rows = [
      [`MOH 512 — Family Planning Client Register`],
      [`Facility: ${facility.facility_name || '—'}`, `Period: ${MONTHS[month-1]} ${year}`],
      [`Total Records: ${report.total}`],
      [],
      [
        'No.', 'Date', 'Reg No.', 'Name', 'Age', 'Sex',
        'Visit Type', '1st Ever', 'Disability',
        'Weight', 'BP', 'PDT',
        'Method', 'Visit Cat.', 'Qty',
        'DMPA Mode', 'Take-Home',
        'HIV Coun.', 'HIV Tested', 'HIV Status',
        'TB', 'IPV', 'Cerv.Method', 'Cerv.Result',
        'Condom Type', 'Condom Qty',
        'Natural FP', 'Cycle Beads',
        'PPFP', 'Ref In', 'Ref Out',
        'Return Date', 'Remarks', 'Provider'
      ]
    ]

    report.visits.forEach((v, i) => {
      const name = v.is_anonymous
        ? `Anon (${v.anon_sex || v.sex}/${v.anon_age_bracket || v.age})`
        : `${v.first_name} ${v.last_name}`
      rows.push([
        i + 1,
        v.visit_date,
        v.reg_number,
        name,
        v.is_anonymous ? v.anon_age_bracket : v.age,
        v.is_anonymous ? v.anon_sex : v.sex,
        v.visit_type === 1 ? 'New' : 'Revisit',
        v.first_ever_user ? 'Y' : 'N',
        v.disability_status || 0,
        v.weight_kg,
        v.bp_systolic && v.bp_diastolic ? `${v.bp_systolic}/${v.bp_diastolic}` : '',
        v.pdt_done ? (v.pdt_result || 'Done') : 'N',
        METHOD_LABELS[v.primary_method] || v.primary_method,
        VISIT_CAT[v.method_visit_category] || '',
        v.quantity_dispensed,
        v.dmpa_sc_mode,
        v.dmpa_take_home_doses,
        v.hiv_counselled ? 'Y' : 'N',
        v.hiv_tested ? 'Y' : 'N',
        v.hiv_status || '',
        v.tb_status || '',
        v.ipv_status || '',
        v.cervical_method,
        v.cervical_result || '',
        v.condom_type,
        v.condom_qty || '',
        v.natural_fp ? 'Y' : 'N',
        v.cycle_beads ? 'Y' : 'N',
        v.ppfp_timing || '',
        v.referral_in || '',
        v.referral_out || '',
        v.return_date,
        v.remarks,
        v.provider_name,
      ])
    })

    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = Array(34).fill({ wch: 14 })
    ws['!cols'][3] = { wch: 22 }
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'MOH 512')
    XLSX.writeFile(wb, `MOH512_${facility.facility_name || 'Facility'}_${MONTHS[month-1]}_${year}.xlsx`)
  }

  // Summary stats from visits
  const summary = report ? (() => {
    const v = report.visits
    const methodCounts = {}
    let newClients = 0, revisits = 0, firstEver = 0, anonymous = 0
    let adolescents = 0, youth = 0, adults = 0
    let hivCounselled = 0, hivTested = 0, cervScreened = 0
    let naturalFP = 0, cycleBeads = 0

    v.forEach(r => {
      if (r.visit_type === 1) newClients++; else revisits++
      if (r.first_ever_user) firstEver++
      if (r.is_anonymous) anonymous++
      const age = r.is_anonymous ? null : parseInt(r.age)
      if (!r.is_anonymous && age) {
        if (age < 20) adolescents++
        else if (age < 25) youth++
        else adults++
      } else if (r.is_anonymous && r.anon_age_bracket) {
        if (['10-14','15-19'].includes(r.anon_age_bracket)) adolescents++
        else if (r.anon_age_bracket === '20-24') youth++
        else adults++
      }
      if (r.hiv_counselled) hivCounselled++
      if (r.hiv_tested) hivTested++
      if (r.cervical_method) cervScreened++
      if (r.natural_fp) naturalFP++
      if (r.cycle_beads) cycleBeads++
      if (r.primary_method) {
        methodCounts[r.primary_method] = (methodCounts[r.primary_method] || 0) + 1
      }
    })
    return {
      total: v.length, newClients, revisits, firstEver, anonymous,
      adolescents, youth, adults,
      hivCounselled, hivTested, cervScreened, naturalFP, cycleBeads,
      methodCounts
    }
  })() : null

  const totalPages = report ? Math.ceil(report.visits.length / PAGE_SIZE) : 0
  const pageVisits = report ? report.visits.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE) : []

  return (
    <div className="max-w-full mx-auto">
      <button onClick={() => navigate('/reports')}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-4">
        <ArrowLeft size={15}/> Back to Reports
      </button>

      <div className="mb-5">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FileText size={24} className="text-blue-600"/> MOH 512 — Client Register
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Family Planning client register filtered by month & year
        </p>
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
        <h3 className="font-bold text-gray-700 mb-3">Select Reporting Period</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setMonth(m => m === 1 ? 12 : m-1)}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                <ChevronLeft size={16}/>
              </button>
              <select
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={month} onChange={e => setMonth(parseInt(e.target.value))}>
                {MONTHS.map((m, i) => (
                  <option key={i+1} value={i+1}>{m}</option>
                ))}
              </select>
              <button onClick={() => setMonth(m => m === 12 ? 1 : m+1)}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                <ChevronRight size={16}/>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={year} onChange={e => setYear(parseInt(e.target.value))}>
              {[2023,2024,2025,2026,2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={generateReport} disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 font-bold py-3 rounded-xl transition-all
              ${loading ? 'bg-gray-200 text-gray-400' : 'text-white'}`}
            style={!loading ? {background:'linear-gradient(135deg,#1e40af 0%,#0d7377 100%)'} : {}}>
            {loading ? <RefreshCw size={16} className="animate-spin"/> : <Eye size={16}/>}
            {loading ? 'Loading...' : `View ${MONTHS[month-1]} ${year} Register`}
          </button>
          {report && (
            <button onClick={exportToExcel}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-5 rounded-xl">
              <Download size={16}/> Export Excel
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      {report && (
        <div className="flex gap-2 mb-4">
          {[
            { key:'register', label:'📋 Client Register' },
            { key:'summary', label:'📊 Summary Stats' },
          ].map(tab => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors
                ${activeTab === tab.key ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              style={activeTab === tab.key ? {background:'#1e40af'} : {}}>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Register Table */}
      {report && activeTab === 'register' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
          {/* Header */}
          <div className="p-4 text-white" style={{background:'linear-gradient(135deg,#1e40af 0%,#0d7377 100%)'}}>
            <p className="text-xs text-blue-200 uppercase tracking-wide">Kenya Ministry of Health</p>
            <h3 className="font-bold text-lg mt-0.5">MOH 512 — FP Client Register</h3>
            <p className="text-blue-200 text-sm mt-1">
              {facility.facility_name || 'Facility'} | {MONTHS[month-1]} {year}
            </p>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="bg-white bg-opacity-15 rounded-lg p-2 text-center">
                <div className="text-xl font-bold">{report.total}</div>
                <div className="text-xs text-blue-200">Total Visits</div>
              </div>
              <div className="bg-white bg-opacity-15 rounded-lg p-2 text-center">
                <div className="text-xl font-bold">{summary.newClients}</div>
                <div className="text-xs text-blue-200">New Clients</div>
              </div>
              <div className="bg-white bg-opacity-15 rounded-lg p-2 text-center">
                <div className="text-xl font-bold">{summary.revisits}</div>
                <div className="text-xs text-blue-200">Revisits</div>
              </div>
            </div>
          </div>

          {report.total === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText size={40} className="mx-auto mb-3 opacity-30"/>
              <p>No visits recorded for {MONTHS[month-1]} {year}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-2 py-2 text-left font-semibold text-gray-500 w-8">#</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">Date</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">Reg No.</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-600">Name</th>
                      <th className="px-2 py-2 text-center font-semibold text-gray-600">Age</th>
                      <th className="px-2 py-2 text-center font-semibold text-gray-600">Sex</th>
                      <th className="px-2 py-2 text-center font-semibold text-gray-600 whitespace-nowrap">Visit</th>
                      <th className="px-2 py-2 text-center font-semibold text-gray-600">1st</th>
                      <th className="px-2 py-2 text-left font-semibold text-blue-600 whitespace-nowrap">Method</th>
                      <th className="px-2 py-2 text-center font-semibold text-gray-600">Qty</th>
                      <th className="px-2 py-2 text-center font-semibold text-gray-600">BP</th>
                      <th className="px-2 py-2 text-center font-semibold text-gray-600">Wt</th>
                      <th className="px-2 py-2 text-center font-semibold text-gray-600">PDT</th>
                      <th className="px-2 py-2 text-center font-semibold text-green-600 whitespace-nowrap">HIV C.</th>
                      <th className="px-2 py-2 text-center font-semibold text-green-600 whitespace-nowrap">HIV T.</th>
                      <th className="px-2 py-2 text-center font-semibold text-purple-600 whitespace-nowrap">Cerv.</th>
                      <th className="px-2 py-2 text-center font-semibold text-gray-600 whitespace-nowrap">Nat.FP</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">Return Date</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-500">Provider</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageVisits.map((v, idx) => {
                      const rowNum = (page - 1) * PAGE_SIZE + idx + 1
                      const isAnon = v.is_anonymous
                      const name = isAnon
                        ? `Anon (${v.anon_sex || v.sex}/${v.anon_age_bracket || v.age})`
                        : `${v.first_name} ${v.last_name}`
                      const age = isAnon ? v.anon_age_bracket : v.age
                      const sex = isAnon ? v.anon_sex : v.sex

                      return (
                        <tr key={v.visit_id}
                          className={`border-b border-gray-100 hover:bg-blue-50 transition-colors
                            ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                            ${isAnon ? 'opacity-75' : ''}`}>
                          <td className="px-2 py-2 text-gray-400 text-center">{rowNum}</td>
                          <td className="px-2 py-2 text-gray-600 whitespace-nowrap">{v.visit_date}</td>
                          <td className="px-2 py-2 text-gray-500 whitespace-nowrap">
                            {isAnon
                              ? <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-xs">Anon</span>
                              : v.reg_number}
                          </td>
                          <td className="px-2 py-2 font-medium text-gray-800 whitespace-nowrap">
                            {name}
                            {isAnon && <span className="ml-1 text-xs text-gray-400">(anon)</span>}
                          </td>
                          <td className="px-2 py-2 text-center text-gray-600">{age}</td>
                          <td className="px-2 py-2 text-center text-gray-600">{sex}</td>
                          <td className="px-2 py-2 text-center">
                            <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold
                              ${v.visit_type === 1 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                              {v.visit_type === 1 ? 'New' : 'Rev'}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-center">
                            {v.first_ever_user
                              ? <span className="text-purple-600 font-bold">✓</span>
                              : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-2 py-2">
                            {v.primary_method ? (
                              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                                {METHOD_LABELS[v.primary_method] || v.primary_method}
                                {v.dmpa_sc_mode ? ` (${v.dmpa_sc_mode})` : ''}
                              </span>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-2 py-2 text-center text-gray-600">{v.quantity_dispensed || '—'}</td>
                          <td className="px-2 py-2 text-center text-gray-600 whitespace-nowrap">
                            {v.bp_systolic && v.bp_diastolic
                              ? `${v.bp_systolic}/${v.bp_diastolic}`
                              : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-2 py-2 text-center text-gray-600">
                            {v.weight_kg || <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {v.pdt_done
                              ? <span className="text-blue-600 font-semibold">{v.pdt_result || 'Y'}</span>
                              : <span className="text-gray-300">N</span>}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {v.hiv_counselled
                              ? <span className="text-green-600 font-bold">Y</span>
                              : <span className="text-gray-300">N</span>}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {v.hiv_tested
                              ? <span className="text-green-600 font-bold">Y</span>
                              : <span className="text-gray-300">N</span>}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {v.cervical_method
                              ? <span className="text-purple-600 font-semibold">{v.cervical_method}</span>
                              : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {v.natural_fp
                              ? <span className="text-orange-600 font-bold">Y</span>
                              : <span className="text-gray-300">N</span>}
                          </td>
                          <td className="px-2 py-2 text-gray-500 whitespace-nowrap">
                            {v.return_date || <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-2 py-2 text-gray-500 whitespace-nowrap">
                            {v.provider_name || <span className="text-gray-300">—</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
                  <p className="text-xs text-gray-500">
                    Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, report.total)} of {report.total} visits
                  </p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p-1))}
                      disabled={page === 1}
                      className="p-1.5 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-40">
                      <ChevronLeft size={14}/>
                    </button>
                    <span className="text-xs font-semibold text-gray-600">
                      {page} / {totalPages}
                    </span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p+1))}
                      disabled={page === totalPages}
                      className="p-1.5 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-40">
                      <ChevronRight size={14}/>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Summary Tab */}
      {report && activeTab === 'summary' && summary && (
        <div className="space-y-4">

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label:'Total Visits', value:summary.total, color:'text-blue-600', bg:'bg-blue-50' },
              { label:'New Clients', value:summary.newClients, color:'text-green-600', bg:'bg-green-50' },
              { label:'Revisits', value:summary.revisits, color:'text-gray-600', bg:'bg-gray-50' },
              { label:'1st Ever Users', value:summary.firstEver, color:'text-purple-600', bg:'bg-purple-50' },
              { label:'Adolescents (<20)', value:summary.adolescents, color:'text-orange-600', bg:'bg-orange-50' },
              { label:'Youth (20-24)', value:summary.youth, color:'text-yellow-600', bg:'bg-yellow-50' },
              { label:'Adults (25+)', value:summary.adults, color:'text-teal-600', bg:'bg-teal-50' },
              { label:'Anonymous', value:summary.anonymous, color:'text-gray-500', bg:'bg-gray-100' },
            ].map(card => (
              <div key={card.label} className={`${card.bg} rounded-xl p-4 border border-gray-100`}>
                <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                <div className="text-xs text-gray-500 mt-1">{card.label}</div>
              </div>
            ))}
          </div>

          {/* Preventive Services */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-bold text-gray-700 mb-4 text-sm">Preventive Services</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label:'HIV Counselled', value:summary.hivCounselled, color:'text-green-700', bg:'bg-green-50' },
                { label:'HIV Tested', value:summary.hivTested, color:'text-green-600', bg:'bg-green-50' },
                { label:'Cervical Screened', value:summary.cervScreened, color:'text-purple-600', bg:'bg-purple-50' },
                { label:'Natural FP Counselled', value:summary.naturalFP, color:'text-orange-600', bg:'bg-orange-50' },
                { label:'Cycle Beads Given', value:summary.cycleBeads, color:'text-yellow-600', bg:'bg-yellow-50' },
              ].map(item => (
                <div key={item.label} className={`${item.bg} rounded-lg p-3`}>
                  <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Method Mix */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-bold text-gray-700 mb-4 text-sm">Method Mix — {MONTHS[month-1]} {year}</h3>
            {Object.keys(summary.methodCounts).length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No method data</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(summary.methodCounts)
                  .sort((a,b) => b[1]-a[1])
                  .map(([method, count]) => {
                    const total = Object.values(summary.methodCounts).reduce((a,b)=>a+b,0)
                    const pct = Math.round((count/total)*100)
                    return (
                      <div key={method} className="flex items-center gap-3">
                        <div className="w-24 text-right text-xs font-semibold text-gray-600">
                          {METHOD_LABELS[method] || method}
                        </div>
                        <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                          <div className="bg-blue-500 h-5 rounded-full flex items-center justify-end pr-2"
                            style={{width:`${Math.max(pct,8)}%`, minWidth:'2rem'}}>
                            <span className="text-white text-xs font-bold">{pct}%</span>
                          </div>
                        </div>
                        <div className="w-8 text-xs text-gray-500 font-medium">{count}</div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>

          {/* Export reminder */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-blue-700 text-sm">Export full register to Excel</p>
              <p className="text-blue-500 text-xs mt-0.5">Includes all columns matching MOH 512 form fields</p>
            </div>
            <button onClick={exportToExcel}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm">
              <Download size={14}/> Export
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
