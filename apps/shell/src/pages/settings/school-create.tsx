/**
 * School Create Page
 *
 * Thin wrapper that renders the SchoolWizard at /settings/organization/schools/new.
 * Accepts an optional `leaId` search param to pre-select the district.
 */

import { useNavigate, useSearch } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { SchoolWizard } from '@/components/settings/school-wizard'
import { edOrgKeys } from '@/hooks/useEducationOrgs'

export default function SchoolCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { leaId } = useSearch({ strict: false }) as { leaId?: string }

  const handleCancel = () => {
    navigate({ to: '/settings/organization' })
  }

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: edOrgKeys.hierarchy() })
    navigate({ to: '/settings/organization' })
  }

  return (
    <SchoolWizard
      onCancel={handleCancel}
      onSuccess={handleSuccess}
      initialLeaId={leaId}
    />
  )
}
