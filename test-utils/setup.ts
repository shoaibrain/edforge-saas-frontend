import '@testing-library/jest-dom'
import { server } from './mocks/server'

if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
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
