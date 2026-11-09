import { describe, expect, it } from 'vitest'
import { base64Url, fakeAccessToken } from '../test/auth'
import { readAccessToken } from './jwt'

describe('readAccessToken', () => {
  it('reads id, role and expiry of an admin token', () => {
    const token = fakeAccessToken({ sub: '1', role: 'admin', exp: 1_800_000_000 })
    expect(readAccessToken(token)).toEqual({
      id: '1',
      role: 'admin',
      expiresAt: new Date(1_800_000_000_000),
    })
  })

  it('reads a regular user token', () => {
    expect(readAccessToken(fakeAccessToken({ sub: '7', role: 'user' }))).toMatchObject({
      id: '7',
      role: 'user',
      expiresAt: null,
    })
  })

  it('decodes base64url characters and missing padding', () => {
    const token = fakeAccessToken({ sub: '2', role: 'admin', note: '???>>>~~~?>' })
    const payload = token.split('.')[1]
    expect(payload).toMatch(/[-_]/)
    expect(payload).not.toContain('=')
    expect(readAccessToken(token)).toMatchObject({ id: '2', role: 'admin' })
  })

  it('decodes UTF-8 claim values', () => {
    expect(readAccessToken(fakeAccessToken({ sub: 'Łódź', role: 'użytkownik' }))).toMatchObject({
      id: 'Łódź',
      role: 'użytkownik',
    })
  })

  it.each([
    ['not a token', 'abc'],
    ['two parts', 'a.b'],
    ['payload not base64', 'a.!!!.c'],
    ['payload not JSON', `a.${base64Url('nope')}.c`],
    ['payload an array', `a.${base64Url('[1]')}.c`],
    ['payload null', `a.${base64Url('null')}.c`],
    ['payload a string', `a.${base64Url('"admin"')}.c`],
  ])('gives null for %s', (_, token) => {
    expect(readAccessToken(token)).toBeNull()
  })

  it('ignores non-string role and sub and a non-number exp', () => {
    expect(readAccessToken(fakeAccessToken({ sub: 1, role: ['admin'], exp: 'soon' }))).toEqual({
      id: null,
      role: null,
      expiresAt: null,
    })
  })
})
