import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../api/client'
import type { TransactionFilters } from '../filters/model'
import { downloadFile } from './download'
import { parseExportStatus, parseStartExport } from './exportStatus'

/** Time between status requests, and after `SLOW_AFTER_MS` since the start. */
export const POLL_INTERVAL_MS = 2_000
export const SLOW_POLL_INTERVAL_MS = 5_000
export const SLOW_AFTER_MS = 30_000
/** The export is given up this long after the start. */
export const EXPORT_TIMEOUT_MS = 10 * 60_000

export type ExportRunStatus = 'idle' | 'running'

/** Text for the live region; empty before the first export. */
export type ExportAnnouncement = '' | 'Preparing export' | 'Export ready' | 'Export failed'

/** One export run: an id of the current run that callbacks compare with, and its request. */
interface Run {
  controller: AbortController
  timer: ReturnType<typeof setTimeout> | null
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error'
}

/**
 * Starts a CSV export of the transactions matching `filters` and follows it until the file is
 * ready: `POST /exports`, then `GET /exports/{id}` on a timer (2 s, 5 s after 30 s, given up after
 * 10 min). The file is downloaded when it is done; failures show an error toast. `start` does
 * nothing while an export runs. Unmounting stops the timer and the request and silences the run.
 */
export function useExport(filters: TransactionFilters) {
  const [status, setStatus] = useState<ExportRunStatus>('idle')
  const [announcement, setAnnouncement] = useState<ExportAnnouncement>('')
  const runRef = useRef<Run | null>(null)
  const filtersRef = useRef(filters)
  useEffect(() => {
    filtersRef.current = filters
  })

  useEffect(
    () => () => {
      const run = runRef.current
      runRef.current = null
      if (run === null) return
      if (run.timer !== null) clearTimeout(run.timer)
      run.controller.abort()
    },
    [],
  )

  const start = useCallback(() => {
    if (runRef.current !== null) return
    const run: Run = { controller: new AbortController(), timer: null }
    const startedAt = Date.now()
    runRef.current = run
    setStatus('running')
    setAnnouncement('Preparing export')

    const isCurrent = () => runRef.current === run
    const finish = (next: ExportAnnouncement) => {
      runRef.current = null
      setStatus('idle')
      setAnnouncement(next)
    }
    const fail = (message: string) => {
      finish('Export failed')
      toast.error(message)
    }

    const schedule = (id: string) => {
      const elapsed = Date.now() - startedAt
      const delay = elapsed < SLOW_AFTER_MS ? POLL_INTERVAL_MS : SLOW_POLL_INTERVAL_MS
      run.timer = setTimeout(() => void poll(id), delay)
    }

    const poll = async (id: string) => {
      run.timer = null
      if (!isCurrent()) return
      if (Date.now() - startedAt >= EXPORT_TIMEOUT_MS) {
        fail('The export is taking too long. Try again later.')
        return
      }
      try {
        const { data } = await api.GET('/exports/{export_id}', {
          params: { path: { export_id: id } },
          signal: run.controller.signal,
        })
        if (!isCurrent()) return
        const result = parseExportStatus(data)
        if (result.status === 'pending') {
          schedule(id)
        } else if (result.status === 'done') {
          finish('Export ready')
          downloadFile(result.url)
        } else {
          fail(`Export failed: ${result.error ?? 'the server could not build the file'}`)
        }
      } catch (error) {
        if (isCurrent()) fail(`Could not get the export status: ${messageOf(error)}`)
      }
    }

    const begin = async () => {
      try {
        const { data } = await api.POST('/exports', {
          params: { query: filtersRef.current },
          signal: run.controller.signal,
        })
        if (!isCurrent()) return
        schedule(parseStartExport(data))
      } catch (error) {
        if (isCurrent()) fail(`Could not start the export: ${messageOf(error)}`)
      }
    }

    void begin()
  }, [])

  return { status, start, announcement }
}
