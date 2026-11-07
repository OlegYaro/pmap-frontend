import { zodResolver } from '@hookform/resolvers/zod'
import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '../api/errors'
import { useAuth } from './useAuth'

const schema = z.object({
  login: z.string().trim().min(1, 'Enter your login'),
  password: z.string().min(1, 'Enter your password'),
})

const NETWORK_FAILURE = 'Could not reach the server, please try again'

interface LoginDialogProps {
  open: boolean
  /** Why the user is asked to log in; a neutral line is shown without one. */
  reason: string | null
  onOpenChange: (open: boolean) => void
  /** Gets focus back when the dialog closes (it is opened from code, not from a trigger). */
  returnFocusTo: HTMLElement | null
}

export function LoginDialog({ open, reason, onOpenChange, returnFocusTo }: LoginDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onCloseAutoFocus={(event) => {
          if (returnFocusTo?.isConnected) {
            event.preventDefault()
            returnFocusTo.focus()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Log in</DialogTitle>
          <DialogDescription>{reason ?? 'Log in with your PMAP account.'}</DialogDescription>
        </DialogHeader>
        {/* The form unmounts with the closed dialog, so every opening starts empty. */}
        <LoginForm onLoggedIn={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function LoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const { login } = useAuth()
  const id = useId()
  const [failure, setFailure] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { login: '', password: '' } })

  const submit = handleSubmit(async (credentials) => {
    try {
      await login(credentials)
      onLoggedIn()
    } catch (error) {
      setFailure(error instanceof ApiError ? error.message : NETWORK_FAILURE)
    }
  })

  // The Login field is the first focusable element, so the dialog focuses it on open.
  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={(event) => {
        setFailure(null)
        void submit(event)
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor={`${id}-login`}>Login</Label>
        <Input
          id={`${id}-login`}
          autoComplete="username"
          aria-invalid={errors.login ? true : undefined}
          aria-describedby={errors.login ? `${id}-login-error` : undefined}
          {...register('login')}
        />
        {errors.login && (
          <p id={`${id}-login-error`} className="text-destructive text-sm">
            {errors.login.message}
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${id}-password`}>Password</Label>
        <Input
          id={`${id}-password`}
          type="password"
          autoComplete="current-password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? `${id}-password-error` : undefined}
          {...register('password')}
        />
        {errors.password && (
          <p id={`${id}-password-error`} className="text-destructive text-sm">
            {errors.password.message}
          </p>
        )}
      </div>
      {failure && (
        <div
          role="alert"
          className="border-destructive/50 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {failure}
        </div>
      )}
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </Button>
      </DialogFooter>
    </form>
  )
}
