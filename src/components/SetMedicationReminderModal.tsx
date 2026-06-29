import { useState } from 'react'
import { Bell, X } from 'lucide-react'
import type { Medication } from '@/utils/postVisitParser'
import {
  createReminderFromMedication,
  inferDefaultTimes,
  saveReminder,
} from '@/services/medicationReminderService'
import { requestNotificationPermission } from '@/services/notificationService'

interface Props {
  medications: Medication[]
  onClose: () => void
  onSaved: () => void
}

export default function SetMedicationReminderModal({ medications, onClose, onSaved }: Props) {
  const [selected, setSelected] = useState<boolean[]>(() => medications.map(() => true))
  const [timesList, setTimesList] = useState<string[]>(() =>
    medications.map((m) => inferDefaultTimes(m.dosage, m.notes).join(', ')),
  )
  const [saving, setSaving] = useState(false)

  const toggle = (i: number) => {
    setSelected((prev) => prev.map((v, idx) => (idx === i ? !v : v)))
  }

  const handleSave = async () => {
    setSaving(true)
    await requestNotificationPermission()

    for (let i = 0; i < medications.length; i++) {
      if (!selected[i]) continue
      const times = timesList[i]
        .split(/[,，、\s]+/)
        .map((t) => t.trim())
        .filter((t) => /^\d{1,2}:\d{2}$/.test(t))
      const reminder = createReminderFromMedication(medications[i], {
        times: times.length > 0 ? times : inferDefaultTimes(medications[i].dosage, medications[i].notes),
      })
      await saveReminder(reminder)
    }

    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Bell className="w-5 h-5 text-green-500" />
            设为用药提醒
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-500">
            请确认每种药的提醒时间（24 小时制，如 08:00, 12:00, 20:00）
          </p>

          {medications.map((med, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected[i]}
                  onChange={() => toggle(i)}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-orange-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{med.name}</p>
                  <p className="text-xs text-gray-500">{med.dosage}</p>
                </div>
              </label>
              {selected[i] && (
                <input
                  type="text"
                  value={timesList[i]}
                  onChange={(e) =>
                    setTimesList((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
                  }
                  className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="08:00, 12:00, 20:00"
                />
              )}
            </div>
          ))}

          <p className="text-xs text-gray-400">请遵医嘱，本提醒仅为辅助</p>

          <button
            onClick={() => void handleSave()}
            disabled={saving || !selected.some(Boolean)}
            className="w-full bg-green-500 text-white font-medium py-3 rounded-xl hover:bg-green-600 disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            {saving ? '保存中…' : '保存提醒'}
          </button>
        </div>
      </div>
    </div>
  )
}
