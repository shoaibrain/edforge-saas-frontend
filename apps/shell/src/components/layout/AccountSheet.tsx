/**
 * AccountSheet — the phone presentation of the avatar menu. Same content
 * contract as the desktop UserMenu popover (Header.tsx), composed from the
 * shared UserMenuContent pieces: identity → PREFERENCES → My Profile →
 * Settings → Sign out.
 */

import { useNavigate } from '@tanstack/react-router'
import { User, Settings, LogOut } from 'lucide-react'
import { Sheet } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import { useAuthStore } from '../../stores/auth.store'
import { UserIdentityCard, PreferencesRows, UserMenuRowBody } from './UserMenuContent'

export function AccountSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const { t: tNav } = useTranslation('nav')

  if (!user) return null

  const goToAccount = () => {
    onClose()
    navigate({ to: '/settings', search: { tab: 'account' } })
  }

  return (
    <Sheet open={open} onClose={onClose} ariaLabel={tNav('account')}>
      <UserIdentityCard user={user} />

      <div className="px-4 py-3 border-b border-[rgb(var(--border-secondary))]">
        <p className="px-1 mb-2 text-2xs font-bold uppercase tracking-wider text-[rgb(var(--text-tertiary))]">
          {tNav('preferences')}
        </p>
        <PreferencesRows layout="stacked" />
      </div>

      <div className="py-2">
        <button
          type="button"
          onClick={goToAccount}
          className="w-full flex items-center gap-3 px-4 py-3 min-h-12 transition-colors active:bg-[rgb(var(--background-tertiary))]"
        >
          <UserMenuRowBody
            icon={User}
            sigName="account"
            title={tNav('myProfile')}
            subtitle={tNav('viewEditProfile')}
          />
        </button>
        <button
          type="button"
          onClick={goToAccount}
          className="w-full flex items-center gap-3 px-4 py-3 min-h-12 transition-colors active:bg-[rgb(var(--background-tertiary))]"
        >
          <UserMenuRowBody
            icon={Settings}
            sigName="settings"
            title={tNav('settings')}
            subtitle={tNav('managePreferences')}
          />
        </button>
      </div>

      <div className="border-t border-[rgb(var(--border-secondary))] py-2">
        <button
          type="button"
          onClick={() => {
            onClose()
            logout()
          }}
          className="w-full flex items-center gap-3 px-4 py-3 min-h-12 transition-colors active:bg-rust-50 dark:active:bg-rust-900/20"
        >
          <UserMenuRowBody icon={LogOut} title={tNav('signOut')} danger />
        </button>
      </div>
    </Sheet>
  )
}
