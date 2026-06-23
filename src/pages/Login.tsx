import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  Stethoscope, Mail, Lock, UserPlus, LogIn, Eye, EyeOff,
  Sparkles, AlertCircle, ChevronDown, ChevronUp, Send, ArrowRight,
  Activity, CheckCircle, XCircle, Loader,
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type AuthMode = 'login' | 'register' | 'magiclink'

export default function Login() {
  const { signIn, signUp, signInAnonymously, sendPasswordResetEmail, sendMagicLink } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState(false)
  const [disclaimerExpanded, setDisclaimerExpanded] = useState(false)
  const [diagnosing, setDiagnosing] = useState(false)
  const [diagResults, setDiagResults] = useState<Array<{ name: string; status: 'success' | 'fail'; time: number; error?: string }>>([])

  const clearMessages = () => { setError(''); setToast('') }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()

    if (!email.trim()) {
      setError('请输入邮箱地址')
      return
    }

    if (mode === 'magiclink') {
      setBusy(true)
      const result = await sendMagicLink(email.trim())
      setBusy(false)
      if (result.error) {
        setError(result.error)
      } else {
        setToast('登录链接已发送到邮箱，请点击链接完成登录')
      }
      return
    }

    if (!password.trim()) {
      setError('请输入密码')
      return
    }
    if (password.length < 6) {
      setError('密码至少 6 位')
      return
    }

    setBusy(true)
    const result = mode === 'login'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password)
    setBusy(false)

    if (result.error) {
      setError(result.error)
    } else if (mode === 'register') {
      setToast('注册成功！请检查邮箱确认链接（如未收到请查看垃圾邮件），确认后即可登录。')
      setMode('login')
      setPassword('')
    }
  }

  const handleAnonymous = async () => {
    clearMessages()
    setBusy(true)
    const result = await signInAnonymously()
    setBusy(false)
    if (result.error) {
      setError(result.error)
    }
  }

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('请先输入邮箱地址')
      return
    }
    clearMessages()
    setBusy(true)
    const result = await sendPasswordResetEmail(email.trim())
    setBusy(false)
    if (result.error) {
      setError(result.error)
    } else {
      setToast('重置密码邮件已发送，请前往邮箱查收')
    }
  }

  const runDiagnostic = async () => {
    setDiagnosing(true)
    setDiagResults([])

    const tests = [
      {
        name: 'Auth API',
        run: async () => {
          const start = performance.now()
          const res = await fetch('https://wdqifmyugeqjkharondv.supabase.co/auth/v1/health')
          const time = Math.round(performance.now() - start)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return { name: 'Auth API', status: 'success' as const, time }
        },
      },
      {
        name: 'REST API',
        run: async () => {
          const start = performance.now()
          const res = await fetch('https://wdqifmyugeqjkharondv.supabase.co/rest/v1/', {
            headers: { apikey: 'sb_publishable_xNPDB3kM2pgVdcNN-HcxTw_ADvO1Z1V' },
          })
          const time = Math.round(performance.now() - start)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return { name: 'REST API', status: 'success' as const, time }
        },
      },
      {
        name: '匿名登录',
        run: async () => {
          const start = performance.now()
          const { error } = await supabase.auth.signInAnonymously()
          const time = Math.round(performance.now() - start)
          if (error) throw new Error(error.message)
          await supabase.auth.signOut()
          return { name: '匿名登录', status: 'success' as const, time }
        },
      },
    ]

    const results = await Promise.allSettled(tests.map((t) => t.run()))
    setDiagResults(
      results.map((r, i) => {
        if (r.status === 'fulfilled') return r.value
        return {
          name: tests[i].name,
          status: 'fail' as const,
          time: 0,
          error: r.reason instanceof Error ? r.reason.message : String(r.reason),
        }
      })
    )
    setDiagnosing(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
        {/* Logo 区域 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl p-3 mb-4 shadow-lg shadow-orange-200">
            <Stethoscope className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">陪诊锦囊</h1>
          <p className="text-sm text-gray-500 mt-1">MedPrep</p>
          <p className="text-sm text-gray-400 mt-3">记录每一次就诊，复诊更有依据</p>
        </div>

        {/* Toast 提示 */}
        {toast && (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 mb-4 flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-green-700 leading-relaxed">{toast}</p>
          </div>
        )}

        {/* 主卡片 */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
          {/* 快速开始 */}
          <div className="p-5 pb-3">
            <button
              onClick={handleAnonymous}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold py-3.5 rounded-xl shadow-md shadow-orange-200 hover:from-orange-500 hover:to-orange-600 active:scale-[0.98] transition-all disabled:opacity-50 text-base"
            >
              {busy ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              快速开始
            </button>
            <p className="text-center text-xs text-gray-400 mt-2.5">
              可先体验，之后在设置中绑定邮箱保存数据
            </p>
          </div>

          {/* 分隔线 */}
          <div className="flex items-center gap-3 px-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">邮箱登录</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* 模式切换 */}
          <div className="px-5 pt-4">
            <div className="flex bg-orange-50 rounded-xl p-1">
              {([
                { key: 'login', label: '登录', icon: LogIn },
                { key: 'register', label: '注册', icon: UserPlus },
                { key: 'magiclink', label: '免密登录', icon: Send },
              ] as const).map((item) => (
                <button
                  key={item.key}
                  onClick={() => { setMode(item.key); clearMessages() }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    mode === item.key
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mx-5 mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="p-5 pt-4 space-y-4">
            {/* 邮箱 */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">邮箱</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearMessages() }}
                  placeholder="your@email.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                />
              </div>
            </div>

            {/* 密码（magiclink 模式隐藏） */}
            {mode !== 'magiclink' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-600">密码</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={busy}
                      className="text-xs text-orange-500 hover:text-orange-600 underline underline-offset-2"
                    >
                      忘记密码？
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearMessages() }}
                    placeholder={mode === 'register' ? '至少 6 位密码' : '输入密码'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white font-medium py-3 rounded-xl hover:bg-orange-600 active:scale-[0.98] transition-all disabled:opacity-50 text-sm"
            >
              {busy ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : mode === 'magiclink' ? (
                <>
                  <Send className="w-4 h-4" />
                  发送登录链接
                </>
              ) : mode === 'login' ? (
                '登录'
              ) : (
                '注册'
              )}
            </button>
          </form>
        </div>

        {/* 免责声明 */}
        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
          <button
            onClick={() => setDisclaimerExpanded(!disclaimerExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-orange-50/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-3 h-3 text-amber-600" />
              </div>
              <span className="text-sm text-gray-600">本工具仅帮助整理就诊信息，不构成医疗诊断或治疗建议</span>
            </div>
            {disclaimerExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}
          </button>
          {disclaimerExpanded && (
            <div className="px-4 pb-4 pt-1 border-t border-gray-50">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">用户须知</h4>
              <ul className="space-y-2 text-xs text-gray-500 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  本工具由 AI 辅助生成就诊信息整理，内容仅供参考，不构成医疗建议、诊断或治疗方案。
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  所有医疗决策请以执业医师的诊断为准，请勿依据本工具内容自行判断病情。
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  您的就诊数据加密存储于云端，仅您本人可访问。匿名账户清除浏览器数据后可能丢失记录。
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  通过分享链接发送的就诊资料，任何获得链接的人均可查看，请勿公开传播。
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* 诊断连接 */}
        <div className="mt-4">
          <button
            onClick={runDiagnostic}
            disabled={diagnosing}
            className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-500 transition-colors disabled:opacity-50 mx-auto"
          >
            {diagnosing ? (
              <Loader className="w-3 h-3 animate-spin" />
            ) : (
              <Activity className="w-3 h-3" />
            )}
            连接诊断
          </button>

          {diagResults.length > 0 && (
            <div className="mt-3 bg-white rounded-xl border border-orange-100 overflow-hidden">
              {diagResults.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-b-0"
                >
                  {item.status === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  )}
                  <span className="text-sm text-gray-700 flex-1">{item.name}</span>
                  {item.status === 'success' ? (
                    <span className="text-xs text-gray-400">{item.time}ms</span>
                  ) : (
                    <span className="text-xs text-red-500 max-w-[180px] truncate" title={item.error}>
                      {item.error}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部 */}
        <p className="text-center text-xs text-gray-400 mt-6">
          登录即表示同意将就诊数据安全存储于云端
        </p>
      </div>
    </div>
  )
}