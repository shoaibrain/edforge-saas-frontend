/**
 * SignalBanner — Contextual trust-building banner below GPA hero
 *
 * Three levels: sage (no concerns), butter (some attention needed),
 * terracotta (significant concerns). Omitted when no meaningful signal.
 */

import { useTranslation } from '@edforge/i18n'

export type SignalLevel = 'good' | 'attention' | 'concern'

export interface SignalBannerProps {
  level: SignalLevel | null
  staggerIndex?: number
}

const LEVEL_STYLES: Record<SignalLevel, { bg: string; border: string; text: string }> = {
  good: {
    bg: 'var(--v2-success-bg)',
    border: 'var(--v2-success-border)',
    text: 'var(--v2-brand-primary)',
  },
  attention: {
    bg: 'var(--v2-warning-bg)',
    border: 'var(--v2-warning-border)',
    text: 'var(--v2-warning)',
  },
  concern: {
    bg: 'var(--v2-danger-bg)',
    border: 'var(--v2-danger-border)',
    text: 'var(--v2-danger)',
  },
}

export function SignalBanner({ level, staggerIndex = 2 }: SignalBannerProps) {
  const { t } = useTranslation('portal')

  if (!level) return null

  const styles = LEVEL_STYLES[level]
  const message = level === 'good'
    ? t('grades.nothingToWorry')
    : level === 'attention'
      ? 'A few items may need attention.'
      : 'Some grades need your attention.'

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm font-medium animate-fade-in stagger-${Math.min((staggerIndex ?? 2) + 1, 5)}`}
      style={{
        background: styles.bg,
        borderColor: styles.border,
        color: styles.text,
      }}
    >
      {message}
    </div>
  )
}
