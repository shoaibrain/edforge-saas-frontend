/**
 * Interventions Module
 *
 * MTSS/RTI intervention tracking for the Special Programs domain.
 * Progress monitoring, tier movement, and data-driven decision support.
 */

import { TrendingUp, Users, BarChart3, Target, ArrowUpCircle, Clock, Layers } from 'lucide-react'

export function InterventionsModule() {
  return (
    <div className="min-h-full">
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[rgb(var(--state-warning-bg)/0.18)] to-amber-500/20">
              <TrendingUp className="w-6 h-6 text-[rgb(var(--state-warning-fg))]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Interventions</h1>
              <p className="text-text-secondary mt-1">
                MTSS/RTI intervention tracking with progress monitoring and tier movement
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Tier Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={Layers}
            label="Tier 1 (Universal)"
            value="1,089"
            subtext="87%"
            accent="text-[rgb(var(--state-success-fg))]"
            bg="bg-[rgb(var(--state-success-bg)/0.18)]"
          />
          <StatCard
            icon={Users}
            label="Tier 2 (Targeted)"
            value="124"
            subtext="10%"
            accent="text-amber-600 dark:text-amber-400"
            bg="bg-amber-500/10"
          />
          <StatCard
            icon={Target}
            label="Tier 3 (Intensive)"
            value="34"
            subtext="3%"
            accent="text-[rgb(var(--state-danger-fg))]"
            bg="bg-[rgb(var(--state-danger-bg)/0.18)]"
          />
          <StatCard
            icon={ArrowUpCircle}
            label="Movement (MTD)"
            value="18"
            subtext="↑ Positive"
            accent="text-[rgb(var(--state-info-fg))]"
            bg="bg-[rgb(var(--state-info-bg)/0.18)]"
          />
        </div>

        {/* Product Description */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-[rgb(var(--state-warning-bg)/0.18)]">
              <TrendingUp className="w-5 h-5 text-[rgb(var(--state-warning-fg))]" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Multi-Tiered System of Supports
              </h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                Implement Response to Intervention (RTI) and MTSS frameworks with structured
                intervention tracking. Monitor student progress through regular assessments,
                analyze response data, and make data-driven tier movement decisions.
              </p>
              <ul className="text-sm text-text-secondary space-y-1">
                <li className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[rgb(var(--state-warning-fg))]" />
                  <span>Progress monitoring with visual trend charts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[rgb(var(--state-warning-fg))]" />
                  <span>Intervention fidelity tracking and documentation</span>
                </li>
                <li className="flex items-center gap-2">
                  <ArrowUpCircle className="w-4 h-4 text-[rgb(var(--state-warning-fg))]" />
                  <span>Team meeting support and tier movement recommendations</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Intervention Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AreaCard
            title="Academic Interventions"
            description="Reading, math, and writing support programs"
            tiers={[78, 12, 3]}
          />
          <AreaCard
            title="Behavioral Interventions"
            description="Social-emotional and behavioral support"
            tiers={[45, 8, 2]}
          />
        </div>

        {/* Placeholder */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-8 text-center">
          <TrendingUp className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <h4 className="text-lg font-medium text-text-primary mb-2">
            Intervention Dashboard
          </h4>
          <p className="text-text-secondary max-w-md mx-auto">
            View students receiving interventions by tier and domain. Access progress
            monitoring data and schedule intervention team meetings.
          </p>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  accent,
  bg,
}: {
  icon: typeof TrendingUp
  label: string
  value: string
  subtext?: string
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
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-semibold text-text-primary">{value}</p>
            {subtext && <span className={`text-sm ${accent}`}>{subtext}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

function AreaCard({
  title,
  description,
  tiers,
}: {
  title: string
  description: string
  tiers: number[]
}) {
  return (
    <div className="bg-surface-secondary rounded-xl border border-border-secondary p-5">
      <h4 className="font-medium text-text-primary mb-2">{title}</h4>
      <p className="text-sm text-text-secondary mb-4">{description}</p>
      <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[rgb(var(--state-success-fg))]" />
          <span className="text-text-tertiary">T2: {tiers[0]}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-text-tertiary">T2: {tiers[1]}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[rgb(var(--state-danger-fg))]" />
          <span className="text-text-tertiary">T3: {tiers[2]}</span>
        </span>
      </div>
    </div>
  )
}

