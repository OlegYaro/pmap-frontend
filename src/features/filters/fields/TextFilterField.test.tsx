import { act, fireEvent, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { renderWithDraft } from '../../../test/render'
import { labelFor, MARKET_TYPE_LABELS } from '../labels'
import { decimalDraft, integerDraft, textDraft } from './parsers'
import { TextFilterField } from './TextFilterField'

function renderAddress(path = '/', previous: string[] = []) {
  const view = renderWithDraft(
    <TextFilterField filterKey="address" label="Address" helperText="Part of the address" />,
    { path, previous },
  )
  const writes: string[] = []
  view.router.subscribe((state) => writes.push(state.location.search))
  return { ...view, writes, input: screen.getByRole('textbox', { name: 'Address' }) }
}

async function search() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))
  })
}

it('sends nothing while typing and writes the URL once on search', async () => {
  const { input, router, writes } = renderAddress('/', ['/analytics'])
  fireEvent.change(input, { target: { value: 'M' } })
  fireEvent.change(input, { target: { value: 'Ma' } })
  fireEvent.change(input, { target: { value: 'Mar' } })
  expect(input).toHaveValue('Mar')
  expect(writes).toEqual([])
  expect(router.state.location.search).toBe('')
  await search()
  expect(router.state.location.search).toBe('?address=Mar')
  expect(new Set(writes)).toEqual(new Set(['?address=Mar']))
  expect(router.state.historyAction).toBe('PUSH')
})

it('shows a value changed elsewhere', async () => {
  const { input, router } = renderAddress('/?address=Mar')
  expect(input).toHaveValue('Mar')
  await act(() => router.navigate('/'))
  expect(input).toHaveValue('')
})

it('replaces an edit with the applied value when the URL changes', async () => {
  const { input, router } = renderAddress('/?address=Mar&rooms=2')
  fireEvent.change(input, { target: { value: 'Marsz' } })
  await act(() => router.navigate('/?rooms=2'))
  expect(input).toHaveValue('')
})

it('keeps a trailing space after a search', async () => {
  const { input, router } = renderAddress()
  fireEvent.change(input, { target: { value: 'Mar ' } })
  await search()
  expect(router.state.location.search).toBe('?address=Mar')
  expect(input).toHaveValue('Mar ')
})

it('removes the filter when cleared and searched', async () => {
  const { input, router } = renderAddress('/?address=Mar')
  fireEvent.change(input, { target: { value: '' } })
  expect(router.state.location.search).toBe('?address=Mar')
  await search()
  expect(router.state.location.search).toBe('')
})

it('describes the input with the helper text', () => {
  const { input } = renderAddress()
  expect(input).toHaveAccessibleDescription('Part of the address')
})

it('reads drafts', () => {
  expect(textDraft('  a b ')).toEqual({ ok: true, value: 'a b' })
  expect(decimalDraft('42,5')).toEqual({ ok: true, value: 42.5 })
  expect(decimalDraft('')).toEqual({ ok: true, value: undefined })
  expect(decimalDraft('abc')).toEqual({ ok: false })
  expect(decimalDraft('-1')).toEqual({ ok: false })
  expect(integerDraft('-1')).toEqual({ ok: true, value: -1 })
  expect(integerDraft('2.5')).toEqual({ ok: false })
})

it('labels known values and passes unknown ones through', () => {
  expect(labelFor(MARKET_TYPE_LABELS, 'pierwotny')).toBe('Primary')
  expect(labelFor(MARKET_TYPE_LABELS, 'rynekPierwotny')).toBe('Primary')
  expect(labelFor(MARKET_TYPE_LABELS, 'wtorny')).toBe('Secondary')
  expect(labelFor(MARKET_TYPE_LABELS, 'rynekWtorny')).toBe('Secondary')
  expect(labelFor(MARKET_TYPE_LABELS, 'nowy')).toBe('nowy')
  expect(labelFor(MARKET_TYPE_LABELS, 'toString')).toBe('toString')
})
