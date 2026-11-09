import { useId, useMemo, type ComponentProps, type ReactNode } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { SearchableSelect } from '@/components/SearchableSelect'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  EXCLUSION_REASON_LABELS,
  FUNCTION_LABELS,
  labelFor,
  MARKET_TYPE_LABELS,
} from '../../filters/labels'
import { EXCLUSION_REASONS } from '../../filters/model'
import { gminaChoices } from '../../filters/territoryOptions'
import { useTerritoryOptions } from '../../filters/useTerritoryOptions'
import type { FormField, FormValues } from './formSchema'

/** Radix Select does not allow an empty item value, so the empty choice uses this one. */
const NONE = '__none__'

/** One spelling of each market type is offered; a stored other spelling is kept as an extra. */
const MARKET_CHOICES = ['pierwotny', 'wtorny']

type Choice = readonly [value: string, label: string]

/** Known choices plus the stored value when it is none of them (labelled `Readable (raw)`). */
function withStored(
  known: readonly string[],
  labels: Readonly<Record<string, string>>,
  stored: string,
): Choice[] {
  const choices = known.map((value): Choice => [value, labelFor(labels, value)])
  if (stored === '' || known.includes(stored)) return choices
  const label = labelFor(labels, stored)
  return [...choices, [stored, label === stored ? stored : `${label} (${stored})`]]
}

interface FieldProps {
  /** Id of the control; the label points at it and the error message uses `<id>-error`. */
  id: string
  label: string
  error?: string
  /** Set for controls named through `aria-labelledby` (the label gets this id instead of `for`). */
  labelId?: string
  required?: boolean
  children: ReactNode
}

function Field({ id, label, error, labelId, required, children }: FieldProps) {
  return (
    <div className="grid min-w-0 content-start gap-1.5">
      <Label id={labelId} htmlFor={labelId ? undefined : id}>
        {label}
        {required && (
          <span aria-hidden className="text-destructive">
            *
          </span>
        )}
      </Label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-destructive text-sm">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * The fields of the transaction form in their fixed order. Powiat and gmina are searchable selects
 * over the territory list (a code missing from it is shown as is); choosing another powiat clears
 * the gmina. `initial` supplies stored select values that are not among the known choices.
 */
export function TransactionFormFields({ initial }: { initial: FormValues }) {
  const id = useId()
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<FormValues>()
  const { options } = useTerritoryOptions()
  const powiat = useWatch({ control, name: 'powiat' })

  const powiats = useMemo(
    () => options.allPowiats.map((option) => ({ value: option.code, label: option.label })),
    [options],
  )
  const gminas = useMemo(
    () =>
      gminaChoices(options, powiat || undefined).map((option) => ({
        value: option.code,
        label: option.label,
      })),
    [options, powiat],
  )

  const idOf = (field: FormField) => `${id}-${field}`
  const errorOf = (field: FormField) => errors[field]?.message
  const a11y = (field: FormField) =>
    errors[field]
      ? { 'aria-invalid': true, 'aria-describedby': `${idOf(field)}-error` }
      : { 'aria-invalid': undefined, 'aria-describedby': undefined }

  const territory = (field: 'powiat' | 'gmina', label: string) => (
    <Field
      id={idOf(field)}
      labelId={`${idOf(field)}-label`}
      label={label}
      error={errorOf(field)}
      required={field === 'powiat'}
    >
      <Controller
        control={control}
        name={field}
        render={({ field: { ref, value, onChange } }) => (
          <SearchableSelect
            ref={ref}
            labelId={`${idOf(field)}-label`}
            options={field === 'powiat' ? powiats : gminas}
            value={value || undefined}
            onChange={(code) => {
              onChange(code ?? '')
              if (field === 'powiat') setValue('gmina', '')
            }}
            searchLabel={field === 'powiat' ? 'Search powiats' : 'Search gminas'}
            anyLabel="—"
            disabled={field === 'gmina' && !powiat}
            invalid={Boolean(errors[field])}
            describedBy={a11y(field)['aria-describedby']}
          />
        )}
      />
    </Field>
  )

  const input = (
    field: Exclude<FormField, 'powiat' | 'gmina' | 'market' | 'function' | 'status'>,
    label: string,
    props: ComponentProps<'input'> = {},
  ) => (
    <Field id={idOf(field)} label={label} error={errorOf(field)}>
      <Input id={idOf(field)} autoComplete="off" {...props} {...a11y(field)} {...register(field)} />
    </Field>
  )

  const select = (
    field: 'market' | 'function' | 'status',
    label: string,
    choices: readonly Choice[],
  ) => (
    <Field id={idOf(field)} label={label} error={errorOf(field)}>
      <Controller
        control={control}
        name={field}
        render={({ field: { ref, value, onChange } }) => (
          <Select
            value={value === '' ? NONE : value}
            onValueChange={(next) => onChange(next === NONE ? '' : next)}
          >
            <SelectTrigger ref={ref} id={idOf(field)} className="w-full" {...a11y(field)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {field !== 'status' && <SelectItem value={NONE}>—</SelectItem>}
              {choices.map(([choice, text]) => (
                <SelectItem key={choice} value={choice}>
                  {text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </Field>
  )

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {territory('powiat', 'Powiat')}
      {territory('gmina', 'Gmina')}
      {input('city', 'City')}
      {input('district', 'District')}
      {input('address', 'Address')}
      {input('date', 'Date', { type: 'date' })}
      {input('price', 'Price (PLN)', { inputMode: 'decimal' })}
      {input('area', 'Area (m²)', { inputMode: 'decimal' })}
      {input('rooms', 'Rooms', { inputMode: 'numeric' })}
      {input('floor', 'Floor')}
      {select('market', 'Market', withStored(MARKET_CHOICES, MARKET_TYPE_LABELS, initial.market))}
      {select(
        'function',
        'Function',
        withStored(Object.keys(FUNCTION_LABELS), FUNCTION_LABELS, initial.function),
      )}
      {input('buildingId', 'Building id')}
      {select(
        'status',
        'Status',
        withStored(EXCLUSION_REASONS, EXCLUSION_REASON_LABELS, initial.status),
      )}
    </div>
  )
}
