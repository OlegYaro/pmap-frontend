import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, expect, it } from 'vitest'
import { resetTokensForTests } from '../auth/tokens'
import { emptyApi } from '../test/analytics'
import { stubFetch } from '../test/http'
import { tabOrder } from '../test/focus'
import { renderRoutes } from '../test/render'

beforeEach(() => {
  resetTokensForTests()
  sessionStorage.clear()
  localStorage.clear()
  stubFetch(emptyApi)
})

it('makes the skip link the first tab stop, shown only while focused', () => {
  renderRoutes('/analytics')
  const skip = screen.getByRole('link', { name: 'Skip to main content' })
  expect(tabOrder()[0]).toBe(skip)
  expect(skip).toHaveAttribute('href', '#main-content')
  expect(skip.className).toContain('sr-only')
  expect(skip.className).toContain('focus:not-sr-only')
})

it('has the brand link right after the skip link', () => {
  renderRoutes('/analytics')
  expect(tabOrder()[1]).toBe(screen.getByRole('link', { name: 'PMAP' }))
})

it('moves focus into main on activation and leaves the URL unchanged', () => {
  const { router } = renderRoutes('/?rooms=2&sort=price')
  const skip = screen.getByRole('link', { name: 'Skip to main content' })
  skip.focus()
  expect(fireEvent.click(skip)).toBe(false) // default prevented
  const main = screen.getByRole('main')
  expect(main).toHaveAttribute('id', 'main-content')
  expect(main).toHaveFocus()
  expect(router.state.location.pathname).toBe('/')
  expect(router.state.location.search).toBe('?rooms=2&sort=price')
  expect(router.state.location.hash).toBe('')
})

it('has exactly one main landmark', () => {
  renderRoutes('/analytics')
  expect(screen.getAllByRole('main')).toHaveLength(1)
})
