# Proposal

## Why

The app still looks like the Vite template: a 1126px centred column, template headings, a plain link row. The planned
screens (transactions, analytics, admin) need a real visual base first: styling system, light and dark themes, a
header with the final navigation and shared loading, empty and error building blocks. See `docs/frontend-plan.md`.

## What Changes

- Add Tailwind CSS v4 (`@tailwindcss/vite`) and initialise shadcn/ui (new-york style, neutral base, CSS variables) with
  `lucide-react`; add the shadcn primitives the shell needs (button, skeleton, dropdown/menu for the theme toggle).
- Replace the Vite template CSS in `src/index.css` with Tailwind and design tokens for light and dark themes.
- Add a theme toggle (light / dark / system); the choice is kept in `localStorage` and the first paint already
  uses it, with `prefers-color-scheme` as the system default.
- Rebuild `RootLayout`: sticky top bar with the PMAP logo, tabs "Transactions" (`/`) and "Analytics" (`/analytics`),
  an empty right-hand slot for the future login button, the theme toggle, and a `max-w-7xl` content container.
  The "Admin" tab exists in the layout code but is not rendered until auth-ui supplies the role.
- Routes: `/` (still the territories preview), `/analytics` and `/admin` placeholders, `/transactions/:id` kept.
  **BREAKING**: `/login` and `/transactions` are removed (login becomes a dialog; the transactions page takes over `/`).
- Add shared building blocks: `PageHeader`, `EmptyState`, `ErrorState` (with retry button), `TableSkeleton`.
- Restyle the territories preview with the new building blocks (behaviour unchanged).

Out of scope: login dialog, filters, real pages, any API change.

## Capabilities

### New Capabilities
- `theme`: light, dark and system colour themes, the toggle, and persistence of the choice.
- `feedback-states`: shared page header, empty state, error state with retry and table skeleton used by every screen.

### Modified Capabilities
- `app-shell`: route list (adds `/analytics`, removes `/login` and `/transactions`), header navigation (new tabs,
  brand, right-hand slot, Admin tab hidden for now) and the content container.

## Impact

- New dependencies: `tailwindcss`, `@tailwindcss/vite`, `lucide-react`, `class-variance-authority`, `clsx`,
  `tailwind-merge`, `radix-ui` (via shadcn).
- Code: `index.html`, `vite.config.ts`, `tsconfig*.json` (path alias), `components.json`, `src/index.css`,
  `src/app/*`, `src/components/**`, `src/lib/utils.ts`, tests.
- No backend change.
