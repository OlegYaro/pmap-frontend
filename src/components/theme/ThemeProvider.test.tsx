import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ThemeProvider } from './ThemeProvider'
import { ThemeToggle } from './ThemeToggle'
import { THEME_STORAGE_KEY } from './themeContext'

/** Installs a matchMedia stub whose dark preference can be flipped from the test. */
function stubSystem(initialDark: boolean) {
  let dark = initialDark
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      get matches() {
        return dark
      },
      media: query,
      addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) =>
        listeners.add(listener),
      removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) =>
        listeners.delete(listener),
    })),
  )
  return {
    setDark(next: boolean) {
      dark = next
      listeners.forEach((listener) => listener({ matches: next } as MediaQueryListEvent))
    },
    listenerCount: () => listeners.size,
  }
}

function renderToggle() {
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  )
}

const isDark = () => document.documentElement.classList.contains('dark')

async function pick(name: string) {
  fireEvent.keyDown(screen.getByRole('button', { name: 'Theme' }), { key: 'Enter' })
  fireEvent.click(await screen.findByRole('menuitemradio', { name }))
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

afterEach(() => {
  vi.restoreAllMocks()
})

it('follows a dark system when nothing is stored', () => {
  stubSystem(true)
  renderToggle()
  expect(isDark()).toBe(true)
})

it('stays light when the system is light and nothing is stored', () => {
  stubSystem(false)
  renderToggle()
  expect(isDark()).toBe(false)
})

it('applies the stored choice over the system preference', () => {
  stubSystem(true)
  localStorage.setItem(THEME_STORAGE_KEY, 'light')
  renderToggle()
  expect(isDark()).toBe(false)
})

it('ignores an invalid stored value', () => {
  stubSystem(true)
  localStorage.setItem(THEME_STORAGE_KEY, 'purple')
  renderToggle()
  expect(isDark()).toBe(true)
})

it('lets an explicit choice override the system and stores it', async () => {
  stubSystem(true)
  renderToggle()
  await pick('Light')
  expect(isDark()).toBe(false)
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
})

it('follows system changes only while the choice is system', async () => {
  const system = stubSystem(false)
  renderToggle()
  expect(isDark()).toBe(false)
  act(() => system.setDark(true))
  expect(isDark()).toBe(true)

  await pick('Light')
  expect(system.listenerCount()).toBe(0)
  act(() => system.setDark(true))
  expect(isDark()).toBe(false)
})

it('lists the choices and marks the current one', async () => {
  stubSystem(false)
  localStorage.setItem(THEME_STORAGE_KEY, 'dark')
  renderToggle()
  fireEvent.keyDown(screen.getByRole('button', { name: 'Theme' }), { key: 'Enter' })
  expect(await screen.findByRole('menuitemradio', { name: 'Dark' })).toBeChecked()
  expect(screen.getByRole('menuitemradio', { name: 'Light' })).not.toBeChecked()
  expect(screen.getByRole('menuitemradio', { name: 'System' })).not.toBeChecked()
})

it('works when localStorage throws', async () => {
  stubSystem(false)
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  renderToggle()
  expect(isDark()).toBe(false)
  await pick('Dark')
  expect(isDark()).toBe(true)
})
