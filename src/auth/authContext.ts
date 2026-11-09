import { createContext } from 'react'
import type { components } from '../api/schema'

export type AuthStatus = 'loading' | 'anonymous' | 'authenticated'

export type Credentials = components['schemas']['LoginRequest']

export interface AuthUser {
  /** The `sub` claim of the access token; null when the token does not carry one. */
  id: string | null
  /** The login to show: the one typed in the login dialog, or `User <id>` when unknown. */
  login: string
  /** The `role` claim; only decides what the UI shows. */
  role: string | null
}

export interface AuthContextValue {
  status: AuthStatus
  /** Set when the status is `authenticated`. */
  user: AuthUser | null
  isAdmin: boolean
  /** Opens the login dialog, optionally explaining why the user should log in. */
  openLoginDialog: (reason?: string) => void
  /** Logs in. Fails with the ApiError of the response and leaves the session as it was. */
  login: (credentials: Credentials) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export const ADMIN_ROLE = 'admin'
