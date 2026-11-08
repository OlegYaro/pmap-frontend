import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatMonth, formatNumber } from '@/lib/format'
import { ChartTooltip } from './ChartTooltip'
import { distributionDescription, type DistributionItem } from './distribution'
import { trendDescription, trendMonthLabel, trendTooltipLines, type TrendPoint } from './trend'

// The only module that imports Recharts; the page loads it lazily, so the library gets its own chunk.

const AXIS_TICK = { fill: 'var(--chart-axis)', fontSize: 12 }
const AXIS_LABEL = { fill: 'var(--chart-axis)', fontSize: 12 }
// Dashed hairlines keep the grid recessive while the colour itself keeps 3:1 against the card.
const GRID = { stroke: 'var(--chart-grid)', strokeDasharray: '2 4' }

/** Monthly median line over the p25–p75 band, with the count as bars on a right-hand axis. */
export function TrendChart({ trend }: { trend: readonly TrendPoint[] }) {
  const byMonth = new Map(trend.map((point) => [point.month, point]))
  return (
    <div className="grid gap-2">
      <div className="h-72 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={[...trend]}
            role="img"
            title={trendDescription(trend)}
            margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
          >
            <CartesianGrid vertical={false} {...GRID} />
            <XAxis
              dataKey="month"
              tickFormatter={(month: string) => formatMonth(month, 'short')}
              tick={AXIS_TICK}
              stroke="var(--chart-axis)"
              minTickGap={24}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="price"
              tickFormatter={formatNumber}
              tick={AXIS_TICK}
              stroke="var(--chart-axis)"
              width={64}
              label={{ ...AXIS_LABEL, value: 'PLN/m²', angle: -90, position: 'insideLeft' }}
            />
            <YAxis
              yAxisId="count"
              orientation="right"
              allowDecimals={false}
              tickFormatter={formatNumber}
              tick={AXIS_TICK}
              stroke="var(--chart-axis)"
              width={48}
              label={{ ...AXIS_LABEL, value: 'Transactions', angle: 90, position: 'insideRight' }}
            />
            <Tooltip
              cursor={{ stroke: 'var(--chart-axis)', strokeDasharray: '3 3' }}
              content={({ active, label }) => {
                const point = active ? byMonth.get(String(label)) : undefined
                return point ? (
                  <ChartTooltip title={trendMonthLabel(point)} lines={trendTooltipLines(point)} />
                ) : null
              }}
            />
            <Bar
              yAxisId="count"
              dataKey="count"
              name="Transactions"
              fill="var(--chart-count)"
              fillOpacity={0.45}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
              isAnimationActive={false}
            />
            <Area
              yAxisId="price"
              dataKey="band"
              name="P25–P75"
              fill="var(--chart-band)"
              fillOpacity={0.18}
              stroke="none"
              connectNulls={false}
              activeDot={false}
              isAnimationActive={false}
            />
            <Line
              yAxisId="price"
              dataKey="median"
              name="Median"
              stroke="var(--chart-median)"
              strokeWidth={2}
              dot={{ r: 3, fill: 'var(--chart-median)' }}
              activeDot={{ r: 5 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ul aria-hidden className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <li className="flex items-center gap-1.5">
          <span className="bg-chart-median h-0.5 w-4 rounded-full" />
          Median
        </li>
        <li className="flex items-center gap-1.5">
          <span className="bg-chart-median/20 h-3 w-4 rounded-sm" />
          P25–P75
        </li>
        <li className="flex items-center gap-1.5">
          <span className="bg-chart-count/45 h-3 w-2 rounded-t-sm" />
          Transactions
        </li>
      </ul>
    </div>
  )
}

interface DistributionChartProps {
  title: string
  items: readonly DistributionItem[]
}

/** One bar per group with its count written above it. */
export function DistributionChart({ title, items }: DistributionChartProps) {
  const byGroup = new Map(items.map((item) => [item.group, item]))
  return (
    <div className="h-56 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={[...items]}
          role="img"
          title={distributionDescription(title, items)}
          margin={{ top: 20, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid vertical={false} {...GRID} />
          <XAxis dataKey="group" tick={AXIS_TICK} stroke="var(--chart-axis)" minTickGap={4} />
          <YAxis
            allowDecimals={false}
            tickFormatter={formatNumber}
            tick={AXIS_TICK}
            stroke="var(--chart-axis)"
            width={40}
          />
          <Tooltip
            cursor={{ fill: 'var(--chart-grid)', fillOpacity: 0.15 }}
            content={({ active, label }) => {
              const item = active ? byGroup.get(String(label)) : undefined
              return item ? (
                <ChartTooltip
                  title={item.group}
                  lines={[{ label: 'Transactions', value: formatNumber(item.count) }]}
                />
              ) : null
            }}
          />
          <Bar
            dataKey="count"
            name="Transactions"
            fill="var(--chart-count)"
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
            isAnimationActive={false}
          >
            <LabelList dataKey="count" position="top" fill="var(--chart-axis)" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
