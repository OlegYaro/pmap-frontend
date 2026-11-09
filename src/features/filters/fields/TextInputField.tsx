import { useId, useState, type HTMLAttributes, type ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { DraftResult } from './parsers'

interface TextInputFieldProps<T> {
  label: ReactNode
  /** The value in the draft. */
  value: T | undefined
  parse: (text: string) => DraftResult<T>
  format: (value: T) => string
  /** Called with the new draft value (undefined clears) on every change of the text. */
  onChange: (value: T | undefined) => void
  helperText?: string
  /** Shown when the text cannot be read. */
  invalidMessage?: string
  type?: 'text' | 'date'
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
  placeholder?: string
  className?: string
}

/**
 * A text input that edits a draft value. Nothing is searched here. Text that cannot be read is
 * marked once the user leaves the input or presses Enter, and it leaves the draft, so a search
 * never uses an older value than the one shown. When the draft changes from elsewhere (chip
 * removal, reset, Back) the input shows the new value.
 */
export function TextInputField<T>({
  label,
  value,
  parse,
  format,
  onChange,
  helperText,
  invalidMessage = 'Enter a valid value',
  type = 'text',
  inputMode,
  placeholder,
  className,
}: TextInputFieldProps<T>) {
  const id = useId()
  const helperId = `${id}-helper`
  const errorId = `${id}-error`
  const valueText = value === undefined ? '' : format(value)
  const [text, setText] = useState(valueText)
  const [invalid, setInvalid] = useState(false)
  const [syncedText, setSyncedText] = useState(valueText)
  // What this input last put into the draft, so its own change is not shown back as "new".
  const [emittedText, setEmittedText] = useState(valueText)

  if (valueText !== syncedText) {
    setSyncedText(valueText)
    if (valueText !== emittedText) {
      setText(valueText)
      setInvalid(false)
      setEmittedText(valueText)
    }
  }

  const check = () => setInvalid(!parse(text).ok)

  const describedBy = [helperText && helperId, invalid && errorId].filter(Boolean).join(' ')

  return (
    <div className={cn('grid gap-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        value={text}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy || undefined}
        onChange={(event) => {
          const next = event.target.value
          const result = parse(next)
          setText(next)
          if (result.ok) setInvalid(false)
          const emitted = result.ok ? result.value : undefined
          setEmittedText(emitted === undefined ? '' : format(emitted))
          onChange(emitted)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') check()
        }}
        onBlur={check}
      />
      {helperText && (
        <p id={helperId} className="text-muted-foreground text-xs">
          {helperText}
        </p>
      )}
      {invalid && (
        <p id={errorId} className="text-destructive text-xs">
          {invalidMessage}
        </p>
      )}
    </div>
  )
}
