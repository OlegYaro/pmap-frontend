import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { formatDateTime } from '@/lib/format'
import { failedTask } from '../../test/admin'
import { COPY_FEEDBACK_MS, FailedTasks } from './FailedTasks'

const TRACE = 'Traceback (most recent call last):\n  ValueError: boom'

/** Puts a clipboard with `writeText` on the navigator (jsdom has none). */
function stubClipboard(writeText: (text: string) => Promise<void>) {
  const mock = vi.fn(writeText)
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: mock }, configurable: true })
  return mock
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'clipboard')
  vi.useRealTimers()
})

const toggle = () => screen.getByRole('button', { name: /^Error trace/ })

it('says "No failed tasks" for an empty list', () => {
  render(<FailedTasks tasks={[]} />)
  expect(screen.getByText('No failed tasks')).toBeInTheDocument()
  expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
})

it('shows territory, failed stage, status and update time of a task', () => {
  render(<FailedTasks tasks={[failedTask({ failed_stage: 'something_new' })]} />)
  const item = screen.getByRole('listitem')
  expect(item).toHaveTextContent('Territory0264')
  expect(item).toHaveTextContent('Failed stagesomething_new')
  expect(item).toHaveTextContent('StatusFailed')
  expect(item).toHaveTextContent(`Updated${formatDateTime('2026-11-07T08:20:00')}`)
})

it('shows readable stage names and a dash for missing values', () => {
  render(<FailedTasks tasks={[failedTask({ territory_code: null, failed_stage: 'cleaning' })]} />)
  const item = screen.getByRole('listitem')
  expect(item).toHaveTextContent('Territory—')
  expect(item).toHaveTextContent('Failed stageCleaning')
})

it('keeps the trace collapsed and expands it in a monospace block', () => {
  render(<FailedTasks tasks={[failedTask()]} />)
  expect(toggle()).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByText(/ValueError: boom/)).not.toBeInTheDocument()

  fireEvent.click(toggle())

  expect(toggle()).toHaveAttribute('aria-expanded', 'true')
  const trace = screen.getByText(/ValueError: boom/)
  expect(trace.tagName).toBe('PRE')
  expect(trace).toHaveClass('font-mono')
  expect(trace.textContent).toBe(TRACE)
  expect(document.getElementById(toggle().getAttribute('aria-controls') ?? '')).toContainElement(
    trace,
  )

  fireEvent.click(toggle())
  expect(toggle()).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByText(/ValueError: boom/)).not.toBeInTheDocument()
})

it('says "No trace recorded" for a task without a trace', () => {
  render(<FailedTasks tasks={[failedTask({ error_trace: null })]} />)
  fireEvent.click(toggle())
  expect(screen.getByText('No trace recorded')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Copy' })).not.toBeInTheDocument()
})

it('copies the trace and reads "Copied" for 2 s', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  const writeText = stubClipboard(() => Promise.resolve())
  render(<FailedTasks tasks={[failedTask()]} />)
  fireEvent.click(toggle())

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
  })

  expect(writeText).toHaveBeenCalledWith(TRACE)
  expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()
  act(() => vi.advanceTimersByTime(COPY_FEEDBACK_MS))
  expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()
})

it('reads "Copy failed" when the clipboard refuses', async () => {
  stubClipboard(() => Promise.reject(new Error('Denied')))
  render(<FailedTasks tasks={[failedTask()]} />)
  fireEvent.click(toggle())

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
  })

  expect(screen.getByRole('button', { name: 'Copy failed' })).toBeInTheDocument()
})

it('reads "Copy failed" when there is no clipboard', async () => {
  render(<FailedTasks tasks={[failedTask()]} />)
  fireEvent.click(toggle())

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
  })

  expect(screen.getByRole('button', { name: 'Copy failed' })).toBeInTheDocument()
})

it('expands each task on its own', () => {
  render(<FailedTasks tasks={[failedTask(), failedTask({ id: 2, territory_code: '1465' })]} />)
  const [first, second] = screen.getAllByRole('button', { name: /^Error trace/ })
  expect(second).toHaveAccessibleName('Error trace of task 1465')
  fireEvent.click(second)
  expect(first).toHaveAttribute('aria-expanded', 'false')
  expect(second).toHaveAttribute('aria-expanded', 'true')
})
