/**
 * ModuleOverviewPage - Notion-Inspired Module Landing Page
 * 
 * Provides a consistent, customizable layout for module overview pages with:
 * - Header with module title + "Overview" label combined
 * - Stats carousel (Notion-style cards)
 * - Quick action cards linking to sub-routes
 * - Widget visibility controls (three-dot menu in top right)
 * - ABAC-aware visibility controls
 */

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ArrowRight, ChartNoAxesColumnDecreasing, CloudLightning, GalleryVerticalEnd } from 'lucide-react'
import { Card } from '@edforge/ui'
import { RequirePermission } from '../secure'
import type { Action, Resource } from '@edforge/abac'
import {
  DynamicPageProvider,
  WidgetSection,
  WidgetVisibilityMenu,
  CarouselWidget,
  ModuleTipWidget,
  type CarouselCard,
} from '../dynamic-page'

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
  /** Module identifier for widget preferences */
  moduleId?: string
  title: string
  description: string
  icon: LucideIcon
  stats: ModuleStat[]
  actionCards: ModuleActionCard[]
  /** Show tip widget */
  showTip?: boolean
  children?: ReactNode
}

// ============================================================================
// HELPER - Convert Stats to Carousel Cards
// ============================================================================

function statsToCarouselCards(stats: ModuleStat[]): CarouselCard[] {
  return stats.map((stat, index) => ({
    id: `stat-${index}`,
    title: stat.label,
    value: stat.value,
    icon: stat.icon,
    change: stat.change,
    changeType: stat.changeType,
    module: stat.changeType || 'neutral',
  }))
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
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -6 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Link to={card.href}>
        <Card className="p-6 h-full hover:shadow-lg transition-shadow duration-300 cursor-pointer group border-[rgb(var(--border-primary))] hover:border-teal-500/30 dark:hover:border-cyan-500/30">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl ${card.iconBg} transition-colors duration-200`}>
              <card.icon className={`w-6 h-6 ${card.iconColor}`} />
            </div>
            <motion.div
              initial={{ x: 0, opacity: 0.6 }}
              whileHover={{ x: 4, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <ArrowRight className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
            </motion.div>
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
// QUICK ACCESS WIDGET
// ============================================================================

interface QuickAccessWidgetProps {
  actionCards: ModuleActionCard[]
}

function QuickAccessWidget({ actionCards }: QuickAccessWidgetProps) {
  return (
    <WidgetSection
      widgetId="quick-access"
      label="Quick access"
      animationDelay={0.35}
      icon={CloudLightning}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {actionCards.map((card, index) => (
          <ActionCard
            key={card.id}
            card={card}
            delay={0.35 + index * 0.05}
          />
        ))}
      </div>
    </WidgetSection>
  )
}

// ============================================================================
// STATS CAROUSEL WIDGET
// ============================================================================

interface StatsCarouselWidgetProps {
  stats: ModuleStat[]
}

function StatsCarouselWidget({ stats }: StatsCarouselWidgetProps) {
  const carouselCards = statsToCarouselCards(stats)

  return (
    <WidgetSection
      widgetId="quick-stats"
      label="Quick stats"
      animationDelay={0.1}
      icon={ChartNoAxesColumnDecreasing}
    >
      <CarouselWidget cards={carouselCards} cardType="stat" />
    </WidgetSection>
  )
}

// ============================================================================
// INNER CONTENT (Within Context)
// ============================================================================

interface ModuleOverviewInnerProps {
  moduleId: string
  title: string
  description: string
  stats: ModuleStat[]
  actionCards: ModuleActionCard[]
  showTip: boolean
  children?: ReactNode
}

function ModuleOverviewInner({
  moduleId,
  title,
  description,
  stats,
  actionCards,
  showTip,
  children,
}: ModuleOverviewInnerProps) {
  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-12 relative">
      {/* Three-dot menu in top right corner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="absolute top-4 right-0 z-10"
      >
        <WidgetVisibilityMenu />
      </motion.div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-4 pr-12"
      >
        <div className="flex items-start gap-4">
          {/* Animated Module Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="p-3 rounded-xl bg-gradient-to-br from-brand-500/15 to-brand-600/15 dark:from-brand-400/20 dark:to-brand-500/20 border border-brand-500/20 dark:border-brand-400/25 flex-shrink-0"
          >
            <GalleryVerticalEnd className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </motion.div>

          {/* Title and description - Combined format */}
          <div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))]">
              {title} Overview
            </h1>
            <p className="text-[rgb(var(--text-secondary))] mt-1 max-w-2xl">
              {description}
            </p>
          </div>
        </div>
      </motion.header>

      {/* Stats Carousel */}
      {stats.length > 0 && (
        <StatsCarouselWidget stats={stats} />
      )}

      {/* Quick Access Cards */}
      {actionCards.length > 0 && (
        <QuickAccessWidget actionCards={actionCards} />
      )}

      {/* Module-specific Tip */}
      {showTip && (
        <ModuleTipWidget moduleId={moduleId} />
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ModuleOverviewPage({
  moduleId,
  title,
  description,
  stats,
  actionCards,
  showTip = true,
  children,
}: ModuleOverviewPageProps) {
  // Generate moduleId from title if not provided
  const pageId = moduleId || `${title.toLowerCase().replace(/\s+/g, '-')}-overview`

  return (
    <DynamicPageProvider pageId={pageId} pageType="module-overview">
      <ModuleOverviewInner
        moduleId={pageId}
        title={title}
        description={description}
        stats={stats}
        actionCards={actionCards}
        showTip={showTip}
      >
        {children}
      </ModuleOverviewInner>
    </DynamicPageProvider>
  )
}
