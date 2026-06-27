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
export function mockListViewport(height = 800, width = 800): void {
  let prevHeight: PropertyDescriptor | undefined
  let prevWidth: PropertyDescriptor | undefined

  beforeEach(() => {
    prevHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')
    prevWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => height })
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => width })
  })

  afterEach(() => {
    if (prevHeight) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', prevHeight)
    if (prevWidth) Object.defineProperty(HTMLElement.prototype, 'offsetWidth', prevWidth)
  })
}
