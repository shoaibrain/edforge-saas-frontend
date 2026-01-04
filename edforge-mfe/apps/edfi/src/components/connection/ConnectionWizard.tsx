/**
 * Ed-Fi Connection Wizard
 *
 * Step-by-step UI for districts to input and validate ODS API Key & Secret.
 * This is a critical component for Ed-Fi Alliance certification.
 *
 * Steps:
 * 1. Enter ODS URL
 * 2. Input API Key & Secret
 * 3. Validate connection
 * 4. Select school year
 * 5. Confirm and save
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cloud,
  Key,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Shield,
  Globe,
} from 'lucide-react'
import { Button, Card, CardContent } from '@edforge/ui'

// ============================================================================
// TYPES
// ============================================================================

interface ConnectionData {
  odsUrl: string
  apiKey: string
  apiSecret: string
  schoolYear: string
}

type WizardStep = 'url' | 'credentials' | 'validate' | 'schoolYear' | 'confirm'

interface ValidationResult {
  isValid: boolean
  error?: string
  metadata?: {
    version: string
    schoolYears: string[]
    dataModelVersion: string
  }
}

// ============================================================================
// WIZARD STEPS CONFIG
// ============================================================================

const STEPS: { id: WizardStep; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'url', label: 'ODS URL', icon: Globe },
  { id: 'credentials', label: 'API Credentials', icon: Key },
  { id: 'validate', label: 'Validate', icon: Shield },
  { id: 'schoolYear', label: 'School Year', icon: Calendar },
  { id: 'confirm', label: 'Confirm', icon: CheckCircle },
]

// ============================================================================
// CONNECTION WIZARD COMPONENT
// ============================================================================

export function ConnectionWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>('url')
  const [connectionData, setConnectionData] = useState<ConnectionData>({
    odsUrl: '',
    apiKey: '',
    apiSecret: '',
    schoolYear: '',
  })
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep)

  const updateField = (field: keyof ConnectionData, value: string) => {
    setConnectionData((prev) => ({ ...prev, [field]: value }))
  }

  const handleValidate = async () => {
    setValidating(true)
    setValidationResult(null)

    // Simulate API validation
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock validation result
    const isValid = connectionData.odsUrl.includes('ed-fi') || connectionData.odsUrl.includes('localhost')
    
    setValidationResult({
      isValid,
      error: isValid ? undefined : 'Unable to connect to ODS. Please check your URL and credentials.',
      metadata: isValid
        ? {
            version: '7.2',
            schoolYears: ['2024-2025', '2023-2024', '2022-2023'],
            dataModelVersion: '5.1',
          }
        : undefined,
    })

    setValidating(false)

    if (isValid) {
      setTimeout(() => setCurrentStep('schoolYear'), 1000)
    }
  }

  const handleSubmit = () => {
    // Save connection and close wizard
    console.log('Saving connection:', connectionData)
    alert('Connection saved successfully!')
  }

  const goNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id)
    }
  }

  const goPrev = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
                  ${
                    index < currentStepIndex
                      ? 'bg-teal-500 border-teal-500 text-white'
                      : index === currentStepIndex
                      ? 'bg-teal-500/10 border-teal-500 text-teal-500'
                      : 'bg-surface-tertiary border-border-primary text-text-tertiary'
                  }
                `}
              >
                {index < currentStepIndex ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`
                    hidden sm:block w-12 h-0.5 mx-2 transition-colors duration-300
                    ${index < currentStepIndex ? 'bg-teal-500' : 'bg-border-primary'}
                  `}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {STEPS.map((step, index) => (
            <span
              key={step.id}
              className={`
                text-xs font-medium hidden sm:block
                ${index === currentStepIndex ? 'text-teal-500' : 'text-text-tertiary'}
              `}
            >
              {step.label}
            </span>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-8">
          <AnimatePresence mode="wait">
            {currentStep === 'url' && (
              <StepContent key="url" title="Enter ODS URL" description="Provide the Ed-Fi ODS API base URL">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      ODS Base URL
                    </label>
                    <input
                      type="url"
                      value={connectionData.odsUrl}
                      onChange={(e) => updateField('odsUrl', e.target.value)}
                      placeholder="https://api.ed-fi.org/v7.2/api"
                      className="input"
                    />
                    <p className="mt-2 text-sm text-text-tertiary">
                      Example: https://api.ed-fi.org/v7.2/api
                    </p>
                  </div>
                </div>
              </StepContent>
            )}

            {currentStep === 'credentials' && (
              <StepContent
                key="credentials"
                title="API Credentials"
                description="Enter your Ed-Fi API Key and Secret"
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      API Key
                    </label>
                    <input
                      type="text"
                      value={connectionData.apiKey}
                      onChange={(e) => updateField('apiKey', e.target.value)}
                      placeholder="RvcohKz9zHI4"
                      className="input font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      API Secret
                    </label>
                    <input
                      type="password"
                      value={connectionData.apiSecret}
                      onChange={(e) => updateField('apiSecret', e.target.value)}
                      placeholder="••••••••••••"
                      className="input font-mono"
                    />
                  </div>
                  <div className="p-4 rounded-xl bg-golden-500/10 border border-golden-500/20">
                    <p className="text-sm text-golden-600 dark:text-golden-400">
                      <strong>Security Notice:</strong> Credentials are encrypted in transit and at rest.
                      Never share your API secret.
                    </p>
                  </div>
                </div>
              </StepContent>
            )}

            {currentStep === 'validate' && (
              <StepContent
                key="validate"
                title="Validate Connection"
                description="Testing connection to Ed-Fi ODS"
              >
                <div className="text-center py-8">
                  {validating ? (
                    <div className="space-y-4">
                      <Loader2 className="w-16 h-16 text-teal-500 animate-spin mx-auto" />
                      <p className="text-text-secondary">Validating connection...</p>
                    </div>
                  ) : validationResult ? (
                    <div className="space-y-4">
                      {validationResult.isValid ? (
                        <>
                          <CheckCircle className="w-16 h-16 text-aqua-500 mx-auto" />
                          <h3 className="text-xl font-semibold text-text-primary">
                            Connection Successful!
                          </h3>
                          <div className="grid grid-cols-3 gap-4 mt-6 text-left">
                            <div className="p-4 rounded-xl bg-surface-tertiary">
                              <p className="text-xs text-text-tertiary uppercase">ODS Version</p>
                              <p className="text-lg font-semibold text-text-primary">
                                {validationResult.metadata?.version}
                              </p>
                            </div>
                            <div className="p-4 rounded-xl bg-surface-tertiary">
                              <p className="text-xs text-text-tertiary uppercase">Data Model</p>
                              <p className="text-lg font-semibold text-text-primary">
                                {validationResult.metadata?.dataModelVersion}
                              </p>
                            </div>
                            <div className="p-4 rounded-xl bg-surface-tertiary">
                              <p className="text-xs text-text-tertiary uppercase">School Years</p>
                              <p className="text-lg font-semibold text-text-primary">
                                {validationResult.metadata?.schoolYears?.length}
                              </p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-16 h-16 text-rust-500 mx-auto" />
                          <h3 className="text-xl font-semibold text-text-primary">
                            Connection Failed
                          </h3>
                          <p className="text-rust-500">{validationResult.error}</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Cloud className="w-16 h-16 text-teal-500/50 mx-auto" />
                      <p className="text-text-secondary">Click validate to test your connection</p>
                      <Button onClick={handleValidate} size="lg">
                        Validate Connection
                      </Button>
                    </div>
                  )}
                </div>
              </StepContent>
            )}

            {currentStep === 'schoolYear' && (
              <StepContent
                key="schoolYear"
                title="Select School Year"
                description="Choose the school year for data synchronization"
              >
                <div className="space-y-4">
                  {validationResult?.metadata?.schoolYears?.map((year) => (
                    <button
                      key={year}
                      onClick={() => updateField('schoolYear', year)}
                      className={`
                        w-full p-4 rounded-xl text-left transition-all duration-200
                        ${
                          connectionData.schoolYear === year
                            ? 'bg-teal-500/10 border-2 border-teal-500'
                            : 'bg-surface-tertiary border-2 border-transparent hover:border-border-primary'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Calendar
                            className={`w-5 h-5 ${
                              connectionData.schoolYear === year
                                ? 'text-teal-500'
                                : 'text-text-tertiary'
                            }`}
                          />
                          <span className="font-medium text-text-primary">{year}</span>
                        </div>
                        {connectionData.schoolYear === year && (
                          <CheckCircle className="w-5 h-5 text-teal-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </StepContent>
            )}

            {currentStep === 'confirm' && (
              <StepContent
                key="confirm"
                title="Confirm Connection"
                description="Review and save your Ed-Fi ODS connection"
              >
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-surface-tertiary space-y-4">
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">ODS URL</span>
                      <span className="font-mono text-text-primary">{connectionData.odsUrl}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">API Key</span>
                      <span className="font-mono text-text-primary">
                        {connectionData.apiKey.slice(0, 4)}...{connectionData.apiKey.slice(-4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">School Year</span>
                      <span className="font-medium text-text-primary">{connectionData.schoolYear}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-teal-600 dark:text-cyan-400">
                          Ready for Data Exchange
                        </p>
                        <p className="text-sm text-teal-700 dark:text-teal-300">
                          Your connection has been validated and is ready for Ed-Fi data synchronization.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </StepContent>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border-primary">
            <Button
              variant="ghost"
              onClick={goPrev}
              disabled={currentStepIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {currentStep === 'confirm' ? (
              <Button onClick={handleSubmit}>
                Save Connection
                <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            ) : currentStep === 'validate' ? (
              <Button
                onClick={goNext}
                disabled={!validationResult?.isValid}
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={goNext}
                disabled={
                  (currentStep === 'url' && !connectionData.odsUrl) ||
                  (currentStep === 'credentials' && (!connectionData.apiKey || !connectionData.apiSecret)) ||
                  (currentStep === 'schoolYear' && !connectionData.schoolYear)
                }
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// STEP CONTENT WRAPPER
// ============================================================================

interface StepContentProps {
  title: string
  description: string
  children: React.ReactNode
}

function StepContent({ title, description, children }: StepContentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-2xl font-bold text-text-primary mb-2">{title}</h2>
      <p className="text-text-secondary mb-8">{description}</p>
      {children}
    </motion.div>
  )
}

export default ConnectionWizard

