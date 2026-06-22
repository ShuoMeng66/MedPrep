import { useState, useCallback, useRef, useEffect } from 'react'
import {
  FileText,
  Upload,
  Sparkles,
  AlertCircle,
  Check,
  Loader2,
  X,
  Copy,
  Lightbulb,
  Stethoscope,
} from 'lucide-react'
import {
  interpretReport,
  formatInterpretationForCopy,
  getAbnormalHint,
  type ReportInterpretation,
} from '@/utils/reportInterpreter'
import { writeVisitData } from '@/utils/visitStore'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png']

const EXAMPLE_DESCRIPTION = `血常规报告：
白细胞计数 11.2 ×10⁹/L ↑（参考 3.5-9.5）
红细胞计数 4.1 ×10¹²/L（参考 4.0-5.5）
血红蛋白 128 g/L（参考 120-160）
血小板计数 210 ×10⁹/L（参考 100-300）
中性粒细胞百分比 78% ↑（参考 40%-75%）
淋巴细胞百分比 18% ↓（参考 20%-50%）`

export default function ReportReader() {
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [result, setResult] = useState<ReportInterpretation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 清理预览 URL
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return '仅支持 JPG 和 PNG 格式的图片'
    }
    if (file.size > MAX_FILE_SIZE) {
      return `图片大小不能超过 5MB，当前大小 ${(file.size / 1024 / 1024).toFixed(1)}MB`
    }
    return null
  }, [])

  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setImage(file)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(URL.createObjectURL(file))
  }, [validateFile, imagePreview])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // 重置 input 以便重复选择同一文件
    e.target.value = ''
  }, [handleFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const handleRemoveImage = useCallback(() => {
    setImage(null)
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
      setImagePreview(null)
    }
  }, [imagePreview])

  const handleFillExample = useCallback(() => {
    setDescription(EXAMPLE_DESCRIPTION)
    setError(null)
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) {
      setError('请输入报告内容描述')
      return
    }

    setError(null)
    setLoading(true)
    setResult(null)

    await new Promise((r) => setTimeout(r, 1200))

    try {
      const interpretation = interpretReport(description)
      setResult(interpretation)
      writeVisitData({
        report: { description, imagePreview, result: interpretation },
      })
    } catch {
      setError('解读失败，请检查输入内容')
    } finally {
      setLoading(false)
    }
  }, [description])

  const handleCopy = useCallback(async () => {
    if (!result) return
    const formatted = formatInterpretationForCopy(result)
    try {
      await navigator.clipboard.writeText(formatted)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = formatted
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [result])

  // 空状态：初始界面
  if (!result && !loading) {
    return (
      <div className="">
        {/* 上传区域 */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
          <label className="block text-base font-semibold text-gray-700 mb-2">
            上传检查报告
          </label>

          {/* 拖拽上传区 */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-blue-400 bg-blue-50'
                : imagePreview
                  ? 'border-blue-200 bg-blue-50/50'
                  : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileChange}
              className="hidden"
            />

            {imagePreview ? (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveImage()
                  }}
                  className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md z-10"
                >
                  <X className="w-4 h-4" />
                </button>
                <img
                  src={imagePreview}
                  alt="报告预览"
                  className="max-h-48 mx-auto rounded-xl shadow-sm"
                />
                <p className="text-sm text-blue-600 mt-2">点击更换图片</p>
              </div>
            ) : (
              <div className="py-4">
                <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-8 h-8 text-blue-400" />
                </div>
                <p className="text-base text-gray-600 mb-1">点击上传或拖拽图片到此处</p>
                <p className="text-sm text-gray-400">支持 JPG、PNG 格式，最大 5MB</p>
              </div>
            )}
          </div>

          {/* 报告内容描述 */}
          <label className="block text-base font-semibold text-gray-700 mt-4 mb-2">
            报告内容描述
          </label>
          <div className="relative">
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                setError(null)
              }}
              placeholder="请描述报告中的指标名称和数值，例如：&#10;白细胞计数 11.2，偏高；血红蛋白 128，正常…"
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 resize-none transition-shadow"
            />
            <button
              onClick={handleFillExample}
              className="absolute top-2 right-2 flex items-center gap-1.5 text-xs text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-lg px-2.5 py-1.5 transition-colors"
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
            disabled={!description.trim()}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-blue-500 text-white text-lg font-medium py-3.5 rounded-2xl shadow-md shadow-blue-200 hover:bg-blue-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
          >
            <Sparkles className="w-5 h-5" />
            生成解读
          </button>
        </div>

        {/* 空状态引导 */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-8 text-center mt-4">
          <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5">
            <FileText className="w-10 h-10 text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">报告解读</h3>
          <p className="text-gray-500 text-base leading-relaxed">
            上传检查报告图片，输入指标名称和数值，获取通俗易懂的白话解读
          </p>
        </div>

        {/* 固定底部免责声明 */}
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 leading-relaxed">
            本解读仅供参考，不构成医疗诊断。异常指标请务必咨询专业医生，切勿自行判断或用药。
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
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-base mb-1">正在分析报告指标…</p>
          <p className="text-gray-400 text-sm">请稍候，这可能需要几秒钟</p>
        </div>
      </div>
    )
  }

  // 结果展示
  return (
    <div className="">
      {/* 头部 */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-800">报告解读</h2>
        <button
          onClick={() => {
            setResult(null)
            setError(null)
          }}
          className="text-sm text-blue-600 hover:text-blue-700 underline underline-offset-2"
        >
          重新解读
        </button>
      </div>

      {/* 报告类型卡片 */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-md shadow-blue-200 p-5 mb-4 text-white">
        <div className="flex items-center gap-3 mb-1">
          <div className="bg-white/20 rounded-xl p-2">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <p className="text-blue-100 text-sm">识别报告类型</p>
            <h3 className="text-xl font-bold">{result.reportType}</h3>
          </div>
        </div>
      </div>

      {/* 关键指标列表 */}
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">关键指标说明</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {result.indicators.map((ind, i) => (
            <div key={i} className="px-4 py-4">
              <div className="flex items-start justify-between mb-1.5">
                <span className="text-base font-medium text-gray-800">{ind.name}</span>
                <span
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                    ind.abnormal
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {getAbnormalHint(ind.abnormal)}
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-1.5">参考范围：{ind.range}</p>
              <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                ind.abnormal ? 'bg-amber-50 text-amber-900 border border-amber-100' : 'bg-gray-50 text-gray-600'
              }`}>
                {ind.abnormal && (
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-2 align-middle" />
                )}
                {ind.explanation}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 复诊追问建议 */}
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">
            下次复诊建议追问
          </h3>
        </div>
        <div className="p-4 space-y-3">
          {result.followUpQuestions.map((q, i) => (
            <div
              key={i}
              className="flex items-start gap-3 bg-blue-50 rounded-xl px-4 py-3"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <p className="text-sm text-blue-900 leading-relaxed">{q}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 复制按钮 */}
      <button
        onClick={handleCopy}
        className="w-full flex items-center justify-center gap-2 bg-white border border-blue-200 text-blue-600 text-base font-medium py-3 rounded-2xl hover:bg-blue-50 active:scale-[0.98] transition-all min-h-[48px] mb-4"
      >
        {copied ? (
          <>
            <Check className="w-5 h-5" />
            已复制
          </>
        ) : (
          <>
            <Copy className="w-5 h-5" />
            复制解读结果
          </>
        )}
      </button>

      {/* 固定底部免责声明 */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-2.5">
        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 leading-relaxed">
          本解读仅供参考，不构成医疗诊断。异常指标请务必咨询专业医生，切勿自行判断或用药。
        </p>
      </div>
    </div>
  )
}