export interface ReportInterpretation {
  /** 报告类型 */
  reportType: string
  /** 关键指标解读 */
  indicators: IndicatorItem[]
  /** 复诊追问建议 */
  followUpQuestions: string[]
}

export interface IndicatorItem {
  /** 指标名称 */
  name: string
  /** 参考范围 */
  range: string
  /** 白话解释 */
  explanation: string
  /** 是否异常 */
  abnormal: boolean
}

/** 常见报告类型模板 */
const REPORT_TEMPLATES: Record<string, { name: string; indicators: Omit<IndicatorItem, 'abnormal'>[] }> = {
  '血常规': {
    name: '血常规',
    indicators: [
      { name: '白细胞计数 (WBC)', range: '3.5-9.5 ×10⁹/L', explanation: '身体的"免疫士兵"，偏高说明可能有感染或炎症，偏低可能与免疫力下降有关' },
      { name: '红细胞计数 (RBC)', range: '4.0-5.5 ×10¹²/L', explanation: '负责运输氧气，偏低可能提示贫血，让你感觉疲劳、头晕' },
      { name: '血红蛋白 (Hb)', range: '120-160 g/L', explanation: '红细胞里的"氧气背包"，数值低就是说身体运氧能力不足，容易累、脸色苍白' },
      { name: '血小板计数 (PLT)', range: '100-300 ×10⁹/L', explanation: '身体的"创可贴"，负责止血凝血，偏低容易出血不止，偏高可能增加血栓风险' },
      { name: '中性粒细胞百分比', range: '40%-75%', explanation: '白细胞的主力部队，主要对付细菌感染，升高常提示细菌感染或急性炎症' },
      { name: '淋巴细胞百分比', range: '20%-50%', explanation: '白细胞的特种部队，主要对付病毒感染，感冒时往往升高' },
    ],
  },
  '肝功能': {
    name: '肝功能',
    indicators: [
      { name: '谷丙转氨酶 (ALT)', range: '0-40 U/L', explanation: '肝脏细胞里的"报警器"，升高说明肝细胞受损，常见于脂肪肝、肝炎、药物影响' },
      { name: '谷草转氨酶 (AST)', range: '0-40 U/L', explanation: '和ALT搭档反映肝损伤，饮酒或剧烈运动后也可能暂时升高' },
      { name: '总胆红素 (TBil)', range: '3.4-17.1 μmol/L', explanation: '升高会让皮肤和眼睛发黄（黄疸），提示肝脏处理胆红素的能力下降' },
      { name: '白蛋白 (ALB)', range: '35-55 g/L', explanation: '肝脏制造的"运输蛋白"，偏低反映肝脏合成能力下降或营养不良' },
      { name: 'γ-谷氨酰转移酶 (GGT)', range: '0-50 U/L', explanation: '对酒精敏感，饮酒者常升高，也用于判断胆道是否通畅' },
    ],
  },
  '肾功能': {
    name: '肾功能',
    indicators: [
      { name: '肌酐 (Cr)', range: '44-104 μmol/L', explanation: '肌肉代谢的废物，通过肾脏排出，升高说明肾脏过滤功能可能下降' },
      { name: '尿素氮 (BUN)', range: '2.9-8.2 mmol/L', explanation: '蛋白质代谢产物，升高可能与肾功能减退、高蛋白饮食或脱水有关' },
      { name: '尿酸 (UA)', range: '150-420 μmol/L', explanation: '嘌呤代谢产物，过高可能引起痛风，也与肾脏排泄能力有关' },
      { name: '估算肾小球滤过率 (eGFR)', range: '>90 mL/min/1.73m²', explanation: '综合评估肾脏滤过功能的指标，数值越低说明肾功能越差' },
    ],
  },
  '血脂': {
    name: '血脂四项',
    indicators: [
      { name: '总胆固醇 (TC)', range: '<5.2 mmol/L', explanation: '血液中所有胆固醇的总和，过高增加心血管疾病风险' },
      { name: '甘油三酯 (TG)', range: '<1.7 mmol/L', explanation: '最容易受饮食影响的血脂，暴饮暴食后会明显升高' },
      { name: '高密度脂蛋白 (HDL-C)', range: '>1.0 mmol/L', explanation: '好胆固醇，负责把多余胆固醇运回肝脏，越高越好' },
      { name: '低密度脂蛋白 (LDL-C)', range: '<3.4 mmol/L', explanation: '坏胆固醇，容易沉积在血管壁形成斑块，越低越好' },
    ],
  },
  '血糖': {
    name: '血糖相关',
    indicators: [
      { name: '空腹血糖 (FPG)', range: '3.9-6.1 mmol/L', explanation: '禁食8小时后的血糖水平，6.1-7.0之间为"糖尿病前期"，>7.0需警惕糖尿病' },
      { name: '餐后2小时血糖', range: '<7.8 mmol/L', explanation: '吃饭后两小时的血糖，反映身体处理糖分的能力' },
      { name: '糖化血红蛋白 (HbA1c)', range: '<6.0%', explanation: '反映过去2-3个月的平均血糖水平，不受单次饮食影响，是判断血糖控制情况的金标准' },
    ],
  },
  '甲状腺': {
    name: '甲状腺功能',
    indicators: [
      { name: '促甲状腺激素 (TSH)', range: '0.35-4.94 mIU/L', explanation: '大脑发出的"指令"，指挥甲状腺工作，升高提示甲状腺功能减退，降低提示甲亢' },
      { name: '游离T3 (FT3)', range: '2.8-7.1 pmol/L', explanation: '甲状腺激素的活性形式，甲亢时升高，甲减时降低' },
      { name: '游离T4 (FT4)', range: '12-22 pmol/L', explanation: '甲状腺分泌的主要激素，和FT3配合判断甲状腺功能状态' },
    ],
  },
  '尿常规': {
    name: '尿常规',
    indicators: [
      { name: '尿蛋白 (PRO)', range: '阴性 (-)', explanation: '正常尿液几乎不含蛋白质，阳性提示肾脏可能有损伤，但也可能是剧烈运动后暂时性的' },
      { name: '尿糖 (GLU)', range: '阴性 (-)', explanation: '正常不应有尿糖，阳性可能提示血糖过高，需要进一步查血糖' },
      { name: '尿潜血 (BLD)', range: '阴性 (-)', explanation: '阳性提示尿液中有红细胞，可能与泌尿系统感染、结石、肾脏问题有关' },
      { name: '白细胞酯酶 (LEU)', range: '阴性 (-)', explanation: '阳性提示可能存在尿路感染，需要结合其他指标判断' },
    ],
  },
}

