# Checklist

- [x] Login 页面显示"诊断连接"按钮，点击后依次测试并显示各端点连通状态
- [x] AuthContext 所有 Supabase 操作在失败时输出 `console.error` 日志（`[MedPrep]` 前缀）
- [x] `fetchProfile` 不再使用 `user!` 非空断言，改为安全的 null 检查
- [x] Settings 页面修改昵称失败时显示红色 toast 含具体错误信息
- [x] Settings 页面上传头像失败时显示红色 toast 含具体错误信息
- [x] TypeScript 编译无错误
- [x] `vite build` 构建成功
- [x] 部署到 GitHub Pages 成功