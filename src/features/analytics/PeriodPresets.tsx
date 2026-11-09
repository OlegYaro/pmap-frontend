import { Button } from '@/components/ui/button'
import { useFilters } from '../filters/useFilters'
import { matchPreset, PERIOD_PRESETS, periodPreset, today } from './period'

interface PeriodPresetsProps {
  /** Called on "Custom": the page moves focus to the period inputs of the filter panel. */
  onCustom: () => void
}

/**
 * Quick period choices. A preset sets the period ending today at once, as a pushed history entry;
 * the one matching the URL period is marked, and any other period marks "Custom".
 */
export function PeriodPresets({ onCustom }: PeriodPresetsProps) {
  const { filters, updateFilters } = useFilters()
  const todayDate = today()
  const selected = matchPreset(filters, todayDate)

  return (
    <div role="group" aria-label="Period" className="flex flex-wrap gap-2">
      {PERIOD_PRESETS.map((preset) => (
        <Button
          key={preset.months}
          type="button"
          size="sm"
          variant={selected === preset.months ? 'default' : 'outline'}
          aria-pressed={selected === preset.months}
          onClick={() => updateFilters(periodPreset(todayDate, preset.months), { history: 'push' })}
        >
          {preset.label}
        </Button>
      ))}
      <Button
        type="button"
        size="sm"
        variant={selected === 'custom' ? 'default' : 'outline'}
        aria-pressed={selected === 'custom'}
        onClick={onCustom}
      >
        Custom
      </Button>
    </div>
  )
}
