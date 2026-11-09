import { skipToken, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { parseRunStatus } from '../../api/admin-types'
import { api } from '../../api/client'
import { RUN_POLL_INTERVAL_MS } from './useRuns'

const runQueryKey = (runId: string | null) => ['admin', 'run', runId] as const

/**
 * One run's status (`GET /admin/runs/{run_id}`); a null id is never requested. A missing run is an
 * ApiError with status 404; a body that does not match the documented shape is an error. While
 * `running` (the run has no finish time in the list) it is requested again every 5 s, and once
 * more when it stops running, so the final counters are shown.
 */
export function useRun(runId: string | null, running: boolean) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: runQueryKey(runId),
    queryFn:
      runId === null
        ? skipToken
        : async ({ signal }) => {
            const { data } = await api.GET('/admin/runs/{run_id}', {
              params: { path: { run_id: runId } },
              signal,
            })
            return parseRunStatus(data)
          },
    refetchInterval: running ? RUN_POLL_INTERVAL_MS : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  })

  // Not through `query.refetch`: reading a field of the result would make it re-render only when
  // that field changes.
  const wasRunning = useRef(running)
  useEffect(() => {
    if (wasRunning.current && !running && runId !== null) {
      void queryClient.refetchQueries({ queryKey: runQueryKey(runId), exact: true })
    }
    wasRunning.current = running
  }, [running, runId, queryClient])

  return query
}
