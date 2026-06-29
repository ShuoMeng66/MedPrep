# Mobile Web 适配审计与修复 Spec

## Why
MedPrep 是移动端优先的 Web 应用，但当前存在多处移动端适配缺陷：缺少 viewport-fit 和安全区适配、触摸目标过小、布局过宽导致横向滚动、底部无安全区预留。需要在 iOS Safari、微信内置浏览器、Android Chrome 上提供一致的良好体验。

## Audit Findings

### HTML/Meta 缺失
- `viewport` 缺少 `viewport-fit=cover`
- 缺少 `theme-color` meta（橙色 #F97316）
- 缺少 `apple-mobile-web-app-capable` 等 PWA 元标签

### 布局过宽
- `Home.tsx` 和 `Header.tsx` 使用 `max-w-6xl`（72rem），移动端内容过宽
- 应改为 `max-w-lg`（32rem / 512px）适配手机屏幕

### 触摸目标
- TabBar 按钮 `py-3` 已满足 44px 高度，但部分页面按钮过小
- 多处 `px-1.5 py-0.5` 的小标签触控区域不足 44×44px

### 底部安全区
- 所有页面缺少 `pb-safe`（`padding-bottom: env(safe-area-inset-bottom)`）
- iPhone 底部手势条会遮挡内容

### 水平滚动
- TabBar 5 个 Tab 在窄屏横向溢出，已用 `overflow-x-auto` 处理，但缺少滚动指示

### 字号
- 描述文字 `text-xs`（12px）在部分场景下过小

## What Changes
- **index.html**: 补全 meta 标签（viewport-fit、theme-color、apple-mobile-web-app）
- **index.css**: 添加安全区工具类、body 禁止横向溢出、最小触控区域
- **tailwind.config.js**: 添加 `pb-safe` 等安全区工具类
- **Home.tsx**: 布局容器从 `max-w-6xl` 改为 `max-w-lg`，添加底部安全区
- **Header.tsx**: 容器从 `max-w-6xl` 改为 `max-w-lg`，缩小头部高度
- **TabBar.tsx**: 添加横向滚动阴影指示器，确保按钮最小触控区域
- **Login.tsx / Settings.tsx / History.tsx / HistoryDetail.tsx**: 添加底部安全区 padding

## Impact
- Affected specs: 全部页面
- Affected code: `index.html`, `src/index.css`, `tailwind.config.js`, `src/pages/*.tsx`, `src/components/Header.tsx`, `src/components/TabBar.tsx`

## ADDED Requirements

### Requirement: HTML Meta 标签
系统 SHALL 在 `index.html` 中包含完整的移动端 meta 标签。

#### Scenario: iPhone 访问
- **WHEN** 用户在 iPhone Safari 中打开应用
- **THEN** viewport 包含 `viewport-fit=cover`，内容延伸到刘海屏安全区
- **AND** 状态栏颜色为橙色 `#F97316`（theme-color）
- **AND** 添加到主屏幕后以全屏模式运行（apple-mobile-web-app-capable）

### Requirement: 安全区适配
系统 SHALL 在所有页面底部预留 iPhone 安全区空间，避免内容被手势条遮挡。

#### Scenario: iPhone X 及以上机型
- **WHEN** 页面滚动到底部
- **THEN** 底部内容不被 Home Indicator 手势条遮挡
- **AND** 使用 `env(safe-area-inset-bottom)` 自动适配

### Requirement: 触摸目标最小尺寸
所有可点击元素 SHALL 具有至少 44×44px 的触控区域（iOS HIG 标准）。

#### Scenario: 小标签点击
- **WHEN** 用户点击标签（如科室标签、严重程度标签）
- **THEN** 触控区域至少 44×44px（通过 `min-h-[44px]` 或足够 padding 保证）

### Requirement: 移动端布局容器
主内容区 SHALL 使用 `max-w-lg`（32rem）约束宽度，手机端无横向滚动。

#### Scenario: 窄屏手机
- **WHEN** 在 375px 宽屏幕打开应用
- **THEN** 内容无横向滚动条
- **AND** 左右各有 16px 边距（px-4）

## MODIFIED Requirements

### Requirement: TabBar 导航
TabBar SHALL 在移动端支持横向滚动，并显示滚动阴影指示器。

#### Scenario: 5 个 Tab 在窄屏
- **WHEN** 屏幕宽度不足以显示全部 5 个 Tab
- **THEN** TabBar 可横向滚动，右侧显示渐变阴影提示可滚动
- **AND** 每个 Tab 按钮触控区域 ≥ 44px 高度