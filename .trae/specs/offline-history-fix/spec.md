# offline-history-fix — Spec

## 问题

- 网络失败时有本地缓存但 History 列表不显示
- `local-{timestamp}` 详情无法打开

## 方案

- History：有 visits 时始终渲染列表，顶部离线横幅
- visitService：`fetchVisitById` / `deleteVisit` / `updateVisit` 支持 local id
- visitStore：`getLocalHistoryEntryById`、`deleteLocalHistoryEntry`

## Checklist

- [x] History 列表条件改为 `visits.length > 0`
- [x] fetchVisitById local fallback
- [x] HistoryDetail 可打开本地记录
- [x] deleteVisit 支持本地记录
