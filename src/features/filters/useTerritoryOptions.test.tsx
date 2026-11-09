import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { createQueryClient } from '../../app/queryClient'
import { callsTo, deferred, jsonResponse, stubFetch } from '../../test/http'
import { useTerritoryOptions } from './useTerritoryOptions'

const ROWS = [
  {
    voivodeship_teryt: '14',
    voivodeship_name: 'mazowieckie',
    powiat_teryt: '1465',
    powiat_name: 'Warszawa',
    gmina_teryt: null,
    gmina_name: null,
  },
]

function Names({ testId }: { testId: string }) {
  const { status, nameOf } = useTerritoryOptions()
  return (
    <p data-testid={testId}>
      {status}: {nameOf('voivodeship', '14')} / {nameOf('powiat', '1465')} /{' '}
      {nameOf('powiat', '9999')}
    </p>
  )
}

function renderTwice() {
  render(
    <QueryClientProvider client={createQueryClient({ retry: false })}>
      <Names testId="a" />
      <Names testId="b" />
    </QueryClientProvider>,
  )
}

it('shares one request and resolves names after loading', async () => {
  const mock = stubFetch(() => jsonResponse(200, ROWS))
  renderTwice()
  expect(await screen.findAllByText('success: mazowieckie / Warszawa / 9999')).toHaveLength(2)
  expect(screen.getByTestId('b')).toHaveTextContent('success: mazowieckie / Warszawa / 9999')
  expect(callsTo(mock, '/api/territories')).toHaveLength(1)
})

it('gives the codes while loading', () => {
  const held = deferred<Response>()
  stubFetch(() => held.promise)
  renderTwice()
  expect(screen.getByTestId('a')).toHaveTextContent('pending: 14 / 1465 / 9999')
})

it('gives the codes after an error', async () => {
  stubFetch(() => jsonResponse(503, { detail: 'Extraction is unavailable' }))
  renderTwice()
  expect(await screen.findAllByText('error: 14 / 1465 / 9999')).toHaveLength(2)
})
