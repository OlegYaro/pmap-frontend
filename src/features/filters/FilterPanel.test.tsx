import { act, fireEvent, screen } from '@testing-library/react'
import { beforeEach, expect, it } from 'vitest'
import { jsonResponse, stubFetch } from '../../test/http'
import { renderWithRouter } from '../../test/render'
import { TERRITORIES } from '../../test/territories'
import { FilterPanel } from './FilterPanel'
import { FILTER_FIELDS } from './model'

beforeEach(() => {
  stubFetch(() => jsonResponse(200, TERRITORIES))
})

/** One accessible control per field, in panel order. */
const CONTROLS = [
  () => screen.getByRole('group', { name: 'Territory' }),
  () => screen.getByRole('group', { name: 'Date' }),
  () => screen.getByRole('group', { name: 'Price (PLN)' }),
  () => screen.getByRole('group', { name: 'Area (m²)' }),
  () => screen.getByRole('group', { name: 'Rooms' }),
  () => screen.getByRole('group', { name: 'Floor' }),
  () => screen.getByRole('combobox', { name: 'Function' }),
  () => screen.getByRole('button', { name: /^Rows/ }),
  () => screen.getByRole('textbox', { name: 'Address' }),
  () => screen.getByRole('textbox', { name: 'City' }),
  () => screen.getByRole('textbox', { name: 'District' }),
]

it('shows all eleven fields in order by default', () => {
  const { container } = renderWithRouter(<FilterPanel />)
  for (const control of CONTROLS) expect(control()).toBeInTheDocument()
  const order = [...container.querySelectorAll('[data-field]')].map((el) =>
    el.getAttribute('data-field'),
  )
  expect(order).toEqual([...FILTER_FIELDS])
})

it('has no market type control', () => {
  renderWithRouter(<FilterPanel />)
  expect(screen.queryByRole('combobox', { name: 'Market type' })).not.toBeInTheDocument()
})

it('hides fields that are not listed', () => {
  renderWithRouter(<FilterPanel fields={FILTER_FIELDS.filter((field) => field !== 'rows')} />)
  expect(screen.queryByRole('button', { name: /^Rows/ })).not.toBeInTheDocument()
  expect(screen.getByRole('combobox', { name: 'Function' })).toBeInTheDocument()
})

it('shows the values from the URL', () => {
  renderWithRouter(<FilterPanel />, { path: '/?function=biurowa&price_min=300000' })
  expect(screen.getByRole('combobox', { name: 'Function' })).toHaveTextContent('Office')
  expect(screen.getByRole('textbox', { name: 'Min price' })).toHaveValue('300000')
})

it('describes address, city and district with helper texts', () => {
  renderWithRouter(<FilterPanel />)
  expect(screen.getByRole('textbox', { name: 'Address' })).toHaveAccessibleDescription(
    'Part of the address',
  )
  expect(screen.getByRole('textbox', { name: 'City' })).toHaveAccessibleDescription('Exact name')
  expect(screen.getByRole('textbox', { name: 'District' })).toHaveAccessibleDescription(
    'Exact name',
  )
})

it('toggles the fields with a "Filters" button showing the active count', () => {
  renderWithRouter(<FilterPanel />, { path: '/?rooms=2&city_name=Warszawa' })
  const toggle = screen.getByRole('button', { name: 'Filters (2)' })
  const content = document.getElementById(toggle.getAttribute('aria-controls') ?? '')
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  expect(content).toHaveClass('hidden', 'md:grid')
  fireEvent.click(toggle)
  expect(toggle).toHaveAttribute('aria-expanded', 'true')
  expect(content).toHaveAttribute('data-state', 'open')
  expect(content).not.toHaveClass('hidden')
})

