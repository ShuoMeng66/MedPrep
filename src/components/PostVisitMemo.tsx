import { useState, useCallback } from 'react'
import {
  NotebookPen,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
  Loader2,
  Lightbulb,
  Stethoscope,
  Pill,
  CalendarClock,
  Eye,
  Users,
  Brain,
} from 'lucide-react'
import {
  parsePostVisit,
  formatPostVisitForCopy,
  formatPostVisitPlain,
  type PostVisitData,
} from '@/utils/postVisitParser'
import { writeVisitData } from '@/utils/visitStore'
import { callLLM, LLMError, type LLMPostVisitResult } from '@/services/llmService'

const EXAMPLE_TEXT = `医生诊断为急性上呼吸道感染，建议多休息、多喝水。
开具阿莫西林胶囊，每次0.5g，每日3次，饭后服用，注意有无过敏反应。
布洛芬缓释胶囊，每次0.3g，必要时服用，退烧用，体温超过38.5℃时吃。
1周后复查血常规，如果症状没有好转需要拍胸片。
注意观察体温变化，如果发烧超过3天不退或出现呼吸困难，请立即就医。`

export default function PostVisitMemo() {
  const [text, setText] = useState('')
  const [result, setResult] = useState<PostVisitData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)
  const [copiedPlain, setCopiedPlain] = useState(false)
  const [copiedCard, setCopiedCard] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiEnhanced, setAiEnhanced] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

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
      setError('请输入诊后信息')
      return
    }
    setError(null)
    setAiError(null)
    setLoading(true)
    setAiLoading(false)
    setAiEnhanced(false)
    setResult(null)

    await new Promise((r) => setTimeout(r, 400))

    const data = parsePostVisit(text)

    setResult(data)
    setLoading(false)

    // 保存本地解析结果
    writeVisitData({
      postVisit: { text, data, timestamp: Date.now() },
    })

    // AI 增强
    setAiLoading(true)
    try {
      const aiResult = await callLLM<LLMPostVisitResult>({
        userInput: text,
        mode: 'postVisit',
      })
      // 合并 AI 结果到本地解析
      const enhancedData: PostVisitData = {
        doctorSummary: aiResult.doctorSummary.length > 0 ? aiResult.doctorSummary : data.doctorSummary,
        medications: aiResult.medications.length > 0 ? aiResult.medications : data.medications,
        followUps: aiResult.followUps.length > 0 ? aiResult.followUps : data.followUps,
        warnings: aiResult.warnings.length > 0 ? aiResult.warnings : data.warnings,
      }
      setResult(enhancedData)
      setAiEnhanced(true)
      writeVisitData({
        postVisit: { text, data: enhancedData, timestamp: Date.now(), aiEnhanced: true },
      })
    } catch (err) {
      if (err instanceof LLMError) {
        setAiError(err.message)
      } else {
        setAiError('AI 增强失败，已展示规则解析结果')
      }
    } finally {
      setAiLoading(false)
    }
  }, [text])

  const handleCopyAll = useCallback(() => {
    if (!result) return
    copyToClipboard(formatPostVisitForCopy(result), setCopiedAll)
  }, [result, copyToClipboard])

  const handleCopyPlain = useCallback(() => {
    if (!result) return
    copyToClipboard(formatPostVisitPlain(result), setCopiedPlain)
  }, [result, copyToClipboard])

  const handleCopyCard = useCallback(
    (cardKey: string, content: string) => {
      copyToClipboard(content, (v) => {
        if (v) setCopiedCard(cardKey)
        else setCopiedCard(null)
      })
    },
    [copyToClipboard],
  )

  // 空状态：初始界面
  if (!result && !loading) {
    return (
      <div className="">
        {/* 输入区域 */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
          <label className="block text-base font-semibold text-gray-700 mb-2">
            记录诊后信息
          </label>
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setError(null)
              }}
              placeholder="请记录医生的诊断结论、用药指导、复查安排和注意事项…"
              rows={6}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 resize-none transition-shadow"
            />
            <button
              onClick={() => {
                setText(EXAMPLE_TEXT)
                setError(null)
              }}
              className="absolute top-2 right-2 flex items-center gap-1.5 text-xs text-orange-500 bg-orange-50 hover:bg-orange-100 rounded-lg px-2.5 py-1.5 transition-colors"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              使用示例
            </button>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mt-3 flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-4 py-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 生成按钮 */}
          <button
            onClick={handleGenerate}
            disabled={!text.trim()}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-orange-500 text-white text-lg font-medium py-3.5 rounded-2xl shadow-md shadow-orange-200 hover:bg-orange-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
          >
            <Sparkles className="w-5 h-5" />
            生成就诊纪要
          </button>
        </div>

        {/* 空状态引导 */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-8 text-center mt-4">
          <div className="bg-orange-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5">
            <NotebookPen className="w-10 h-10 text-orange-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">诊后备忘</h3>
          <p className="text-gray-500 text-base leading-relaxed">
            记录医生的诊断、用药指导和复查安排，生成结构化的就诊纪要，方便家人查看和后续随访
          </p>
        </div>

        {/* 免责声明 */}
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 leading-relaxed">
            本工具仅帮助整理诊后信息，不构成医疗建议。请以医生的书面医嘱为准，如有疑问及时咨询医生。
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
          <p className="text-gray-500 text-base mb-1">正在整理诊后信息…</p>
          <p className="text-gray-400 text-sm">请稍候</p>
        </div>
      </div>
    )
  }

  // 结果展示
  return (
    <div className="">
      {/* 头部 */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-800">诊后备忘</h2>
        <button
          onClick={() => {
            setResult(null)
            setError(null)
          }}
          className="text-sm text-orange-600 hover:text-orange-700 underline underline-offset-2"
        >
          重新生成
        </button>
      </div>

      {/* AI 增强状态 */}
      {aiLoading && (
        <div className="mb-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3">
          <Loader2 className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
          <span className="text-sm text-blue-600">AI 正在优化整理结果…</span>
        </div>
      )}
      {aiEnhanced && (
        <div className="mb-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-2">
          <Brain className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span className="text-xs text-blue-600">AI 已优化整理，基于您的输入，不构成医疗建议</span>
        </div>
      )}
      {aiError && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-amber-700">{aiError}</span>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleCopyAll}
          className="flex-1 flex items-center justify-center gap-2 bg-white border border-orange-200 text-orange-600 text-sm sm:text-base font-medium py-2.5 sm:py-3 rounded-2xl hover:bg-orange-50 active:scale-[0.98] transition-all min-h-[48px]"
        >
          {copiedAll ? (
            <>
              <Check className="w-4 h-4" />
              已复制
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              复制全部纪要
            </>
          )}
        </button>
        <button
          onClick={handleCopyPlain}
          className="flex-1 flex items-center justify-center gap-2 bg-white border border-green-200 text-green-600 text-sm sm:text-base font-medium py-2.5 sm:py-3 rounded-2xl hover:bg-green-50 active:scale-[0.98] transition-all min-h-[48px]"
        >
          {copiedPlain ? (
            <>
              <Check className="w-4 h-4" />
              已复制
            </>
          ) : (
            <>
              <Users className="w-4 h-4" />
              生成通俗版
            </>
          )}
        </button>
      </div>

      {/* 卡片 1：医生告知摘要 */}
      {result.doctorSummary.length > 0 && (
        <CardWrapper
          icon={<Stethoscope className="w-5 h-5" />}
          title="医生告知摘要"
          color="blue"
          copied={copiedCard === 'doctor'}
          onCopy={() => {
            const content = '【医生告知摘要】\n' + result.doctorSummary.map((s) => `· ${s}`).join('\n')
            handleCopyCard('doctor', content)
          }}
        >
          <ul className="space-y-2">
            {result.doctorSummary.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 leading-relaxed">
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400 mt-2" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CardWrapper>
      )}

      {/* 卡片 2：用药清单 */}
      {result.medications.length > 0 && (
        <CardWrapper
          icon={<Pill className="w-5 h-5" />}
          title="用药清单"
          color="green"
          copied={copiedCard === 'med'}
          onCopy={() => {
            const content =
              '【用药清单】\n' +
              result.medications
                .map((m, i) => `${i + 1}. ${m.name}\n   用法用量：${m.dosage}\n   注意事项：${m.notes}`)
                .join('\n')
            handleCopyCard('med', content)
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2.5 pr-3 font-medium text-gray-500 whitespace-nowrap">药品</th>
                  <th className="text-left py-2.5 pr-3 font-medium text-gray-500 whitespace-nowrap">用法用量</th>
                  <th className="text-left py-2.5 font-medium text-gray-500 whitespace-nowrap">注意事项</th>
                </tr>
              </thead>
              <tbody>
                {result.medications.map((med, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 pr-3 text-gray-800 font-medium">{med.name}</td>
                    <td className="py-3 pr-3 text-gray-600">{med.dosage}</td>
                    <td className="py-3 text-gray-600">{med.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardWrapper>
      )}

      {/* 卡片 3：复查随访 */}
      {result.followUps.length > 0 && (
        <CardWrapper
          icon={<CalendarClock className="w-5 h-5" />}
          title="复查随访"
          color="purple"
          copied={copiedCard === 'followup'}
          onCopy={() => {
            const content =
              '【复查随访】\n' +
              result.followUps.map((f, i) => `${i + 1}. ${f.condition} — ${f.items}`).join('\n')
            handleCopyCard('followup', content)
          }}
        >
          <div className="space-y-3">
            {result.followUps.map((fu, i) => (
              <div key={i} className="flex items-start gap-3 bg-purple-50 rounded-xl px-4 py-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <span className="text-sm font-medium text-purple-800">{fu.condition}</span>
                  <span className="text-sm text-purple-600 ml-2">{fu.items}</span>
                </div>
              </div>
            ))}
          </div>
        </CardWrapper>
      )}

      {/* 卡片 4：观察提醒 */}
      {result.warnings.length > 0 && (
        <CardWrapper
          icon={<Eye className="w-5 h-5" />}
          title="观察提醒"
          color="red"
          copied={copiedCard === 'warn'}
          onCopy={() => {
            const content = '【观察提醒】\n' + result.warnings.map((s) => `· ${s}`).join('\n')
            handleCopyCard('warn', content)
          }}
        >
          <ul className="space-y-2">
            {result.warnings.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 leading-relaxed">
                <span className="flex-shrink-0 mt-1.5 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
            出现以上情况请及时就医，切勿拖延
          </p>
        </CardWrapper>
      )}

      {/* 免责声明 */}
      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-2.5">
        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 leading-relaxed">
          本工具仅帮助整理诊后信息，不构成医疗建议。请以医生的书面医嘱为准，如有疑问及时咨询医生。
        </p>
      </div>
    </div>
  )
}

/** 卡片容器 */
function CardWrapper({
  icon,
  title,
  color,
  copied,
  onCopy,
  children,
}: {
  icon: React.ReactNode
  title: string
  color: 'blue' | 'green' | 'purple' | 'red'
  copied: boolean
  onCopy: () => void
  children: React.ReactNode
}) {
  const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', hover: 'hover:bg-blue-100' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', hover: 'hover:bg-green-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', hover: 'hover:bg-purple-100' },
    red: { bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-200', hover: 'hover:bg-red-100' },
  }

  const c = colorMap[color]

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden mb-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className={`${c.bg} rounded-lg p-1.5`}>
            <span className={c.text}>{icon}</span>
          </div>
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        </div>
        <button
          onClick={onCopy}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border ${c.border} ${c.text} ${c.hover} transition-colors`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              已复制
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              复制
            </>
          )}
        </button>
      </div>

      {/* 内容区 */}
      <div className="p-4">{children}</div>
    </div>
  )
}