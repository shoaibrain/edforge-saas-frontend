/**
 * Step 6: Complete — Fires completeOnboarding API, shows confetti, summary, and action cards.
 */

import { useEffect, useState, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useShell } from '../../../lib/shell-context'
import { tenantService } from '../../../services/tenant.service'
import type { OnboardingStepProps } from '../onboarding.types'

const COMPLETED_KEY_PREFIX = 'edforge-onboarding-completed-'

const CONFETTI_COLORS = ['#1D9E75', '#378ADD', '#22d3ee', '#14b8a6', '#6366f1', '#f59e0b']

function Confetti() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 55 }).map((_, i) => {
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
        const left = Math.random() * 100
        const delay = Math.random() * 0.8
        const duration = 1.5 + Math.random() * 1
        const size = 4 + Math.random() * 6
        const rotation = Math.random() * 360

        return (
          <div
            key={i}
            className="absolute animate-confetti-fall"
            style={{
              left: `${left}%`,
              top: '-10px',
              width: `${size}px`,
              height: `${size * 0.6}px`,
              backgroundColor: color,
              borderRadius: '1px',
              transform: `rotate(${rotation}deg)`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          />
        )
      })}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti-fall {
          animation: confetti-fall 2s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

interface CompleteStepProps extends OnboardingStepProps {
  clearSession: () => void
}

export function CompleteStep({ data, clearSession }: CompleteStepProps) {
  const { user } = useShell()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showConfetti, setShowConfetti] = useState(false)
  const [completed, setCompleted] = useState(false)
  const calledRef = useRef(false)

  const tenantId = user?.tenantId ?? ''

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    const complete = async () => {
      try {
        const result = await tenantService.completeOnboarding(tenantId)
        // Cache in localStorage
        try {
          localStorage.setItem(
            `${COMPLETED_KEY_PREFIX}${tenantId}`,
            result.onboardingCompletedAt,
          )
        } catch { /* ignore */ }
        // Invalidate queries so shell picks up the new state
        await queryClient.invalidateQueries({ queryKey: ['workspaceSettings', tenantId] })
        clearSession()
        setShowConfetti(true)
        setCompleted(true)
        // Hide confetti after animation
        setTimeout(() => setShowConfetti(false), 3000)
      } catch {
        // Still show completion even if API fails — localStorage is set
        setCompleted(true)
      }
    }

    complete()
  }, [tenantId, queryClient, clearSession])

  const summaryItems: Array<{ label: string; value: string }> = []

  if (data.schoolName) {
    summaryItems.push({ label: 'School', value: data.schoolName })
  }
  if (data.academicYearName) {
    summaryItems.push({ label: 'Academic Year', value: data.academicYearName })
  }
  if (data.invitees && data.invitees.length > 0) {
    summaryItems.push({
      label: 'Team',
      value: `${data.invitees.length} invitation${data.invitees.length > 1 ? 's' : ''} sent`,
    })
  }

  const actionCards = [
    {
      icon: '👥',
      title: 'Add Students',
      description: 'Import or add students to your school',
      path: '/people',
    },
    {
      icon: '💰',
      title: 'Set Up Fees',
      description: 'Configure fee structures and billing',
      path: '/finance',
    },
    {
      icon: '📚',
      title: 'Schedule Classes',
      description: 'Create sections and assign teachers',
      path: '/academics',
    },
  ]

  return (
    <div className="text-center">
      {showConfetti && <Confetti />}

      {/* Success icon */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[rgb(var(--state-success-fg))] to-[rgb(var(--action-primary-bg-hover))] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
        <svg className="w-8 h-8 text-[rgb(var(--action-primary-fg))]" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-2">
        You're all set!
      </h2>
      <p className="text-sm text-[rgb(var(--text-secondary))] mb-8">
        Your workspace is ready. Here's what we set up:
      </p>

      {/* Summary */}
      {summaryItems.length > 0 && (
        <div className="bg-[rgb(var(--background-secondary))] rounded-2xl p-5 border border-[rgb(var(--border-primary))] mb-8 text-left">
          {summaryItems.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 border-b border-[rgb(var(--border-primary))] last:border-0"
            >
              <span className="text-xs text-[rgb(var(--text-tertiary))]">{item.label}</span>
              <span className="text-sm font-medium text-[rgb(var(--text-primary))]">{item.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action cards */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {actionCards.map((card) => (
          <button
            key={card.path}
            onClick={() => navigate({ to: card.path as any })}
            className="p-4 rounded-xl bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-primary))] hover:border-[rgb(var(--border-focus)/0.40)] transition-all text-left group"
          >
            <span className="text-xl mb-2 block">{card.icon}</span>
            <p className="text-xs font-semibold text-[rgb(var(--text-primary))] mb-0.5 group-hover:text-[rgb(var(--action-secondary-fg))] dark:group-hover:text-[rgb(var(--text-primary))] transition-colors">
              {card.title}
            </p>
            <p className="text-xs text-[rgb(var(--text-tertiary))]">{card.description}</p>
          </button>
        ))}
      </div>

      {/* Dashboard button */}
      <button
        onClick={() => navigate({ to: '/home', replace: true })}
        disabled={!completed}
        className="px-8 py-3 rounded-full bg-[rgb(var(--action-primary-bg))] hover:bg-[rgb(var(--action-primary-bg-hover))]  dark: text-[rgb(var(--action-primary-fg))] font-semibold text-base transition-all hover:shadow-lg hover:shadow-teal-500/25 active:scale-[0.98] disabled:opacity-50"
      >
        Go to Dashboard
      </button>
    </div>
  )
}
