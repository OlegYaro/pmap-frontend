# Tasks

## 1. Tooling

- [x] 1.1 Install `tailwindcss`, `@tailwindcss/vite`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `radix-ui`; add the Tailwind plugin and the `@/*` alias to `vite.config.ts` and `tsconfig.app.json`; verify `npm run build` and `npm test` still pass.
- [x] 1.2 Initialise shadcn (`components.json`, `src/lib/utils.ts`), add `button`, `skeleton`, `dropdown-menu`; verify `npm run build` and `npm run lint` pass.
- [x] 1.3 Replace `src/index.css` with Tailwind import, light/dark tokens and the `dark` variant; remove template styles; verify `npm run build` passes and the app loads (`npm run dev` or build output has the CSS).

## 2. Theme

- [x] 2.1 Add `ThemeProvider`/`useTheme` (light/dark/system, `pmap-theme` in try/catch, `matchMedia` listener) and the `ThemeToggle` dropdown; add the `matchMedia` stub to `src/test/setup.ts`; verify with tests for default-system, explicit choice, system change, persistence, throwing storage.
- [x] 2.2 Add the inline no-flash script to `index.html` and wrap the app in `ThemeProvider` in `src/main.tsx`/`App.tsx`; verify with `npm run build` and a test that the provider reads the stored choice.

## 3. Shared states

- [x] 3.1 Add `PageHeader`, `EmptyState`, `ErrorState`, `TableSkeleton` in `src/components/`; verify with a Testing Library test per component covering the scenarios of `feedback-states`.

## 4. Shell

- [x] 4.1 Rebuild `RootLayout` (sticky bar, brand, Transactions/Analytics tabs, right slot, theme toggle, `max-w-7xl` container, Admin hidden via a constant); verify with tests for links, current-page marking, no Admin link.
- [x] 4.2 Update routes and pages: add `/analytics`, keep `/admin` and `/transactions/:id`, remove `/login` and `/transactions`, restyle the not-found page; update `routes.test.tsx` and `App.test.tsx` (removed routes show not-found); verify `npm test` passes.
- [x] 4.3 Restyle the territories preview with the new building blocks keeping its texts; verify `TerritoriesPreviewPage.test.tsx` passes unchanged in behaviour.

## 5. Wrap-up

- [x] 5.1 Update `README.md` with the UI stack (Tailwind, shadcn, how to add a component); run `npm run build`, `npm run lint`, `npm test`, `npm run format:check` and verify all are green.
