import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { api } from '../api/client'
import { ThemeProvider } from '../components/theme/ThemeProvider'
import { Toaster } from '../components/ui/sonner'
import { fakeAccessToken } from '../test/auth'
import { jsonResponse, stubFetch, tokenPair } from '../test/http'
import { AuthProvider } from './AuthProvider'
import { resetTokensForTests } from './tokens'
import { useAuth } from './useAuth'

const TOAST = 'Session expired, please log in again'

function Probe() {
  const { status, login, logout } = useAuth()
  return (
    <>
      <p data-testid="status">{status}</p>
      <button onClick={() => void login({ login: 'anna', password: 'secret' })}>login</button>
      <button onClick={() => void logout()}>logout</button>
    </>
  )
}

async function renderLoggedIn() {
  stubFetch(() => tokenPair(fakeAccessToken({ sub: '1', role: 'admin' }), 'R1'))
  render(
    <ThemeProvider>
      <AuthProvider>
        <Probe />
        <Toaster />
      </AuthProvider>
    </ThemeProvider>,
  )
  await vi.waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'))
  fireEvent.click(screen.getByRole('button', { name: 'login' }))
  await vi.waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))
}

beforeEach(() => {
  resetTokensForTests()
  sessionStorage.clear()
  localStorage.clear()
})

it('switches to anonymous and shows the toast once when a refresh fails', async () => {
  await renderLoggedIn()
  stubFetch(() => jsonResponse(401, { detail: 'Not authenticated' }))

  await act(async () => {
    await api.GET('/exports/{export_id}', { params: { path: { export_id: 'e1' } } }).catch(() => {})
  })

  expect(screen.getByTestId('status')).toHaveTextContent('anonymous')
  expect(await screen.findByText(TOAST)).toBeInTheDocument()
  expect(screen.getAllByText(TOAST)).toHaveLength(1)
})

it('shows no toast on logout', async () => {
  await renderLoggedIn()
  stubFetch(() => jsonResponse(200, {}))

  fireEvent.click(screen.getByRole('button', { name: 'logout' }))

  expect(screen.getByTestId('status')).toHaveTextContent('anonymous')
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50))
  })
  expect(screen.queryByText(TOAST)).not.toBeInTheDocument()
})
