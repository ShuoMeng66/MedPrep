import LZString from 'lz-string'
import type { VisitData } from './visitStore'

const SHARE_PREFIX = '#share='
const BASE_URL = 'https://shuomeng66.github.io/MedPrep/'

/**
 * 将就诊数据编码为分享 URL 中的压缩字符串
 */
export function encodeShareData(data: VisitData): string {
  const json = JSON.stringify(data)
  const compressed = LZString.compressToEncodedURIComponent(json)
  return `${BASE_URL}#share=${compressed}`
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