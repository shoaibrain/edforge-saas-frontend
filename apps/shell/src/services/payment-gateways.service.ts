/**
 * Payment Gateways Service
 *
 * API client for payment gateway configuration.
 * Admin-only: manages which gateways are enabled for a school.
 *
 * Security: Gateway credentials are stored server-side only.
 * The API returns masked values (****) for credential fields after save.
 */

import { apiGet, apiPut } from '../lib/api'
import type {
  PaymentGatewayPublicConfig,
  PaymentGatewayConfig,
  PaymentGateway,
  SaveGatewayConfigDto,
} from '@edforge/types'

/**
 * Get enabled gateways for a school (parent-facing, no credentials).
 */
export async function getEnabledGateways(
  schoolId: string
): Promise<PaymentGatewayPublicConfig[]> {
  return apiGet<PaymentGatewayPublicConfig[]>(
    `/finance/schools/${schoolId}/payment-gateways`
  )
}

/**
 * Get all gateway configs for a school (admin view, credentials masked).
 */
export async function getGatewayConfigs(
  schoolId: string
): Promise<PaymentGatewayConfig[]> {
  return apiGet<PaymentGatewayConfig[]>(
    `/finance/schools/${schoolId}/payment-gateways/admin`
  )
}

/**
 * Save (create/update) gateway configuration.
 * Credentials are sent to server and stored encrypted — never cached client-side.
 */
export async function saveGatewayConfig(
  schoolId: string,
  gateway: PaymentGateway,
  config: SaveGatewayConfigDto
): Promise<PaymentGatewayConfig> {
  return apiPut<PaymentGatewayConfig, SaveGatewayConfigDto>(
    `/finance/schools/${schoolId}/payment-gateways/${gateway}`,
    config
  )
}

export const paymentGatewaysService = {
  getEnabledGateways,
  getGatewayConfigs,
  saveGatewayConfig,
}
