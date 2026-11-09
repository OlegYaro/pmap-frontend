# Design

## Context

The route renders a placeholder from `src/app/pages.tsx`. `GET /transactions/{id}` returns the same
`TransactionResponse` as the list (all fields, `attributes`, `updated_at`); `pmap-backend` answers 404 "Not found"
when Extraction has no such id. Formatting helpers (`formatPln`, `formatArea`, `formatIsoDate`, `orEmpty`),
`StatusBadge`, the territory name lookup (`useTerritoryOptions().nameOf`) and the shared `PageHeader`, `ErrorState`
and skeleton pieces exist. See proposal.md for the reason.

## Goals / Non-Goals

**Goals:**
- Every field of the response is readable on the page, nothing hidden but the raw attributes.
- Reuse the list's formatting and status rules so both screens agree.

**Non-Goals:**
- Editing, export, neighbouring-transaction navigation, a side sheet over the list.

## Decisions

- **A full page, not a side sheet.** The route already exists and a page works for direct links and Back. A sheet
  would need list state kept behind it.
- **Data:** `useTransaction(id)` is a `useQuery` keyed `['transactions', 'detail', id]`, `staleTime` 5 minutes, no
  retry on 404 (the shared retry policy already skips 4xx). The id is parsed from the route param with a strict
  positive-integer check; an invalid id never reaches the network and renders the not-found state.
- **Layout:** a responsive grid of cards (one column on a phone, two from `md`), each card a titled `<dl>` with
  label/value rows, so assistive technology reads term and value pairs. Prices card first. Price per m² reuses
  `pricePerM2` from `cells.ts`.
- **Status:** `StatusBadge` from the list is reused; a "Manual" badge appears when `attributes.source === 'manual'`.
- **Attributes:** a native `<details>`/`<summary>` ("Source attributes"), collapsed, rows sorted by key, null as a
  dash, other values stringified (objects as compact JSON). It is keyboard operable without extra code.
- **Back button:** if the entry has a history predecessor within the app (`location.key !== 'default'`) the button
  calls `navigate(-1)`, which restores the list entry with its URL and `pageCursors` state; otherwise it links to `/`.
- **Names:** powiat and gmina labels come from `nameOf`, rendered as `name (code)`, or just the code while loading.
- **States:** skeleton rows with a "Loading" status, `EmptyState`-style "Transaction not found" with a link to `/`,
  and `ErrorState` with Retry for other failures.

## Risks / Trade-offs

- [Unknown attribute keys or nested values] → stringified generically, never assumed to be flat.
- [`navigate(-1)` after a long detour could leave the app] → only used when the entry is not the first of the session; otherwise the link to `/`.
- [Territory names missing when `/territories` fails] → codes are shown, the page stays usable.
