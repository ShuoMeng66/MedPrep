import Header from '@/components/Header'
import TabBar from '@/components/TabBar'
import SymptomTimeline from '@/components/SymptomTimeline'
import ConsultChecklist from '@/components/ConsultChecklist'
import ReportReader from '@/components/ReportReader'
import { useTabStore } from '@/store/useTabStore'

export default function Home() {
  const activeTab = useTabStore((s) => s.activeTab)

  return (
    <div className="min-h-screen bg-orange-50/50 flex justify-center">
      <div className="w-full max-w-[480px] pb-10">
        <Header />
        <TabBar />
        {activeTab === 'timeline' && <SymptomTimeline />}
        {activeTab === 'checklist' && <ConsultChecklist />}
        {activeTab === 'report' && <ReportReader />}
      </div>
    </div>
  )
}