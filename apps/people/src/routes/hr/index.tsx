/**
 * HR Administration Module
 *
 * Full HR functionality (payroll, professional development, performance reviews)
 * is not available in the initial production release. Staff and user management
 * remain accessible through the People module's Staff section.
 */

import { BriefcaseBusiness } from 'lucide-react'
import { ComingSoonBanner } from '@edforge/ui'

export function HRAdminModule() {
  return (
    <div className="min-h-full">
      {/* Page Header */}
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
              <BriefcaseBusiness className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                Human Resources
              </h1>
              <p className="text-text-secondary mt-1">
                Compensation, professional development, and performance management
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Content */}
      <div className="p-6 max-w-2xl mx-auto">
        <ComingSoonBanner
          variant="admin"
          title="HR Administration"
          description="Full HR capabilities are on the way. In the meantime, you can create and manage staff and users from the Staff section."
          features={[
            'Payroll processing and contract management',
            'Professional development and certification tracking',
            'Performance reviews and goal tracking',
          ]}
        />
      </div>
    </div>
  )
}

export default HRAdminModule
