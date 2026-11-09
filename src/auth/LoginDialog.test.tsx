import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeAccessToken } from '../test/auth'
import { callsTo, deferred, jsonResponse, stubFetch, tokenPair } from '../test/http'
import { AuthProvider } from './AuthProvider'
import { resetTokensForTests } from './tokens'
import { useAuth } from './useAuth'

function Opener() {
  const { status, user, openLoginDialog } = useAuth()
  return (
    <>
      <p data-testid="status">{status}</p>
      <p data-testid="user">{user?.login ?? 'none'}</p>
      <button onClick={() => openLoginDialog()}>open</button>
      <button onClick={() => openLoginDialog('Admin area, please log in')}>open with reason</button>
    </>
  )
}

async function renderOpener() {
  render(
    <AuthProvider>
      <Opener />
    </AuthProvider>,
  )
  await vi.waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'))
}

function openDialog(button = 'open') {
  fireEvent.click(screen.getByRole('button', { name: button }))
  return screen.getByRole('dialog', { name: 'Log in' })
}

function fill(dialog: HTMLElement, login: string, password: string) {
  fireEvent.change(within(dialog).getByLabelText('Login'), { target: { value: login } })
  fireEvent.change(within(dialog).getByLabelText('Password'), { target: { value: password } })
}

/** Enter in a field submits the form; jsdom does not do implicit submission, so submit it. */
function pressEnter(field: HTMLElement) {
  fireEvent.keyDown(field, { key: 'Enter' })
  const form = field.closest('form')
  if (form) fireEvent.submit(form)
}

beforeEach(() => {
  resetTokensForTests()
  sessionStorage.clear()
  localStorage.clear()
})

describe('login dialog', () => {
  it('shows the fields and a neutral description without a reason', async () => {
    stubFetch(() => jsonResponse(500, {}))
    await renderOpener()
    const dialog = openDialog()
    expect(within(dialog).getByLabelText('Login')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('Password')).toHaveAttribute('type', 'password')
    expect(within(dialog).getByText('Log in with your PMAP account.')).toBeInTheDocument()
  })

  it('shows the reason it was opened with', async () => {
    stubFetch(() => jsonResponse(500, {}))
    await renderOpener()
    const dialog = openDialog('open with reason')
    expect(within(dialog).getByText('Admin area, please log in')).toBeInTheDocument()
  })

  it('validates empty fields without sending a request', async () => {
    const fetch = stubFetch(() => jsonResponse(500, {}))
    await renderOpener()
    const dialog = openDialog()
    fill(dialog, '   ', '')

    fireEvent.click(within(dialog).getByRole('button', { name: 'Log in' }))

    const login = within(dialog).getByLabelText('Login')
    const password = within(dialog).getByLabelText('Password')
    expect(await within(dialog).findByText('Enter your login')).toBeInTheDocument()
    expect(within(dialog).getByText('Enter your password')).toBeInTheDocument()
    expect(login).toHaveAttribute('aria-invalid', 'true')
    expect(login).toHaveAccessibleDescription('Enter your login')
    expect(password).toHaveAttribute('aria-invalid', 'true')
    expect(password).toHaveAccessibleDescription('Enter your password')
    expect(callsTo(fetch, '/api/auth/login')).toHaveLength(0)
  })

  it('submits on Enter with the login trimmed, shows progress and closes on success', async () => {
    const held = deferred<Response>()
    const fetch = stubFetch(() => held.promise)
    await renderOpener()
    const dialog = openDialog()
    fill(dialog, '  anna ', 'secret')

    pressEnter(within(dialog).getByLabelText('Password'))

    const submit = await within(dialog).findByRole('button', { name: 'Logging in…' })
    expect(submit).toBeDisabled()
    const [request] = callsTo(fetch, '/api/auth/login')
    expect(await request.json()).toEqual({ login: 'anna', password: 'secret' })

    held.resolve(tokenPair(fakeAccessToken({ sub: '1', role: 'admin' }), 'R1'))

    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    expect(screen.getByTestId('user')).toHaveTextContent('anna')
  })

  it('shows the backend message and stays open on a wrong password', async () => {
    stubFetch(() => jsonResponse(401, { detail: 'Invalid login or password' }))
    await renderOpener()
    const dialog = openDialog()
    fill(dialog, 'anna', 'wrong')

    fireEvent.click(within(dialog).getByRole('button', { name: 'Log in' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Invalid login or password')
    expect(screen.getByRole('dialog', { name: 'Log in' })).toBeInTheDocument()
    expect(within(dialog).getByLabelText('Login')).toHaveValue('anna')
    expect(screen.getByTestId('status')).toHaveTextContent('anonymous')
  })

  it('clears the failure on the next submit', async () => {
    const answers = [
      jsonResponse(401, { detail: 'Invalid login or password' }),
      tokenPair(fakeAccessToken({ sub: '1', role: 'user' }), 'R1'),
    ]
    const held = deferred<Response>()
    stubFetch(() => answers.shift() ?? held.promise)
    await renderOpener()
    const dialog = openDialog()
    fill(dialog, 'anna', 'wrong')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Log in' }))
    await within(dialog).findByRole('alert')

    fireEvent.click(within(dialog).getByRole('button', { name: 'Log in' }))

    expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument()
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('shows a network message when the server cannot be reached', async () => {
    stubFetch(() => Promise.reject(new TypeError('Failed to fetch')))
    await renderOpener()
    const dialog = openDialog()
    fill(dialog, 'anna', 'secret')

    fireEvent.click(within(dialog).getByRole('button', { name: 'Log in' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Could not reach the server, please try again',
    )
  })

  it('closes on Escape without a request and opens with an empty form', async () => {
    const fetch = stubFetch(() => jsonResponse(500, {}))
    await renderOpener()
    let dialog = openDialog()
    fill(dialog, 'anna', 'secret')

    fireEvent.keyDown(dialog, { key: 'Escape' })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
    dialog = openDialog()
    expect(within(dialog).getByLabelText('Login')).toHaveValue('')
    expect(within(dialog).getByLabelText('Password')).toHaveValue('')
  })

  it('closes with the close button', async () => {
    stubFetch(() => jsonResponse(500, {}))
    await renderOpener()
    const dialog = openDialog()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('login dialog focus', () => {
  it('focuses the Login field on open and returns focus on close', async () => {
    stubFetch(() => jsonResponse(500, {}))
    await renderOpener()
    const opener = screen.getByRole('button', { name: 'open' })
    act(() => opener.focus())

    const dialog = openDialog()

    await vi.waitFor(() => expect(within(dialog).getByLabelText('Login')).toHaveFocus())
    fireEvent.keyDown(dialog, { key: 'Escape' })
    await vi.waitFor(() => expect(opener).toHaveFocus())
  })
})
