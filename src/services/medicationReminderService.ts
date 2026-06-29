import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Medication } from '@/utils/postVisitParser'

export interface TakenLogEntry {
  date: string
  time: string
  taken: boolean
}

export interface MedicationReminder {
  id: string
  visitId?: string
  name: string
  dosage: string
  notes: string
  times: string[]
  daysOfWeek?: number[]
  startDate: string
  endDate?: string
  takenLog: TakenLogEntry[]
  enabled: boolean
}

interface MedPrepDB extends DBSchema {
  medications: {
    key: string
    value: MedicationReminder
  }
}

const DB_NAME = 'medprep-reminders'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<MedPrepDB>> | null = null

function formatLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export { formatLocalDate }

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<MedPrepDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('medications')) {
          db.createObjectStore('medications', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export function inferDefaultTimes(dosage: string, notes: string): string[] {
  const text = `${dosage} ${notes}`
  const countMatch = text.match(/(?:每日|每天|一日)\s*(\d+)\s*次/)
  const count = countMatch ? Math.min(Number(countMatch[1]), 4) : 0

  if (/早晚|早\s*晚/.test(text)) return ['08:00', '20:00']
  if (/饭前|餐前/.test(text) && count >= 3) return ['07:30', '12:00', '18:30']
  if (/饭后|餐后/.test(text) && count >= 3) return ['08:30', '12:30', '19:00']
  if (count === 4) return ['08:00', '12:00', '18:00', '22:00']
  if (count === 3) return ['08:00', '12:00', '20:00']
  if (count === 2) return ['08:00', '20:00']
  if (/睡前|临睡前/.test(text)) return ['21:00']
  return ['08:00']
}

export function createReminderFromMedication(
  med: Medication,
  options?: { visitId?: string; times?: string[]; endDate?: string },
): MedicationReminder {
  const today = new Date().toISOString().slice(0, 10)
  return {
    id: crypto.randomUUID(),
    visitId: options?.visitId,
    name: med.name,
    dosage: med.dosage,
    notes: med.notes,
    times: options?.times ?? inferDefaultTimes(med.dosage, med.notes),
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    startDate: today,
    endDate: options?.endDate,
    takenLog: [],
    enabled: true,
  }
}

export async function getAllReminders(): Promise<MedicationReminder[]> {
  const db = await getDb()
  return db.getAll('medications')
}

export async function saveReminder(reminder: MedicationReminder): Promise<void> {
  const db = await getDb()
  await db.put('medications', reminder)
}

export async function deleteReminder(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('medications', id)
}

export async function markDoseTaken(
  reminderId: string,
  date: string,
  time: string,
  taken: boolean,
): Promise<void> {
  const db = await getDb()
  const reminder = await db.get('medications', reminderId)
  if (!reminder) return

  const withoutSlot = reminder.takenLog.filter(
    (e) => !(e.date === date && e.time === time),
  )
  reminder.takenLog = [...withoutSlot, { date, time, taken }]
  await db.put('medications', reminder)
}

export function isReminderActiveOnDate(reminder: MedicationReminder, dateStr: string): boolean {
  if (!reminder.enabled) return false
  if (dateStr < reminder.startDate) return false
  if (reminder.endDate && dateStr > reminder.endDate) return false
  const day = new Date(`${dateStr}T12:00:00`).getDay()
  const days = reminder.daysOfWeek ?? [0, 1, 2, 3, 4, 5, 6]
  return days.includes(day)
}

export interface TodayDose {
  reminder: MedicationReminder
  time: string
  taken: boolean
  overdue: boolean
}

export function getTodayDoses(reminders: MedicationReminder[], now = new Date()): TodayDose[] {
  const dateStr = formatLocalDate(now)
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const doses: TodayDose[] = []

  for (const reminder of reminders) {
    if (!isReminderActiveOnDate(reminder, dateStr)) continue
    for (const time of reminder.times) {
      const [h, m] = time.split(':').map(Number)
      const slotMinutes = h * 60 + m
      const log = reminder.takenLog.find((e) => e.date === dateStr && e.time === time)
      doses.push({
        reminder,
        time,
        taken: log?.taken ?? false,
        overdue: !log?.taken && currentMinutes > slotMinutes + 30,
      })
    }
  }

  return doses.sort((a, b) => a.time.localeCompare(b.time))
}

export function getDueDosesForNotification(
  reminders: MedicationReminder[],
  now = new Date(),
  windowMinutes = 5,
): TodayDose[] {
  const dateStr = formatLocalDate(now)
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const doses: TodayDose[] = []

  for (const reminder of reminders) {
    if (!isReminderActiveOnDate(reminder, dateStr)) continue
    for (const time of reminder.times) {
      const [h, m] = time.split(':').map(Number)
      const slotMinutes = h * 60 + m
      const log = reminder.takenLog.find((e) => e.date === dateStr && e.time === time)
      if (log?.taken) continue
      if (Math.abs(currentMinutes - slotMinutes) <= windowMinutes) {
        doses.push({
          reminder,
          time,
          taken: false,
          overdue: false,
        })
      }
    }
  }

  return doses
}