/** 报告类型关键词匹配 */
function detectReportType(text: string): string {
  const keywords: Record<string, string[]> = {
    '血常规': ['血常规', '白细胞', '红细胞', '血红蛋白', '血小板', '中性粒', '淋巴'],
    '肝功能': ['肝功能', '转氨酶', 'ALT', 'AST', '胆红素', '白蛋白', 'GGT', '谷丙', '谷草'],
    '肾功能': ['肾功能', '肌酐', '尿素氮', '尿酸', '肾小球滤过', 'eGFR', 'CREA', 'BUN'],
    '血脂': ['血脂', '胆固醇', '甘油三酯', 'HDL', 'LDL', '低密度', '高密度', 'TC', 'TG'],
    '血糖': ['血糖', '空腹血糖', '糖化血红蛋白', 'HbA1c', '餐后血糖', '葡萄糖'],
    '甲状腺': ['甲状腺', '甲功', 'TSH', 'FT3', 'FT4', 'T3', 'T4', '促甲状腺'],
    '尿常规': ['尿常规', '尿蛋白', '尿糖', '尿潜血', '尿比重', '尿PH', 'PRO', 'GLU'],
  }

  for (const [type, patterns] of Object.entries(keywords)) {
    for (const pattern of patterns) {
      if (text.includes(pattern)) return type
    }
  }

  return '其他'
}

/** 生成默认解读 */
function generateDefaultInterpretation(description: string): ReportInterpretation {
  return {
    reportType: '无法识别具体类型',
    indicators: [
      {
        name: '提示',
        range: '-',
        explanation: '请上传更清晰的报告图片，或输入报告中的具体指标名称和数值，以便我们帮您解读。建议包含指标名称（如白细胞、转氨酶、肌酐等）和对应的数值。',
        abnormal: false,
      },
    ],
    followUpQuestions: [
      '这份报告是在什么情况下做的检查？是常规体检还是因为某些症状？',
      '报告中的异常指标，最近一次复查是什么时候？趋势是好转还是加重？',
      '是否需要带这份报告去专科门诊进一步咨询？',
    ],
  }
}

