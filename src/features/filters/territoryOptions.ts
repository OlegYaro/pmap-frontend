import type { components } from '../../api/schema'
import type { TransactionFilters } from './model'

type TerritoryRow = components['schemas']['TerritoryResponse']

export type TerritoryLevel = 'voivodeship' | 'powiat' | 'gmina'

export interface TerritoryOption {
  /** TERYT code: 2 digits for a voivodeship, 4 for a powiat, 7 for a gmina. */
  code: string
  name: string
  /** The name, plus the code when another option of the same parent has the same name. */
  label: string
}

export interface TerritoryOptions {
  voivodeships: TerritoryOption[]
  allPowiats: TerritoryOption[]
  powiatsByVoivodeship: Map<string, TerritoryOption[]>
  gminasByPowiat: Map<string, TerritoryOption[]>
  byCode: Record<TerritoryLevel, Map<string, TerritoryOption>>
}

const collator = new Intl.Collator('pl')

function byName(a: TerritoryOption, b: TerritoryOption) {
  return collator.compare(a.name, b.name) || a.code.localeCompare(b.code)
}

/** Sorted options with labels that tell apart equal names. */
function finish(options: Iterable<TerritoryOption>): TerritoryOption[] {
  const list = [...options].sort(byName)
  const counts = new Map<string, number>()
  for (const option of list) counts.set(option.name, (counts.get(option.name) ?? 0) + 1)
  return list.map((option) =>
    (counts.get(option.name) ?? 0) > 1
      ? { ...option, label: `${option.name} (${option.code})` }
      : option,
  )
}

function addToGroup(
  groups: Map<string, Map<string, TerritoryOption>>,
  parent: string,
  code: string,
  name: string,
) {
  let group = groups.get(parent)
  if (!group) {
    group = new Map()
    groups.set(parent, group)
  }
  if (!group.has(code)) group.set(code, { code, name, label: name })
}

/** Voivodeship, powiat and gmina options from the flat `GET /territories` rows. */
export function buildTerritoryOptions(rows: readonly TerritoryRow[]): TerritoryOptions {
  const voivodeships = new Map<string, TerritoryOption>()
  const powiats = new Map<string, TerritoryOption>()
  const gminas = new Map<string, Map<string, TerritoryOption>>()

  for (const row of rows) {
    const voivodeship = row.voivodeship_teryt
    if (!voivodeships.has(voivodeship)) {
      voivodeships.set(voivodeship, {
        code: voivodeship,
        name: row.voivodeship_name,
        label: row.voivodeship_name,
      })
    }
    const { powiat_teryt: powiat, powiat_name: powiatName } = row
    if (powiat && powiatName && !powiats.has(powiat)) {
      powiats.set(powiat, { code: powiat, name: powiatName, label: powiatName })
    }
    if (row.gmina_teryt && row.gmina_name) {
      addToGroup(
        gminas,
        row.powiat_teryt ?? row.gmina_teryt.slice(0, 4),
        row.gmina_teryt,
        row.gmina_name,
      )
    }
  }

  // Powiat names repeat across voivodeships ("bielski"), and every powiat can be listed at once, so
  // powiat labels are made unique over the whole country.
  const allPowiats = finish(powiats.values())
  const powiatsByVoivodeship = new Map<string, TerritoryOption[]>()
  for (const option of allPowiats) {
    const parent = option.code.slice(0, 2)
    powiatsByVoivodeship.set(parent, [...(powiatsByVoivodeship.get(parent) ?? []), option])
  }
  const gminasByPowiat = new Map(
    [...gminas].map(([parent, group]) => [parent, finish(group.values())] as const),
  )
  const index = (lists: Iterable<TerritoryOption[]>) =>
    new Map([...lists].flat().map((option) => [option.code, option] as const))

  const voivodeshipList = finish(voivodeships.values())
  return {
    voivodeships: voivodeshipList,
    allPowiats,
    powiatsByVoivodeship,
    gminasByPowiat,
    byCode: {
      voivodeship: index([voivodeshipList]),
      powiat: index(powiatsByVoivodeship.values()),
      gmina: index(gminasByPowiat.values()),
    },
  }
}

/** Powiats of the voivodeship, or every powiat when none is selected. */
export function powiatChoices(options: TerritoryOptions, voivodeship?: string): TerritoryOption[] {
  if (voivodeship === undefined) return options.allPowiats
  return options.powiatsByVoivodeship.get(voivodeship) ?? []
}

/** Gminas of the powiat; none until a powiat is selected. */
export function gminaChoices(options: TerritoryOptions, powiat?: string): TerritoryOption[] {
  if (powiat === undefined) return []
  return options.gminasByPowiat.get(powiat) ?? []
}

/** Selecting (or clearing) a voivodeship; a different value clears powiat and gmina. */
export function selectVoivodeship(filters: TransactionFilters, code?: string): TransactionFilters {
  if (code === filters.voivodeship_code) return filters
  return { ...filters, voivodeship_code: code, powiat_code: undefined, gmina_code: undefined }
}

/** Selecting (or clearing) a powiat; sets its voivodeship, a different value clears the gmina. */
export function selectPowiat(filters: TransactionFilters, code?: string): TransactionFilters {
  if (code === filters.powiat_code) return filters
  if (code === undefined) return { ...filters, powiat_code: undefined, gmina_code: undefined }
  return {
    ...filters,
    voivodeship_code: code.slice(0, 2),
    powiat_code: code,
    gmina_code: undefined,
  }
}

/** Selecting (or clearing) a gmina; sets its powiat and voivodeship. */
export function selectGmina(filters: TransactionFilters, code?: string): TransactionFilters {
  if (code === filters.gmina_code) return filters
  if (code === undefined) return { ...filters, gmina_code: undefined }
  return {
    ...filters,
    voivodeship_code: code.slice(0, 2),
    powiat_code: code.slice(0, 4),
    gmina_code: code,
  }
}
