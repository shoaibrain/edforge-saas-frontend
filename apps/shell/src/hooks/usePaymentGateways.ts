/**
 * usePaymentGateways — TanStack Query hooks for gateway configuration
 *
 * Parent-facing: useEnabledGateways (public config, no credentials)
 * Admin-facing: useGatewayConfigs + useSaveGatewayConfig (credentials masked)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { PaymentGateway, SaveGatewayConfigDto } from '@edforge/types'
import {
  getEnabledGateways,
  getGatewayConfigs,
  saveGatewayConfig,
} from '../services/payment-gateways.service'

// ============================================================================
// QUERY KEY FACTORY
// ============================================================================

export const gatewayKeys = {
  all: ['gateways'] as const,
  enabled: (schoolId: string) => [...gatewayKeys.all, 'enabled', schoolId] as const,
  configs: (schoolId: string) => [...gatewayKeys.all, 'configs', schoolId] as const,
}

// ============================================================================
// QUERIES
// ============================================================================

/** Get public gateway list (for payment form — no credentials) */
export function useEnabledGateways(schoolId: string) {
  return useQuery({
    queryKey: gatewayKeys.enabled(schoolId),
    queryFn: () => getEnabledGateways(schoolId),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000, // 5 min — gateway config changes rarely
  })
}

/** Get full gateway configs (admin — credentials masked) */
export function useGatewayConfigs(schoolId: string) {
  return useQuery({
    queryKey: gatewayKeys.configs(schoolId),
    queryFn: () => getGatewayConfigs(schoolId),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  })
}

// ============================================================================
// MUTATIONS
// ============================================================================

export function useSaveGatewayConfig(schoolId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      gateway,
      config,
    }: {
      gateway: PaymentGateway
      config: SaveGatewayConfigDto
    }) => saveGatewayConfig(schoolId, gateway, config),
    onSuccess: () => {
      // Invalidate both public and admin views
      queryClient.invalidateQueries({ queryKey: gatewayKeys.all })
    },
  })
}
