import { act, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { expect, it } from 'vitest'
import { UNEXPECTED_RESPONSE } from '../../api/admin-types'
import { ApiError } from '../../api/errors'
import { OTHER_RUN_ID, stubAdminApi } from '../../test/admin'
import { callsTo, jsonResponse } from '../../test/http'
import { renderWithRouter } from '../../test/render'
import { useRuns } from './useRuns'
import { useStartRun } from './useStartRun'

const RUNS = '/api/admin/runs'

let mutation: ReturnType<typeof useStartRun>

/** The start mutation next to a runs list, to see the list requested again. */
function Probe() {
  const result = useStartRun()
  useRuns(20)
  useEffect(() => {
    mutation = result
  })
  return null
}

const posts = (mock: ReturnType<typeof stubAdminApi>) =>
  callsTo(mock, RUNS).filter((request) => request.method === 'POST')
const gets = (mock: ReturnType<typeof stubAdminApi>) =>
  callsTo(mock, RUNS).filter((request) => request.method === 'GET')

async function renderStarted(path = '/admin?tab=runs') {
  const view = renderWithRouter(<Probe />, { path })
  await waitFor(() => expect(mutation).toBeDefined())
  return view
}

it('sends territory_code for one powiat, selects the new run and refreshes the list', async () => {
  const mock = stubAdminApi()
  const { router } = await renderStarted()
  await waitFor(() => expect(gets(mock)).toHaveLength(1))

  await act(() => mutation.mutateAsync('0264'))

  const [request] = posts(mock)
  expect(new URL(request.url).searchParams.get('territory_code')).toBe('0264')
  expect(router.state.location.search).toBe(`?tab=runs&run=${OTHER_RUN_ID}`)
  expect(router.state.historyAction).toBe('REPLACE')
  await waitFor(() => expect(gets(mock)).toHaveLength(2))
})

it('sends no territory_code for all of Poland', async () => {
  const mock = stubAdminApi()
  await renderStarted()

  await act(() => mutation.mutateAsync(undefined))

  const [request] = posts(mock)
  expect([...new URL(request.url).searchParams.keys()]).toEqual([])
})

it('treats a body without run_id as an error and selects nothing', async () => {
  stubAdminApi({ start: () => jsonResponse(202, { id: 'r1' }) })
  const { router } = await renderStarted('/admin')

  await act(() => mutation.mutateAsync(undefined).catch(() => {}))

  await waitFor(() => expect(mutation.error?.message).toBe(UNEXPECTED_RESPONSE))
  expect(router.state.location.search).toBe('')
})

it('fails with the ApiError of a 502', async () => {
  stubAdminApi({ start: () => jsonResponse(502, { detail: 'Bad gateway' }) })
  const { router } = await renderStarted('/admin')

  await act(() => mutation.mutateAsync('0264').catch(() => {}))

  await waitFor(() => expect(mutation.error).toBeInstanceOf(ApiError))
  expect(mutation.error).toMatchObject({ status: 502, message: 'Bad gateway' })
  expect(router.state.location.search).toBe('')
})
