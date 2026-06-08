/**
 * Account Settings Page
 * 
 * Manage personal information, profile photo, and contact details.
 * Integrated with backend Users API via TanStack Query.
 */

import { useState, useEffect, useCallback } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Mail,
  User,
  MapPin,
  Phone,
  Copy,
  Check
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@edforge/ui'
import { TextField, SelectField } from '@/components/forms/fields'
import { useAuthStore } from '@/stores/auth.store'
import { 
  userProfileSchema, 
  type UserProfileFormValues 
} from '@/schemas/person.schema'
import { getUserAvatar } from '@/lib/avatar'
import {
  SettingsPageHeader,
  SettingsSection,
  SettingsFormCard,
  SettingsSkeleton,
  SettingsDivider,
  UnsavedChangesBar,
  staggerChildren,
  fadeInUp,
} from '@/components/settings/SettingsShared'
import {
  usersService,
  type UpdateUserDto,
  type UserResponseDto,
} from '@/services/users.service'

// ============================================================================
// CONSTANTS
// ============================================================================

const COUNTRY_OPTIONS = [
  { value: '', label: 'Select country' },
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'IN', label: 'India' },
  { value: 'JP', label: 'Japan' },
  { value: 'MX', label: 'Mexico' },
  { value: 'BR', label: 'Brazil' },
  { value: 'NP', label: 'Nepal' },
]

const US_STATE_OPTIONS = [
  { value: '', label: 'Select state' },
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
]


// ============================================================================
// LOADING SKELETON
// ============================================================================

function AccountPageSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <SettingsSkeleton rows={5} showHeader />
    </div>
  )
}

// ============================================================================
// ERROR STATE
// ============================================================================

function AccountPageError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-12"
      >
        <div className="w-16 h-16 rounded-full bg-[rgb(var(--state-danger-bg)/0.18)]0/10 flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-[rgb(var(--state-danger-fg))]" />
        </div>
        <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-2">
          Failed to Load Profile
        </h2>
        <p className="text-sm text-[rgb(var(--text-tertiary))] text-center mb-6 max-w-sm">
          {error}
        </p>
        <Button variant="outline" onClick={onRetry}>
          Try Again
        </Button>
      </motion.div>
    </div>
  )
}

// ============================================================================
// AVATAR DISPLAY COMPONENT
// ============================================================================

interface AvatarUploadProps {
  avatarUrl: string
  displayName: string
}

function AvatarUpload({ avatarUrl, displayName }: AvatarUploadProps) {
  return (
    <div className="flex items-start gap-6">
      <div className="relative">
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-24 h-24 rounded-xl object-cover ring-2 ring-[rgb(var(--border-primary))]"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-lg font-semibold text-[rgb(var(--text-primary))] truncate">{displayName}</p>
      </div>
    </div>
  )
}


