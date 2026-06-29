# Checklist

- [x] `index.html` viewport 包含 `viewport-fit=cover`
- [x] `index.html` 有 `theme-color` meta（橙色 #F97316）
- [x] `index.html` 有 `apple-mobile-web-app-capable` meta
- [x] `index.css` body 有 `overflow-x: hidden`
- [x] `index.css` 有 `input/textarea/select { font-size: 16px }` 防止 iOS 缩放
- [x] `tailwind.config.js` 有 `pb-safe` / `pt-safe` 安全区工具类
- [x] `Home.tsx` 容器从 `max-w-6xl` 改为 `max-w-lg`，底部有 `pb-safe`
- [x] `Header.tsx` 容器从 `max-w-6xl` 改为 `max-w-lg`，头部高度缩小
- [x] `TabBar.tsx` 按钮有 `min-h-[44px]`，溢出时有滚动阴影指示
- [x] `Login.tsx` 底部有 `pb-safe`
- [x] `Settings.tsx` 底部有 `pb-safe`
- [x] `History.tsx` 底部有 `pb-safe`
- [x] `HistoryDetail.tsx` 底部有 `pb-safe`
- [x] TypeScript 编译无错误
- [x] `vite build` 构建成功
- [x] 部署到 GitHub Pages 成功