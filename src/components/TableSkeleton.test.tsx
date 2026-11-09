import { render, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { TableSkeleton } from './TableSkeleton'

it('renders the requested rows and columns with one Loading status', () => {
  const { container } = render(<TableSkeleton rows={5} columns={4} />)
  const rows = container.querySelectorAll('tr')
  expect(rows).toHaveLength(5)
  rows.forEach((row) => expect(row.querySelectorAll('td')).toHaveLength(4))
  expect(screen.getAllByRole('status')).toHaveLength(1)
  expect(within(screen.getByRole('status')).getByText('Loading')).toBeInTheDocument()
})

it('hides the placeholder table from assistive technology', () => {
  render(<TableSkeleton rows={2} columns={2} />)
  expect(screen.queryByRole('table')).not.toBeInTheDocument()
})
