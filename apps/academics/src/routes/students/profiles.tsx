/**
 * Student Profiles Module
 */

import { useAcademicsI18n } from '../../lib/i18n'

export function StudentProfilesModule() {
    const { t } = useAcademicsI18n()

    return (
        <div className="p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">{t('studentsModule.profiles.title')}</h2>
            <p className="text-text-secondary">
                {t('studentsModule.profiles.description')}
            </p>
        </div>
    )
}

export default StudentProfilesModule
