# 手机端导航与登录页交互优化 Spec

## Why
当前 Tab 导航嵌在页面顶部横向滚动，占用首屏空间且不符合移动端操作习惯。登录页输入框偏小、按钮不符合触控标准、诊断功能遮挡主流程。需要按移动端原生体验重构导航和登录页。

## What Changes
- **TabBar**: 手机端改为底部固定 Tab Bar（图标+短标签），桌面端保留顶部 Tab
- **Header**: 手机端仅保留品牌名、头像、历史入口，不再内嵌 TabBar
- **Home.tsx**: 底部预留 TabBar 高度空间，避免内容被遮挡
- **Login.tsx**: 输入框 h-12、按钮 48px+、模式切换等宽分段控件、诊断折叠
- **全局触控**: 所有按钮添加 active 反馈，去掉 hover-only 关键操作

## Impact
- Affected specs: 移动端导航、登录页
- Affected code: `src/components/TabBar.tsx`, `src/components/Header.tsx`, `src/pages/Home.tsx`, `src/pages/Login.tsx`, `src/App.tsx`

## ADDED Requirements

### Requirement: 底部固定 Tab Bar（手机端）
系统 SHALL 在屏幕宽度 <640px 时在底部显示固定导航栏。

#### Scenario: 手机端 Tab 切换
- **WHEN** 用户在手机端打开 #/app 主界面
- **THEN** 底部显示固定 Tab Bar，高度 56-64px + safe-area-inset-bottom
- **AND** 每项包含图标 + 2-4 字标签：时间线、问诊、报告、备忘、就诊包
- **AND** 当前 Tab 图标和文字高亮橙色 #F97316，底部有圆点指示器
- **AND** 背景白色，顶部有 1px 分割线

### Requirement: 桌面端保留顶部 Tab
系统 SHALL 在屏幕宽度 ≥768px 时保留顶部 Tab 横向导航。

#### Scenario: 桌面端 Tab 显示
- **WHEN** 用户在桌面端打开 #/app 主界面
- **THEN** Tab 导航显示在 Header 下方，横向排列
- **AND** 保持原有样式（图标+描述）

### Requirement: 登录页输入框优化
系统 SHALL 使用 h-12（48px）高度的输入框，字号 text-base（16px）。

#### Scenario: 输入框触控
- **WHEN** 用户点击邮箱或密码输入框
- **THEN** 输入框高度 48px，字体 16px，不触发 iOS 自动缩放
- **AND** 键盘弹出时页面可滚动，提交按钮不被遮挡

### Requirement: 登录页主按钮
系统 SHALL 使用全宽、高度 ≥48px、圆角 12px 的主按钮。

#### Scenario: 快速开始按钮
- **WHEN** 用户查看登录页
- **THEN** "快速开始"按钮全宽，高度 48px，圆角 rounded-xl（12px）
- **AND** active 时 scale-95 触控反馈

### Requirement: 模式切换分段控件
系统 SHALL 使用等宽分段控件切换登录/注册/免密登录。

#### Scenario: 模式切换
- **WHEN** 用户点击"登录"、"注册"、"免密登录"
- **THEN** 三个选项等宽分布，选中项白色背景+橙色文字，未选中灰色
- **AND** 每个选项触控区域 ≥44px 高度

### Requirement: 连接诊断折叠
系统 SHALL 将"连接诊断"折叠到次要位置，不遮挡主流程。

#### Scenario: 诊断入口
- **WHEN** 用户查看登录页底部
- **THEN** "连接诊断"以折叠面板形式显示，默认收起
- **AND** 展开后显示诊断结果，不影响主表单

## MODIFIED Requirements

### Requirement: 全局按钮触控反馈
所有可点击按钮 SHALL 在 active 状态下提供视觉反馈。

#### Scenario: 按钮点击
- **WHEN** 用户按下任意按钮
- **THEN** 按钮显示 active:scale-95 缩放或 active:bg-orange-600 颜色变化
- **AND** 关键操作始终可见，不依赖 hover 状态