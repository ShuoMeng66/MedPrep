import { useMemo } from 'react'
import {
  AlertCircle,
  Clock,
  ClipboardList,
  FileText,
  NotebookPen,
  Stethoscope,
  Pill,
  CalendarClock,
  Eye,
  Check,
} from 'lucide-react'
import { decodeShareData } from '@/utils/shareUtils'
import type { VisitData } from '@/utils/visitStore'
import type { TimelineEntry } from '@/utils/timelineParser'
import type { QuestionItem } from '@/utils/questionGenerator'

const SEVERITY_LABELS: Record<string, string> = { '轻': '轻度', '中': '中度', '重': '重度' }

export default function ShareView() {
  const shareResult = useMemo(() => decodeShareData(), [])

  if (!shareResult) {
    return (
      <div className="min-h-screen bg-orange-50/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-10 text-center max-w-md">
          <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">无法读取分享内容</h2>
          <p className="text-sm text-gray-500">分享链接可能已失效或不完整，请联系分享者重新发送</p>
        </div>
      </div>
    )
  }

  const data = shareResult.data
  const hasAnyData = data.timeline || data.checklist || data.report || data.postVisit

  if (!hasAnyData) {
    return (
      <div className="min-h-screen bg-orange-50/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-10 text-center max-w-md">
          <div className="bg-orange-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-orange-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">分享内容为空</h2>
          <p className="text-sm text-gray-500">此就诊资料中暂无内容</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-orange-50/50">
      {/* 分享提示横幅 */}
      <div className="bg-amber-500 text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm font-medium">家人分享的就诊资料，仅供参考</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">陪诊锦囊 · 就诊资料</h1>
          <p className="text-sm text-gray-400 mt-1">由家人分享</p>
        </div>

        {/* 症状时间线 */}
        {data.timeline && (
          <SectionCard
            icon={<Clock className="w-5 h-5 text-orange-500" />}
            title="症状时间线"
            color="orange"
          >
            <div className="relative">
              <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-orange-200 rounded-full" />
              {data.timeline.entries.map((entry, i) => (
                <div key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
                  <div className="relative z-10 flex-shrink-0 mt-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-orange-500 text-white' : 'bg-white border-2 border-orange-300 text-orange-600'
                    }`}>
                      {i + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-800">{entry.dateLabel}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        entry.severity === '轻' ? 'bg-green-100 text-green-700' :
                        entry.severity === '中' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {SEVERITY_LABELS[entry.severity]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{entry.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* 问诊清单 */}
        {data.checklist && (() => {
          const checked = new Set(data.checklist.checkedIds)
          const checkedItems = data.checklist.questions.filter((q) => checked.has(q.id))
          const uncheckedItems = data.checklist.questions.filter((q) => !checked.has(q.id))
          return (
            <SectionCard
              icon={<ClipboardList className="w-5 h-5 text-green-500" />}
              title="问诊清单"
              color="green"
            >
              <div className="space-y-4">
                {checkedItems.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      已问过（{checkedItems.length}条）
                    </h4>
                    <div className="space-y-1.5">
                      {checkedItems.map((q) => (
                        <div key={q.id} className="flex items-start gap-2 text-sm text-gray-500 line-through bg-green-50/50 rounded-lg px-3 py-2">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          <span>{q.question}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {uncheckedItems.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-gray-400" />
                      待问（{uncheckedItems.length}条）
                    </h4>
                    <div className="space-y-1.5">
                      {uncheckedItems.map((q) => (
                        <div key={q.id} className="flex items-start gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                          <span className="w-4 h-4 rounded border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                          <span>{q.question}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          )
        })()}

        {/* 报告解读 */}
        {data.report && (
          <SectionCard
            icon={<FileText className="w-5 h-5 text-blue-500" />}
            title="报告解读"
            color="blue"
          >
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-blue-50 rounded-lg p-1.5">
                  <Stethoscope className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-sm font-semibold text-blue-700">{data.report.result.reportType}</span>
              </div>
              <div className="space-y-2.5">
                {data.report.result.indicators.map((ind, i) => (
                  <div key={i} className={`rounded-xl px-3 py-2.5 text-sm ${
                    ind.abnormal ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-800">{ind.name}</span>
                      {ind.abnormal && (
                        <span className="text-xs bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded">建议向医生确认</span>
                      )}
                    </div>
                    <p className="text-gray-600 text-xs leading-relaxed">{ind.explanation}</p>
                  </div>
                ))}
              </div>
              {data.report.result.followUpQuestions.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-xs font-medium text-gray-500">复诊追问建议</p>
                  {data.report.result.followUpQuestions.map((q, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
                      <span className="font-bold">{i + 1}.</span>
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* 诊后备忘 */}
        {data.postVisit && (() => {
          const pv = data.postVisit.data
          return (
            <SectionCard
              icon={<NotebookPen className="w-5 h-5 text-purple-500" />}
              title="诊后备忘"
              color="purple"
            >
              <div className="space-y-4">
                {pv.doctorSummary.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-blue-700 mb-1.5 flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5" />
                      医生告知摘要
                    </h4>
                    <ul className="space-y-1">
                      {pv.doctorSummary.map((s, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {pv.medications.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-green-700 mb-1.5 flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5" />
                      用药清单
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-1.5 pr-2 font-medium text-gray-500">药品</th>
                            <th className="text-left py-1.5 pr-2 font-medium text-gray-500">用法用量</th>
                            <th className="text-left py-1.5 font-medium text-gray-500">注意事项</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pv.medications.map((med, i) => (
                            <tr key={i} className="border-b border-gray-50 last:border-0">
                              <td className="py-2 pr-2 text-gray-800 font-medium">{med.name}</td>
                              <td className="py-2 pr-2 text-gray-600">{med.dosage}</td>
                              <td className="py-2 text-gray-600">{med.notes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {pv.followUps.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-purple-700 mb-1.5 flex items-center gap-1.5">
                      <CalendarClock className="w-3.5 h-3.5" />
                      复查随访
                    </h4>
                    <div className="space-y-1.5">
                      {pv.followUps.map((fu, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm bg-purple-50 rounded-lg px-3 py-2">
                          <span className="text-xs font-bold text-purple-500">{i + 1}.</span>
                          <span className="text-purple-800">{fu.condition} — {fu.items}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {pv.warnings.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-red-600 mb-1.5 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      观察提醒
                    </h4>
                    <ul className="space-y-1">
                      {pv.warnings.map((s, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                          {s}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
                      出现以上情况请及时就医
                    </p>
                  </div>
                )}
              </div>
            </SectionCard>
          )
        })()}

        {/* 底部 */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">本资料由「陪诊锦囊 MedPrep」生成，仅供参考</p>
          <p className="text-xs text-gray-400 mt-1">不构成医疗诊断或治疗建议</p>
        </div>
      </div>
    </div>
  )
}

/** 分区卡片（只读版本，无编辑按钮） */
function SectionCard({
  icon,
  title,
  color,
  children,
}: {
  icon: React.ReactNode
  title: string
  color: 'orange' | 'green' | 'blue' | 'purple'
  children: React.ReactNode
}) {
  const borderMap = {
    orange: 'border-l-orange-400',
    green: 'border-l-green-400',
    blue: 'border-l-blue-400',
    purple: 'border-l-purple-400',
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-orange-100 border-l-4 ${borderMap[color]} mb-4 overflow-hidden`}>
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
        {icon}
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}