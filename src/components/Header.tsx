import { Stethoscope, AlertCircle } from 'lucide-react'

export default function Header() {
  return (
    <header className="mb-4">
      {/* 品牌区域 */}
      <div className="bg-gradient-to-br from-orange-400 to-orange-500 text-white">
        <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 rounded-2xl p-2.5">
              <Stethoscope className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-wide">陪诊锦囊</h1>
              <p className="text-orange-100 text-sm mt-0.5">MedPrep</p>
            </div>
          </div>
          <p className="text-orange-50 text-base sm:text-lg leading-relaxed mt-4 max-w-xl">
            帮您整理就诊信息，让每一次问诊更从容
          </p>
        </div>
      </div>

      {/* 免责声明 */}
      <div className="max-w-6xl mx-auto px-4 -mt-3 relative z-10">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-2.5 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 leading-relaxed">
            本工具仅帮助整理就诊信息，不构成医疗诊断或治疗建议
          </p>
        </div>
      </div>
    </header>
  )
}