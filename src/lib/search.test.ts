import { expect, it } from 'vitest'
import { matchesSearch, normalizeForSearch } from './search'

it('removes case and Polish diacritics', () => {
  expect(normalizeForSearch('Łódź')).toBe('lodz')
  expect(normalizeForSearch('ŚWIĘTOKRZYSKIE')).toBe('swietokrzyskie')
  expect(normalizeForSearch('Bolesławiec')).toBe('boleslawiec')
})

it('matches the label or another text such as the code', () => {
  expect(matchesSearch('lodz', 'Łódź', '1061')).toBe(true)
  expect(matchesSearch('LÓDŹ', 'Łódź', '1061')).toBe(true)
  expect(matchesSearch('1061', 'Łódź', '1061')).toBe(true)
  expect(matchesSearch(' ódź ', 'Łódź')).toBe(true)
  expect(matchesSearch('zzz', 'Łódź', '1061')).toBe(false)
  expect(matchesSearch('', 'Łódź')).toBe(true)
})
