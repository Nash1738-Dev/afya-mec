import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Download, RefreshCw, TrendingUp, BarChart2 } from 'lucide-react'
import { getFacilitySettings } from '../utils/facilitySettings.js'
import * as XLSX from 'xlsx'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, ReferenceLine } from 'recharts'

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']

const ONA_ENKETO_URL = 'https://enketo.ona.io/x/cEU4LnRS'

export default function DISCProject() {
  const navigate = useNavigate()
  const facility = getFacilitySettings()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [loading, setLoading] = useState(false)
  const [monthlyData, setMonthlyData] = useState([])
  const [submissions, setSubmissions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('disc_submissions') || '[]') }
    catch { return [] }
  })

  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const token = localStorage.getItem('afyamec_auth_token')

  useEffect(() => { loadYearData() }, [year])

  const loadYearData = async () => {
    setLoading(true)
    const results = []
    for (let m = 1; m <= 12; m++) {
      try {
        const period = `${year}${String(m).padStart(2,'0')}`
        const res = await fetch(`/api/reports/moh711/${period}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          const fp = data.fp_section || {}
          const total_dmpa_sc = (fp.dmpa_sc_new || 0) + (fp.dmpa_sc_revisit || 0)
          const total_dmpa = total_dmpa_sc +
            (fp.dmpa_im_new || 0) + (fp.dmpa_im_revisit || 0)

          // Calculate SI-specific metrics from visits
          const siVisits = await getSIVisits(year, m)

          results.push({
            month: m,
            month_name: MONTHS[m-1],
            period,
            total_fp: fp.total_fp_clients || 0,
            total_dmpa_sc,
            total_dmpa_im: (fp.dmpa_im_new || 0) + (fp.dmpa_im_revisit || 0),
            total_dmpa,
            total_new: fp.dmpa_sc_new || 0,
            total_revisit: fp.dmpa_sc_revisit || 0,
            si_visits: siVisits.si,
            pa_visits: siVisits.pa,
            si_new: siVisits.si_new || 0,
            si_revisit: siVisits.si_revisit || 0,
            si_doses_new: siVisits.si_doses_new || 0,
            si_doses_revisit: siVisits.si_doses_revisit || 0,
            pa_new: siVisits.pa_new || 0,
            pa_revisit: siVisits.pa_revisit || 0,
            new_lapsed_si: siVisits.new_lapsed,
            pct_si: total_dmpa_sc > 0
              ? ((siVisits.si / total_dmpa_sc) * 100).toFixed(1)
              : 0,
            pct_new_lapsed: siVisits.si > 0
              ? ((siVisits.new_lapsed / siVisits.si) * 100).toFixed(1)
              : 0,
          })
        } else {
          results.push({
            month: m, month_name: MONTHS[m-1], period,
            total_fp: 0, total_dmpa_sc: 0, total_dmpa_im: 0, total_dmpa: 0,
            si_visits: 0, pa_visits: 0, new_lapsed_si: 0,
            total_new: 0, total_revisit: 0, pct_si: 0, pct_new_lapsed: 0,
            si_new: 0, si_revisit: 0, si_doses_new: 0, si_doses_revisit: 0,
            pa_new: 0, pa_revisit: 0
          })
        }
      } catch {
        results.push({
          month: m, month_name: MONTHS[m-1],
          period: `${year}${String(m).padStart(2,'0')}`,
          total_fp: 0, total_dmpa_sc: 0, total_dmpa_im: 0, total_dmpa: 0,
          si_visits: 0, pa_visits: 0, new_lapsed_si: 0,
          total_new: 0, total_revisit: 0, pct_si: 0, pct_new_lapsed: 0,
          si_new: 0, si_revisit: 0, si_doses_new: 0, si_doses_revisit: 0,
          pa_new: 0, pa_revisit: 0
        })
      }
    }
    setMonthlyData(results)
    setLoading(false)
  }

  const getSIVisits = async (y, m) => {
    try {
      const res = await fetch(`/api/visits/disc-stats?year=${y}&month=${m}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const d = await res.json()
        return {
          si: d.si_total || 0,
          pa: d.pa_total || 0,
          new_lapsed: d.si_new_lapsed || 0,
          si_new: d.si_new || 0,
          si_revisit: d.si_revisit || 0,
          si_doses_new: d.si_doses_new || 0,
          si_doses_revisit: d.si_doses_revisit || 0,
          pa_new: d.pa_new || 0,
          pa_revisit: d.pa_revisit || 0,
        }
      }
    } catch {}
    return { si: 0, pa: 0, new_lapsed: 0, si_new: 0, si_revisit: 0, si_doses_new: 0, si_doses_revisit: 0, pa_new: 0, pa_revisit: 0 }
  }

  const recordSubmission = (month, year) => {
    const updated = [...submissions.filter(s => !(s.month === month && s.year === year)),
      { month, year, date: new Date().toISOString(), facility: facility.facility_name }]
    setSubmissions(updated)
    localStorage.setItem('disc_submissions', JSON.stringify(updated))
  }

  const openForm = () => {
    window.open(ONA_ENKETO_URL, '_blank')
    setTimeout(() => recordSubmission(currentMonth, currentYear), 3000)
  }

  // Totals for the year
  const yearTotals = monthlyData.reduce((acc, m) => ({
    total_fp: acc.total_fp + m.total_fp,
    total_dmpa_sc: acc.total_dmpa_sc + m.total_dmpa_sc,
    total_dmpa_im: acc.total_dmpa_im + m.total_dmpa_im,
    si_visits: acc.si_visits + m.si_visits,
    pa_visits: acc.pa_visits + m.pa_visits,
    new_lapsed_si: acc.new_lapsed_si + m.new_lapsed_si,
    total_new: acc.total_new + m.total_new,
  }), {
    total_fp: 0, total_dmpa_sc: 0, total_dmpa_im: 0,
    si_visits: 0, pa_visits: 0, new_lapsed_si: 0, total_new: 0
  })

  const yearPctSI = yearTotals.total_dmpa_sc > 0
    ? ((yearTotals.si_visits / yearTotals.total_dmpa_sc) * 100).toFixed(1)
    : 0

  const exportExcel = () => {
    const wb = XLSX.utils.book_new()

    // ── Sheet 1: ONA Section 2 Data ──
    const onaRows = [
      ['DISC PROJECT — ONA ENKETO SECTION 2: SERVICE DELIVERY DATA', '', '', '', '', '', '', ''],
      [`Facility: ${facility.facility_name || '—'}  |  County: ${facility.county || '—'}  |  KHIS: ${facility.facility_code || '—'}  |  Year: ${year}`, '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      // Headers matching ONA form exactly
      [
        'Month',
        // DMPA-SC Total
        'DMPA-SC New Visits (Total)',
        'DMPA-SC Re-visits (Total)',
        'DMPA-SC Total Visits',
        // SI
        'SI New Visits',
        'SI Doses (New)',
        'SI Re-visits',
        'SI Doses (Re-visits incl. take-home)',
        'SI Total Visits',
        'SI Total Doses',
        // PA
        'PA New Visits',
        'PA Re-visits',
        'PA Total Visits',
        // Calculated
        '% DMPA-SC that are SI',
        'SI from New/Lapsed Users',
        '% SI from New/Lapsed',
      ],
      ...monthlyData.map(m => [
        m.month_name,
        m.total_new,
        m.total_revisit,
        m.total_dmpa_sc,
        m.si_new || 0,
        m.si_doses_new || 0,
        m.si_revisit || 0,
        m.si_doses_revisit || 0,
        m.si_visits,
        (m.si_doses_new || 0) + (m.si_doses_revisit || 0),
        m.pa_new || 0,
        m.pa_revisit || 0,
        m.pa_visits,
        `${m.pct_si}%`,
        m.new_lapsed_si,
        `${m.pct_new_lapsed}%`,
      ]),
      ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      // Totals
      [
        `TOTAL ${year}`,
        yearTotals.total_new || 0,
        (yearTotals.total_dmpa_sc - (yearTotals.total_new || 0)),
        yearTotals.total_dmpa_sc,
        monthlyData.reduce((a,m) => a + (m.si_new || 0), 0),
        monthlyData.reduce((a,m) => a + (m.si_doses_new || 0), 0),
        monthlyData.reduce((a,m) => a + (m.si_revisit || 0), 0),
        monthlyData.reduce((a,m) => a + (m.si_doses_revisit || 0), 0),
        yearTotals.si_visits,
        monthlyData.reduce((a,m) => a + (m.si_doses_new || 0) + (m.si_doses_revisit || 0), 0),
        monthlyData.reduce((a,m) => a + (m.pa_new || 0), 0),
        monthlyData.reduce((a,m) => a + (m.pa_revisit || 0), 0),
        yearTotals.pa_visits,
        `${yearPctSI}%`,
        yearTotals.new_lapsed_si,
        yearTotals.si_visits > 0
          ? `${((yearTotals.new_lapsed_si/yearTotals.si_visits)*100).toFixed(1)}%`
          : '0%',
      ],
    ]

    const ws1 = XLSX.utils.aoa_to_sheet(onaRows)
    ws1['!cols'] = Array(16).fill({wch: 16})
    ws1['!cols'][0] = {wch: 14}
    XLSX.utils.book_append_sheet(wb, ws1, 'ONA Section 2 Data')

    // ── Sheet 2: KPI Summary ──
    const kpiRows = [
      ['DISC KEY PERFORMANCE INDICATORS', '', '', ''],
      [`Year: ${year}  |  Facility: ${facility.facility_name || '—'}`, '', '', ''],
      ['', '', '', ''],
      ['Performance Indicator', 'Value', 'Target', 'Status'],
      ['# of Self-inject (SI) visits', yearTotals.si_visits, '—', yearTotals.si_visits > 0 ? '✅ Tracked' : '⚠️ No SI visits'],
      ['# of Provider-Administered (PA) visits', yearTotals.pa_visits || 0, '—', '✅ Tracked'],
      ['% of DMPA-SC visits that are self-injected', `${yearPctSI}%`, '≥50%', parseFloat(yearPctSI) >= 50 ? '✅ On target' : '⚠️ Below target'],
      ['# of DISC-supported facilities actively offering SI', 1, '—', '✅ Active'],
      ['# of SI visits from new/lapsed users', yearTotals.new_lapsed_si, '—', '✅ Tracked'],
      ['% SI visits from new/lapsed users', yearTotals.si_visits > 0 ? `${((yearTotals.new_lapsed_si/yearTotals.si_visits)*100).toFixed(1)}%` : '0%', '—', '✅ Tracked'],
      ['Total DMPA-SC clients (year)', yearTotals.total_dmpa_sc, '—', '✅ Tracked'],
      ['Total DMPA-SC new clients', yearTotals.total_new || 0, '—', '✅ Tracked'],
      ['Total SI doses dispensed', monthlyData.reduce((a,m) => a + (m.si_doses_new || 0) + (m.si_doses_revisit || 0), 0), '—', '✅ Tracked'],
      ['', '', '', ''],
      ['QUARTERLY BREAKDOWN', '', '', ''],
      ['Quarter', 'DMPA-SC Total', 'SI Visits', '% SI'],
      ...['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)'].map((q, qi) => {
        const qMonths = monthlyData.slice(qi*3, qi*3+3)
        const totSC = qMonths.reduce((a,m) => a + m.total_dmpa_sc, 0)
        const totSI = qMonths.reduce((a,m) => a + m.si_visits, 0)
        return [q, totSC, totSI, totSC > 0 ? `${((totSI/totSC)*100).toFixed(1)}%` : '0%']
      })
    ]
    const ws2 = XLSX.utils.aoa_to_sheet(kpiRows)
    ws2['!cols'] = [{wch:45},{wch:16},{wch:12},{wch:20}]
    XLSX.utils.book_append_sheet(wb, ws2, 'KPI Summary')

    // ── Sheet 3: Chart Data ──
    const chartRows = [
      ['Month', 'DMPA-SC New', 'DMPA-SC Revisit', 'SI New', 'SI Revisit', 'PA New', 'PA Revisit', '% SI'],
      ...monthlyData.map(m => [
        m.month_name.substring(0,3),
        m.total_new,
        m.total_revisit,
        m.si_new || 0,
        m.si_revisit || 0,
        m.pa_new || 0,
        m.pa_revisit || 0,
        parseFloat(m.pct_si)
      ])
    ]
    const ws3 = XLSX.utils.aoa_to_sheet(chartRows)
    ws3['!cols'] = Array(8).fill({wch:14})
    XLSX.utils.book_append_sheet(wb, ws3, 'Chart Data')

    XLSX.writeFile(wb, `DISC_ONA_Section2_${facility.facility_name || 'Facility'}_${year}.xlsx`)
  }

  const hasSubmittedThisMonth = submissions.some(
    s => s.month === currentMonth && s.year === currentYear
  )

  const maxDMPASC = Math.max(...monthlyData.map(m => m.total_dmpa_sc), 1)
  const maxSI = Math.max(...monthlyData.map(m => m.si_visits), 1)

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => navigate('/reports')}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-4">
        <ArrowLeft size={15}/> Back to Reports
      </button>

      <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp size={24} className="text-teal-600"/> DISC Project Dashboard
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            DMPA-SC Self-Injection Monitoring — {facility.facility_name || 'Your Facility'}
          </p>
        </div>
        <div className="flex gap-2">
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            value={year}
            onChange={e => setYear(parseInt(e.target.value))}>
            {[2023,2024,2025,2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button onClick={loadYearData} disabled={loading}
            className="flex items-center gap-1 border border-gray-300 rounded-lg px-3 py-2 text-sm hover:bg-gray-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''}/> Refresh
          </button>
          <button onClick={exportExcel}
            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg text-sm">
            <Download size={14}/> Export Excel
          </button>
        </div>
      </div>

      {/* ── ANALYTICS DASHBOARD ── */}
      <div className="space-y-4 mb-5">

        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total DMPA-SC', value: yearTotals.total_dmpa_sc, color: '#0d7377', icon: '💉', sub: `${year} total` },
            { label: 'SI Visits', value: yearTotals.si_visits, color: '#14a044', icon: '🏠', sub: 'self-injection' },
            {
              label: '% SI', value: `${yearPctSI}%`,
              color: parseFloat(yearPctSI) >= 50 ? '#14a044' : parseFloat(yearPctSI) >= 30 ? '#f59e0b' : '#dc2626',
              icon: '📊',
              sub: parseFloat(yearPctSI) >= 50 ? '✅ On target' : '⚠️ Below 50%'
            },
            { label: 'New/Lapsed SI', value: yearTotals.new_lapsed_si, color: '#7c3aed', icon: '👤', sub: 'first-time SI users' },
          ].map((k, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg">{k.icon}</span>
              </div>
              <p className="text-2xl font-bold" style={{color: k.color}}>{k.value}</p>
              <p className="text-xs font-bold text-gray-600 mt-0.5">{k.label}</p>
              <p className="text-xs text-gray-400">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Chart 1 — DMPA-SC Total vs SI vs PA */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-bold text-gray-700 text-sm mb-1">DMPA-SC Visits — Total vs SI vs PA</h3>
          <p className="text-xs text-gray-400 mb-4">Monthly breakdown of provider-administered and self-injection visits</p>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              <RefreshCw size={20} className="animate-spin mr-2"/> Loading...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} margin={{top:5, right:10, left:-20, bottom:0}}
                barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="month_name" tickFormatter={v => v.substring(0,3)}
                  tick={{fontSize:11, fill:'#9ca3af'}}/>
                <YAxis tick={{fontSize:11, fill:'#9ca3af'}}/>
                <Tooltip
                  contentStyle={{background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, fontSize:12}}
                  formatter={(val, name) => [val, name]}/>
                <Legend wrapperStyle={{fontSize:12, paddingTop:8}}/>
                <Bar dataKey="total_dmpa_sc" name="DMPA-SC Total" fill="#0d7377" radius={[3,3,0,0]}/>
                <Bar dataKey="si_visits" name="SI Visits" fill="#14a044" radius={[3,3,0,0]}/>
                <Bar dataKey="pa_visits" name="PA Visits" fill="#93c5fd" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart 2 — % SI trend line */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-bold text-gray-700 text-sm mb-1">% of DMPA-SC Visits that are Self-Injected</h3>
          <p className="text-xs text-gray-400 mb-4">Target: ≥50% — dashed line shows target</p>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              <RefreshCw size={20} className="animate-spin mr-2"/> Loading...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={monthlyData} margin={{top:5, right:10, left:-20, bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="month_name" tickFormatter={v => v.substring(0,3)}
                  tick={{fontSize:11, fill:'#9ca3af'}}/>
                <YAxis domain={[0,100]} tickFormatter={v => `${v}%`}
                  tick={{fontSize:11, fill:'#9ca3af'}}/>
                <Tooltip
                  contentStyle={{background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, fontSize:12}}
                  formatter={(val) => [`${val}%`, '% SI']}/>
                <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="6 3"
                  label={{value:'50% target', fill:'#f59e0b', fontSize:10, position:'insideTopRight'}}/>
                <Area dataKey="pct_si" name="% SI" fill="rgba(13,115,119,0.08)"
                  stroke="#0d7377" strokeWidth={2} dot={{fill:'#0d7377', r:3}}/>
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Charts 3 & 4 side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* SI New vs Revisit stacked */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-bold text-gray-700 text-sm mb-1">SI Clients — New vs Revisit</h3>
            <p className="text-xs text-gray-400 mb-3">Stacked by visit type</p>
            {loading ? (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthlyData} margin={{top:0, right:5, left:-25, bottom:0}}
                  barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis dataKey="month_name" tickFormatter={v => v.substring(0,3)}
                    tick={{fontSize:10, fill:'#9ca3af'}}/>
                  <YAxis tick={{fontSize:10, fill:'#9ca3af'}}/>
                  <Tooltip contentStyle={{background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, fontSize:11}}/>
                  <Legend wrapperStyle={{fontSize:11}}/>
                  <Bar dataKey="si_new" name="SI New" fill="#0d7377" stackId="si" radius={[0,0,0,0]}/>
                  <Bar dataKey="si_revisit" name="SI Revisit" fill="#5eead4" stackId="si" radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* SI Doses stacked */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-bold text-gray-700 text-sm mb-1">SI Doses Dispensed</h3>
            <p className="text-xs text-gray-400 mb-3">New doses + revisit doses (incl. take-home)</p>
            {loading ? (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthlyData} margin={{top:0, right:5, left:-25, bottom:0}}
                  barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis dataKey="month_name" tickFormatter={v => v.substring(0,3)}
                    tick={{fontSize:10, fill:'#9ca3af'}}/>
                  <YAxis tick={{fontSize:10, fill:'#9ca3af'}}/>
                  <Tooltip contentStyle={{background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, fontSize:11}}/>
                  <Legend wrapperStyle={{fontSize:11}}/>
                  <Bar dataKey="si_doses_new" name="New doses" fill="#7c3aed" stackId="doses" radius={[0,0,0,0]}/>
                  <Bar dataKey="si_doses_revisit" name="Revisit doses" fill="#c4b5fd" stackId="doses" radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 5 — New/Lapsed SI users + % line */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-bold text-gray-700 text-sm mb-1">New/Lapsed SI Users Trend</h3>
          <p className="text-xs text-gray-400 mb-4">Bars = count, Line = % of SI visits from new/lapsed users</p>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Loading...</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={monthlyData} margin={{top:5, right:30, left:-20, bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="month_name" tickFormatter={v => v.substring(0,3)}
                  tick={{fontSize:11, fill:'#9ca3af'}}/>
                <YAxis yAxisId="left" tick={{fontSize:11, fill:'#9ca3af'}}/>
                <YAxis yAxisId="right" orientation="right" domain={[0,100]}
                  tickFormatter={v => `${v}%`} tick={{fontSize:11, fill:'#9ca3af'}}/>
                <Tooltip contentStyle={{background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, fontSize:12}}/>
                <Legend wrapperStyle={{fontSize:12}}/>
                <Bar yAxisId="left" dataKey="new_lapsed_si" name="New/lapsed SI users"
                  fill="#f59e0b" radius={[3,3,0,0]}/>
                <Line yAxisId="right" type="monotone" dataKey="pct_new_lapsed"
                  name="% from new/lapsed" stroke="#14a044" strokeWidth={2}
                  strokeDasharray="5 3" dot={{fill:'#14a044', r:3}}/>
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart 6 — DMPA-SC vs DMPA-IM comparison */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-bold text-gray-700 text-sm mb-1">Injectable Method Mix — DMPA-SC vs DMPA-IM</h3>
          <p className="text-xs text-gray-400 mb-4">Comparative trend showing shift towards subcutaneous injection</p>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Loading...</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyData} margin={{top:5, right:10, left:-20, bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="month_name" tickFormatter={v => v.substring(0,3)}
                  tick={{fontSize:11, fill:'#9ca3af'}}/>
                <YAxis tick={{fontSize:11, fill:'#9ca3af'}}/>
                <Tooltip contentStyle={{background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, fontSize:12}}/>
                <Legend wrapperStyle={{fontSize:12}}/>
                <Line type="monotone" dataKey="total_dmpa_sc" name="DMPA-SC"
                  stroke="#0d7377" strokeWidth={2} dot={{fill:'#0d7377', r:3}}/>
                <Line type="monotone" dataKey="total_dmpa_im" name="DMPA-IM"
                  stroke="#2563eb" strokeWidth={2} strokeDasharray="5 3"
                  dot={{fill:'#2563eb', r:3}}/>
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      {/* Monthly Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-5">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-700">DISC Performance Indicators — {year}</h3>
          <p className="text-xs text-gray-400 mt-0.5">Auto-populated from MOH 512 visit records</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-2 font-semibold text-gray-600">Month</th>
                <th className="text-center px-2 py-2 font-semibold text-teal-600">DMPA-SC</th>
                <th className="text-center px-2 py-2 font-semibold text-green-600">SI Visits</th>
                <th className="text-center px-2 py-2 font-semibold text-blue-600">PA Visits</th>
                <th className="text-center px-2 py-2 font-semibold text-purple-600">% SI</th>
                <th className="text-center px-2 py-2 font-semibold text-orange-600">New/Lapsed</th>
                <th className="text-center px-2 py-2 font-semibold text-gray-500">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((m, i) => {
                const submitted = submissions.some(s => s.month === m.month && s.year === year)
                const isCurrentMonth = m.month === currentMonth && year === currentYear
                return (
                  <tr key={m.month}
                    className={`border-b border-gray-100
                      ${isCurrentMonth ? 'bg-teal-50' : i%2===0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-3 py-2 font-medium text-gray-700">
                      {m.month_name.substring(0,3)}
                      {isCurrentMonth && (
                        <span className="ml-1 text-xs bg-teal-100 text-teal-600 px-1 rounded">now</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-center font-bold text-teal-700">{m.total_dmpa_sc}</td>
                    <td className="px-2 py-2 text-center font-bold text-green-700">{m.si_visits}</td>
                    <td className="px-2 py-2 text-center text-gray-600">{m.pa_visits}</td>
                    <td className="px-2 py-2 text-center">
                      <span className={`font-bold px-1.5 py-0.5 rounded
                        ${parseFloat(m.pct_si) >= 50 ? 'bg-green-100 text-green-700' :
                          parseFloat(m.pct_si) > 0 ? 'bg-amber-100 text-amber-600' :
                          'text-gray-400'}`}>
                        {m.pct_si}%
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center text-orange-600 font-medium">
                      {m.new_lapsed_si}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {submitted
                        ? <span className="text-green-500 font-bold">✅</span>
                        : m.total_dmpa_sc > 0
                          ? <button
                              onClick={() => { setYear(year); openForm() }}
                              className="text-teal-500 hover:text-teal-700 underline text-xs">
                              Submit
                            </button>
                          : <span className="text-gray-300">—</span>
                      }
                    </td>
                  </tr>
                )
              })}
              {/* Year Total Row */}
              <tr className="border-t-2 border-teal-200 font-bold"
                style={{background:'#f0fdfa'}}>
                <td className="px-3 py-2 text-teal-700 font-bold">TOTAL {year}</td>
                <td className="px-2 py-2 text-center text-teal-700">{yearTotals.total_dmpa_sc}</td>
                <td className="px-2 py-2 text-center text-green-700">{yearTotals.si_visits}</td>
                <td className="px-2 py-2 text-center text-gray-600">{yearTotals.pa_visits}</td>
                <td className="px-2 py-2 text-center">
                  <span className={`font-bold px-1.5 py-0.5 rounded
                    ${parseFloat(yearPctSI) >= 50 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-600'}`}>
                    {yearPctSI}%
                  </span>
                </td>
                <td className="px-2 py-2 text-center text-orange-600">{yearTotals.new_lapsed_si}</td>
                <td className="px-2 py-2 text-center text-gray-400">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ONA Submission */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
        <h3 className="font-bold text-gray-700 mb-3">📤 Submit Monthly Data to ONA</h3>

        <div className={`rounded-xl p-3 mb-4 border ${
          hasSubmittedThisMonth ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <p className={`font-bold text-sm ${hasSubmittedThisMonth ? 'text-green-700' : 'text-amber-700'}`}>
            {hasSubmittedThisMonth
              ? `✅ ${MONTHS[currentMonth-1]} ${currentYear} — Submitted to ONA`
              : `⏳ ${MONTHS[currentMonth-1]} ${currentYear} — Pending ONA Submission`}
          </p>
        </div>

        <ol className="space-y-2 text-sm text-gray-600 mb-4">
          <li className="flex gap-2">
            <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 flex-shrink-0">1</span>
            Export your monthly Excel report using the button above
          </li>
          <li className="flex gap-2">
            <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 flex-shrink-0">2</span>
            Click Submit below — ONA Enketo form opens in a new tab
          </li>
          <li className="flex gap-2">
            <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 flex-shrink-0">3</span>
            Enter your figures from the Excel report into the ONA form
          </li>
          <li className="flex gap-2">
            <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 flex-shrink-0">4</span>
            Submit — your submission is automatically tracked here
          </li>
        </ol>

        <button onClick={openForm}
          className="w-full flex items-center justify-center gap-3 text-white font-bold py-4 rounded-2xl text-base shadow-lg transition-all hover:shadow-xl"
          style={{background: 'linear-gradient(135deg, #0d7377 0%, #14a044 100%)'}}>
          <ExternalLink size={20}/>
          Open ONA Enketo — Submit {MONTHS[currentMonth-1]} Data
        </button>
      </div>

      {/* Submission History */}
      {submissions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 className="font-bold text-gray-700 text-sm mb-3">ONA Submission History</h3>
          <div className="space-y-2">
            {submissions
              .sort((a,b) => new Date(b.date) - new Date(a.date))
              .slice(0, 12)
              .map((s, i) => (
                <div key={i}
                  className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✅</span>
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