import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  User, LogOut, Edit3, Check, X, Shield, Sparkles,
  ArrowLeft, Camera, Mail, Lock, AlertCircle, Trash2,
  Eye, EyeOff, Upload, Loader2, CloudUpload,
} from 'lucide-react'

export default function Settings() {
  const { user, profile, signOut, updateProfile, bindEmail, uploadAvatar, deleteAccount, syncLocalData, checkUnsyncedData } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 昵称编辑
  const [editingNickname, setEditingNickname] = useState(false)
  const [nickname, setNickname] = useState(profile?.nickname || '')
  const [nicknameSaving, setNicknameSaving] = useState(false)

  // 头像上传
  const [avatarUploading, setAvatarUploading] = useState(false)

  // 绑定邮箱（匿名用户）
  const [bindEmailAddr, setBindEmailAddr] = useState('')
  const [bindPassword, setBindPassword] = useState('')
  const [showBindPassword, setShowBindPassword] = useState(false)
  const [bindBusy, setBindBusy] = useState(false)

  // 删除账户
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteBusy, setDeleteBusy] = useState(false)

  // 同步本地数据
  const [syncBusy, setSyncBusy] = useState(false)

  // 全局提示
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3000)
  }

  const isAnonymous = user?.is_anonymous

  // 保存昵称
  const handleSaveNickname = async () => {
    const trimmed = nickname.trim()
    if (!trimmed) { showToast('error', '昵称不能为空'); return }
    if (trimmed.length < 2) { showToast('error', '昵称至少 2 个字'); return }
    if (trimmed.length > 20) { showToast('error', '昵称最多 20 个字'); return }

    setNicknameSaving(true)
    const result = await updateProfile({ nickname: trimmed })
    setNicknameSaving(false)
    if (result.error) {
      showToast('error', result.error)
    } else {
      setEditingNickname(false)
      showToast('success', '昵称已更新')
    }
  }

  // 选择头像
  const handleAvatarClick = () => {
    if (avatarUploading) return
    fileInputRef.current?.click()
  }

  // 上传头像
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarUploading(true)
    const result = await uploadAvatar(file)
    setAvatarUploading(false)

    if (result.error) {
      showToast('error', result.error)
    } else {
      showToast('success', '头像已更新')
    }
    // 清空 input 以便重复选择同一文件
    e.target.value = ''
  }

  // 绑定邮箱
  const handleBindEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bindEmailAddr.trim()) { showToast('error', '请输入邮箱地址'); return }
    if (bindPassword.length < 6) { showToast('error', '密码至少 6 位'); return }

    setBindBusy(true)
    const result = await bindEmail(bindEmailAddr.trim(), bindPassword)
    setBindBusy(false)
    if (result.error) {
      showToast('error', result.error)
    } else {
      showToast('success', '绑定成功！数据已归属到您的邮箱账户')
      setBindEmailAddr('')
      setBindPassword('')
    }
  }

  // 退出登录
  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  // 删除账户
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== '确认删除') {
      showToast('error', '请输入「确认删除」以确认')
      return
    }
    setDeleteBusy(true)
    const result = await deleteAccount()
    setDeleteBusy(false)
    if (result.error) {
      showToast('error', result.error)
    } else {
      navigate('/login', { replace: true })
    }
  }

  // 同步本地数据
  const handleSyncLocalData = async () => {
    setSyncBusy(true)
    const result = await syncLocalData()
    setSyncBusy(false)
    if (result.synced > 0) {
      showToast('success', `成功同步 ${result.synced} 条记录${result.failed > 0 ? `，${result.failed} 条失败` : ''}`)
    } else {
      showToast('success', '没有需要同步的记录')
    }
  }

  // 头像 URL：优先使用自定义头像，否则用 DiceBear 首字母
  const avatarUrl = profile?.avatar_url
    ? profile.avatar_url
    : `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(profile?.nickname || '用户')}&backgroundColor=f97316&textColor=ffffff`

  return (
    <div className="min-h-screen bg-orange-50/50 pb-safe">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* 顶部导航 */}
        <button
          onClick={() => navigate('/app')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回主应用
        </button>

        <h1 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-orange-500" />
          账户设置
        </h1>

        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium transition-all ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {toast.text}
          </div>
        )}

        {/* 头像 & 昵称 */}
        <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-6 mb-4">
          {/* 头像 */}
          <div className="flex flex-col items-center mb-5">
            <div className="relative group">
              <button
                onClick={handleAvatarClick}
                disabled={avatarUploading}
                className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-orange-100 hover:ring-orange-300 transition-all"
              >
                <img
                  src={avatarUrl}
                  alt="头像"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // 加载失败时用首字母占位
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
                {/* 首字母 fallback */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-2xl font-bold">
                  {(profile?.nickname || '用户')[0]}
                </div>
              </button>
              {/* 上传遮罩 */}
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                {avatarUploading ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">点击更换头像（JPG/PNG，最大 2MB）</p>
          </div>

          {/* 登录状态 */}
          <div className="text-center mb-4">
            <p className="text-sm text-gray-500">
              {isAnonymous ? '体验账户，请绑定邮箱' : (user?.email || '')}
            </p>
            {isAnonymous && (
              <span className="inline-flex items-center gap-1 mt-1 text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" />
                匿名
              </span>
            )}
          </div>

          {/* 昵称 */}
          <div className="max-w-xs mx-auto">
            {editingNickname ? (
              <div className="flex items-center gap-2">
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="flex-1 border border-orange-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  maxLength={20}
                  placeholder="2-20 个字"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveNickname() }}
                />
                <button
                  onClick={handleSaveNickname}
                  disabled={nicknameSaving}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  {nicknameSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => { setEditingNickname(false); setNickname(profile?.nickname || '') }}
                  className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <p className="text-lg font-semibold text-gray-800">{profile?.nickname || '用户'}</p>
                <button
                  onClick={() => { setEditingNickname(true); setNickname(profile?.nickname || '') }}
                  className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 匿名用户：绑定邮箱 */}
        {isAnonymous && (
          <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5 mb-4">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="bg-blue-100 rounded-xl p-2">
                <Mail className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">绑定邮箱</h3>
                <p className="text-xs text-gray-400">绑定后可永久保存就诊记录，跨设备同步</p>
              </div>
            </div>

            <form onSubmit={handleBindEmail} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">邮箱</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={bindEmailAddr}
                    onChange={(e) => setBindEmailAddr(e.target.value)}
                    placeholder="your@email.com"
                    autoComplete="email"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">设置密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showBindPassword ? 'text' : 'password'}
                    value={bindPassword}
                    onChange={(e) => setBindPassword(e.target.value)}
                    placeholder="至少 6 位"
                    autoComplete="new-password"
                    className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBindPassword(!showBindPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showBindPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={bindBusy}
                className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white font-medium py-2.5 rounded-xl hover:bg-blue-600 active:scale-[0.98] transition-all disabled:opacity-50 text-sm"
              >
                {bindBusy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                绑定邮箱
              </button>
            </form>
          </div>
        )}

        {/* 账户类型 */}
        <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 rounded-xl p-2">
              <Shield className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                {isAnonymous ? '体验账户' : '邮箱账户'}
              </p>
              <p className="text-xs text-gray-400">
                {isAnonymous
                  ? '体验模式下数据仅保存在当前设备，清除浏览器数据后可能丢失'
                  : '数据已同步至云端，登录其他设备也可查看'}
              </p>
            </div>
          </div>
        </div>

        {/* 同步本地数据 */}
        <button
          onClick={handleSyncLocalData}
          disabled={syncBusy}
          className="w-full flex items-center justify-center gap-2 bg-white border border-orange-200 text-orange-600 font-medium py-3 rounded-xl hover:bg-orange-50 active:scale-[0.98] transition-all mb-3"
        >
          {syncBusy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CloudUpload className="w-4 h-4" />
          )}
          同步本地数据到云端
        </button>

        {/* 退出登录 */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all mb-3"
        >
          <LogOut className="w-4 h-4" />
          退出登录
        </button>

        {/* 删除账户 */}
        <button
          onClick={() => { setShowDeleteDialog(true); setDeleteConfirmText('') }}
          className="w-full flex items-center justify-center gap-2 bg-white border border-red-200 text-red-500 font-medium py-3 rounded-xl hover:bg-red-50 active:scale-[0.98] transition-all"
        >
          <Trash2 className="w-4 h-4" />
          删除账户
        </button>
      </div>

      {/* 删除账户确认弹窗 */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
            <div className="bg-red-500 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-semibold">删除账户</h3>
              </div>
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 leading-relaxed">
                  删除后所有就诊记录、个人资料将被永久移除，数据不可恢复。如您已绑定邮箱，请确认您知道该操作的影响。
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  请输入「确认删除」以继续
                </label>
                <input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="确认删除"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteBusy || deleteConfirmText !== '确认删除'}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {deleteBusy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  确认删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}