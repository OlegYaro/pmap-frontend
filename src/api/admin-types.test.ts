import { expect, it } from 'vitest'
import { runListItem, runStatus } from '../test/admin'
import {
  parseRunList,
  parseRunStarted,
  parseRunStatus,
  runListItemSchema,
  runStatusSchema,
  UNEXPECTED_RESPONSE,
} from './admin-types'

it('accepts a list item and ignores extra fields', () => {
  const item = runListItem()
  expect(parseRunList([{ ...item, extra: 'ignored' }])).toEqual([item])
})

it('accepts an unfinished run with finished_at null', () => {
  const item = runListItem({ finished_at: null })
  expect(runListItemSchema.parse(item).finished_at).toBeNull()
})

it('accepts a status with excluded counts by reason', () => {
  const status = runStatus({ excluded: { package_deal: 20, something_new: 1 } })
  expect(parseRunStatus(status).excluded).toEqual({ package_deal: 20, something_new: 1 })
})

it('accepts a status with no start time and no failed tasks', () => {
  const status = runStatus({ started_at: null, failed_tasks: [], excluded: {} })
  expect(runStatusSchema.safeParse(status).success).toBe(true)
})

it('rejects a string where a number is expected', () => {
  expect(() => parseRunList([{ ...runListItem(), total: '10' }])).toThrow(UNEXPECTED_RESPONSE)
  expect(() => parseRunStatus({ ...runStatus(), excluded: { non_market: '5' } })).toThrow(
    UNEXPECTED_RESPONSE,
  )
})

it('rejects a body that is not a list, or a run without an id', () => {
  expect(() => parseRunList({})).toThrow(UNEXPECTED_RESPONSE)
  expect(() => parseRunList([{ ...runListItem(), run_id: undefined }])).toThrow(UNEXPECTED_RESPONSE)
})

it('accepts unknown stage, status and trigger values', () => {
  const status = runStatus({ current_stage: 'validating' })
  status.failed_tasks[0].status = 'paused'
  expect(parseRunStatus(status).current_stage).toBe('validating')
  expect(parseRunStatus(status).failed_tasks[0].status).toBe('paused')
  expect(parseRunList([runListItem({ trigger: 'api' })])[0].trigger).toBe('api')
})

it('parses the started run and rejects a body without run_id', () => {
  expect(parseRunStarted({ run_id: 'r1' })).toEqual({ run_id: 'r1' })
  expect(() => parseRunStarted({})).toThrow(UNEXPECTED_RESPONSE)
  expect(() => parseRunStarted(undefined)).toThrow(UNEXPECTED_RESPONSE)
})
