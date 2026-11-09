import { useCallback, useMemo } from 'react'
import { useTerritories } from '../territories/useTerritories'
import { buildTerritoryOptions, type TerritoryLevel } from './territoryOptions'

const NO_ROWS: never[] = []

/**
 * Territory options for the filter cascade, built once from the cached `GET /territories` list.
 * `nameOf` gives the label of a code, or the code itself while loading, after an error, or when the
 * code is not in the list.
 */
export function useTerritoryOptions() {
  const { data, status, refetch, isFetching } = useTerritories()
  const options = useMemo(() => buildTerritoryOptions(data ?? NO_ROWS), [data])
  const nameOf = useCallback(
    (level: TerritoryLevel, code: string) => options.byCode[level].get(code)?.label ?? code,
    [options],
  )
  return { status, options, nameOf, refetch, isFetching }
}

export type NameOf = ReturnType<typeof useTerritoryOptions>['nameOf']
