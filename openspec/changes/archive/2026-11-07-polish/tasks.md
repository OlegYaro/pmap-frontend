# Tasks

## 1. Titles and head

- [x] 1.1 Create `src/app/useDocumentTitle.ts` and call it from the transactions, analytics, admin, transaction detail, not-found and forbidden pages (detail: `Transaction <id>`, plain `Transaction` for an invalid id); verify with `useDocumentTitle.test.tsx` and title assertions in the page tests (home, navigating to analytics, detail 42, unknown path, forbidden)
- [x] 1.2 Update `index.html`: title "PMAP", `description`, `theme-color` for light and dark, keep the favicon link; verify with a test that parses `index.html` and finds each tag, and `npm run build` succeeds

## 2. Skip link and states

- [x] 2.1 Add the "Skip to main content" link and `main#main-content` (programmatic focus, no URL change) to `RootLayout.tsx`; verify with `RootLayout.test.tsx` (first Tab stop is the link and it is visible when focused, Enter moves focus into main and leaves the URL and its query unchanged) and update existing tests that assumed the brand link is the first tab stop
- [x] 2.2 Render `NotFoundPage` and `ForbiddenPage` with `EmptyState` and the back button as its action; verify with updated tests (heading, explanation, link or button to `/`)

## 3. Accessibility review

- [x] 3.1 Review focus order and accessible names of the header, filter panel, chips, tables, dialogs and the sheets/forms of the admin area; fix every defect found, with a test per fix (tab sequence of the header, role+name lookups for icon-only buttons); verify the tests pass
- [x] 3.2 Search for `outline-none` / `focus:outline-none` without a replacement focus indicator, and for loading/export/error regions without `role="status"` or `role="alert"`; fix each hit with a test; verify with the grep output recorded in the task notes
- [x] 3.3 Check the contrast of `muted-foreground`, `destructive`, `success` and the badge/chip tokens against `background` and `card` in both themes with a one-off script (not committed); fix any token under 4.5:1 for text or 3:1 for graphics; verify by listing the measured ratios in the task notes

## 4. Clean-up and docs

- [x] 4.1 Delete `src/assets/hero.png`, `src/assets/vite.svg` and `public/icons.svg` after confirming no reference; remove other provably unused files or exports found with `tsc --noEmit --noUnusedLocals` and an import grep; verify `npm run build`, `npm run lint` and `npm test` still pass
- [x] 4.2 Rewrite `README.md` (app description, scripts, structure, conventions, OpenSpec workflow, environment) keeping the existing API-types and dev-server sections accurate; verify every command named in it exists in `package.json`

## 5. Smoke test and verification

- [x] 5.1 Add `src/app/smoke.test.tsx` rendering `/`, `/analytics`, `/transactions/42`, `/admin` as an admin, `/admin` as a non-admin and an unknown path, asserting document title, one `h1` and the `main` landmark for each; verify it passes
- [x] 5.2 Run `npm run build`, `npm run lint`, `npm test` and `npm run format:check`; verify all pass
