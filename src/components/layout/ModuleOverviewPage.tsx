/**
 * ModuleOverviewPage - Reusable module landing page component
 * 
 * Provides a consistent layout for module overview pages with:
 * - Header with title and description
 * - Stats grid with animated cards
 * - Quick action cards linking to sub-routes
 * - ABAC-aware visibility controls
 */

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useSpring, animated, config } from '@react-spring/web'
import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { RequirePermission } from '@/components/secure'
import type { Action, Resource } from '@/lib/abac'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ModuleStat {
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
  iconBg: string
  iconColor: string
}

export interface ModuleActionCard {
  id: string
  title: string
  description: string
  icon: LucideIcon
  href: string
  iconBg: string
  iconColor: string
  // ABAC permission for visibility
  permission?: {
    action: Action
    resource: Resource
  }
}

export interface ModuleOverviewPageProps {
  title: string
  description: string
  icon: LucideIcon
  stats: ModuleStat[]
  actionCards: ModuleActionCard[]
  children?: ReactNode
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

function StatCard({ 
  stat, 
  delay = 0 
}: { 
  stat: ModuleStat
  delay?: number
}) {
  const [hovered, setHovered] = useState(false)
  
  const springProps = useSpring({
    scale: hovered ? 1.02 : 1,
    y: hovered ? -4 : 0,
    shadow: hovered ? 20 : 8,
    config: config.wobbly,
  })

  return (
    <animated.div
      style={{
        transform: springProps.scale.to(s => `scale(${s}) translateY(${springProps.y.get()}px)`),
        boxShadow: springProps.shadow.to(s => `0 ${s}px ${s * 2}px -${s/2}px rgba(0,0,0,0.1)`),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
      >
        <Card className="p-5 cursor-default">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-[rgb(var(--text-tertiary))]">{stat.label}</p>
              <p className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))]">
                {stat.value}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${stat.iconBg}`}>
              <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.iconColor}`} />
            </div>
          </div>
          {stat.change && (
            <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-[rgb(var(--border-secondary))]">
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                stat.changeType === 'positive' 
                  ? 'bg-aqua-400/20 text-aqua-700 dark:text-aqua-400' 
                  : stat.changeType === 'negative'
                    ? 'bg-rust-100 text-rust-600 dark:bg-rust-900/30 dark:text-rust-400'
                    : 'bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-tertiary))]'
              }`}>
                {stat.change}
              </div>
              <span className="text-xs text-[rgb(var(--text-tertiary))]">vs last period</span>
            </div>
          )}
        </Card>
      </motion.div>
    </animated.div>
  )
}

// ============================================================================
// ACTION CARD COMPONENT
// ============================================================================

function ActionCard({ 
  card, 
  delay = 0 
}: { 
  card: ModuleActionCard
  delay?: number
}) {
  const [hovered, setHovered] = useState(false)
  
  const springProps = useSpring({
    scale: hovered ? 1.02 : 1,
    y: hovered ? -6 : 0,
    config: { tension: 300, friction: 20 },
  })

  const arrowSpring = useSpring({
    x: hovered ? 4 : 0,
    opacity: hovered ? 1 : 0.6,
    config: { tension: 400, friction: 25 },
  })

  const content = (
    <animated.div
      style={{
        transform: springProps.scale.to(s => `scale(${s}) translateY(${springProps.y.get()}px)`),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
      >
        <Link to={card.href}>
          <Card className="p-6 h-full hover:shadow-lg transition-shadow duration-300 cursor-pointer group border-[rgb(var(--border-primary))] hover:border-teal-500/30 dark:hover:border-cyan-500/30">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${card.iconBg} transition-colors duration-200`}>
                <card.icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
              <animated.div
                style={{
                  transform: arrowSpring.x.to(x => `translateX(${x}px)`),
                  opacity: arrowSpring.opacity,
                }}
              >
                <ArrowRight className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
              </animated.div>
            </div>
            <h3 className="font-semibold text-[rgb(var(--text-primary))] mb-1 group-hover:text-teal-600 dark:group-hover:text-cyan-400 transition-colors">
              {card.title}
            </h3>
            <p className="text-sm text-[rgb(var(--text-tertiary))]">
              {card.description}
            </p>
          </Card>
        </Link>
      </motion.div>
    </animated.div>
  )

  // Wrap with permission check if specified
  if (card.permission) {
    return (
      <RequirePermission action={card.permission.action} resource={card.permission.resource}>
        {content}
      </RequirePermission>
    )
  }

  return content
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ModuleOverviewPage({
  title,
  description,
  icon: Icon,
  stats,
  actionCards,
  children,
}: ModuleOverviewPageProps) {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500/15 to-cyan-500/10 dark:from-teal-500/20 dark:to-cyan-500/15 border border-teal-500/20 dark:border-cyan-500/25">
            <Icon className="w-7 h-7 text-teal-600 dark:text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))]">
              {title}
            </h1>
            <p className="text-[rgb(var(--text-secondary))] mt-1">
              {description}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      {stats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, index) => (
            <StatCard
              key={stat.label}
              stat={stat}
              delay={0.1 + index * 0.05}
            />
          ))}
        </div>
      )}

      {/* Action Cards Grid */}
      {actionCards.length > 0 && (
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-4"
          >
            Quick Access
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {actionCards.map((card, index) => (
              <ActionCard
                key={card.id}
                card={card}
                delay={0.35 + index * 0.05}
              />
            ))}
          </div>
        </div>
      )}

      {/* Additional content slot */}
      {children && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {children}
        </motion.div>
      )}
    </div>
  )
}

