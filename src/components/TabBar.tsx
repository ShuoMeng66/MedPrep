import { useTabStore, type TabKey } from '@/store/useTabStore'
import { Clock, ClipboardList, FileText } from 'lucide-react'

const tabs: { key: TabKey; label: string; desc: string; icon: typeof Clock }[] = [
  { key: 'timeline', label: '症状时间线', desc: '记录病情发展', icon: Clock },
  { key: 'checklist', label: '问诊清单', desc: '准备就诊问题', icon: ClipboardList },
  { key: 'report', label: '报告解读', desc: '看懂检查指标', icon: FileText },
]

export default function TabBar() {
  const activeTab = useTabStore((s) => s.activeTab)
  const setActiveTab = useTabStore((s) => s.setActiveTab)

  return (
    <nav className="mb-6">
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-1.5 flex gap-1.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 sm:gap-3 py-3.5 px-2 sm:px-4 rounded-xl text-base font-medium transition-all duration-200 min-h-[48px] ${
                isActive
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-orange-50'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <div className="text-left">
                <div className="text-sm sm:text-base leading-tight">{tab.label}</div>
                <div className={`text-xs leading-tight mt-0.5 hidden sm:block ${isActive ? 'text-orange-100' : 'text-gray-400'}`}>
                  {tab.desc}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </nav>
  )
}