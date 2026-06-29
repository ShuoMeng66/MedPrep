import { useNavigate } from 'react-router-dom'
import { AlertCircle, User, Clock, Settings } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function Header() {
  const { profile, user } = useAuth()
  const navigate = useNavigate()

  const avatarUrl = profile?.avatar_url
    ? profile.avatar_url
    : `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(profile?.nickname || '用户')}&backgroundColor=f97316&textColor=ffffff`

  return (
    <header className="mb-4">
      {/* 品牌区域 */}
      <div className="bg-gradient-to-br from-orange-400 to-orange-500 text-white">
        <div className="app-container py-6 sm:py-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={`${import.meta.env.BASE_URL}icon-192.png`}
                alt=""
                className="w-10 h-10 rounded-xl"
              />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-wide">陪诊锦囊</h1>
                <p className="text-orange-100 text-sm mt-0.5">MedPrep</p>
              </div>
            </div>
            {/* 用户导航按钮 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/history')}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-xl px-3 py-2 text-sm font-medium transition-colors active:scale-95 transition-transform"
              >
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">历史记录</span>
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-xl px-3 py-2 text-sm font-medium transition-colors active:scale-95 transition-transform"
              >
                <img
                  src={avatarUrl}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover border border-white/30"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
                <span className="hidden sm:inline max-w-[80px] truncate">
                  {profile?.nickname || '账户'}
                </span>
              </button>
            </div>
          </div>
          <p className="text-orange-50 text-xs sm:text-sm leading-relaxed mt-4 max-w-xl">
            帮您整理就诊信息，让每一次问诊更从容
          </p>
        </div>
      </div>

      {/* 免责声明 */}
      <div className="app-container -mt-3 relative z-10">
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