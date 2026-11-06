/** A failed backend call: the HTTP status, a readable message and the parsed body (if any). */
export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, message: string, body: unknown = undefined) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

// FastAPI puts where the bad value came from first in `loc`; the field name follows.
const LOC_SOURCES = new Set(['body', 'query', 'path', 'header', 'cookie'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validationItem(item: unknown): string | null {
  if (!isRecord(item) || typeof item.msg !== 'string') return null
  const loc = Array.isArray(item.loc) ? item.loc.map(String) : []
  if (loc.length > 0 && LOC_SOURCES.has(loc[0])) loc.shift()
  return loc.length > 0 ? `${loc.join('.')}: ${item.msg}` : item.msg
}

/** The readable message for an error body; null when the body has nothing usable. */
export function errorMessage(body: unknown): string | null {
  if (!isRecord(body)) return null
  const { detail, message } = body
  if (typeof detail === 'string' && detail !== '') return detail
  if (Array.isArray(detail)) {
    const items = detail.map(validationItem).filter((text) => text !== null)
    if (items.length > 0) return items.join('; ')
  }
  if (typeof message === 'string' && message !== '') return message
  return null
}

/** Parse a JSON body; undefined when it is empty or not JSON. */
export function parseBody(text: string): unknown {
  if (text === '') return undefined
  try {
    return JSON.parse(text) as unknown
  } catch {
    return undefined
  }
}

/** Build an ApiError from a failed response. Reads the body: pass a clone if it is still needed. */
export async function toApiError(response: Response): Promise<ApiError> {
  let body: unknown
  try {
    body = parseBody(await response.text())
  } catch {
    body = undefined
  }
  const message = errorMessage(body) ?? `Request failed with status ${response.status}`
  return new ApiError(response.status, message, body)
}
