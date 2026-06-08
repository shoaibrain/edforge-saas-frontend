/**
 * Accessibility Services Module
 *
 * ADA compliance and accessibility resource management for Special Programs.
 * Physical accessibility, assistive technology, and accessibility audits.
 */

import { Accessibility, Building2, Laptop, CheckCircle, ClipboardCheck, MapPin } from 'lucide-react'

export function AccessibilityModule() {
  return (
    <div className="min-h-full">
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[rgb(var(--state-info-bg)/0.18)] to-[rgb(var(--state-info-bg)/0.10)]">
              <Accessibility className="w-6 h-6 text-[rgb(var(--state-info-fg))]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Accessibility Services</h1>
              <p className="text-text-secondary mt-1">
                ADA compliance tracking, assistive technology inventory, and accessibility audits
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={Building2}
            label="Accessible Rooms"
            value="32"
            accent="text-[rgb(var(--state-info-fg))]"
            bg="bg-[rgb(var(--state-info-bg)/0.18)]"
          />
          <StatCard
            icon={Laptop}
            label="AT Devices"
            value="87"
            accent="text-[rgb(var(--state-info-fg))]"
            bg="bg-[rgb(var(--state-info-bg)/0.18)]"
          />
          <StatCard
            icon={ClipboardCheck}
            label="Compliance Score"
            value="94%"
            accent="text-[rgb(var(--state-success-fg))]"
            bg="bg-[rgb(var(--state-success-bg)/0.18)]"
          />
          <StatCard
            icon={MapPin}
            label="Accessible Routes"
            value="12"
            accent="text-amber-600 dark:text-amber-400"
            bg="bg-amber-500/10"
          />
        </div>

        {/* Product Description */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-[rgb(var(--state-info-bg)/0.18)]">
              <Accessibility className="w-5 h-5 text-[rgb(var(--state-info-fg))]" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Accessibility Compliance
              </h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                Track ADA compliance across facilities and digital resources. Manage
                assistive technology inventory, coordinate accessibility accommodations,
                and maintain accessibility audit records. Ensures equal access for all
                students and staff with disabilities.
              </p>
              <ul className="text-sm text-text-secondary space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[rgb(var(--state-info-fg))]" />
                  <span>Facility accessibility mapping and tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[rgb(var(--state-info-fg))]" />
                  <span>Assistive technology inventory and assignments</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[rgb(var(--state-info-fg))]" />
                  <span>Digital accessibility compliance monitoring</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Resource Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ResourceCard
            title="Physical Access"
            description="Ramps, elevators, accessible restrooms, and designated parking"
            count={24}
          />
          <ResourceCard
            title="Assistive Technology"
            description="Screen readers, FM systems, magnification devices"
            count={87}
          />
          <ResourceCard
            title="Communication"
            description="Sign language interpreters, captioning services"
            count={15}
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  bg,
}: {
  icon: typeof Accessibility
  label: string
  value: string
  accent: string
  bg: string
}) {
  return (
    <div className="bg-surface-secondary rounded-xl border border-border-secondary p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`w-4 h-4 ${accent}`} />
        </div>
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="text-xl font-semibold text-text-primary">{value}</p>
        </div>
      </div>
    </div>
  )
}

function ResourceCard({
  title,
  description,
  count,
}: {
  title: string
  description: string
  count: number
}) {
  return (
    <div className="bg-surface-secondary rounded-xl border border-border-secondary p-5">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-text-primary">{title}</h4>
        <span className="text-sm text-[rgb(var(--state-info-fg))] bg-[rgb(var(--state-info-bg)/0.18)] px-2 py-0.5 rounded">
          {count}
        </span>
      </div>
      <p className="text-sm text-text-secondary">{description}</p>
    </div>
  )
}

