import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  ClipboardList,
  Sparkles,
  AlertCircle,
  Check,
  Download,
  Loader2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from 'lucide-react'
import {
  generateQuestions,
  formatQuestionsForExport,
  type QuestionItem,
  type QuestionCategory,
} from '@/utils/questionGenerator'
import { writeVisitData } from '@/utils/visitStore'

const DEPARTMENTS = ['内科', '骨科', '皮肤科', '妇科', '儿科', '其他']

const EXAMPLE_SYMPTOMS = '头疼三天，太阳穴胀痛，伴有恶心，睡眠不好，早上起来头晕乏力'

const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  '病因排查': '病因排查',
  '检查建议': '检查建议',
  '用药注意': '用药注意',
  '复诊安排': '复诊安排',
}

const CATEGORY_COLORS: Record<QuestionCategory, string> = {
  '病因排查': 'bg-amber-100 text-amber-700',
  '检查建议': 'bg-blue-100 text-blue-700',
  '用药注意': 'bg-green-100 text-green-700',
  '复诊安排': 'bg-purple-100 text-purple-700',
}

const CATEGORY_ORDER: QuestionCategory[] = [
  '病因排查',
  '检查建议',
  '用药注意',
  '复诊安排',
]

export default function ConsultChecklist() {
  const [symptoms, setSymptoms] = useState('')
  const [department, setDepartment] = useState('')
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exported, setExported] = useState(false)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<QuestionCategory>>(
    new Set(),
  )

  const handleGenerate = useCallback(async () => {
    if (!symptoms.trim()) {
      setError('请输入症状描述')
      return
    }

    setError(null)
    setLoading(true)

    await new Promise((r) => setTimeout(r, 700))

    try {
      const result = generateQuestions(symptoms, department)
      if (result.length === 0) {
        setError('未能生成问题，请尝试提供更详细的症状描述')
        setQuestions([])
      } else {
        setQuestions(result)
        setCheckedIds(new Set())
        setCollapsedCategories(new Set())
        writeVisitData({
          checklist: { symptoms, department, questions: result, checkedIds: [] },
        })
      }
    } catch {
      setError('生成失败，请检查输入内容')
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }, [symptoms, department])

  const toggleChecked = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleCategory = useCallback((cat: QuestionCategory) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) {
        next.delete(cat)
      } else {
        next.add(cat)
      }
      return next
    })
  }, [])

  const handleExport = useCallback(async () => {
    const formatted = formatQuestionsForExport(questions, checkedIds)
    try {
      await navigator.clipboard.writeText(formatted)
      setExported(true)
      setTimeout(() => setExported(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = formatted
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setExported(true)
      setTimeout(() => setExported(false), 2000)
    }
  }, [questions, checkedIds])

  // 按分类分组
  const groupedQuestions = useMemo(() => {
    const groups: Record<QuestionCategory, QuestionItem[]> = {
      '病因排查': [],
      '检查建议': [],
      '用药注意': [],
      '复诊安排': [],
    }
    for (const q of questions) {
      groups[q.category].push(q)
    }
    return groups
  }, [questions])

  // 统计
  const stats = useMemo(() => {
    const total = questions.length
    const checked = checkedIds.size
    return { total, checked }
  }, [questions, checkedIds])

  // 勾选变化时同步到 localStorage
  useEffect(() => {
    if (questions.length === 0) return
    writeVisitData({
      checklist: {
        symptoms,
        department,
        questions,
        checkedIds: Array.from(checkedIds),
      },
    })
  }, [checkedIds, questions, symptoms, department])

  // 空状态
  if (questions.length === 0 && !loading) {
    return (
      <div className="">
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
          <label className="block text-base font-semibold text-gray-700 mb-2">
            描述您的症状
          </label>
          <button
            onClick={() => {
              setSymptoms(EXAMPLE_SYMPTOMS)
              setError(null)
            }}
            className="w-full px-3 py-1.5 text-sm text-orange-500 hover:text-orange-600 border border-orange-200 rounded-lg mb-2"
          >
            <Lightbulb className="w-3.5 h-3.5 inline mr-1.5" />
            使用示例
          </button>
          <textarea
            value={symptoms}
            onChange={(e) => {
              setSymptoms(e.target.value)
              setError(null)
            }}
            onFocus={(e) => { setTimeout(() => e.target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300) }}
            placeholder="例如：头疼三天，伴有恶心，睡眠不好…"
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-300 resize-none transition-shadow min-h-[120px]"
          />

          <label className="block text-base font-semibold text-gray-700 mt-4 mb-2">
            就诊科室（选填）
          </label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-300 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10"
          >
            <option value="">请选择科室</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
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
            disabled={!symptoms.trim() || loading}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-green-500 text-white text-lg font-medium py-3.5 rounded-2xl shadow-md shadow-green-200 hover:bg-green-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
          >
            <Sparkles className="w-5 h-5" />
            {loading ? '⏳ 正在生成…' : '生成问诊清单'}
          </button>
        </div>

        {/* 空状态引导 */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-8 text-center mt-4">
          <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5">
            <ClipboardList className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">问诊清单</h3>
          <p className="text-gray-500 text-base leading-relaxed">
            输入您的症状，系统将自动生成适合向医生提问的问题清单
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
          <Loader2 className="w-10 h-10 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-base">正在生成问诊问题清单…</p>
        </div>
      </div>
    )
  }

  // 问题清单
  return (
    <div className="">
      {/* 头部 + 统计 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-800">问诊清单</h2>
          <button
            onClick={() => {
              setQuestions([])
              setError(null)
            }}
            className="text-sm text-green-600 hover:text-green-700 underline underline-offset-2"
          >
            重新生成
          </button>
        </div>
        <span className="text-sm text-gray-500 bg-gray-100 rounded-full px-3 py-1">
          {stats.checked}/{stats.total} 已问
        </span>
      </div>

      {/* 按分类展示问题 */}
      <div className="space-y-3">
        {CATEGORY_ORDER.map((cat) => {
          const items = groupedQuestions[cat]
          if (items.length === 0) return null

          const isCollapsed = collapsedCategories.has(cat)
          const checkedInCat = items.filter((q) => checkedIds.has(q.id)).length

          return (
            <div
              key={cat}
              className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden"
            >
              {/* 分类标题 */}
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${CATEGORY_COLORS[cat]}`}
                  >
                    {CATEGORY_LABELS[cat]}
                  </span>
                  <span className="text-sm text-gray-500">
                    {checkedInCat}/{items.length}
                  </span>
                </div>
                {isCollapsed ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* 问题列表 */}
              {!isCollapsed && (
                <div className="divide-y divide-gray-50">
                  {items.map((item) => {
                    const isChecked = checkedIds.has(item.id)
                    return (
                      <label
                        key={item.id}
                        className="w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors cursor-pointer min-h-[48px]"
                      >
                        {/* 勾选框 */}
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleChecked(item.id)}
                          className="w-5 h-5 text-orange-500 rounded border-gray-300 flex-shrink-0 mt-0.5"
                        />
                        {/* 问题文字 */}
                        <span
                          className={`text-base leading-relaxed flex-1 whitespace-normal break-words ${
                            isChecked ? 'text-gray-400 line-through' : 'text-gray-800'
                          }`}
                        >
                          {item.question}
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 底部操作 */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={handleExport}
          className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 bg-white border border-green-200 text-green-600 text-base font-medium py-3 rounded-2xl hover:bg-green-50 active:scale-95 transition-transform min-h-[48px]"
        >
          {exported ? (
            <>
              <Check className="w-5 h-5" />
              已复制
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              导出为文本
            </>
          )}
        </button>
      </div>
    </div>
  )
}