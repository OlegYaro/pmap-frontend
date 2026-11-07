import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { ErrorState } from './ErrorState'

it('shows the message in an alert and calls the handler on retry', () => {
  const onRetry = vi.fn()
  render(<ErrorState message="Server is down" onRetry={onRetry} />)
  expect(screen.getByRole('alert')).toHaveTextContent('Server is down')
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(onRetry).toHaveBeenCalledOnce()
})

it('disables the button while retrying', () => {
  render(<ErrorState message="Server is down" onRetry={() => {}} retrying />)
  expect(screen.getByRole('button', { name: 'Retry' })).toBeDisabled()
})
