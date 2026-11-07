# Tasks

Every task ends with a passing `npm run build`, `npm run lint` and `npm test`. HTTP in tests goes through
`src/test/http.ts`; each auth test resets the token module with `resetTokensForTests()` and clears both storages.

## 1. Dependencies and UI primitives

- [x] 1.1 Install `sonner`, `react-hook-form`, `zod`, `@hookform/resolvers`; verify `package.json` lists them and `npm run build` passes.
- [x] 1.2 Add shadcn `dialog`, `input`, `label`, `tooltip`, `badge`, `sonner` to `src/components/ui/`; rewrite `sonner.tsx` to use the project's `useTheme()` and make sure `next-themes` is not a dependency; verify `npm run build` and `npm run lint` pass and `grep -r next-themes src package.json` finds nothing.

## 2. Session state

- [x] 2.1 Add `src/auth/jwt.ts` (base64url payload decode → `{id, role, expiresAt}` or `null`, never throws) and `src/test/auth.ts` with `fakeAccessToken()`; verify with `jwt.test.ts`: admin and user payloads, base64url characters `-`/`_` and missing padding, UTF-8 claim values, malformed token, non-object payload, non-string `role`/`sub`.
- [x] 2.2 Add `authContext.ts`, `useAuth.ts` and `AuthProvider.tsx` (status `loading`/`anonymous`/`authenticated`, `user`, `isAdmin`, `login`, `logout`, dialog open state, remembered login in `localStorage` `pmap.user_login` with try/catch); verify with `AuthProvider.test.tsx`: login as admin and as user sets status and `isAdmin`, unreadable token gives a non-admin user, logout sends `POST /auth/logout` and becomes anonymous, the login is remembered per user id and forgotten on logout, `User <id>` fallback, throwing `localStorage` does not break login, `useAuth` outside the provider throws.
- [x] 2.3 Add session restore in `AuthProvider` (register `onSessionEnded`, then `refreshTokens(null)`); verify with tests: no refresh token → anonymous and no `/auth/refresh` request; stored refresh token → status `loading` while the refresh is held with `deferred()`, then authenticated with the role from the new token and exactly one refresh request; refresh answers 401 → anonymous.
- [x] 2.4 Mount `<Toaster />` and wrap the router in `AuthProvider` in `src/App.tsx`; show `toast.error('Session expired, please log in again')` from the session-ended listener; add `src/test/render.tsx` (routes at a path with Theme, Query and Auth providers and the Toaster); verify with tests: a protected `api` call that gets 401 with a failing refresh makes the status anonymous and shows the toast once; logout shows no toast; `App.test.tsx` still passes.

## 3. Login dialog

- [x] 3.1 Add `LoginDialog.tsx` (rendered once by `AuthProvider`; title "Log in", reason or neutral description, Login and Password fields with labels, zod validation messages linked by `aria-describedby`, submit button "Log in"/"Logging in…", `role="alert"` error, reset on close); verify with `LoginDialog.test.tsx`: empty submit shows both messages and sends no request; Enter in the password field submits `{login: "anna", password: "secret"}` with the login trimmed; button disabled with "Logging in…" while the request is held; success closes the dialog and the user is authenticated; 401 shows "Invalid login or password" and keeps the dialog open; a rejected `fetch` shows "Could not reach the server, please try again"; the reason text is shown when given; Escape closes and the next opening has an empty form.
- [x] 3.2 Add focus handling (focus the Login field on open, return focus to the element focused before opening); verify with a test that opens the dialog from a focused button, checks focus on the Login field, presses Escape and checks focus is back on the button.

## 4. Header

- [x] 4.1 Add `AccountControl.tsx` (skeleton while loading, "Log in" button, user menu with login, role badge and "Log out", login text `sr-only` below `sm`) and render it in the `data-slot="header-actions"` slot of `RootLayout`; verify with tests: anonymous shows "Log in" and clicking it opens the dialog without a reason; loading shows neither "Log in" nor the menu; authenticated `anna`/`admin` shows a trigger named with `anna`, and the opened menu shows `anna`, the badge `admin` and "Log out"; choosing "Log out" shows the "Log in" button again.
- [x] 4.2 Replace the `isAdmin` constant in `RootLayout` with `useAuth().isAdmin`; update `routes.test.tsx` to render through `src/test/render.tsx`; verify with tests: the Admin link is absent for anonymous, loading and `user` sessions and present (to `/admin`) for an admin; the "Log in" button comes before the theme toggle; the existing navigation, current-link and not-found tests still pass.

## 5. Admin guard

- [x] 5.1 Add `RequireAdmin.tsx` as a layout route around `/admin` (index child `AdminPage`) and `ForbiddenPage` in `pages.tsx`; verify with tests: admin sees the "Admin" heading; anonymous on `/admin` ends on `/` with the dialog open showing "Admin area, please log in" and a history entry replaced (going back does not return to `/admin`); a `user` sees "Access denied" with a link to `/` and no dialog; with a stored refresh token held by `deferred()` `/admin` shows the "Loading" status and no redirect, then the "Admin" heading after the refresh succeeds.
- [x] 5.2 Make "Log out" in the user menu navigate to `/` first when the path is under `/admin`; verify with tests: an admin logging out on `/admin` ends on `/` with the dialog closed; a session that ends by failed refresh on `/admin` ends on `/` with the dialog open and the "Session expired, please log in again" toast.

## 6. Locked action

- [x] 6.1 Add `LockedButton.tsx` (`action` prop plus `Button` props; locked look with `LockIcon`, `aria-disabled`, tooltip "Log in to <action>" when anonymous, normal button when authenticated); verify with `LockedButton.test.tsx`: anonymous renders `aria-disabled="true"` without `disabled` and is focusable; focus shows the tooltip "Log in to export"; click does not call `onClick` and opens the dialog with "Log in to export"; while loading the click does nothing and no dialog opens; authenticated renders an enabled button without the lock or tooltip and calls `onClick` once.

## 7. Integration checks

- [x] 7.1 Update `README.md` with a short note on the auth UI (`useAuth`, `openLoginDialog`, `LockedButton`, `RequireAdmin`, role from the JWT is a UI hint only); run `npm run build`, `npm run lint`, `npm test`, `npm run format:check` and verify all pass.
- [x] 7.2 Run `openspec validate auth-ui --strict` and verify it reports the change as valid.

## Workflow follow-up

- Review the result in the running app (`npm run dev` with `VITE_API_TARGET`): log in as admin and as a regular user, reload, open `/admin` anonymously.
- Archive the change with `/opsx:archive auth-ui` after review.
