import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { fetchVisitsWithFallback, deleteVisit, type VisitListItem } from '@/services/visitService'
import { Clock, ChevronRight, FileText, NotebookPen, Trash2, Loader2, Stethoscope, ArrowLeft, AlertCircle, WifiOff } from 'lucide-react'

export default function History() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [visits, setVisits] = useState<VisitListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    setFromCache(false)
    try {
      const result = await fetchVisitsWithFallback(user.id)
      setVisits(result.items)
      setFromCache(result.fromCache)
      if (result.error) {
        setError(result.error)
      }
    } catch (e) {
      setError('加载失败，请重试')
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async (id: string) => {
    if (!user) return
    setDeletingId(id)
    const result = await deleteVisit(id, user.id)
    setDeletingId(null)
    setDeleteConfirmId(null)
    if (result.success) {
      setVisits((prev) => prev.filter((v) => v.id !== id))
    }
  }

  const formatDate = (ts: string) => {
    const d = new Date(ts)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const h = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${day} ${h}:${min}`
  }

  return (
    <div className="min-h-screen bg-orange-50/50 pb-safe">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 顶部导航 */}
        <button
          onClick={() => navigate('/app')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-600 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回主应用
        </button>

        {/* 页面标题 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            就诊历史
          </h1>
          <span className="text-sm text-gray-400">{visits.length} 条记录</span>
        </div>

        {/* 错误状态 */}
        {error && (
          <div className={`rounded-2xl p-4 flex items-center gap-3 mb-4 ${fromCache ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
            {fromCache ? (
              <WifiOff className="w-5 h-5 text-amber-500 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className={`text-sm ${fromCache ? 'text-amber-700' : 'text-red-700'}`}>{error}</p>
            </div>
            {!fromCache && (
              <button
                onClick={load}
                className="text-sm text-red-600 underline underline-offset-2 flex-shrink-0"
              >
                重试
              </button>
            )}
          </div>
        )}

        {/* 加载中 */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
          </div>
        )}

        {/* 空状态 */}
        {!loading && !error && visits.length === 0 && (
          <div className="bg-white rounded-2xl border border-orange-100 p-10 text-center">
            <div className="bg-orange-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">暂无就诊记录</h3>
            <p className="text-sm text-gray-500 mb-4">
              在「就诊包」页面保存就诊资料后，记录将同步到此处
            </p>
            <button
              onClick={() => navigate('/app')}
              className="text-sm text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-xl px-4 py-2 transition-colors"
            >
              前往填写就诊信息
            </button>
          </div>
        )}

        {/* 列表 */}
        {!loading && !error && visits.length > 0 && (
          <div className="space-y-3">
            {visits.map((v) => (
              <div
                key={v.id}
                className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => navigate(`/history/${v.id}`)}
                  className="w-full flex items-center justify-between px-4 py-4 hover:bg-orange-50/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="bg-orange-100 rounded-xl p-2 flex-shrink-0">
                      <NotebookPen className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{v.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-400">{formatDate(v.created_at)}</p>
                        {v.department && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Stethoscope className="w-3 h-3" />
                            {v.department}
                          </span>
                        )}
                      </div>
                      {v.symptomSummary && (
                        <p className="text-xs text-gray-500 mt-1 truncate">{v.symptomSummary}</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 ml-2" />
                </button>

                {/* 操作栏 */}
                <div className="border-t border-gray-50 px-4 py-2 flex justify-end gap-2">
                  <button
                    onClick={() => navigate(`/history/${v.id}`)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-orange-600 py-1 px-2 rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    查看
                  </button>
                  {deleteConfirmId === v.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-red-500">确认删除？</span>
                      <button
                        onClick={() => handleDelete(v.id)}
                        disabled={deletingId === v.id}
                        className="text-xs text-red-600 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        {deletingId === v.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : '确认'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="text-xs text-gray-400 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(v.id)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 py-1 px-2 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      删除
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}