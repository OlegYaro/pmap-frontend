import { EXCLUSION_REASON_LABELS, labelFor } from '../filters/labels'
import type { TransactionRow } from './listQuery'

/** Premises price per square metre in whole złoty, or null when price or a positive area is missing. */
export function pricePerM2(
  row: Pick<TransactionRow, 'price_premises' | 'area_usable'>,
): number | null {
  const { price_premises: price, area_usable: area } = row
  if (price === null || price === undefined || area === null || area === undefined || area <= 0) {
    return null
  }
  return Math.round(price / area)
}

export interface RowStatus {
  kind: 'clean' | 'excluded'
  label: string
}

/** "Clean" for a row without an exclusion reason, otherwise the reason's readable label. */
export function statusOf(row: Pick<TransactionRow, 'exclusion_reason'>): RowStatus {
  const reason = row.exclusion_reason
  if (reason === null || reason === undefined || reason === '') {
    return { kind: 'clean', label: EXCLUSION_REASON_LABELS.clean }
  }
  return { kind: 'excluded', label: labelFor(EXCLUSION_REASON_LABELS, reason) }
}
