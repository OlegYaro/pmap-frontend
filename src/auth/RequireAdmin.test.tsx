import { act, fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { api } from '../api/client'
import { fakeAccessToken, REFRESH_TOKEN_KEY, stubStoredSession } from '../test/auth'
import { deferred, jsonResponse, stubFetch, tokenPair } from '../test/http'
import { renderRoutes } from '../test/render'
import { resetTokensForTests } from './tokens'

beforeEach(() => {
  resetTokensForTests()
  sessionStorage.clear()
  localStorage.clear()
})

it('shows the admin page to an admin', async () => {
  stubStoredSession('admin')
  renderRoutes('/admin')
  expect(await screen.findByRole('heading', { name: 'Admin' })).toBeInTheDocument()
})

it('sends an anonymous user to / with the login dialog, replacing the history entry', async () => {
  stubFetch(() => jsonResponse(200, []))
  const { router } = renderRoutes('/admin', ['/analytics'])

  const dialog = await screen.findByRole('dialog', { name: 'Log in' })

  expect(within(dialog).getByText('Admin area, please log in')).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/')
  await act(() => router.navigate(-1))
  expect(router.state.location.pathname).toBe('/analytics')
})

it('shows "Access denied" to a regular user without opening the dialog', async () => {
  stubStoredSession('user')
  const { router } = renderRoutes('/admin')

  expect(await screen.findByRole('heading', { name: 'Access denied' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /back to the home page/i })).toHaveAttribute('href', '/')
  expect(screen.queryByRole('heading', { name: 'Admin' })).not.toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/admin')
})

it('shows a skeleton and does not redirect while the session is restoring', async () => {
  sessionStorage.setItem(REFRESH_TOKEN_KEY, 'R1')
  const held = deferred<Response>()
  stubFetch((request) =>
    new URL(request.url).pathname === '/api/auth/refresh' ? held.promise : jsonResponse(200, []),
  )
  const { router } = renderRoutes('/admin')

  expect(screen.getByRole('status')).toHaveTextContent('Loading')
  expect(router.state.location.pathname).toBe('/admin')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

  held.resolve(tokenPair(fakeAccessToken({ sub: '1', role: 'admin' }), 'R2'))

  expect(await screen.findByRole('heading', { name: 'Admin' })).toBeInTheDocument()
  await vi.waitFor(() => expect(router.state.location.pathname).toBe('/admin'))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('takes an admin who logs out on /admin to / without the login dialog', async () => {
  stubStoredSession('admin')
  const { router } = renderRoutes('/admin')
  const trigger = await screen.findByRole('button', { name: 'User 1' })
  fireEvent.keyDown(trigger, { key: 'Enter' })

  fireEvent.click(await screen.findByRole('menuitem', { name: 'Log out' }))

  expect(await screen.findByRole('button', { name: 'Log in' })).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('sends an admin whose session ends on /admin to / with the dialog and the toast', async () => {
  stubStoredSession('admin')
  const { router } = renderRoutes('/admin')
  await screen.findByRole('heading', { name: 'Admin' })
  stubFetch(() => jsonResponse(401, { detail: 'Not authenticated' }))

  await act(async () => {
    await api.GET('/admin/runs').catch(() => {})
  })

  const dialog = await screen.findByRole('dialog', { name: 'Log in' })
  expect(within(dialog).getByText('Admin area, please log in')).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/')
  expect(await screen.findByText('Session expired, please log in again')).toBeInTheDocument()
})
