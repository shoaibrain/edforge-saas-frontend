/**
 * Custom Reports Module
 *
 * Ad-hoc report builder with drag-and-drop query builder for the Analytics domain.
 * Export to PDF, Excel, or connect to BI tools via API.
 */

import { 
  PieChart, 
  Database, 
  Filter, 
  Calendar, 
  Download, 
  Share2,
  Clock,
  CheckCircle,
  Layers,
  Table,
  FileSpreadsheet,
  FileText,
} from 'lucide-react'
import { Button } from '@edforge/ui'

export function CustomReportsModule() {
  return (
    <div className="min-h-full">
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20">
                <PieChart className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Custom Reports</h1>
                <p className="text-text-secondary mt-1">
                  Build ad-hoc reports with drag-and-drop query builder
                </p>
              </div>
            </div>
            <Button>
              <FileText className="w-4 h-4 mr-2" />
              New Report
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={FileText}
            label="Saved Reports"
            value="34"
            accent="text-pink-600 dark:text-pink-400"
            bg="bg-pink-500/10"
          />
          <StatCard
            icon={Clock}
            label="Scheduled"
            value="8"
            accent="text-blue-600 dark:text-blue-400"
            bg="bg-blue-500/10"
          />
          <StatCard
            icon={Database}
            label="Data Sources"
            value="12"
            accent="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-500/10"
          />
          <StatCard
            icon={Share2}
            label="Shared Reports"
            value="21"
            accent="text-amber-600 dark:text-amber-400"
            bg="bg-amber-500/10"
          />
        </div>

        {/* Product Description */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-pink-500/10">
              <PieChart className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Visual Report Builder
              </h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                Build ad-hoc reports with an intuitive drag-and-drop query builder. Select
                data sources from students, staff, finance, and attendance domains. Apply
                filters, choose visualizations (tables, charts, graphs), and schedule
                automated delivery. Export to PDF, Excel, or connect to external BI tools
                via REST API.
              </p>
              <ul className="text-sm text-text-secondary space-y-1">
                <li className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-pink-500" />
                  <span>Drag-and-drop field selection from multiple data sources</span>
                </li>
                <li className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-pink-500" />
                  <span>Advanced filtering with date ranges and custom conditions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-pink-500" />
                  <span>Schedule reports for automatic generation and email delivery</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ExportCard
            icon={FileSpreadsheet}
            title="Excel Export"
            description="Download as .xlsx with formatting and formulas"
          />
          <ExportCard
            icon={FileText}
            title="PDF Export"
            description="Print-ready reports with headers and pagination"
          />
          <ExportCard
            icon={Database}
            title="API Integration"
            description="Connect to Tableau, Power BI, or custom dashboards"
          />
        </div>

        {/* Recent Reports */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary overflow-hidden">
          <div className="px-5 py-4 border-b border-border-secondary flex items-center justify-between">
            <h4 className="font-medium text-text-primary">Recent Reports</h4>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <div className="divide-y divide-border-secondary">
            <ReportRow
              name="Monthly Enrollment Summary"
              type="Scheduled"
              lastRun="Today, 6:00 AM"
              status="success"
            />
            <ReportRow
              name="Q4 Financial Overview"
              type="Manual"
              lastRun="Yesterday"
              status="success"
            />
            <ReportRow
              name="Attendance by Grade Level"
              type="Scheduled"
              lastRun="Dec 25, 2024"
              status="success"
            />
          </div>
        </div>

        {/* Placeholder Builder Area */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-8 text-center">
          <Table className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <h4 className="text-lg font-medium text-text-primary mb-2">
            Report Canvas
          </h4>
          <p className="text-text-secondary max-w-md mx-auto">
            Create a new report to start building. Drag fields from the data source
            panel and configure your visualizations in the report canvas.
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
  icon: typeof PieChart
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

function ExportCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileSpreadsheet
  title: string
  description: string
}) {
  return (
    <div className="bg-surface-secondary rounded-xl border border-border-secondary p-5 hover:bg-surface-hover transition-colors cursor-pointer">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-pink-500/10">
          <Icon className="w-4 h-4 text-pink-600 dark:text-pink-400" />
        </div>
        <h4 className="font-medium text-text-primary">{title}</h4>
      </div>
      <p className="text-sm text-text-secondary">{description}</p>
    </div>
  )
}

function ReportRow({
  name,
  type,
  lastRun,
  status,
}: {
  name: string
  type: string
  lastRun: string
  status: 'success' | 'error'
}) {
  return (
    <div className="px-5 py-4 flex items-center justify-between hover:bg-surface-hover transition-colors cursor-pointer">
      <div className="flex items-center gap-3">
        <FileText className="w-4 h-4 text-text-tertiary" />
        <div>
          <p className="font-medium text-text-primary">{name}</p>
          <p className="text-sm text-text-tertiary">{type} · {lastRun}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {status === 'success' && (
          <CheckCircle className="w-4 h-4 text-emerald-500" />
        )}
        <Button variant="ghost" size="sm">
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

export default CustomReportsModule

