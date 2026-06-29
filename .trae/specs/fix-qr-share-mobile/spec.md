# 修复二维码分享：手机端保存 + 微信扫码 Spec

## Why
当前分享二维码有两个问题：
1. 使用 `QRCodeSVG` 渲染 SVG，手机端无法长按保存图片
2. 二维码编码了完整就诊数据（压缩后的长 URL），导致二维码过于密集，微信无法扫码识别

## What Changes
- 将 `qrcode.react` 的 `QRCodeSVG` 替换为 `qrcode` 包的 canvas 生成，转为 `<img>` 展示，支持长按保存
- 新增「保存二维码」按钮，将 canvas 导出为 PNG 下载
- 创建 Supabase `shares` 表，存储分享数据，返回短 UUID
- 二维码编码短 URL（`#share=<uuid>`），大幅降低二维码密度，微信可扫
- `ShareView` 兼容新旧两种格式：短 UUID 从 Supabase 取数据，旧版压缩数据直接解码
- 生成分享链接时优先尝试 Supabase 短链接，失败则降级为旧版压缩链接

## Impact
- Affected specs: mobile-visitpack-history-settings
- Affected code: `src/components/VisitPack.tsx`, `src/utils/shareUtils.ts`, `src/components/ShareView.tsx`, `src/services/shareService.ts`（新建）, `supabase_setup.sql`

## ADDED Requirements

### Requirement: 二维码 Canvas 渲染 + 图片保存
系统 SHALL 使用 `qrcode` 包在 `<canvas>` 上生成二维码，转为 `<img>` 展示，并提供「保存二维码」按钮将二维码导出为 PNG 下载。

#### Scenario: 手机端长按保存二维码
- **WHEN** 用户在分享弹窗中看到二维码（`<img>` 格式）
- **THEN** 用户可以长按图片调出系统菜单（保存图片 / 分享图片）
- **AND** 图片清晰可识别

#### Scenario: 点击保存按钮下载二维码
- **WHEN** 用户点击「保存二维码」按钮
- **THEN** 触发浏览器下载 PNG 文件
- **AND** 文件名包含日期（如 `medprep-qr-20260623.png`）

#### Scenario: 二维码在弹窗中完整可见
- **WHEN** 分享弹窗打开且显示二维码
- **THEN** 二维码图片在手机屏幕上不超出弹窗宽度
- **AND** 弹窗可滚动（`max-h-[85vh]`）

### Requirement: Supabase 短链接分享
系统 SHALL 将分享数据存储到 Supabase `shares` 表，使用短 UUID 作为分享标识，二维码编码短 URL。

#### Scenario: 创建短链接分享
- **WHEN** 用户点击「生成分享链接」
- **THEN** 系统将就诊数据存储到 Supabase `shares` 表
- **AND** 返回短 UUID（如 `a1b2c3d4`）
- **AND** 分享链接格式为 `https://shuomeng66.github.io/MedPrep/#share=a1b2c3d4`
- **AND** 二维码编码该短链接

#### Scenario: Supabase 不可用时降级
- **WHEN** Supabase 存储分享数据失败
- **THEN** 系统降级为旧版 lz-string 压缩长链接
- **AND** 提示用户「云端存储失败，已生成长链接」

#### Scenario: 匿名用户分享
- **WHEN** 匿名用户创建分享
- **THEN** 分享数据仍可存储到 Supabase（使用 RLS 策略允许匿名写入）
- **AND** 分享数据 7 天后自动过期

### Requirement: ShareView 兼容新旧格式
系统 SHALL 在 ShareView 中同时支持短 UUID 格式和旧版 lz-string 压缩格式。

#### Scenario: 打开短 UUID 分享链接
- **WHEN** 用户打开 `#share=a1b2c3d4`（短 UUID）
- **THEN** 系统从 Supabase 获取分享数据
- **AND** 渲染就诊资料

#### Scenario: 打开旧版压缩分享链接
- **WHEN** 用户打开 `#share=N4Ig5gDiBcC0A...`（旧版压缩数据）
- **THEN** 系统直接解码 lz-string 压缩数据
- **AND** 渲染就诊资料（向后兼容）

#### Scenario: 分享数据不存在或已过期
- **WHEN** 短 UUID 对应的分享数据不存在
- **THEN** 显示「分享链接已失效」提示

## MODIFIED Requirements

### Requirement: 分享弹窗 UI
分享弹窗 SHALL 包含：分享链接输入框 + 复制按钮、二维码图片（`<img>` 可长按保存）、保存二维码按钮。
- 移除「生成长链接」的旧行为
- 弹窗底部 sheet 风格不变（`SheetModal`）