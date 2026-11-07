import { act, fireEvent, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { renderWithDraft } from '../../../test/render'
import { pickOption } from '../../../test/select'
import { FUNCTION_LABELS } from '../labels'
import { CategorySelectField } from './CategorySelectField'

function renderFunction(path = '/') {
  return renderWithDraft(
    <CategorySelectField filterKey="function" label="Function" labels={FUNCTION_LABELS} />,
    { path },
  )
}

const select = (name: string) => screen.getByRole('combobox', { name })

async function search() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))
  })
}

it('writes the backend value of a readable choice on search and pushes history', async () => {
  const { router } = renderFunction()
  expect(select('Function')).toHaveTextContent('Any')
  await act(() => pickOption(select('Function'), 'Garage'))
  expect(select('Function')).toHaveTextContent('Garage')
  expect(router.state.location.search).toBe('')
  await search()
  expect(router.state.location.search).toBe('?function=garaz')
  expect(router.state.historyAction).toBe('PUSH')
})

it('removes the filter with "Any"', async () => {
  const { router } = renderFunction('/?function=biurowa')
  expect(select('Function')).toHaveTextContent('Office')
  await act(() => pickOption(select('Function'), 'Any'))
  expect(router.state.location.search).toBe('?function=biurowa')
  await search()
  expect(router.state.location.search).toBe('')
})

it('picks a function with the keyboard', async () => {
  const { router } = renderFunction()
  await act(() => pickOption(select('Function'), 'Office'))
  await search()
  expect(router.state.location.search).toBe('?function=biurowa')
})

it('shows an unknown value from the URL as is', () => {
  renderFunction('/?function=magazyn')
  expect(select('Function')).toHaveTextContent('magazyn')
})
