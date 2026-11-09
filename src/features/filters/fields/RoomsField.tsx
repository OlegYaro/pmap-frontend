import { useId } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ROOMS_PLUS, ROOMS_PLUS_FROM } from '../model'
import { useDraftFilters } from '../useDraftFilters'

const SINGLE_ROOMS = [1, 2, 3, 4] as const

function sorted(rooms: Iterable<number>): number[] | undefined {
  const list = [...new Set(rooms)].sort((a, b) => a - b)
  return list.length > 0 ? list : undefined
}

/**
 * Room counts 1-4 and "5+". The API matches exact counts, so "5+" stands for `ROOMS_PLUS`; it is
 * checked when any count of 5 or more is filtered. Each change edits the draft.
 */
export function RoomsField() {
  const id = useId()
  const { filters, updateFilters } = useDraftFilters()
  const rooms = filters.rooms ?? []
  const below = rooms.filter((room) => room < ROOMS_PLUS_FROM)
  const plusChecked = rooms.some((room) => room >= ROOMS_PLUS_FROM)

  const write = (next: Iterable<number>) => updateFilters({ rooms: sorted(next) })

  const choices = [
    ...SINGLE_ROOMS.map((room) => ({
      label: String(room),
      checked: rooms.includes(room),
      toggle: (on: boolean) =>
        write(on ? [...rooms, room] : rooms.filter((value) => value !== room)),
    })),
    {
      label: `${ROOMS_PLUS_FROM}+`,
      checked: plusChecked,
      toggle: (on: boolean) => write(on ? [...below, ...ROOMS_PLUS] : below),
    },
  ]

  return (
    <fieldset className="grid min-w-0 gap-1.5">
      <legend className="mb-1.5 text-sm leading-none font-medium">Rooms</legend>
      <div className="flex min-h-9 flex-wrap items-center gap-x-4 gap-y-2">
        {choices.map((choice) => (
          <div key={choice.label} className="flex items-center gap-2">
            <Checkbox
              id={`${id}-${choice.label}`}
              checked={choice.checked}
              onCheckedChange={(state) => choice.toggle(state === true)}
            />
            <Label htmlFor={`${id}-${choice.label}`} className="font-normal">
              {choice.label} <span className="sr-only">rooms</span>
            </Label>
          </div>
        ))}
      </div>
    </fieldset>
  )
}
