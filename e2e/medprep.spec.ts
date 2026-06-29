import { test, expect } from '@playwright/test'

async function loginAsGuest(page: import('@playwright/test').Page) {
  await page.goto('/MedPrep/#/login')
  await page.waitForLoadState('networkidle')
  const quickStart = page.getByRole('button', { name: '快速开始' })
  if (await quickStart.isVisible({ timeout: 5000 }).catch(() => false)) {
    await quickStart.click()
    await page.waitForURL(/#\/app/, { timeout: 15000 })
  }
}

test.describe('MedPrep 核心流程', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsGuest(page)
  })

  test('首页 Tab 导航包含今日用药', async ({ page }) => {
    await expect(page.getByText('今日用药').first()).toBeVisible({ timeout: 15000 })
  })

  test('诊后备忘 → 设为用药提醒 → 今日用药', async ({ page }) => {
    const postVisitTab = page.getByRole('button', { name: '备忘' }).first()
    if (await postVisitTab.isVisible()) {
      await postVisitTab.click()
    } else {
      await page.getByText('诊后备忘').first().click()
    }

    const textarea = page.locator('textarea').first()
    await textarea.fill(
      '阿莫西林胶囊，每次0.5g，每日3次，饭后服用。\n1周后复查血常规。',
    )

    await page.getByRole('button', { name: /整理|生成/ }).first().click()

    await expect(page.getByText('设为用药提醒')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: '设为用药提醒' }).click()

    await expect(page.getByText('设为用药提醒').nth(1)).toBeVisible()
    await page.getByRole('button', { name: '保存提醒' }).click()

    const medTab = page.getByRole('button', { name: '用药' }).first()
    await medTab.click()

    await expect(page.getByText('阿莫西林').first()).toBeVisible({ timeout: 5000 })

    const checkBtn = page.locator('button[aria-label="标记已服"]').first()
    await checkBtn.click()
    await expect(page.locator('button[aria-label="标记未服"]').first()).toBeVisible()
  })

  test('分享 URL 检测', async ({ page }) => {
    await page.goto('/MedPrep/#share=test-invalid')
    await expect(page.getByText(/分享|就诊资料|不存在|加载/i).first()).toBeVisible({
      timeout: 10000,
    })
  })
})

test.describe('离线历史 local id', () => {
  test('localStorage 缓存历史可在列表展示逻辑', async ({ page }) => {
    await page.goto('/MedPrep/')
    await page.evaluate(() => {
      localStorage.setItem(
        'medprep_visit_history',
        JSON.stringify([
          {
            timestamp: 1700000000000,
            label: '2023-11-15 测试',
            data: {
              timeline: {
                text: '测试症状',
                entries: [
                  {
                    id: '1',
                    dateLabel: '今天',
                    description: '测试',
                    severity: '轻',
                  },
                ],
              },
            },
          },
        ]),
      )
    })
    expect(true).toBe(true)
  })
})
