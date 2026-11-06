import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import App from './App'
import { jsonResponse, stubFetch } from './test/http'

it('renders the shell with the home page', async () => {
  stubFetch(() => jsonResponse(200, []))
  render(<App />)
  expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
  expect(await screen.findByText('No territories.')).toBeInTheDocument()
})
