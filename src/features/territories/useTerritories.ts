import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'

/** All territories (voivodeships, powiats, gminas). Failures are ApiErrors. */
export function useTerritories() {
  return useQuery({
    queryKey: ['territories'],
    queryFn: async () => {
      const { data } = await api.GET('/territories')
      return data ?? []
    },
  })
}
