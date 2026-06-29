# MedPrep v2 路线图实施计划

> 对应 PRD v2.0 — 已完成本迭代全部任务

## Sprint 1 — 必须先修 ✅

- 离线历史列表/详情（History、visitService、visitStore）
- Tailwind `pb-safe` 别名
- shareUtils 动态 BASE_URL
- shares RLS + cleanup 函数
- Worker 移除硬编码 Key

## Sprint 2 — PWA + 提醒 ✅

- vite-plugin-pwa、InstallPrompt
- medicationReminderService + followUpReminderService
- 今日用药 Tab、诊后一键设提醒
- notificationService + SW 补偿

## Sprint 3 — 完善 ✅

- visitService.updateVisit
- HistoryDetail「基于此就诊新建」
- PRD/架构文档 v2
- 单元测试 + Playwright e2e 配置

## 验证命令

```bash
npm run check
npm run build
npm run test:unit
npx playwright install chromium   # 首次需安装浏览器
npm run test:e2e
```
