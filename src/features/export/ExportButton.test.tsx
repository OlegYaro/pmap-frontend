import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../auth/AuthProvider'
import { resetTokensForTests } from '../../auth/tokens'
import { fakeAccessToken, stubStoredSession } from '../../test/auth'
import { callsTo, jsonResponse, stubFetch, tokenPair, type FetchHandler } from '../../test/http'
import type { TransactionFilters } from '../filters/model'
import { downloadFile } from './download'
import { ExportButton } from './ExportButton'

vi.mock('./download', () => ({ downloadFile: vi.fn() }))

const START = '/api/exports'
const STATUS = '/api/exports/e1'
const FILE_URL = 'https://files.example/e.csv'
const FILTERS: TransactionFilters = { powiat_code: '0264' }

/** The API of a working export: the start answers with an id, the status with `status`. */
function exportApi(status: FetchHandler = () => jsonResponse(200, { status: 'pending' })) {
  return (request: Request) => {
    const path = new URL(request.url).pathname
    if (path === START) return jsonResponse(202, { id: 'e1' })
    if (path === STATUS) return status(request)
    return jsonResponse(200, [])
  }
}

type Props = Partial<React.ComponentProps<typeof ExportButton>>

function renderButton(props: Props = {}) {
  return render(
    <AuthProvider>
      <ExportButton filters={FILTERS} {...props} />
    </AuthProvider>,
  )
}

const button = () => screen.getByRole('button', { name: /Export CSV|Preparing export/ })
const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms))

/** Renders for a restored session and lets it settle (fake timers must be on). */
async function renderLoggedIn(props: Props = {}, api: FetchHandler = exportApi()) {
  const mock = stubStoredSession('user', api)
  renderButton(props)
  await advance(0)
  return mock
}

beforeEach(() => {
  resetTokensForTests()
  sessionStorage.clear()
  localStorage.clear()
  vi.mocked(downloadFile).mockClear()
})

afterEach(() => {
  vi.useRealTimers()
})

function useFakeTimers() {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
}

/** Renders for an anonymous visitor and opens the login dialog with a click on the button. */
async function openLoginDialog() {
  renderButton()
  expect(button().querySelector('svg.lucide-lock')).not.toBeNull()
  // The click does nothing until the session is known to be anonymous.
  await vi.waitFor(() => {
    fireEvent.click(button())
    expect(screen.getByRole('dialog', { name: 'Log in' })).toBeInTheDocument()
  })
  return screen.getByRole('dialog', { name: 'Log in' })
}

it('opens the login dialog for an anonymous user and makes no request', async () => {
  const mock = stubFetch(exportApi())
  const dialog = await openLoginDialog()
  expect(within(dialog).getByText('Log in to export')).toBeInTheDocument()
  expect(callsTo(mock, START)).toHaveLength(0)
})

it('does not start an export after the login', async () => {
  const token = fakeAccessToken({ sub: '1', role: 'user', exp: 1_800_000_000 })
  const mock = stubFetch((request) =>
    new URL(request.url).pathname === '/api/auth/login'
      ? tokenPair(token, 'R1')
      : exportApi()(request),
  )
  const dialog = await openLoginDialog()
  fireEvent.change(within(dialog).getByLabelText('Login'), { target: { value: 'anna' } })
  fireEvent.change(within(dialog).getByLabelText('Password'), { target: { value: 'secret' } })
  fireEvent.submit(dialog.querySelector('form')!)

  await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(button()).toBeEnabled()
  expect(button()).not.toHaveAttribute('aria-disabled')
  expect(button()).toHaveTextContent('Export CSV')
  expect(callsTo(mock, START)).toHaveLength(0)
})

it('starts an export on a logged-in click', async () => {
  useFakeTimers()
  const mock = await renderLoggedIn()
  expect(button()).toBeEnabled()
  expect(button().querySelector('svg.lucide-lock')).toBeNull()

  fireEvent.click(button())
  await advance(0)

  expect(callsTo(mock, START)).toHaveLength(1)
  expect(new URL(callsTo(mock, START)[0].url).searchParams.get('powiat_code')).toBe('0264')
})

it('shows the running state and ignores repeated presses', async () => {
  useFakeTimers()
  const mock = await renderLoggedIn()

  fireEvent.click(button())
  await advance(0)

  expect(button()).toHaveTextContent('Preparing export...')
  expect(button()).toBeDisabled()
  expect(button().querySelector('svg.animate-spin')).not.toBeNull()
  fireEvent.click(button())
  fireEvent.keyDown(button(), { key: 'Enter' })
  await advance(0)
  expect(callsTo(mock, START)).toHaveLength(1)
  expect(screen.getByRole('status')).toHaveTextContent('Preparing export')
})

it('announces that the export is ready and downloads the file', async () => {
  useFakeTimers()
  await renderLoggedIn(
    {},
    exportApi(() => jsonResponse(200, { status: 'done', url: FILE_URL })),
  )

  fireEvent.click(button())
  await advance(2_000)

  expect(screen.getByRole('status')).toHaveTextContent('Export ready')
  expect(downloadFile).toHaveBeenCalledWith(FILE_URL)
  expect(button()).toBeEnabled()
  expect(button()).toHaveTextContent('Export CSV')
})

it('announces a failed export and enables the button again', async () => {
  useFakeTimers()
  await renderLoggedIn(
    {},
    exportApi(() => jsonResponse(200, { status: 'failed', error: 'x' })),
  )

  fireEvent.click(button())
  await advance(2_000)

  expect(screen.getByRole('status')).toHaveTextContent('Export failed')
  expect(button()).toBeEnabled()
})

it('explains the scope in a tooltip on the analytics page', async () => {
  useFakeTimers()
  await renderLoggedIn({ scope: 'analytics' })
  const text = 'Exports the transactions that match the current filters'

  const describedBy = button().getAttribute('aria-describedby')
  expect(describedBy).not.toBeNull()
  expect(document.getElementById(describedBy!)).toHaveTextContent(text)
  fireEvent.focus(button())
  await advance(0)

  expect(screen.getByRole('tooltip')).toHaveTextContent(text)
})

it('has no scope tooltip on the transactions page', async () => {
  useFakeTimers()
  await renderLoggedIn()

  fireEvent.focus(button())
  await advance(0)

  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  expect(button()).not.toHaveAttribute('aria-describedby')
})

it('does nothing when disabled', async () => {
  useFakeTimers()
  const mock = await renderLoggedIn({ disabled: true })

  expect(button()).toBeDisabled()
  fireEvent.click(button())
  await advance(0)

  expect(callsTo(mock, START)).toHaveLength(0)
})
