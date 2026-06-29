import { useEffect, useState, useCallback } from 'react'
import { Pill, Bell, Check, Clock, Trash2, AlertCircle } from 'lucide-react'
import {
  getAllReminders,
  getTodayDoses,
  markDoseTaken,
  deleteReminder,
  formatLocalDate,
  type MedicationReminder,
  type TodayDose,
} from '@/services/medicationReminderService'
import {
  getAllFollowUpReminders,
  getDueFollowUpNotices,
  deleteFollowUpReminder,
  type FollowUpReminder,
} from '@/services/followUpReminderService'
import NotificationPermissionPrompt from '@/components/NotificationPermissionPrompt'
import { shouldShowInAppReminderFallback } from '@/services/notificationService'

export default function MedicationToday() {
  const [doses, setDoses] = useState<TodayDose[]>([])
  const [reminders, setReminders] = useState<MedicationReminder[]>([])
  const [followUps, setFollowUps] = useState<FollowUpReminder[]>([])
  const [followNotices, setFollowNotices] = useState<ReturnType<typeof getDueFollowUpNotices>>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const [meds, fus] = await Promise.all([getAllReminders(), getAllFollowUpReminders()])
    setReminders(meds)
    setFollowUps(fus)
    setDoses(getTodayDoses(meds))
    setFollowNotices(getDueFollowUpNotices(fus))
    setLoading(false)
  }, [])

  useEffect(() => {
    void reload()
    const timer = window.setInterval(() => {
      setDoses(getTodayDoses(reminders))
    }, 60_000)
    return () => window.clearInterval(timer)
  }, [reload, reminders])

  const handleToggleTaken = async (dose: TodayDose) => {
    const dateStr = formatLocalDate(new Date())
    const nextTaken = !dose.taken
    await markDoseTaken(dose.reminder.id, dateStr, dose.time, nextTaken)
    await reload()
  }

  const handleDeleteMed = async (id: string) => {
    await deleteReminder(id)
    await reload()
  }

  const handleDeleteFollow = async (id: string) => {
    await deleteFollowUpReminder(id)
    await reload()
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-orange-100 p-10 text-center text-gray-500">
        加载用药计划…
      </div>
    )
  }

  const pendingCount = doses.filter((d) => !d.taken).length
  const showInAppFallback = shouldShowInAppReminderFallback()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Pill className="w-5 h-5 text-green-500" />
          今日用药
        </h2>
        {pendingCount > 0 && (
          <span className="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full">
            待服 {pendingCount} 次
          </span>
        )}
      </div>

      <NotificationPermissionPrompt />

      {showInAppFallback && pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
          <Bell className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            系统通知未开启时，请在此页面查看今日用药。开启通知后可收到到点提醒。
          </p>
        </div>
      )}

      {doses.length === 0 && reminders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-orange-100 p-8 text-center">
          <Pill className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 mb-1">暂无用药提醒</p>
          <p className="text-sm text-gray-400">
            在「诊后备忘」整理用药后，点击「设为提醒」即可添加
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {doses.map((dose) => (
            <div
              key={`${dose.reminder.id}-${dose.time}`}
              className={`bg-white rounded-2xl border p-4 flex items-center gap-3 ${
                dose.overdue && !dose.taken
                  ? 'border-amber-200 bg-amber-50/30'
                  : 'border-orange-100'
              }`}
            >
              <button
                onClick={() => void handleToggleTaken(dose)}
                className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  dose.taken
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-600'
                }`}
                aria-label={dose.taken ? '标记未服' : '标记已服'}
              >
                <Check className="w-5 h-5" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800">{dose.reminder.name}</span>
                  <span className="text-xs text-gray-400 flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    {dose.time}
                  </span>
                  {dose.overdue && !dose.taken && (
                    <span className="text-xs text-amber-600">已过提醒时间</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{dose.reminder.dosage}</p>
                {dose.reminder.notes && (
                  <p className="text-xs text-gray-400 mt-0.5">{dose.reminder.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {reminders.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">全部用药计划</h3>
          <div className="space-y-2">
            {reminders.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.times.join(' · ')}</p>
                </div>
                <button
                  onClick={() => void handleDeleteMed(r.id)}
                  className="p-2 text-gray-300 hover:text-red-500 rounded-lg"
                  aria-label="删除提醒"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {followNotices.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-purple-500" />
            复查随访
          </h3>
          <div className="space-y-2">
            {followNotices.map(({ reminder, daysLeft, kind }) => (
              <div
                key={reminder.id}
                className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 flex items-start justify-between gap-2"
              >
                <div>
                  <p className="text-sm font-medium text-purple-900">
                    {kind === 'today'
                      ? '今天复查'
                      : kind === 'tomorrow'
                        ? '明天复查'
                        : `${daysLeft} 天后复查`}
                  </p>
                  <p className="text-sm text-purple-800 mt-0.5">
                    {reminder.condition} — {reminder.items}
                  </p>
                  <p className="text-xs text-purple-500 mt-1">日期：{reminder.dueDate}</p>
                </div>
                <button
                  onClick={() => void handleDeleteFollow(reminder.id)}
                  className="p-2 text-purple-300 hover:text-red-500 rounded-lg flex-shrink-0"
                  aria-label="删除复查提醒"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {followUps.length === 0 && reminders.length > 0 && (
        <p className="text-xs text-gray-400 text-center mt-4">
          复查提醒可在「诊后备忘」中从随访项一键添加
        </p>
      )}

      <p className="text-xs text-gray-400 text-center">
        请遵医嘱，本提醒仅为辅助，不能替代专业医疗建议
      </p>
    </div>
  )
}
