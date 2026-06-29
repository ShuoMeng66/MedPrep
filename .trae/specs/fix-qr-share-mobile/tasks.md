# Tasks

- [x] Task 1: 安装 `qrcode` 包并创建 `QRCodeImage` 组件
  - [x] 安装 `qrcode` npm 包（替换 `qrcode.react`）
  - [x] 创建 `src/components/QRCodeImage.tsx`：使用 `qrcode` 在 canvas 上生成二维码，导出为 data URL，渲染 `<img>`
  - [x] 提供 `onSave` prop 触发 PNG 下载
  - [x] 保持 `qrcode.react` 依赖（`ShareView` 可能还用，且不冲突）

- [x] Task 2: 创建 `shareService.ts` + Supabase `shares` 表
  - [x] 创建 `src/services/shareService.ts`：`createShare(data)` 和 `getShare(uuid)` 函数
  - [x] 在 `supabase_setup.sql` 中添加 `shares` 表 DDL（含 7 天过期策略）
  - [x] 提供 SQL 给用户执行

- [x] Task 3: 更新 `shareUtils.ts` 支持短 UUID
  - [x] 新增 `encodeShareDataShort()`：调用 Supabase 存储，返回短 URL；失败时降级为旧版长链接
  - [x] 新增 `isShortShareId()`：判断 hash 是否为短 UUID（长度 ≤ 36 且不含 `=` 等压缩特征）
  - [x] 保留旧版 `encodeShareData()` / `decodeShareData()` 向后兼容

- [x] Task 4: 更新 `VisitPack.tsx` 分享弹窗
  - [x] 替换 `QRCodeSVG` 为 `QRCodeImage` 组件
  - [x] 添加「保存二维码」按钮（调用 `QRCodeImage` 的 `onSave`）
  - [x] 生成分享链接时异步调用 `encodeShareDataShort()`，显示 loading 状态
  - [x] 失败时显示 toast 提示并降级

- [x] Task 5: 更新 `ShareView.tsx` 兼容短 UUID
  - [x] 检测 `isShortShareId()`，如果是短 UUID 则调用 `getShare()` 从 Supabase 获取
  - [x] 添加加载状态和过期提示
  - [x] 保留旧版 lz-string 解码逻辑

# Task Dependencies
- Task 3 依赖 Task 2（需要 `shareService` 函数）
- Task 4 依赖 Task 1 和 Task 3（需要 `QRCodeImage` 和 `encodeShareDataShort`）
- Task 5 依赖 Task 2 和 Task 3（需要 `getShare` 和 `isShortShareId`）
- Task 1 和 Task 2 可并行执行