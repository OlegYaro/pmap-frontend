import { Suspense, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AnalyticsSection,
  QueryContent,
  SectionSkeleton,
  type SectionQuery,
} from './AnalyticsSection'
import { LazyTrendChart } from './lazyCharts'
import { buildTrend, type TrendPoint } from './trend'
import { TrendTable } from './TrendTable'
import type { TimeseriesPoint } from './useAnalyticsData'

const SKELETON = <SectionSkeleton className="h-72" />

/**
 * The monthly price chart with its states and a "View as table" toggle. The chart (and the chart
 * library) is loaded on first use; the toggle state is local, not in the URL.
 */
export function TrendSection({ query }: { query: SectionQuery<TimeseriesPoint[]> }) {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const { data } = query
  const trend = useMemo(() => (data === undefined ? undefined : buildTrend(data)), [data])
  const hasTrend = trend !== undefined && trend.length > 0

  return (
    <AnalyticsSection
      title="Price per m² by month"
      actions={
        hasTrend && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setView(view === 'chart' ? 'table' : 'chart')}
          >
            {view === 'chart' ? 'View as table' : 'View as chart'}
          </Button>
        )
      }
    >
      <QueryContent
        query={{ ...query, data: trend }}
        what="the monthly prices"
        isEmpty={(points: TrendPoint[]) => points.length === 0}
        skeleton={SKELETON}
      >
        {(points) =>
          view === 'table' ? (
            <TrendTable trend={points} />
          ) : (
            <Suspense fallback={SKELETON}>
              <LazyTrendChart trend={points} />
            </Suspense>
          )
        }
      </QueryContent>
    </AnalyticsSection>
  )
}
