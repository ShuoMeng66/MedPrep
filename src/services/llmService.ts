/**
 * LLM 服务层 — 调用 Cloudflare Worker 代理
 *
 * 环境变量：
 *   VITE_AI_PROXY_URL — Worker 部署后的 URL
 *   本地开发时可用 VITE_AI_PROXY_URL=http://localhost:8787
 */

export interface LLMSymptomResult {
  clinicalSummary: string[]
  thirtySecondVersion: string
  structuredTimeline: { dateLabel: string; description: string; severity: string }[]
}

export interface LLMPostVisitResult {
  doctorSummary: string[]
  medications: { name: string; dosage: string; notes: string }[]
  followUps: { condition: string; items: string }[]
  warnings: string[]
}

export interface LLMReportResult {
  plainExplanation: string
  keyPoints: string[]
  followUpQuestions: string[]
}

export type LLMMode = 'symptom' | 'postVisit' | 'report'

interface LLMRequest {
  userInput: string
  department?: string
  mode: LLMMode
}

interface LLMErrorResponse {
  error: string
  retryable?: boolean
}

const PROXY_URL = import.meta.env.VITE_AI_PROXY_URL || ''

/**
 * 调用 AI 代理
 */
export async function callLLM<T>(req: LLMRequest): Promise<T> {
  if (!PROXY_URL) {
    throw new LLMError('AI 代理未配置，请设置 VITE_AI_PROXY_URL 环境变量', false)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    const data = await response.json()

    if (!response.ok) {
      const errData = data as LLMErrorResponse
      throw new LLMError(errData.error || 'AI 服务异常', errData.retryable ?? true)
    }

    return data as T
  } catch (err) {
    clearTimeout(timeout)
    if (err instanceof LLMError) throw err
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new LLMError('AI 响应超时，请重试', true)
    }
    throw new LLMError('网络错误，请检查连接后重试', true)
  }
}

export class LLMError extends Error {
  retryable: boolean
  constructor(message: string, retryable: boolean) {
    super(message)
    this.name = 'LLMError'
    this.retryable = retryable
  }
}