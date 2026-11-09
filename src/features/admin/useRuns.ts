import { useQuery } from '@tanstack/react-query'
import { parseRunList, type RunListItem } from '../../api/admin-types'
import { api } from '../../api/client'
import type { RunsLimit } from './useAdminParams'

/** Time between refreshes of the runs list and the run detail while a run goes on. */
export const RUN_POLL_INTERVAL_MS = 5_000

/** True when a listed run has no finish time yet. */
export function hasUnfinishedRun(runs: readonly RunListItem[] | undefined): boolean {
  return runs?.some((run) => run.finished_at === null) ?? false
}

/** Query key prefix of every runs list, for invalidating them all. */
export const RUNS_QUERY_KEY = ['admin', 'runs'] as const

/**
 * The latest `limit` runs (`GET /admin/runs`), newest first. A body that does not match the
 * documented shape is an error. While a listed run is unfinished the list is requested again every
 * 5 s (not in a background tab, not on window focus); a failed refresh keeps the previous rows.
 */
export function useRuns(limit: RunsLimit) {
  return useQuery({
    queryKey: [...RUNS_QUERY_KEY, limit],
    queryFn: async ({ signal }) => {
      const { data } = await api.GET('/admin/runs', { params: { query: { limit } }, signal })
      return parseRunList(data)
    },
    refetchInterval: (query) => (hasUnfinishedRun(query.state.data) ? RUN_POLL_INTERVAL_MS : false),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  })
}
