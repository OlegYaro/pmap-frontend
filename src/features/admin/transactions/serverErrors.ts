import { ApiError } from '../../../api/errors'
import { FORM_FIELDS, type FormField } from './formSchema'
import { API_NAMES } from './payload'

export const NOT_FOUND_MESSAGE = 'This transaction no longer exists'

export interface FieldError {
  field: FormField
  message: string
}

/** A failed save split into messages for single fields and messages for the top of the form. */
export interface ServerErrors {
  fields: FieldError[]
  form: string[]
}

const FIELD_OF = new Map<string, FormField>(FORM_FIELDS.map((field) => [API_NAMES[field], field]))

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** The 422 `detail` entries of FastAPI that have a message. */
function validationItems(body: unknown): { loc: string[]; msg: string }[] {
  if (!isRecord(body) || !Array.isArray(body.detail)) return []
  return body.detail.flatMap((item: unknown) =>
    isRecord(item) && typeof item.msg === 'string'
      ? [{ loc: Array.isArray(item.loc) ? item.loc.map(String) : [], msg: item.msg }]
      : [],
  )
}

/**
 * Where to show a failed save. A 422 message located at `body.<name>` goes to the form field of
 * that body name; other 422 messages, a 404 when `notFound` is given (as that text) and every other
 * failure (with its message) go to the top.
 */
export function serverErrors(error: unknown, notFound?: string): ServerErrors {
  if (error instanceof ApiError && error.status === 404 && notFound !== undefined) {
    return { fields: [], form: [notFound] }
  }
  const items = error instanceof ApiError && error.status === 422 ? validationItems(error.body) : []
  if (items.length === 0) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { fields: [], form: [message] }
  }
  const result: ServerErrors = { fields: [], form: [] }
  for (const { loc, msg } of items) {
    const path = loc[0] === 'body' ? loc.slice(1) : loc
    const field = loc[0] === 'body' ? FIELD_OF.get(path[0]) : undefined
    if (field !== undefined) result.fields.push({ field, message: msg })
    else result.form.push(path.length > 0 ? `${path.join('.')}: ${msg}` : msg)
  }
  return result
}
