import { useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import TabBar from '@/components/TabBar'
import SymptomTimeline from '@/components/SymptomTimeline'
import ConsultChecklist from '@/components/ConsultChecklist'
import ReportReader from '@/components/ReportReader'
import PostVisitMemo from '@/components/PostVisitMemo'
import VisitPack from '@/components/VisitPack'
import { useTabStore } from '@/store/useTabStore'
import { useAuth } from '@/contexts/AuthContext'
import { ShieldAlert, ArrowRight } from 'lucide-react'

export default function Home() {
  const activeTab = useTabStore((s) => s.activeTab)
  const { user } = useAuth()
  const navigate = useNavigate()

  const isAnonymous = user?.is_anonymous

  return (
    <div className="min-h-screen bg-orange-50/50">
      <Header />

      {/* 匿名用户提示条 */}
      {isAnonymous && (
        <div className="max-w-6xl mx-auto px-4 mb-4">
          <button
            onClick={() => navigate('/settings')}
            className="w-full bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center justify-between hover:bg-amber-100 transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <div className="bg-amber-200 rounded-lg p-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-amber-800">当前为体验模式</p>
                <p className="text-xs text-amber-600">绑定邮箱可永久保存记录</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <TabBar />
        {activeTab === 'timeline' && <SymptomTimeline />}
        {activeTab === 'checklist' && <ConsultChecklist />}
        {activeTab === 'report' && <ReportReader />}
        {activeTab === 'postvisit' && <PostVisitMemo />}
        {activeTab === 'visitpack' && <VisitPack />}
      </div>
    </div>
  )
}