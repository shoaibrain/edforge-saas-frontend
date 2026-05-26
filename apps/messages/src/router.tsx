/**
 * Messages Router Configuration
 * 
 * Defines the internal routing for the Messages micro-frontend.
 * The Shell's AppShell handles all layout concerns (Header, Sidebar).
 */

import { createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { MfeNotFoundBoundary } from '@edforge/ui';
import { Overview } from './routes/overview';
import InboxPage from './routes/inbox';
import AnnouncementsPage from './routes/announcements';
import MeetingsPage from './routes/meetings';
import { MessagesLayout } from './layouts/MessagesLayout';

const rootRoute = createRootRoute({
    component: () => (
        <MessagesLayout>
            <Outlet />
        </MessagesLayout>
    ),
});

// Overview (Index)
const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: Overview,
});

const inboxRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/inbox',
    component: InboxPage,
});

const announcementsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/announcements',
    component: AnnouncementsPage,
});

const meetingsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/meetings',
    component: MeetingsPage,
});

const calendarRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/calendar',
    component: () => null,
});

const notificationsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/notifications',
    component: () => null,
});

const settingsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/settings',
    component: () => null,
});

const routeTree = rootRoute.addChildren([
    indexRoute,
    inboxRoute,
    announcementsRoute,
    meetingsRoute,
    calendarRoute,
    notificationsRoute,
    settingsRoute,
]);

export const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
    basepath: '/messages',
    defaultNotFoundComponent: () => <MfeNotFoundBoundary mfe="messages" />, // M0.5 — was () => null which hid cross-MFE nav bugs
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}
