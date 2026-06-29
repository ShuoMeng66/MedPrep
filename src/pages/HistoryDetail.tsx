import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { fetchVisitById, deleteVisit, type VisitRecord } from '@/services/visitService'
import type { VisitData } from '@/utils/visitStore'
import { writeVisitData } from '@/utils/visitStore'
import {
  ArrowLeft, Clock, ClipboardList, FileText, NotebookPen, Eye, Check,
  AlertCircle, Stethoscope, Pill, CalendarClock, Trash2, Loader2, CopyPlus,
} from 'lucide-react'

const SEVERITY_LABELS: Record<string, string> = { '轻': '轻度', '中': '中度', '重': '重度' }

export default function HistoryDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [record, setRecord] = useState<VisitRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!user || !id) return
    setLoading(true)
    fetchVisitById(id, user.id).then((data) => {
      setRecord(data)
      setLoading(false)
    })
  }, [user, id])

  const handleReuse = () => {
    if (!record) return
    writeVisitData(record.visit_data as VisitData)
    navigate('/app')
  }

  const handleDelete = async () => {
    if (!user || !id) return
    setDeleting(true)
    await deleteVisit(id, user.id)
    setDeleting(false)
    navigate('/history', { replace: true })
  }

  const formatDate = (ts: string) => {
    if (!ts) return ''
    const d = new Date(ts)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const h = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${day} ${h}:${min}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50/50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
      </div>
    )
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-orange-50/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-orange-100 p-10 text-center max-w-md">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">记录不存在</h2>
          <p className="text-sm text-gray-500 mb-4">该就诊记录可能已被删除</p>
          <button onClick={() => navigate('/history')} className="text-sm text-orange-600 underline underline-offset-2">
            返回历史列表
          </button>
        </div>
      </div>
    )
  }

  const data = record.visit_data as VisitData

  return (
    <div className="min-h-screen bg-orange-50/50 pb-safe">
      <div className="app-container py-8">
        {/* 返回 */}
        <button
          onClick={() => navigate('/history')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-600 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回历史列表
        </button>

        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-800">{record.title}</h1>
          <p className="text-sm text-gray-400 mt-1">{formatDate(record.created_at)}</p>
        </div>

        {/* AI 临床摘要 */}
        {data.timeline?.clinicalSummary && data.timeline.clinicalSummary.length > 0 && (
          <div className="bg-white rounded-2xl border border-orange-100 border-l-4 border-l-blue-400 mb-4 overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
              <Stethoscope className="w-5 h-5 text-blue-500" />
              <h3 className="text-base font-semibold text-gray-800">给医生的摘要</h3>
            </div>
            <div className="p-4">
              <ul className="space-y-2">
                {data.timeline.clinicalSummary.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* 30 秒版 */}
        {data.timeline?.thirtySecondVersion && (
          <div className="bg-white rounded-2xl border border-orange-100 border-l-4 border-l-green-400 mb-4 overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
              <Clock className="w-5 h-5 text-green-500" />
              <h3 className="text-base font-semibold text-gray-800">给医生听的 30 秒版</h3>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-700 italic leading-relaxed">
                "{data.timeline.thirtySecondVersion}"
              </p>
            </div>
          </div>
        )}

        {/* 症状时间线 */}
        {data.timeline && (
          <div className="bg-white rounded-2xl border border-orange-100 border-l-4 border-l-orange-400 mb-4 overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
              <Clock className="w-5 h-5 text-orange-500" />
              <h3 className="text-base font-semibold text-gray-800">症状时间线</h3>
            </div>
            <div className="p-4">
              <div className="relative">
                <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-orange-200 rounded-full" />
                {data.timeline.entries.map((entry, i) => (
                  <div key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
                    <div className="relative z-10 flex-shrink-0 mt-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-orange-500 text-white' : 'bg-white border-2 border-orange-300 text-orange-600'}`}>
                        {i + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-800">{entry.dateLabel}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${entry.severity === '轻' ? 'bg-green-100 text-green-700' : entry.severity === '中' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {SEVERITY_LABELS[entry.severity]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{entry.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 问诊清单 */}
        {data.checklist && (() => {
          const checked = new Set(data.checklist.checkedIds)
          const checkedItems = data.checklist.questions.filter((q) => checked.has(q.id))
          const uncheckedItems = data.checklist.questions.filter((q) => !checked.has(q.id))
          return (
            <div className="bg-white rounded-2xl border border-orange-100 border-l-4 border-l-green-400 mb-4 overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
                <ClipboardList className="w-5 h-5 text-green-500" />
                <h3 className="text-base font-semibold text-gray-800">问诊清单</h3>
              </div>
              <div className="p-4 space-y-3">
                {checkedItems.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-green-700 mb-2">已问过（{checkedItems.length}条）</h4>
                    {checkedItems.map((q) => (
                      <div key={q.id} className="flex items-start gap-2 text-sm text-gray-500 line-through bg-green-50/50 rounded-lg px-3 py-2 mb-1.5">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{q.question}</span>
                      </div>
                    ))}
                  </div>
                )}
                {uncheckedItems.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">待问（{uncheckedItems.length}条）</h4>
                    {uncheckedItems.map((q) => (
                      <div key={q.id} className="flex items-start gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 mb-1.5">
                        <span className="w-4 h-4 rounded border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                        <span>{q.question}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        {/* 报告解读 */}
        {data.report && (
          <div className="bg-white rounded-2xl border border-orange-100 border-l-4 border-l-blue-400 mb-4 overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
              <FileText className="w-5 h-5 text-blue-500" />
              <h3 className="text-base font-semibold text-gray-800">报告解读</h3>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-blue-50 rounded-lg p-1.5">
                  <Stethoscope className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-sm font-semibold text-blue-700">{data.report.result.reportType}</span>
              </div>
              {data.report.result.indicators.map((ind, i) => (
                <div key={i} className={`rounded-xl px-3 py-2.5 text-sm mb-2 ${ind.abnormal ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-800">{ind.name}</span>
                    {ind.abnormal && <span className="text-xs bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded">建议向医生确认</span>}
                  </div>
                  <p className="text-gray-600 text-xs leading-relaxed">{ind.explanation}</p>
                </div>
              ))}
              {data.report.aiEnhanced?.plainExplanation && (
                <div className="mt-3 bg-blue-50 rounded-xl px-4 py-3">
                  <p className="text-xs font-medium text-blue-600 mb-1.5">AI 白话解读</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{data.report.aiEnhanced.plainExplanation}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 诊后备忘 */}
        {data.postVisit && (() => {
          const pv = data.postVisit.data
          return (
            <div className="bg-white rounded-2xl border border-orange-100 border-l-4 border-l-purple-400 mb-4 overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
                <NotebookPen className="w-5 h-5 text-purple-500" />
                <h3 className="text-base font-semibold text-gray-800">诊后备忘</h3>
              </div>
              <div className="p-4 space-y-4">
                {pv.doctorSummary.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-blue-700 mb-1.5 flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5" />医生告知摘要
                    </h4>
                    {pv.doctorSummary.map((s, i) => (
                      <div key={i} className="text-sm text-gray-600 flex items-start gap-2 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                        {s}
                      </div>
                    ))}
                  </div>
                )}
                {pv.medications.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-green-700 mb-1.5 flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5" />用药清单
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
                      <CalendarClock className="w-3.5 h-3.5" />复查随访
                    </h4>
                    {pv.followUps.map((fu, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm bg-purple-50 rounded-lg px-3 py-2 mb-1.5">
                        <span className="text-xs font-bold text-purple-500">{i + 1}.</span>
                        <span className="text-purple-800">{fu.condition} — {fu.items}</span>
                      </div>
                    ))}
                  </div>
                )}
                {pv.warnings.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-red-600 mb-1.5 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />观察提醒
                    </h4>
                    {pv.warnings.map((s, i) => (
                      <div key={i} className="text-sm text-gray-600 flex items-start gap-2 mb-1">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        {/* 底部操作 */}
        <div className="mt-6 space-y-3">
          <button
            onClick={handleReuse}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white font-medium py-3 rounded-xl hover:bg-orange-600 active:scale-[0.98] transition-all shadow-md shadow-orange-200"
          >
            <CopyPlus className="w-4 h-4" />
            基于此就诊新建
          </button>
          {deleteConfirm ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="text-sm text-red-700 mb-3">确定要删除此记录吗？此操作不可恢复。</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="flex-1 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  确认删除
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 bg-white border border-red-200 text-red-500 font-medium py-3 rounded-xl hover:bg-red-50 active:scale-[0.98] transition-all"
            >
              <Trash2 className="w-4 h-4" />
              删除此记录
            </button>
          )}
          <button
            onClick={() => navigate('/history')}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">本资料由「陪诊锦囊 MedPrep」生成，仅供参考</p>
        </div>
      </div>
    </div>
  )
}