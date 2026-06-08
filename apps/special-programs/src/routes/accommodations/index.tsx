/**
 * Accommodations Module
 *
 * Centralized accommodation registry for the Special Programs domain.
 * Ensures consistent support delivery across all classes and assessments.
 */

import { Settings, FileText, Users, BookOpen, ClipboardCheck, CheckCircle } from 'lucide-react'

export function AccommodationsModule() {
  return (
    <div className="min-h-full">
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[rgb(var(--state-info-bg)/0.18)] to-[rgb(var(--state-info-bg)/0.10)]">
              <Settings className="w-6 h-6 text-[rgb(var(--state-info-fg))]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Accommodations Registry</h1>
              <p className="text-text-secondary mt-1">
                Centralized accommodation catalog ensuring consistent support across all settings
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={FileText}
            label="Accommodation Types"
            value="48"
            accent="text-[rgb(var(--state-info-fg))]"
            bg="bg-[rgb(var(--state-info-bg)/0.18)]"
          />
          <StatCard
            icon={Users}
            label="Students Served"
            value="236"
            accent="text-[rgb(var(--state-info-fg))]"
            bg="bg-[rgb(var(--state-info-bg)/0.18)]"
          />
          <StatCard
            icon={BookOpen}
            label="Testing Accommodations"
            value="18"
            accent="text-[rgb(var(--state-success-fg))]"
            bg="bg-[rgb(var(--state-success-bg)/0.18)]"
          />
          <StatCard
            icon={ClipboardCheck}
            label="Classroom Accommodations"
            value="30"
            accent="text-amber-600 dark:text-amber-400"
            bg="bg-amber-500/10"
          />
        </div>

        {/* Product Description */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-[rgb(var(--state-info-bg)/0.18)]">
              <Settings className="w-5 h-5 text-[rgb(var(--state-info-fg))]" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Accommodation Catalog
              </h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                Define and manage accommodation types that can be assigned to students
                through IEPs or 504 plans. Accommodations are categorized for classroom
                instruction, testing, and behavioral support to ensure consistent
                implementation across all educational settings.
              </p>
              <ul className="text-sm text-text-secondary space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[rgb(var(--state-info-fg))]" />
                  <span>Standardized accommodation definitions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[rgb(var(--state-info-fg))]" />
                  <span>State testing eligibility mapping</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[rgb(var(--state-info-fg))]" />
                  <span>Teacher notification and implementation guidance</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CategoryCard
            title="Presentation"
            count={12}
            description="Read aloud, large print, audio, visual aids"
          />
          <CategoryCard
            title="Response"
            count={8}
            description="Scribe, speech-to-text, extended time"
          />
          <CategoryCard
            title="Setting"
            count={10}
            description="Separate location, preferential seating, reduced distractions"
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
  icon: typeof Settings
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

function CategoryCard({
  title,
  count,
  description,
}: {
  title: string
  count: number
  description: string
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

