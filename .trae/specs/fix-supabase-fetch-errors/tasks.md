# Tasks

- [x] Task 1: 在 Login 页面添加 Supabase 连通性诊断按钮
  - [x] 在 Login.tsx 底部添加"诊断连接"按钮
  - [x] 点击后依次测试 Auth API（GET /auth/v1/health）、REST API（GET /rest/v1/）、Storage API
  - [x] 显示每个端点的连通状态和延迟
  - [x] 检查匿名登录是否启用（尝试 signInAnonymously 并捕获错误消息）

- [x] Task 2: 增强 AuthContext 所有操作的错误日志
  - [x] 在 `fetchProfile` 的 catch 块中添加 `console.error` 输出完整错误对象
  - [x] 在 `updateProfile` 的 catch 块中添加 `console.error` 输出完整错误对象
  - [x] 在 `signInAnonymously` 的 catch 块中添加 `console.error` 输出完整错误对象
  - [x] 在 `uploadAvatar` 的 catch 块中添加 `console.error` 输出完整错误对象
  - [x] 所有日志统一使用 `[MedPrep]` 前缀

- [x] Task 3: 修复 fetchProfile 中 user 可能为 null 的问题
  - [x] 将 `fetchProfile` 中 `buildLocalProfile(user!)` 替换为安全的 null 检查
  - [x] 添加 `currentUser` 参数避免依赖闭包中的 `user` 状态

- [x] Task 4: fix Settings 页面错误显示
  - [x] 确保 `handleSaveNickname` 正确显示 `updateProfile` 返回的错误
  - [x] 确保 `handleFileChange`（头像上传）正确显示 `uploadAvatar` 返回的错误

- [x] Task 5: 构建、测试、部署
  - [x] TypeScript 编译检查
  - [x] `vite build` 构建
  - [x] 部署到 GitHub Pages

# Task Dependencies
- Task 2, 3, 4 可并行执行
- Task 5 依赖所有前序任务完成