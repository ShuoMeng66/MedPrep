import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { CloudUpload, X, Loader2, Check } from 'lucide-react'

/**
 * 本地数据同步弹窗
 * 登录后检测到本地有未同步记录时自动弹出
 * 用户确认后批量同步到 Supabase
 */
export default function SyncDialog() {
  const { unsyncedCount, syncLocalData, dismissSyncDialog } = useAuth()
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<{ synced: number; failed: number } | null>(null)

  if (unsyncedCount === 0) return null

  const handleSync = async () => {
    setSyncing(true)
    const res = await syncLocalData()
    setSyncing(false)
    setResult(res)
  }

  const handleDismiss = () => {
    dismissSyncDialog()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-slide-up">
        {result ? (
          /* 同步结果 */
          <div className="p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-green-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">同步完成</h3>
            <p className="text-sm text-gray-500">
              成功同步 {result.synced} 条记录
              {result.failed > 0 && `，${result.failed} 条失败`}
            </p>
            <button
              onClick={handleDismiss}
              className="mt-4 w-full py-2.5 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 active:scale-[0.98] transition-all"
            >
              知道了
            </button>
          </div>
        ) : (
          /* 确认弹窗 */
          <>
            <div className="bg-gradient-to-r from-orange-400 to-orange-500 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-white">
                <CloudUpload className="w-5 h-5" />
                <h3 className="font-semibold">数据同步</h3>
              </div>
              <button
                onClick={handleDismiss}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                检测到本机有 <span className="font-bold text-orange-600">{unsyncedCount} 条</span> 未上传的就诊记录，是否同步到您的账户？
              </p>

              <div className="flex gap-2">
                <button
                  onClick={handleDismiss}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  暂不
                </button>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {syncing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CloudUpload className="w-4 h-4" />
                  )}
                  同步到云端
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}