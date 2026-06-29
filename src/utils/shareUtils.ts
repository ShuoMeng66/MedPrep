import LZString from 'lz-string'
import type { VisitData } from './visitStore'
import { createShare } from '@/services/shareService'

const SHARE_PREFIX = '#share='

/** GitHub Pages 正式部署地址（与 vite base: /MedPrep/ 一致） */
const GH_PAGES_BASE_URL = 'https://shuomeng66.github.io/MedPrep/'

/** 分享短链根 URL：默认 GitHub Pages，仅在有 VITE_APP_URL 时覆盖 */
export function getAppBaseUrl(): string {
  const envUrl = import.meta.env.VITE_APP_URL as string | undefined
  if (envUrl) {
    return envUrl.endsWith('/') ? envUrl : `${envUrl}/`
  }
  return GH_PAGES_BASE_URL
}

/** 短 UUID 格式：纯字母数字，10 位以内 */
const SHORT_ID_REGEX = /^[a-zA-Z0-9]{1,16}$/

/**
 * 将就诊数据编码为分享 URL（优先 Supabase 短链接，失败降级为压缩长链接）
 * 返回 { url, isShort } 表示生成的链接和是否为短链接
 */
export async function encodeShareDataShort(data: VisitData): Promise<{ url: string; isShort: boolean }> {
  // 尝试 Supabase 短链接
  const result = await createShare(data)
  if ('uuid' in result) {
    return {
      url: `${getAppBaseUrl()}#share=${result.uuid}`,
      isShort: true,
    }
  }
  // 降级：旧版压缩长链接
  return {
    url: encodeShareData(data),
    isShort: false,
  }
}

/**
 * 判断 hash 中的分享 ID 是否为短 UUID
 */
export function isShortShareId(): boolean {
  const hash = window.location.hash
  if (!hash.startsWith(SHARE_PREFIX)) return false
  const payload = hash.slice(SHARE_PREFIX.length)
  return SHORT_ID_REGEX.test(payload)
}

/**
 * 获取 hash 中分享 ID 的原始值
 */
export function getShareHashPayload(): string {
  const hash = window.location.hash
  if (!hash.startsWith(SHARE_PREFIX)) return ''
  return hash.slice(SHARE_PREFIX.length)
}

/**
 * 将就诊数据编码为分享 URL 中的压缩字符串（旧版）
 */
export function encodeShareData(data: VisitData): string {
  const json = JSON.stringify(data)
  const compressed = LZString.compressToEncodedURIComponent(json)
  return `${getAppBaseUrl()}#share=${compressed}`
}

/**
 * 从 URL hash 中解码分享数据
 * 返回 null 表示不是分享链接或解码失败
 */
export function decodeShareData(): { data: VisitData } | null {
  try {
    const hash = window.location.hash
    if (!hash.startsWith(SHARE_PREFIX)) return null

    const encoded = hash.slice(SHARE_PREFIX.length)
    if (!encoded) return null

    const json = LZString.decompressFromEncodedURIComponent(encoded)
    if (!json) return null

    const data = JSON.parse(json) as VisitData
    return { data }
  } catch {
    return null
  }
}

/**
 * 检测当前 URL 是否为分享链接
 */
export function isShareUrl(): boolean {
  return window.location.hash.startsWith(SHARE_PREFIX)
}

/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      return true
    } catch {
      return false
    }
  }
}