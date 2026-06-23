import { supabase } from '@/lib/supabaseClient'
import type { VisitData } from '@/utils/visitStore'
import { getUnsyncedLocalHistory, markSynced, getLocalHistoryCache } from '@/utils/visitStore'

/** 判断错误是否为"表不存在"（SQL 未执行），应静默降级 */
function isTableNotFoundError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  return msg.includes('Could not find') || msg.includes('schema cache') || (msg.includes('relation') && msg.includes('does not exist'))
}

export interface VisitRecord {
  id: string
  user_id: string
  title: string
  visit_data: VisitData
  created_at: string
}

export interface VisitListItem {
  id: string
  title: string
  created_at: string
  department?: string
  symptomSummary?: string
}

/** 生成就诊标题：日期 + 科室 + 主症状首句 */
export function generateVisitTitle(data: VisitData): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const dateStr = `${y}-${m}-${d}`

  const parts: string[] = [dateStr]

  // 科室
  if (data.checklist?.department) {
    parts.push(data.checklist.department)
  }
  if (data.timeline?.text) {
    // 取首句（第一个句号前的部分），最多 15 字
    const firstSentence = data.timeline.text.split(/[。！？\n]/)[0].trim()
    const summary = firstSentence.length > 15
      ? firstSentence.slice(0, 15) + '...'
      : firstSentence
    parts.push(summary)
  }

  return parts.join(' · ')
}

/** 从 visit_data 提取列表摘要信息 */
export function extractSummary(data: VisitData): { department?: string; symptomSummary?: string } {
  return {
    department: data.checklist?.department,
    symptomSummary: data.timeline?.text
      ? data.timeline.text.split(/[。！？\n]/)[0].trim().slice(0, 30)
      : undefined,
  }
}

/** 校验就诊数据是否包含有效关键字段 */
export function validateVisitData(data: VisitData): { valid: boolean; reason?: string } {
  const hasTimeline = data.timeline && data.timeline.entries.length > 0 && data.timeline.text.trim()
  const hasChecklist = data.checklist && data.checklist.questions.length > 0
  const hasReport = data.report && data.report.result.indicators.length > 0
  const hasPostVisit = data.postVisit && (
    data.postVisit.data.doctorSummary.length > 0 ||
    data.postVisit.data.medications.length > 0 ||
    data.postVisit.data.followUps.length > 0 ||
    data.postVisit.data.warnings.length > 0
  )

  if (!hasTimeline && !hasChecklist && !hasReport && !hasPostVisit) {
    return { valid: false, reason: '请至少完成「症状时间线」后再保存' }
  }
  return { valid: true }
}

/** 获取用户的所有就诊记录列表 */
export async function fetchVisits(userId: string): Promise<VisitListItem[]> {
  try {
    const { data, error } = await supabase
      .from('visits')
      .select('id, title, visit_data, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      if (isTableNotFoundError(error)) return []
      throw error
    }

    return (data || []).map((row: VisitRecord) => {
      const summary = extractSummary(row.visit_data as VisitData)
      return {
        id: row.id,
        title: row.title,
        created_at: row.created_at,
        department: summary.department,
        symptomSummary: summary.symptomSummary,
      }
    })
  } catch (e) {
    if (isTableNotFoundError(e)) return []
    throw e
  }
}

/** 获取单条就诊记录详情 */
export async function fetchVisitById(id: string, userId: string): Promise<VisitRecord | null> {
  try {
    const { data, error } = await supabase
      .from('visits')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (isTableNotFoundError(error)) return null
      return null
    }
    return data as VisitRecord
  } catch {
    return null
  }
}

/** 保存就诊记录到 Supabase */
export async function saveVisit(
  userId: string,
  visitData: VisitData,
  title?: string,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) {
      return { success: false, error: '未登录' }
    }

    const { data, error } = await supabase
      .from('visits')
      .insert({
        user_id: userId,
        title: title || generateVisitTitle(visitData),
        visit_data: visitData,
      })
      .select('id')
      .single()

    if (error) {
      if (isTableNotFoundError(error)) {
        return { success: false, error: '数据库未配置，请执行 supabase_setup.sql' }
      }
      return { success: false, error: error.message }
    }

    return { success: true, id: data?.id }
  } catch (e) {
    if (isTableNotFoundError(e)) {
      return { success: false, error: '数据库未配置，请执行 supabase_setup.sql' }
    }
    return { success: false, error: '保存失败，请稍后重试' }
  }
}

/** 删除就诊记录 */
export async function deleteVisit(id: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('visits')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      if (isTableNotFoundError(error)) {
        return { success: false, error: '数据库未配置' }
      }
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (e) {
    if (isTableNotFoundError(e)) {
      return { success: false, error: '数据库未配置' }
    }
    return { success: false, error: '删除失败' }
  }
}

/* ================================================
 * 本地 ↔ 云端批量同步
 * ================================================
 * 流程：
 * 1. 登录成功后调用 checkUnsyncedData() 获取未同步数量
 * 2. 弹窗询问用户是否同步
 * 3. 确认后调用 batchSyncLocalHistory(userId) 批量插入
 * 4. 成功后调用 markSynced(timestamps) 标记已同步
 * 5. 同步失败的记录保留在本地，下次登录再次提示
 * ================================================ */

/** 批量同步本地未同步记录到 Supabase */
export async function batchSyncLocalHistory(userId: string): Promise<{
  success: boolean
  synced: number
  failed: number
  error?: string
}> {
  const unsynced = getUnsyncedLocalHistory()
  if (unsynced.length === 0) {
    return { success: true, synced: 0, failed: 0 }
  }

  let synced = 0
  let failed = 0
  const syncedTimestamps: number[] = []

  for (const entry of unsynced) {
    const valid = validateVisitData(entry.data)
    if (!valid.valid) {
      // 空数据直接标记为已同步（跳过）
      syncedTimestamps.push(entry.timestamp)
      continue
    }

    try {
      const { error } = await supabase.from('visits').insert({
        user_id: userId,
        title: generateVisitTitle(entry.data),
        visit_data: entry.data,
        created_at: new Date(entry.timestamp).toISOString(),
      })

      if (error) {
        if (isTableNotFoundError(error)) {
          // 表不存在，全部失败，停止批量同步
          return { success: false, synced, failed: unsynced.length - synced, error: '数据库未配置' }
        }
        failed++
      } else {
        synced++
        syncedTimestamps.push(entry.timestamp)
      }
    } catch (e) {
      if (isTableNotFoundError(e)) {
        return { success: false, synced, failed: unsynced.length - synced, error: '数据库未配置' }
      }
      failed++
    }
  }

  // 标记已同步的
  if (syncedTimestamps.length > 0) {
    markSynced(syncedTimestamps)
  }

  return { success: failed === 0, synced, failed }
}

/** 带离线缓存的列表拉取 */
export async function fetchVisitsWithFallback(userId: string): Promise<{
  items: VisitListItem[]
  fromCache: boolean
  error?: string
}> {
  try {
    const data = await fetchVisits(userId)
    return { items: data, fromCache: false }
  } catch {
    // Supabase 请求失败，使用本地缓存
    const local = getLocalHistoryCache()
    const items = local
      .map((entry) => {
        const summary = extractSummary(entry.data)
        return {
          id: `local-${entry.timestamp}`,
          title: entry.label,
          created_at: new Date(entry.timestamp).toISOString(),
          department: summary.department,
          symptomSummary: summary.symptomSummary,
        }
      })
      .reverse() as VisitListItem[]
    return { items, fromCache: true, error: '网络异常，显示缓存数据' }
  }
}