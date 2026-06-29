# 手机端表单与输入体验优化 Spec

## Why
当前 4 个表单组件（症状时间线、问诊清单、报告解读、诊后备忘）在手机端存在：textarea 过小、"使用示例"按钮遮挡输入区、勾选框行高不足、图片上传区域触控点小、键盘弹出时输入框被遮挡等问题。需要系统优化移动端输入体验。

## What Changes
- **所有 textarea**: min-h-[120px]，font-size 16px，"使用示例"按钮移到输入框上方独立位置
- **生成按钮**: loading 时禁用 + 显示进度文字，全宽固定
- **科室选择**: select 加大 py-3.5 + 触控友好
- **报告上传**: 整块可点 + min-h-[120px] + accept="image/*" capture + 预览 100% 宽
- **问诊清单**: 勾选框整行可点（label 包裹）+ min-h-[48px] + 文字可换行
- **键盘**: 输入聚焦时使用 scrollIntoView 避免被遮挡
- **结果卡片**: 统一 gap-3 间距，复制按钮全宽或右侧大图标
- **桌面端保护**: 所有手机改动加 sm: 断点隔离，桌面端不受影响

## Impact
- Affected specs: 症状时间线、问诊清单、报告解读、诊后备忘
- Affected code: `src/components/SymptomTimeline.tsx`, `src/components/ConsultChecklist.tsx`, `src/components/ReportReader.tsx`, `src/components/PostVisitMemo.tsx`

## ADDED Requirements

### Requirement: Textarea 移动端标准
所有 textarea SHALL min-h-[120px]，font-size 16px，"使用示例"按钮独立在输入框上方。

#### Scenario: 手机端输入
- **WHEN** 用户在手机端打开症状时间线/问诊清单/报告解读/诊后备忘
- **THEN** textarea 最小高度 120px，字体 16px
- **AND** "使用示例"按钮在 textarea 上方独立显示，不遮挡输入区

### Requirement: 生成按钮 Loading 状态
生成按钮 SHALL 在 loading 时禁用并显示进度文字。

#### Scenario: 点击生成
- **WHEN** 用户点击"生成时间线"/"生成问诊清单"/"生成解读"/"生成就诊纪要"
- **THEN** 按钮变为 disabled 状态，显示加载动画 + 进度文字
- **AND** 按钮不可重复点击

### Requirement: 科室选择触控优化
科室 select SHALL 放大至 py-3.5，触控区域 ≥44px 高度。

#### Scenario: 选择科室
- **WHEN** 用户点击科室下拉框
- **THEN** select 高度至少 48px，选项文字 text-base

### Requirement: 报告上传区域优化
上传区域 SHALL 整块可点击，min-h-[120px]，支持手机拍照。

#### Scenario: 上传报告图片
- **WHEN** 用户点击上传区域或拍照
- **THEN** 整个虚线框区域可点击触发文件选择
- **AND** input accept="image/*" capture 支持手机相册/拍照
- **AND** 图片预览最大宽度 100%，可删除重选
- **AND** 超过 5MB 提示压缩

### Requirement: 问诊清单勾选行
勾选行 SHALL 整行可点击，min-h-[48px]，文字可换行。

#### Scenario: 勾选问题
- **WHEN** 用户点击问诊清单中的问题行
- **THEN** 整行触发勾选/取消，文字不截断可换行
- **AND** 行高至少 48px 满足触控标准

### Requirement: 键盘弹出时输入框可见
输入聚焦时 SHALL 使用 scrollIntoView 确保输入框不被键盘遮挡。

#### Scenario: 键盘弹出
- **WHEN** 用户在手机端聚焦 textarea
- **THEN** 输入框自动滚动到可视区域
- **AND** 不被底部 Tab Bar 或固定元素遮挡

### Requirement: 结果卡片间距统一
所有结果卡片 SHALL 使用 gap-3 间距，复制按钮全宽或右侧大图标。

#### Scenario: 结果展示
- **WHEN** 解析结果以卡片形式展示
- **THEN** 卡片之间 gap-3 间距
- **AND** 复制按钮在手机端全宽（w-full sm:w-auto）