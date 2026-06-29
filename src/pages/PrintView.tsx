import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Printer, ArrowLeft } from 'lucide-react'
import { readVisitData } from '@/utils/visitStore'
import { getLastHistory, compareVisits } from '@/utils/compareVisits'

const SEVERITY_LABELS: Record<string, string> = { '轻': '轻度', '中': '中度', '重': '重度' }

export default function PrintView() {
  const navigate = useNavigate()
  const data = useMemo(() => readVisitData(), [])

  const generateTime = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    const h = String(now.getHours()).padStart(2, '0')
    const min = String(now.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${d} ${h}:${min}`
  }, [])

  const comparison = useMemo(() => {
    const lastHistory = getLastHistory()
    if (!lastHistory) return null
    return compareVisits(lastHistory.data, data, lastHistory.label)
  }, [data])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 打印按钮栏 - 打印时隐藏 */}
      <div className="no-print fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 bg-orange-500 text-white text-sm font-medium px-5 py-2 rounded-xl hover:bg-orange-600 active:scale-[0.98] transition-all"
        >
          <Printer className="w-4 h-4" />
          打印
        </button>
      </div>

      {/* 打印内容 */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-16 pb-12">
        <h1 className="text-xl sm:text-2xl font-bold text-center text-gray-800 mb-1">陪诊锦囊 · 本次就诊资料</h1>
        <p className="text-sm text-gray-400 text-center mb-8">生成时间：{generateTime}</p>

        <div className="space-y-6">
          {/* 症状时间线 */}
          {data.timeline && (
            <section>
              <h2 className="text-base font-bold text-orange-600 border-b-2 border-orange-100 pb-2 mb-3">症状时间线</h2>
              {data.timeline.clinicalSummary && data.timeline.clinicalSummary.length > 0 && (
                <div className="mb-4 bg-blue-50 rounded-xl px-4 py-3">
                  <p className="text-xs font-medium text-blue-600 mb-2">整理后表述</p>
                  <ul className="space-y-1.5">
                    {data.timeline.clinicalSummary.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-200 text-blue-700 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data.timeline.thirtySecondVersion && (
                <div className="mb-4 bg-green-50 rounded-xl px-4 py-3">
                  <p className="text-xs font-medium text-green-600 mb-1">给医生听的 30 秒版</p>
                  <p className="text-sm text-gray-700 italic">"{data.timeline.thirtySecondVersion}"</p>
                </div>
              )}
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
            </section>
          )}

          {/* 问诊清单 */}
          {data.checklist && (() => {
            const checked = new Set(data.checklist.checkedIds)
            const checkedItems = data.checklist.questions.filter((q) => checked.has(q.id))
            const uncheckedItems = data.checklist.questions.filter((q) => !checked.has(q.id))
            return (
              <section>
                <h2 className="text-base font-bold text-green-600 border-b-2 border-green-100 pb-2 mb-3">问诊清单</h2>
                {checkedItems.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-green-700 mb-2">已问过（{checkedItems.length}条）</p>
                    <div className="space-y-1.5">
                      {checkedItems.map((q) => (
                        <div key={q.id} className="flex items-start gap-2 text-sm text-gray-500 line-through bg-green-50/50 rounded-lg px-3 py-2">
                          <span className="text-green-400 flex-shrink-0 mt-0.5">☑</span>
                          <span>{q.question}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {uncheckedItems.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">待问（{uncheckedItems.length}条）</p>
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
              </section>
            )
          })()}

          {/* 报告解读 */}
          {data.report && (
            <section>
              <h2 className="text-base font-bold text-blue-600 border-b-2 border-blue-100 pb-2 mb-3">报告解读 · {data.report.result.reportType}</h2>
              <div className="space-y-2.5">
                {data.report.result.indicators.map((ind, i) => (
                  <div key={i} className={`rounded-xl px-3 py-2.5 text-sm ${ind.abnormal ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-800">{ind.name}</span>
                      {ind.abnormal && <span className="text-xs bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded">建议向医生确认</span>}
                    </div>
                    <p className="text-gray-600 text-xs leading-relaxed">{ind.explanation}</p>
                  </div>
                ))}
              </div>
              {data.report.aiEnhanced?.plainExplanation && (
                <div className="mt-3 bg-blue-50 rounded-xl px-4 py-3">
                  <p className="text-xs font-medium text-blue-600 mb-1.5">AI 白话解读</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{data.report.aiEnhanced.plainExplanation}</p>
                </div>
              )}
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
            </section>
          )}

          {/* 诊后备忘 */}
          {data.postVisit && (() => {
            const pv = data.postVisit.data
            return (
              <section>
                <h2 className="text-base font-bold text-purple-600 border-b-2 border-purple-100 pb-2 mb-3">诊后备忘</h2>
                <div className="space-y-4">
                  {pv.doctorSummary.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-blue-700 mb-1.5">医生告知摘要</h4>
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
                      <h4 className="text-sm font-medium text-green-700 mb-1.5">用药清单</h4>
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
                      <h4 className="text-sm font-medium text-purple-700 mb-1.5">复查随访</h4>
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
                      <h4 className="text-sm font-medium text-red-600 mb-1.5">观察提醒</h4>
                      <ul className="space-y-1">
                        {pv.warnings.map((s, i) => (
                          <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="text-red-400 flex-shrink-0 mt-0.5">⚠</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">出现以上情况请及时就医</p>
                    </div>
                  )}
                </div>
              </section>
            )
          })()}

          {/* 复诊对比 */}
          {comparison && (
            <section>
              <h2 className="text-base font-bold text-teal-600 border-b-2 border-teal-100 pb-2 mb-3">复诊对比 · 对比 {comparison.prevLabel}</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3">
                <p className="text-xs text-amber-800">对比基于用户自行记录，不能替代医疗判断</p>
              </div>
              {comparison.symptomComparison.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">症状变化</h4>
                  <div className="space-y-2">
                    {comparison.symptomComparison.map((s, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl px-3 py-2.5">
                        <p className="text-sm text-gray-700 leading-relaxed">{s.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        <div className="mt-8 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400">本资料由「陪诊锦囊 MedPrep」生成，仅供参考</p>
          <p className="text-xs text-gray-400 mt-1">不构成医疗诊断或治疗建议</p>
        </div>
      </div>

      {/* 打印样式 */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { padding-top: 0 !important; }
        }
      `}</style>
    </div>
  )
}