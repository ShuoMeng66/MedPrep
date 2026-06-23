/**
 * MedPrep AI API 代理 — Cloudflare Worker
 *
 * 部署方式：
 *   1. 安装 wrangler: npm install -g wrangler
 *   2. 登录: wrangler login
 *   3. 设置 API Key: wrangler secret put BAILIAN_API_KEY
 *   4. 部署: wrangler deploy
 *
 * 环境变量：
 *   BAILIAN_API_KEY — 百炼大模型 API Key
 */

const BAILIAN_API_BASE = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'

const SYSTEM_PROMPT = `你是「陪诊锦囊 MedPrep」的 AI 助手，定位是就诊信息整理工具。
你必须遵守以下原则：
1. 只整理用户输入的内容，绝不编造症状、诊断或用药建议
2. 将非专业口语转化为结构化医学表述，但保留用户原意
3. 输出严格 JSON 格式，不包含 markdown 标记

根据 mode 参数输出不同 JSON：

mode=symptom（症状时间线整理）:
{
  "clinicalSummary": ["分条整理的结构化表述，每条一句话"],
  "thirtySecondVersion": "适合诊间朗读的短段落，约150字，口语化但专业",
  "structuredTimeline": [
    {"dateLabel": "时间标签", "description": "医学术语表述", "severity": "轻/中/重"}
  ]
}

mode=postVisit（诊后备忘整理）:
{
  "doctorSummary": ["医生告知摘要，结构化分条"],
  "medications": [{"name": "药品名", "dosage": "用法用量", "notes": "注意事项"}],
  "followUps": [{"condition": "时间/条件", "items": "检查项"}],
  "warnings": ["观察提醒，需就医的情况"]
}

mode=report（报告解读增强）:
{
  "plainExplanation": "用通俗语言解释报告含义，引用用户提供的数值，不虚构指标",
  "keyPoints": ["关键发现，基于用户提供的数值"],
  "followUpQuestions": ["建议向医生确认的问题，基于用户提供的数值"]
}`

export default {
  async fetch(request, env, ctx) {
    // CORS 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: '仅支持 POST 请求' }, 405)
    }

    const apiKey = env.BAILIAN_API_KEY || 'sk-ws-H.RPYHHPL.Ul1h.MEYCIQCt5lN0p6Acwq38QzlFdcUeEAnigF-3jk39x9botoe8PwIhALMcqB_AxQMLmfUa5wCe0dnPMP4tdaXN9_DeVyhX4FIO'
    if (!apiKey) {
      return jsonResponse({ error: '服务未配置 API Key' }, 500)
    }

    let body
    try {
      body = await request.json()
    } catch {
      return jsonResponse({ error: '请求体格式错误' }, 400)
    }

    const { userInput, department, mode } = body

    if (!userInput || !mode) {
      return jsonResponse({ error: '缺少必要参数 userInput 或 mode' }, 400)
    }

    const validModes = ['symptom', 'postVisit', 'report']
    if (!validModes.includes(mode)) {
      return jsonResponse({ error: `mode 必须为 ${validModes.join('/')}` }, 400)
    }

    const userMessage = department
      ? `科室：${department}\n用户输入：${userInput}`
      : `用户输入：${userInput}`

    try {
      const response = await fetch(BAILIAN_API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'qwen3.7-plus',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.3,
          max_tokens: 2000,
          response_format: { type: 'json_object' },
        }),
        signal: AbortSignal.timeout(25000),
      })

      if (!response.ok) {
        const errText = await response.text()
        console.error('Bailian API error:', response.status, errText)

        let errMsg = 'AI 服务暂时不可用，请稍后重试'
        try {
          const errJson = JSON.parse(errText)
          if (errJson.error?.message) {
            errMsg = errJson.error.message
          }
          if (errJson.error?.code === 'AllocationQuota.FreeTierOnly') {
            errMsg = '百炼免费额度已用完，请在百炼控制台关闭「仅使用免费额度」或充值'
          }
        } catch {}

        if (response.status === 429) {
          return jsonResponse({ error: '请求过于频繁，请稍后重试', retryable: true }, 429)
        }
        return jsonResponse({ error: errMsg, retryable: true }, 502)
      }

      const result = await response.json()
      const content = result.choices?.[0]?.message?.content

      if (!content) {
        console.error('Empty response from Bailian:', JSON.stringify(result))
        return jsonResponse({ error: 'AI 返回为空，请重试', retryable: true }, 502)
      }

      let parsed
      try {
        parsed = JSON.parse(content)
      } catch {
        console.error('JSON parse error:', content)
        return jsonResponse({ error: 'AI 返回格式异常，请重试', retryable: true }, 502)
      }

      return jsonResponse(parsed, 200)
    } catch (err) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        return jsonResponse({ error: 'AI 响应超时，请重试', retryable: true }, 504)
      }
      console.error('Worker error:', err)
      return jsonResponse({ error: '服务内部错误，请稍后重试', retryable: true }, 500)
    }
  },
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}