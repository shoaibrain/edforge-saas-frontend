import '@testing-library/jest-dom'
import { server } from './mocks/server'

if (typeof window !== 'undefined' && !window.matchMedia) {
  // Width-aware stub: evaluates (min-width)/(max-width) queries against
  // window.innerWidth (jsdom default 1024 → components render their
  // desktop/tablet presentation unless a test installs its own mock).
  // Every other query (prefers-*, hover, …) stays false, as before.
  // Without this, useBreakpoint's min-width queries would all report false
  // and every breakpoint-aware component would render its PHONE branch in
  // unit tests.
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => {
      const min = query.match(/\(min-width:\s*(\d+(?:\.\d+)?)px\)/)
      const max = query.match(/\(max-width:\s*(\d+(?:\.\d+)?)px\)/)
      let matches = false
      if (min || max) {
        matches =
          (!min || window.innerWidth >= Number(min[1])) &&
          (!max || window.innerWidth <= Number(max[1]))
      }
      return {
        matches,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }
    },
  })
}

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  class TestResizeObserver {
    observe() {
      return undefined
    }

    unobserve() {
      return undefined
    }

    disconnect() {
      return undefined
    }
  }

  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: TestResizeObserver,
  })
  Object.defineProperty(globalThis, 'ResizeObserver', {
    writable: true,
    value: TestResizeObserver,
  })
}

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))

// Reset handlers between tests so per-test overrides don't leak
afterEach(() => server.resetHandlers())

// Clean up after all tests
afterAll(() => server.close())
