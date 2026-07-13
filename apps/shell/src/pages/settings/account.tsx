/**
 * Account Settings Page
 *
 * Manage personal information, profile photo, and contact details.
 * Integrated with backend Users API via TanStack Query.
 */

import { useEffect, useCallback, type ReactNode } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Mail, User, MapPin, Phone, type LucideIcon } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '@edforge/i18n'
import {
  Button,
  PageShell,
  Card,
  CardContent,
  SectionCard,
  StatusBadge,
  Avatar,
  Heading,
  Text,
} from '@edforge/ui'
import { TextField, SelectField } from '@/components/forms/fields'
import { useAuthStore } from '@/stores/auth.store'
import {
  userProfileSchema,
  type UserProfileFormValues,
} from '@/schemas/person.schema'
import { getUserAvatar } from '@/lib/avatar'
import {
  SettingsSkeleton,
  UnsavedChangesBar,
  staggerChildren,
  fadeInUp,
} from '@/components/settings/SettingsShared'
import {
  DescriptionList,
  type DescriptionListItem,
} from '@/components/settings/DescriptionList'
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
// SECTION TITLE — icon chip + label for SectionCard headers
// ============================================================================

function SectionTitle({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))]">
        <Icon className="h-4 w-4" />
      </span>
      <span>{children}</span>
    </span>
  )
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function AccountPageSkeleton() {
  return (
    <PageShell as="div" variant="settings" className="max-w-6xl">
      <SettingsSkeleton rows={5} showHeader />
    </PageShell>
  )
}

// ============================================================================
// ERROR STATE
// ============================================================================

