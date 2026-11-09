import { expect, it } from 'vitest'
import { ApiError } from '../../../api/errors'
import { NOT_FOUND_MESSAGE, serverErrors } from './serverErrors'

const validation = (...detail: unknown[]) => new ApiError(422, 'Validation failed', { detail })

it('puts a 422 message located at a body field on the form field', () => {
  const error = validation(
    { loc: ['body', 'area_usable'], msg: 'Input should be greater than 0', type: 'greater_than' },
    { loc: ['body', 'powiat_code'], msg: 'String should match pattern', type: 'string_pattern' },
  )
  expect(serverErrors(error)).toEqual({
    fields: [
      { field: 'area', message: 'Input should be greater than 0' },
      { field: 'powiat', message: 'String should match pattern' },
    ],
    form: [],
  })
})

it('puts a 422 message of an unknown location at the top', () => {
  const error = validation(
    { loc: ['body', 'attributes'], msg: 'Extra inputs are not permitted' },
    { loc: ['body'], msg: 'Field required' },
    { loc: ['path', 'transaction_id'], msg: 'Input should be a valid integer' },
    { loc: ['body', 'rooms'], msg: 'Input should be greater than or equal to 1' },
  )
  expect(serverErrors(error)).toEqual({
    fields: [{ field: 'rooms', message: 'Input should be greater than or equal to 1' }],
    form: [
      'attributes: Extra inputs are not permitted',
      'Field required',
      'path.transaction_id: Input should be a valid integer',
    ],
  })
})

it('shows a 422 without a detail list with its message', () => {
  expect(serverErrors(new ApiError(422, 'Bad powiat', { detail: 'Bad powiat' }))).toEqual({
    fields: [],
    form: ['Bad powiat'],
  })
})

it('shows any other failure with its message at the top', () => {
  expect(serverErrors(new ApiError(502, 'Extraction request failed'))).toEqual({
    fields: [],
    form: ['Extraction request failed'],
  })
  expect(serverErrors(new TypeError('Failed to fetch')).form).toEqual(['Failed to fetch'])
  expect(serverErrors('boom').form).toEqual(['Unknown error'])
})

it('uses the not-found text for a 404 when it is given', () => {
  const error = new ApiError(404, 'Not found')
  expect(serverErrors(error, NOT_FOUND_MESSAGE)).toEqual({
    fields: [],
    form: ['This transaction no longer exists'],
  })
  expect(serverErrors(error).form).toEqual(['Not found'])
})
