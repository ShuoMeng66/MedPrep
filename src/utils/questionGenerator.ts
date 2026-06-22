export type QuestionCategory = '病因排查' | '检查建议' | '用药注意' | '复诊安排'

export interface QuestionItem {
  id: string
  category: QuestionCategory
  question: string
}

/** 按科室分类的问题模板 */
const CATEGORY_TEMPLATES: Record<QuestionCategory, string[]> = {
  '病因排查': [
    '根据我的症状，最可能是什么原因引起的？',
    '这种情况会不会是某种慢性病的早期表现？',
    '我的症状和家族遗传有关系吗？需要做基因检测吗？',
    '我最近的生活习惯（饮食/作息/压力）会不会是诱因？',
  ],
  '检查建议': [
    '我需要做哪些检查来确诊？大概需要多长时间？',
    '这些检查是否需要空腹或其他特殊准备？',
    '检查结果出来后，哪些指标需要重点关注？',
    '是否需要做影像学检查（如CT、B超、X光等）？',
  ],
  '用药注意': [
    '目前针对我的症状，有哪些常用的治疗方案？',
    '如果需要用药，大概需要服用多长时间？',
    '这些药物有什么常见的副作用需要注意？',
    '用药期间饮食和生活上有什么需要特别注意的吗？',
    '我目前在服用的其他药物会不会有冲突？',
  ],
  '复诊安排': [
    '治疗期间需要多久复查一次？',
    '出现什么情况需要立即来医院，而不是等到复诊？',
    '如果症状缓解了，还需要继续治疗吗？',
    '治疗后预计多久可以看到效果？',
  ],
}

/** 按科室的针对性问题 */
const DEPARTMENT_QUESTIONS: Record<string, string[]> = {
  '内科': [
    '需要做血常规和生化检查吗？',
    '我的症状是否可能与内脏器官有关？',
    '是否需要做心电图或超声检查？',
  ],
  '骨科': [
    '需要拍X光片还是做核磁共振？',
    '是否需要限制活动或卧床休息？',
    '康复期间适合做哪些运动？',
  ],
  '皮肤科': [
    '需要做过敏原检测吗？',
    '这种情况会传染吗？',
    '日常护肤和清洁有什么需要注意的？',
  ],
  '妇科': [
    '需要做B超或激素水平检查吗？',
    '我的症状与月经周期有关系吗？',
    '是否会影响生育或需要特殊避孕措施？',
  ],
  '儿科': [
    '孩子的症状与同龄人相比严重吗？',
    '需要调整饮食或作息吗？',
    '是否需要休学或避免体育课？',
  ],
  '其他': [
    '根据我的症状，您建议挂哪个专科更合适？',
    '是否需要转诊到其他科室进一步检查？',
    '有没有推荐的专家或专科医院？',
  ],
}

/** 基于症状关键词的补充问题 */
const SYMPTOM_QUESTIONS: Record<string, string[]> = {
  '头疼|头痛|头晕|眩晕': [
    '头疼的频率和持续时间是否需要特别关注？',
    '是否需要做脑部CT或磁共振检查？',
  ],
  '发烧|发热|体温|低烧|高烧': [
    '体温超过多少度需要立即就医？',
    '是否需要做血常规和C反应蛋白检查？',
  ],
  '咳嗽|咳痰|咳血|嗓子|喉咙|咽': [
    '咳嗽持续多久需要做进一步检查？',
    '是否需要做胸部X光或肺功能检查？',
  ],
  '恶心|呕吐|反胃|想吐|吐': [
    '这种情况是否与饮食有关？需要做胃镜吗？',
    '呕吐会不会导致脱水或电解质紊乱？',
  ],
  '腹泻|拉肚子|肚子疼|腹痛|胃痛|腹部|肠胃': [
    '需要做大便常规或肠镜检查吗？',
    '这种情况需要禁食或调整饮食吗？',
  ],
  '关节|膝盖|腰|背|颈椎|肩膀|胳膊|腿|手腕|脚': [
    '需要做关节X光或磁共振检查吗？',
    '能否进行物理治疗或康复训练？',
  ],
  '失眠|睡不好|睡不着|睡眠|多梦': [
    '是否需要做睡眠监测检查？',
    '是否需要心理咨询或药物治疗？',
  ],
  '心慌|心跳|胸闷|气短|呼吸困难|喘': [
    '需要做心电图或心脏彩超吗？',
    '会不会是心脏方面的问题？',
  ],
  '皮疹|过敏|痒|红肿|起包|疹子': [
    '需要做过敏原检测吗？',
    '是否为某种食物或药物过敏？',
  ],
  '乏力|疲劳|没精神|累|困倦|无力': [
    '需要查血常规、甲状腺功能或血糖吗？',
    '是否与贫血或营养不良有关？',
  ],
}

/**
 * 根据症状描述和科室生成问诊问题
 */
export function generateQuestions(
  symptoms: string,
  department: string,
): QuestionItem[] {
  const questions: QuestionItem[] = []
  const prefix = Date.now().toString(36)
  let idx = 0

  function add(category: QuestionCategory, question: string) {
    questions.push({ id: `${prefix}-${idx++}`, category, question })
  }

  // 1. 从每个分类中选问题
  for (const category of Object.keys(CATEGORY_TEMPLATES) as QuestionCategory[]) {
    const templates = CATEGORY_TEMPLATES[category]
    // 每个分类取 2-3 个问题
    const count = category === '用药注意' || category === '病因排查' ? 3 : 2
    for (let i = 0; i < Math.min(count, templates.length); i++) {
      add(category, templates[i])
    }
  }

  // 2. 添加科室针对性问题
  const deptQuestions = DEPARTMENT_QUESTIONS[department] || DEPARTMENT_QUESTIONS['其他']
  for (const q of deptQuestions.slice(0, 2)) {
    add('检查建议', q)
  }

  // 3. 基于症状关键词添加补充问题
  for (const [pattern, qs] of Object.entries(SYMPTOM_QUESTIONS)) {
    if (new RegExp(pattern).test(symptoms)) {
      for (const q of qs.slice(0, 1)) {
        const category = q.includes('检查') || q.includes('CT') || q.includes('B超') || q.includes('X光') || q.includes('磁共振')
          ? '检查建议'
          : q.includes('药') || q.includes('治疗')
            ? '用药注意'
            : '病因排查'
        add(category, q)
      }
    }
  }

  // 确保总数在 8-12 条
  return questions.slice(0, 12)
}

/**
 * 将问题清单格式化为可导出的文本
 */
export function formatQuestionsForExport(
  questions: QuestionItem[],
  checkedIds: Set<string>,
): string {
  const categoryOrder: QuestionCategory[] = ['病因排查', '检查建议', '用药注意', '复诊安排']
  const grouped: Record<QuestionCategory, QuestionItem[]> = {} as Record<QuestionCategory, QuestionItem[]>

  for (const cat of categoryOrder) {
    grouped[cat] = questions.filter((q) => q.category === cat)
  }

  const lines: string[] = ['📝 问诊清单', '═'.repeat(20)]

  for (const cat of categoryOrder) {
    const items = grouped[cat]
    if (items.length === 0) continue
    lines.push('')
    lines.push(`【${cat}】`)
    for (const item of items) {
      const checked = checkedIds.has(item.id) ? '☑' : '☐'
      lines.push(`${checked} ${item.question}`)
    }
  }

  return lines.join('\n')
}