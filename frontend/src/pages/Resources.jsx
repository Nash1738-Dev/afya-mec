import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Video, FileText, Globe, ExternalLink, ChevronDown, ChevronUp, Search } from 'lucide-react'

const RESOURCES = [
  {
    category: 'DMPA-SC / Sayana Press',
    icon: '💉',
    color: 'blue',
    items: [
      {
        type: 'video',
        title: 'How to Self-Inject DMPA-SC — Client Video (English)',
        description: 'Official 5-minute video showing clients exactly how to self-inject Sayana Press subcutaneously. Covers preparation, injection technique, and disposal.',
        url: 'https://www.youtube.com/watch?v=KI4eZniwmkA',
        source: 'Viya',
        duration: '5 min',
        audience: 'Clients & Providers',
        free: true,
      },
      {
        type: 'video',
        title: 'DMPA-SC Administration — Health Worker Training Video',
        description: 'Official 7-minute training video for health workers on how to administer DMPA-SC to clients. Covers technique, counselling, and follow-up.',
        url: 'https://fpoptions.org/resource/training-videos/',
        source: 'PATH / JSI',
        duration: '7 min',
        audience: 'Health Workers',
        free: true,
      },
      {
        type: 'guide',
        title: 'DMPA-SC Self-Injection Resource Library',
        description: 'Comprehensive resource library with training videos, job aids, counselling tools, and research on DMPA-SC self-injection from PATH.',
        url: 'https://fpoptions.org',
        source: 'PATH / FPoptions.org',
        audience: 'Providers & Managers',
        free: true,
      },
      {
        type: 'guide',
        title: 'WHO Self-Care Recommendation: DMPA-SC Self-Injection',
        description: 'WHO strongly recommends DMPA-SC self-injection as an additional approach to deliver injectable contraception. Access WHO guidance here.',
        url: 'https://www.who.int/reproductivehealth/self-care-interventions/en/',
        source: 'World Health Organization',
        audience: 'Providers & Policymakers',
        free: true,
      },
    ]
  },
  {
    category: 'WHO MEC Guidelines',
    icon: '📋',
    color: 'green',
    items: [
      {
        type: 'guide',
        title: 'WHO Medical Eligibility Criteria — 6th Edition (2025)',
        description: 'The latest WHO MEC guidance with over 2,000 recommendations for 25 contraceptive methods. This is the clinical evidence base for the Digital MEC platform.',
        url: 'https://www.who.int/publications/i/item/9789240115583',
        source: 'World Health Organization',
        audience: 'Providers & Clinicians',
        free: true,
      },
      {
        type: 'guide',
        title: 'WHO Selected Practice Recommendations (SPR) — 4th Edition',
        description: 'Companion to MEC — provides guidance on HOW to use contraceptive methods safely once eligibility is established.',
        url: 'https://www.who.int/publications/i/item/9789240052130',
        source: 'World Health Organization',
        audience: 'Providers',
        free: true,
      },
      {
        type: 'guide',
        title: 'WHO Quick Reference Chart — MEC Categories 3 & 4',
        description: 'Quick reference showing all conditions classified as Category 3 or 4 for COC, DMPA, implants, Cu-IUD and LNG-IUS.',
        url: 'https://fhi360.org/wp-content/uploads/drupal/documents/resource-chart-medical-eligibility-contraceptives-english.pdf',
        source: 'FHI 360 / WHO',
        audience: 'Providers at point of care',
        free: true,
      },
    ]
  },
  {
    category: 'BCS+ Toolkit',
    icon: '🗂️',
    color: 'purple',
    items: [
      {
        type: 'guide',
        title: 'BCS+ Toolkit — 3rd Edition (WHO MEC 2015) — Population Council',
        description: 'Full BCS+ toolkit including algorithm, 26 counselling cards, method brochures, trainer\'s guide and user\'s guide. Developed and tested in Kenya.',
        url: 'https://knowledgecommons.popcouncil.org/departments_sbsr-rh/727/',
        source: 'Population Council',
        audience: 'Providers & Trainers',
        free: true,
      },
      {
        type: 'app',
        title: 'Kenya FP+ App (Official Kenya MOH BCS+ App)',
        description: 'Official Kenya Ministry of Health app guiding providers through the BCS+ algorithm. Works offline. Available on Google Play.',
        url: 'https://play.google.com/store/apps/details?id=fp.health.go.ke',
        source: 'Kenya Ministry of Health',
        audience: 'Health Providers',
        free: true,
      },
      {
        type: 'guide',
        title: 'Kenya BCS+ Algorithm PDF (MOH 2023)',
        description: 'Official Kenya MOH BCS+ Algorithm document — the 2023 updated version from the Division of Reproductive and Maternal Health.',
        url: 'https://repository.familyhealth.go.ke/xmlui/bitstream/handle/123456789/203/Final%20%20BCS-Plus_Algorithm.pdf',
        source: 'Kenya Ministry of Health',
        audience: 'Providers & Trainers',
        free: true,
      },
    ]
  },
  {
    category: 'Kenya National FP Guidelines',
    icon: '🇰🇪',
    color: 'orange',
    items: [
      {
        type: 'guide',
        title: 'Kenya National Family Planning Guidelines — 6th Edition (2022)',
        description: 'Kenya\'s national guidelines for family planning service delivery, updated 2022. Covers all methods, eligibility criteria, and service delivery standards.',
        url: 'https://media.tciurbanhealth.org/wp-content/uploads/2017/07/12124654/2022Kenya-National-Family-Planning-Guidelines-6th-Edition.pdf',
        source: 'Kenya Ministry of Health',
        audience: 'All FP Providers',
        free: true,
      },
      {
        type: 'guide',
        title: 'Kenya MOH Department of Family Health',
        description: 'Official Kenya MOH family health portal with guidelines, tools, training materials, and updates on family planning in Kenya.',
        url: 'https://familyhealth.go.ke',
        source: 'Kenya Ministry of Health',
        audience: 'All',
        free: true,
      },
      {
        type: 'guide',
        title: 'MOH 512 Register — Family Planning Daily Activity Register',
        description: 'Official MOH 512 register format and instructions for recording family planning client visits.',
        url: 'https://media.tciurbanhealth.org/wp-content/uploads/2017/07/12130822/DAR-register.pdf',
        source: 'Kenya MOH / TCI',
        audience: 'Health Records Officers & Providers',
        free: true,
      },
    ]
  },
  {
    category: 'Training & eLearning',
    icon: '🎓',
    color: 'teal',
    items: [
      {
        type: 'course',
        title: 'Family Planning: Global Handbook for Providers (2022)',
        description: 'Comprehensive WHO/JHU handbook covering all contraceptive methods with latest evidence. Free online and downloadable PDF.',
        url: 'https://fphandbook.org',
        source: 'WHO / Johns Hopkins',
        audience: 'Providers',
        free: true,
      },
      {
        type: 'course',
        title: 'Fundamentals of Family Planning — FP&RH eLearning',
        description: 'Free online courses on family planning counselling, method provision, and quality of care from the Johns Hopkins FP training program.',
        url: 'https://fptraining.org',
        source: 'Johns Hopkins / USAID',
        audience: 'Providers & Trainees',
        free: true,
      },
      {
        type: 'video',
        title: 'ACQUIRE Project — FP Counselling Videos',
        description: 'Series of training videos on quality FP counselling, including client-provider interaction demonstrations.',
        url: 'https://www.engenderhealth.org/technical-areas/family-planning/',
        source: 'EngenderHealth',
        audience: 'Providers & Trainers',
        free: true,
      },
    ]
  },
  {
    category: 'Method-Specific References',
    icon: '📚',
    color: 'indigo',
    items: [
      {
        type: 'guide',
        title: 'Copper IUD — PAINS Warning Signs Reference Card',
        description: 'Quick reference card for PAINS warning signs to teach IUD clients: Period late, Abdominal pain, Infection, Not feeling strings, Spotting.',
        url: 'https://fphandbook.org/iud',
        source: 'FP Global Handbook',
        audience: 'Providers & Clients',
        free: true,
      },
      {
        type: 'guide',
        title: 'COC — ACHES Warning Signs Reference',
        description: 'Quick reference for ACHES danger signs for COC users: Abdominal pain, Chest pain, Headaches, Eye problems, Severe leg pain.',
        url: 'https://fphandbook.org/pills',
        source: 'FP Global Handbook',
        audience: 'Providers & Clients',
        free: true,
      },
      {
        type: 'guide',
        title: 'Implant Counselling Guide',
        description: 'Comprehensive guide on implant insertion, removal, counselling, and management of side effects.',
        url: 'https://fphandbook.org/implants',
        source: 'FP Global Handbook',
        audience: 'Providers',
        free: true,
      },
      {
        type: 'guide',
        title: 'Emergency Contraception Guide',
        description: 'WHO guidance on emergency contraception options including ECPs and Cu-IUD. Timing, efficacy, and counselling.',
        url: 'https://www.who.int/news-room/fact-sheets/detail/emergency-contraception',
        source: 'World Health Organization',
        audience: 'Providers & Clients',
        free: true,
      },
    ]
  },
]

