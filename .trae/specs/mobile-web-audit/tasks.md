# Tasks

- [x] Task 1: 修复 `index.html` meta 标签
  - [x] 修改 viewport 为 `width=device-width, initial-scale=1.0, viewport-fit=cover`
  - [x] 添加 `<meta name="theme-color" content="#F97316" />`
  - [x] 添加 `<meta name="apple-mobile-web-app-capable" content="yes" />`
  - [x] 添加 `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />`

- [x] Task 2: 增强 `tailwind.config.js` 和 `src/index.css`
  - [x] 在 tailwind.config.js 的 extend 中添加安全区 padding
  - [x] 在 index.css 的 body 添加 `overflow-x: hidden`
  - [x] 添加 `.touch-target` 工具类确保最小 44×44px 触控区
  - [x] 添加 `input/textarea/select { font-size: 16px }` 防止 iOS 自动缩放
  - [x] 添加 `.scrollbar-hide` 工具类

- [x] Task 3: 修复 `Home.tsx` 布局
  - [x] 将 `max-w-6xl` 改为 `max-w-lg`
  - [x] 底部添加 `pb-safe` 安全区 padding
  - [x] 匿名用户提示条也改为 `max-w-lg`

- [x] Task 4: 修复 `Header.tsx` 移动端适配
  - [x] 将 `max-w-6xl` 改为 `max-w-lg`
  - [x] 缩小头部 padding：`py-10 sm:py-14` → `py-6 sm:py-10`
  - [x] 标题字号：`text-2xl sm:text-3xl` → `text-xl sm:text-2xl`
  - [x] 免责声明区域也改为 `max-w-lg`

- [x] Task 5: 修复 `TabBar.tsx` 移动端适配
  - [x] 添加右侧渐变阴影指示器（当内容溢出时显示）
  - [x] 确保每个 Tab 按钮 `min-h-[44px]`
  - [x] 使用 `scrollbar-hide` 隐藏滚动条

- [x] Task 6: 修复所有子页面底部安全区
  - [x] `Login.tsx`: 底部添加 `pb-safe`
  - [x] `Settings.tsx`: 底部添加 `pb-safe`
  - [x] `History.tsx`: 底部添加 `pb-safe`
  - [x] `HistoryDetail.tsx`: 底部添加 `pb-safe`

- [x] Task 7: 构建、TypeScript 检查、部署
  - [x] `npx tsc --noEmit` 编译检查
  - [x] `npx vite build` 构建
  - [x] 部署到 GitHub Pages