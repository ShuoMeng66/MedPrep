import { describe, it, expect } from 'node:test'
import assert from 'node:assert/strict'
import {
  inferDefaultTimes,
  getTodayDoses,
  createReminderFromMedication,
  isReminderActiveOnDate,
} from '../src/services/medicationReminderService.ts'
import { inferDueDateFromFollowUp, daysUntil } from '../src/services/followUpReminderService.ts'

describe('medicationReminderService', () => {
  it('inferDefaultTimes parses 每日3次', () => {
    const times = inferDefaultTimes('每次0.5g，每日3次', '饭后服用')
    assert.deepEqual(times, ['08:30', '12:30', '19:00'])
  })

  it('getTodayDoses returns doses for active reminder', () => {
    const reminder = createReminderFromMedication(
      { name: '阿莫西林', dosage: '每日2次', notes: '' },
      { times: ['08:00', '20:00'] },
    )
    reminder.startDate = '2025-07-01'
    const now = new Date('2025-07-01T10:00:00')
    const doses = getTodayDoses([reminder], now)
    assert.equal(doses.length, 2)
    assert.equal(doses[0].reminder.name, '阿莫西林')
  })

  it('isReminderActiveOnDate respects endDate', () => {
    const reminder = createReminderFromMedication(
      { name: '测试', dosage: '', notes: '' },
      { times: ['08:00'] },
    )
    reminder.endDate = '2025-06-01'
    assert.equal(isReminderActiveOnDate(reminder, '2025-07-01'), false)
  })
})

describe('followUpReminderService', () => {
  it('inferDueDateFromFollowUp parses 1周', () => {
    const base = new Date('2025-07-01T12:00:00')
    const date = inferDueDateFromFollowUp({ condition: '1周后', items: '复查' }, base)
    assert.equal(date, '2025-07-08')
  })

  it('daysUntil calculates correctly', () => {
    const now = new Date('2025-07-01T12:00:00')
    assert.equal(daysUntil('2025-07-03', now), 2)
  })
})
