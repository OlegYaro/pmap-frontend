const TABBABLE = 'a[href], button, input, select, textarea, summary, [tabindex]'

/**
 * Elements Tab would visit inside `root`, in document order: focusable and not disabled, hidden,
 * or taken out of the order with a negative tabindex. jsdom has no real Tab key, so tests read the
 * order from the DOM.
 */
export function tabOrder(root: ParentNode = document.body): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(TABBABLE)).filter(
    (el) =>
      !el.hasAttribute('disabled') &&
      !el.hasAttribute('hidden') &&
      !el.closest('[hidden], [inert], [aria-hidden="true"]') &&
      (el.tabIndex ?? 0) >= 0,
  )
}