it('counts only the shown fields and says "Filters" without any', () => {
  const fields = FILTER_FIELDS.filter((field) => field !== 'rows')
  renderWithRouter(<FilterPanel fields={fields} />, { path: '/?exclusion_reason=clean' })
  expect(screen.getByRole('button', { name: 'Filters' })).toBeInTheDocument()
})

it('keeps a typed value when the panel is collapsed and expanded', () => {
  renderWithRouter(<FilterPanel />)
  const toggle = screen.getByRole('button', { name: 'Filters' })
  fireEvent.click(toggle)
  const address = screen.getByRole('textbox', { name: 'Address' })
  fireEvent.change(address, { target: { value: 'Marsz' } })
  fireEvent.click(toggle)
  fireEvent.click(toggle)
  expect(screen.getByRole('textbox', { name: 'Address' })).toBe(address)
  expect(address).toHaveValue('Marsz')
})

const searchButton = () => screen.getByRole('button', { name: 'Search' })

async function press(button: HTMLElement) {
  await act(async () => {
    fireEvent.click(button)
  })
}

it('changes the URL only on search, with one pushed entry for all edits', async () => {
  const { router } = renderWithRouter(<FilterPanel />, { previous: ['/analytics'] })
  fireEvent.change(screen.getByRole('textbox', { name: 'Address' }), { target: { value: 'Mar' } })
  fireEvent.click(screen.getByRole('checkbox', { name: '2 rooms' }))
  fireEvent.change(screen.getByRole('textbox', { name: 'Min price' }), {
    target: { value: '300000' },
  })
  expect(router.state.location.search).toBe('')
  await press(searchButton())
  expect(router.state.location.search).toBe('?price_min=300000&rooms=2&address=Mar')
  expect(router.state.historyAction).toBe('PUSH')
  await act(() => router.navigate(-1))
  expect(router.state.location.search).toBe('')
  expect(router.state.location.pathname).toBe('/')
})

it('searches on Enter in a text input', async () => {
  const { router } = renderWithRouter(<FilterPanel />)
  const input = screen.getByRole('textbox', { name: 'Address' })
  fireEvent.change(input, { target: { value: 'Mar' } })
  await act(async () => {
    fireEvent.submit(input.closest('form')!)
  })
  expect(router.state.location.search).toBe('?address=Mar')
})

it('does not navigate when nothing changed', async () => {
  const { router } = renderWithRouter(<FilterPanel />, { path: '/?rooms=2' })
  const length = window.history.length
  await press(searchButton())
  expect(router.state.location.search).toBe('?rooms=2')
  expect(router.state.historyAction).toBe('POP')
  expect(window.history.length).toBe(length)
})

it('shows "Unapplied changes" while the draft differs and clears it after a search', async () => {
  renderWithRouter(<FilterPanel />)
  expect(screen.queryByText('Unapplied changes')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('checkbox', { name: '3 rooms' }))
  expect(screen.getByText('Unapplied changes')).toBeInTheDocument()
  await press(searchButton())
  expect(screen.queryByText('Unapplied changes')).not.toBeInTheDocument()
})

it('shows the Search button while the panel is collapsed', () => {
  renderWithRouter(<FilterPanel />)
  expect(screen.getByRole('button', { name: /^Filters/ })).toHaveAttribute('aria-expanded', 'false')
  expect(searchButton()).toBeVisible()
})

it('replaces the draft with the applied filters when the URL changes', async () => {
  const { router } = renderWithRouter(<FilterPanel />, { path: '/?rooms=2' })
  fireEvent.click(screen.getByRole('checkbox', { name: '3 rooms' }))
  expect(screen.getByRole('checkbox', { name: '3 rooms' })).toBeChecked()
  await act(() => router.navigate('/?rooms=4'))
  expect(screen.getByRole('checkbox', { name: '3 rooms' })).not.toBeChecked()
  expect(screen.getByRole('checkbox', { name: '4 rooms' })).toBeChecked()
  expect(screen.queryByText('Unapplied changes')).not.toBeInTheDocument()
})
