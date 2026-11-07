import { parseInteger, parseIsoDate, parseNonNegative, parseText } from '../params'

/** Result of reading what the user typed: a value (undefined = cleared) or invalid input. */
export type DraftResult<T> = { ok: true; value: T | undefined } | { ok: false }

/** Reads a draft; an empty draft clears the filter, anything else goes through `parse`. */
function draftParser<T>(parse: (text: string) => T | undefined) {
  return (draft: string): DraftResult<T> => {
    const text = draft.trim()
    if (text === '') return { ok: true, value: undefined }
    const value = parse(text)
    return value === undefined ? { ok: false } : { ok: true, value }
  }
}

/** Free text: trimmed, never invalid. */
export const textDraft = (draft: string): DraftResult<string> => ({
  ok: true,
  value: parseText(draft),
})

/** A number >= 0; a comma is accepted as the decimal separator. */
export const decimalDraft = draftParser((text) => parseNonNegative(text.replace(',', '.')))

/** A whole number, negative allowed. */
export const integerDraft = draftParser(parseInteger)

/** A `YYYY-MM-DD` date, as produced by a date input. */
export const dateDraft = draftParser(parseIsoDate)
