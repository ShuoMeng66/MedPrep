# Tasks

- [x] Task 1: 优化 `SymptomTimeline.tsx` 移动端表单
  - [x] textarea: 添加 `min-h-[120px]`
  - [x] "使用示例"按钮移到 textarea 上方独立全宽按钮
  - [x] 生成按钮 `disabled={loading || !text.trim()}` + loading 文字
  - [x] 科室 select: `py-3` → `py-3.5`
  - [x] 复制按钮手机端 `w-full sm:w-auto`
  - [x] textarea `onFocus` 添加 `scrollIntoView`

- [x] Task 2: 优化 `ConsultChecklist.tsx` 移动端表单
  - [x] textarea: 添加 `min-h-[120px]`
  - [x] "使用示例"按钮移到 textarea 上方独立全宽按钮
  - [x] 生成按钮: `disabled={!symptoms.trim() || loading}` + loading 文字
  - [x] 科室 select: `py-3` → `py-3.5`
  - [x] 勾选项: `<button>` 改为 `<label>`，整行可点，`min-h-[48px]`
  - [x] 问题文字: `whitespace-normal break-words`
  - [x] 复制按钮 `w-full sm:w-auto`
  - [x] textarea `onFocus` 添加 `scrollIntoView`

- [x] Task 3: 优化 `ReportReader.tsx` 移动端上传和输入
  - [x] 上传区域: `min-h-[120px]`，`<label>` 包裹整块可点
  - [x] input `accept="image/*" capture`
  - [x] 图片预览: `max-w-full max-h-64 object-contain`
  - [x] 删除按钮: `w-8 h-8`
  - [x] textarea: 添加 `min-h-[120px]`
  - [x] "使用示例"按钮移到 textarea 上方
  - [x] 生成按钮: `disabled={!description.trim() || loading}` + loading 文字
  - [x] 复制按钮 `w-full sm:w-auto`
  - [x] textarea `onFocus` 添加 `scrollIntoView`

- [x] Task 4: 优化 `PostVisitMemo.tsx` 移动端表单和卡片
  - [x] textarea: 添加 `min-h-[120px]`
  - [x] "使用示例"按钮移到 textarea 上方
  - [x] 生成按钮: `disabled={!text.trim() || loading}` + loading 文字
  - [x] 复制按钮 `w-full sm:w-auto`
  - [x] CardWrapper 卡片间距 `mb-4` → `mb-3`
  - [x] CardWrapper 内复制按钮 `min-h-[44px]`
  - [x] textarea `onFocus` 添加 `scrollIntoView`

- [x] Task 5: 构建、TypeScript 检查、部署
  - [x] `npx tsc --noEmit` 编译检查
  - [x] `npx vite build` 构建
  - [x] 部署到 GitHub Pages