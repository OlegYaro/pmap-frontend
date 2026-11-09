import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { summaryResponse } from '../../test/analytics'
import { KpiCards } from './KpiCards'
import type { Summary } from './useAnalyticsData'

function renderCards(overrides: Partial<Summary> = {}) {
  const result = render(<KpiCards summary={summaryResponse(overrides)} />)
  const titles = screen.getAllByRole('term').map((term) => term.textContent)
  const values = screen.getAllByRole('definition')
  return { ...result, titles, values }
}

const changeCard = () => screen.getAllByRole('definition')[2]

it('shows the four cards in order with their values', () => {
  const { titles, values } = renderCards()
  expect(titles).toEqual([
    'Median price per m²',
    'Transactions',
    'Change vs year earlier',
    'Previous-year median',
  ])
  expect(values.map((value) => value.textContent)).toEqual([
    '11,000 PLN/m²',
    '40',
    '+10%up',
    '10,000 PLN/m²',
  ])
})

it('marks a rise with an up arrow and the text "up"', () => {
  const { container } = renderCards({ change_pct: 10 })
  expect(changeCard()).toHaveTextContent('+10%')
  expect(screen.getByText('up')).toHaveClass('sr-only')
  expect(container.querySelector('.lucide-arrow-up')).toHaveClass('text-success')
  expect(container.querySelector('.lucide-arrow-down')).toBeNull()
})

it('marks a fall with a down arrow and the text "down"', () => {
  const { container } = renderCards({ change_pct: -3.4 })
  expect(changeCard()).toHaveTextContent('-3.4%')
  expect(screen.getByText('down')).toHaveClass('sr-only')
  expect(container.querySelector('.lucide-arrow-down')).toHaveClass('text-destructive')
  expect(container.querySelector('.lucide-arrow-up')).toBeNull()
})

it('shows no change without an arrow', () => {
  const { container } = renderCards({ change_pct: 0 })
  expect(changeCard()).toHaveTextContent(/^0%$/)
  expect(container.querySelector('svg')).toBeNull()
  expect(screen.queryByText('up')).not.toBeInTheDocument()
  expect(screen.queryByText('down')).not.toBeInTheDocument()
})

it('shows a missing change as "n/a" without an arrow', () => {
  const { container, values } = renderCards({
    change_pct: null,
    previous_median: null,
    median: 9000,
  })
  expect(values.map((value) => value.textContent)).toEqual(['9,000 PLN/m²', '40', 'n/a', 'n/a'])
  expect(container.querySelector('svg')).toBeNull()
})

it('keeps the titles when the medians are missing and shows a zero count', () => {
  const { titles, values } = renderCards({ median: null, previous_median: null, count: 0 })
  expect(titles).toHaveLength(4)
  expect(values.map((value) => value.textContent)).toEqual(['n/a', '0', '+10%up', 'n/a'])
})

it('rounds prices to whole złoty', () => {
  const { values } = renderCards({ median: 10999.6, previous_median: 10000.4 })
  expect(values[0]).toHaveTextContent('11,000 PLN/m²')
  expect(values[3]).toHaveTextContent('10,000 PLN/m²')
})

it('agrees with the shown, rounded value', () => {
  const { container } = renderCards({ change_pct: -0.04 })
  expect(changeCard()).toHaveTextContent(/^0%$/)
  expect(container.querySelector('svg')).toBeNull()
})
