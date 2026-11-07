# Design

## Context

Measured in a browser on real data: at 1280px the table is 1346px (address 280, price 132, status 135 and so on) in
a 1230px box; the content grid and the table box already stop the page from widening. At 360px the sticky header
(logo, "PMAP", two links, a labelled login button, the theme toggle) is 447px wide.

## Goals / Non-Goals

**Goals:**
- Eleven columns visible at 1280px; no page-level horizontal scroll at 360px.

**Non-Goals:**
- Hiding columns responsively, changing the sort, the filter panel or the backend.

## Decisions

- **Compact cells:** the shared cell and header padding goes from `px-3` to `px-2`, and the address cell max width
  from 16rem to 13rem; the full address stays in the `title` tooltip. This saves about 190px, more than the 116px
  missing at 1280px, so the columns have room for longer numbers.
- **Market labels:** add `rynekPierwotny` and `rynekWtorny` to `MARKET_TYPE_LABELS` (the map is only used for display
  now that the filter is gone). The Function labels are untouched: they also build the filter's choices.
- **Header:** the brand text gets `hidden sm:inline` and the link an `aria-label="PMAP"`; the login button's text
  becomes `sr-only sm:not-sr-only`; the bar's gaps shrink below `sm`. Nothing changes from `sm` up.
- **Verification:** a real browser at 1280, 900 and 360px (script measuring `scrollWidth` of the page, the table and
  its box), plus unit tests for the labels and the header classes.

## Risks / Trade-offs

- [Very long numbers could still overflow at 1280px] → the box scrolls sideways as a fallback.
- [An icon-only login button is less clear] → it keeps its accessible name and a visible label from `sm` up.
