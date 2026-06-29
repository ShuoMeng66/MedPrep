import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderOpen,
  Copy,
  Check,
  Printer,
  Save,
  Clock,
  ClipboardList,
  FileText,
  NotebookPen,
  AlertCircle,
  ExternalLink,
  Stethoscope,
  Pill,
  CalendarClock,
  Eye,
  GitCompare,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Share2,
  QrCode,
  ShieldAlert,
  X,
  MoreHorizontal,
  Loader2,
} from 'lucide-react'
import { readVisitData, saveToHistory, type VisitData } from '@/utils/visitStore'
import { saveVisit, validateVisitData } from '@/services/visitService'
import { useAuth } from '@/contexts/AuthContext'
import { useTabStore } from '@/store/useTabStore'
import type { TimelineEntry } from '@/utils/timelineParser'
import type { QuestionItem, QuestionCategory } from '@/utils/questionGenerator'
import type { ReportInterpretation } from '@/utils/reportInterpreter'
import type { PostVisitData } from '@/utils/postVisitParser'
import {
  getLastHistory,
  compareVisits,
  formatComparisonForText,
  formatComparisonForHtml,
  type VisitComparison,
  type SymptomTrend,
} from '@/utils/compareVisits'
import { encodeShareData, encodeShareDataShort, copyToClipboard } from '@/utils/shareUtils'
import QRCodeImage from '@/components/QRCodeImage'

const SEVERITY_LABELS: Record<string, string> = { '轻': '轻度', '中': '中度', '重': '重度' }

const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  '病因排查': '病因排查',
  '检查建议': '检查建议',
  '用药注意': '用药注意',
  '复诊安排': '复诊安排',
}