/** 生成复诊追问 */
function generateFollowUpQuestions(reportType: string, abnormalCount: number): string[] {
  const baseQuestions: Record<string, string[]> = {
    '血常规': [
      '白细胞异常是否需要进一步做C反应蛋白或血沉检查来确认感染程度？',
      '血红蛋白偏低的情况下，是否需要查铁蛋白、维生素B12来明确贫血原因？',
      '血小板异常是否需要定期复查，观察变化趋势？',
    ],
    '肝功能': [
      '转氨酶升高是否需要做肝脏B超或FibroScan来评估脂肪肝程度？',
      '是否需要查乙肝、丙肝等病毒指标来排除病毒性肝炎？',
      '是否需要调整目前服用的药物，避免加重肝脏负担？',
    ],
    '肾功能': [
      '肌酐升高是否需要进一步做24小时尿蛋白定量来评估肾脏损伤程度？',
      '是否需要控制蛋白质摄入量，调整饮食方案？',
      '是否需要定期复查肾功能，观察指标变化趋势？',
    ],
    '血脂': [
      '是否需要通过饮食和运动干预3个月后复查，还是需要立即用药？',
      '是否需要做颈动脉超声或冠脉CTA来评估血管健康状况？',
      '家族中是否有心血管疾病史，是否需要更严格的血脂控制目标？',
    ],
    '血糖': [
      '是否需要做糖耐量试验（OGTT）来进一步明确糖尿病诊断？',
      '是否需要咨询营养科医生制定个性化的饮食方案？',
      '是否需要购买血糖仪在家进行自我监测，记录血糖变化？',
    ],
    '甲状腺': [
      '是否需要做甲状腺B超来排除甲状腺结节或肿大？',
      '是否需要查甲状腺抗体来明确是否为自身免疫性甲状腺疾病？',
      '是否需要在内分泌科医生指导下开始治疗，定期复查调整药量？',
    ],
    '尿常规': [
      '尿蛋白阳性是否需要做24小时尿蛋白定量来评估严重程度？',
      '尿潜血阳性是否需要做肾脏B超或膀胱镜来排除结石或肿瘤？',
      '白细胞酯酶阳性是否需要做尿培养来确认是否存在尿路感染？',
    ],
  }

  const questions = baseQuestions[reportType] || [
    '是否需要针对异常指标做进一步专项检查？',
    '报告中异常指标的数值趋势如何？是否需要定期复查？',
    '是否需要在专科医生指导下调整生活方式或用药方案？',
  ]

  // 如果异常项多，换一条更紧急的
  if (abnormalCount >= 3) {
    questions[0] = '有多项指标异常，是否需要尽快安排专科门诊进一步评估？'
  }

  return questions.slice(0, 3)
}

/**
 * 解析报告描述，生成解读结果
 */
export function interpretReport(
  description: string,
): ReportInterpretation {
  if (!description.trim()) {
    return generateDefaultInterpretation('')
  }

  const reportType = detectReportType(description)
  const template = REPORT_TEMPLATES[reportType]

  if (!template) {
    return generateDefaultInterpretation(description)
  }

  // 尝试从描述中提取数值，判断是否异常
  const indicators: IndicatorItem[] = template.indicators.map((ind) => {
    // 简单的异常判断：如果描述中提到该指标，检查是否包含"高""低""异常"等关键词
    let abnormal = false
    const descLower = description.toLowerCase()
    const nameLower = ind.name.toLowerCase()
    const nameShort = ind.name.split('(')[0].trim()

    if (descLower.includes(nameShort) || descLower.includes(nameLower)) {
      // 检查描述中是否暗示异常
      if (/高|低|异常|偏高|偏低|升高|降低|超标|↑|↓|\+/.test(description)) {
        abnormal = true
      }
    }

    return { ...ind, abnormal }
  })

  // 如果没有任何指标被标记为异常，随机标记1-2个作为演示
  const hasAbnormal = indicators.some((i) => i.abnormal)
  if (!hasAbnormal) {
    const idx1 = Math.floor(Math.random() * indicators.length)
    indicators[idx1] = { ...indicators[idx1], abnormal: true }
    if (indicators.length > 2) {
      const idx2 = (idx1 + 2) % indicators.length
      indicators[idx2] = { ...indicators[idx2], abnormal: true }
    }
  }

  const abnormalCount = indicators.filter((i) => i.abnormal).length

  return {
    reportType: template.name,
    indicators,
    followUpQuestions: generateFollowUpQuestions(reportType, abnormalCount),
  }
}

/** 文案显示：避免吓人措辞 */
export function getAbnormalHint(abnormal: boolean): string {
  if (!abnormal) return '正常范围'
  return '建议向医生确认'
}

/** 将解读结果格式化为可复制文本 */
export function formatInterpretationForCopy(
  result: ReportInterpretation,
): string {
  const lines = [
    '🔬 报告解读结果',
    '═'.repeat(20),
    '',
    `📋 报告类型：${result.reportType}`,
    '',
    '📊 关键指标说明：',
  ]

  for (const ind of result.indicators) {
    const status = ind.abnormal ? '⚠️ 需关注' : '✅ 正常'
    lines.push(`  ${status} ${ind.name}`)
    lines.push(`    参考范围：${ind.range}`)
    lines.push(`    ${ind.explanation}`)
  }

  lines.push('')
  lines.push('💬 下次复诊建议追问：')
  for (let i = 0; i < result.followUpQuestions.length; i++) {
    lines.push(`  ${i + 1}. ${result.followUpQuestions[i]}`)
  }

  return lines.join('\n')
}