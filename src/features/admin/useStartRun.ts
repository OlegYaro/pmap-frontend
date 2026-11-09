import { useMutation, useQueryClient } from '@tanstack/react-query'
import { parseRunStarted } from '../../api/admin-types'
import { api } from '../../api/client'
import { useAdminParams } from './useAdminParams'
import { RUNS_QUERY_KEY } from './useRuns'

/**
 * Starts a sync run (`POST /admin/runs`) for one powiat, or for all of Poland when the code is
 * undefined. On success the runs lists are requested again and the new run is selected. Failures
 * are ApiErrors (the backend answers 502 also when a run is already going on); a body without a
 * run id is an error.
 */
export function useStartRun() {
  const queryClient = useQueryClient()
  const { selectRun } = useAdminParams()
  return useMutation({
    mutationFn: async (territoryCode: string | undefined) => {
      const query = territoryCode === undefined ? {} : { territory_code: territoryCode }
      const { data } = await api.POST('/admin/runs', { params: { query } })
      return parseRunStarted(data).run_id
    },
    onSuccess: (runId) => {
      selectRun(runId)
      void queryClient.invalidateQueries({ queryKey: RUNS_QUERY_KEY })
    },
  })
}
