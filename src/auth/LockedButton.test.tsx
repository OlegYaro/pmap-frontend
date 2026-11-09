import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { REFRESH_TOKEN_KEY, stubStoredSession } from '../test/auth'
import { deferred, jsonResponse, stubFetch } from '../test/http'
import { AuthProvider } from './AuthProvider'
import { LockedButton } from './LockedButton'
import { resetTokensForTests } from './tokens'
import { useAuth } from './useAuth'

function Status() {
  return <p data-testid="status">{useAuth().status}</p>
}

function renderButton() {
  const onClick = vi.fn()
  render(
    <AuthProvider>
      <Status />
      <LockedButton action="export" onClick={onClick}>
        Export CSV
      </LockedButton>
    </AuthProvider>,
  )
  return onClick
}

async function renderAnonymous() {
  stubFetch(() => jsonResponse(200, []))
  const onClick = renderButton()
  await vi.waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'))
  return onClick
}

const exportButton = () => screen.getByRole('button', { name: /Export CSV/ })

beforeEach(() => {
  resetTokensForTests()
  sessionStorage.clear()
  localStorage.clear()
})

it('looks locked but stays focusable for anonymous users', async () => {
  await renderAnonymous()
  const button = exportButton()
  expect(button).toHaveAttribute('aria-disabled', 'true')
  expect(button).not.toHaveAttribute('disabled')
  expect(button.querySelector('svg.lucide-lock')).not.toBeNull()
  act(() => button.focus())
  expect(button).toHaveFocus()
})

it('shows the login hint on focus', async () => {
  await renderAnonymous()
  fireEvent.focus(exportButton())
  expect(await screen.findByRole('tooltip')).toHaveTextContent('Log in to export')
})

it('opens the login dialog instead of running the action', async () => {
  const onClick = await renderAnonymous()

  fireEvent.click(exportButton())

  expect(onClick).not.toHaveBeenCalled()
  const dialog = screen.getByRole('dialog', { name: 'Log in' })
  expect(within(dialog).getByText('Log in to export')).toBeInTheDocument()
})

it('does nothing while the session is restoring', () => {
  sessionStorage.setItem(REFRESH_TOKEN_KEY, 'R1')
  const held = deferred<Response>()
  stubFetch(() => held.promise)
  const onClick = renderButton()
  expect(screen.getByTestId('status')).toHaveTextContent('loading')

  fireEvent.click(exportButton())

  expect(exportButton()).toHaveAttribute('aria-disabled', 'true')
  expect(onClick).not.toHaveBeenCalled()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('is a normal button when logged in', async () => {
  stubStoredSession('user')
  const onClick = renderButton()
  await vi.waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))
  const button = screen.getByRole('button', { name: 'Export CSV' })
  expect(button).not.toHaveAttribute('aria-disabled')
  expect(button).toBeEnabled()
  expect(button.querySelector('svg.lucide-lock')).toBeNull()

  fireEvent.focus(button)
  fireEvent.click(button)

  expect(onClick).toHaveBeenCalledTimes(1)
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
