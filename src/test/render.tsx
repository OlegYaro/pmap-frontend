import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { createQueryClient } from '../app/queryClient'
import { routes } from '../app/routes'
import { AuthProvider } from '../auth/AuthProvider'
import { ThemeProvider } from '../components/theme/ThemeProvider'
import { FilterDraftProvider } from '../features/filters/FilterDraftProvider'
import { SearchButton } from './SearchButton'
import { Toaster } from '../components/ui/sonner'

/**
 * Renders the app's routes at `path` with every provider and the toaster, like App does.
 * `previous` are history entries before it, for testing Back.
 */
export function renderRoutes(path: string, previous: string[] = []) {
  const router = createMemoryRouter(routes, { initialEntries: [...previous, path] })
  const result = render(
    <ThemeProvider>
      <QueryClientProvider client={createQueryClient({ retry: false })}>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>,
  )
  return { ...result, router }
}

/**
 * Renders `ui` at `path` inside a memory router (one catch-all route) and a fresh query client.
 * `previous` are history entries before it. Returns the router to read its location and history.
 */
export function renderWithRouter(
  ui: ReactNode,
  { path = '/', previous = [] }: { path?: string; previous?: string[] } = {},
) {
  const router = createMemoryRouter([{ path: '*', element: ui }], {
    initialEntries: [...previous, path],
  })
  const result = render(
    <QueryClientProvider client={createQueryClient({ retry: false })}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return { ...result, router }
}

/**
 * Like `renderWithRouter`, with the filter draft around `ui` and a "Search" button that applies it,
 * for testing the filter fields on their own.
 */
export function renderWithDraft(
  ui: ReactNode,
  options: { path?: string; previous?: string[] } = {},
) {
  return renderWithRouter(
    <FilterDraftProvider>
      {ui}
      <SearchButton />
    </FilterDraftProvider>,
    options,
  )
}
