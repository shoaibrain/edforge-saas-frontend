import { afterEach, beforeEach } from 'vitest'

/**
 * jsdom computes no layout, so `@tanstack/react-virtual` measures a 0×0 scroll
 * element (its `getRect` reads `offsetWidth`/`offsetHeight`, both 0 in jsdom) and
 * renders no rows. Call this inside a `describe` to give every element a non-zero
 * offset size for the duration of the suite, so the virtualizer renders a usable
 * window.
 *
 * Scoped via before/afterEach and restored afterwards — it does NOT mutate the
 * shared global setup, so it can't perturb other suites.
 */
export function mockListViewport(viewportHeight = 800, rowHeight = 56, width = 800): void {
  let prevHeight: PropertyDescriptor | undefined
  let prevWidth: PropertyDescriptor | undefined
  let prevGetRect: typeof Element.prototype.getBoundingClientRect

  beforeEach(() => {
    prevHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')
    prevWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')
    prevGetRect = Element.prototype.getBoundingClientRect
    // The scroll element's size comes from offset* (react-virtual's `getRect`).
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => viewportHeight })
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => width })
    // Row sizes come from getBoundingClientRect (react-virtual's `measureElement`,
    // since the ResizeObserver stub never fires). A fixed row height is enough for
    // the windowing assertions.
    Element.prototype.getBoundingClientRect = function (): DOMRect {
      return {
        width,
        height: rowHeight,
        top: 0,
        left: 0,
        right: width,
        bottom: rowHeight,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRect
    }
  })

  afterEach(() => {
    if (prevHeight) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', prevHeight)
    if (prevWidth) Object.defineProperty(HTMLElement.prototype, 'offsetWidth', prevWidth)
    Element.prototype.getBoundingClientRect = prevGetRect
  })
}
