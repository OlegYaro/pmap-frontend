/** Lowercase text without diacritics, for loose matching: `Łódź` → `lodz`. */
export function normalizeForSearch(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/ł/g, 'l')
}

/** True when `query` (trimmed, loosely) is part of any of `texts`; an empty query matches all. */
export function matchesSearch(query: string, ...texts: string[]): boolean {
  const needle = normalizeForSearch(query.trim())
  if (needle === '') return true
  return texts.some((text) => normalizeForSearch(text).includes(needle))
}
