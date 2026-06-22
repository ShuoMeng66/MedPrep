import { useTabStore, type TabKey } from '@/store/useTabStore'
import { Clock, ClipboardList, FileText } from 'lucide-react'

const tabs: { key: TabKey; label: string; icon: typeof Clock }[] = [
  { key: 'timeline', label: '症状时间线', icon: Clock },
  { key: 'checklist', label: '问诊清单', icon: ClipboardList },
  { key: 'report', label: '报告解读', icon: FileText },
]

export default function TabBar() {
  const activeTab = useTabStore((s) => s.activeTab)
  const setActiveTab = useTabStore((s) => s.setActiveTab)

  return (
    <nav className="px-4 mb-4">
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-1.5 flex gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-base font-medium transition-all duration-200 min-h-[48px] ${
                isActive
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-orange-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}