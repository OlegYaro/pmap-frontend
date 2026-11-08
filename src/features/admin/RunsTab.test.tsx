import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { UNEXPECTED_RESPONSE } from '../../api/admin-types'
import { inTurn, RUN_ID, runListItem, stubAdminApi } from '../../test/admin'
import { callsTo, deferred, jsonResponse } from '../../test/http'
import { renderWithRouter } from '../../test/render'
import { pickOption } from '../../test/select'
import { RunsTab } from './RunsTab'

const RUNS = '/api/admin/runs'

const listRequests = (mock: ReturnType<typeof stubAdminApi>) =>
  callsTo(mock, RUNS).filter((request) => request.method === 'GET')

const limitOf = (request: Request) => new URL(request.url).searchParams.get('limit')

function renderTab(path = '/admin') {
  return renderWithRouter(<RunsTab />, { path })
}

it('shows the runs in a table, requesting 20 by default', async () => {
  const mock = stubAdminApi()
  renderTab()
  expect(await screen.findByRole('table')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Details for run 1a2b3c4d' })).toBeInTheDocument()
  expect(limitOf(listRequests(mock)[0])).toBe('20')
  expect(screen.getByRole('combobox', { name: 'Show' })).toHaveTextContent('20')
})

it('shows a skeleton while loading', () => {
  const held = deferred<Response>()
  stubAdminApi({ runs: () => held.promise })
  renderTab()
  expect(screen.getByRole('status')).toHaveTextContent('Loading')
  expect(screen.queryByRole('table')).not.toBeInTheDocument()
})

it('requests 50 runs and writes the limit into the URL', async () => {
  const mock = stubAdminApi()
  const { router } = renderTab()
  await screen.findByRole('table')

  await pickOption(screen.getByRole('combobox', { name: 'Show' }), '50')

  await waitFor(() => expect(listRequests(mock)).toHaveLength(2))
  expect(limitOf(listRequests(mock)[1])).toBe('50')
  expect(router.state.location.search).toBe('?limit=50')
  expect(router.state.historyAction).toBe('PUSH')
})

it('requests 20 for a limit in the URL that is not offered', async () => {
  const mock = stubAdminApi()
  renderTab('/admin?limit=500')
  await screen.findByRole('table')
  expect(limitOf(listRequests(mock)[0])).toBe('20')
  expect(screen.getByRole('combobox', { name: 'Show' })).toHaveTextContent('20')
})

it('says "No runs yet" for an empty list', async () => {
  stubAdminApi({ runs: () => jsonResponse(200, []) })
  renderTab()
  expect(await screen.findByText('No runs yet')).toBeInTheDocument()
  expect(screen.queryByRole('table')).not.toBeInTheDocument()
})

it('shows the error with Retry, which requests the list again', async () => {
  const mock = stubAdminApi({
    runs: inTurn(
      () => jsonResponse(502, { detail: 'Bad gateway' }),
      () => jsonResponse(200, [runListItem()]),
    ),
  })
  renderTab()

  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('Could not load the runs: Bad gateway')
  expect(screen.queryByRole('table')).not.toBeInTheDocument()

  fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }))

  expect(await screen.findByRole('table')).toBeInTheDocument()
  expect(listRequests(mock)).toHaveLength(2)
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

it('shows the error state for a malformed response', async () => {
  stubAdminApi({ runs: () => jsonResponse(200, [{ ...runListItem(), total: '10' }]) })
  renderTab()
  expect(await screen.findByRole('alert')).toHaveTextContent(UNEXPECTED_RESPONSE)
  expect(screen.queryByRole('table')).not.toBeInTheDocument()
})

it('requests the list again with Refresh and keeps the rows when that fails', async () => {
  const mock = stubAdminApi({
    runs: inTurn(
      () => jsonResponse(200, [runListItem()]),
      () => jsonResponse(502, { detail: 'Bad gateway' }),
    ),
  })
  renderTab()
  await screen.findByRole('table')

  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Bad gateway')
  expect(listRequests(mock)).toHaveLength(2)
  expect(screen.getByRole('button', { name: 'Details for run 1a2b3c4d' })).toBeInTheDocument()
})

it('selects a run, keeps it in the URL and shows its detail', async () => {
  const mock = stubAdminApi()
  const { router } = renderTab('/admin?limit=50')
  expect(await screen.findByText('Select a run to see its details')).toBeInTheDocument()

  await act(async () => {
    fireEvent.click(await screen.findByRole('button', { name: 'Details for run 1a2b3c4d' }))
  })

  expect(router.state.location.search).toBe(`?limit=50&run=${RUN_ID}`)
  expect(router.state.historyAction).toBe('REPLACE')
  expect(await screen.findByText(RUN_ID)).toBeInTheDocument()
  expect(callsTo(mock, `${RUNS}/${RUN_ID}`)).toHaveLength(1)
  expect(screen.getAllByRole('row')[1]).toHaveAttribute('aria-current', 'true')
})
