/**
 * The access token carries the user id but not the login, so the login typed in the dialog is
 * remembered here to show it again after a reload. It is a display name, not a credential, and is
 * only used for the same user id.
 */

const STORAGE_KEY = 'pmap.user_login'

export function rememberLogin(id: string, login: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, login }))
  } catch {
    // Storage unavailable: the name falls back to `User <id>` after a reload.
  }
}

/** The login remembered for this user id, or null. */
export function rememberedLogin(id: string): string | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (typeof value !== 'object' || value === null) return null
    const { id: storedId, login } = value as Record<string, unknown>
    return storedId === id && typeof login === 'string' ? login : null
  } catch {
    return null
  }
}

export function forgetLogin(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing stored then.
  }
}
