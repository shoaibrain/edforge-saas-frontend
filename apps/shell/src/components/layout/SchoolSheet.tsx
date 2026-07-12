/**
 * SchoolSheet — phone school switcher, opened from the app bar's school
 * subtitle. Minimal P1 surface: the visible-schools list with the active
 * check; search and create-school stay desktop-only (SchoolSwitcher) until
 * P2. Switching goes through the same useShell().setActiveSchool wrapper so
 * "last used" is recorded identically.
 */

import { Check } from 'lucide-react'
import { useTranslation } from '@edforge/i18n'
import { useAppStore } from '../../stores/app.store'
import { useShell } from '../../lib/shell-context'
import { useActiveSchool } from '../../hooks/useActiveSchool'
import { getSchoolAvatar } from '../../lib/avatar'
import { MobileSheet } from './MobileSheet'
import { cn } from '../../lib/utils'

export function SchoolSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { visibleSchools, isTenantAdmin } = useActiveSchool()
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const isTransitioning = useAppStore((s) => s.isSchoolTransitioning)
  const { setActiveSchool } = useShell()
  const { t: tNav } = useTranslation('nav')

  return (
    <MobileSheet open={open} onClose={onClose} ariaLabel={tNav('switchSchool')}>
      <div className="px-4 py-2.5">
        <span className="text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
          {isTenantAdmin ? 'All Schools' : 'Your Schools'}
        </span>
      </div>

      <div className="px-2 pb-2">
        {visibleSchools.map((school) => {
          const isSelected = school.id === activeSchoolId
          return (
            <button
              key={school.id}
              type="button"
              disabled={isTransitioning}
              onClick={() => {
                if (isTransitioning) return
                setActiveSchool(school.id)
                onClose()
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 min-h-12 rounded-xl transition-all duration-150',
                isTransitioning && 'opacity-60 pointer-events-none',
                isSelected && 'bg-[rgb(var(--action-primary-bg))]/10'
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-lg overflow-hidden flex-shrink-0',
                  isSelected
                    ? 'ring-2 ring-[rgb(var(--border-focus))]'
                    : 'ring-1 ring-[rgb(var(--border-primary))]'
                )}
              >
                <img
                  src={getSchoolAvatar(school.name, { size: 40 })}
                  alt={school.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p
                  className={cn(
                    'text-sm font-medium truncate',
                    isSelected
                      ? 'text-[rgb(var(--state-info-fg))] '
                      : 'text-[rgb(var(--text-primary))]'
                  )}
                >
                  {school.name}
                </p>
                <p className="text-xs text-[rgb(var(--text-tertiary))]">{school.code}</p>
              </div>
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-[rgb(var(--action-primary-bg))]  flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-[rgb(var(--action-primary-fg))]" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </MobileSheet>
  )
}
