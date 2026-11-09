import { Skeleton } from '@/components/ui/skeleton'

interface TableSkeletonProps {
  rows: number
  columns: number
}

export function TableSkeleton({ rows, columns }: TableSkeletonProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <span role="status" className="sr-only">
        Loading
      </span>
      <table className="w-full" aria-hidden>
        <tbody>
          {Array.from({ length: rows }, (_, row) => (
            <tr key={row} className="border-b last:border-b-0">
              {Array.from({ length: columns }, (_, column) => (
                <td key={column} className="p-3">
                  <Skeleton className="h-4 w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
