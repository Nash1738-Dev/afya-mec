import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFacilitySettings, saveFacilitySettings } from '../utils/facilitySettings.js'
import { Building2, User, Save, ArrowLeft, CheckCircle, Users, MessageSquare, Globe } from 'lucide-react'

const COUNTY_SUBCOUNTIES = {
  'Baringo': ['Baringo Central','Baringo North','Baringo South','Eldama Ravine','Mogotio','Tiaty'],
  'Bomet': ['Bomet Central','Bomet East','Chepalungu','Konoin','Sotik'],
  'Bungoma': ['Bumula','Kabuchai','Kanduyi','Kimilili','Mt Elgon','Sirisia','Tongaren','Webuye East','Webuye West'],
  'Busia': ['Budalangi','Butula','Funyula','Nambale','Teso North','Teso South'],
  'Elgeyo-Marakwet': ['Keiyo North','Keiyo South','Marakwet East','Marakwet West'],
  'Embu': ['Embu East','Embu North','Embu West','Manyatta','Mbeere North','Mbeere South','Runyenjes'],
  'Garissa': ['Balambala','Dadaab','Fafi','Garissa Township','Hulugho','Ijara','Lagdera'],
  'Homa Bay': ['Homa Bay Town','Kabondo Kasipul','Karachuonyo','Kasipul','Mbita','Ndhiwa','Rangwe','Suba'],
  'Isiolo': ['Garbatulla','Isiolo','Merti'],
  'Kajiado': ['Isinya','Kajiado Central','Kajiado East','Kajiado North','Kajiado West','Loitokitok','Mashuuru'],
  'Kakamega': ['Butere','Ikolomani','Khwisero','Lugari','Lukuyani','Lurambi','Malava','Matungu','Mumias East','Mumias West','Navakholo','Shinyalu'],
  'Kericho': ['Ainamoi','Belgut','Bureti','Kipkelion East','Kipkelion West','Soin Sigowet'],
  'Kiambu': ['Gatundu North','Gatundu South','Githunguri','Kabete','Kiambaa','Kiambu','Kikuyu','Limuru','Lari','Ruiru','Thika Town','Githurai'],
  'Kilifi': ['Ganze','Kaloleni','Kilifi North','Kilifi South','Magarini','Malindi','Rabai'],
  'Kirinyaga': ['Gichugu','Kirinyaga Central','Mwea','Ndia'],
  'Kisii': ['Bobasi','Bomachoge Borabu','Bomachoge Chache','Bonchari','Kitutu Chache North','Kitutu Chache South','Nyaribari Chache','Nyaribari Masaba','South Mugirango'],
  'Kisumu': ['Kisumu Central','Kisumu East','Kisumu West','Muhoroni','Nyakach','Nyando','Seme'],
  'Kitui': ['Ikutha','Katulani','Kitui Central','Kitui East','Kitui Rural','Kitui South','Kitui West','Lower Yatta','Matinyani','Mwingi Central','Mwingi North','Mwingi West'],
  'Kwale': ['Kinango','Lungalunga','Msambweni','Matuga'],
  'Laikipia': ['Laikipia East','Laikipia North','Laikipia West','Nyahururu','Ol Jorok','Ol Kalou'],
  'Lamu': ['Lamu East','Lamu West'],
  'Machakos': ['Kathiani','Machakos Town','Masinga','Matungulu','Mavoko','Mwala','Yatta'],
  'Makueni': ['Kaiti','Kibwezi East','Kibwezi West','Kilome','Makueni','Mbooni'],
  'Mandera': ['Banissa','Lafey','Mandera East','Mandera North','Mandera South','Mandera West'],
  'Marsabit': ['Laisamis','Moyale','North Horr','Saku'],
  'Meru': ['Buuri','Igembe Central','Igembe North','Igembe South','Imenti North','Imenti South','Miutini','Tigania East','Tigania West'],
  'Migori': ['Awendo','Kuria East','Kuria West','Mabera','Ntimaru','Rongo','Suna East','Suna West','Uriri'],
  'Mombasa': ['Changamwe','Jomvu','Kisauni','Likoni','Mvita','Nyali'],
  'Murang\'a': ['Gatanga','Kahuro','Kandara','Kangema','Kigumo','Kiharu','Mathioya','Murang\'a South'],
  'Nairobi': ['Dagoretti North','Dagoretti South','Embakasi Central','Embakasi East','Embakasi North','Embakasi South','Embakasi West','Githurai','Hamza','Highridge','Kamukunji','Kasarani','Kibra','Lang\'ata','Makadara','Mathare','Roysambu','Ruaraka','Starehe','Westlands'],
  'Nakuru': ['Bahati','Gilgil','Kuresoi North','Kuresoi South','Molo','Naivasha','Nakuru Town East','Nakuru Town West','Njoro','Rongai','Subukia'],
  'Nandi': ['Aldai','Chesumei','Emgwen','Mosop','Nandi Hills','Tindiret'],
  'Narok': ['Kilgoris','Narok East','Narok North','Narok South','Narok West','Transmara East','Transmara West'],
  'Nyamira': ['Borabu','Manga','Masaba North','Nyamira North','Nyamira South'],
  'Nyandarua': ['Kinangop','Kipipiri','Ndaragwa','Ol Kalou','Ol Joro Orok'],
  'Nyeri': ['Kieni','Mathira','Mukurweini','Nyeri Town','Othaya','Tetu'],
  'Samburu': ['Samburu East','Samburu North','Samburu West'],
  'Siaya': ['Alego Usonga','Bondo','Gem','Rarieda','Ugenya','Ugunja'],
  'Taita-Taveta': ['Mwatate','Taveta','Voi','Wundanyi'],
  'Tana River': ['Bura','Galole','Garsen'],
  'Tharaka-Nithi': ['Chuka','Igambang\'ombe','Maara','Tharaka'],
  'Trans Nzoia': ['Cherangany','Endebess','Kiminini','Kwanza','Saboti'],
  'Turkana': ['Loima','Turkana Central','Turkana East','Turkana North','Turkana South','Turkana West'],
  'Uasin Gishu': ['Ainabkoi','Kapseret','Kesses','Moiben','Soy','Turbo'],
  'Vihiga': ['Emuhaya','Hamisi','Luanda','Sabatia','Vihiga'],
  'Wajir': ['Eldas','Tarbaj','Wajir East','Wajir North','Wajir South','Wajir West'],
  'West Pokot': ['Central Pokot','Kacheliba','Pokot South','West Pokot'],
}

