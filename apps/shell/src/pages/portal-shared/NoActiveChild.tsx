/**
 * NoActiveChild — Guard component for parent portal pages
 *
 * Renders when ParentPortalContext has no active child selected.
 * Replaces per-page duplicate null guards with a shared component.
 */

import { useTranslation } from '@edforge/i18n'

export function NoActiveChild() {
  const { t } = useTranslation('portal')

  return (
    <div className="min-h-72 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{
            background: 'var(--v2-info-bg)',
          }}
        >
          <svg
            className="w-7 h-7"
            style={{ color: 'var(--v2-info)' }}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
            />
          </svg>
        </div>
        <p
          className="text-sm font-medium"
          style={{ color: 'var(--v2-text-secondary)' }}
        >
          {t('empty.selectChild')}
        </p>
      </div>
    </div>
  )
}
