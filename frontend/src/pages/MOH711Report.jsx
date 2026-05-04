import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Download, Eye, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { getFacilitySettings } from '../utils/facilitySettings.js'
import * as XLSX from 'xlsx'

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

  const period = `${year}${String(month).padStart(2,'0')}`

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/reports/moh711/history')
      if (res.ok) {
        const data = await res.json()
        setHistory(data)
      }
    } catch {}
  }

  const generateReport = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/moh711/${period}`)
      if (res.ok) {
        const data = await res.json()
        setReport(data)
        loadHistory()
      }
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
      {report && (
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
    </div>
  )
}