// ============================================================================
// COPY USER ID BUTTON
// ============================================================================

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="p-1 rounded hover:bg-[rgb(var(--background-tertiary))] transition-colors"
      title="Copy to clipboard"
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.div
            key="check"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
          >
            <Check className="w-3.5 h-3.5 text-[rgb(var(--state-success-fg))]" />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
          >
            <Copy className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))]" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AccountPage() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  // Fetch user profile from API
  const {
    data: userProfile,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<UserResponseDto>({
    queryKey: ['user', user?.id],
    queryFn: () => usersService.getUser(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  // Update user mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserDto) => usersService.updateUser(user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', user?.id] })
      toast.success('Profile updated successfully')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update profile')
    },
  })

  // Form setup
  const methods = useForm<UserProfileFormValues>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      displayName: '',
      email: '',
      phone: '',
      address: {
        street: '',
        street2: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      },
    },
  })

  const { handleSubmit, formState: { isDirty }, reset } = methods

  const handleReset = useCallback(() => {
    reset()
  }, [reset])

  // Update form when profile data loads
  useEffect(() => {
    if (userProfile) {
      reset({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        displayName: userProfile.displayName || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        address: {
          street: userProfile.address?.street || '',
          street2: userProfile.address?.street2 || '',
          city: userProfile.address?.city || '',
          state: userProfile.address?.state || '',
          postalCode: userProfile.address?.postalCode || '',
          country: userProfile.address?.country || '',
        },
      })
    } else if (user && !userProfile) {
      const nameParts = user.name?.split(' ') || []
      reset({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        displayName: '',
        email: user.email || '',
        phone: '',
        address: {
          street: '',
          street2: '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
        },
      })
    }
  }, [userProfile, user, reset])

  const onSubmit = async (data: UserProfileFormValues) => {
    const updateData: UpdateUserDto = {
      firstName: data.firstName,
      lastName: data.lastName,
      displayName: data.displayName || undefined,
      phone: data.phone || undefined,
      address: {
        street: data.address?.street || '',
        street2: data.address?.street2 || '',
        city: data.address?.city || '',
        state: data.address?.state || '',
        postalCode: data.address?.postalCode || '',
        country: data.address?.country || '',
      },
    }

    updateMutation.mutate(updateData)
  }

  // Computed values
  const avatarUrl = userProfile?.avatarUrl || getUserAvatar(
    userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : user?.name || 'User'
  )
  
  const displayName = userProfile?.displayName || 
    (userProfile ? `${userProfile.firstName} ${userProfile.lastName}`.trim() : '') || 
    userProfile?.email || 
    user?.name || 
    'User'
  
  const displayRole = userProfile?.globalRole || user?.globalRole || 'User'

  // Loading state
  if (isLoading) {
    return <AccountPageSkeleton />
  }

  // Error state
  if (isError && !userProfile) {
    return (
      <AccountPageError 
        error={error instanceof Error ? error.message : 'Failed to load profile'} 
        onRetry={() => refetch()} 
      />
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 pb-24">
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerChildren}
            className="space-y-8"
          >
            {/* Header */}
            <SettingsPageHeader
              title="My Account"
              description="Manage your personal information"
            />

            {/* Profile Photo Section */}
            <motion.div variants={fadeInUp}>
              <SettingsFormCard>
                <div className="flex items-start gap-6">
                  <AvatarUpload
                    avatarUrl={avatarUrl}
                    displayName={displayName}
                  />
                  
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm font-medium text-[rgb(var(--action-secondary-fg))] ">
                      {displayRole}
                    </span>
                    {userProfile?.status && (
                      <span className={`
                        inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                        ${userProfile.status === 'active' 
                          ? 'bg-[rgb(var(--state-success-bg)/0.18)] text-[rgb(var(--state-success-fg))] ' 
                          : userProfile.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-[rgb(var(--background-tertiary))]0/10 text-[rgb(var(--text-secondary))] '
                        }
                      `}>
                        {userProfile.status.charAt(0).toUpperCase() + userProfile.status.slice(1)}
                      </span>
                    )}
                  </div>
                </div>
              </SettingsFormCard>
            </motion.div>

            <SettingsDivider />

            {/* Personal Information Section */}
            <SettingsSection
              title="Personal Information"
              icon={User}
              description="Your name and identity"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField name="firstName" label="First Name" placeholder="Enter first name" required />
                <TextField name="lastName" label="Last Name" placeholder="Enter last name" required />
              </div>
              <TextField
                name="displayName"
                label="Display Name"
                placeholder="How you want to be called"
                helperText="This is how your name appears to others"
              />
            </SettingsSection>

            {/* Contact Information Section */}
            <SettingsSection
              title="Contact Information"
              icon={Mail}
              description="Email and phone details"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField 
                  name="email" 
                  label="Email" 
                  type="email" 
                  placeholder="email@example.com" 
                  icon={Mail}
                  disabled
                  helperText="Contact support to change your email"
                />
                <TextField 
                  name="phone" 
                  label="Phone Number" 
                  type="tel" 
                  placeholder="+1 555-123-4567" 
                  icon={Phone}
                  helperText="Include country code"
                />
              </div>
            </SettingsSection>

            {/* Address Section */}
            <SettingsSection
              title="Address"
              icon={MapPin}
              description="Your mailing address"
            >
              <div className="space-y-4">
                <TextField 
                  name="address.street" 
                  label="Street Address" 
                  placeholder="123 Main Street"
                  icon={MapPin}
                />
                <TextField 
                  name="address.street2" 
                  label="Apartment, Suite, etc." 
                  placeholder="Apt 4B (optional)"
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <TextField name="address.city" label="City" placeholder="San Francisco" />
                  <SelectField 
                    name="address.state" 
                    label="State / Province"
                    options={US_STATE_OPTIONS}
                  />
                  <TextField name="address.postalCode" label="Postal Code" placeholder="94102" />
                </div>
                <SelectField 
                  name="address.country" 
                  label="Country"
                  options={COUNTRY_OPTIONS}
                  className="max-w-xs"
                />
              </div>
            </SettingsSection>

            {/* Account Metadata */}
            {userProfile && (
              <>
                <SettingsDivider />
                <motion.div variants={fadeInUp} className="space-y-3">
                  <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Account Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm p-4 rounded-xl bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-primary))]">
                    <div className="space-y-1">
                      <span className="text-[rgb(var(--text-tertiary))]">User ID</span>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-xs text-[rgb(var(--text-secondary))] truncate" title={userProfile.userId}>
                          {userProfile.userId}
                        </p>
                        <CopyButton text={userProfile.userId} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[rgb(var(--text-tertiary))]">Created</span>
                      <p className="text-[rgb(var(--text-secondary))]">
                        {new Date(userProfile.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    {userProfile.lastLoginAt && (
                      <div className="space-y-1">
                        <span className="text-[rgb(var(--text-tertiary))]">Last Login</span>
                        <p className="text-[rgb(var(--text-secondary))]">
                          {new Date(userProfile.lastLoginAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <span className="text-[rgb(var(--text-tertiary))]">MFA Status</span>
                      <p className={`font-medium ${userProfile.mfaEnabled ? 'text-[rgb(var(--state-success-fg))] ' : 'text-[rgb(var(--text-secondary))]'}`}>
                        {userProfile.mfaEnabled ? 'Enabled' : 'Not enabled'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </motion.div>

          <UnsavedChangesBar
            isDirty={isDirty}
            onReset={handleReset}
            onSave={() => handleSubmit(onSubmit)()}
            isSaving={updateMutation.isPending}
          />
        </form>
      </FormProvider>
    </div>
  )
}
