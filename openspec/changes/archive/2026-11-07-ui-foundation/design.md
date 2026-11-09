# Design

## Context

Plain CSS from the Vite template in `src/index.css`; layout is a bare `<header>` with `NavLink`s
(`src/app/RootLayout.tsx`); pages are placeholders in `src/app/pages.tsx`; the preview page at `/` uses unstyled
HTML. Vite 8, React 19, TypeScript 7. Tailwind 4.3, `@tailwindcss/vite`, `radix-ui`, `lucide-react` were verified to
build with this toolchain in a scratch copy. See proposal.md for scope and `docs/frontend-plan.md` for the plan.

## Goals / Non-Goals

**Goals:**
- One styling system (Tailwind + shadcn tokens) used by every later screen.
- Theme applied before first paint, no flash.
- Reusable, tested state components.

**Non-Goals:**
- Login UI, filters, real pages, i18n, a custom brand design beyond a text/icon logo.

## Decisions

- **Tailwind v4 via `@tailwindcss/vite`**, CSS-first config (`@import "tailwindcss"` plus `@theme inline` tokens in
  `src/index.css`); no `tailwind.config.js`. Alternative: PostCSS plugin; rejected, the Vite plugin is the documented
  path and faster.
- **shadcn/ui, new-york style, neutral base, CSS variables**, initialised with `npx shadcn@latest init` (creates
  `components.json`, `src/lib/utils.ts` with `cn`, components in `src/components/ui/`). Needs the `@/*` path alias in
  `tsconfig.app.json` (`paths`) and `vite.config.ts` (`resolve.alias`); vitest reuses the Vite config so tests resolve it too.
  Components are copied into the repo (we own them). Only add what is used: `button`, `skeleton`, `dropdown-menu`.
  If the CLI cannot run, the same files are written by hand from the shadcn sources.
- **Theme without a library**: a `ThemeProvider` + `useTheme()` in `src/components/theme/`. State is
  `'light' | 'dark' | 'system'`; it toggles the `dark` class on `<html>` (Tailwind `dark:` variant configured with
  `@custom-variant dark (&:where(.dark, .dark *))`). Storage key `pmap-theme`; reads and writes are in try/catch. A
  `matchMedia('(prefers-color-scheme: dark)')` listener updates when the choice is system. A small inline script in
  `index.html` sets the class before React loads to avoid a flash. Alternative: `next-themes`; rejected, a new
  dependency for ~40 lines.
- **Layout**: `RootLayout` = sticky `header` (`backdrop-blur`, border) with brand `Link`, `nav aria-label="Main"`, a
  right-hand `<div>` slot (empty) and `ThemeToggle`; `main` is `mx-auto w-full max-w-7xl px-4 sm:px-6 py-6`. The
  nav items array has `adminOnly: true` on Admin and the layout filters it with a constant `isAdmin = false`; auth-ui
  replaces that constant with the real role. The `Transactions` NavLink has `end`, so it is current only on `/`
  (the transaction detail page does not highlight it in this change).
- **Building blocks** in `src/components/`: `PageHeader`, `EmptyState`, `ErrorState`, `TableSkeleton`, plain
  components styled with Tailwind; `ErrorState` takes `message`, `onRetry`, `retrying?`; `TableSkeleton` takes
  `rows`, `columns` and renders a real `<table>` with `aria-hidden` cells and one visually hidden
  `role="status"` "Loading".
- **Preview page** is restyled with these blocks but keeps its texts ("Territories", "Loading territories…",
  "No territories.", "Retry") so its existing spec scenarios and tests stay valid.
- **Tests**: Testing Library tests for each component, the theme provider (class on `<html>`, storage failure via a
  throwing `localStorage` stub, `matchMedia` stub in `src/test/setup.ts`), and updated route/app tests. jsdom has no
  `matchMedia`; the stub lives in the test setup.

## Risks / Trade-offs

- [shadcn CLI needs network and may change generated files] → pin by reviewing the generated diff; write by hand if it fails.
- [Dropping the template CSS removes every old style] → all pages are placeholders; the preview page is restyled here.
- [`/transactions` removal breaks old links] → the app is not released; the not-found page covers it.
- [Inline theme script duplicates the storage key] → one constant documented in both places and covered by a test of the provider.
