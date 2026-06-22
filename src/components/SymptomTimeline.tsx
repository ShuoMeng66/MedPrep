import { useState, useCallback } from 'react'
import { Clock, Copy, Sparkles, AlertCircle, Check, Loader2, Lightbulb, ChevronDown, ChevronUp, MessageSquare, Mic } from 'lucide-react'
import {
  parseTimeline,
  formatTimelineForCopy,
  type TimelineEntry,
} from '@/utils/timelineParser'
import { writeVisitData } from '@/utils/visitStore'
import { callLLM, LLMError, type LLMSymptomResult } from '@/services/llmService'

const DEPARTMENTS = ['内科', '骨科', '皮肤科', '妇科', '儿科', '其他']

const EXAMPLE_SYMPTOMS = '上周一开始头疼，太阳穴位置胀痛。周三加重，伴有恶心呕吐，吃不下饭。今天有所缓解但仍头晕，浑身乏力。'

const SEVERITY_COLORS: Record<string, string> = {
  '轻': 'bg-green-100 text-green-700',
  '中': 'bg-amber-100 text-amber-700',
  '重': 'bg-red-100 text-red-700',
}

export default function SymptomTimeline() {
  const [text, setText] = useState('')
  const [department, setDepartment] = useState('')
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [copiedClinical, setCopiedClinical] = useState(false)
  const [copiedThirty, setCopiedThirty] = useState(false)
  const [showOriginal, setShowOriginal] = useState(false)

  // AI 结果
  const [clinicalSummary, setClinicalSummary] = useState<string[] | null>(null)
  const [thirtySecondVersion, setThirtySecondVersion] = useState<string | null>(null)

  const copyToClipboard = useCallback(async (content: string, setState: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(content)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = content
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setState(true)
    setTimeout(() => setState(false), 2000)
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!text.trim()) {
      setError('请输入症状描述')
      return
    }

    setError(null)
    setAiError(null)
    setLoading(true)
    setClinicalSummary(null)
    setThirtySecondVersion(null)

    // 本地解析
    await new Promise((r) => setTimeout(r, 400))

    try {
      const result = parseTimeline(text)
      if (result.length === 0) {
        setError('未能解析出时间线信息，请尝试用更详细的时间描述（如"上周一"、"3天前"等）')
        setEntries([])
        setLoading(false)
        return
      }
      setEntries(result)
      writeVisitData({ timeline: { text, entries: result } })
      setLoading(false)

      // AI 增强
      setAiLoading(true)
      try {
        const aiResult = await callLLM<LLMSymptomResult>({
          userInput: text,
          department: department || undefined,
          mode: 'symptom',
        })
        setClinicalSummary(aiResult.clinicalSummary)
        setThirtySecondVersion(aiResult.thirtySecondVersion)
        writeVisitData({
          timeline: {
            text,
            entries: result,
            clinicalSummary: aiResult.clinicalSummary,
            thirtySecondVersion: aiResult.thirtySecondVersion,
          },
        })
      } catch (err) {
        if (err instanceof LLMError) {
          setAiError(err.message)
        } else {
          setAiError('AI 增强失败，您仍可查看下方时间线')
        }
      } finally {
        setAiLoading(false)
      }
    } catch {
      setError('解析失败，请检查输入内容')
      setEntries([])
      setLoading(false)
    }
  }, [text, department])

  const handleCopyAll = useCallback(async () => {
    const formatted = formatTimelineForCopy(entries)
    copyToClipboard(formatted, setCopied)
  }, [entries, copyToClipboard])

  const handleCopyClinical = useCallback(() => {
    if (!clinicalSummary) return
    const text = '【整理后表述】\n' + clinicalSummary.map((s, i) => `${i + 1}. ${s}`).join('\n')
    copyToClipboard(text, setCopiedClinical)
  }, [clinicalSummary, copyToClipboard])

  const handleCopyThirty = useCallback(() => {
    if (!thirtySecondVersion) return
    copyToClipboard(thirtySecondVersion, setCopiedThirty)
  }, [thirtySecondVersion, copyToClipboard])

  // 空状态
  if (entries.length === 0 && !loading) {
    return (
      <div className="">
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
          <label className="block text-base font-semibold text-gray-700 mb-2">
            描述您的症状变化
          </label>
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); setError(null) }}
              placeholder="例如：上周一开始头疼，周三加重，伴有恶心呕吐，今天有所缓解但仍头晕…"
              rows={5}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 resize-none transition-shadow"
            />
            <button
              onClick={() => { setText(EXAMPLE_SYMPTOMS); setError(null) }}
              className="absolute top-2 right-2 flex items-center gap-1.5 text-xs text-orange-500 bg-orange-50 hover:bg-orange-100 rounded-lg px-2.5 py-1.5 transition-colors"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              使用示例
            </button>
          </div>
          <label className="block text-base font-semibold text-gray-700 mt-4 mb-2">
            就诊科室（选填）
          </label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10"
          >
            <option value="">请选择科室</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {error && (
            <div className="mt-3 flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-4 py-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <button
            onClick={handleGenerate}
            disabled={!text.trim()}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-orange-500 text-white text-lg font-medium py-3.5 rounded-2xl shadow-md shadow-orange-200 hover:bg-orange-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
          >
            <Sparkles className="w-5 h-5" />
            生成时间线
          </button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-8 text-center mt-4">
          <div className="bg-orange-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5">
            <Clock className="w-10 h-10 text-orange-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">症状时间线</h3>
          <p className="text-gray-500 text-base leading-relaxed">
            输入您的症状描述，系统将自动生成结构化的时间线，方便医生快速了解病情发展
          </p>
        </div>
      </div>
    )
  }

  // 加载状态
  if (loading) {
    return (
      <div className="">
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-12 text-center">
          <Loader2 className="w-10 h-10 text-orange-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-base">正在分析症状描述，生成时间线…</p>
        </div>
      </div>
    )
  }

  // 展示
  return (
    <div className="">
      {/* 头部 */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-800">症状时间线</h2>
        <button
          onClick={() => { setEntries([]); setClinicalSummary(null); setThirtySecondVersion(null); setError(null); setAiError(null) }}
          className="text-sm text-orange-600 hover:text-orange-700 underline underline-offset-2"
        >
          重新生成
        </button>
      </div>

      {/* AI 整理后表述 */}
      {(clinicalSummary || aiLoading) && (
        <div className="bg-white rounded-2xl shadow-sm border border-blue-200 border-l-4 border-l-blue-400 mb-4 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-blue-50/50">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-gray-800">整理后表述</h3>
            </div>
            {clinicalSummary && (
              <button
                onClick={handleCopyClinical}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
              >
                {copiedClinical ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedClinical ? '已复制' : '复制给医生'}
              </button>
            )}
          </div>
          <div className="p-4">
            {aiLoading ? (
              <div className="flex items-center gap-3 text-gray-500 py-4">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                <span className="text-sm">AI 正在整理表述…</span>
              </div>
            ) : clinicalSummary ? (
              <ul className="space-y-2">
                {clinicalSummary.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 leading-relaxed">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      )}

      {/* AI 30秒朗读版 */}
      {(thirtySecondVersion || aiLoading) && (
        <div className="bg-white rounded-2xl shadow-sm border border-green-200 border-l-4 border-l-green-400 mb-4 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-green-50/50">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-green-500" />
              <h3 className="text-sm font-semibold text-gray-800">给医生听的 30 秒版</h3>
            </div>
            {thirtySecondVersion && (
              <button
                onClick={handleCopyThirty}
                className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 transition-colors"
              >
                {copiedThirty ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedThirty ? '已复制' : '复制朗读版'}
              </button>
            )}
          </div>
          <div className="p-4">
            {aiLoading ? (
              <div className="flex items-center gap-3 text-gray-500 py-2">
                <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
                <span className="text-sm">正在生成朗读版…</span>
              </div>
            ) : thirtySecondVersion ? (
              <p className="text-sm text-gray-700 leading-relaxed italic">
                "{thirtySecondVersion}"
              </p>
            ) : null}
          </div>
        </div>
      )}

      {/* AI 错误提示 */}
      {aiError && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-800">{aiError}</p>
            <p className="text-xs text-amber-600 mt-0.5">您仍可查看下方规则生成的时间线</p>
          </div>
        </div>
      )}

      {/* AI 免责声明 */}
      {(clinicalSummary || thirtySecondVersion) && (
        <div className="mb-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-600">AI 整理基于您的输入，仅供就诊参考，不构成医疗建议</p>
        </div>
      )}

      {/* 可折叠：我的原话 */}
      <div className="mb-4">
        <button
          onClick={() => setShowOriginal(!showOriginal)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          {showOriginal ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          我的原话
        </button>
        {showOriginal && (
          <div className="mt-2 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-600 leading-relaxed border border-gray-100">
            {text}
          </div>
        )}
      </div>

      {/* 时间线卡片 */}
      <div className="relative">
        <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-orange-200 rounded-full" />
        {entries.map((entry, i) => (
          <div key={entry.id} className="relative flex gap-4 pb-5 last:pb-0">
            <div className="relative z-10 flex-shrink-0 mt-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                i === 0 ? 'bg-orange-500 text-white shadow-orange-200' : 'bg-white border-2 border-orange-300 text-orange-600'
              }`}>
                {i + 1}
              </div>
            </div>
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-orange-100 p-4 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-base font-semibold text-gray-800">{entry.dateLabel}</span>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${SEVERITY_COLORS[entry.severity]}`}>
                  {entry.severity === '轻' ? '轻度' : entry.severity === '中' ? '中度' : '重度'}
                </span>
              </div>
              <p className="text-base text-gray-700 leading-relaxed">{entry.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 复制按钮 */}
      {entries.length > 0 && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleCopyAll}
            className="flex-1 flex items-center justify-center gap-2 bg-white border border-orange-200 text-orange-600 text-base font-medium py-3 rounded-2xl hover:bg-orange-50 active:scale-[0.98] transition-all min-h-[48px]"
          >
            {copied ? <><Check className="w-5 h-5" />已复制</> : <><Copy className="w-5 h-5" />复制全部</>}
          </button>
        </div>
      )}
    </div>
  )
}