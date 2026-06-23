import { useTabStore, type TabKey } from '@/store/useTabStore'
import { Clock, ClipboardList, FileText, NotebookPen, FolderOpen } from 'lucide-react'

const tabs: { key: TabKey; label: string; desc: string; icon: typeof Clock }[] = [
  { key: 'timeline', label: '症状时间线', desc: '记录病情发展', icon: Clock },
  { key: 'checklist', label: '问诊清单', desc: '准备就诊问题', icon: ClipboardList },
  { key: 'report', label: '报告解读', desc: '看懂检查指标', icon: FileText },
  { key: 'postvisit', label: '诊后备忘', desc: '整理医嘱与随访安排', icon: NotebookPen },
  { key: 'visitpack', label: '就诊包', desc: '汇总就诊资料', icon: FolderOpen },
]

export default function TabBar() {
  const activeTab = useTabStore((s) => s.activeTab)
  const setActiveTab = useTabStore((s) => s.setActiveTab)

  return (
    <nav className="mb-6 relative">
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-1.5 flex gap-1 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 flex items-center justify-center gap-1.5 sm:gap-2.5 py-3 px-2.5 sm:px-3.5 rounded-xl text-sm sm:text-base font-medium transition-all duration-200 min-h-[44px] ${
                isActive
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-orange-50'
              }`}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <div className="text-left">
                <div className="text-xs sm:text-sm leading-tight whitespace-nowrap">{tab.label}</div>
                <div className={`text-[10px] sm:text-xs leading-tight mt-0.5 hidden sm:block ${isActive ? 'text-orange-100' : 'text-gray-400'}`}>
                  {tab.desc}
                </div>
              </div>
            </button>
          )
        })}
      </div>
      {/* Right fade indicator */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent sm:hidden" />
    </nav>
  )
}