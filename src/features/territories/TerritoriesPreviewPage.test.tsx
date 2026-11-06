import { QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { createQueryClient } from '../../app/queryClient'
import { deferred, jsonResponse, stubFetch } from '../../test/http'
import { TerritoriesPreviewPage } from './TerritoriesPreviewPage'

function renderPage() {
  render(
    <QueryClientProvider client={createQueryClient({ retry: false })}>
      <TerritoriesPreviewPage />
    </QueryClientProvider>,
  )
}

const territory = (i: number) => ({
  voivodeship_teryt: '14',
  voivodeship_name: `Voivodeship ${i}`,
  powiat_teryt: i % 2 ? null : `14${i}`,
  powiat_name: i % 2 ? null : `Powiat ${i}`,
  gmina_teryt: null,
  gmina_name: null,
})

it('shows the first 10 rows of the response', async () => {
  const mock = stubFetch(() =>
    jsonResponse(
      200,
      Array.from({ length: 25 }, (_, i) => territory(i)),
    ),
  )
  renderPage()
  const rows = await screen.findAllByRole('row')
  expect(rows).toHaveLength(11) // header + 10
  expect(within(rows[1]).getByText('Voivodeship 0')).toBeInTheDocument()
  expect(within(rows[1]).getByText('Powiat 0')).toBeInTheDocument()
  expect(within(rows[2]).getAllByText('—')).toHaveLength(2) // powiat and gmina of row 1 are null
  expect(screen.queryByText('Voivodeship 10')).not.toBeInTheDocument()
  expect(new URL(mock.mock.calls[0][0].url).pathname).toBe('/api/territories')
})

it('shows a message for an empty list', async () => {
  stubFetch(() => jsonResponse(200, []))
  renderPage()
  expect(await screen.findByText('No territories.')).toBeInTheDocument()
})

it('shows a loading message while the request is pending', async () => {
  const gate = deferred<Response>()
  stubFetch(() => gate.promise as unknown as Response)
  renderPage()
  expect(screen.getByText('Loading territories…')).toBeInTheDocument()
  expect(screen.queryByRole('row')).not.toBeInTheDocument()
  gate.resolve(jsonResponse(200, []))
  await screen.findByText('No territories.')
})

it('shows the error message and recovers on retry', async () => {
  let fail = true
  stubFetch(() =>
    fail ? jsonResponse(404, { detail: 'Not found' }) : jsonResponse(200, [territory(0)]),
  )
  renderPage()
  expect(await screen.findByRole('alert')).toHaveTextContent('Not found')
  fail = false
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(await screen.findByText('Voivodeship 0')).toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})
