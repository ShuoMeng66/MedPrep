import type { TimelineEntry } from './timelineParser'
import type { QuestionItem } from './questionGenerator'
import type { ReportInterpretation } from './reportInterpreter'
import type { PostVisitData } from './postVisitParser'

export const VISIT_KEY = 'medprep_current_visit'
export const HISTORY_KEY = 'medprep_visit_history'

export interface VisitData {
  timeline?: {
    text: string
    entries: TimelineEntry[]
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
  }
  postVisit?: {
    text: string
    data: PostVisitData
    timestamp: number
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

  try {
    const history: HistoryEntry[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    history.unshift(entry)
    // 最多保留 20 条
    if (history.length > 20) history.length = 20
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch {
    // 静默失败
  }

  return entry
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