function AccountPageError({ error, onRetry }: { error: string; onRetry: () => void }) {
  const { t } = useTranslation('settings')

  return (
    <PageShell as="div" variant="settings" className="max-w-6xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-12"
      >
        <div className="w-16 h-16 rounded-full bg-[rgb(var(--state-danger-bg)/0.18)] flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-[rgb(var(--state-danger-fg))]" />
        </div>
        <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-2">
          {t('account.error.loadTitle')}
        </h2>
        <p className="text-sm text-[rgb(var(--text-tertiary))] text-center mb-6 max-w-sm">
          {error}
        </p>
        <Button variant="outline" onClick={onRetry}>
          {t('common.tryAgain')}
        </Button>
      </motion.div>
    </PageShell>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AccountPage() {
  const { t } = useTranslation('settings')
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
      toast.success(t('account.profileUpdated'))
    },
    onError: (err: Error) => {
      toast.error(err.message || t('account.profileUpdateFailed'))
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

  const {
    handleSubmit,
    formState: { isDirty },
    reset,
  } = methods

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
  const avatarUrl =
    userProfile?.avatarUrl ||
    getUserAvatar(
      userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : user?.name || t('account.fallbackUser')
    )

  const displayName =
    userProfile?.displayName ||
    (userProfile ? `${userProfile.firstName} ${userProfile.lastName}`.trim() : '') ||
    userProfile?.email ||
    user?.name ||
    t('account.fallbackUser')

  const displayRole = userProfile?.globalRole || user?.globalRole || t('account.fallbackUser')

  const countryOptions = COUNTRY_OPTIONS.map((option) =>
    option.value === '' ? { ...option, label: t('account.form.selectCountry') } : option
  )
  const stateOptions = US_STATE_OPTIONS.map((option) =>
    option.value === '' ? { ...option, label: t('account.form.selectState') } : option
  )

  // Map domain status -> semantic StatusBadge tone.
  const statusTone =
    userProfile?.status === 'active'
      ? 'success'
      : userProfile?.status === 'pending'
        ? 'warning'
        : 'neutral'

  // Loading state
  if (isLoading) {
    return <AccountPageSkeleton />
  }

  // Error state
  if (isError && !userProfile) {
    return (
      <AccountPageError
        error={error instanceof Error ? error.message : t('account.error.loadDescription')}
        onRetry={() => refetch()}
      />
    )
  }

  // Read-only identity metadata, surfaced in the rail.
  const accountDetailItems: DescriptionListItem[] = userProfile
    ? [
        {
          label: t('account.details.userId'),
          value: userProfile.userId,
          copyable: userProfile.userId,
          mono: true,
        },
        {
          label: t('account.details.created'),
          value: new Date(userProfile.createdAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        },
        ...(userProfile.lastLoginAt
          ? [
              {
                label: t('account.details.lastLogin'),
                value: new Date(userProfile.lastLoginAt).toLocaleString(),
              },
            ]
          : []),
        {
          label: t('account.details.mfa'),
          value: (
            <StatusBadge tone={userProfile.mfaEnabled ? 'success' : 'neutral'} dot>
              {userProfile.mfaEnabled ? t('account.mfa.enabled') : t('account.mfa.notEnabled')}
            </StatusBadge>
          ),
        },
      ]
    : []

  return (
    <PageShell as="div" variant="settings" className="max-w-6xl pb-24">
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerChildren}
            className="space-y-8"
          >
            {/* Two-zone layout: a sticky identity rail (read-only summary) beside
                the editable profile canvas. Collapses to one column below lg. */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Identity rail */}
              <motion.div variants={fadeInUp} className="lg:col-span-1 lg:sticky lg:top-6">
                <Card>
                  <CardContent className="space-y-5">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <Avatar
                        size="2xl"
                        shape="rounded"
                        src={avatarUrl}
                        name={displayName}
                        alt={displayName}
                      />
                      <div className="min-w-0 space-y-2">
                        <Heading level={2} variant="subsection" className="truncate">
                          {displayName}
                        </Heading>
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          <StatusBadge tone="info">{displayRole}</StatusBadge>
                          {userProfile?.status && (
                            <StatusBadge tone={statusTone} dot>
                              {userProfile.status.charAt(0).toUpperCase() +
                                userProfile.status.slice(1)}
                            </StatusBadge>
                          )}
                        </div>
                      </div>
                    </div>

                    {userProfile && (
                      <div className="space-y-2 border-t border-[rgb(var(--border-tertiary))] pt-4">
                        <Text variant="label">{t('account.accountDetails')}</Text>
                        <DescriptionList layout="stacked" items={accountDetailItems} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Editable canvas */}
              <motion.div variants={fadeInUp} className="lg:col-span-2 space-y-6">
                <SectionCard
                  title={<SectionTitle icon={User}>{t('account.personalInfo')}</SectionTitle>}
                  description={t('account.sections.personalDescription')}
                  contentClassName="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TextField name="firstName" label={t('account.firstName')} placeholder={t('account.form.firstNamePlaceholder')} required />
                    <TextField name="lastName" label={t('account.lastName')} placeholder={t('account.form.lastNamePlaceholder')} required />
                  </div>
                  <TextField
                    name="displayName"
                    label={t('account.displayName')}
                    placeholder={t('account.form.displayNamePlaceholder')}
                    helperText={t('account.form.displayNameHelp')}
                  />
                </SectionCard>

                <SectionCard
                  title={<SectionTitle icon={Mail}>{t('account.sections.contactTitle')}</SectionTitle>}
                  description={t('account.sections.contactDescription')}
                  contentClassName="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TextField
                      name="email"
                      label={t('account.email')}
                      type="email"
                      placeholder={t('account.form.emailPlaceholder')}
                      icon={Mail}
                      disabled
                      helperText={t('account.form.emailHelp')}
                    />
                    <TextField
                      name="phone"
                      label={t('account.phone')}
                      type="tel"
                      placeholder={t('account.form.phonePlaceholder')}
                      icon={Phone}
                      helperText={t('account.form.phoneHelp')}
                    />
                  </div>
                </SectionCard>

                <SectionCard
                  title={<SectionTitle icon={MapPin}>{t('account.address')}</SectionTitle>}
                  description={t('account.sections.addressDescription')}
                  className="overflow-visible"
                  contentClassName="space-y-4"
                >
                  <TextField
                    name="address.street"
                    label={t('account.street')}
                    placeholder={t('account.form.streetPlaceholder')}
                    icon={MapPin}
                  />
                  <TextField
                    name="address.street2"
                    label={t('account.street2')}
                    placeholder={t('account.form.street2Placeholder')}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <TextField name="address.city" label={t('account.city')} placeholder={t('account.form.cityPlaceholder')} />
                    <SelectField
                      name="address.state"
                      label={t('account.state')}
                      options={stateOptions}
                    />
                    <TextField name="address.postalCode" label={t('account.postalCode')} placeholder={t('account.form.postalCodePlaceholder')} />
                  </div>
                  <SelectField
                    name="address.country"
                    label={t('account.country')}
                    options={countryOptions}
                    className="w-full sm:max-w-xs"
                  />
                </SectionCard>
              </motion.div>
            </div>
          </motion.div>

          <UnsavedChangesBar
            isDirty={isDirty}
            onReset={handleReset}
            onSave={() => handleSubmit(onSubmit)()}
            isSaving={updateMutation.isPending}
          />
        </form>
      </FormProvider>
    </PageShell>
  )
}
