import {
  getAllReminders,
  getDueDosesForNotification,
  formatLocalDate,
} from '@/services/medicationReminderService'
import {
  getAllFollowUpReminders,
  getFollowUpsNeedingNotification,
  daysUntil,
  markFollowUpNotified,
} from '@/services/followUpReminderService'

const NOTIFIED_MED_KEY = 'medprep_notified_med_slots'

function readNotifiedMedSlots(): Set<string> {
  try {
    const raw = localStorage.getItem(NOTIFIED_MED_KEY)
    const arr: string[] = raw ? JSON.parse(raw) : []
    return new Set(arr)
  } catch {
    return new Set()
  }
}

function writeNotifiedMedSlots(slots: Set<string>) {
  const arr = Array.from(slots).slice(-200)
  localStorage.setItem(NOTIFIED_MED_KEY, JSON.stringify(arr))
}

export function canUseNotifications(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getNotificationPermission(): NotificationPermission {
  if (!canUseNotifications()) return 'denied'
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!canUseNotifications()) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return Notification.requestPermission()
}

export async function showAppNotification(
  title: string,
  body: string,
  tag: string,
): Promise<void> {
  if (!canUseNotifications() || Notification.permission !== 'granted') return

  const options: NotificationOptions = {
    body,
    tag,
    icon: `${import.meta.env.BASE_URL}icon-192.png`,
    badge: `${import.meta.env.BASE_URL}icon-192.png`,
    data: { url: `${window.location.origin}${import.meta.env.BASE_URL}#/app` },
  }

  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.ready.catch(() => null)
    if (reg) {
      await reg.showNotification(title, options)
      return
    }
  }

  new Notification(title, options)
}

const DISCLAIMER = '请遵医嘱，本提醒仅为辅助。'

export async function syncDueReminders(now = new Date()): Promise<void> {
  if (!canUseNotifications() || Notification.permission !== 'granted') return

  const [medReminders, followReminders] = await Promise.all([
    getAllReminders(),
    getAllFollowUpReminders(),
  ])

  const notifiedMed = readNotifiedMedSlots()
  const dateStr = formatLocalDate(now)

  const dueDoses = getDueDosesForNotification(medReminders, now)
  for (const dose of dueDoses) {
    const slotKey = `${dose.reminder.id}-${dateStr}-${dose.time}`
    if (notifiedMed.has(slotKey)) continue
    await showAppNotification(
      `用药提醒：${dose.reminder.name}`,
      `${dose.time} · ${dose.reminder.dosage}\n${DISCLAIMER}`,
      slotKey,
    )
    notifiedMed.add(slotKey)
  }
  writeNotifiedMedSlots(notifiedMed)

  const followUps = getFollowUpsNeedingNotification(followReminders, now)
  for (const fu of followUps) {
    const left = daysUntil(fu.dueDate, now)
    const label = left === 0 ? '今天' : left === 1 ? '明天' : `${left} 天后`
    await showAppNotification(
      `复查提醒：${label}`,
      `${fu.condition} — ${fu.items}\n${DISCLAIMER}`,
      `followup-${fu.id}-${dateStr}-${left}`,
    )
    await markFollowUpNotified(fu, left)
  }
}

export function startReminderSyncLoop(): () => void {
  const run = () => {
    void syncDueReminders()
  }

  run()
  const interval = window.setInterval(run, 60_000)

  const onVisibility = () => {
    if (document.visibilityState === 'visible') run()
  }
  document.addEventListener('visibilitychange', onVisibility)

  return () => {
    window.clearInterval(interval)
    document.removeEventListener('visibilitychange', onVisibility)
  }
}

export function isIosStandalonePwa(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true))
  )
}

export function shouldShowInAppReminderFallback(): boolean {
  if (!canUseNotifications()) return true
  if (Notification.permission !== 'granted') return true
  return false
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    const { registerSW } = await import('virtual:pwa-register')
    registerSW({ immediate: true })
    return await navigator.serviceWorker.ready
  } catch {
    return null
  }
}
