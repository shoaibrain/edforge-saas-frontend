export type Translate = (key: string, options?: Record<string, unknown>) => string

type AsyncJobOperation = 'statements' | 'receipts' | 'reminders' | 'adjustments' | 'voidPayments'

export function formatAsyncJobToast(
  t: Translate,
  operation: AsyncJobOperation,
  succeeded: number,
  skipped: number,
  failed: number,
): { tone: 'success' | 'error'; message: string } {
  if (failed === 0 && skipped === 0) {
    return {
      tone: 'success',
      message: t(`asyncJobs.toast.${operation}.success`, { count: succeeded }),
    }
  }

  if (succeeded === 0) {
    return {
      tone: 'error',
      message: t(`asyncJobs.toast.${operation}.none`, { failed, skipped }),
    }
  }

  const parts = [
    t(`asyncJobs.toast.${operation}.success`, { count: succeeded }),
    ...(skipped > 0 ? [t('asyncJobs.toast.skipped', { count: skipped })] : []),
    ...(failed > 0 ? [t('asyncJobs.toast.failed', { count: failed })] : []),
  ]

  return {
    tone: 'error',
    message: parts.join(' · '),
  }
}

export function formatKnownSkipReason(t: Translate, reason: string): string {
  if (reason === 'no receipt number') return t('asyncJobs.skip.noReceiptNumber')

  const notCompleted = /^not completed \((.+)\)$/.exec(reason)
  if (notCompleted) {
    const status = notCompleted[1]
    return t('asyncJobs.skip.notCompleted', {
      status: t(`status.${status}`, { defaultValue: status }),
    })
  }

  const notOutstanding = /^not outstanding \((.+)\)$/.exec(reason)
  if (notOutstanding) {
    const status = notOutstanding[1]
    return t('asyncJobs.skip.notOutstanding', {
      status: t(`status.${status}`, { defaultValue: status }),
    })
  }

  return reason
}

export function formatChannelLabel(t: Translate, channel: 'email' | 'sms' | 'both'): string {
  return t(`asyncJobs.common.channels.${channel}`)
}
