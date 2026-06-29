# Tasks

- [x] Task 1: 重写 `TabBar.tsx` — 手机端底部固定 + 桌面端顶部
  - [x] 创建 `BottomTabBar` 组件：`fixed bottom-0 left-0 right-0`，白色背景，顶部 1px border
  - [x] 每个 Tab：图标（w-5 h-5）+ 短标签（时间线/问诊/报告/备忘/就诊包），flex-col 纵向排列
  - [x] 容器高度 h-16（64px）+ pb-safe
  - [x] 当前 Tab：图标和文字 text-orange-500，底部圆点指示器（w-1 h-1 rounded-full bg-orange-500）
  - [x] 未选中 Tab：text-gray-400
  - [x] 仅在 `<640px` 显示（`sm:hidden`），桌面端保留原 `TabBar` 顶部样式（`hidden sm:block`）
  - [x] 桌面端原 TabBar 隐藏 mobile 标签（`hidden sm:flex`），保留 icon+desc

- [x] Task 2: 调整 `Home.tsx` — 底部 TabBar 预留空间
  - [x] 主内容区底部 padding 增加 TabBar 高度：`pb-24 pb-safe`（原 `pb-12 pb-safe`）
  - [x] 确保内容不被底部 TabBar 遮挡

- [x] Task 3: 优化 `Login.tsx` 输入框和按钮
  - [x] 邮箱输入框：`py-3` → `h-12`，`text-sm` → `text-base`
  - [x] 密码输入框：同上
  - [x] "快速开始"按钮：`py-3.5` → `h-12`
  - [x] 提交按钮：`py-3` → `h-12`
  - [x] 模式切换分段控件：每个按钮 `py-3`，`min-h-[44px]`
  - [x] 移动端模式切换不隐藏文字（去掉 `hidden sm:inline`）
  - [x] 添加 `overflow-y-auto` 到最外层容器，确保键盘弹出时可滚动

- [x] Task 4: 折叠"连接诊断"
  - [x] 将诊断按钮和结果面板包裹在可折叠区域
  - [x] 默认收起，显示"连接诊断"折叠标题
  - [x] 点击展开后显示诊断按钮和结果
  - [x] 使用 `ChevronDown`/`ChevronUp` 图标指示展开状态

- [x] Task 5: 全局按钮触控反馈
  - [x] 在 `src/index.css` 添加全局按钮 active 样式
  - [x] 所有 `button` 添加 `active:scale-95 transition-transform`（通过 Tailwind）
  - [x] 检查 Header 按钮、Login 按钮、TabBar 按钮均已添加 active 反馈
  - [x] 去掉 hover-only 关键操作（确保手机端始终可见）

- [x] Task 6: 构建、TypeScript 检查、部署
  - [x] `npx tsc --noEmit` 编译检查
  - [x] `npx vite build` 构建
  - [x] 部署到 GitHub Pages