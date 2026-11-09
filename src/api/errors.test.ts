import { describe, expect, it } from 'vitest'
import { ApiError, toApiError } from './errors'

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('toApiError', () => {
  it('uses a string detail as the message', async () => {
    const error = await toApiError(json(401, { detail: 'Invalid login or password' }))
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('ApiError')
    expect(error.status).toBe(401)
    expect(error.message).toBe('Invalid login or password')
  })

  it('lists every validation error of a 422 as "<field>: <msg>"', async () => {
    const body = {
      detail: [
        { type: 'missing', loc: ['body', 'login'], msg: 'Field required', input: {} },
        { type: 'missing', loc: ['body', 'password'], msg: 'Field required', input: {} },
      ],
    }
    const error = await toApiError(json(422, body))
    expect(error.status).toBe(422)
    expect(error.message).toBe('login: Field required; password: Field required')
  })

  it('joins a nested location with dots', async () => {
    const body = {
      detail: [
        {
          type: 'int_parsing',
          loc: ['query', 'filter', 'year'],
          msg: 'Input should be a valid integer',
        },
      ],
    }
    const error = await toApiError(json(422, body))
    expect(error.message).toBe('filter.year: Input should be a valid integer')
  })

  it('shows only the message when the location has nothing after its source', async () => {
    const body = { detail: [{ type: 'json_invalid', loc: ['body'], msg: 'JSON decode error' }] }
    const error = await toApiError(json(422, body))
    expect(error.message).toBe('JSON decode error')
  })

  it('uses the message of a gateway error', async () => {
    const error = await toApiError(json(403, { message: 'Forbidden' }))
    expect(error.status).toBe(403)
    expect(error.message).toBe('Forbidden')
  })

  it('falls back to the status for an empty body', async () => {
    const error = await toApiError(new Response(null, { status: 500 }))
    expect(error.message).toBe('Request failed with status 500')
    expect(error.body).toBeUndefined()
  })

  it('falls back to the status for a body that is not JSON', async () => {
    const response = new Response('<html>Bad Gateway</html>', {
      status: 502,
      headers: { 'Content-Type': 'text/html' },
    })
    const error = await toApiError(response)
    expect(error.status).toBe(502)
    expect(error.message).toBe('Request failed with status 502')
  })

  it('keeps the status and the parsed body', async () => {
    const body = { detail: 'Transaction not found' }
    const error = await toApiError(json(404, body))
    expect(error.status).toBe(404)
    expect(error.body).toEqual(body)
  })
})
