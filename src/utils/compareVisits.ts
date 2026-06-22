import { HISTORY_KEY } from './visitStore'
import type { VisitData, HistoryEntry } from './visitStore'
import type { TimelineEntry } from './timelineParser'

export type SymptomTrend = 'improved' | 'unchanged' | 'worsened' | 'new'

export interface SymptomComparison {
  description: string
  prevSeverity?: string
  currSeverity?: string
  trend: SymptomTrend
}

export interface FollowUpStatus {
  item: string
  type: 'medication' | 'followup'
  completed: boolean | null // null = 无法判断
  detail: string
}

export interface VisitComparison {
  prevLabel: string
  currLabel: string
  symptomComparison: SymptomComparison[]
  followUpStatus: FollowUpStatus[]
  suggestedQuestions: string[]
}

export function getLastHistory(): HistoryEntry | null {
  try {
    const history: HistoryEntry[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    return history.length > 0 ? history[0] : null
  } catch {
    return null
  }
}

export function compareVisits(prev: VisitData, curr: VisitData, prevLabel: string): VisitComparison {
  const symptomComparison = compareSymptoms(prev.timeline?.entries, curr.timeline?.entries)
  const followUpStatus = compareFollowUps(prev, curr)
  const suggestedQuestions = generateComparisonQuestions(symptomComparison, followUpStatus)

  return {
    prevLabel,
    currLabel: '本次',
    symptomComparison,
    followUpStatus,
    suggestedQuestions,
  }
}

function compareSymptoms(
  prevEntries?: TimelineEntry[],
  currEntries?: TimelineEntry[],
): SymptomComparison[] {
  const results: SymptomComparison[] = []

  if (!currEntries || currEntries.length === 0) {
    return results
  }

  if (!prevEntries || prevEntries.length === 0) {
    // 无历史，所有症状标记为"新增"
    return currEntries.map((e) => ({
      description: e.description,
      currSeverity: e.severity,
      trend: 'new' as SymptomTrend,
    }))
  }

  // 用关键词匹配来对比症状
  const prevDescriptions = prevEntries.map((e) => ({ text: e.description, severity: e.severity }))

  for (const curr of currEntries) {
    // 尝试找到上次描述中最相似的条目
    let bestMatch: { text: string; severity: string; score: number } | null = null

    for (const prev of prevDescriptions) {
      const score = textSimilarity(curr.description, prev.text)
      if (score > 0.15 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { ...prev, score }
      }
    }

    if (bestMatch) {
      // 对比严重程度
      const severityOrder = { '轻': 1, '中': 2, '重': 3 }
      const prevLevel = severityOrder[bestMatch.severity as keyof typeof severityOrder] || 2
      const currLevel = severityOrder[curr.severity as keyof typeof severityOrder] || 2
      const trend: SymptomTrend =
        currLevel < prevLevel ? 'improved' : currLevel > prevLevel ? 'worsened' : 'unchanged'

      results.push({
        description: curr.description,
        prevSeverity: bestMatch.severity,
        currSeverity: curr.severity,
        trend,
      })
    } else {
      results.push({
        description: curr.description,
        currSeverity: curr.severity,
        trend: 'new',
      })
    }
  }

  return results
}

/** 简单的文本相似度计算（基于共同字符） */
function textSimilarity(a: string, b: string): number {
  const aChars = new Set(a.replace(/\s/g, ''))
  const bChars = new Set(b.replace(/\s/g, ''))
  let common = 0
  for (const c of aChars) {
    if (bChars.has(c)) common++
  }
  const union = new Set([...aChars, ...bChars])
  return union.size === 0 ? 0 : common / union.size
}

function compareFollowUps(prev: VisitData, curr: VisitData): FollowUpStatus[] {
  const results: FollowUpStatus[] = []

  // 检查上次的用药是否仍在执行
  if (prev.postVisit?.data.medications) {
    const currMedNames = new Set(
      (curr.postVisit?.data.medications || []).map((m) => m.name),
    )

    for (const med of prev.postVisit.data.medications) {
      const stillUsing = currMedNames.has(med.name)
      results.push({
        item: `用药：${med.name}`,
        type: 'medication',
        completed: stillUsing ? null : true, // 仍在用或已停用
        detail: stillUsing
          ? '本次记录中仍有此药，可能仍在服用（供参考）'
          : '本次记录中未提及此药，可能已停药（供参考）',
      })
    }
  }

  // 检查上次的复查项是否已完成
  if (prev.postVisit?.data.followUps) {
    const currFollowUps = curr.postVisit?.data.followUps || []
    const currFollowText = currFollowUps.map((f) => `${f.condition} ${f.items}`).join(' ')

    for (const fu of prev.postVisit.data.followUps) {
      const fuText = `${fu.condition} ${fu.items}`
      // 检查本次是否仍提到了相同的复查项（说明可能还没做）
      const stillMentioned = currFollowText.includes(fu.condition) || currFollowText.includes(fu.items)
      results.push({
        item: `复查：${fu.condition} — ${fu.items}`,
        type: 'followup',
        completed: stillMentioned ? null : true, // 仍在提及说明未完成
        detail: stillMentioned
          ? '本次记录中仍提及此项复查，可能尚未完成（供参考）'
          : '本次记录中未再提及，可能已完成（供参考）',
      })
    }
  }

  return results
}

function generateComparisonQuestions(
  symptoms: SymptomComparison[],
  followUps: FollowUpStatus[],
): string[] {
  const questions: string[] = []

  // 加重或新增的症状
  const worsened = symptoms.filter((s) => s.trend === 'worsened')
  const newOnes = symptoms.filter((s) => s.trend === 'new')
  const improved = symptoms.filter((s) => s.trend === 'improved')

  if (worsened.length > 0) {
    const descs = worsened.map((s) => s.description).join('、')
    questions.push(`上次就诊后，「${descs.slice(0, 30)}」等症状有所加重，是否需要调整治疗方案？`)
  }

  if (newOnes.length > 0) {
    const descs = newOnes.map((s) => s.description).join('、')
    questions.push(`本次出现了「${descs.slice(0, 30)}」等新症状，是否与原有病情相关？`)
  }

  if (improved.length > 0) {
    const descs = improved.map((s) => s.description).join('、')
    questions.push(`「${descs.slice(0, 30)}」等症状较上次有所改善，是否可以减少用药或调整剂量？`)
  }

  // 未完成的随访项
  const pending = followUps.filter((f) => f.completed === null)
  if (pending.length > 0 && questions.length < 5) {
    const items = pending.map((f) => f.item.replace(/^(用药|复查)：/, '')).join('、')
    questions.push(`上次安排的「${items.slice(0, 25)}」是否已完成？需要如何跟进？`)
  }

  // 确保至少 3 条
  while (questions.length < 3) {
    if (questions.length === 0) {
      questions.push('与上次就诊相比，病情整体趋势如何？需要调整治疗方案吗？')
    } else if (questions.length === 1) {
      questions.push('当前的治疗方案是否需要根据最新情况做出调整？')
    } else {
      questions.push('下次复诊建议安排在什么时间？需要提前做哪些检查？')
    }
  }

  return questions.slice(0, 5)
}

/** 格式化对比结果为纯文本 */
export function formatComparisonForText(comparison: VisitComparison): string {
  const lines: string[] = []
  lines.push('')
  lines.push('【复诊对比】')
  lines.push(`  对比基准：${comparison.prevLabel} 就诊记录`)
  lines.push('')

  if (comparison.symptomComparison.length > 0) {
    lines.push('  一、症状变化')
    const trendLabels: Record<SymptomTrend, string> = {
      improved: '改善 ✓',
      unchanged: '未变 —',
      worsened: '加重 ⚠',
      new: '新增 ●',
    }
    comparison.symptomComparison.forEach((s) => {
      const prev = s.prevSeverity ? `（上次：${s.prevSeverity === '轻' ? '轻度' : s.prevSeverity === '中' ? '中度' : '重度'}）` : ''
      const curr = s.currSeverity ? ` → 本次：${s.currSeverity === '轻' ? '轻度' : s.currSeverity === '中' ? '中度' : '重度'}` : ''
      lines.push(`    ${trendLabels[s.trend]} ${s.description.slice(0, 40)}${prev}${curr}`)
    })
    lines.push('')
  }

  if (comparison.followUpStatus.length > 0) {
    lines.push('  二、随访完成度（供参考）')
    comparison.followUpStatus.forEach((f) => {
      const status = f.completed === true ? '✓ 已完成' : f.completed === null ? '? 待确认' : '—'
      lines.push(`    ${status} ${f.item}`)
      lines.push(`      ${f.detail}`)
    })
    lines.push('')
  }

  if (comparison.suggestedQuestions.length > 0) {
    lines.push('  三、本次建议重点问医生')
    comparison.suggestedQuestions.forEach((q, i) => {
      lines.push(`    ${i + 1}. ${q}`)
    })
    lines.push('')
  }

  lines.push('  ⚠ 对比基于用户自行记录，不能替代医疗判断')
  return lines.join('\n')
}

/** 格式化对比结果为打印 HTML */
export function formatComparisonForHtml(comparison: VisitComparison): string {
  const parts: string[] = []
  parts.push('<div class="section"><div class="section-title">复诊对比</div>')
  parts.push(`<p style="color:#6b7280;font-size:14px;">对比基准：${comparison.prevLabel} 就诊记录</p>`)

  if (comparison.symptomComparison.length > 0) {
    parts.push('<p style="font-weight:600;margin-top:8px;">症状变化</p>')
    const trendLabels: Record<SymptomTrend, string> = { improved: '改善 ✓', unchanged: '未变 —', worsened: '加重 ⚠', new: '新增 ●' }
    const trendColors: Record<SymptomTrend, string> = { improved: '#16a34a', unchanged: '#6b7280', worsened: '#dc2626', new: '#2563eb' }
    comparison.symptomComparison.forEach((s) => {
      const prev = s.prevSeverity ? `（上次：${s.prevSeverity === '轻' ? '轻度' : s.prevSeverity === '中' ? '中度' : '重度'}）` : ''
      const curr = s.currSeverity ? ` → 本次：${s.currSeverity === '轻' ? '轻度' : s.currSeverity === '中' ? '中度' : '重度'}` : ''
      parts.push(`<div class="item" style="color:${trendColors[s.trend]}">${trendLabels[s.trend]} ${s.description.slice(0, 40)}${prev}${curr}</div>`)
    })
  }

  if (comparison.followUpStatus.length > 0) {
    parts.push('<p style="font-weight:600;margin-top:8px;">随访完成度（供参考）</p>')
    comparison.followUpStatus.forEach((f) => {
      const status = f.completed === true ? '✓ 已完成' : f.completed === null ? '? 待确认' : '—'
      parts.push(`<div class="item">${status} ${f.item}<br><span style="color:#9ca3af;font-size:13px;">${f.detail}</span></div>`)
    })
  }

  if (comparison.suggestedQuestions.length > 0) {
    parts.push('<p style="font-weight:600;margin-top:8px;">本次建议重点问医生</p>')
    comparison.suggestedQuestions.forEach((q, i) => {
      parts.push(`<div class="item">${i + 1}. ${q}</div>`)
    })
  }

  parts.push('<p style="color:#dc2626;font-size:12px;margin-top:8px;">⚠ 对比基于用户自行记录，不能替代医疗判断</p>')
  parts.push('</div>')
  return parts.join('\n')
}