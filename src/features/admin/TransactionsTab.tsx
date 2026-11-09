import { CreateTransaction } from './transactions/CreateTransaction'

/** The "Transactions" tab: adding a transaction by hand. Editing starts on the transaction page. */
export function TransactionsTab() {
  return (
    <div className="grid justify-items-start gap-4">
      <p className="text-muted-foreground max-w-prose text-sm">
        Add a transaction that is missing from the registry data. To correct a transaction, open it
        and choose Edit.
      </p>
      <CreateTransaction />
    </div>
  )
}
