/**
 * Notification Settings Page
 * 
 * Manage notification preferences across different channels.
 */

import { motion } from 'framer-motion'
import { useForm, FormProvider } from 'react-hook-form'
import { ToggleField } from '@/components/forms/fields'

export default function NotificationsPage() {
  const methods = useForm({
    defaultValues: {
      notifications: {
        email: true,
        push: true,
        sms: false,
        marketing: false,
      },
    },
  })

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <FormProvider {...methods}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-8"
        >
          <div>
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Notifications</h1>
            <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
              Manage how you receive updates and alerts
            </p>
          </div>

          <div className="space-y-1">
            <ToggleField name="notifications.email" label="Email Notifications" description="Receive updates via email" />
            <ToggleField name="notifications.push" label="Push Notifications" description="Get notified in your browser" />
            <ToggleField name="notifications.sms" label="SMS Notifications" description="Receive important alerts via text" />
            <ToggleField name="notifications.marketing" label="Marketing Emails" description="News about new features and updates" />
          </div>
        </motion.div>
      </FormProvider>
    </div>
  )
}
