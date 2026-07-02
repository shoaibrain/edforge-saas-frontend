import { formatGatewayLabel } from '@edforge/types'

type Translate = (key: string, options?: Record<string, unknown>) => string

/** Localized gateway label with a formatted-English fallback. */
export function formatPaymentGateway(gateway: string | undefined, t: Translate): string {
  if (!gateway) return t('invoiceDetail.paymentHistory.payment')
  const normalized = gateway.toLowerCase().replace(/[-\s]+/g, '_')
  const key =
    normalized === 'bank_transfer'
      ? 'bankTransfer'
      : normalized === 'connect_ips'
        ? 'connectips'
        : normalized
  return t(`gateway.${key}`, { defaultValue: formatGatewayLabel(gateway) })
}
