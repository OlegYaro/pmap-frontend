import { PlusIcon } from 'lucide-react'
import { useState, type MouseEvent } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { EMPTY_FORM } from './formSchema'
import { toCreateBody } from './payload'
import { TransactionFormDialog } from './TransactionFormDialog'
import { useCreateTransaction } from './useTransactionMutations'

/** A plain left click, which the app handles itself; others keep the browser's link behaviour. */
const isPlainClick = (event: MouseEvent) =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey

/**
 * "New transaction": the empty form in a dialog. A created transaction closes the dialog and shows a
 * toast with a link to it; the user stays where they are.
 */
export function CreateTransaction() {
  const [open, setOpen] = useState(false)
  const create = useCreateTransaction()
  const navigate = useNavigate()

  return (
    <TransactionFormDialog
      mode="create"
      title="New transaction"
      initial={EMPTY_FORM}
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button type="button">
          <PlusIcon aria-hidden />
          New transaction
        </Button>
      }
      onSubmit={async (values) => {
        const created = await create.mutateAsync(toCreateBody(values))
        setOpen(false)
        const path = `/transactions/${created.id}`
        // The toaster sits outside the router, so the link navigates through this component.
        const toastId = toast.success(`Transaction ${created.id} created`, {
          action: (
            <a
              href={path}
              className="text-primary ml-auto text-sm font-medium underline-offset-4 hover:underline"
              onClick={(event) => {
                if (!isPlainClick(event)) return
                event.preventDefault()
                toast.dismiss(toastId)
                void navigate(path)
              }}
            >
              View transaction
            </a>
          ),
        })
      }}
    />
  )
}
