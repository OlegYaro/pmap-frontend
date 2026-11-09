import { afterEach, expect, it, vi } from 'vitest'
import { downloadFile } from './download'

afterEach(() => {
  vi.restoreAllMocks()
})

it('clicks one link to the url and removes it', () => {
  const clicked: HTMLAnchorElement[] = []
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    clicked.push(this)
    expect(document.body.contains(this)).toBe(true)
  })

  downloadFile('https://files.example/e.csv')

  expect(clicked).toHaveLength(1)
  expect(clicked[0].href).toBe('https://files.example/e.csv')
  expect(clicked[0].hasAttribute('download')).toBe(true)
  expect(document.querySelector('a')).toBeNull()
})