export default function VisitPack() {
  const { user } = useAuth()
  const setActiveTab = useTabStore((s) => s.setActiveTab)
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [shareLoading, setShareLoading] = useState(false)

  // Accordion: 默认展开第一个有数据的 section
  const data = useMemo(() => readVisitData(), [])
  const hasAnyData = data.timeline || data.checklist || data.report || data.postVisit

  // 确定哪些 section 有数据，用于默认展开第一个
  const sectionKeys = useMemo(() => {
    const keys: string[] = []
    if (data.timeline) keys.push('timeline')
    if (data.checklist) keys.push('checklist')
    if (data.report) keys.push('report')
    if (data.postVisit) keys.push('postVisit')
    return keys
  }, [data])

  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    // 默认展开第一个有数据的 section
    if (sectionKeys.length > 0) return new Set([sectionKeys[0]])
    return new Set()
  })

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // 复诊对比
  const [comparisonExpanded, setComparisonExpanded] = useState(false)
  const comparison = useMemo(() => {
    const lastHistory = getLastHistory()
    if (!lastHistory) return null
    return compareVisits(lastHistory.data, data, lastHistory.label)
  }, [data])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  const generateTime = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    const h = String(now.getHours()).padStart(2, '0')
    const min = String(now.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${d} ${h}:${min}`
  }, [])

  // 生成纯文本全文
  const formatFullText = useCallback((data: VisitData): string => {
    const lines: string[] = []
    lines.push('陪诊锦囊 · 本次就诊资料')
    lines.push(`生成时间：${generateTime}`)
    lines.push('═'.repeat(30))
    lines.push('')

    if (data.timeline) {
      lines.push('【症状时间线】')
      data.timeline.entries.forEach((e: TimelineEntry, i: number) => {
        lines.push(`  ${i + 1}. ${e.dateLabel}（${SEVERITY_LABELS[e.severity]}）`)
        lines.push(`     ${e.description}`)
      })
      lines.push('')
    }

    if (data.checklist) {
      lines.push('【问诊清单】')
      const checked = new Set(data.checklist.checkedIds)
      const checkedItems = data.checklist.questions.filter((q: QuestionItem) => checked.has(q.id))
      const uncheckedItems = data.checklist.questions.filter((q: QuestionItem) => !checked.has(q.id))

      if (checkedItems.length > 0) {
        lines.push('  已问过：')
        checkedItems.forEach((q: QuestionItem) => {
          lines.push(`    ☑ ${q.question}`)
        })
      }
      if (uncheckedItems.length > 0) {
        lines.push('  待问：')
        uncheckedItems.forEach((q: QuestionItem) => {
          lines.push(`    ☐ ${q.question}`)
        })
      }
      lines.push('')
    }

    if (data.report) {
      lines.push(`【报告解读 · ${data.report.result.reportType}】`)
      data.report.result.indicators.forEach((ind) => {
        const tag = ind.abnormal ? '⚠' : '✓'
        lines.push(`  ${tag} ${ind.name}：${ind.explanation}`)
      })
      if (data.report.result.followUpQuestions.length > 0) {
        lines.push('  复诊追问：')
        data.report.result.followUpQuestions.forEach((q: string, i: number) => {
          lines.push(`    ${i + 1}. ${q}`)
        })
      }
      lines.push('')
    }

    if (data.postVisit) {
      lines.push('【诊后备忘】')
      const pv = data.postVisit.data
      if (pv.doctorSummary.length > 0) {
        lines.push('  医生告知：')
        pv.doctorSummary.forEach((s: string) => lines.push(`    · ${s}`))
      }
      if (pv.medications.length > 0) {
        lines.push('  用药清单：')
        pv.medications.forEach((m, i) => {
          lines.push(`    ${i + 1}. ${m.name} — ${m.dosage}（${m.notes}）`)
        })
      }
      if (pv.followUps.length > 0) {
        lines.push('  复查随访：')
        pv.followUps.forEach((f) => lines.push(`    · ${f.condition} — ${f.items}`))
      }
      if (pv.warnings.length > 0) {
        lines.push('  观察提醒：')
        pv.warnings.forEach((s: string) => lines.push(`    · ${s}`))
      }
      lines.push('')
    }

    if (comparison) {
      lines.push(formatComparisonForText(comparison))
    }

    lines.push('═'.repeat(30))
    lines.push('本资料由「陪诊锦囊 MedPrep」生成，仅供参考')
    return lines.join('\n')
  }, [generateTime, comparison])

  // 复制全文
  const handleCopyAll = useCallback(async () => {
    const text = formatFullText(data)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    showToast('已复制全文，可粘贴到微信发送给家人')
  }, [data, formatFullText, showToast])

  // 打印视图 - 跳转到独立路由
  const handlePrintView = useCallback(() => {
    navigate('/print')
  }, [navigate])

  // 保存本次就诊
  const handleSave = useCallback(async () => {
    const validation = validateVisitData(data)
    if (!validation.valid) {
      showToast(validation.reason || '请先填写就诊信息')
      setActiveTab('timeline')
      return
    }

    saveToHistory()

    if (user) {
      const result = await saveVisit(user.id, data)
      if (result.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        showToast('已保存到云端')
        return
      } else {
        showToast('已保存到本地（云端同步失败：' + (result.error || '') + '）')
      }
    } else {
      showToast('已保存到本地')
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [data, showToast, setActiveTab, user])

  // 生成分享链接（优先短链接）
  const handleGenerateShare = useCallback(async () => {
    if (!hasAnyData) {
      showToast('暂无数据可分享')
      return
    }
    setShareLoading(true)
    const result = await encodeShareDataShort(data)
    setShareLoading(false)
    setShareUrl(result.url)
    setShowShareDialog(true)
    if (!result.isShort) {
      showToast('云端存储不可用，已生成长链接')
    }
  }, [hasAnyData, data, showToast])

  // 复制分享链接
  const handleCopyLink = useCallback(async () => {
    const ok = await copyToClipboard(shareUrl)
    if (ok) {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
      showToast('分享链接已复制')
    }
  }, [shareUrl, showToast])

  return (
    <div className="relative pb-40">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-5 py-3 rounded-2xl shadow-lg animate-[fadeIn_0.2s_ease-out]">
          {toast}
        </div>
      )}

      {/* 页面标题 */}
      <div className="text-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">陪诊锦囊 · 本次就诊资料</h1>
        <p className="text-sm text-gray-400 mt-1">生成时间：{generateTime}</p>
      </div>

      {/* 无数据提示 */}
      {!hasAnyData && (
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-10 text-center">
          <div className="bg-orange-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5">
            <FolderOpen className="w-10 h-10 text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">暂无就诊资料</h3>
          <p className="text-gray-500 text-sm mb-6">
            使用下方功能模块填写就诊信息后，将自动汇总到此页面
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={() => setActiveTab('timeline')} className="text-sm text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-xl px-4 py-2 transition-colors">
              去填写症状时间线
            </button>
            <button onClick={() => setActiveTab('checklist')} className="text-sm text-green-600 bg-green-50 hover:bg-green-100 rounded-xl px-4 py-2 transition-colors">
              去填写问诊清单
            </button>
            <button onClick={() => setActiveTab('report')} className="text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl px-4 py-2 transition-colors">
              去填写报告解读
            </button>
            <button onClick={() => setActiveTab('postvisit')} className="text-sm text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl px-4 py-2 transition-colors">
              去填写诊后备忘
            </button>
          </div>
        </div>
      )}

      {/* 症状时间线 */}
      <AccordionSection
        icon={<Clock className="w-5 h-5 text-orange-500" />}
        title="症状时间线"
        color="orange"
        hasData={!!data.timeline}
        isExpanded={expandedSections.has('timeline')}
        onToggle={() => toggleSection('timeline')}
        onJump={() => setActiveTab('timeline')}
      >
        {data.timeline && (
          <>
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
          </>
        )}
      </AccordionSection>

      {/* 问诊清单 */}
      <AccordionSection
        icon={<ClipboardList className="w-5 h-5 text-green-500" />}
        title="问诊清单"
        color="green"
        hasData={!!data.checklist}
        isExpanded={expandedSections.has('checklist')}
        onToggle={() => toggleSection('checklist')}
        onJump={() => setActiveTab('checklist')}
      >
        {data.checklist && (() => {
          const checked = new Set(data.checklist.checkedIds)
          const checkedItems = data.checklist.questions.filter((q) => checked.has(q.id))
          const uncheckedItems = data.checklist.questions.filter((q) => !checked.has(q.id))
          return (
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
          )
        })()}
      </AccordionSection>

      {/* 报告解读 */}
      <AccordionSection
        icon={<FileText className="w-5 h-5 text-blue-500" />}
        title="报告解读"
        color="blue"
        hasData={!!data.report}
        isExpanded={expandedSections.has('report')}
        onToggle={() => toggleSection('report')}
        onJump={() => setActiveTab('report')}
      >
        {data.report && (
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
            {data.report.aiEnhanced?.plainExplanation && (
              <div className="mt-3 bg-blue-50 rounded-xl px-4 py-3">
                <p className="text-xs font-medium text-blue-600 mb-1.5">AI 白话解读</p>
                <p className="text-sm text-gray-700 leading-relaxed">{data.report.aiEnhanced.plainExplanation}</p>
                {data.report.aiEnhanced.keyPoints && data.report.aiEnhanced.keyPoints.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {data.report.aiEnhanced.keyPoints.map((kp, i) => (
                      <div key={i} className="text-xs text-blue-700 flex items-start gap-1.5">
                        <span className="font-bold">{i + 1}.</span>
                        <span>{kp}</span>
                      </div>
                    ))}
                  </div>
                )}
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
          </div>
        )}
      </AccordionSection>

      {/* 诊后备忘 */}
      <AccordionSection
        icon={<NotebookPen className="w-5 h-5 text-purple-500" />}
        title="诊后备忘"
        color="purple"
        hasData={!!data.postVisit}
        isExpanded={expandedSections.has('postVisit')}
        onToggle={() => toggleSection('postVisit')}
        onJump={() => setActiveTab('postvisit')}
      >
        {data.postVisit && (() => {
          const pv = data.postVisit.data
          return (
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
          )
        })()}
      </AccordionSection>

      {/* 复诊对比 */}
      {comparison ? (
        <ComparisonSection
          comparison={comparison}
          expanded={comparisonExpanded}
          onToggle={() => setComparisonExpanded(!comparisonExpanded)}
        />
      ) : hasAnyData ? (
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 border-l-4 border-l-teal-400 mb-4 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <GitCompare className="w-5 h-5 text-teal-500" />
              <h3 className="text-base font-semibold text-gray-800">复诊对比</h3>
            </div>
          </div>
          <div className="p-4 text-center">
            <p className="text-sm text-gray-400">保存本次就诊后，下次可自动对比</p>
            <button
              onClick={handleSave}
              className="mt-2 text-sm text-orange-500 hover:text-orange-600 underline underline-offset-2"
            >
              保存本次就诊
            </button>
          </div>
        </div>
      ) : null}

      {/* 底部固定操作栏 */}
      {hasAnyData && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="app-container py-3 flex gap-2.5">
            <button
              onClick={handleCopyAll}
              className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-orange-200 text-orange-600 text-sm font-medium py-3 rounded-2xl hover:bg-orange-50 active:scale-[0.98] transition-all min-h-[48px]"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? '已复制' : '复制全文'}
            </button>
            <button
              onClick={handlePrintView}
              className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-blue-200 text-blue-600 text-sm font-medium py-3 rounded-2xl hover:bg-blue-50 active:scale-[0.98] transition-all min-h-[48px]"
            >
              <Printer className="w-4 h-4" />
              打印
            </button>
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-1.5 bg-orange-500 text-white text-sm font-medium py-3 rounded-2xl shadow-md shadow-orange-200 hover:bg-orange-600 active:scale-[0.98] transition-all min-h-[48px]"
            >
              {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? '已保存' : '保存'}
            </button>
            {/* 更多菜单 */}
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="flex items-center justify-center w-12 h-12 bg-white border border-gray-200 text-gray-500 rounded-2xl hover:bg-gray-50 active:scale-[0.98] transition-all"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {showMoreMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                  <div className="absolute bottom-full right-0 mb-2 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 min-w-[160px]">
                    <button
                      onClick={() => {
                        setShowMoreMenu(false)
                        handleGenerateShare()
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    >
                      <Share2 className="w-4 h-4 text-green-500" />
                      生成分享链接
                    </button>
                    <button
                      onClick={() => {
                        setShowMoreMenu(false)
                        handleGenerateShare().then(() => setShowQr(true))
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    >
                      <QrCode className="w-4 h-4 text-purple-500" />
                      生成二维码
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          {/* safe area for iPhone */}
          <div className="h-safe-b" />
        </div>
      )}

      {/* 底部声明 */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-400">本资料由「陪诊锦囊 MedPrep」生成，仅供参考</p>
        <p className="text-xs text-gray-400 mt-1">不构成医疗诊断或治疗建议</p>
      </div>

      {/* 分享弹窗 - Sheet 风格 */}
      {showShareDialog && (
        <SheetModal onClose={() => { setShowShareDialog(false); setShowQr(false) }}>
          <div className="bg-amber-500 -mx-5 -mt-5 px-5 py-4 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-2 text-white">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-semibold">安全提醒</h3>
            </div>
            <button
              onClick={() => { setShowShareDialog(false); setShowQr(false) }}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 mt-5">
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 leading-relaxed">
                链接内含就诊信息，任何人打开链接均可查看。请勿公开传播，仅分享给信任的家人。
              </p>
            </div>

            {shareLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
                <span className="ml-2 text-sm text-gray-500">正在生成分享链接...</span>
              </div>
            )}

            {!shareLoading && shareUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">分享链接</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 bg-gray-50 focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 bg-orange-500 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-orange-600 active:scale-[0.98] transition-all flex-shrink-0"
                  >
                    {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {linkCopied ? '已复制' : '复制'}
                  </button>
                </div>
              </div>
            )}

            {showQr && !shareLoading && shareUrl && (
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 mb-3">微信扫码查看</p>
                <QRCodeImage value={shareUrl} size={240} />
                <p className="text-xs text-gray-400 mt-2">长按二维码可保存图片，或用微信扫一扫打开</p>
              </div>
            )}

            <button
              onClick={() => { setShowShareDialog(false); setShowQr(false) }}
              className="w-full py-2.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              我知道了
            </button>
          </div>
        </SheetModal>
      )}
    </div>
  )
}

/** Accordion 分区卡片 */
function AccordionSection({
  icon,
  title,
  color,
  hasData,
  isExpanded,
  onToggle,
  onJump,
  children,
}: {
  icon: React.ReactNode
  title: string
  color: 'orange' | 'green' | 'blue' | 'purple'
  hasData: boolean
  isExpanded: boolean
  onToggle: () => void
  onJump: () => void
  children?: React.ReactNode
}) {
  const borderMap = {
    orange: 'border-l-orange-400',
    green: 'border-l-green-400',
    blue: 'border-l-blue-400',
    purple: 'border-l-purple-400',
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-orange-100 border-l-4 ${borderMap[color]} mb-4 overflow-hidden`}>
      <button
        onClick={hasData ? onToggle : undefined}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          {icon}
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {hasData ? (
            <>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">已填写</span>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            </>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onJump() }}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-orange-500 transition-colors"
            >
              尚未填写
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </button>
      {hasData && (
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="p-4 border-t border-gray-100">{children}</div>
        </div>
      )}
      {!hasData && isExpanded && (
        <div className="p-4 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-400">暂无数据</p>
          <button
            onClick={onJump}
            className="mt-2 text-sm text-orange-500 hover:text-orange-600 underline underline-offset-2"
          >
            前往填写
          </button>
        </div>
      )}
    </div>
  )
}

