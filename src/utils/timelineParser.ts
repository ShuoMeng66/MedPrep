export interface TimelineEntry {
  id: string
  dateLabel: string
  description: string
  severity: '轻' | '中' | '重'
  notes: string
}

/** 时间标记模式：匹配中文时间描述 + 分隔符 */
const TIME_PATTERNS = [
  /(?:最近|近期|近日|这两天|这几天|前些天|前几天|前一阵|前段时间|这几天|这一阵)/g,
  /(?:上周[一二三四五六日天])/g,
  /(?:本周[一二三四五六日天])/g,
  /(?:周[一二三四五六日天])/g,
  /(?:大前天|前天|昨天|今天|今早|今晨|上午|下午|晚上|昨晚)/g,
  /(?:约\s*\d+\s*天前|\d+\s*天前|\d+\s*周前)/g,
  /(?:约\s*\d+\s*小时前|\d+\s*小时前)/g,
  /(?:从昨天|从前天|从上[周星期])/g,
  /(?:月初|月中|月底|上个月|这个月|本月)/g,
  /(?:\d+月\d+[日号])/g,
  /(?:\d+[月\-\.]\d+)/g,
]

/** 严重程度关键词 */
const SEVERE_KEYWORDS = /严重|剧烈|剧痛|厉害|难以忍受|非常|很痛|很疼|绞痛|刀割|撕裂|极|巨|受不了|撑不住/
const MILD_KEYWORDS = /轻微|微|有点|稍微|稍稍|略|稍|轻度|隐隐|不太|一点点|一点点儿/

/** 时间分隔符 */
const TIME_SEPARATORS = /[，,。；;！!？?\n\r]+/

/**
 * 判断文本是否包含具体时间描述
 */
function hasTimeMarkers(text: string): boolean {
  return TIME_PATTERNS.some((p) => {
    p.lastIndex = 0
    return p.test(text)
  })
}

/**
 * 从文本中提取严重程度
 */
function detectSeverity(text: string): '轻' | '中' | '重' {
  if (SEVERE_KEYWORDS.test(text)) return '重'
  if (MILD_KEYWORDS.test(text)) return '轻'
  return '中'
}

/**
 * 将文本按时间标记分段
 */
function splitByTimeMarkers(text: string): { marker: string; content: string }[] {
  const segments: { marker: string; content: string }[] = []

  // 先找出所有时间标记的位置
  interface Match {
    index: number
    length: number
    text: string
  }

  const allMatches: Match[] = []
  for (const pattern of TIME_PATTERNS) {
    pattern.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = pattern.exec(text)) !== null) {
      allMatches.push({ index: m.index, length: m[0].length, text: m[0] })
    }
  }

  // 按位置排序
  allMatches.sort((a, b) => a.index - b.index)

  if (allMatches.length === 0) {
    // 没有时间标记，整个文本作为一段
    segments.push({ marker: '近期', content: text.trim() })
    return segments
  }

  // 处理第一个标记之前的内容
  if (allMatches[0].index > 0) {
    const before = text.slice(0, allMatches[0].index).trim()
    if (before) {
      segments.push({ marker: '近期', content: before })
    }
  }

  // 处理每个时间标记及其后内容
  for (let i = 0; i < allMatches.length; i++) {
    const current = allMatches[i]
    const startPos = current.index + current.length
    const endPos = i < allMatches.length - 1 ? allMatches[i + 1].index : text.length
    const content = text.slice(startPos, endPos).trim()

    if (content) {
      segments.push({ marker: current.text, content })
    }
  }

  return segments
}

let idCounter = 0

/**
 * 解析症状描述文本，生成时间线条目
 */
export function parseTimeline(text: string): TimelineEntry[] {
  if (!text.trim()) return []

  // 重置计数器（每次解析重新计数）
  // 使用时间戳确保唯一性
  const prefix = Date.now().toString(36)

  const hasMarkers = hasTimeMarkers(text)

  if (!hasMarkers) {
    // 没有具体时间标记，按句号/逗号分段
    const parts = text.split(TIME_SEPARATORS).filter((s) => s.trim().length > 3)
    if (parts.length <= 1) {
      return [
        {
          id: `${prefix}-0`,
          dateLabel: '近期',
          description: text.trim(),
          severity: detectSeverity(text),
          notes: '',
        },
      ]
    }
    return parts.map((part, i) => ({
      id: `${prefix}-${i}`,
      dateLabel: i === 0 ? '最早' : i === parts.length - 1 ? '最近' : `第${i + 1}阶段`,
      description: part.trim(),
      severity: detectSeverity(part),
      notes: '',
    }))
  }

  // 有具体时间标记，按时间标记分段
  const segments = splitByTimeMarkers(text)
  return segments.map((seg, i) => ({
    id: `${prefix}-${i}`,
    dateLabel: seg.marker,
    description: seg.content,
    severity: detectSeverity(seg.content),
    notes: '',
  }))
}

/**
 * 将时间线条目格式化为可复制的文本
 */
export function formatTimelineForCopy(entries: TimelineEntry[]): string {
  if (entries.length === 0) return ''

  const lines = entries.map((entry) => {
    const severityLabel = { 轻: '轻度', 中: '中度', 重: '重度' }[entry.severity]
    return `【${entry.dateLabel}】${severityLabel}\n${entry.description}`
  })

  return `📋 症状时间线\n${'─'.repeat(20)}\n${lines.join('\n\n')}`
}