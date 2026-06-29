# Checklist

- [x] 二维码在手机端渲染为 `<img>` 标签，可长按保存
- [x] 「保存二维码」按钮可下载 PNG 文件
- [x] 二维码编码的 URL 为短 UUID 格式（`#share=<uuid>`），长度 ≤ 80 字符
- [x] 微信可成功扫描二维码并打开分享页面（代码层面：纠错级别 M，短 URL 56 字符）
- [x] 旧版 lz-string 压缩分享链接仍可正常打开（向后兼容）
- [x] Supabase 不可用时自动降级为旧版长链接，并提示用户
- [x] 分享弹窗 Sheet 风格在手机端正常显示，二维码不超出屏幕
- [x] `shares` 表 DDL 包含 7 天自动过期策略（pg_cron 需 Supabase 启用后取消注释）
- [x] `npm run build` / `npx tsc --noEmit` 无错误