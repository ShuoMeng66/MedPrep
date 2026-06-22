import Header from '@/components/Header'
import TabBar from '@/components/TabBar'
import SymptomTimeline from '@/components/SymptomTimeline'
import ConsultChecklist from '@/components/ConsultChecklist'
import ReportReader from '@/components/ReportReader'
import PostVisitMemo from '@/components/PostVisitMemo'
import VisitPack from '@/components/VisitPack'
import { useTabStore } from '@/store/useTabStore'

export default function Home() {
  const activeTab = useTabStore((s) => s.activeTab)

  return (
    <div className="min-h-screen bg-orange-50/50">
      <Header />
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