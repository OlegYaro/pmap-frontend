import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatNumber, formatPlnPerM2 } from '@/lib/format'
import { trendMonthLabel, type TrendPoint } from './trend'
import { orNotAvailable } from './values'

const NUMERIC = 'text-right tabular-nums'

/** The monthly series as a table: the accessible way to read every value of the price chart. */
export function TrendTable({ trend }: { trend: readonly TrendPoint[] }) {
  return (
    <div className="max-h-96 overflow-auto rounded-md border">
      <Table>
        <caption className="sr-only">Median price per m² by month</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Month</TableHead>
            <TableHead className="text-right">Median</TableHead>
            <TableHead className="text-right">P25</TableHead>
            <TableHead className="text-right">P75</TableHead>
            <TableHead className="text-right">Transactions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trend.map((point) => (
            <TableRow key={point.month}>
              <TableCell>{trendMonthLabel(point)}</TableCell>
              <TableCell className={NUMERIC}>
                {orNotAvailable(point.median, formatPlnPerM2)}
              </TableCell>
              <TableCell className={NUMERIC}>{orNotAvailable(point.p25, formatPlnPerM2)}</TableCell>
              <TableCell className={NUMERIC}>{orNotAvailable(point.p75, formatPlnPerM2)}</TableCell>
              <TableCell className={NUMERIC}>{formatNumber(point.count)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
