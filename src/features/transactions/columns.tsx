import { createColumnHelper, type RowData } from '@tanstack/react-table'
import { EMPTY, formatArea, formatIsoDate, formatNumber, formatPln, orEmpty } from '@/lib/format'
import { MARKET_TYPE_LABELS, labelFor } from '../filters/labels'
import { pricePerM2 } from './cells'
import type { TransactionRow } from './listQuery'
import { StatusBadge } from './StatusBadge'

declare module '@tanstack/react-table' {
  // The type parameters must match the library's declaration for the interfaces to merge.
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Numbers are right-aligned. */
    numeric?: boolean
  }
}

const text = (value: string) => value
const column = createColumnHelper<TransactionRow>()

/**
 * The table columns in display order. A sortable column's id is the API sort field it sorts by;
 * "Price/m²" and "Status" are computed on the client and cannot be sorted by the server.
 */
export const TRANSACTION_COLUMNS = [
  column.accessor('transaction_date', {
    id: 'transaction_date',
    header: 'Date',
    cell: ({ getValue }) => orEmpty(getValue(), formatIsoDate),
  }),
  column.accessor('address', {
    id: 'address',
    header: 'Address',
    cell: ({ getValue }) => {
      const address = getValue()
      return (
        <span className="block max-w-52 truncate" title={address ?? undefined}>
          {address ?? EMPTY}
        </span>
      )
    },
  }),
  column.accessor('city_name', {
    id: 'city_name',
    header: 'City',
    cell: ({ getValue }) => orEmpty(getValue(), text),
  }),
  column.accessor('district_name', {
    id: 'district_name',
    header: 'District',
    cell: ({ getValue }) => orEmpty(getValue(), text),
  }),
  column.accessor('price_premises', {
    id: 'price_premises',
    header: 'Price',
    cell: ({ getValue }) => orEmpty(getValue(), formatPln),
    meta: { numeric: true },
  }),
  column.accessor('area_usable', {
    id: 'area_usable',
    header: 'Area',
    cell: ({ getValue }) => orEmpty(getValue(), formatArea),
    meta: { numeric: true },
  }),
  column.display({
    id: 'price_per_m2',
    header: 'Price/m²',
    cell: ({ row }) => orEmpty(pricePerM2(row.original), formatPln),
    enableSorting: false,
    meta: { numeric: true },
  }),
  column.accessor('rooms', {
    id: 'rooms',
    header: 'Rooms',
    cell: ({ getValue }) => orEmpty(getValue(), formatNumber),
    meta: { numeric: true },
  }),
  column.accessor('floor', {
    id: 'floor',
    header: 'Floor',
    cell: ({ getValue }) => orEmpty(getValue(), formatNumber),
    meta: { numeric: true },
  }),
  column.accessor('market_type', {
    id: 'market_type',
    header: 'Market',
    cell: ({ getValue }) => orEmpty(getValue(), (value) => labelFor(MARKET_TYPE_LABELS, value)),
  }),
  column.display({
    id: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge row={row.original} />,
    enableSorting: false,
  }),
]
