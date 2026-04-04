/**
 * useResolvedSettings — resolves tenant + school settings through the precedence chain.
 *
 * Precedence: School Configuration → School Entity → Tenant Workspace Settings → SYSTEM_DEFAULTS
 */

import { useMemo } from 'react'
import type { ResolvedSettings } from '@edforge/config/resolved-settings'
import { SYSTEM_DEFAULTS } from '@edforge/config/resolved-settings'
import type { WorkspaceSettings, School, SchoolConfiguration } from '@edforge/types'

interface UseResolvedSettingsInput {
  workspaceSettings: WorkspaceSettings['regional'] | null
  activeSchool: School | null
  schoolConfiguration: SchoolConfiguration | null
}

export function useResolvedSettings({
  workspaceSettings,
  activeSchool,
  schoolConfiguration,
}: UseResolvedSettingsInput): ResolvedSettings {
  return useMemo(() => {
    const ws = workspaceSettings
    const school = activeSchool
    const sc = schoolConfiguration

    return {
      currency:
        ws?.defaultCurrency ?? SYSTEM_DEFAULTS.currency,

      timezone:
        sc?.location?.timezone ??
        ws?.defaultTimezone ??
        SYSTEM_DEFAULTS.timezone,

      dateFormat:
        ws?.defaultDateFormat ?? SYSTEM_DEFAULTS.dateFormat,

      timeFormat:
        ws?.defaultTimeFormat ?? SYSTEM_DEFAULTS.timeFormat,

      calendarSystem:
        school?.calendarSystem ??
        ws?.defaultCalendarSystem ??
        SYSTEM_DEFAULTS.calendarSystem,

      enableDualDateDisplay:
        ws?.enableDualDateDisplay ?? SYSTEM_DEFAULTS.enableDualDateDisplay,

      numberFormat:
        ws?.defaultNumberFormat ?? SYSTEM_DEFAULTS.numberFormat,

      locale:
        ws?.defaultLocale ?? SYSTEM_DEFAULTS.locale,

      weekStartsOn:
        ws?.defaultWeekStartsOn ?? SYSTEM_DEFAULTS.weekStartsOn,
    }
  }, [workspaceSettings, activeSchool, schoolConfiguration])
}
