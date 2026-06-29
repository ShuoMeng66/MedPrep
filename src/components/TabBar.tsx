import { useTabStore, type TabKey } from '@/store/useTabStore'
import { Clock, ClipboardList, FileText, NotebookPen, FolderOpen, Pill } from 'lucide-react'

const tabs = [
  { key: 'timeline' as TabKey, label: '症状时间线', shortLabel: '时间线', desc: '记录病情发展', icon: Clock },
  { key: 'checklist' as TabKey, label: '问诊清单', shortLabel: '问诊', desc: '准备就诊问题', icon: ClipboardList },
  { key: 'report' as TabKey, label: '报告解读', shortLabel: '报告', desc: '看懂检查指标', icon: FileText },
  { key: 'postvisit' as TabKey, label: '诊后备忘', shortLabel: '备忘', desc: '整理医嘱与随访安排', icon: NotebookPen },
  { key: 'medication' as TabKey, label: '今日用药', shortLabel: '用药', desc: '按时服药提醒', icon: Pill },
  { key: 'visitpack' as TabKey, label: '就诊包', shortLabel: '就诊包', desc: '汇总就诊资料', icon: FolderOpen },
]

export default function TabBar() {
  const activeTab = useTabStore((s) => s.activeTab)
  const setActiveTab = useTabStore((s) => s.setActiveTab)

  return (
    <>
      {/* Mobile: Bottom Fixed Tab Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100">
        <div className="flex h-16 pb-safe">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform ${
                  isActive ? 'text-orange-500' : 'text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                {isActive && <span className="w-1 h-1 rounded-full bg-orange-500" />}
                {!isActive && <span className="w-1 h-1" />}
                <span className="text-[10px] leading-tight font-medium">{tab.shortLabel}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Desktop / Tablet: 顶部 Tab，宽屏 6 列网格 */}
      <div className="hidden sm:block mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-2 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2.5 py-3 px-3 rounded-xl text-sm font-medium transition-all duration-200 min-h-[52px] active:scale-[0.98] ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-orange-50'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="text-sm leading-tight truncate">{tab.label}</div>
                  <div className={`text-xs leading-tight mt-0.5 truncate ${isActive ? 'text-orange-100' : 'text-gray-400'}`}>
                    {tab.desc}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}