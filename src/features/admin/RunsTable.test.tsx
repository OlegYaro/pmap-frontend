import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { formatDateTime } from '@/lib/format'
import type { RunListItem } from '../../api/admin-types'
import { OTHER_RUN_ID, RUN_ID, runListItem } from '../../test/admin'
import { RunsTable } from './RunsTable'

function renderTable(runs: RunListItem[], selectedId: string | null = null) {
  const onSelect = vi.fn()
  render(<RunsTable runs={runs} selectedId={selectedId} onSelect={onSelect} />)
  return { onSelect }
}

/** The cells of the data row at `index` (0 is the first run). */
function cellsOf(index: number) {
  return within(screen.getAllByRole('row')[index + 1]).getAllByRole('cell')
}

it('has the seven columns', () => {
  renderTable([runListItem()])
  expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
    'Run',
    'Trigger',
    'Started',
    'Finished',
    'Progress',
    'Not published',
    'Failed',
  ])
})

it('shows a finished run', () => {
  renderTable([runListItem({ trigger: 'schedule' })])
  const [run, trigger, started, finished, progress, notPublished, failed] = cellsOf(0)

  expect(run).toHaveTextContent('1a2b3c4d')
  expect(run).toHaveAttribute('title', RUN_ID)
  expect(trigger).toHaveTextContent('Scheduled')
  expect(started).toHaveTextContent(formatDateTime('2026-11-07T08:00:00'))
  expect(finished).toHaveTextContent(formatDateTime('2026-11-07T08:30:00'))
  expect(progress).toHaveTextContent('8 / 10')
  const bar = within(progress).getByRole('progressbar', { name: 'Progress of run 1a2b3c4d' })
  expect(bar).toHaveAttribute('aria-valuenow', '80')
  expect(bar.firstElementChild).toHaveStyle({ width: '80%' })
  expect(notPublished).toHaveTextContent('1')
  expect(failed).toHaveTextContent('1')
  expect(failed).toHaveAttribute('data-problem', 'true')
  expect(failed).toHaveClass('text-destructive')
  expect(failed.querySelector('svg')).not.toBeNull()
})

it('shows "Manual" and an unknown trigger as it is', () => {
  renderTable([runListItem(), runListItem({ run_id: OTHER_RUN_ID, trigger: 'api' })])
  expect(cellsOf(0)[1]).toHaveTextContent('Manual')
  expect(cellsOf(1)[1]).toHaveTextContent('api')
})

it('shows "Running" for a run without a finish time', () => {
  renderTable([runListItem({ finished_at: null })])
  expect(cellsOf(0)[3]).toHaveTextContent('Running')
})

it('shows an empty bar for a run without tasks and no failure marker', () => {
  renderTable([runListItem({ total: 0, done: 0, not_published: 0, failed: 0 })])
  const cells = cellsOf(0)
  expect(cells[4]).toHaveTextContent('0 / 0')
  const bar = within(cells[4]).getByRole('progressbar')
  expect(bar).toHaveAttribute('aria-valuenow', '0')
  expect(bar.firstElementChild).toHaveStyle({ width: '0%' })
  expect(cells[6]).not.toHaveAttribute('data-problem')
  expect(cells[6]).not.toHaveClass('text-destructive')
  expect(cells[6].querySelector('svg')).toBeNull()
})

it('keeps the server order', () => {
  renderTable([runListItem({ run_id: OTHER_RUN_ID }), runListItem()])
  expect(cellsOf(0)[0]).toHaveTextContent('9f8e7d6c')
  expect(cellsOf(1)[0]).toHaveTextContent('1a2b3c4d')
})

it('selects a run with its button and marks the selected row', () => {
  const { onSelect } = renderTable(
    [runListItem(), runListItem({ run_id: OTHER_RUN_ID })],
    OTHER_RUN_ID,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Details for run 1a2b3c4d' }))
  expect(onSelect).toHaveBeenCalledWith(RUN_ID)

  const rows = screen.getAllByRole('row')
  expect(rows[1]).not.toHaveAttribute('aria-current')
  expect(rows[2]).toHaveAttribute('aria-current', 'true')
})
