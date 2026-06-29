import { useState } from 'react'
import { CalendarClock, X } from 'lucide-react'
import type { FollowUp } from '@/utils/postVisitParser'
import {
  createFollowUpReminder,
  inferDueDateFromFollowUp,
  saveFollowUpReminder,
} from '@/services/followUpReminderService'
import { requestNotificationPermission } from '@/services/notificationService'

interface Props {
  followUps: FollowUp[]
  onClose: () => void
  onSaved: () => void
}

export default function SetFollowUpReminderModal({ followUps, onClose, onSaved }: Props) {
  const [selected, setSelected] = useState<boolean[]>(() => followUps.map(() => true))
  const [dates, setDates] = useState<string[]>(() =>
    followUps.map((fu) => inferDueDateFromFollowUp(fu)),
  )
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await requestNotificationPermission()

    for (let i = 0; i < followUps.length; i++) {
      if (!selected[i]) continue
      const reminder = createFollowUpReminder(followUps[i], { dueDate: dates[i] })
      await saveFollowUpReminder(reminder)
    }

    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-purple-500" />
            设为复查提醒
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {followUps.map((fu, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected[i]}
                  onChange={() =>
                    setSelected((prev) => prev.map((v, idx) => (idx === i ? !v : v)))
                  }
                  className="mt-1 w-4 h-4"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">{fu.condition}</p>
                  <p className="text-xs text-gray-500">{fu.items}</p>
                </div>
              </label>
              {selected[i] && (
                <input
                  type="date"
                  value={dates[i]}
                  onChange={(e) =>
                    setDates((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
                  }
                  className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              )}
            </div>
          ))}

          <button
            onClick={() => void handleSave()}
            disabled={saving || !selected.some(Boolean)}
            className="w-full bg-purple-500 text-white font-medium py-3 rounded-xl hover:bg-purple-600 disabled:opacity-50"
          >
            {saving ? '保存中…' : '保存复查提醒'}
          </button>
        </div>
      </div>
    </div>
  )
}
