import type { components } from '../api/schema'
import { jsonResponse, stubFetch, type FetchHandler } from './http'
import { TERRITORIES } from './territories'

type TransactionResponse = components['schemas']['TransactionResponse']

/** A complete `GET /transactions` row; `overrides` replace single fields. */
export function transactionRow(overrides: Partial<TransactionResponse> = {}): TransactionResponse {
  return {
    id: 1,
    run_id: '6f1c2a3b-4d5e-4f60-8a9b-0c1d2e3f4a5b',
    external_transaction_identifier: 'RCN-1',
    external_building_id: 'B-1',
    date_source_version: '2024-06-01',
    transaction_date: '2024-05-17',
    price_premises: 500000,
    price_property: 500000,
    price_transaction: 500000,
    area_usable: 40,
    rooms: 2,
    floor: 3,
    market_type: 'wtorny',
    function: 'mieszkalna',
    address: 'ul. Marszałkowska 1',
    powiat_code: '1465',
    gmina_code: '1465011',
    city_name: 'Warszawa',
    district_name: 'Śródmieście',
    exclusion_reason: null,
    attributes: {},
    updated_at: '2024-06-02T10:00:00Z',
    ...overrides,
  }
}

/** `count` rows with ascending ids from `firstId`, distinct prices and dates. */
export function transactionPage(count: number, firstId = 1): TransactionResponse[] {
  return Array.from({ length: count }, (_, index) => {
    const id = firstId + index
    const day = String((id % 28) + 1).padStart(2, '0')
    return transactionRow({
      id,
      external_transaction_identifier: `RCN-${id}`,
      transaction_date: `2024-05-${day}`,
      price_premises: 300000 + id * 1000,
      address: `ul. Testowa ${id}`,
    })
  })
}

/**
 * Stubs fetch: `/api/territories` answers with `TERRITORIES`, `/api/transactions` with `transactions`
 * (an empty list by default), `/api/transactions/{id}` with `transaction` (404 by default), anything else with an empty list.
 */
export function stubApi({
  transactions = () => jsonResponse(200, []),
  transaction = () => jsonResponse(404, { detail: 'Not found' }),
}: { transactions?: FetchHandler; transaction?: FetchHandler } = {}) {
  return stubFetch((request) => {
    const path = new URL(request.url).pathname
    if (path === '/api/territories') return jsonResponse(200, TERRITORIES)
    if (path === '/api/transactions') return transactions(request)
    if (/^\/api\/transactions\/\d+$/.test(path)) return transaction(request)
    return jsonResponse(200, [])
  })
}
