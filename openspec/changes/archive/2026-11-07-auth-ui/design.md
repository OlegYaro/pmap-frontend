# Design

## Context

- `src/auth/tokens.ts` (spec `auth-session`) owns the tokens: access token in memory, refresh token in
  `sessionStorage`, `login()`, `logout()`, single-flight `refreshTokens(tokenUsed)`, `getAccessToken()` and one
  `onSessionEnded(listener)` slot that fires once per failed refresh. `src/api/client.ts` refreshes and retries on
  auth failures. Neither module is changed here, and the `auth-session` spec forbids other code from touching
  `sessionStorage` or the refresh token.
- `refreshTokens(null)` already does what a restore needs: with no refresh token it resolves `false` without a
  request; with an access token already held it resolves `true` without a request; otherwise it sends one refresh
  (shared with any concurrent caller) and on failure clears tokens and calls the session-ended listener.
- The backend access token (`pmap-backend/src/services/auth.py`) has the claims `sub` (the user **id** as a string),
  `role` (`admin` or a regular role), `iat`, `exp` (1 hour). There is no login claim and no `/auth/me`.
- `RootLayout` filters the nav with a constant `isAdmin = false` and has an empty `data-slot="header-actions"`.
  `/admin` renders `AdminPage` directly. The theme follows the pattern context file + hook file + provider file
  (`src/components/theme/`), which keeps oxlint's `react/only-export-components` quiet.
- shadcn (new-york, `radix-ui` package) is set up with `button`, `dropdown-menu`, `skeleton`. Tests use Vitest,
  Testing Library with `fireEvent` (no user-event), and `stubFetch`/`tokenPair`/`deferred` from `src/test/http.ts`.

## Goals / Non-Goals

**Goals:**
- One session state for the whole UI, derived from the token layer without changing it.
- No flash of the anonymous UI and no wrong `/admin` redirect while a stored session is being restored.
- Components later changes reuse as-is: `useAuth()`, `openLoginDialog(reason)`, `LockedButton`, `RequireAdmin`.

**Non-Goals:**
- Proactive token renewal, cross-tab session sync, "remember me", password reset, registration.
- Clearing cached protected query data on logout (no protected queries exist yet; the export and admin changes
  decide this for their own queries).

## Decisions

- **Module layout** in `src/auth/`, mirroring the theme files: `jwt.ts` (payload decode), `authContext.ts` (context,
  types), `useAuth.ts` (hook, throws outside the provider), `AuthProvider.tsx` (state, restore, session-ended
  listener, renders the single `LoginDialog`), `LoginDialog.tsx`, `AccountControl.tsx` (header slot),
  `RequireAdmin.tsx`, `LockedButton.tsx`. `tokens.ts` stays as is.
- **`useAuth()` shape**: `status: 'loading' | 'anonymous' | 'authenticated'`, `user: {id, login, role} | null`,
  `isAdmin`, `openLoginDialog(reason?)`, `login(credentials)`, `logout()`. The prompt named two statuses; a third,
  `loading`, is needed for the restore and is what the guard, the header slot and `LockedButton` branch on.
- **JWT decode without verification** (`jwt.ts`): split on `.`, take the payload, base64url → base64 with padding,
  `atob`, bytes → `TextDecoder('utf-8')`, `JSON.parse`; any failure or a non-object gives `null`, never a throw.
  `role` and `sub` are used only when they are strings. `exp` is decoded with the payload but the UI does not act on
  it (no timer, no auto-logout): an expired access token is renewed by the client's refresh-and-retry on the next
  request, and a second, timer-driven refresh path would race it for a single-use refresh token. Alternative: a JWT
  library (`jwt-decode`); rejected, ~15 lines and no verification is wanted anyway.
- **Login shown in the UI**: the token only has the user id, so the provider remembers `{id, login}` in
  `localStorage` (`pmap.user_login`, reads and writes in try/catch) when the dialog login succeeds, and on restore
  uses it only if the stored `id` equals the token's `sub`; otherwise the name is `User <sub>`. Logout removes it.
  `localStorage` is used because the `auth-session` spec reserves `sessionStorage` handling to `tokens.ts`; the value is
  a display name, not a credential. Alternatives: show only the role (poor UX), or ask the backend for a `login`
  claim (better; see Open Questions).
- **Session restore**: the provider starts in `loading`. One `useEffect` registers `onSessionEnded` first, then calls
  `refreshTokens(null)`; `true` → read `getAccessToken()`, decode, `authenticated`; `false` → `anonymous`. A
  `cancelled` flag ignores results after unmount. Under React StrictMode the effect runs twice, but the second call
  joins the in-flight refresh (single-flight), so one request is sent. When the stored refresh token is rejected at
  start, `tokens.ts` calls the listener, so the "Session expired" toast also shows on that reload; this is intended
  (the user was logged in and is not any more).
- **Session ended**: the listener sets `anonymous`, clears `user`, and calls sonner's `toast.error('Session expired,
  please log in again')`. Explicit logout goes through `tokens.logout()`, which never calls the listener, so no toast.
  The listener is unregistered with the function `onSessionEnded` returns.
- **Silent refreshes during use** (from `api` calls) do not update `user`: the role in a renewed token is the same
  user's role. A role change takes effect on the next login or reload.
- **Toasts**: shadcn `sonner` component. Its generated `sonner.tsx` imports `next-themes`; it is rewritten to take the
  theme from the project's `useTheme()` and `next-themes` is not kept as a dependency. `<Toaster />` is mounted once
  in `App.tsx` inside `ThemeProvider`.
