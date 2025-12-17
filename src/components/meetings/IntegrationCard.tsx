/**
 * Integration Card Component
 * 
 * Displays a meeting platform integration with connection status
 * and actions (connect/manage/disconnect).
 */

import { motion } from 'framer-motion'
import {
  Check,
  Link as LinkIcon,
  Settings,
  Unlink,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import type { MeetingPlatform, ConnectedIntegration } from '@/lib/meeting-integrations'
import { formatLastSync } from '@/lib/meeting-integrations'
import { useIntegrationsStore } from '@/stores/integrations.store'
import { PlatformLogo } from './PlatformLogo'

// ============================================================================
// TYPES
// ============================================================================

interface IntegrationCardProps {
  platform: MeetingPlatform
  integration?: ConnectedIntegration
  index?: number
  onConnect?: () => void
  onManage?: () => void
  onDisconnect?: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function IntegrationCard({
  platform,
  integration,
  index = 0,
  onConnect,
  onManage,
  onDisconnect,
}: IntegrationCardProps) {
  const { refreshIntegration } = useIntegrationsStore()
  const isConnected = integration?.status === 'connected'
  const hasError = integration?.status === 'error'
  const isExpired = integration?.status === 'expired'
  
  const handleRefresh = async () => {
    await refreshIntegration(platform.id)
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`
        group relative rounded-2xl border overflow-hidden
        bg-[rgb(var(--surface-secondary))]
        transition-all duration-300
        ${isConnected 
          ? 'border-[rgb(var(--border-primary))] hover:border-[rgb(var(--border-tertiary))]' 
          : 'border-dashed border-[rgb(var(--border-secondary))] hover:border-[rgb(var(--border-primary))]'
        }
        hover:shadow-lg
      `}
    >
      {/* Connected Badge */}
      {isConnected && (
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-aqua-400/15 text-aqua-700 dark:text-aqua-400">
            <Check className="w-3 h-3" />
            <span className="text-xs font-medium">Connected</span>
          </div>
        </div>
      )}
      
      {/* Error/Expired Badge */}
      {(hasError || isExpired) && (
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-rust-500/15 text-rust-600 dark:text-rust-400">
            <AlertCircle className="w-3 h-3" />
            <span className="text-xs font-medium">
              {hasError ? 'Error' : 'Expired'}
            </span>
          </div>
        </div>
      )}
      
      <div className="p-6">
        {/* Platform Header */}
        <div className="flex items-start gap-4 mb-4">
          {/* Logo */}
          <div
            className={`
              w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0
              ${platform.bgColor}
              transition-transform duration-300 group-hover:scale-105
            `}
          >
            <PlatformLogo platformId={platform.id} size={32} />
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0 pr-16">
            <h3 className="font-semibold text-[rgb(var(--text-primary))] mb-1">
              {platform.name}
            </h3>
            <p className="text-sm text-[rgb(var(--text-secondary))] line-clamp-2">
              {platform.description}
            </p>
          </div>
        </div>
        
        {/* Connected Account Info */}
        {isConnected && integration && (
          <div className="mb-4 p-3 rounded-xl bg-[rgb(var(--surface-tertiary))]">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
                  {integration.accountEmail}
                </p>
                <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
                  Last synced: {formatLastSync(integration.lastSync)}
                </p>
              </div>
              <button
                onClick={handleRefresh}
                className="p-2 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--interactive-hover))] transition-colors"
                title="Refresh sync"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        
        {/* Features List (for unconnected) */}
        {!isConnected && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1.5">
              {platform.features.slice(0, 4).map((feature) => (
                <span
                  key={feature}
                  className="px-2 py-1 text-xs rounded-md bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-secondary))]"
                >
                  {feature}
                </span>
              ))}
              {platform.features.length > 4 && (
                <span className="px-2 py-1 text-xs rounded-md bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-tertiary))]">
                  +{platform.features.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <button
                onClick={onManage}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                  bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-primary))]
                  hover:bg-[rgb(var(--interactive-hover))] transition-colors
                  text-sm font-medium"
              >
                <Settings className="w-4 h-4" />
                Manage
              </button>
              <button
                onClick={onDisconnect}
                className="p-2.5 rounded-xl text-[rgb(var(--text-tertiary))]
                  hover:text-rust-600 dark:hover:text-rust-400
                  hover:bg-rust-500/10 transition-colors"
                title="Disconnect"
              >
                <Unlink className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onConnect}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                bg-teal-500/15 dark:bg-cyan-500/20 
                text-teal-700 dark:text-cyan-400
                hover:bg-teal-500/25 dark:hover:bg-cyan-500/30
                transition-colors text-sm font-medium"
            >
              <LinkIcon className="w-4 h-4" />
              Connect
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// COMPACT VARIANT
// ============================================================================

interface IntegrationCardCompactProps {
  platform: MeetingPlatform
  integration?: ConnectedIntegration
  onConnect?: () => void
}

export function IntegrationCardCompact({
  platform,
  integration,
  onConnect,
}: IntegrationCardCompactProps) {
  const isConnected = integration?.status === 'connected'
  
  return (
    <button
      onClick={isConnected ? undefined : onConnect}
      disabled={isConnected}
      className={`
        group flex items-center gap-3 p-3 rounded-xl border w-full text-left
        transition-all duration-200
        ${isConnected 
          ? 'bg-[rgb(var(--surface-secondary))] border-[rgb(var(--border-primary))] cursor-default' 
          : 'bg-[rgb(var(--surface-secondary))] border-dashed border-[rgb(var(--border-secondary))] hover:border-[rgb(var(--border-primary))] hover:shadow-md cursor-pointer'
        }
      `}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${platform.bgColor}`}>
        <PlatformLogo platformId={platform.id} size={24} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-[rgb(var(--text-primary))]">
          {platform.name}
        </p>
        {isConnected && integration ? (
          <p className="text-xs text-[rgb(var(--text-tertiary))] truncate">
            {integration.accountEmail}
          </p>
        ) : (
          <p className="text-xs text-[rgb(var(--text-tertiary))]">
            Click to connect
          </p>
        )}
      </div>
      
      {isConnected ? (
        <Check className="w-5 h-5 text-aqua-600 dark:text-aqua-400" />
      ) : (
        <ExternalLink className="w-4 h-4 text-[rgb(var(--text-tertiary))] opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  )
}

