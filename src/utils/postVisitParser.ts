export interface Medication {
  name: string
  dosage: string
  notes: string
}

export interface FollowUp {
  condition: string
  items: string
}

export interface PostVisitData {
  doctorSummary: string[]
  medications: Medication[]
  followUps: FollowUp[]
  warnings: string[]
}

/**
 * 解析诊后自由文本，提取结构化信息。
 * 仅整理用户输入内容，不新增医学判断。
 */
export function parsePostVisit(text: string): PostVisitData {
  const lines = text
    .split(/\n|。|；|;|，|,/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  const doctorSummary: string[] = []
  const medications: Medication[] = []
  const followUps: FollowUp[] = []
  const warnings: string[] = []

  // 医生告知关键词
  const doctorKeys = /医生|诊断|告知|嘱咐|建议|确诊|结论|印象/
  // 用药关键词
  const medKeys = /药|服用|口服|mg|片|粒|次|每日|每天|早晚|饭后|饭前|睡前|毫升|ml|颗|袋|支|剂量/
  // 复查关键词
  const followKeys = /复查|复诊|随访|下次|预约|挂号|检查|CT|B超|超声|X光|核磁|MRI|抽血|化验/
  // 观察提醒关键词
  const warnKeys = /注意|观察|如果|出现|加重|恶化|疼痛|发烧|发热|出血|头晕|恶心|呕吐|呼吸|胸闷|过敏|及时|立即|就医|急诊/

  for (const line of lines) {
    // 用药行：含"药"且含剂量信息
    if (medKeys.test(line) && (line.includes('药') || /\d/.test(line))) {
      const med = parseMedicationLine(line)
      if (med) {
        medications.push(med)
        continue
      }
    }

    // 复查行
    if (followKeys.test(line)) {
      const fu = parseFollowUpLine(line)
      if (fu) {
        followUps.push(fu)
        continue
      }
    }

    // 观察提醒行
    if (warnKeys.test(line) && !doctorKeys.test(line) && !medKeys.test(line)) {
      warnings.push(line)
      continue
    }

    // 医生告知行（兜底：被上述规则未匹配到的行）
    if (doctorKeys.test(line) || (!medKeys.test(line) && !followKeys.test(line) && !warnKeys.test(line))) {
      doctorSummary.push(line)
    }
  }

  // 如果没有任何解析结果，将所有内容放入医生告知摘要
  if (doctorSummary.length === 0 && medications.length === 0 && followUps.length === 0 && warnings.length === 0) {
    doctorSummary.push(...lines)
  }

  return { doctorSummary, medications, followUps, warnings }
}

function parseMedicationLine(line: string): Medication | null {
  // 尝试提取药名、用法用量、注意事项
  const parts = line.split(/[，,；;、\s]+/).filter(Boolean)

  if (parts.length === 0) return null

  const name = parts[0].replace(/^(服用|口服|外用|涂抹)/, '').trim()
  if (!name) return null

  // 查找剂量信息
  const dosageParts: string[] = []
  const noteParts: string[] = []
  let foundDosage = false

  for (let i = 1; i < parts.length; i++) {
    const p = parts[i]
    if (!foundDosage && /(\d|次|片|粒|mg|ml|毫升|颗|袋|支|每日|每天|早晚|饭后|饭前|睡前)/.test(p)) {
      dosageParts.push(p)
      foundDosage = true
    } else if (foundDosage && /(\d|次|片|粒|mg|ml|毫升|颗|袋|支|每日|每天|早晚|饭后|饭前|睡前)/.test(p)) {
      dosageParts.push(p)
    } else {
      noteParts.push(p)
    }
  }

  const dosage = dosageParts.join(' ') || '请遵医嘱'
  const notes = noteParts.join('，') || '请遵医嘱'

  return { name, dosage, notes }
}

function parseFollowUpLine(line: string): FollowUp | null {
  // 提取时间条件和检查项
  const timePattern = /(\d+[天周月年个]后|下周|下月|明天|后天|周[一二三四五六日]|星期[一二三四五六日]|\d+月\d+[日号]|\d+[./-]\d+)/
  const timeMatch = line.match(timePattern)

  const condition = timeMatch ? timeMatch[0] : '遵医嘱'
  const items = line.replace(timePattern, '').replace(/^[，,；;、\s]+/, '').trim() || '遵医嘱复查'

  return { condition, items }
}

/**
 * 格式化输出为可复制文本
 */
export function formatPostVisitForCopy(data: PostVisitData): string {
  const parts: string[] = []

  parts.push('【诊后备忘】')
  parts.push('')

  if (data.doctorSummary.length > 0) {
    parts.push('一、医生告知摘要')
    data.doctorSummary.forEach((s) => parts.push(`  · ${s}`))
    parts.push('')
  }

  if (data.medications.length > 0) {
    parts.push('二、用药清单')
    data.medications.forEach((m, i) => {
      parts.push(`  ${i + 1}. ${m.name}`)
      parts.push(`     用法用量：${m.dosage}`)
      parts.push(`     注意事项：${m.notes}`)
    })
    parts.push('')
  }

  if (data.followUps.length > 0) {
    parts.push('三、复查随访')
    data.followUps.forEach((f, i) => {
      parts.push(`  ${i + 1}. ${f.condition} — ${f.items}`)
    })
    parts.push('')
  }

  if (data.warnings.length > 0) {
    parts.push('四、观察提醒')
    data.warnings.forEach((s) => parts.push(`  · ${s}`))
    parts.push('')
  }

  return parts.join('\n')
}

/**
 * 生成通俗版（给家人看的简化版本）
 */
export function formatPostVisitPlain(data: PostVisitData): string {
  const parts: string[] = []

  parts.push('【就诊纪要 · 通俗版】')
  parts.push('')

  if (data.doctorSummary.length > 0) {
    parts.push('医生说：')
    data.doctorSummary.forEach((s) => parts.push(`  ${s}`))
    parts.push('')
  }

  if (data.medications.length > 0) {
    parts.push('需要吃的药：')
    data.medications.forEach((m, i) => {
      parts.push(`  ${i + 1}. ${m.name} — ${m.dosage}${m.notes !== '请遵医嘱' ? `（${m.notes}）` : ''}`)
    })
    parts.push('')
  }

  if (data.followUps.length > 0) {
    parts.push('什么时候再去医院：')
    data.followUps.forEach((f) => {
      parts.push(`  ${f.condition}，去${f.items}`)
    })
    parts.push('')
  }

  if (data.warnings.length > 0) {
    parts.push('出现以下情况要马上去医院：')
    data.warnings.forEach((s) => parts.push(`  ${s}`))
    parts.push('')
  }

  return parts.join('\n')
}

/**
 * localStorage 存储键
 */
export const POST_VISIT_KEY = 'medprep_current_visit'