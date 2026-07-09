/**
 * Create Agreement Page (FB-2.9)
 *
 * Route: /finance/agreements/create (finance router basepath `/finance`).
 * Thin shell that wraps the AgreementCreateWizard with page layout + back
 * navigation, mirroring the bulk-generate page shell.
 */

import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import { useAppStore } from '../../../stores/app.store'
import { AgreementCreateWizard } from '../../../components/billing/agreements/AgreementCreateWizard'

export default function CreateAgreementPage() {
  const { t } = useTranslation('payments')
  const navigate = useNavigate()
  const schoolId = useAppStore((s) => s.activeSchoolId)

  if (!schoolId) {
    return (
      <div className="p-6 text-center text-sm text-[rgb(var(--text-tertiary))]">
        {t('agreement.selectSchool')}
      </div>
    )
  }

  return (
    <div className="w-full space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={() => navigate({ to: '/agreements' })}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
            {t('agreement.wizard.title')}
          </h1>
          <p className="mt-0.5 text-sm text-[rgb(var(--text-secondary))]">
            {t('agreement.wizard.description')}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] p-6">
        <AgreementCreateWizard
          schoolId={schoolId}
          onComplete={(agreementId) =>
            navigate({
              to: '/agreements/$agreementId',
              params: { agreementId },
            })
          }
          onCancel={() => navigate({ to: '/agreements' })}
        />
      </div>
    </div>
  )
}
