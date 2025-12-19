
import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Mail, Camera } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TextField, PhoneField } from '@/components/forms/fields'
import { AddressSection } from '@/components/forms/sections'
import { useAuthStore } from '@/stores/auth.store'
import { profileUpdateSchema, type ProfileUpdateFormValues } from '@/schemas/person.schema'
import { getUserAvatar } from '@/lib/avatar'
import { SaveButton } from '@/components/settings/SettingsShared'

export const Route = createFileRoute('/_protected/settings/account')({
    component: AccountPage,
})

function AccountPage() {
    const user = useAuthStore((s) => s.user)
    const [isSaving, setIsSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [photoHovered, setPhotoHovered] = useState(false)

    const methods = useForm<ProfileUpdateFormValues>({
        resolver: zodResolver(profileUpdateSchema),
        defaultValues: {
            firstName: user?.name?.split(' ')[0] || '',
            lastName: user?.name?.split(' ').slice(1).join(' ') || '',
            email: user?.email || '',
            phone: '',
        },
    })

    const { handleSubmit, formState: { isDirty } } = methods

    const onSubmit = async (data: ProfileUpdateFormValues) => {
        setIsSaving(true)
        await new Promise((resolve) => setTimeout(resolve, 1500))
        console.log('Settings updated:', data)
        setIsSaving(false)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
    }

    const avatarUrl = getUserAvatar(user?.name || 'User')

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
                            <SaveButton isDirty={isDirty} isSaving={isSaving} saveSuccess={saveSuccess} />
                        </div>

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
                                        alt={user?.name}
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
                                    <p className="text-lg font-semibold text-[rgb(var(--text-primary))]">{user?.name}</p>
                                    <p className="text-sm text-teal-600 dark:text-cyan-400">{user?.globalRole}</p>
                                    <div className="flex items-center gap-2 mt-3">
                                        <Button variant="outline" size="sm">Upload Photo</Button>
                                        <Button variant="ghost" size="sm" className="text-[rgb(var(--text-tertiary))]">Remove</Button>
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
                                <TextField name="email" label="Email" type="email" placeholder="email@example.com" icon={Mail} />
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
                    </motion.div>
                </form>
            </FormProvider>
        </div>
    )
}
