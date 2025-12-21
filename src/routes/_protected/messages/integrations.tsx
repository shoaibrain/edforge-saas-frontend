/**
 * Redirect from old messages/integrations route to settings/integrations.
 * Integrations are now managed centrally in Settings.
 */
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/messages/integrations')({
    beforeLoad: () => {
        // Redirect to the new integrations location in Settings
        throw redirect({ to: '/settings/integrations' })
    },
    component: () => null,
})
