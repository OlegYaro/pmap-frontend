import { ChevronDownIcon } from 'lucide-react'
import { useId } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { EXCLUSION_REASON_LABELS, rowsSummary } from '../labels'
import { EXCLUSION_REASONS, type ExclusionReason } from '../model'
import { useDraftFilters } from '../useDraftFilters'

/** Row status filter: clean rows and/or rows with chosen exclusion reasons; none means all rows. */
export function RowsField() {
  const id = useId()
  const { filters, updateFilters } = useDraftFilters()
  const reasons = filters.exclusion_reason ?? []

  const toggle = (reason: ExclusionReason, on: boolean) => {
    const next = EXCLUSION_REASONS.filter((item) => (item === reason ? on : reasons.includes(item)))
    updateFilters({ exclusion_reason: next.length > 0 ? next : undefined })
  }

  return (
    <div className="grid min-w-0 gap-1.5">
      <Label id={`${id}-label`}>Rows</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            aria-labelledby={`${id}-label ${id}-value`}
            className="w-full justify-between px-3 font-normal"
          >
            <span id={`${id}-value`} className="truncate">
              {rowsSummary(reasons)}
            </span>
            <ChevronDownIcon className="opacity-50" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-2">
          <div role="group" aria-label="Row status" className="grid gap-1">
            {EXCLUSION_REASONS.map((reason) => (
              <div key={reason} className="flex items-center gap-2 rounded-sm px-2 py-1.5">
                <Checkbox
                  id={`${id}-${reason}`}
                  checked={reasons.includes(reason)}
                  onCheckedChange={(state) => toggle(reason, state === true)}
                />
                <Label htmlFor={`${id}-${reason}`} className="font-normal">
                  {EXCLUSION_REASON_LABELS[reason]}
                </Label>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
