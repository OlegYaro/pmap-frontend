# Proposal

## Why

The token layer (`src/auth/tokens.ts`) can log in, refresh and log out, but nothing in the UI uses it: there is no
way to log in, the header slot for the login control is empty, the "Admin" tab is hidden by a hard-coded
`isAdmin = false`, and `/admin` is open to everyone. The next changes (export, admin pages) need a known session
state, a login entry point and a way to show actions that need a login. See `docs/frontend-plan.md` (sections 1-2,
step 2).

## What Changes

- Add an auth state layer on top of `src/auth/tokens.ts` (its behaviour is unchanged): an `AuthProvider` and a
  `useAuth()` hook exposing `status` (`"loading" | "anonymous" | "authenticated"`), `user` (`{login, role}`),
  `isAdmin`, `openLoginDialog(reason?)` and `logout()`.
- Read the role (and expiry) from the access token's JWT payload (base64url decode, no signature check; it only
  drives the UI, the gateway enforces access).
- Restore the session on app start: when a refresh token is stored, refresh once before treating the user as
  anonymous; until then the state is `"loading"` (no flash of "Log in", no premature `/admin` redirect).
- When the token layer reports the session ended (failed refresh), switch to anonymous and show the toast
  "Session expired, please log in again" (sonner toaster mounted once in the app).
- Header: the right-hand slot shows a "Log in" button (anonymous), a placeholder while loading, or a user menu with
  the login, a role badge and "Log out" (authenticated). The "Admin" tab is shown only to admins.
- Login is a modal dialog (shadcn dialog, react-hook-form + zod): login and password fields, field validation,
  submit state, the `ApiError` message on failure, Enter submits, focus moves into the dialog and back.
- `RequireAdmin` guard for `/admin`: loading shows a skeleton; anonymous users are sent to `/` and the login dialog
  opens with "Admin area, please log in"; a logged-in non-admin sees a 403 page; admins see the page.
- Reusable `LockedButton`: for anonymous users a grey, lock-icon button with `aria-disabled` (still focusable), a
  tooltip "Log in to <action>", and a click that opens the login dialog; for logged-in users a normal button.

Out of scope: export logic, admin page content, any backend change, changes to `src/auth/tokens.ts`.

## Capabilities

### New Capabilities
- `auth-ui-session`: the app-level session state built on the token layer: status, user and role from the JWT,
  restore on start, session-ended toast, logout, and the header account control.
- `login-dialog`: the modal login form: opening (with an optional reason), validation, submit, error display,
  keyboard and focus behaviour.
- `admin-guard`: access to the `/admin` area by session status and role (skeleton, redirect with login, 403).
- `locked-action`: a button for actions that need a login, locked for anonymous users and normal for logged-in ones.

### Modified Capabilities
- `app-shell`: header navigation (the "Admin" link is shown to admins only; the right-hand slot holds the login
  control) and the route list (`/admin` is reached through the admin guard).

## Impact

- New dependencies: `sonner`, `react-hook-form`, `zod`, `@hookform/resolvers` (verified to build with TS 7 / Vite 8
  in the plan). New shadcn components: `dialog`, `input`, `label`, `tooltip`, `badge`, `sonner` (the generated
  `sonner.tsx` is adapted to the project's theme hook, no `next-themes`).
- Code: new `src/auth/*` UI modules (provider, hook, JWT decode, dialog, account control, guard, locked button),
  `src/app/RootLayout.tsx` (drops the `isAdmin` constant, fills `data-slot="header-actions"`), `src/app/routes.tsx`,
  `src/app/pages.tsx` (403 page), `src/App.tsx` (provider and toaster), test helpers in `src/test/`, updated
  `routes.test.tsx` and `App.test.tsx`.
- `src/auth/tokens.ts` and the `auth-session` spec stay unchanged.
- Backend: none. The access token has no login claim (`sub` is the user id), see design.md; adding a `login` claim in
  `pmap-backend` would remove a workaround.
