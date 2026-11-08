import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, expect, it } from 'vitest'
import { emptyApi } from '../test/analytics'
import { REFRESH_TOKEN_KEY, stubStoredSession } from '../test/auth'
import { deferred, stubFetch } from '../test/http'
import { renderRoutes } from '../test/render'
import { resetTokensForTests } from './tokens'

function header() {
  return screen.getByRole('banner')
}

/** A reloaded tab of `anna` (user id 1) whose refresh succeeds with `role`. */
function restoreSession(role: string) {
  localStorage.setItem('pmap.user_login', JSON.stringify({ id: '1', login: 'anna' }))
  stubStoredSession(role, emptyApi)
}

beforeEach(() => {
  resetTokensForTests()
  sessionStorage.clear()
  localStorage.clear()
})

it('offers "Log in" to anonymous users and opens the dialog without a reason', async () => {
  stubFetch(emptyApi)
  renderRoutes('/analytics')

  fireEvent.click(await within(header()).findByRole('button', { name: 'Log in' }))

  const dialog = screen.getByRole('dialog', { name: 'Log in' })
  expect(within(dialog).getByText('Log in with your PMAP account.')).toBeInTheDocument()
})

it('shows neither "Log in" nor the user menu while restoring', () => {
  sessionStorage.setItem(REFRESH_TOKEN_KEY, 'R1')
  const held = deferred<Response>()
  stubFetch(() => held.promise)
  renderRoutes('/analytics')

  expect(within(header()).queryByRole('button', { name: 'Log in' })).not.toBeInTheDocument()
  expect(within(header()).queryByRole('button', { name: /anna/ })).not.toBeInTheDocument()
})

it('shows the user menu with login, role badge and "Log out"', async () => {
  restoreSession('admin')
  renderRoutes('/analytics')

  const trigger = await within(header()).findByRole('button', { name: 'anna' })
  fireEvent.keyDown(trigger, { key: 'Enter' })

  const menu = await screen.findByRole('menu')
  expect(within(menu).getByText('anna')).toBeInTheDocument()
  expect(within(menu).getByText('admin')).toHaveAttribute('data-slot', 'badge')
  expect(within(menu).getByRole('menuitem', { name: 'Log out' })).toBeInTheDocument()
})

it('logs out from the menu and offers "Log in" again', async () => {
  restoreSession('user')
  renderRoutes('/analytics')
  fireEvent.keyDown(await within(header()).findByRole('button', { name: 'anna' }), {
    key: 'Enter',
  })

  fireEvent.click(await screen.findByRole('menuitem', { name: 'Log out' }))

  expect(await within(header()).findByRole('button', { name: 'Log in' })).toBeInTheDocument()
  expect(within(header()).queryByRole('button', { name: 'anna' })).not.toBeInTheDocument()
})
