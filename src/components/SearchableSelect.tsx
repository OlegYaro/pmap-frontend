import { ChevronsUpDownIcon } from 'lucide-react'
import { useId, useMemo, useRef, useState, type KeyboardEvent, type Ref } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { matchesSearch } from '@/lib/search'
import { cn } from '@/lib/utils'

export interface SearchableSelectOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  /** Id of the visible label; the trigger is named by it plus the current value. */
  labelId: string
  options: readonly SearchableSelectOption[]
  value?: string
  onChange: (value: string | undefined) => void
  /** Accessible name of the search input, e.g. "Search powiats". */
  searchLabel: string
  /** Trigger text when nothing is selected, and the label of the first choice that clears. */
  anyLabel?: string
  /** Trigger text that replaces the value, e.g. "Loading…". */
  placeholder?: string
  disabled?: boolean
  className?: string
  /** The trigger button, e.g. for a form library to focus it. */
  ref?: Ref<HTMLButtonElement>
  /** Marks the trigger invalid for assistive technology. */
  invalid?: boolean
  /** Id of the element that describes the trigger, e.g. an error message. */
  describedBy?: string
}

interface Choice {
  value: string | undefined
  label: string
}

/**
 * A select whose list can be filtered by typing. Matching ignores case and Polish diacritics and
 * also looks at the option value (a code). The first choice, shown while the search is empty,
 * clears the value.
 */
export function SearchableSelect({
  labelId,
  options,
  value,
  onChange,
  searchLabel,
  anyLabel = 'Any',
  placeholder,
  disabled = false,
  className,
  ref,
  invalid,
  describedBy,
}: SearchableSelectProps) {
  const id = useId()
  const listId = `${id}-list`
  const valueId = `${id}-value`
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const choices = useMemo<Choice[]>(() => {
    if (query.trim() === '') return [{ value: undefined, label: anyLabel }, ...options]
    return options.filter((option) => matchesSearch(query, option.label, option.value))
  }, [anyLabel, options, query])

  const selected = options.find((option) => option.value === value)
  const triggerText = placeholder ?? selected?.label ?? value ?? anyLabel
  const optionId = (index: number) => `${id}-option-${index}`

  const changeOpen = (next: boolean) => {
    setOpen(next)
    setQuery('')
    const index = options.findIndex((option) => option.value === value)
    setActive(index + 1)
  }

  const pick = (choice: Choice) => {
    changeOpen(false)
    if (choice.value !== value) onChange(choice.value)
  }

  const moveTo = (index: number) => {
    if (choices.length === 0) return
    const next = Math.max(0, Math.min(choices.length - 1, index))
    setActive(next)
    document.getElementById(optionId(next))?.scrollIntoView({ block: 'nearest' })
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const keys: Record<string, () => void> = {
      ArrowDown: () => moveTo(active + 1),
      ArrowUp: () => moveTo(active - 1),
      Home: () => moveTo(0),
      End: () => moveTo(choices.length - 1),
      Enter: () => {
        const choice = choices[active]
        if (choice) pick(choice)
      },
    }
    const handler = keys[event.key]
    if (!handler) return
    event.preventDefault()
    handler()
  }

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          ref={ref}
          type="button"
          variant="outline"
          aria-haspopup="listbox"
          aria-labelledby={`${labelId} ${valueId}`}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn('w-full justify-between px-3 font-normal', className)}
        >
          <span
            id={valueId}
            className={cn(
              'truncate',
              (placeholder || value === undefined) && 'text-muted-foreground',
            )}
          >
            {triggerText}
          </span>
          <ChevronsUpDownIcon className="opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-60 p-0"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          inputRef.current?.focus()
        }}
      >
        <div className="border-b p-2">
          <Input
            ref={inputRef}
            role="combobox"
            aria-label={searchLabel}
            aria-expanded
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={choices[active] ? optionId(active) : undefined}
            autoComplete="off"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActive(0)
            }}
            onKeyDown={onKeyDown}
            className="h-8"
          />
        </div>
        <div
          id={listId}
          role="listbox"
          aria-label={searchLabel}
          className="max-h-64 overflow-y-auto p-1"
        >
          {choices.length === 0 && (
            <p className="text-muted-foreground px-2 py-6 text-center text-sm">No matches</p>
          )}
          {choices.map((choice, index) => (
            <div
              key={choice.value ?? ''}
              id={optionId(index)}
              role="option"
              aria-selected={choice.value === value}
              data-active={index === active || undefined}
              onMouseMove={() => setActive(index)}
              onClick={() => pick(choice)}
              className="data-[active]:bg-accent data-[active]:text-accent-foreground aria-selected:font-medium cursor-default rounded-sm px-2 py-1.5 text-sm select-none"
            >
              {choice.label}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
