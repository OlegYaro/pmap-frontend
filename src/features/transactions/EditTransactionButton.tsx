import { PencilIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { initialFromTransaction, toUpdateBody } from '../admin/transactions/payload'
import { TransactionFormDialog } from '../admin/transactions/TransactionFormDialog'
import { useUpdateTransaction } from '../admin/transactions/useTransactionMutations'
import type { TransactionRow } from './listQuery'

/**
 * "Edit" for an admin: the form prefilled from `transaction`. Saving sends only the changed fields
 * (and the registry flag when checked), closes the dialog and refetches the transaction.
 */
export function EditTransactionButton({ transaction }: { transaction: TransactionRow }) {
  const [open, setOpen] = useState(false)
  // Taken when the dialog opens, so a refetch while it is open does not move the baseline.
  const [initial, setInitial] = useState(() => initialFromTransaction(transaction))
  const update = useUpdateTransaction(transaction.id)

  const changeOpen = (next: boolean) => {
    if (next) setInitial(initialFromTransaction(transaction))
    setOpen(next)
  }

  return (
    <TransactionFormDialog
      mode="edit"
      title={`Edit transaction ${transaction.id}`}
      initial={initial}
      open={open}
      onOpenChange={changeOpen}
      trigger={
        <Button type="button" variant="outline">
          <PencilIcon aria-hidden />
          Edit
        </Button>
      }
      onSubmit={async (values, acceptRegistry) => {
        await update.mutateAsync(toUpdateBody(values, initial, acceptRegistry))
        setOpen(false)
        toast.success(`Transaction ${transaction.id} saved`)
      }}
    />
  )
}
