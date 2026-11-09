import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  message: string
  onRetry: () => void
  /** True while a retry request is running; disables the button. */
  retrying?: boolean
}

export function ErrorState({ message, onRetry, retrying = false }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="border-destructive/50 text-destructive flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3"
    >
      <p className="text-sm">{message}</p>
      <Button type="button" variant="outline" size="sm" onClick={onRetry} disabled={retrying}>
        Retry
      </Button>
    </div>
  )
}
