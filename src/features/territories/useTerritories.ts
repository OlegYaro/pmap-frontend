import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'

/**
 * All territories (voivodeships, powiats, gminas). Failures are ApiErrors. The list changes only with
 * a backend deploy, so it is fetched once per page load and shared by every user of this hook.
 */
export function useTerritories() {
  return useQuery({
    queryKey: ['territories'],
    queryFn: async () => {
      const { data } = await api.GET('/territories')
      return data ?? []
    },
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
