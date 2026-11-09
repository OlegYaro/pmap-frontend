import { expect, it } from 'vitest'
import source from '../../index.html?raw'

const html = new DOMParser().parseFromString(source, 'text/html')

it('has the static title', () => {
  expect(html.title).toBe('PMAP')
})

it('has a description', () => {
  const content = html.querySelector('meta[name="description"]')?.getAttribute('content')
  expect(content).toBeTruthy()
})

it('has a theme colour for each colour scheme', () => {
  const metas = Array.from(html.querySelectorAll('meta[name="theme-color"]'))
  expect(metas.map((m) => m.getAttribute('media'))).toEqual([
    '(prefers-color-scheme: light)',
    '(prefers-color-scheme: dark)',
  ])
  metas.forEach((m) => expect(m.getAttribute('content')).toMatch(/^#[0-9a-f]{6}$/))
})

it('keeps the favicon link', () => {
  expect(html.querySelector('link[rel="icon"]')?.getAttribute('href')).toBe('/favicon.svg')
})
