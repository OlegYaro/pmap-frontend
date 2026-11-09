# Proposal

## Why

All planned screens exist, but the app still looks like a template at the edges: every page has the tab title "app",
a keyboard user must tab through the whole header to reach the content, the repository carries unused Vite template
assets, and the README describes none of the app. A final pass fixes these before the app is shown to anyone.

## What Changes

- Each page sets a browser tab title: "Transactions · PMAP", "Analytics · PMAP", "Admin · PMAP", "Transaction 42 · PMAP",
  "Page not found · PMAP", "Access denied · PMAP". The static title is "PMAP" and the page has a description and a theme colour.
- A "Skip to main content" link is the first focusable element of every page; the main area can take focus from it.
- A keyboard and accessibility review of the existing screens (focus order, names of controls, live regions,
  contrast tokens in both themes) with the defects it finds fixed.
- The not-found and access-denied pages get the same look as the other empty and error states.
- Dead code goes: `src/assets/hero.png`, `src/assets/vite.svg`, `public/icons.svg` and anything else unused.
- The README documents the app: scripts, structure, how features read state from the URL, how to run checks.
- A smoke test renders every route and checks its title, heading and landmark.

## Capabilities

### New Capabilities
- `page-titles`: the document title of every route and the static head metadata.

### Modified Capabilities
- `app-shell`: the skip link and the main landmark; the not-found page uses the shared state look.

## Impact

- Code: `index.html`, `src/app/RootLayout.tsx`, `src/app/pages.tsx`, a small title hook, page components that set titles,
  small accessibility fixes found in the review; removed template assets; `README.md`.
- Dependencies: none. No behaviour of data screens changes.
