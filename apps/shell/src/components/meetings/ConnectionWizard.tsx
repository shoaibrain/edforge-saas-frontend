/**
 * Connection Wizard Modal
 * 
 * A multi-step wizard for connecting meeting platform integrations.
 * Steps: Select Platform → Review Permissions → Connect → Success
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Shield,
  Loader2,
  AlertCircle,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { useIntegrationsStore, type WizardStep } from '../../stores/integrations.store'
import {
  MEETING_PLATFORMS,
  getVideoPlatforms,
  getCalendarPlatforms,
  type MeetingPlatformId,
} from '../../lib/meeting-integrations'
import { PlatformLogo } from './PlatformLogo'

// ============================================================================
// STEP COMPONENTS
// ============================================================================

/**
 * Step 1: Platform Selection
 */
function PlatformSelectStep() {
  const { setSelectedPlatform, setWizardStep, connectedIntegrations } = useIntegrationsStore()
  const videoPlatforms = getVideoPlatforms()
  const calendarPlatforms = getCalendarPlatforms()
  
  const handleSelect = (platformId: MeetingPlatformId) => {
    setSelectedPlatform(platformId)
    setWizardStep('permissions')
  }
  
  const isConnected = (platformId: MeetingPlatformId) =>
    connectedIntegrations.some((i) => i.platformId === platformId && i.status === 'connected')
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
          Choose a platform to connect
        </h2>
        <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">
          Select a video conferencing or calendar service to integrate with EdForge
        </p>
      </div>
      
      {/* Video Platforms */}
      <div>
        <h3 className="text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider mb-3">
          Video Conferencing
        </h3>
        <div className="grid gap-3">
          {videoPlatforms.map((platform) => {
            const connected = isConnected(platform.id)
            return (
              <button
                key={platform.id}
                onClick={() => !connected && handleSelect(platform.id)}
                disabled={connected}
                className={`
                  group flex items-center gap-4 p-4 rounded-xl border text-left w-full
                  transition-all duration-200
                  ${connected
                    ? 'bg-[rgb(var(--surface-tertiary))] border-[rgb(var(--border-secondary))] cursor-not-allowed opacity-60'
                    : 'bg-[rgb(var(--surface-secondary))] border-[rgb(var(--border-primary))] hover:border-[rgb(var(--border-tertiary))] hover:shadow-md cursor-pointer'
                  }
                `}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${platform.bgColor}`}>
                  <PlatformLogo platformId={platform.id} size={28} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[rgb(var(--text-primary))]">
                      {platform.name}
                    </span>
                    {connected && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-aqua-400/15 text-aqua-700 dark:text-aqua-400">
                        Connected
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-[rgb(var(--text-secondary))]">
                    {platform.description}
                  </span>
                </div>
                {!connected && (
                  <ChevronRight className="w-5 h-5 text-[rgb(var(--text-tertiary))] opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Calendar Platforms */}
      <div>
        <h3 className="text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider mb-3">
          Calendar Services
        </h3>
        <div className="grid gap-3">
          {calendarPlatforms.map((platform) => {
            const connected = isConnected(platform.id)
            return (
              <button
                key={platform.id}
                onClick={() => !connected && handleSelect(platform.id)}
                disabled={connected}
                className={`
                  group flex items-center gap-4 p-4 rounded-xl border text-left w-full
                  transition-all duration-200
                  ${connected
                    ? 'bg-[rgb(var(--surface-tertiary))] border-[rgb(var(--border-secondary))] cursor-not-allowed opacity-60'
                    : 'bg-[rgb(var(--surface-secondary))] border-[rgb(var(--border-primary))] hover:border-[rgb(var(--border-tertiary))] hover:shadow-md cursor-pointer'
                  }
                `}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${platform.bgColor}`}>
                  <PlatformLogo platformId={platform.id} size={28} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[rgb(var(--text-primary))]">
                      {platform.name}
                    </span>
                    {connected && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-aqua-400/15 text-aqua-700 dark:text-aqua-400">
                        Connected
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-[rgb(var(--text-secondary))]">
                    {platform.description}
                  </span>
                </div>
                {!connected && (
                  <ChevronRight className="w-5 h-5 text-[rgb(var(--text-tertiary))] opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/**
 * Step 2: Permissions Review
 */
function PermissionsStep() {
  const { selectedPlatform, setWizardStep, connectIntegration } = useIntegrationsStore()
  const [email, setEmail] = useState('')
  
  if (!selectedPlatform) return null
  
  const platform = MEETING_PLATFORMS[selectedPlatform]
  
  const handleConnect = () => {
    // Simulate OAuth flow
    const mockEmail = email || `admin@school.edu`
    connectIntegration(selectedPlatform, mockEmail)
  }
  
  return (
    <div className="space-y-6">
      {/* Platform Header */}
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${platform.bgColor}`}>
          <PlatformLogo platformId={platform.id} size={32} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
            Connect {platform.name}
          </h2>
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            Review the permissions and connect your account
          </p>
        </div>
      </div>
      
      {/* Description */}
      <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed">
        {platform.longDescription}
      </p>
      
      {/* Features */}
      <div>
        <h3 className="text-sm font-medium text-[rgb(var(--text-primary))] mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-golden-500" />
          What you'll get
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {platform.features.map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))]"
            >
              <Check className="w-4 h-4 text-aqua-600 dark:text-aqua-400 flex-shrink-0" />
              {feature}
            </div>
          ))}
        </div>
      </div>
      
      {/* Permissions */}
      <div className="p-4 rounded-xl bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-secondary))]">
        <h3 className="text-sm font-medium text-[rgb(var(--text-primary))] mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
          Permissions required
        </h3>
        <ul className="space-y-2">
          {platform.permissions.map((permission) => (
            <li
              key={permission}
              className="flex items-start gap-2 text-sm text-[rgb(var(--text-secondary))]"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--text-tertiary))] mt-2 flex-shrink-0" />
              {permission}
            </li>
          ))}
        </ul>
      </div>
      
      {/* Demo Email Input (for mock flow) */}
      <div>
        <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
          Account email (for demo)
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@school.edu"
          className="w-full px-4 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:focus:ring-cyan-500/20 focus:border-teal-500 dark:focus:border-cyan-500"
        />
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => setWizardStep('select')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--interactive-hover))] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={handleConnect}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 dark:bg-cyan-600 text-white font-medium hover:bg-teal-700 dark:hover:bg-cyan-700 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Connect with {platform.name}
        </button>
      </div>
    </div>
  )
}

/**
 * Step 3: Connecting (Loading)
 */
function ConnectingStep() {
  const { selectedPlatform } = useIntegrationsStore()
  
  if (!selectedPlatform) return null
  
  const platform = MEETING_PLATFORMS[selectedPlatform]
  
  return (
    <div className="py-12 text-center">
      <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center ${platform.bgColor} mb-6`}>
        <PlatformLogo platformId={platform.id} size={40} />
      </div>
      
      <div className="flex items-center justify-center gap-3 mb-4">
        <Loader2 className="w-5 h-5 animate-spin text-teal-600 dark:text-cyan-400" />
        <span className="text-lg font-medium text-[rgb(var(--text-primary))]">
          Connecting to {platform.name}...
        </span>
      </div>
      
      <p className="text-sm text-[rgb(var(--text-secondary))]">
        Please wait while we securely connect your account.
      </p>
    </div>
  )
}

/**
 * Step 4: Success
 */
function SuccessStep() {
  const { selectedPlatform, closeWizard, getIntegration } = useIntegrationsStore()
  
  if (!selectedPlatform) return null
  
  const platform = MEETING_PLATFORMS[selectedPlatform]
  const integration = getIntegration(selectedPlatform)
  
  return (
    <div className="py-8 text-center">
      {/* Success Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="w-20 h-20 mx-auto rounded-full bg-aqua-400/15 flex items-center justify-center mb-6"
      >
        <Check className="w-10 h-10 text-aqua-600 dark:text-aqua-400" />
      </motion.div>
      
      <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-2">
        Successfully connected!
      </h2>
      
      <p className="text-sm text-[rgb(var(--text-secondary))] mb-6">
        {platform.name} is now connected to EdForge
      </p>
      
      {/* Connected Account */}
      {integration && (
        <div className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-[rgb(var(--surface-tertiary))] mb-8">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${platform.bgColor}`}>
            <PlatformLogo platformId={platform.id} size={24} />
          </div>
          <div className="text-left">
            <p className="font-medium text-sm text-[rgb(var(--text-primary))]">
              {platform.name}
            </p>
            <p className="text-xs text-[rgb(var(--text-tertiary))]">
              {integration.accountEmail}
            </p>
          </div>
        </div>
      )}
      
      {/* What's Next */}
      <div className="text-left p-4 rounded-xl bg-teal-500/5 dark:bg-cyan-500/10 border border-teal-500/20 dark:border-cyan-500/20 mb-6">
        <h3 className="font-medium text-sm text-[rgb(var(--text-primary))] mb-2">
          What's next?
        </h3>
        <ul className="space-y-1.5 text-sm text-[rgb(var(--text-secondary))]">
          <li className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-teal-600 dark:text-cyan-400" />
            Schedule meetings directly from EdForge
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-teal-600 dark:text-cyan-400" />
            Join meetings with one click
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-teal-600 dark:text-cyan-400" />
            Sync your calendar automatically
          </li>
        </ul>
      </div>
      
      <button
        onClick={closeWizard}
        className="w-full px-6 py-3 rounded-xl bg-teal-600 dark:bg-cyan-600 text-white font-medium hover:bg-teal-700 dark:hover:bg-cyan-700 transition-colors"
      >
        Done
      </button>
    </div>
  )
}

/**
 * Error Step
 */
function ErrorStep() {
  const { selectedPlatform, setWizardStep, connectionError } = useIntegrationsStore()
  
  const platform = selectedPlatform ? MEETING_PLATFORMS[selectedPlatform] : null
  
  return (
    <div className="py-8 text-center">
      <div className="w-20 h-20 mx-auto rounded-full bg-rust-500/15 flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-rust-600 dark:text-rust-400" />
      </div>
      
      <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-2">
        Connection failed
      </h2>
      
      <p className="text-sm text-[rgb(var(--text-secondary))] mb-6">
        {connectionError || `We couldn't connect to ${platform?.name || 'the platform'}. Please try again.`}
      </p>
      
      <div className="flex items-center gap-3">
        <button
          onClick={() => setWizardStep('select')}
          className="flex-1 px-4 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--interactive-hover))] transition-colors"
        >
          Choose different platform
        </button>
        <button
          onClick={() => setWizardStep('permissions')}
          className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 dark:bg-cyan-600 text-white font-medium hover:bg-teal-700 dark:hover:bg-cyan-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN WIZARD COMPONENT
// ============================================================================

export function ConnectionWizard() {
  const { wizardOpen, wizardStep, closeWizard } = useIntegrationsStore()
  
  if (!wizardOpen) return null
  
  const steps: Record<WizardStep, React.ReactNode> = {
    select: <PlatformSelectStep />,
    permissions: <PermissionsStep />,
    connecting: <ConnectingStep />,
    success: <SuccessStep />,
    error: <ErrorStep />,
  }
  
  // Prevent closing during connection
  const canClose = wizardStep !== 'connecting'
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={canClose ? closeWizard : undefined}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-[rgb(var(--surface-primary))] border border-[rgb(var(--border-primary))] shadow-2xl"
        >
          {/* Close Button */}
          {canClose && (
            <button
              onClick={closeWizard}
              className="absolute top-4 right-4 p-2 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--interactive-hover))] transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          
          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={wizardStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {steps[wizardStep]}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

