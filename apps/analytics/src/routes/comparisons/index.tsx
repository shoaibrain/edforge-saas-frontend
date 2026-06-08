/**
 * Comparative Analysis Module
 *
 * Cross-school and year-over-year performance benchmarking for the Analytics domain.
 * Generate standardized comparison reports for board presentations and accreditation.
 */

import { 
  LineChart, 
  TrendingUp, 
  BarChart3, 
  School, 
  Calendar, 
  FileText, 
  Download,
  Filter,
  CheckCircle,
} from 'lucide-react'
import { Button } from '@edforge/ui'

export function ComparisonsModule() {
  return (
    <div className="min-h-full">
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[rgb(var(--state-info-bg)/0.18)] to-[rgb(var(--state-info-bg)/0.12)]">
                <LineChart className="w-6 h-6 text-[rgb(var(--state-info-fg))]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Comparative Analysis</h1>
                <p className="text-text-secondary mt-1">
                  Cross-school and year-over-year performance benchmarking
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={School}
            label="Schools Compared"
            value="5"
            accent="text-[rgb(var(--state-info-fg))]"
            bg="bg-[rgb(var(--state-info-bg)/0.18)]"
          />
          <StatCard
            icon={Calendar}
            label="Years Analyzed"
            value="3"
            accent="text-[rgb(var(--state-info-fg))]"
            bg="bg-[rgb(var(--state-info-bg)/0.18)]"
          />
          <StatCard
            icon={BarChart3}
            label="Metrics Tracked"
            value="24"
            accent="text-[rgb(var(--state-success-fg))]"
            bg="bg-[rgb(var(--state-success-bg)/0.18)]"
          />
          <StatCard
            icon={FileText}
            label="Reports Generated"
            value="156"
            accent="text-[rgb(var(--state-warning-fg))]"
            bg="bg-[rgb(var(--state-warning-bg)/0.18)]"
          />
        </div>

        {/* Product Description */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-[rgb(var(--state-info-bg)/0.18)]">
              <LineChart className="w-5 h-5 text-[rgb(var(--state-info-fg))]" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Performance Benchmarking
              </h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                Compare academic outcomes, attendance rates, and financial metrics across
                schools, grade levels, or time periods. Generate standardized comparison
                reports for board presentations, accreditation documentation, and strategic
                planning. Identify trends, outliers, and areas for improvement with visual
                analytics.
              </p>
              <ul className="text-sm text-text-secondary space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-violet-500" />
                  <span>Cross-school performance comparison dashboards</span>
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-violet-500" />
                  <span>Year-over-year trend analysis with growth indicators</span>
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-violet-500" />
                  <span>Board-ready report templates with auto-generated insights</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Comparison Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CategoryCard
            title="Academic Performance"
            description="GPA distributions, assessment scores, graduation rates"
            metrics={['Avg GPA', 'Pass Rate', 'Growth %']}
          />
          <CategoryCard
            title="Attendance & Engagement"
            description="Daily attendance, chronic absenteeism, participation"
            metrics={['ADA Rate', 'Chronic Abs', 'Engagement']}
          />
          <CategoryCard
            title="Financial Metrics"
            description="Per-pupil spending, revenue allocation, budget variance"
            metrics={['PPE', 'Revenue/Student', 'Variance']}
          />
        </div>

        {/* Placeholder Chart Area */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-8 text-center">
          <BarChart3 className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <h4 className="text-lg font-medium text-text-primary mb-2">
            Comparison Dashboard
          </h4>
          <p className="text-text-secondary max-w-md mx-auto">
            Select schools and metrics to generate interactive comparison charts.
            Drill down into specific grade levels or time periods for detailed analysis.
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
  accent,
  bg,
}: {
  icon: typeof LineChart
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
  description,
  metrics,
}: {
  title: string
  description: string
  metrics: string[]
}) {
  return (
    <div className="bg-surface-secondary rounded-xl border border-border-secondary p-5 hover:bg-surface-hover transition-colors cursor-pointer">
      <h4 className="font-medium text-text-primary mb-2">{title}</h4>
      <p className="text-sm text-text-secondary mb-4">{description}</p>
      <div className="flex flex-wrap gap-2">
        {metrics.map((metric) => (
          <span
            key={metric}
            className="text-xs px-2 py-1 rounded bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))]"
          >
            {metric}
          </span>
        ))}
      </div>
    </div>
  )
}

export default ComparisonsModule