- **Provider placement**: `ThemeProvider > QueryClientProvider > AuthProvider > (RouterProvider + Toaster)`. The
  provider is outside the router, so it never navigates; navigation lives in components that are inside it
  (`RequireAdmin`, `AccountControl`). The login dialog needs no router.
- **Login dialog**: shadcn `dialog`, `input`, `label`; `react-hook-form` with `zodResolver` and the schema
  `{login: z.string().trim().min(1, 'Enter your login'), password: z.string().min(1, 'Enter your password')}`.
  Fields are wired by hand (`Label htmlFor`, `aria-invalid`, `aria-describedby` to the message id) instead of the
  shadcn `form` wrapper, which adds a component for two fields. The submit error is local state shown in a
  `role="alert"` block: `ApiError.message` for an `ApiError`, else "Could not reach the server, please try again";
  it is cleared at the start of each submit. Enter submits through the native `<form>`. The description line shows
  the reason when given, else a neutral "Log in with your PMAP account." (Radix wants a description). The form resets
  when the dialog closes.
- **Dialog focus**: `openLoginDialog` stores `document.activeElement`; `onOpenAutoFocus` prevents the default and
  focuses the login field; `onCloseAutoFocus` prevents the default and focuses the stored element if it is still
  connected (Radix only restores focus to a `Dialog.Trigger`, and this dialog is opened programmatically).
- **Header control** (`AccountControl` in the `header-actions` slot): `loading` → an `aria-hidden` skeleton of the
  button size (keeps the layout still); `anonymous` → `Button` "Log in" with a `LogInIcon`; `authenticated` →
  `DropdownMenu` whose trigger shows a user icon and the login (the text is `sr-only` below `sm` so the bar fits
  360px, the accessible name always contains the login); the content has a label with the login and a shadcn
  `badge` with the role, a separator and "Log out". `RootLayout` drops the `isAdmin` constant and uses
  `useAuth().isAdmin` for the nav filter.
- **Logout from `/admin`**: the menu's "Log out" first navigates to `/` (awaiting React Router's `navigate`) when the
  path starts with `/admin`, then calls `logout()`. So the guard never sees an anonymous user on `/admin` after an
  explicit logout and does not open the dialog. Alternative: a "logged out on purpose" flag read by the guard;
  rejected, it needs resetting rules.
- **`RequireAdmin`** is a layout route: `{ path: 'admin', element: <RequireAdmin />, children: [{ index: true,
  element: <AdminPage /> }] }`, so later admin sub-routes inherit it. `loading` → a skeleton block with one
  `role="status"` "Loading" (same accessibility pattern as `TableSkeleton`); `anonymous` → an effect calls
  `openLoginDialog('Admin area, please log in')` and the component renders `<Navigate to="/" replace />`;
  authenticated non-admin → `ForbiddenPage` (in `pages.tsx`: `PageHeader` "Access denied", one sentence, link home);
  admin → `<Outlet />`. A session ending on `/admin` falls into the anonymous branch, giving both the toast and the
  dialog.
- **`LockedButton`** (`action`, plus the usual `Button` props): authenticated → plain `Button`. Otherwise → shadcn
  `tooltip` around a `Button variant="outline"` with `aria-disabled="true"`, muted text, a `LockIcon` before the
  label, and an `onClick` that calls `preventDefault()` and, only when `anonymous`, `openLoginDialog('Log in to
  <action>')`; the caller's `onClick` is never called. The tooltip ("Log in to <action>") is rendered only when
  anonymous. `aria-disabled` instead of `disabled` keeps the button focusable and lets it receive the click; Enter
  and Space produce the same click on a native button.
- **Tests**: a `src/test/auth.ts` helper builds fake JWTs (`fakeAccessToken({sub, role, exp})`, base64url header,
  payload and a dummy signature) and a `src/test/render.tsx` helper renders routes at a path with all providers and
  the `Toaster`. Every auth test calls `resetTokensForTests()` and clears `localStorage`/`sessionStorage` in
  `beforeEach`; a stored session is simulated by putting a refresh token under `pmap.refresh_token` and answering
  `/api/auth/refresh` with `tokenPair(fakeAccessToken(...), 'R2')`; `deferred()` holds responses to observe
  `loading`.

## Risks / Trade-offs

- [The role is read from an unverified token] → it only hides or shows UI; the gateway rejects non-admin calls with
  403, which the admin pages will show as errors.
- [Remembered login in `localStorage` outlives the tab] → it is only shown when a live session for the same user id
  is restored, and logout removes it.
- [Restore failure shows "Session expired" on reload] → accurate for a user who had a session; a fresh visitor has no
  refresh token, so no request and no toast.
- [Radix tooltip/popper may need `ResizeObserver`, which jsdom lacks] → add a no-op stub to `src/test/setup.ts` only
  if a test fails on it.
- [Role changes during a session are not picked up] → acceptable for an admin flag; next login or reload fixes it.
- [`await navigate('/')` before logout relies on React Router's data-router `navigate` returning a promise] → covered
  by the "Log out on the admin page" test.

## Migration Plan

Frontend only; no data or API migration. Rollback is reverting the change. Users logged in before deploy keep their
refresh token and are restored on the next load.

## Open Questions

- Should `pmap-backend` add a `login` claim to the access token? With it, the remembered-login workaround can be
  dropped in a later change without changing these specs' visible behaviour.
