import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { readAccessToken } from './jwt'
import { LoginDialog } from './LoginDialog'
import { forgetLogin, rememberLogin, rememberedLogin } from './rememberedLogin'
import * as tokens from './tokens'
import {
  ADMIN_ROLE,
  AuthContext,
  type AuthContextValue,
  type AuthStatus,
  type AuthUser,
  type Credentials,
} from './authContext'

interface SessionState {
  status: AuthStatus
  user: AuthUser | null
}

const ANONYMOUS: SessionState = { status: 'anonymous', user: null }

const SESSION_EXPIRED_MESSAGE = 'Session expired, please log in again'

/** The session for the access token held now; `login` is the name typed in the dialog, if any. */
function authenticated(login?: string): SessionState {
  const token = tokens.getAccessToken()
  const claims = token === null ? null : readAccessToken(token)
  const id = claims?.id ?? null
  const name = login ?? (id === null ? null : rememberedLogin(id)) ?? `User ${id ?? ''}`.trim()
  return { status: 'authenticated', user: { id, login: name, role: claims?.role ?? null } }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>({ status: 'loading', user: null })

  // Restore the session of a reloaded tab: one refresh if a refresh token is stored. The
  // listener goes first so a failed restore is reported like any other ended session.
  useEffect(() => {
    let active = true
    const stopListening = tokens.onSessionEnded(() => {
      setSession(ANONYMOUS)
      toast.error(SESSION_EXPIRED_MESSAGE)
    })
    void tokens.refreshTokens(null).then((restored) => {
      if (active) setSession(restored ? authenticated() : ANONYMOUS)
    })
    return () => {
      active = false
      stopListening()
    }
  }, [])

  const login = useCallback(async (credentials: Credentials) => {
    await tokens.login(credentials)
    const next = authenticated(credentials.login)
    if (next.user?.id != null) rememberLogin(next.user.id, credentials.login)
    setSession(next)
  }, [])

  const logout = useCallback(async () => {
    // tokens.logout clears the tokens at once; the server call that follows is best effort.
    const done = tokens.logout()
    forgetLogin()
    setSession(ANONYMOUS)
    await done
  }, [])

  const [dialog, setDialog] = useState<{ open: boolean; reason: string | null }>({
    open: false,
    reason: null,
  })
  const [returnFocusTo, setReturnFocusTo] = useState<HTMLElement | null>(null)

  const openLoginDialog = useCallback((reason?: string) => {
    const focused = document.activeElement
    setReturnFocusTo(focused instanceof HTMLElement && focused !== document.body ? focused : null)
    setDialog({ open: true, reason: reason ?? null })
  }, [])

  const onDialogOpenChange = useCallback((open: boolean) => {
    setDialog((current) => (open ? current : { open: false, reason: null }))
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status: session.status,
      user: session.user,
      isAdmin: session.user?.role === ADMIN_ROLE,
      openLoginDialog,
      login,
      logout,
    }),
    [session, openLoginDialog, login, logout],
  )

  return (
    <AuthContext value={value}>
      {children}
      <LoginDialog
        open={dialog.open}
        reason={dialog.reason}
        onOpenChange={onDialogOpenChange}
        returnFocusTo={returnFocusTo}
      />
    </AuthContext>
  )
}
