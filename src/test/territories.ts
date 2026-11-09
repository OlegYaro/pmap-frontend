/** A `GET /territories` row from `[code, name]` pairs; a missing level is null. */
export function territoryRow(
  voivodeship: [string, string],
  powiat: [string, string] | null = null,
  gmina: [string, string] | null = null,
) {
  return {
    voivodeship_teryt: voivodeship[0],
    voivodeship_name: voivodeship[1],
    powiat_teryt: powiat?.[0] ?? null,
    powiat_name: powiat?.[1] ?? null,
    gmina_teryt: gmina?.[0] ?? null,
    gmina_name: gmina?.[1] ?? null,
  }
}

const MAZ: [string, string] = ['14', 'mazowieckie']
const MAL: [string, string] = ['12', 'małopolskie']
const LDZ: [string, string] = ['10', 'łódzkie']

/** A small territory list for filter tests. */
export const TERRITORIES = [
  territoryRow(MAZ, ['1465', 'Warszawa'], ['1465011', 'Warszawa']),
  territoryRow(MAZ, ['1434', 'otwocki'], ['1434011', 'Józefów']),
  territoryRow(MAL, ['1261', 'Kraków'], ['1261011', 'Kraków']),
  territoryRow(LDZ, ['1061', 'Łódź'], ['1061011', 'Łódź']),
]
