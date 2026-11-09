import { expect, it } from 'vitest'
import { parseExportStatus, parseStartExport } from './exportStatus'

it('accepts each documented status', () => {
  expect(parseExportStatus({ status: 'pending' })).toEqual({ status: 'pending' })
  expect(parseExportStatus({ status: 'done', url: 'https://files.example/e.csv' })).toEqual({
    status: 'done',
    url: 'https://files.example/e.csv',
  })
  expect(parseExportStatus({ status: 'done', url: 'http://files.example/e.csv' }).status).toBe(
    'done',
  )
  expect(parseExportStatus({ status: 'failed', error: 'No rows' })).toEqual({
    status: 'failed',
    error: 'No rows',
  })
  expect(parseExportStatus({ status: 'failed' })).toEqual({ status: 'failed' })
})

it('rejects done without a url', () => {
  expect(() => parseExportStatus({ status: 'done' })).toThrow('Unexpected response')
})

it.each(['javascript:alert(1)', 'data:text/csv,a', 'not a url', ''])(
  'rejects the url %j',
  (url) => {
    expect(() => parseExportStatus({ status: 'done', url })).toThrow('Unexpected response')
  },
)

it('rejects an unknown status and non-objects', () => {
  expect(() => parseExportStatus({ status: 'running' })).toThrow('Unexpected response')
  for (const body of [null, undefined, 'done', 42, [], {}]) {
    expect(() => parseExportStatus(body)).toThrow('Unexpected response')
  }
})

it('reads the id of a started export', () => {
  expect(parseStartExport({ id: 'abc' })).toBe('abc')
  expect(() => parseStartExport({})).toThrow('Unexpected response')
  expect(() => parseStartExport(null)).toThrow('Unexpected response')
})
