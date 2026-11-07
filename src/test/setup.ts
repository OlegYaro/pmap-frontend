import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { toast } from 'sonner'
import { afterEach, vi } from 'vitest'

// jsdom has no matchMedia; report "no match" (light system theme) unless a test replaces it.
vi.stubGlobal(
  'matchMedia',
  vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
)

// jsdom has no ResizeObserver; Radix popovers (tooltip) measure their anchor with it.
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
)

// jsdom lacks the pointer capture and scrolling methods Radix Select calls while it opens.
Element.prototype.hasPointerCapture = () => false
Element.prototype.releasePointerCapture = () => {}
Element.prototype.scrollIntoView = () => {}

afterEach(() => {
  cleanup()
  // Toasts live in a module-level store that outlives the rendered Toaster.
  toast.dismiss()
})
