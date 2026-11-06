import { QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { beforeEach, expect, it } from 'vitest'
import { jsonResponse, stubFetch } from '../test/http'
import { createQueryClient } from './queryClient'
import { routes } from './routes'

function renderAt(path: string) {
  render(
    <QueryClientProvider client={createQueryClient({ retry: false })}>
      <RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  stubFetch(() => jsonResponse(200, []))
})

it.each([
  ['/transactions', 'Transactions'],
  ['/login', 'Login'],
  ['/admin', 'Admin'],
])('renders %s', (path, heading) => {
  renderAt(path)
  expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
})

it('renders the home route', async () => {
  renderAt('/')
  expect(screen.getByRole('heading', { name: 'Territories' })).toBeInTheDocument()
  await screen.findByText('No territories.')
})

it('shows the id on the detail page', () => {
  renderAt('/transactions/42')
  expect(screen.getByText('42')).toBeInTheDocument()
})

it('shows not-found inside the layout with a link home', () => {
  renderAt('/does-not-exist')
  expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /back to the home page/i })).toHaveAttribute('href', '/')
})

it('navigates by link and marks the current one', async () => {
  renderAt('/')
  await screen.findByText('No territories.')
  fireEvent.click(screen.getByRole('link', { name: 'Transactions' }))
  expect(screen.getByRole('heading', { name: 'Transactions' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Transactions' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current')
})
