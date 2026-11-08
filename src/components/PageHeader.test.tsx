import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { PageHeader } from './PageHeader'

it('shows one h1 with the action beside it', () => {
  render(
    <PageHeader title="Transactions" description="All deals" actions={<button>Export</button>} />,
  )
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  expect(screen.getByRole('heading', { name: 'Transactions' })).toBeInTheDocument()
  expect(screen.getByText('All deals')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument()
})

it('renders only the title when nothing else is given', () => {
  render(<PageHeader title="Analytics" />)
  expect(screen.getByRole('heading', { name: 'Analytics' })).toBeInTheDocument()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})

it('lets the actions wrap within the width on narrow screens', () => {
  render(<PageHeader title="Transaction 42" actions={<button>Edit</button>} />)
  expect(screen.getByRole('button', { name: 'Edit' }).parentElement).toHaveClass(
    'flex-wrap',
    'max-w-full',
  )
})
