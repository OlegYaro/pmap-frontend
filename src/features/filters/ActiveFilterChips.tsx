import { XIcon } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { buildChips, type FilterChip } from './chips'
import { FILTER_FIELDS, type FilterField } from './model'
import { useFilters } from './useFilters'
import { useTerritoryOptions } from './useTerritoryOptions'

interface ActiveFilterChipsProps {
  /** Same list as the filter panel's: chips of other fields are not shown. */
  fields?: readonly FilterField[]
  className?: string
}

/** Where focus goes once the removed chips have left the URL. */
interface PendingFocus {
  removed: string[]
  index: number
}

/**
 * The active filters as removable chips plus "Reset all". Each removal or reset is one pushed
 * history entry. After a removal focus moves to the next chip (or the previous one, or the list).
 */
export function ActiveFilterChips({ fields = FILTER_FIELDS, className }: ActiveFilterChipsProps) {
  const { filters, setFilters, resetFilters } = useFilters()
  const { nameOf } = useTerritoryOptions()
  const chips = useMemo(() => buildChips(filters, nameOf, fields), [filters, nameOf, fields])
  const sectionRef = useRef<HTMLElement>(null)
  const buttons = useRef(new Map<string, HTMLButtonElement>())
  const pendingFocus = useRef<PendingFocus | null>(null)

  useEffect(() => {
    const pending = pendingFocus.current
    if (!pending || chips.some((chip) => pending.removed.includes(chip.id))) return
    pendingFocus.current = null
    const target = chips[pending.index] ?? chips[pending.index - 1]
    const button = target && buttons.current.get(target.id)
    if (button) button.focus()
    else sectionRef.current?.focus()
  }, [chips])

  const remove = (chip: FilterChip, index: number) => {
    pendingFocus.current = { removed: [chip.id], index }
    setFilters(chip.remove(filters), { history: 'push' })
  }

  const reset = () => {
    pendingFocus.current = { removed: chips.map((chip) => chip.id), index: 0 }
    resetFilters()
  }

  return (
    <section
      ref={sectionRef}
      aria-label="Active filters"
      tabIndex={-1}
      className={cn('flex flex-wrap items-center gap-2 outline-none', className)}
    >
      {chips.length === 0 ? (
        <p className="sr-only">No active filters</p>
      ) : (
        <>
          <ul className="flex flex-wrap items-center gap-2">
            {chips.map((chip, index) => (
              <li key={chip.id}>
                <Badge variant="secondary" className="gap-1 py-1 pr-1 text-sm font-normal">
                  {chip.label}
                  <button
                    type="button"
                    ref={(element) => {
                      if (element) buttons.current.set(chip.id, element)
                      else buttons.current.delete(chip.id)
                    }}
                    aria-label={`Remove ${chip.label}`}
                    onClick={() => remove(chip, index)}
                    className="hover:bg-muted-foreground/20 focus-visible:ring-ring/50 rounded-sm p-0.5 outline-none focus-visible:ring-[3px]"
                  >
                    <XIcon className="size-3.5" aria-hidden />
                  </button>
                </Badge>
              </li>
            ))}
          </ul>
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            Reset all
          </Button>
        </>
      )}
    </section>
  )
}
