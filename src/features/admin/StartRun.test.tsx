import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { adminApi, inTurn, OTHER_RUN_ID, runListItem, stubAdminApi } from '../../test/admin'
import { callsTo, deferred, jsonResponse, stubFetch } from '../../test/http'
import { renderWithRouter } from '../../test/render'
import { RunsTab } from './RunsTab'

const RUNS = '/api/admin/runs'

const posts = (mock: ReturnType<typeof stubAdminApi>) =>
  callsTo(mock, RUNS).filter((request) => request.method === 'POST')
const gets = (mock: ReturnType<typeof stubAdminApi>) =>
  callsTo(mock, RUNS).filter((request) => request.method === 'GET')

const scope = () => screen.getByRole('button', { name: /^Sync scope/ })
const startButton = () => screen.getByRole('button', { name: 'Start sync' })

/** Renders the runs tab and waits for the runs and the territories. */
async function renderTab() {
  const view = renderWithRouter(<RunsTab />, { path: '/admin' })
  await screen.findByRole('table')
  return view
}

async function choosePowiat(search: string, name: string) {
  fireEvent.click(scope())
  const input = await screen.findByRole('combobox', { name: 'Search powiats' })
  fireEvent.change(input, { target: { value: search } })
  await act(async () => {
    fireEvent.click(await screen.findByRole('option', { name }))
  })
}

async function openDialog() {
  fireEvent.click(startButton())
  return screen.findByRole('dialog', { name: 'Start sync' })
}

it('starts with "All of Poland" and an enabled button', async () => {
  stubAdminApi()
  await renderTab()
  expect(scope()).toHaveAccessibleName('Sync scope All of Poland')
  expect(startButton()).toBeEnabled()
  expect(startButton()).not.toHaveAttribute('aria-disabled')
})

it('offers only "All of Poland" while the territories load', async () => {
  const held = deferred<Response>()
  const admin = adminApi()
  stubFetch((request) =>
    new URL(request.url).pathname === '/api/territories' ? held.promise : admin(request),
  )
  await renderTab()
  fireEvent.click(scope())
  const options = await screen.findAllByRole('option')
  expect(options.map((option) => option.textContent)).toEqual(['All of Poland'])
})

it('finds a powiat by search without diacritics', async () => {
  stubAdminApi()
  await renderTab()
  await choosePowiat('lodz', 'Łódź')
  expect(scope()).toHaveAccessibleName('Sync scope Łódź')
})

it('closes with Cancel or Escape without a request', async () => {
  const mock = stubAdminApi()
  await renderTab()

  const dialog = await openDialog()
  expect(dialog).toHaveTextContent('Start a sync for all of Poland?')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

  await openDialog()
  fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

  expect(posts(mock)).toHaveLength(0)
})

it('names the powiat in the dialog and sends its code', async () => {
  const mock = stubAdminApi()
  await renderTab()
  await choosePowiat('0264', 'wrocławski')

  const dialog = await openDialog()
  expect(dialog).toHaveTextContent('Start a sync for wrocławski (0264)?')
  await act(async () => {
    fireEvent.click(within(dialog).getByRole('button', { name: 'Start' }))
  })

  await waitFor(() => expect(posts(mock)).toHaveLength(1))
  expect(new URL(posts(mock)[0].url).searchParams.get('territory_code')).toBe('0264')
})

it('starts for all of Poland, closes, refreshes the list and shows the new run', async () => {
  const mock = stubAdminApi()
  const { router } = await renderTab()

  const dialog = await openDialog()
  await act(async () => {
    fireEvent.click(within(dialog).getByRole('button', { name: 'Start' }))
  })

  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect([...new URL(posts(mock)[0].url).searchParams.keys()]).toEqual([])
  expect(router.state.location.search).toBe(`?run=${OTHER_RUN_ID}`)
  await waitFor(() => expect(gets(mock)).toHaveLength(2))
  await waitFor(() => expect(callsTo(mock, `${RUNS}/${OTHER_RUN_ID}`)).toHaveLength(1))
})

it('disables "Start" while the request is pending', async () => {
  const held = deferred<Response>()
  const mock = stubAdminApi({ start: () => held.promise })
  await renderTab()

  const dialog = await openDialog()
  const start = within(dialog).getByRole('button', { name: 'Start' })
  fireEvent.click(start)
  await waitFor(() => expect(start).toBeDisabled())
  fireEvent.click(start)
  expect(posts(mock)).toHaveLength(1)

  await act(async () => held.resolve(jsonResponse(202, { run_id: OTHER_RUN_ID })))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
})

it('is blocked while a listed run is unfinished', async () => {
  const mock = stubAdminApi({ runs: () => jsonResponse(200, [runListItem({ finished_at: null })]) })
  await renderTab()

  const button = screen.getByRole('button', { name: 'A run is in progress' })
  expect(button).toHaveAttribute('aria-disabled', 'true')
  expect(button).toBeEnabled()
  button.focus()
  expect(button).toHaveFocus()
  fireEvent.click(button)

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(posts(mock)).toHaveLength(0)
})

it('is unblocked when a refresh shows every run finished', async () => {
  stubAdminApi({
    runs: inTurn(
      () => jsonResponse(200, [runListItem({ finished_at: null })]),
      () => jsonResponse(200, [runListItem()]),
    ),
  })
  await renderTab()
  expect(screen.getByRole('button', { name: 'A run is in progress' })).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))

  await waitFor(() => expect(startButton()).not.toHaveAttribute('aria-disabled'))
  expect(await openDialog()).toBeInTheDocument()
})

it('shows a 502 in the dialog, selects nothing, and Retry starts the run', async () => {
  const mock = stubAdminApi({
    start: inTurn(
      () => jsonResponse(502, { detail: 'Bad gateway' }),
      () => jsonResponse(202, { run_id: OTHER_RUN_ID }),
    ),
  })
  const { router } = await renderTab()

  const dialog = await openDialog()
  await act(async () => {
    fireEvent.click(within(dialog).getByRole('button', { name: 'Start' }))
  })

  const alert = await within(dialog).findByRole('alert')
  expect(alert).toHaveTextContent('Could not start the sync: Bad gateway')
  expect(router.state.location.search).toBe('')
  expect(screen.getByRole('dialog')).toBeInTheDocument()

  await act(async () => {
    fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }))
  })

  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(posts(mock)).toHaveLength(2)
  expect(router.state.location.search).toBe(`?run=${OTHER_RUN_ID}`)
})

it('clears an old error when the dialog is opened again', async () => {
  stubAdminApi({ start: () => jsonResponse(502, { detail: 'Bad gateway' }) })
  await renderTab()

  const dialog = await openDialog()
  await act(async () => {
    fireEvent.click(within(dialog).getByRole('button', { name: 'Start' }))
  })
  await within(dialog).findByRole('alert')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

  const reopened = await openDialog()
  expect(within(reopened).queryByRole('alert')).not.toBeInTheDocument()
  expect(within(reopened).getByRole('button', { name: 'Start' })).toBeEnabled()
})
