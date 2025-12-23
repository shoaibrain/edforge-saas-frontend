/**
 * Messages Router Configuration
 * 
 * Defines the internal routing for the Messages micro-frontend.
 * The Shell's AppShell handles all layout concerns (Header, Sidebar).
 */

import { createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
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

// Placeholder routes (coming soon)
const calendarRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/calendar',
    component: () => (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Calendar</h1>
            <p className="text-[rgb(var(--text-secondary))] mt-2">Calendar integration coming soon...</p>
        </div>
    ),
});

const notificationsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/notifications',
    component: () => (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Notifications</h1>
            <p className="text-[rgb(var(--text-secondary))] mt-2">Notification settings coming soon...</p>
        </div>
    ),
});

const settingsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/settings',
    component: () => (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Settings</h1>
            <p className="text-[rgb(var(--text-secondary))] mt-2">Messaging settings coming soon...</p>
        </div>
    ),
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
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}
