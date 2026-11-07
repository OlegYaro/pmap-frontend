import { useId } from 'react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDraftFilters } from '../useDraftFilters'

/** Radix Select does not allow an empty item value, so "Any" uses this one. */
const ANY = '__any__'

interface CategorySelectFieldProps {
  filterKey: 'function'
  label: string
  /** Backend value → readable name, in display order. */
  labels: Readonly<Record<string, string>>
}

/**
 * A select over the known values of an exact-match filter, with "Any" to remove it. A value from
 * the draft that is not known is shown as an extra choice with its raw text. Choosing edits the
 * draft.
 */
export function CategorySelectField({ filterKey, label, labels }: CategorySelectFieldProps) {
  const id = useId()
  const { filters, updateFilters } = useDraftFilters()
  const value = filters[filterKey]
  const choices = Object.entries(labels)
  if (value !== undefined && !Object.hasOwn(labels, value)) choices.push([value, value])

  return (
    <div className="grid min-w-0 gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value ?? ANY}
        onValueChange={(next) => updateFilters({ [filterKey]: next === ANY ? undefined : next })}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any</SelectItem>
          {choices.map(([choice, text]) => (
            <SelectItem key={choice} value={choice}>
              {text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
