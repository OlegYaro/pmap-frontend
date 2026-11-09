# Design

## Context

- `index.html` has `<title>app</title>` and the favicon link; the inline theme script and the favicon are already right.
- `RootLayout` renders the header and `<main className="...">` around `Outlet`; pages set no titles. There is no skip link.
- `src/assets/hero.png`, `src/assets/vite.svg` and `public/icons.svg` are leftovers of the Vite template; a search for their
  names in `src/`, `index.html` and the README finds no use.
- `NotFoundPage` and `ForbiddenPage` live in `src/app/pages.tsx`, render `PageHeader` plus a button and no empty-state block.
- The README documents only API types and the dev server.

## Goals / Non-Goals

**Goals:**
- Small, local changes; no new dependency and no change to data behaviour.
- A review that produces fixes with tests, not a list of suggestions.

**Non-Goals:**
- Automated accessibility scanning libraries, visual regression tests, or a redesign.

## Decisions

**Titles by a hook, not a router config.** `useDocumentTitle(name)` sets the document title to the page name followed by " · PMAP" in an effect and
leaves the next page to overwrite it. Pages call it with their name; the detail page passes `Transaction ${id}` once the id
is parsed. Alternative: a `handle.title` on routes read by the layout. Rejected: the detail title depends on the URL
parameter and the forbidden title on the session, which a static route config cannot express.

**Skip link in the layout.** An `<a href="#main-content" className="sr-only focus:not-sr-only ...">` is the first child of the
layout; `<main id="main-content" tabIndex={-1}>` receives focus through the browser's fragment navigation. With a router
using `createBrowserRouter`, a plain fragment link would be handled as a navigation, so the click handler focuses the main
element directly and calls `preventDefault()`, which keeps the URL and the filters untouched. Focus ring on `main` is
suppressed (`outline-none`) because it is a programmatic target, not a control.

**Not-found and forbidden look.** Both pages render `PageHeader` and an `EmptyState` with the explanation and the back
button as its `action`, the pattern the lists use. The wording stays.

**Review as tasks with tests.** Each audit item is a concrete check with a test where DOM-testable: tab order of the header
and filter panel (user-event tab sequence), accessible names of icon-only buttons (query by role and name), live regions
exist for loading/export states (role `status`), no `outline-none` without a replacement focus style (grep), and token
contrast (the chart tokens were validated earlier; the review checks `muted-foreground` on `background` and `card` in both
themes with a small script run once, not shipped). Findings are fixed in place.

**Dead code.** Delete the three assets and search for unused exports/files with `tsc --noUnusedLocals` and a file-level grep
of imports; remove only what is provably unused.

**README.** Sections: what the app is, scripts (`dev`, `build`, `lint`, `test`, `format:check`, `api:types`), project
structure (`src/api`, `src/auth`, `src/components`, `src/features/*`, `src/lib`, `src/test`), conventions (state in the URL,
keyset paging, strict analytics queries, auth role only a UI hint), OpenSpec workflow (`openspec/`), environment (`.env.example`).

**Smoke test.** One test file renders each route through `renderRoutes` with stubbed HTTP and asserts the title, an `h1` and
the `main` landmark: `/`, `/analytics`, `/transactions/42`, `/admin` (as admin), `/admin` (non-admin), an unknown path.

## Risks / Trade-offs

- [Removing an asset that something loads dynamically] → the grep covers `src`, `index.html`, `public`, CSS `url()` and the
  build must pass; the smoke test and the build catch broken imports.
- [Skip link steals the first tab stop from the brand link] → expected and standard; the tests were written for the old order
  and are updated.
- [Review findings grow the change] → only defects that violate an existing spec requirement or a WCAG A/AA criterion are
  fixed here; anything larger is reported in the final notes instead.
