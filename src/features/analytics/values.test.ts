import { expect, it } from 'vitest'
import { formatNumber } from '@/lib/format'
import { summaryResponse } from '../../test/analytics'
import { changeDirection, isEmptySummary, NOT_AVAILABLE, orNotAvailable } from './values'

it('shows "n/a" for a missing value and formats everything else', () => {
  expect(NOT_AVAILABLE).toBe('n/a')
  expect(orNotAvailable(null, formatNumber)).toBe('n/a')
  expect(orNotAvailable(undefined, formatNumber)).toBe('n/a')
  expect(orNotAvailable(0, formatNumber)).toBe('0')
})

it('takes the direction from the shown, rounded value', () => {
  expect(changeDirection(10)).toBe('up')
  expect(changeDirection(-3.4)).toBe('down')
  expect(changeDirection(0)).toBe('none')
  expect(changeDirection(0.04)).toBe('none')
  expect(changeDirection(-0.04)).toBe('none')
  expect(changeDirection(0.05)).toBe('up')
  expect(changeDirection(-0.05)).toBe('down')
})

it('treats a summary without transactions or groups as empty', () => {
  expect(isEmptySummary(summaryResponse({ count: 0, rooms: [], floors: [] }))).toBe(true)
  expect(isEmptySummary(summaryResponse())).toBe(false)
  expect(isEmptySummary(summaryResponse({ median: null, count: 3, rooms: [], floors: [] }))).toBe(
    false,
  )
})
