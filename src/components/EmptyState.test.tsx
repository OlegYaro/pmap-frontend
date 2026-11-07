import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { EmptyState } from './EmptyState'

it('shows the message and the action', () => {
  const onReset = vi.fn()
  render(
    <EmptyState
      message="No transactions match these filters"
      description="Try a wider date range."
      action={<button onClick={onReset}>Reset</button>}
    />,
  )
  expect(screen.getByText('No transactions match these filters')).toBeInTheDocument()
  expect(screen.getByText('Try a wider date range.')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
  expect(onReset).toHaveBeenCalledOnce()
})

it('renders only the message without description and action', () => {
  render(<EmptyState message="Nothing here" />)
  expect(screen.getByText('Nothing here')).toBeInTheDocument()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})
