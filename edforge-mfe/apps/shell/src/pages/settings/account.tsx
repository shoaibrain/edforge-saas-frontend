/**
 * Account Settings Page
 * 
 * Manage personal information, profile photo, and contact details.
 * Integrated with backend Users API via TanStack Query.
 */

import { useState, useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Mail, Camera, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@edforge/ui'
import { TextField, PhoneField } from '@/components/forms/fields'
import { AddressSection } from '@/components/forms/sections'
import { useAuthStore } from '@/stores/auth.store'
import { profileUpdateSchema, type ProfileUpdateFormValues } from '@/schemas/person.schema'
import { getUserAvatar } from '@/lib/avatar'
import { SaveButton } from '@/components/settings/SettingsShared'
import { usersService, type UpdateUserDto, type UserResponseDto } from '@/services/users.service'

// ============================================================================
// LOADING SKELETON
// ============================================================================

function AccountPageSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-32 bg-[rgb(var(--surface-tertiary))] rounded" />
            <div className="h-4 w-48 bg-[rgb(var(--surface-tertiary))] rounded mt-2" />
          </div>
          <div className="h-10 w-24 bg-[rgb(var(--surface-tertiary))] rounded" />
        </div>

        {/* Profile Photo Skeleton */}
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-[rgb(var(--surface-tertiary))] rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-32 bg-[rgb(var(--surface-tertiary))] rounded" />
            <div className="h-4 w-24 bg-[rgb(var(--surface-tertiary))] rounded" />
            <div className="flex gap-2 mt-3">
              <div className="h-8 w-28 bg-[rgb(var(--surface-tertiary))] rounded" />
              <div className="h-8 w-20 bg-[rgb(var(--surface-tertiary))] rounded" />
            </div>
          </div>
        </div>

        <div className="border-t border-[rgb(var(--border-primary))]" />

        {/* Form Fields Skeleton */}
        <div className="space-y-5">
          <div className="h-4 w-36 bg-[rgb(var(--surface-tertiary))] rounded" />
          <div className="grid grid-cols-2 gap-5">
            <div className="h-10 bg-[rgb(var(--surface-tertiary))] rounded" />
            <div className="h-10 bg-[rgb(var(--surface-tertiary))] rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// ERROR STATE
// ============================================================================

function AccountPageError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
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
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AccountPage() {
  const user = useAuthStore((s: { user: ReturnType<typeof useAuthStore.getState>['user'] }) => s.user)
  const queryClient = useQueryClient()
  
  const [photoHovered, setPhotoHovered] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

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
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })

  // Update user mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserDto) => usersService.updateUser(user!.id, data),
    onSuccess: (updatedUser) => {
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ['user', user?.id] })
      
      // Update auth store if name changed
      if (user && (updatedUser.firstName !== user.name?.split(' ')[0] || 
                   updatedUser.lastName !== user.name?.split(' ').slice(1).join(' '))) {
        // The auth store will be updated when the user re-authenticates or via a dedicated update
        console.log('[Account] Profile updated:', updatedUser)
      }
      
      setSaveSuccess(true)
      setSaveError(null)
      setTimeout(() => setSaveSuccess(false), 3000)
    },
    onError: (err: Error) => {
      setSaveError(err.message || 'Failed to update profile')
      setSaveSuccess(false)
    },
  })

  const methods = useForm<ProfileUpdateFormValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
  })

  const { handleSubmit, formState: { isDirty }, reset } = methods

  // Update form when profile data loads
  useEffect(() => {
    if (userProfile) {
      reset({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
      })
    } else if (user && !userProfile) {
      // Fallback to auth store data while loading
      reset({
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        phone: '',
      })
    }
  }, [userProfile, user, reset])

  const onSubmit = async (data: ProfileUpdateFormValues) => {
    setSaveError(null)
    
    const updateData: UpdateUserDto = {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || undefined,
    }
    
    updateMutation.mutate(updateData)
  }

  // Get avatar URL from profile or fallback
  const avatarUrl = userProfile?.avatarUrl || getUserAvatar(
    userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : user?.name || 'User'
  )
  
  const displayName = userProfile 
    ? `${userProfile.firstName} ${userProfile.lastName}`.trim() || userProfile.email
    : user?.name || 'User'
  
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
    <div className="max-w-3xl mx-auto px-6 py-8">
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">My Account</h1>
                <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
                  Manage your personal information
                </p>
              </div>
              <SaveButton 
                isDirty={isDirty} 
                isSaving={updateMutation.isPending} 
                saveSuccess={saveSuccess} 
              />
            </div>

            {/* Success/Error Messages */}
            {saveSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">Profile updated successfully</span>
              </motion.div>
            )}

            {saveError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500"
              >
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{saveError}</span>
              </motion.div>
            )}

            {/* Profile Photo + Name */}
            <div className="space-y-6">
              <div className="flex items-start gap-6">
                <motion.div
                  onMouseEnter={() => setPhotoHovered(true)}
                  onMouseLeave={() => setPhotoHovered(false)}
                  className="relative group cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-20 h-20 rounded-xl object-cover ring-2 ring-[rgb(var(--border-primary))] group-hover:ring-teal-500/50 transition-all"
                  />
                  <motion.div
                    initial={false}
                    animate={{ opacity: photoHovered ? 1 : 0 }}
                    className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50"
                  >
                    <Camera className="w-5 h-5 text-white" />
                  </motion.div>
                </motion.div>

                <div className="flex-1 space-y-1">
                  <p className="text-lg font-semibold text-[rgb(var(--text-primary))]">{displayName}</p>
                  <p className="text-sm text-teal-600 dark:text-cyan-400">{displayRole}</p>
                  {userProfile?.status && (
                    <span className={`
                      inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                      ${userProfile.status === 'active' 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : userProfile.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                      }
                    `}>
                      {userProfile.status.charAt(0).toUpperCase() + userProfile.status.slice(1)}
                    </span>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <Button variant="outline" size="sm" type="button">Upload Photo</Button>
                    <Button variant="ghost" size="sm" type="button" className="text-[rgb(var(--text-tertiary))]">Remove</Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[rgb(var(--border-primary))]" />

            {/* Personal Information */}
            <div className="space-y-5">
              <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Personal Information</h2>
              <div className="grid grid-cols-2 gap-5">
                <TextField name="firstName" label="First Name" placeholder="Enter first name" />
                <TextField name="lastName" label="Last Name" placeholder="Enter last name" />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[rgb(var(--border-primary))]" />

            {/* Contact Information */}
            <div className="space-y-5">
              <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Contact Information</h2>
              <div className="grid grid-cols-2 gap-5">
                <TextField 
                  name="email" 
                  label="Email" 
                  type="email" 
                  placeholder="email@example.com" 
                  icon={Mail}
                  disabled // Email cannot be changed directly
                />
                <PhoneField name="phone" label="Phone" placeholder="(555) 123-4567" />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[rgb(var(--border-primary))]" />

            {/* Address */}
            <div className="space-y-5">
              <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Address</h2>
              <AddressSection namePrefix="address" showHeader={false} />
            </div>

            {/* Account Metadata */}
            {userProfile && (
              <>
                <div className="border-t border-[rgb(var(--border-primary))]" />
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Account Details</h2>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-[rgb(var(--text-tertiary))]">User ID:</span>
                      <p className="font-mono text-[rgb(var(--text-secondary))] truncate" title={userProfile.userId}>
                        {userProfile.userId}
                      </p>
                    </div>
                    <div>
                      <span className="text-[rgb(var(--text-tertiary))]">Created:</span>
                      <p className="text-[rgb(var(--text-secondary))]">
                        {new Date(userProfile.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {userProfile.lastLoginAt && (
                      <div>
                        <span className="text-[rgb(var(--text-tertiary))]">Last Login:</span>
                        <p className="text-[rgb(var(--text-secondary))]">
                          {new Date(userProfile.lastLoginAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-[rgb(var(--text-tertiary))]">MFA Enabled:</span>
                      <p className="text-[rgb(var(--text-secondary))]">
                        {userProfile.mfaEnabled ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </form>
      </FormProvider>
    </div>
  )
}
