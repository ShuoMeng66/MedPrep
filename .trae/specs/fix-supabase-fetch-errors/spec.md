# Fix Supabase "fail to fetch" Errors Spec

## Why
用户修改昵称、上传头像等操作时显示 "fail to fetch" 错误。经诊断确认：Supabase API 可达（HTTP 200）、profiles 表已创建、但数据库操作在浏览器中失败。需要系统性地排查和修复。

## Diagnosis Results
- Supabase REST API 可达（Node.js 直接请求返回 200）
- `profiles` 表存在但为空（老用户无行）
- 匿名登录被禁用（`Anonymous sign-ins are disabled`）
- 邮箱注册返回 500（`AuthRetryableFetchError` — SMTP 配置问题）
- 部署的 JS 中环境变量正确嵌入

## What Changes
- 在应用中添加浏览器端 Supabase 连通性诊断组件
- 在 `AuthContext` 中为所有数据库操作添加详细错误日志
- 修复 `fetchProfile` 中 `user!` 在 user 为 null 时的潜在崩溃
- 在 Settings 页面显示具体错误信息而非静默吞掉
- 添加 Supabase 配置检查（匿名登录状态、SMTP 状态）

## Impact
- Affected specs: 用户认证、账户设置
- Affected code: `src/contexts/AuthContext.tsx`, `src/pages/Settings.tsx`, `src/pages/Login.tsx`

## ADDED Requirements

### Requirement: Supabase 连通性诊断
系统 SHALL 在登录页面提供 Supabase 连通性指示，帮助用户快速定位网络问题。

#### Scenario: 诊断按钮点击
- **WHEN** 用户在登录页点击"诊断连接"
- **THEN** 系统依次测试 Supabase Auth API、REST API、Storage API 的连通性
- **AND** 显示每个端点是否可达及延迟

### Requirement: 详细错误日志
系统 SHALL 在所有 Supabase 数据库操作失败时输出详细错误信息到控制台，包含请求类型、端点、错误码和错误消息。

#### Scenario: 数据库操作失败
- **WHEN** 任何 `supabase.from()` 调用失败
- **THEN** 控制台输出 `[MedPrep] 操作名 失败: <错误详情>`

## MODIFIED Requirements

### Requirement: 用户资料更新
系统 SHALL 在更新用户资料失败时向用户显示具体错误原因，而非显示"已更新"后静默失败。

#### Scenario: 更新昵称失败
- **WHEN** 用户修改昵称但 Supabase 请求失败
- **THEN** 显示红色 toast 包含具体错误信息（如"网络连接失败"、"数据库未配置"等）
- **AND** 本地状态不回退（保留用户输入）

### Requirement: 错误处理策略
所有 Supabase 数据库操作的 catch 块 SHALL：
1. 输出详细错误日志到控制台
2. 返回用户可读的错误消息
3. 不静默吞掉错误（除非是表不存在错误）

#### Scenario: 网络错误处理
- **WHEN** Supabase 请求因网络原因失败（TypeError: Failed to fetch）
- **THEN** 返回错误消息 "网络连接失败，请检查网络后重试"
- **AND** 控制台输出 `[MedPrep] 网络请求失败: <原始错误>`