/**
 * Grade Levels Module (Legacy Route)
 *
 * Academic progression structure for the Academics domain.
 * Now consolidated under /academics/curriculum for unified curriculum management.
 */

import { Layers, ArrowUp, Settings, ArrowRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export function GradeLevelsModule() {
  return (
    <div className="min-h-full">
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[rgb(var(--state-info-bg)/0.18)] to-[rgb(var(--state-info-bg)/0.14)]">
              <Layers className="w-6 h-6 text-[rgb(var(--state-info-fg))]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Grade Levels</h1>
              <p className="text-text-secondary mt-1">
                Academic progression structure and promotion requirements
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Redirect Notice */}
        <div className="bg-[rgb(var(--state-info-bg)/0.18)] border border-[rgb(var(--state-info-border)/0.35)] rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-[rgb(var(--state-info-fg))]/20">
              <ArrowRight className="w-5 h-5 text-[rgb(var(--state-info-fg))]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                New Consolidated View Available
              </h3>
              <p className="text-text-secondary mb-4">
                Access the Curriculum Management page for a unified view of courses,
                grade levels, and standards in one place.
              </p>
              <Link
                to="/curriculum"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] rounded-lg hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors"
              >
                <span>Go to Curriculum Management</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Grade Level Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((grade) => (
            <div
              key={grade}
              className="bg-surface-secondary rounded-lg border border-border-secondary p-4 text-center hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <div className="text-2xl font-bold text-text-primary mb-1">{grade}</div>
              <div className="text-xs text-text-tertiary">
                {grade === 'K' ? 'Kindergarten' : `Grade ${grade}`}
              </div>
            </div>
          ))}
        </div>

        {/* Product Description */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-[rgb(var(--state-info-fg))]/10">
              <Layers className="w-5 h-5 text-[rgb(var(--state-info-fg))]" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Academic Progression
              </h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                Define the path from entry to graduation. Grade levels determine course
                eligibility, homeroom assignments, and state reporting classifications.
                Each level can have unique promotion requirements and credit thresholds.
              </p>
              <div className="flex items-center gap-4 text-sm text-text-tertiary">
                <div className="flex items-center gap-1.5">
                  <ArrowUp className="w-4 h-4" />
                  <span>Promotion rules</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Settings className="w-4 h-4" />
                  <span>State code mappings</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GradeLevelsModule
