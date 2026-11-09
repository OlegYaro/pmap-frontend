import { zodResolver } from '@hookform/resolvers/zod'
import { useId, useState, type ReactNode } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { FORM_FIELDS, transactionFormSchema, type FormField, type FormValues } from './formSchema'
import { toUpdateBody } from './payload'
import { NOT_FOUND_MESSAGE, serverErrors } from './serverErrors'
import { TransactionFormFields } from './TransactionFormFields'

export type TransactionFormMode = 'create' | 'edit'

interface TransactionFormDialogProps {
  mode: TransactionFormMode
  title: string
  initial: FormValues
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The button that opens the dialog; it gets focus back when the dialog closes. */
  trigger: ReactNode
  /** Sends the valid form. A rejection is shown on the fields or at the top of the form. */
  onSubmit: (values: FormValues, acceptRegistry: boolean) => Promise<void>
}

const DESCRIPTIONS: Record<TransactionFormMode, string> = {
  create: 'Only Powiat is required. Empty fields are left out.',
  edit: 'Only the changed fields are saved.',
}

/**
 * The transaction form in a dialog, for creating (`initial` empty) and editing (`initial` from the
 * record, plus the "Accept registry value" checkbox). The form is rebuilt on every opening, so
 * closing discards the input. One column below `sm`, scrolling inside the dialog.
 */
export function TransactionFormDialog({
  mode,
  title,
  initial,
  open,
  onOpenChange,
  trigger,
  onSubmit,
}: TransactionFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{DESCRIPTIONS[mode]}</DialogDescription>
        </DialogHeader>
        <TransactionForm mode={mode} initial={initial} onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>
  )
}

type TransactionFormProps = Pick<TransactionFormDialogProps, 'mode' | 'initial' | 'onSubmit'>

function TransactionForm({ mode, initial, onSubmit }: TransactionFormProps) {
  const id = useId()
  const [schema] = useState(() => transactionFormSchema(initial.status))
  // Focus moves to the first invalid field in form order (the selects register after the inputs).
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial,
    shouldFocusError: false,
  })
  const [acceptRegistry, setAcceptRegistry] = useState(false)
  const [failure, setFailure] = useState<string[]>([])
  const { isSubmitting } = form.formState
  const watched = useWatch({ control: form.control })

  // An edit with no change and without the flag would send an empty body.
  const unchanged =
    mode === 'edit' &&
    Object.keys(toUpdateBody({ ...initial, ...watched }, initial, acceptRegistry)).length === 0

  const focusFirst = (invalid: (field: FormField) => boolean) => {
    const first = FORM_FIELDS.find(invalid)
    if (first) form.setFocus(first)
  }

  const submit = form.handleSubmit(
    async (values) => {
      try {
        await onSubmit(values, acceptRegistry)
      } catch (error) {
        const found = serverErrors(error, mode === 'edit' ? NOT_FOUND_MESSAGE : undefined)
        for (const { field, message } of found.fields) {
          form.setError(field, { type: 'server', message })
        }
        setFailure(found.form)
        focusFirst((field) => found.fields.some((item) => item.field === field))
      }
    },
    (errors) => focusFirst((field) => errors[field] !== undefined),
  )

  return (
    <FormProvider {...form}>
      <form
        noValidate
        className="grid min-w-0 gap-4"
        onSubmit={(event) => {
          setFailure([])
          void submit(event)
        }}
      >
        {failure.length > 0 && (
          <div
            role="alert"
            className="border-destructive/50 text-destructive grid gap-1 rounded-md border px-3 py-2 text-sm"
          >
            {failure.map((message, index) => (
              <p key={index}>{message}</p>
            ))}
          </div>
        )}
        <TransactionFormFields initial={initial} />
        {mode === 'edit' && (
          <div className="flex items-start gap-2">
            <Checkbox
              id={`${id}-accept`}
              checked={acceptRegistry}
              onCheckedChange={(checked) => setAcceptRegistry(checked === true)}
              aria-describedby={`${id}-accept-help`}
              className="mt-0.5"
            />
            <div className="grid gap-1">
              <Label htmlFor={`${id}-accept`}>Accept registry value</Label>
              <p id={`${id}-accept-help`} className="text-muted-foreground text-sm">
                Hands the record back to the registry data: later syncs may overwrite the manual
                changes.
              </p>
            </div>
          </div>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isSubmitting || unchanged}>
            {submitText(mode, isSubmitting)}
          </Button>
        </DialogFooter>
      </form>
    </FormProvider>
  )
}

function submitText(mode: TransactionFormMode, pending: boolean): string {
  if (mode === 'create') return pending ? 'Creating…' : 'Create'
  return pending ? 'Saving…' : 'Save'
}
