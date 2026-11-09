/**
 * Reads the claims of an access token. The signature is NOT checked: the result only decides what
 * the UI shows, the gateway checks the token on every request.
 */

export interface AccessTokenClaims {
  /** `sub`: the user id. */
  id: string | null
  /** `role`, e.g. `admin`. */
  role: string | null
  /** `exp` as a date. The UI does not act on it: the client refreshes on the next refused request. */
  expiresAt: Date | null
}

function decodeBase64Url(part: string): string {
  const base64 = part.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

function stringClaim(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

/** The claims of a JWT, or null when its payload is not a readable JSON object. Never throws. */
export function readAccessToken(token: string): AccessTokenClaims | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  let payload: unknown
  try {
    payload = JSON.parse(decodeBase64Url(parts[1]))
  } catch {
    return null
  }
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return null
  const claims = payload as Record<string, unknown>
  return {
    id: stringClaim(claims.sub),
    role: stringClaim(claims.role),
    expiresAt: typeof claims.exp === 'number' ? new Date(claims.exp * 1000) : null,
  }
}