/** Sheet 风格底部弹窗 */
export function SheetModal({
  onClose,
  children,
}: {
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full max-h-[85vh] overflow-y-auto p-5 animate-[slideUp_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

/** 构建打印 HTML */
function buildPrintHtml(data: VisitData, comparison: VisitComparison | null): string {
  const parts: string[] = []

  if (data.timeline) {
    parts.push('<div class="section"><div class="section-title">症状时间线</div>')
    data.timeline.entries.forEach((e, i) => {
      const sev = { '轻': '轻度', '中': '中度', '重': '重度' }[e.severity]
      parts.push(`<div class="item"><strong>${i + 1}. ${e.dateLabel}</strong> <span class="tag">${sev}</span><br>${e.description}</div>`)
    })
    parts.push('</div>')
  }

  if (data.checklist) {
    const checked = new Set(data.checklist.checkedIds)
    const checkedItems = data.checklist.questions.filter((q) => checked.has(q.id))
    const uncheckedItems = data.checklist.questions.filter((q) => !checked.has(q.id))
    parts.push('<div class="section"><div class="section-title">问诊清单</div>')
    if (checkedItems.length > 0) {
      parts.push('<p style="color:#16a34a;font-weight:600;">已问过：</p>')
      checkedItems.forEach((q) => parts.push(`<div class="item">☑ ${q.question}</div>`))
    }
    if (uncheckedItems.length > 0) {
      parts.push('<p style="color:#6b7280;font-weight:600;">待问：</p>')
      uncheckedItems.forEach((q) => parts.push(`<div class="item">☐ ${q.question}</div>`))
    }
    parts.push('</div>')
  }

  if (data.report) {
    parts.push(`<div class="section"><div class="section-title">报告解读 · ${data.report.result.reportType}</div>`)
    data.report.result.indicators.forEach((ind) => {
      const tag = ind.abnormal ? '<span class="tag" style="background:#fef3c7;color:#92400e;">建议向医生确认</span>' : ''
      parts.push(`<div class="item"><strong>${ind.name}</strong> ${tag}<br>${ind.explanation}</div>`)
    })
    if (data.report.result.followUpQuestions.length > 0) {
      parts.push('<p style="font-weight:600;margin-top:8px;">复诊追问：</p>')
      data.report.result.followUpQuestions.forEach((q, i) => parts.push(`<div class="item">${i + 1}. ${q}</div>`))
    }
    parts.push('</div>')
  }

  if (data.postVisit) {
    const pv = data.postVisit.data
    parts.push('<div class="section"><div class="section-title">诊后备忘</div>')
    if (pv.doctorSummary.length > 0) {
      parts.push('<p style="font-weight:600;">医生告知：</p>')
      pv.doctorSummary.forEach((s) => parts.push(`<div class="item">· ${s}</div>`))
    }
    if (pv.medications.length > 0) {
      parts.push('<p style="font-weight:600;">用药清单：</p>')
      pv.medications.forEach((m, i) => parts.push(`<div class="item">${i + 1}. ${m.name} — ${m.dosage}（${m.notes}）</div>`))
    }
    if (pv.followUps.length > 0) {
      parts.push('<p style="font-weight:600;">复查随访：</p>')
      pv.followUps.forEach((f) => parts.push(`<div class="item">· ${f.condition} — ${f.items}</div>`))
    }
    if (pv.warnings.length > 0) {
      parts.push('<p style="font-weight:600;">观察提醒：</p>')
      pv.warnings.forEach((s) => parts.push(`<div class="item">· ${s}</div>`))
    }
    parts.push('</div>')
  }

  if (comparison) {
    parts.push(formatComparisonForHtml(comparison))
  }

  return parts.join('\n')
}

/** 复诊对比折叠卡片 */
function ComparisonSection({
  comparison,
  expanded,
  onToggle,
}: {
  comparison: VisitComparison
  expanded: boolean
  onToggle: () => void
}) {
  const trendConfig: Record<SymptomTrend, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
    improved: { icon: <TrendingDown className="w-4 h-4" />, label: '改善', color: 'text-green-600', bg: 'bg-green-50' },
    unchanged: { icon: <Minus className="w-4 h-4" />, label: '未变', color: 'text-gray-500', bg: 'bg-gray-50' },
    worsened: { icon: <TrendingUp className="w-4 h-4" />, label: '加重', color: 'text-red-500', bg: 'bg-red-50' },
    new: { icon: <Plus className="w-4 h-4" />, label: '新增', color: 'text-blue-600', bg: 'bg-blue-50' },
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-orange-100 border-l-4 border-l-teal-400 mb-4 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <GitCompare className="w-5 h-5 text-teal-500" />
          <h3 className="text-base font-semibold text-gray-800">复诊对比</h3>
          <span className="text-xs text-gray-400">对比 {comparison.prevLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">有数据</span>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">对比基于用户自行记录，不能替代医疗判断</p>
          </div>

          {comparison.symptomComparison.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">症状变化</h4>
              <div className="space-y-2">
                {comparison.symptomComparison.map((s, i) => {
                  const cfg = trendConfig[s.trend]
                  const prevLabel = s.prevSeverity
                    ? `上次：${s.prevSeverity === '轻' ? '轻度' : s.prevSeverity === '中' ? '中度' : '重度'}`
                    : ''
                  const currLabel = s.currSeverity
                    ? `本次：${s.currSeverity === '轻' ? '轻度' : s.currSeverity === '中' ? '中度' : '重度'}`
                    : ''
                  return (
                    <div key={i} className={`${cfg.bg} rounded-xl px-3 py-2.5`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
                          {cfg.icon}
                          {cfg.label}
                        </span>
                        {prevLabel && (
                          <span className="text-xs text-gray-400">{prevLabel}</span>
                        )}
                        {currLabel && (
                          <>
                            <span className="text-xs text-gray-300">→</span>
                            <span className="text-xs text-gray-600">{currLabel}</span>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{s.description}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {comparison.followUpStatus.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                随访完成度
                <span className="text-xs font-normal text-gray-400">（供参考）</span>
              </h4>
              <div className="space-y-2">
                {comparison.followUpStatus.map((f, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2 mb-0.5">
                      {f.completed === true ? (
                        <span className="text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded">已完成</span>
                      ) : f.completed === null ? (
                        <span className="text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">待确认</span>
                      ) : (
                        <span className="text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">—</span>
                      )}
                      <span className="text-sm font-medium text-gray-700">{f.item}</span>
                    </div>
                    <p className="text-xs text-gray-400">{f.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {comparison.suggestedQuestions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">本次建议重点问医生</h4>
              <div className="space-y-2">
                {comparison.suggestedQuestions.map((q, i) => (
                  <div key={i} className="flex items-start gap-2.5 bg-teal-50 rounded-xl px-3 py-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-500 text-white text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <p className="text-sm text-teal-900 leading-relaxed">{q}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}