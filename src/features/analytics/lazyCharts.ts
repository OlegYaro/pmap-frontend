import { lazy } from 'react'

const loadCharts = () => import('./AnalyticsCharts')

/** The price chart, loaded with the chart library on first use. */
export const LazyTrendChart = lazy(() =>
  loadCharts().then((module) => ({ default: module.TrendChart })),
)

/** The distribution chart, from the same lazily loaded module. */
export const LazyDistributionChart = lazy(() =>
  loadCharts().then((module) => ({ default: module.DistributionChart })),
)
