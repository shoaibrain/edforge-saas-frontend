/**
 * Ed-Fi Router Configuration
 *
 * Defines the internal routing for the Ed-Fi micro-frontend.
 * The Shell's AppShell handles all layout concerns (Header, Sidebar).
 */

import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
} from '@tanstack/react-router'
import { EdFiLayout } from './layouts/EdFiLayout'
import { SyncDashboard } from './components/sync/SyncDashboard'
import { ConnectionWizard } from './components/connection/ConnectionWizard'
import { DescriptorMapper } from './components/mapping/DescriptorMapper'
import { ErrorAggregator } from './components/errors/ErrorAggregator'

// ============================================================================
// ROOT ROUTE
// ============================================================================

const rootRoute = createRootRoute({
  component: () => (
    <EdFiLayout>
      <Outlet />
    </EdFiLayout>
  ),
})

// ============================================================================
// ROUTES
// ============================================================================

// Overview (Index) - Sync Dashboard
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: SyncDashboard,
})

// Connections
const connectionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/connections',
  component: ConnectionWizard,
})

// Descriptor Mapping
const mappingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/mapping',
  component: DescriptorMapper,
})

// Error Aggregator
const errorsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/errors',
  component: ErrorAggregator,
})

// ============================================================================
// ROUTE TREE
// ============================================================================

const routeTree = rootRoute.addChildren([
  indexRoute,
  connectionsRoute,
  mappingRoute,
  errorsRoute,
])

// ============================================================================
// CREATE ROUTER
// ============================================================================

export const router = createRouter({
  routeTree,
  basepath: '/edfi',
  defaultNotFoundComponent: () => null, // Shell handles 404 UI
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

