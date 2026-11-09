import { useRef } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { useDocumentTitle } from '../../app/useDocumentTitle'
import { ExportButton } from '../export/ExportButton'
import { ActiveFilterChips } from '../filters/ActiveFilterChips'
import { FilterPanel } from '../filters/FilterPanel'
import { AnalyticsSection, QueryContent, SectionSkeleton } from './AnalyticsSection'
import { DistributionSection } from './DistributionSection'
import { KpiCards } from './KpiCards'
import { PeriodPresets } from './PeriodPresets'
import { TrendSection } from './TrendSection'
import { useSummary, useTimeseries, type Summary } from './useAnalyticsData'
import { ANALYTICS_FIELDS, useAnalyticsFilters } from './useAnalyticsFilters'
import { isEmptySummary } from './values'

const selectRooms = (summary: Summary) => summary.rooms
const selectFloors = (summary: Summary) => summary.floors

/**
 * Moves focus to the "From" date input of the filter panel inside `panel`, first opening the
 * panel when it is collapsed (narrow screens), so the input can take focus.
 */
function focusPeriodInput(panel: HTMLElement | null) {
  if (panel === null) return
  const toggle = panel.querySelector<HTMLButtonElement>('button[aria-expanded="false"]')
  if (toggle && getComputedStyle(toggle).display !== 'none') toggle.click()
  panel.querySelector<HTMLInputElement>('[data-field="dates"] input')?.focus()
}

/**
 * The analytics page: a required period with presets, the shared filters (without "Rows" and
 * "Address"), KPI cards, the monthly price chart and the rooms and floor distributions. Everything
 * is read from the URL; the KPIs and distributions share the summary request.
 */
export function AnalyticsPage() {
  const { filters, ready } = useAnalyticsFilters()
  const summary = useSummary(filters, ready)
  const timeseries = useTimeseries(filters, ready)
  const panelRef = useRef<HTMLDivElement>(null)
  useDocumentTitle('Analytics')

  return (
    <>
      <PageHeader
        title="Analytics"
        actions={
          <div data-slot="export-action">
            <ExportButton filters={filters} scope="analytics" disabled={!ready} />
          </div>
        }
      />
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
        <PeriodPresets onCustom={() => focusPeriodInput(panelRef.current)} />
        <div ref={panelRef} className="min-w-0">
          <FilterPanel fields={ANALYTICS_FIELDS} />
        </div>
        <ActiveFilterChips fields={ANALYTICS_FIELDS} />
        <AnalyticsSection title="Key figures">
          <QueryContent
            query={summary}
            what="the summary"
            isEmpty={isEmptySummary}
            skeleton={<SectionSkeleton className="h-24" />}
          >
            {(data) => <KpiCards summary={data} />}
          </QueryContent>
        </AnalyticsSection>
        <TrendSection query={timeseries} />
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
          <DistributionSection title="By rooms" query={summary} select={selectRooms} />
          <DistributionSection title="By floor" query={summary} select={selectFloors} />
        </div>
        <p className="text-muted-foreground text-sm">
          Only clean transactions are counted: rows with an exclusion reason (non-market, package
          deals, fractional shares and other flagged rows) are left out.
        </p>
      </div>
    </>
  )
}
