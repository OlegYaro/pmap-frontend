import { fireEvent, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatDateTime } from '@/lib/format'
import { UNEXPECTED_RESPONSE } from '../../api/admin-types'
import { advance, fakePollTimers, inTurn, RUN_ID, runStatus, stubAdminApi } from '../../test/admin'
import { callsTo, deferred, jsonResponse } from '../../test/http'
import { renderWithRouter } from '../../test/render'
import { RunDetail } from './RunDetail'

const DETAIL = `/api/admin/runs/${RUN_ID}`

function renderDetail(runId: string | null = RUN_ID, running = false) {
  return renderWithRouter(<RunDetail runId={runId} running={running} />)
}

/** The value shown under the counter `label`. */
function counter(label: string) {
  const term = screen.getAllByRole('term').find((element) => element.textContent === label)
  return term?.nextElementSibling?.textContent
}

it('shows the run id, the start time and every counter', async () => {
  stubAdminApi()
  renderDetail()
  expect(await screen.findByText(RUN_ID)).toBeInTheDocument()
  expect(screen.getByText(`Started ${formatDateTime('2026-11-07T08:00:00')}`)).toBeInTheDocument()
  expect(
    Object.fromEntries(
      [
        'Total',
        'Downloaded',
        'Assigned',
        'Cleaned',
        'Loaded',
        'Not published',
        'Failed',
        'In progress',
        'Inserted',
        'Updated',
      ].map((label) => [label, counter(label)]),
    ),
  ).toEqual({
    Total: '10',
    Downloaded: '10',
    Assigned: '9',
    Cleaned: '9',
    Loaded: '8',
    'Not published': '1',
    Failed: '1',
    'In progress': '0',
    Inserted: '120',
    Updated: '30',
  })
  expect(screen.queryByText(/Current stage/)).not.toBeInTheDocument()
})

it('shows a dash for a missing start time and the current stage when there is one', async () => {
  stubAdminApi({
    run: () => jsonResponse(200, runStatus({ started_at: null, current_stage: 'cleaning' })),
  })
  renderDetail()
  expect(await screen.findByText(/^Started —/)).toHaveTextContent('Current stage Cleaning')
})

it('lists the excluded rows largest first with relative bars', async () => {
  stubAdminApi({
    run: () =>
      jsonResponse(
        200,
        runStatus({ excluded: { non_market: 5, package_deal: 20, odd_reason: 10 } }),
      ),
  })
  renderDetail()
  const section = await screen.findByRole('region', { name: 'Excluded rows' })
  const items = within(section).getAllByRole('listitem')
  expect(items.map((item) => item.textContent)).toEqual([
    'Package deal20',
    'odd_reason10',
    'Non-market5',
  ])
  const widths = items.map((item) => item.querySelector<HTMLElement>('[style]')?.style.width)
  expect(widths).toEqual(['100%', '50%', '25%'])
})

it('says when nothing was excluded and nothing failed', async () => {
  stubAdminApi({ run: () => jsonResponse(200, runStatus({ excluded: {}, failed_tasks: [] })) })
  renderDetail()
  expect(await screen.findByText('No rows were excluded')).toBeInTheDocument()
  expect(
    within(screen.getByRole('region', { name: 'Failed tasks' })).getByText('No failed tasks'),
  ).toBeInTheDocument()
})

it('lists the failed tasks', async () => {
  stubAdminApi()
  renderDetail()
  const section = await screen.findByRole('region', { name: 'Failed tasks' })
  expect(within(section).getByRole('button', { name: /^Error trace/ })).toBeInTheDocument()
})

it('asks to select a run and requests nothing without one', async () => {
  const mock = stubAdminApi()
  renderDetail(null)
  expect(screen.getByText('Select a run to see its details')).toBeInTheDocument()
  await new Promise((resolve) => setTimeout(resolve, 10))
  expect(mock).not.toHaveBeenCalled()
})

it('shows a skeleton while loading', () => {
  const held = deferred<Response>()
  stubAdminApi({ run: () => held.promise })
  renderDetail()
  expect(screen.getByRole('status')).toHaveTextContent('Loading')
})

it('says the run was not found for a 404', async () => {
  stubAdminApi({ run: () => jsonResponse(404, { detail: 'Run not found' }) })
  renderDetail()
  expect(await screen.findByText('Run not found')).toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

it('shows an error with Retry, which requests the run again', async () => {
  const mock = stubAdminApi({
    run: inTurn(
      () => jsonResponse(500, { detail: 'Boom' }),
      () => jsonResponse(200, runStatus()),
    ),
  })
  renderDetail()
  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('Could not load the run: Boom')

  fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }))

  expect(await screen.findByText(RUN_ID)).toBeInTheDocument()
  expect(callsTo(mock, DETAIL)).toHaveLength(2)
})

it('treats a malformed body as an error', async () => {
  stubAdminApi({ run: () => jsonResponse(200, { ...runStatus(), total: 'ten' }) })
  renderDetail()
  expect(await screen.findByRole('alert')).toHaveTextContent(UNEXPECTED_RESPONSE)
})

describe('refresh', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('requests the detail again every 5 s while the run is unfinished', async () => {
    fakePollTimers()
    const mock = stubAdminApi()
    renderDetail(RUN_ID, true)
    await advance(0)
    expect(callsTo(mock, DETAIL)).toHaveLength(1)
    await advance(5_000)
    expect(callsTo(mock, DETAIL)).toHaveLength(2)
  })

  it('keeps the run after a failed refresh, with the error above it', async () => {
    fakePollTimers()
    stubAdminApi({
      run: inTurn(
        () => jsonResponse(200, runStatus()),
        () => jsonResponse(502, { detail: 'Bad gateway' }),
      ),
    })
    renderDetail(RUN_ID, true)
    await advance(0)
    await advance(5_000)
    expect(screen.getByRole('alert')).toHaveTextContent('Could not refresh the run: Bad gateway')
    expect(screen.getByText(RUN_ID)).toBeInTheDocument()
    expect(counter('Total')).toBe('10')
  })

  it('does not request a finished run again', async () => {
    fakePollTimers()
    const mock = stubAdminApi()
    renderDetail(RUN_ID, false)
    await advance(30_000)
    expect(callsTo(mock, DETAIL)).toHaveLength(1)
  })
})
