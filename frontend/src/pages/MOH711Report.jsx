import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Download, Eye, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { getFacilitySettings } from '../utils/facilitySettings.js'
import API from '../utils/api.js'
import * as XLSX from 'xlsx'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
         XAxis, YAxis, CartesianGrid, Tooltip, Legend,
         ResponsiveContainer, ComposedChart } from 'recharts'

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']

export default function MOH711Report() {
  const navigate = useNavigate()
  const facility = getFacilitySettings()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [activeTab, setActiveTab] = useState('table') // 'table' | 'charts'

  const period = `${year}${String(month).padStart(2,'0')}`

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const res = await API.get('/reports/moh711/history')
      setHistory(res.data)
    } catch {}
  }

  const generateReport = async () => {
    setLoading(true)
    try {
      const res = await API.get(`/reports/moh711/${period}`)
      setReport(res.data)
      loadHistory()
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const exportToExcel = () => {
    if (!report) return
    const d = report.fp_section

    const rows = [
      ['MOH 711 — Section D: Family Planning', '', '', ''],
      [`Facility: ${facility.facility_name || '—'}`, `Period: ${MONTHS[month-1]} ${year}`, '', ''],
      ['', '', '', ''],
      ['INDICATOR', 'NEW', 'REVISIT', 'TOTAL'],
      ['No. of 1st Ever Users of Contraceptive', d.first_ever_users || 0, '', ''],
      ['', '', '', ''],
      ['PILLS', '', '', ''],
      ['Progestin Only Pills (POP)', d.pop_new || 0, d.pop_revisit || 0, (d.pop_new||0)+(d.pop_revisit||0)],
      ['Combined Oral Contraceptives (COC)', d.coc_new || 0, d.coc_revisit || 0, (d.coc_new||0)+(d.coc_revisit||0)],
      ['Emergency Contraceptive Pill (ECP)', d.ecp_new || 0, d.ecp_revisit || 0, (d.ecp_new||0)+(d.ecp_revisit||0)],
      ['', '', '', ''],
      ['INJECTABLES', '', '', ''],
      ['DMPA-IM', d.dmpa_im_new || 0, d.dmpa_im_revisit || 0, (d.dmpa_im_new||0)+(d.dmpa_im_revisit||0)],
      ['DMPA-SC', d.dmpa_sc_new || 0, d.dmpa_sc_revisit || 0, (d.dmpa_sc_new||0)+(d.dmpa_sc_revisit||0)],
      ['NET-EN', d.net_en_new || 0, d.net_en_revisit || 0, (d.net_en_new||0)+(d.net_en_revisit||0)],
      ['', '', '', ''],
      ['CONDOMS', '', '', ''],
      ['Male Condoms', d.condom_m || 0, '', ''],
      ['Female Condoms', d.condom_f || 0, '', ''],
      ['Both Male & Female Condoms', d.condom_both || 0, '', ''],
      ['', '', '', ''],
      ['NATURAL FP', '', '', ''],
      ['Clients Counselled on Natural FP', d.natural_fp || 0, '', ''],
      ['Cycle Beads Given', d.cycle_beads || 0, '', ''],
      ['', '', '', ''],
      ['LONG ACTING & PERMANENT METHODS', '', '', ''],
      ['Implants — 1 Rod (1st Insertion)', d.implant_1rod_new || 0, d.implant_1rod_revisit || 0, ''],
      ['Implants — 2 Rods (1st Insertion)', d.implant_2rod_new || 0, d.implant_2rod_revisit || 0, ''],
      ['IUD Hormonal (LNG-IUS) — Insertion', d.iud_hormonal_new || 0, d.iud_hormonal_revisit || 0, ''],
      ['IUD Non-Hormonal (Cu-T) — Insertion', d.iud_non_hormonal_new || 0, d.iud_non_hormonal_revisit || 0, ''],
      ['BTL (Female Sterilisation)', d.btl_new || 0, '', ''],
      ['Vasectomy', d.vasectomy_new || 0, '', ''],
      ['', '', '', ''],
      ['REMOVALS', '', '', ''],
      ['IUCD Removals', d.iud_removals || 0, '', ''],
      ['Implant Removals', d.implant_removals || 0, '', ''],
      ['', '', '', ''],
      ['CLIENT TOTALS', '', '', ''],
      ['Total FP Clients (Commodities + Other FP)', d.total_fp_clients || 0, '', ''],
      ['Adolescents 10-14 years', d.adolescent_10_14 || 0, '', ''],
      ['Adolescents 15-19 years', d.adolescent_15_19 || 0, '', ''],
      ['Youth 20-24 years', d.youth_20_24 || 0, '', ''],
      ['Adults 25+ years', d.adults_25_plus || 0, '', ''],
      ['PPFP — Within 48 hours', d.ppfp_48hrs || 0, '', ''],
      ['PPFP — 3 days to 6 weeks', d.ppfp_3days_6wks || 0, '', ''],
      ['Post-abortion FP', d.post_abortion_fp || 0, '', ''],
      ['', '', '', ''],
      ['CERVICAL CANCER SCREENING (Section G)', '', '', ''],
      ['VIA/VILI/HPV — <25 years', report.cervical?.via_lt25 || 0, '', ''],
      ['VIA/VILI/HPV — 25-49 years', report.cervical?.via_25_49 || 0, '', ''],
      ['VIA/VILI/HPV — 50+ years', report.cervical?.via_50plus || 0, '', ''],
      ['Screened — Pap Smear', report.cervical?.pap_smear || 0, '', ''],
      ['Screened — HPV Test', report.cervical?.hpv_test || 0, '', ''],
      ['Positive VIA/VILI', report.cervical?.positive_via || 0, '', ''],
      ['Positive Cytology', report.cervical?.positive_cytology || 0, '', ''],
      ['Positive HPV', report.cervical?.positive_hpv || 0, '', ''],
      ['Treated — Cryotherapy', report.cervical?.cryotherapy || 0, '', ''],
      ['Treated — LEEP', report.cervical?.leep || 0, '', ''],
      ['HIV+ clients screened', report.cervical?.hiv_positive_screened || 0, '', ''],
    ]

    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{wch:45},{wch:10},{wch:10},{wch:10}]

    // Style header rows
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'MOH 711 Section D&G')

    XLSX.writeFile(wb, `MOH711_${facility.facility_name || 'Facility'}_${MONTHS[month-1]}_${year}.xlsx`)
  }

  const validateReport = (fp) => {
    const warnings = []

    if ((fp.iud_removals || 0) > (fp.iud_non_hormonal_new || 0) + (fp.iud_hormonal_new || 0) + 50) {
      warnings.push('⚠️ IUD removals exceed cumulative insertions — verify data')
    }
    if ((fp.implant_removals || 0) > (fp.implant_1rod_new || 0) + (fp.implant_2rod_new || 0) + 50) {
      warnings.push('⚠️ Implant removals exceed insertions — verify data')
    }
    if (fp.total_fp_clients > 500) {
      warnings.push('ℹ️ Total FP clients >500 for the month — please verify this is correct')
    }
    const methodTotal = (fp.pop_new || 0) + (fp.pop_revisit || 0) +
      (fp.coc_new || 0) + (fp.coc_revisit || 0) +
      (fp.dmpa_im_new || 0) + (fp.dmpa_im_revisit || 0) +
      (fp.dmpa_sc_new || 0) + (fp.dmpa_sc_revisit || 0) +
      (fp.implant_1rod_new || 0) + (fp.implant_2rod_new || 0) +
      (fp.iud_non_hormonal_new || 0) + (fp.iud_hormonal_new || 0) +
      (fp.condom_m || 0) + (fp.condom_f || 0) + (fp.btl_new || 0)

    if (fp.total_fp_clients > 0 && methodTotal === 0) {
      warnings.push('⚠️ Total FP clients recorded but no method counts — check individual method entries')
    }
    if ((fp.adolescent_10_14 || 0) + (fp.adolescent_15_19 || 0) +
        (fp.youth_20_24 || 0) + (fp.adults_25_plus || 0) > fp.total_fp_clients + 10) {
      warnings.push('⚠️ Age group totals exceed total FP clients — verify age data')
    }
    if (fp.first_ever_users > (fp.total_fp_clients || 0)) {
      warnings.push('⚠️ First-ever users exceed total clients — verify data')
    }

    return warnings
  }

  const Row = ({ label, newVal, revisitVal, indent = false, bold = false, section = false }) => {
    if (section) return (
      <tr>
        <td colSpan={4} className="px-3 py-1.5 text-xs font-bold text-white uppercase tracking-wide"
          style={{background: '#0d7377'}}>
          {label}
        </td>
      </tr>
    )
    const total = (newVal || 0) + (revisitVal || 0)
    return (
      <tr className="border-b border-gray-100 hover:bg-teal-50">
        <td className={`px-3 py-2 text-sm ${bold ? 'font-bold text-gray-800' : 'text-gray-700'} ${indent ? 'pl-6' : ''}`}>
          {label}
        </td>
        <td className="px-3 py-2 text-center text-sm font-semibold text-teal-700">
          {newVal !== undefined ? newVal || 0 : '—'}
        </td>
        <td className="px-3 py-2 text-center text-sm text-gray-600">
          {revisitVal !== undefined ? revisitVal || 0 : '—'}
        </td>
        <td className="px-3 py-2 text-center text-sm font-bold text-gray-700">
          {(newVal !== undefined || revisitVal !== undefined) ? total : '—'}
        </td>
      </tr>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => navigate('/reports')}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-4">
        <ArrowLeft size={15}/> Back to Reports
      </button>

      <div className="mb-5">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FileText size={24} className="text-teal-600"/> MOH 711 Report Generator
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Auto-generated from MOH 512 client records — Sections D (FP) & G (Cervical Cancer)
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
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                value={month}
                onChange={e => setMonth(parseInt(e.target.value))}>
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              value={year}
              onChange={e => setYear(parseInt(e.target.value))}>
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
            style={!loading ? {background: 'linear-gradient(135deg, #0d7377 0%, #14a044 100%)'} : {}}>
            {loading ? <RefreshCw size={16} className="animate-spin"/> : <Eye size={16}/>}
            {loading ? 'Generating...' : `Generate ${MONTHS[month-1]} ${year} Report`}
          </button>
          {report && (
            <button onClick={exportToExcel}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-5 rounded-xl transition-colors">
              <Download size={16}/> Export
            </button>
          )}
        </div>
      </div>

      {report && (
        <div className="flex gap-2 mb-4">
          {[
            { key: 'table', label: '📋 Data Table' },
            { key: 'charts', label: '📊 Charts & Analysis' }
          ].map(tab => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors
                ${activeTab === tab.key
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              style={activeTab === tab.key ? {background:'#0d7377'} : {}}>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Previous Reports */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
          <h3 className="font-bold text-gray-700 text-sm mb-3">Previous Reports</h3>
          <div className="flex flex-wrap gap-2">
            {history.map((h, i) => (
              <button key={i}
                onClick={() => {
                  setYear(parseInt(h.period.substring(0,4)))
                  setMonth(parseInt(h.period.substring(4,6)))
                  setReport(h.data)
                }}
                className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1.5 rounded-full hover:bg-teal-100 transition-colors font-medium">
                {MONTHS[parseInt(h.period.substring(4,6))-1]} {h.period.substring(0,4)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Report Display */}
      {report && activeTab === 'table' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Report Header */}
          <div className="p-4 text-white" style={{background: 'linear-gradient(135deg, #0d7377 0%, #0f766e 100%)'}}>
            <p className="text-xs text-teal-200 uppercase tracking-wide">Kenya Ministry of Health</p>
            <h3 className="font-bold text-lg mt-0.5">MOH 711 — Integrated Summary Report</h3>
            <p className="text-teal-200 text-sm mt-1">
              {facility.facility_name || 'Facility'} | {MONTHS[month-1]} {year}
            </p>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="bg-white bg-opacity-15 rounded-lg p-2 text-center">
                <div className="text-xl font-bold">{report.summary?.total_visits || 0}</div>
                <div className="text-xs text-teal-200">Total Visits</div>
              </div>
              <div className="bg-white bg-opacity-15 rounded-lg p-2 text-center">
                <div className="text-xl font-bold">{report.summary?.new_clients || 0}</div>
                <div className="text-xs text-teal-200">New Clients</div>
              </div>
              <div className="bg-white bg-opacity-15 rounded-lg p-2 text-center">
                <div className="text-xl font-bold">{report.summary?.revisits || 0}</div>
                <div className="text-xs text-teal-200">Revisits</div>
              </div>
            </div>
          </div>

          {/* Validation Warnings */}
          {(() => {
            const warnings = validateReport(report.fp_section)
            if (warnings.length === 0) return (
              <div className="mx-4 mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-700 text-sm font-semibold flex items-center gap-2">
                  ✅ Data validation passed — no issues found
                </p>
              </div>
            )
            return (
              <div className="mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="font-bold text-amber-700 text-sm mb-2">
                  ⚠️ Data Quality Warnings ({warnings.length})
                </p>
                {warnings.map((w, i) => (
                  <p key={i} className="text-amber-600 text-xs mb-1">{w}</p>
                ))}
                <p className="text-amber-500 text-xs mt-2 italic">
                  These are warnings only — you can still export the report.
                  Please review the data before submitting to sub-county.
                </p>
              </div>
            )
          })()}

          {/* Section D Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-3 py-2 font-semibold text-gray-600 text-xs">Indicator</th>
                  <th className="text-center px-3 py-2 font-semibold text-teal-600 text-xs">New</th>
                  <th className="text-center px-3 py-2 font-semibold text-gray-500 text-xs">Revisit</th>
                  <th className="text-center px-3 py-2 font-semibold text-gray-600 text-xs">Total</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const d = report.fp_section
                  return <>
                    <Row label="D. FAMILY PLANNING" section/>
                    <Row label="No. of 1st Ever Users of Contraceptive" newVal={d.first_ever_users} bold/>
                    <Row label="PILLS" section/>
                    <Row label="Progestin Only Pills (POP)" newVal={d.pop_new} revisitVal={d.pop_revisit} indent/>
                    <Row label="Combined Oral Contraceptives (COC)" newVal={d.coc_new} revisitVal={d.coc_revisit} indent/>
                    <Row label="Emergency Contraceptive Pill (ECP)" newVal={d.ecp_new} revisitVal={d.ecp_revisit} indent/>
                    <Row label="INJECTABLES" section/>
                    <Row label="DMPA-IM" newVal={d.dmpa_im_new} revisitVal={d.dmpa_im_revisit} indent/>
                    <Row label="DMPA-SC (Sayana Press)" newVal={d.dmpa_sc_new} revisitVal={d.dmpa_sc_revisit} indent/>
                    <Row label="NET-EN (Noristerat)" newVal={d.net_en_new} revisitVal={d.net_en_revisit} indent/>
                    <Row label="CONDOMS" section/>
                    <Row label="No. of clients received Male Condoms" newVal={d.condom_m} indent/>
                    <Row label="No. of clients received Female Condoms" newVal={d.condom_f} indent/>
                    <Row label="No. of clients received Both (M+F)" newVal={d.condom_both} indent/>
                    <Row label="NATURAL FP" section/>
                    <Row label="Clients counselled on Natural FP" newVal={d.natural_fp} indent/>
                    <Row label="Cycle Beads given" newVal={d.cycle_beads} indent/>
                    <Row label="LONG ACTING & PERMANENT METHODS" section/>
                    <Row label="Implants — 1 Rod (1st Insertion)" newVal={d.implant_1rod_new} revisitVal={d.implant_1rod_revisit} indent/>
                    <Row label="Implants — 2 Rods (1st Insertion)" newVal={d.implant_2rod_new} revisitVal={d.implant_2rod_revisit} indent/>
                    <Row label="IUD Hormonal (LNG-IUS) Insertion" newVal={d.iud_hormonal_new} revisitVal={d.iud_hormonal_revisit} indent/>
                    <Row label="IUD Non-Hormonal (Cu-T) Insertion" newVal={d.iud_non_hormonal_new} revisitVal={d.iud_non_hormonal_revisit} indent/>
                    <Row label="BTL (Female Sterilisation)" newVal={d.btl_new} indent/>
                    <Row label="Vasectomy" newVal={d.vasectomy_new} indent/>
                    <Row label="REMOVALS" section/>
                    <Row label="IUCD Removals" newVal={d.iud_removals} indent/>
                    <Row label="Implant Removals" newVal={d.implant_removals} indent/>
                    <Row label="CLIENT TOTALS" section/>
                    <Row label="Total FP Clients (Commodities + Other FP)" newVal={d.total_fp_clients} bold/>
                    <Row label="Adolescents 10-14 years" newVal={d.adolescent_10_14} indent/>
                    <Row label="Adolescents 15-19 years" newVal={d.adolescent_15_19} indent/>
                    <Row label="Youth 20-24 years" newVal={d.youth_20_24} indent/>
                    <Row label="Adults 25+ years" newVal={d.adults_25_plus} indent/>
                    <Row label="PPFP — Within 48 hours postpartum" newVal={d.ppfp_48hrs} indent/>
                    <Row label="PPFP — 3 days to 6 weeks" newVal={d.ppfp_3days_6wks} indent/>
                    <Row label="Post-abortion FP" newVal={d.post_abortion_fp} indent/>
                  </>
                })()}

                {/* Cervical Cancer Section */}
                <Row label="G. CERVICAL CANCER SCREENING" section/>
                {(() => {
                  const c = report.cervical || {}
                  return <>
                    <Row label="VIA/VILI/HPV — <25 years" newVal={c.via_lt25} indent/>
                    <Row label="VIA/VILI/HPV — 25-49 years" newVal={c.via_25_49} indent/>
                    <Row label="VIA/VILI/HPV — 50+ years" newVal={c.via_50plus} indent/>
                    <Row label="Screened — Pap Smear" newVal={c.pap_smear} indent/>
                    <Row label="Screened — HPV Test" newVal={c.hpv_test} indent/>
                    <Row label="Positive VIA/VILI results" newVal={c.positive_via} indent/>
                    <Row label="Positive Cytology results" newVal={c.positive_cytology} indent/>
                    <Row label="Positive HPV results" newVal={c.positive_hpv} indent/>
                    <Row label="Treated — Cryotherapy" newVal={c.cryotherapy} indent/>
                    <Row label="Treated — LEEP" newVal={c.leep} indent/>
                    <Row label="HIV+ clients screened" newVal={c.hiv_positive_screened} indent/>
                  </>
                })()}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 text-center">
            Auto-generated from MOH 512 records | Afya Chaguo Digital MEC | {new Date().toLocaleString('en-KE')}
          </div>
        </div>
      )}

      {report && activeTab === 'charts' && (
        <MOH711Charts report={report} month={month} year={year} months={MONTHS}/>
      )}
    </div>
  )
}

function MOH711Charts({ report, month, year, months }) {
  const fp = report.fp_section
  const cerv = report.cervical || {}
  const TEAL = '#0d7377'
  const GREEN = '#14a044'
  const AMBER = '#f59e0b'
  const PURPLE = '#7c3aed'
  const BLUE = '#2563eb'
  const RED = '#dc2626'

  // Method mix data for pie chart
  const methodMixData = [
    { name: 'COC', value: (fp.coc_new||0)+(fp.coc_revisit||0), color: '#0d7377' },
    { name: 'POP', value: (fp.pop_new||0)+(fp.pop_revisit||0), color: '#14a044' },
    { name: 'DMPA-IM', value: (fp.dmpa_im_new||0)+(fp.dmpa_im_revisit||0), color: '#2563eb' },
    { name: 'DMPA-SC', value: (fp.dmpa_sc_new||0)+(fp.dmpa_sc_revisit||0), color: '#7c3aed' },
    { name: 'NET-EN', value: (fp.net_en_new||0)+(fp.net_en_revisit||0), color: '#f59e0b' },
    { name: 'Implant', value: (fp.implant_1rod_new||0)+(fp.implant_2rod_new||0)+(fp.implant_1rod_revisit||0)+(fp.implant_2rod_revisit||0), color: '#ec4899' },
    { name: 'Cu-IUD', value: (fp.iud_non_hormonal_new||0)+(fp.iud_non_hormonal_revisit||0), color: '#f97316' },
    { name: 'LNG-IUS', value: (fp.iud_hormonal_new||0)+(fp.iud_hormonal_revisit||0), color: '#06b6d4' },
    { name: 'Condoms', value: (fp.condom_m||0)+(fp.condom_f||0)+(fp.condom_both||0), color: '#84cc16' },
    { name: 'Natural FP', value: (fp.natural_fp||0), color: '#a3a3a3' },
    { name: 'Permanent', value: (fp.btl_new||0)+(fp.vasectomy_new||0), color: '#dc2626' },
  ].filter(d => d.value > 0)

  // New vs Revisit by method
  const newVsRevisit = [
    { method: 'COC', new: fp.coc_new||0, revisit: fp.coc_revisit||0 },
    { method: 'POP', new: fp.pop_new||0, revisit: fp.pop_revisit||0 },
    { method: 'DMPA-IM', new: fp.dmpa_im_new||0, revisit: fp.dmpa_im_revisit||0 },
    { method: 'DMPA-SC', new: fp.dmpa_sc_new||0, revisit: fp.dmpa_sc_revisit||0 },
    { method: 'NET-EN', new: fp.net_en_new||0, revisit: fp.net_en_revisit||0 },
    { method: 'Implant', new: (fp.implant_1rod_new||0)+(fp.implant_2rod_new||0), revisit: (fp.implant_1rod_revisit||0)+(fp.implant_2rod_revisit||0) },
    { method: 'Cu-IUD', new: fp.iud_non_hormonal_new||0, revisit: fp.iud_non_hormonal_revisit||0 },
    { method: 'LNG-IUS', new: fp.iud_hormonal_new||0, revisit: fp.iud_hormonal_revisit||0 },
  ].filter(d => d.new > 0 || d.revisit > 0)

  // Age group distribution
  const ageData = [
    { group: '10-14 yrs', count: fp.adolescent_10_14||0, color: '#f59e0b' },
    { group: '15-19 yrs', count: fp.adolescent_15_19||0, color: '#f97316' },
    { group: '20-24 yrs', count: fp.youth_20_24||0, color: '#14a044' },
    { group: '25+ yrs', count: fp.adults_25_plus||0, color: '#0d7377' },
  ]

  // PPFP data
  const ppfpData = [
    { name: 'PPFP <48hrs', value: fp.ppfp_48hrs||0 },
    { name: 'PPFP 3d-6wks', value: fp.ppfp_3days_6wks||0 },
    { name: 'Post-abortion FP', value: fp.post_abortion_fp||0 },
  ].filter(d => d.value > 0)

  // Cervical cancer screening
  const cervData = [
    { name: '<25 yrs', value: cerv.via_lt25||0 },
    { name: '25-49 yrs', value: cerv.via_25_49||0 },
    { name: '50+ yrs', value: cerv.via_50plus||0 },
  ]

  const RADIAN = Math.PI / 180
  const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, value, percent }) => {
    if (percent < 0.05) return null
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight="bold">
        {`${name}\n${value}`}
      </text>
    )
  }

  const totalFP = fp.total_fp_clients || 0
  const totalNew = (fp.coc_new||0)+(fp.pop_new||0)+(fp.dmpa_im_new||0)+(fp.dmpa_sc_new||0)+(fp.net_en_new||0)+(fp.implant_1rod_new||0)+(fp.implant_2rod_new||0)+(fp.iud_non_hormonal_new||0)+(fp.iud_hormonal_new||0)+(fp.btl_new||0)+(fp.vasectomy_new||0)
  const totalRevisit = totalFP - totalNew

  return (
    <div className="space-y-4">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total FP Clients', value: totalFP, color: TEAL, icon: '👥' },
          { label: 'New Acceptors', value: totalNew, color: GREEN, icon: '🆕' },
          { label: 'Revisits', value: totalRevisit, color: BLUE, icon: '🔄' },
          { label: '1st Ever Users', value: fp.first_ever_users||0, color: PURPLE, icon: '⭐' },
        ].map((k,i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="text-xl mb-1">{k.icon}</div>
            <p className="text-2xl font-bold" style={{color:k.color}}>{k.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Method Mix Pie */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-bold text-gray-700 text-sm mb-4">
          🥧 Method Mix — {months[month-1]} {year}
        </h3>
        {methodMixData.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No method data for this period</p>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={methodMixData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  labelLine={false}
                  label={renderPieLabel}>
                  {methodMixData.map((entry, index) => (
                    <Cell key={index} fill={entry.color}/>
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [val, name]}
                  contentStyle={{fontSize:12, borderRadius:8}}/>
              </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              {methodMixData.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{background:d.color}}/>
                  <span className="text-gray-600">{d.name}: <strong>{d.value}</strong></span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New vs Revisit Bar Chart */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-bold text-gray-700 text-sm mb-4">
          📊 New Clients vs Revisits by Method
        </h3>
        {newVsRevisit.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No data for this period</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={newVsRevisit} margin={{top:0,right:10,left:-20,bottom:0}}
              barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="method" tick={{fontSize:10, fill:'#9ca3af'}}/>
              <YAxis tick={{fontSize:11, fill:'#9ca3af'}}/>
              <Tooltip contentStyle={{fontSize:12, borderRadius:8, border:'1px solid #e5e7eb'}}/>
              <Legend wrapperStyle={{fontSize:12}}/>
              <Bar dataKey="new" name="New clients" fill={TEAL} radius={[3,3,0,0]}/>
              <Bar dataKey="revisit" name="Revisits" fill="#5eead4" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Age Group Distribution */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-bold text-gray-700 text-sm mb-4">
            👥 Age Group Distribution
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ageData} margin={{top:0,right:10,left:-25,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="group" tick={{fontSize:10, fill:'#9ca3af'}}/>
              <YAxis tick={{fontSize:10, fill:'#9ca3af'}}/>
              <Tooltip contentStyle={{fontSize:12, borderRadius:8}}/>
              {ageData.map((entry, i) => null)}
              <Bar dataKey="count" name="Clients" radius={[3,3,0,0]}>
                {ageData.map((entry, i) => (
                  <Cell key={i} fill={entry.color}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Adolescent alert */}
          {((fp.adolescent_10_14||0) + (fp.adolescent_15_19||0)) > 0 && (
            <div className="mt-2 bg-purple-50 rounded-lg p-2 text-xs text-purple-700">
              👤 {(fp.adolescent_10_14||0) + (fp.adolescent_15_19||0)} adolescent clients (10-19 yrs)
              — ARSH guidelines apply
            </div>
          )}
        </div>

        {/* PPFP / Special Groups */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-bold text-gray-700 text-sm mb-4">
            🤱 PPFP & Special Groups
          </h3>
          {ppfpData.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No PPFP data recorded</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={ppfpData} margin={{top:0,right:10,left:-25,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="name" tick={{fontSize:9, fill:'#9ca3af'}}/>
                <YAxis tick={{fontSize:10, fill:'#9ca3af'}}/>
                <Tooltip contentStyle={{fontSize:12, borderRadius:8}}/>
                <Bar dataKey="value" fill={AMBER} radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Cervical Cancer Screening */}
      {(cerv.via_lt25||0)+(cerv.via_25_49||0)+(cerv.via_50plus||0) > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-bold text-gray-700 text-sm mb-4">
            🔬 Section G — Cervical Cancer Screening
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={cervData} margin={{top:0,right:10,left:-25,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="name" tick={{fontSize:10, fill:'#9ca3af'}}/>
                <YAxis tick={{fontSize:10, fill:'#9ca3af'}}/>
                <Tooltip contentStyle={{fontSize:12, borderRadius:8}}/>
                <Bar dataKey="value" name="Screened" fill={PURPLE} radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {[
                { label: 'Positive VIA/VILI', val: cerv.positive_via||0, color: RED },
                { label: 'Positive HPV', val: cerv.positive_hpv||0, color: PURPLE },
                { label: 'Treated — Cryotherapy', val: cerv.cryotherapy||0, color: AMBER },
                { label: 'Treated — LEEP', val: cerv.leep||0, color: BLUE },
                { label: 'HIV+ screened', val: cerv.hiv_positive_screened||0, color: GREEN },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-bold px-2 py-0.5 rounded"
                    style={{background:`${item.color}20`, color: item.color}}>
                    {item.val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LARC vs Short-acting */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-bold text-gray-700 text-sm mb-4">
          ⚖️ LARC vs Short-Acting Methods Ratio
        </h3>
        {(() => {
          const larc = (fp.implant_1rod_new||0)+(fp.implant_2rod_new||0)+
            (fp.iud_non_hormonal_new||0)+(fp.iud_hormonal_new||0)+
            (fp.implant_1rod_revisit||0)+(fp.implant_2rod_revisit||0)+
            (fp.iud_non_hormonal_revisit||0)+(fp.iud_hormonal_revisit||0)
          const shortActing = (fp.coc_new||0)+(fp.coc_revisit||0)+
            (fp.pop_new||0)+(fp.pop_revisit||0)+
            (fp.dmpa_im_new||0)+(fp.dmpa_im_revisit||0)+
            (fp.dmpa_sc_new||0)+(fp.dmpa_sc_revisit||0)+
            (fp.net_en_new||0)+(fp.net_en_revisit||0)
          const permanent = (fp.btl_new||0)+(fp.vasectomy_new||0)
          const total = larc + shortActing + permanent
          const data = [
            { name: 'LARC', value: larc, color: TEAL },
            { name: 'Short-acting', value: shortActing, color: AMBER },
            { name: 'Permanent', value: permanent, color: RED },
          ].filter(d => d.value > 0)

          return (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="40%" height={140}>
                <PieChart>
                  <Pie data={data} cx="50%" cy="50%" outerRadius={60} dataKey="value">
                    {data.map((entry, i) => <Cell key={i} fill={entry.color}/>)}
                  </Pie>
                  <Tooltip contentStyle={{fontSize:11, borderRadius:8}}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {data.map((d, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{background:d.color}}/>
                        {d.name}
                      </span>
                      <span className="font-bold" style={{color:d.color}}>
                        {d.value} ({total > 0 ? Math.round(d.value/total*100) : 0}%)
                      </span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all"
                        style={{width:`${total > 0 ? (d.value/total*100) : 0}%`, background:d.color}}/>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-gray-400 mt-2">
                  Total: {total} clients | {months[month-1]} {year}
                </p>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}