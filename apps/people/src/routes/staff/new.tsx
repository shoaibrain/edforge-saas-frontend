/**
 * Staff Creation Wizard Page
 *
 * Route: /staff/new
 * Renders the full-page StaffWizard component.
 */

import { useNavigate } from '@tanstack/react-router'
import { StaffWizard } from '../../components/staff'

export default function StaffNewPage() {
  const navigate = useNavigate()

  return (
    <StaffWizard
      onCancel={() => navigate({ to: '/staff' })}
      onSuccess={(staffId) => {
        navigate({ to: '/staff/$userId', params: { userId: staffId } })
      }}
    />
  )
}
