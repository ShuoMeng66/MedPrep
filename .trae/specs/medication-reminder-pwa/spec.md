# medication-reminder-pwa — Spec

## 目标

诊后备忘用药/随访 → PWA 今日用药 + 系统通知

## 组件

- MedicationToday / SetMedicationReminderModal / SetFollowUpReminderModal
- NotificationPermissionPrompt / InstallPrompt
- medicationReminderService / followUpReminderService / notificationService

## Checklist

- [x] vite-plugin-pwa + manifest
- [x] IndexedDB 用药/复查提醒
- [x] 诊后备忘一键设提醒
- [x] 今日用药 UI + 标记已服
- [x] Web Notifications + SW 注册
- [x] 打开 App 补偿 syncDueReminders
- [x] 复查日历提醒（followUpReminderService）
