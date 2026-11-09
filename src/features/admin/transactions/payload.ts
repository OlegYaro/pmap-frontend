import type { components } from '../../../api/schema'
import { parseNumber, type FormField, type FormValues } from './formSchema'

type Transaction = components['schemas']['TransactionResponse']
export type CreateBody = components['schemas']['TransactionCreate']
type TransactionUpdate = components['schemas']['TransactionUpdate']

/** The fields of a body without the flag. */
type BodyFields = Omit<TransactionUpdate, 'accept_registry'>

/**
 * A `PATCH /admin/transactions/{id}` body: the changed fields, plus `accept_registry` only when it
 * is true. The generated type requires the flag because the backend gives it a default.
 */
export type UpdateBody = Partial<BodyFields> & { accept_registry?: true }

/** Every body field with its value; null means empty. */
type ApiValues = { [K in keyof BodyFields]-?: Exclude<BodyFields[K], undefined> }
type ApiName = keyof ApiValues

/** The request body name of each form field. */
export const API_NAMES = {
  powiat: 'powiat_code',
  gmina: 'gmina_code',
  city: 'city_name',
  district: 'district_name',
  address: 'address',
  date: 'transaction_date',
  price: 'price_premises',
  area: 'area_usable',
  rooms: 'rooms',
  floor: 'floor',
  market: 'market_type',
  function: 'function',
  buildingId: 'external_building_id',
  status: 'exclusion_reason',
} as const satisfies Record<FormField, ApiName>

const API_KEYS = Object.values(API_NAMES)

type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
type Assert<T extends true> = T

/** Compile-time check: the form covers every body field (fails `tsc -b` otherwise). */
export type PayloadChecks = [
  Assert<Exact<(typeof API_NAMES)[FormField], ApiName>>,
  Assert<Exact<ApiName, keyof CreateBody>>,
]

const textValue = (value: string) => value.trim() || null
const numberValue = (value: string) => (value.trim() === '' ? null : parseNumber(value))

/** The form as body values: trimmed text, numbers as numbers, empty as null, Clean as null. */
function apiValues(values: FormValues): ApiValues {
  return {
    powiat_code: textValue(values.powiat),
    gmina_code: textValue(values.gmina),
    city_name: textValue(values.city),
    district_name: textValue(values.district),
    address: textValue(values.address),
    transaction_date: textValue(values.date),
    price_premises: numberValue(values.price),
    area_usable: numberValue(values.area),
    rooms: numberValue(values.rooms),
    floor: numberValue(values.floor),
    market_type: textValue(values.market),
    function: textValue(values.function),
    external_building_id: textValue(values.buildingId),
    exclusion_reason: values.status === 'clean' ? null : textValue(values.status),
  }
}

function copy<K extends ApiName>(target: Partial<BodyFields>, source: ApiValues, key: K) {
  target[key] = source[key]
}

const asText = (value: number | null | undefined) => (value == null ? '' : String(value))

/** The form values of a loaded transaction. */
export function initialFromTransaction(transaction: Transaction): FormValues {
  return {
    powiat: transaction.powiat_code,
    gmina: transaction.gmina_code ?? '',
    city: transaction.city_name ?? '',
    district: transaction.district_name ?? '',
    address: transaction.address ?? '',
    date: transaction.transaction_date?.slice(0, 10) ?? '',
    price: asText(transaction.price_premises),
    area: asText(transaction.area_usable),
    rooms: asText(transaction.rooms),
    floor: asText(transaction.floor),
    market: transaction.market_type ?? '',
    function: transaction.function ?? '',
    buildingId: transaction.external_building_id ?? '',
    status: transaction.exclusion_reason ?? 'clean',
  }
}

/** The `POST /admin/transactions` body: the filled fields only. */
export function toCreateBody(values: FormValues): CreateBody {
  const now = apiValues(values)
  const fields: Partial<BodyFields> = {}
  for (const key of API_KEYS) if (now[key] !== null) copy(fields, now, key)
  return { ...fields, powiat_code: values.powiat.trim() }
}

/**
 * The `PATCH /admin/transactions/{id}` body: the fields whose value differs from `initial`, an
 * emptied one as null, and `accept_registry` when `acceptRegistry` is true. Empty when nothing
 * changed and the flag is off.
 */
export function toUpdateBody(
  values: FormValues,
  initial: FormValues,
  acceptRegistry: boolean,
): UpdateBody {
  const now = apiValues(values)
  const before = apiValues(initial)
  const body: UpdateBody = {}
  for (const key of API_KEYS) if (!Object.is(now[key], before[key])) copy(body, now, key)
  if (acceptRegistry) body.accept_registry = true
  return body
}
