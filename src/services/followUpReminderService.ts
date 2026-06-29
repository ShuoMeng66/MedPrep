import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { FollowUp } from '@/utils/postVisitParser'

export interface FollowUpReminder {
  id: string
  visitId?: string
  condition: string
  items: string
  dueDate: string
  remindDaysBefore: number[]
  notifiedKeys: string[]
  enabled: boolean
}

interface FollowUpDB extends DBSchema {
  followups: {
    key: string
    value: FollowUpReminder
  }
}

const DB_NAME = 'medprep-followups'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<FollowUpDB>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<FollowUpDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('followups')) {
          db.createObjectStore('followups', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

/** 从随访描述推断 dueDate（相对今天） */
export function inferDueDateFromFollowUp(fu: FollowUp, baseDate = new Date()): string {
  const text = `${fu.condition} ${fu.items}`
  const d = new Date(baseDate)

  const weekMatch = text.match(/(\d+)\s*周/)
  if (weekMatch) {
    d.setDate(d.getDate() + Number(weekMatch[1]) * 7)
    return d.toISOString().slice(0, 10)
  }

  const dayMatch = text.match(/(\d+)\s*天/)
  if (dayMatch) {
    d.setDate(d.getDate() + Number(dayMatch[1]))
    return d.toISOString().slice(0, 10)
  }

  const monthMatch = text.match(/(\d+)\s*个?月/)
  if (monthMatch) {
    d.setMonth(d.getMonth() + Number(monthMatch[1]))
    return d.toISOString().slice(0, 10)
  }

  if (/下次|复诊|复查/.test(text)) {
    d.setDate(d.getDate() + 7)
    return d.toISOString().slice(0, 10)
  }

  d.setDate(d.getDate() + 7)
  return d.toISOString().slice(0, 10)
}

export function createFollowUpReminder(
  fu: FollowUp,
  options?: { visitId?: string; dueDate?: string },
): FollowUpReminder {
  return {
    id: crypto.randomUUID(),
    visitId: options?.visitId,
    condition: fu.condition,
    items: fu.items,
    dueDate: options?.dueDate ?? inferDueDateFromFollowUp(fu),
    remindDaysBefore: [1, 0],
    notifiedKeys: [],
    enabled: true,
  }
}

export async function getAllFollowUpReminders(): Promise<FollowUpReminder[]> {
  const db = await getDb()
  return db.getAll('followups')
}

export async function saveFollowUpReminder(reminder: FollowUpReminder): Promise<void> {
  const db = await getDb()
  await db.put('followups', reminder)
}

export async function deleteFollowUpReminder(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('followups', id)
}

export function daysUntil(dateStr: string, now = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const [y, m, d] = dateStr.split('-').map(Number)
  const due = new Date(y, m - 1, d)
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export interface DueFollowUpNotice {
  reminder: FollowUpReminder
  daysLeft: number
  kind: 'today' | 'tomorrow' | 'upcoming'
}

export function getDueFollowUpNotices(
  reminders: FollowUpReminder[],
  now = new Date(),
): DueFollowUpNotice[] {
  const notices: DueFollowUpNotice[] = []
  for (const reminder of reminders) {
    if (!reminder.enabled) continue
    const left = daysUntil(reminder.dueDate, now)
    if (left < 0) continue
    if (left === 0) notices.push({ reminder, daysLeft: 0, kind: 'today' })
    else if (left === 1) notices.push({ reminder, daysLeft: 1, kind: 'tomorrow' })
    else if (left <= 7) notices.push({ reminder, daysLeft: left, kind: 'upcoming' })
  }
  return notices.sort((a, b) => a.daysLeft - b.daysLeft)
}

export function getFollowUpsNeedingNotification(
  reminders: FollowUpReminder[],
  now = new Date(),
): FollowUpReminder[] {
  const todayStr = now.toISOString().slice(0, 10)
  return reminders.filter((r) => {
    if (!r.enabled) return false
    const left = daysUntil(r.dueDate, now)
    if (!r.remindDaysBefore.includes(left)) return false
    const key = `${todayStr}-${left}`
    return !r.notifiedKeys.includes(key)
  })
}

export async function markFollowUpNotified(reminder: FollowUpReminder, daysLeft: number): Promise<void> {
  const todayStr = new Date().toISOString().slice(0, 10)
  const key = `${todayStr}-${daysLeft}`
  if (reminder.notifiedKeys.includes(key)) return
  reminder.notifiedKeys = [...reminder.notifiedKeys, key]
  await saveFollowUpReminder(reminder)
}
