import { supabase } from '@/lib/supabaseClient'
import type { TimelineEntry } from './timelineParser'
import type { QuestionItem } from './questionGenerator'
import type { ReportInterpretation } from './reportInterpreter'
import type { PostVisitData } from './postVisitParser'

export const VISIT_KEY = 'medprep_current_visit'
export const HISTORY_KEY = 'medprep_visit_history'
/** 本地历史已同步标记：存储已同步到云端的 history entry 的 timestamp 集合 */
export const SYNCED_KEY = 'medprep_synced_timestamps'

export interface VisitData {
  timeline?: {
    text: string
    entries: TimelineEntry[]
    clinicalSummary?: string[]
    thirtySecondVersion?: string
  }
  checklist?: {
    symptoms: string
    department: string
    questions: QuestionItem[]
    checkedIds: string[]
  }
  report?: {
    description: string
    imagePreview: string | null
    result: ReportInterpretation
    aiEnhanced?: {
      plainExplanation?: string
      keyPoints?: string[]
      followUpQuestions?: string[]
    }
  }
  postVisit?: {
    text: string
    data: PostVisitData
    timestamp: number
    aiEnhanced?: boolean
  }
}

export interface HistoryEntry {
  timestamp: number
  label: string
  data: VisitData
}

export function readVisitData(): VisitData {
  try {
    return JSON.parse(localStorage.getItem(VISIT_KEY) || '{}')
  } catch {
    return {}
  }
}

export function writeVisitData(patch: Partial<VisitData>) {
  try {
    const current = readVisitData()
    const merged = { ...current, ...patch }
    localStorage.setItem(VISIT_KEY, JSON.stringify(merged))
  } catch {
    // 静默失败
  }
}

export function saveToHistory(): HistoryEntry {
  const data = readVisitData()
  const entry: HistoryEntry = {
    timestamp: Date.now(),
    label: formatHistoryLabel(),
    data,
  }

  // 本地存储（兼容未登录场景）
  try {
    const history: HistoryEntry[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    history.unshift(entry)
    if (history.length > 20) history.length = 20
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch {
    // 静默失败
  }

  return entry
}

/**
 * 保存就诊记录到 Supabase（需登录）
 */
export async function saveToSupabase(): Promise<{ success: boolean; error?: string }> {
  const data = readVisitData()
  const title = formatHistoryLabel()

  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session) {
    return { success: false, error: '未登录' }
  }

  const { error } = await supabase.from('visits').insert({
    user_id: sessionData.session.user.id,
    title,
    visit_data: data,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

function formatHistoryLabel(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const h = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
}

/* ================================================
 * 本地 ↔ 云端同步策略
 * ================================================
 * 1. 每次 saveToHistory() 会在本地写一条记录（带 timestamp）
 * 2. 同步到云端后，将该 timestamp 写入 SYNCED_KEY 集合
 * 3. getUnsyncedLocalHistory() 对比 HISTORY_KEY 和 SYNCED_KEY 找出未同步的
 * 4. 登录成功后检查是否有未同步数据，弹窗询问用户是否同步
 * 5. 同步完成后标记所有 timestamp 为已同步
 * ================================================ */

/** 获取本地历史中尚未同步到云端的记录 */
export function getUnsyncedLocalHistory(): HistoryEntry[] {
  try {
    const history: HistoryEntry[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    const synced: number[] = JSON.parse(localStorage.getItem(SYNCED_KEY) || '[]')
    const syncedSet = new Set(synced)
    return history.filter((e) => !syncedSet.has(e.timestamp))
  } catch {
    return []
  }
}

/** 获取未同步记录数量 */
export function getUnsyncedCount(): number {
  return getUnsyncedLocalHistory().length
}

/** 标记指定 timestamp 的本地记录为已同步 */
export function markSynced(timestamps: number[]) {
  try {
    const synced: number[] = JSON.parse(localStorage.getItem(SYNCED_KEY) || '[]')
    const set = new Set(synced)
    timestamps.forEach((t) => set.add(t))
    // 只保留最近 200 个已同步标记，避免无限增长
    const arr = Array.from(set).sort((a, b) => b - a).slice(0, 200)
    localStorage.setItem(SYNCED_KEY, JSON.stringify(arr))
  } catch {
    // 静默失败
  }
}

/** 获取本地缓存的历史列表（用于离线展示） */
export function getLocalHistoryCache(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
  } catch {
    return []
  }
}