const TYPE_CONFIG = {
  video: { icon: '🎥', color: 'bg-red-100 text-red-700', label: 'Video' },
  guide: { icon: '📄', color: 'bg-blue-100 text-blue-700', label: 'Guide/PDF' },
  course: { icon: '🎓', color: 'bg-purple-100 text-purple-700', label: 'Course' },
  app: { icon: '📱', color: 'bg-green-100 text-green-700', label: 'App' },
}

const CATEGORY_COLORS = {
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  purple: 'bg-purple-600',
  orange: 'bg-orange-500',
  teal: 'bg-teal-600',
  indigo: 'bg-indigo-600',
}

export default function Resources() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [openCategories, setOpenCategories] = useState([0, 1])

  const toggleCategory = (idx) => {
    setOpenCategories(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    )
  }

  const filtered = RESOURCES.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      cat.category.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0)

  const totalResources = RESOURCES.reduce((a, b) => a + b.items.length, 0)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <BookOpen className="text-blue-600" size={24}/> Resources
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          {totalResources} curated resources — guidelines, videos, training materials
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <button onClick={() => navigate('/bcs-algorithm')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-colors text-left">
          <span className="text-2xl">🗂️</span>
          <div>
            <p className="font-bold text-sm">BCS+ Algorithm</p>
            <p className="text-xs text-blue-200">Interactive step-by-step guide</p>
          </div>
        </button>
        <a href="https://fpoptions.org/resource/training-videos/" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl transition-colors">
          <span className="text-2xl">🎥</span>
          <div>
            <p className="font-bold text-sm">DMPA-SC Videos</p>
            <p className="text-xs text-red-200">Self-injection training</p>
          </div>
        </a>
        <a href="https://fphandbook.org" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white p-3 rounded-xl transition-colors">
          <span className="text-2xl">📖</span>
          <div>
            <p className="font-bold text-sm">FP Handbook</p>
            <p className="text-xs text-green-200">WHO/JHU Global handbook</p>
          </div>
        </a>
        <a href="https://familyhealth.go.ke" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-xl transition-colors">
          <span className="text-2xl">🇰🇪</span>
          <div>
            <p className="font-bold text-sm">Kenya MOH FH</p>
            <p className="text-xs text-orange-200">Official MOH portal</p>
          </div>
        </a>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-3 text-gray-400"/>
        <input
          className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Search resources..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Resource Categories */}
      <div className="space-y-3">
        {filtered.map((cat, catIdx) => {
          const isOpen = openCategories.includes(catIdx) || !!search
          const bgColor = CATEGORY_COLORS[cat.color] || 'bg-blue-600'

          return (
            <div key={cat.category} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <button
                onClick={() => toggleCategory(catIdx)}
                className={`w-full flex items-center justify-between p-4 ${isOpen ? bgColor + ' text-white' : 'hover:bg-gray-50'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cat.icon}</span>
                  <div className="text-left">
                    <p className={`font-bold text-sm ${isOpen ? 'text-white' : 'text-gray-800'}`}>
                      {cat.category}
                    </p>
                    <p className={`text-xs ${isOpen ? 'text-white text-opacity-75' : 'text-gray-400'}`}>
                      {cat.items.length} resources
                    </p>
                  </div>
                </div>
                {isOpen
                  ? <ChevronUp size={16} className="text-white"/>
                  : <ChevronDown size={16} className="text-gray-400"/>}
              </button>

              {isOpen && (
                <div className="divide-y divide-gray-50">
                  {cat.items.map((item, itemIdx) => {
                    const typeConfig = TYPE_CONFIG[item.type] || TYPE_CONFIG.guide
                    return (
                      <a key={itemIdx}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors group">
                        <span className="text-2xl flex-shrink-0">{typeConfig.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 mb-1">
                            <p className="font-semibold text-gray-800 text-sm group-hover:text-blue-600 transition-colors">
                              {item.title}
                            </p>
                            <ExternalLink size={12} className="text-gray-300 group-hover:text-blue-400 flex-shrink-0 mt-0.5"/>
                          </div>
                          <p className="text-xs text-gray-500 mb-2 leading-relaxed">{item.description}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeConfig.color}`}>
                              {typeConfig.label}
                            </span>
                            {item.duration && (
                              <span className="text-xs text-gray-400">⏱ {item.duration}</span>
                            )}
                            <span className="text-xs text-gray-400">📌 {item.source}</span>
                            {item.free && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Free</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">👥 {item.audience}</p>
                        </div>
                      </a>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30"/>
          <p>No resources match your search</p>
        </div>
      )}
    </div>
  )
}