const CADRES = [
  'Medical Officer',
  'Clinical Officer',
  'Registered Nurse',
  'Enrolled Nurse',
  'Midwife',
  'Registered Clinical Officer',
  'Pharmaceutical Technologist',
  'Pharmacist',
  'Community Health Promoter (CHP)',
  'Community Health Volunteer (CHV)',
  'Nutritionist',
  'Health Records Officer',
  'Other'
]

export default function FacilitySettings() {
  const navigate = useNavigate()
  const [form, setForm] = useState(getFacilitySettings)
  const [saved, setSaved] = useState(false)

  // Use individual handlers to prevent re-render cursor jump
  const handleFacilityName = useCallback(e => {
    setForm(p => ({ ...p, facility_name: e.target.value }))
    setSaved(false)
  }, [])

  const handleFacilityCode = useCallback(e => {
    setForm(p => ({ ...p, facility_code: e.target.value }))
    setSaved(false)
  }, [])

  const handleCounty = useCallback(e => {
    setForm(p => ({ ...p, county: e.target.value, sub_county: '' }))
    setSaved(false)
  }, [])

  const handleSubCounty = useCallback(e => {
    setForm(p => ({ ...p, sub_county: e.target.value }))
    setSaved(false)
  }, [])

  const handleWard = useCallback(e => {
    setForm(p => ({ ...p, ward: e.target.value }))
    setSaved(false)
  }, [])

  const handleProviderName = useCallback(e => {
    setForm(p => ({ ...p, provider_name: e.target.value }))
    setSaved(false)
  }, [])

  const handleProviderCadre = useCallback(e => {
    setForm(p => ({ ...p, provider_cadre: e.target.value }))
    setSaved(false)
  }, [])

  const handleProviderNumber = useCallback(e => {
    setForm(p => ({ ...p, provider_number: e.target.value }))
    setSaved(false)
  }, [])

  const handleSave = () => {
    saveFacilitySettings(form)
    setSaved(true)
    setTimeout(() => window.location.href = '/', 1500)
  }

  const subCounties = COUNTY_SUBCOUNTIES[form.county] || []

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => window.location.href = '/'}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-4">
        <ArrowLeft size={15}/> Back to Dashboard
      </button>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Building2 className="text-blue-600" size={24}/> Facility & Provider Settings
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          These details appear on all session records, print reports and MOH 512 exports
        </p>
      </div>

      {/* Facility Details */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
        <h3 className="font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
          <Building2 size={16} className="text-blue-500"/> Facility Information
        </h3>
        <div className="grid grid-cols-2 gap-4">

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Facility Name <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="e.g. Kikuyu Health Centre"
              value={form.facility_name}
              onChange={handleFacilityName}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Facility KHIS Code
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="e.g. 14123"
              value={form.facility_code}
              onChange={handleFacilityCode}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              County <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.county}
              onChange={handleCounty}>
              <option value="">Select county...</option>
              {Object.keys(COUNTY_SUBCOUNTIES).sort().map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Sub-County</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.sub_county}
              onChange={handleSubCounty}
              disabled={!form.county}>
              <option value="">
                {form.county ? 'Select sub-county...' : 'Select county first'}
              </option>
              {subCounties.map(sc => (
                <option key={sc} value={sc}>{sc}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Ward</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="e.g. Karai"
              value={form.ward}
              onChange={handleWard}
            />
          </div>

        </div>
      </div>

      {/* Provider Details */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
        <h3 className="font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
          <User size={16} className="text-blue-500"/> Provider Information
        </h3>
        <div className="grid grid-cols-2 gap-4">

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Provider Full Name <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="e.g. Jane Wanjiku"
              value={form.provider_name}
              onChange={handleProviderName}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Cadre / Designation
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.provider_cadre}
              onChange={handleProviderCadre}>
              <option value="">Select cadre...</option>
              {CADRES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Professional Registration No.
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="e.g. NCK/12345"
              value={form.provider_number}
              onChange={handleProviderNumber}
            />
          </div>

        </div>
      </div>

      {/* Preview */}
      {form.facility_name && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <p className="text-xs font-bold text-blue-700 mb-2 uppercase tracking-wide">
            Preview — How it will appear on records
          </p>
          <p className="text-sm font-bold text-blue-900">{form.facility_name}</p>
          <p className="text-xs text-blue-700">
            {[form.ward, form.sub_county, form.county].filter(Boolean).join(', ')}
            {form.facility_code && ` | KHIS Code: ${form.facility_code}`}
          </p>
          {form.provider_name && (
            <p className="text-xs text-blue-700 mt-1">
              Provider: {form.provider_name}
              {form.provider_cadre && ` (${form.provider_cadre})`}
              {form.provider_number && ` | Reg: ${form.provider_number}`}
            </p>
          )}
        </div>
      )}

      {/* Save Button */}
      <button onClick={handleSave}
        className={`w-full flex items-center justify-center gap-2 font-bold py-4 px-6 rounded-xl shadow-md transition-colors
          ${saved
            ? 'bg-green-500 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
        {saved
          ? <><CheckCircle size={20}/> Saved! Redirecting...</>
          : <><Save size={20}/> Save Facility Settings</>}
      </button>

      {/* SMS Reminders */}
      <div className="mt-4 bg-gray-50 rounded-xl border border-gray-200 p-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-700 text-sm flex items-center gap-2">
            <MessageSquare size={16} className="text-blue-500"/> SMS Reminders
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Send appointment reminders via Africa's Talking</p>
        </div>
        <button onClick={() => window.location.href = '/settings/sms'}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          Manage SMS
        </button>
      </div>

      {/* DHIS2 Integration */}
      <div className="mt-4 bg-gray-50 rounded-xl border border-gray-200 p-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-700 text-sm flex items-center gap-2">
            <Globe size={16} className="text-blue-500"/> KHIS / DHIS2 Integration
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Push MOH 711 data to Kenya Health Information System</p>
        </div>
        <button onClick={() => navigate('/settings/dhis2')}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          Configure
        </button>
      </div>

      {/* Manage Users */}
      <div className="mt-4 bg-gray-50 rounded-xl border border-gray-200 p-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-700 text-sm flex items-center gap-2">
            <Users size={16} className="text-blue-500"/> Provider Accounts
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Add or manage provider login accounts</p>
        </div>
        <button onClick={() => window.location.href = '/settings/users'}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          Manage Users
        </button>
      </div>

      {/* Multi-Facility */}
      <div className="mt-4 bg-gray-50 rounded-xl border border-gray-200 p-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-700 text-sm flex items-center gap-2">
            <Globe size={16} className="text-blue-500"/> Multi-Facility Setup
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure for single facility or facility network
          </p>
        </div>
        <button onClick={() => window.location.href = '/settings/multi-facility'}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          Configure
        </button>
      </div>
    </div>
  )
}