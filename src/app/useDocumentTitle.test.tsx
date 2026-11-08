import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { useDocumentTitle } from './useDocumentTitle'

function Page({ name }: { name: string }) {
  useDocumentTitle(name)
  return null
}

it('sets the title with the app suffix', () => {
  render(<Page name="Analytics" />)
  expect(document.title).toBe('Analytics · PMAP')
})

it('follows a changed name', () => {
  const { rerender } = render(<Page name="Transaction" />)
  rerender(<Page name="Transaction 42" />)
  expect(document.title).toBe('Transaction 42 · PMAP')
})

it('is overwritten by the next page', () => {
  const { rerender } = render(<Page name="Admin" />)
  rerender(<Page name="Analytics" />)
  expect(document.title).toBe('Analytics · PMAP')
})
