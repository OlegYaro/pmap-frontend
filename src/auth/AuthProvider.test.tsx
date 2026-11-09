import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeAccessToken, REFRESH_TOKEN_KEY } from '../test/auth'
import { callsTo, deferred, jsonResponse, stubFetch, tokenPair } from '../test/http'
import { AuthProvider } from './AuthProvider'
import { resetTokensForTests } from './tokens'
import { useAuth } from './useAuth'

const ADMIN = fakeAccessToken({ sub: '1', role: 'admin', exp: 1_800_000_000 })
const USER = fakeAccessToken({ sub: '7', role: 'user', exp: 1_800_000_000 })

function Probe() {
  const { status, user, isAdmin, login, logout } = useAuth()
  return (
    <>
      <p data-testid="status">{status}</p>
      <p data-testid="user">{user ? `${user.login}|${user.role ?? '-'}` : 'none'}</p>
      <p data-testid="admin">{String(isAdmin)}</p>
      <button
        onClick={() => {
          login({ login: 'anna', password: 'secret' }).catch(() => undefined)
        }}
      >
        login
      </button>
      <button onClick={() => void logout()}>logout</button>
    </>
  )
}

function renderProbe() {
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  )
}

const text = (id: string) => screen.getByTestId(id).textContent

async function settle() {
  await act(async () => {
    await Promise.resolve()
  })
}

beforeEach(() => {
  resetTokensForTests()
  sessionStorage.clear()
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('login and logout', () => {
  it('logs in as admin', async () => {
    stubFetch(() => tokenPair(ADMIN, 'R1'))
    renderProbe()
    await settle()
    expect(text('status')).toBe('anonymous')

    fireEvent.click(screen.getByRole('button', { name: 'login' }))

    await vi.waitFor(() => expect(text('status')).toBe('authenticated'))
    expect(text('user')).toBe('anna|admin')
    expect(text('admin')).toBe('true')
  })

  it('logs in as a regular user', async () => {
    stubFetch(() => tokenPair(USER, 'R1'))
    renderProbe()
    await settle()
    fireEvent.click(screen.getByRole('button', { name: 'login' }))
    await vi.waitFor(() => expect(text('status')).toBe('authenticated'))
    expect(text('user')).toBe('anna|user')
    expect(text('admin')).toBe('false')
  })

  it('treats an unreadable token as a non-admin user', async () => {
    stubFetch(() => tokenPair('garbage', 'R1'))
    renderProbe()
    await settle()
    fireEvent.click(screen.getByRole('button', { name: 'login' }))
    await vi.waitFor(() => expect(text('status')).toBe('authenticated'))
    expect(text('user')).toBe('anna|-')
    expect(text('admin')).toBe('false')
  })

  it('stays anonymous when the login fails', async () => {
    stubFetch(() => jsonResponse(401, { detail: 'Invalid login or password' }))
    renderProbe()
    await settle()
    fireEvent.click(screen.getByRole('button', { name: 'login' }))
    await settle()
    expect(text('status')).toBe('anonymous')
  })

  it('logs out through the token layer', async () => {
    const fetch = stubFetch((request) =>
      new URL(request.url).pathname === '/api/auth/login'
        ? tokenPair(ADMIN, 'R1')
        : jsonResponse(200, {}),
    )
    renderProbe()
    await settle()
    fireEvent.click(screen.getByRole('button', { name: 'login' }))
    await vi.waitFor(() => expect(text('status')).toBe('authenticated'))

    fireEvent.click(screen.getByRole('button', { name: 'logout' }))

    expect(text('status')).toBe('anonymous')
    expect(text('admin')).toBe('false')
    const [request] = callsTo(fetch, '/api/auth/logout')
    expect(await request.json()).toEqual({ refresh_token: 'R1' })
  })

  it('keeps working when localStorage throws', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    stubFetch(() => tokenPair(ADMIN, 'R1'))
    renderProbe()
    await settle()
    fireEvent.click(screen.getByRole('button', { name: 'login' }))
    await vi.waitFor(() => expect(text('status')).toBe('authenticated'))
    expect(text('user')).toBe('anna|admin')
  })
})

describe('session restore', () => {
  it('becomes anonymous without a request when no refresh token is stored', async () => {
    const fetch = stubFetch(() => jsonResponse(500, {}))
    renderProbe()
    await settle()
    expect(text('status')).toBe('anonymous')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('restores the session with one refresh and shows the remembered login', async () => {
    stubFetch(() => tokenPair(ADMIN, 'R1'))
    const first = render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await settle()
    fireEvent.click(screen.getByRole('button', { name: 'login' }))
    await vi.waitFor(() => expect(text('status')).toBe('authenticated'))
    first.unmount()
    // A reload: the access token is gone, the refresh token stays.
    resetTokensForTests()
    sessionStorage.setItem(REFRESH_TOKEN_KEY, 'R1')
    const held = deferred<Response>()
    const fetch = stubFetch(() => held.promise)

    renderProbe()

    expect(text('status')).toBe('loading')
    held.resolve(tokenPair(ADMIN, 'R2'))
    await vi.waitFor(() => expect(text('status')).toBe('authenticated'))
    expect(text('user')).toBe('anna|admin')
    expect(text('admin')).toBe('true')
    const refreshes = callsTo(fetch, '/api/auth/refresh')
    expect(refreshes).toHaveLength(1)
    expect(await refreshes[0].json()).toEqual({ refresh_token: 'R1' })
  })

  it('shows User <id> when no login is remembered for that user', async () => {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, 'R1')
    localStorage.setItem('pmap.user_login', JSON.stringify({ id: '1', login: 'anna' }))
    stubFetch(() => tokenPair(fakeAccessToken({ sub: '9', role: 'user' }), 'R2'))
    renderProbe()
    await vi.waitFor(() => expect(text('status')).toBe('authenticated'))
    expect(text('user')).toBe('User 9|user')
  })

  it('forgets the remembered login on logout', async () => {
    stubFetch(() => tokenPair(ADMIN, 'R1'))
    renderProbe()
    await settle()
    fireEvent.click(screen.getByRole('button', { name: 'login' }))
    await vi.waitFor(() => expect(text('status')).toBe('authenticated'))
    expect(localStorage.getItem('pmap.user_login')).toBe(JSON.stringify({ id: '1', login: 'anna' }))
    fireEvent.click(screen.getByRole('button', { name: 'logout' }))
    expect(localStorage.getItem('pmap.user_login')).toBeNull()
  })

  it('becomes anonymous when the stored refresh token is refused', async () => {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, 'R1')
    stubFetch(() => jsonResponse(401, { detail: 'Invalid refresh token' }))
    renderProbe()
    expect(text('status')).toBe('loading')
    await vi.waitFor(() => expect(text('status')).toBe('anonymous'))
  })
})

it('useAuth throws outside the provider', () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  expect(() => render(<Probe />)).toThrow('useAuth must be used inside AuthProvider')
})
