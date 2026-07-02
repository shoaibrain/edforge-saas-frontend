/**
 * IemisExportDialog — the IEMiS Flash II monthly export, re-homed from a sub-tab
 * into a focused modal opened by the command bar's Export button. Same
 * computation + endpoint as before (the embedded IemisExportPanel); only the
 * entry point moved. Gated by the caller on the attendance:export permission.
 */

import { Modal } from '@edforge/ui'
import { IemisExportPanel } from '../IemisExportPanel'
import { useAcademicsI18n } from '../../../lib/i18n'

interface IemisExportDialogProps {
  open: boolean
  onClose: () => void
  schoolId: string
  academicYearId: string
}

export function IemisExportDialog({ open, onClose, schoolId, academicYearId }: IemisExportDialogProps) {
  const { t } = useAcademicsI18n()
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('iemisExport.title')}
      description={t('iemisExport.description')}
      size="2xl"
    >
      <IemisExportPanel schoolId={schoolId} academicYearId={academicYearId} embedded />
    </Modal>
  )
}
