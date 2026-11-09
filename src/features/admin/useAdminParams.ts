import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

export const ADMIN_TABS = ['runs', 'transactions'] as const
export type AdminTab = (typeof ADMIN_TABS)[number]

/** Choices of the "Show" selector; the first is the default. */
export const RUN_LIMITS = [20, 50, 100] as const
export type RunsLimit = (typeof RUN_LIMITS)[number]

/** The tab of a `tab` value; a missing or unknown value means "runs". */
export function parseTab(value: string | null): AdminTab {
  return ADMIN_TABS.find((tab) => tab === value) ?? 'runs'
}

/** The list size of a `limit` value; anything but 20, 50 or 100 means 20. */
export function parseLimit(value: string | null): RunsLimit {
  return RUN_LIMITS.find((limit) => String(limit) === value) ?? RUN_LIMITS[0]
}

/** The selected run id of a `run` value, or null when it is missing or blank. */
export function parseRunId(value: string | null): string | null {
  const id = value?.trim() ?? ''
  return id === '' ? null : id
}

/**
 * The admin page state kept in the URL: `tab`, `limit` and the selected `run`. Changing the tab or
 * the limit pushes a history entry; selecting a run replaces it, so Back does not walk through
 * every run clicked.
 */
export function useAdminParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = parseTab(searchParams.get('tab'))
  const limit = parseLimit(searchParams.get('limit'))
  const runId = parseRunId(searchParams.get('run'))

  const write = useCallback(
    (key: string, value: string, replace: boolean) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          next.set(key, value)
          return next
        },
        { replace, preventScrollReset: true },
      )
    },
    [setSearchParams],
  )

  const setTab = useCallback(
    (next: AdminTab) => {
      if (next !== tab) write('tab', next, false)
    },
    [tab, write],
  )
  const setLimit = useCallback(
    (next: RunsLimit) => {
      if (next !== limit) write('limit', String(next), false)
    },
    [limit, write],
  )
  const selectRun = useCallback((id: string) => write('run', id, true), [write])

  return { tab, limit, runId, setTab, setLimit, selectRun }
}
