import '@testing-library/jest-dom'
import { server } from './mocks/server'

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))

// Reset handlers between tests so per-test overrides don't leak
afterEach(() => server.resetHandlers())

// Clean up after all tests
afterAll(() => server.close())
