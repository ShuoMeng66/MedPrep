import { useState } from 'react'
import { Bell, BellOff, Check } from 'lucide-react'
import {
  canUseNotifications,
  getNotificationPermission,
  requestNotificationPermission,
} from '@/services/notificationService'

export default function NotificationPermissionPrompt() {
  const [permission, setPermission] = useState(getNotificationPermission())
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('medprep_notif_prompt_dismissed') === '1',
  )

  if (!canUseNotifications() || permission === 'granted' || dismissed) {
    return null
  }

  const handleEnable = async () => {
    const result = await requestNotificationPermission()
    setPermission(result)
    if (result === 'granted') {
      localStorage.removeItem('medprep_notif_prompt_dismissed')
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('medprep_notif_prompt_dismissed', '1')
    setDismissed(true)
  }

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        {permission === 'denied' ? (
          <BellOff className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        ) : (
          <Bell className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">开启用药提醒通知</p>
          <p className="text-xs text-blue-700 mt-1">
            {permission === 'denied'
              ? '通知已被拒绝。请在浏览器设置中允许本站通知，或使用下方「今日用药」手动查看。'
              : '允许通知后，到点会提醒您服药。iPhone 用户建议先「添加到主屏幕」再开启。'}
          </p>
          {permission !== 'denied' && (
            <button
              onClick={() => void handleEnable()}
              className="mt-3 inline-flex items-center gap-1.5 bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-600 active:scale-[0.98] transition-all"
            >
              <Bell className="w-4 h-4" />
              开启通知
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="mt-2 ml-3 text-xs text-blue-600 underline underline-offset-2"
          >
            暂不开启
          </button>
        </div>
      </div>
    </div>
  )
}

export function NotificationGrantedBadge() {
  if (getNotificationPermission() !== 'granted') return null
  return (
    <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
      <Check className="w-3 h-3" />
      通知已开启
    </span>
  )
}
