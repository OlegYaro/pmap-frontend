import { LockIcon } from 'lucide-react'
import type * as React from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useAuth } from './useAuth'

type LockedButtonProps = React.ComponentProps<typeof Button> & {
  /** What the button does, for the hint "Log in to <action>", e.g. `export`. */
  action: string
}

/**
 * A button for an action that needs a login. Anonymous users get a locked, still focusable button
 * whose click opens the login dialog; logged-in users get a normal button.
 */
export function LockedButton({
  action,
  onClick,
  className,
  children,
  ...props
}: LockedButtonProps) {
  const { status, openLoginDialog } = useAuth()

  if (status === 'authenticated') {
    return (
      <Button className={className} onClick={onClick} {...props}>
        {children}
      </Button>
    )
  }

  const hint = `Log in to ${action}`
  // aria-disabled instead of disabled: the button stays in the tab order and receives the click.
  const locked = (
    <Button
      {...props}
      variant="outline"
      aria-disabled="true"
      className={cn('text-muted-foreground hover:text-muted-foreground opacity-70', className)}
      onClick={(event) => {
        event.preventDefault()
        // While the session is restoring the status is unknown: do nothing.
        if (status === 'anonymous') openLoginDialog(hint)
      }}
    >
      <LockIcon aria-hidden />
      {children}
    </Button>
  )

  if (status !== 'anonymous') return locked
  return (
    <Tooltip>
      <TooltipTrigger asChild>{locked}</TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  )
}
