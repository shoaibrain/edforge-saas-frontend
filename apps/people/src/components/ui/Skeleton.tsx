/**
 * Skeleton Loading Components
 * 
 * Provides animated placeholder content while data is loading.
 * Improves perceived performance and prevents layout shift.
 * 
 * Features:
 * - Base skeleton with shimmer animation
 * - Pre-built patterns for common layouts (cards, tables, lists)
 * - Configurable sizes and shapes
 */

import { cn } from '@/lib/utils'

// ============================================================================
// BASE SKELETON
// ============================================================================

interface SkeletonProps {
  className?: string
}

/**
 * Base skeleton element with shimmer animation
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-[rgb(var(--background-tertiary))]',
        className
      )}
    />
  )
}

// ============================================================================
// SKELETON TEXT
// ============================================================================

interface SkeletonTextProps {
  lines?: number
  className?: string
}

/**
 * Multiple lines of skeleton text
 */
export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full' // Last line shorter
          )}
        />
      ))}
    </div>
  )
}

// ============================================================================
// SKELETON AVATAR
// ============================================================================

interface SkeletonAvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  shape?: 'circle' | 'rounded'
  className?: string
}

const avatarSizes = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
}

export function SkeletonAvatar({
  size = 'md',
  shape = 'circle',
  className,
}: SkeletonAvatarProps) {
  return (
    <Skeleton
      className={cn(
        avatarSizes[size],
        shape === 'circle' ? 'rounded-full' : 'rounded-xl',
        className
      )}
    />
  )
}

// ============================================================================
// SKELETON CARD
// ============================================================================

interface SkeletonCardProps {
  hasHeader?: boolean
  hasFooter?: boolean
  lines?: number
  className?: string
}

/**
 * Card layout skeleton
 */
export function SkeletonCard({
  hasHeader = true,
  hasFooter = false,
  lines = 3,
  className,
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] overflow-hidden',
        className
      )}
    >
      {hasHeader && (
        <div className="px-6 py-4 border-b border-[rgb(var(--border-secondary))]">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        </div>
      )}
      <div className="px-6 py-4">
        <SkeletonText lines={lines} />
      </div>
      {hasFooter && (
        <div className="px-6 py-4 border-t border-[rgb(var(--border-secondary))] bg-[rgb(var(--background-tertiary))]">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// SKELETON TABLE
// ============================================================================

interface SkeletonTableProps {
  rows?: number
  columns?: number
  hasHeader?: boolean
  className?: string
}

/**
 * Data table skeleton
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  hasHeader = true,
  className,
}: SkeletonTableProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] overflow-hidden',
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          {hasHeader && (
            <thead className="border-b border-[rgb(var(--border-primary))] bg-[rgb(var(--background-tertiary))]">
              <tr>
                {Array.from({ length: columns }).map((_, i) => (
                  <th key={i} className="px-6 py-3 text-start">
                    <Skeleton className="h-4 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-[rgb(var(--border-secondary))]">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    {colIndex === 0 ? (
                      // First column often has avatar + text
                      <div className="flex items-center gap-3">
                        <SkeletonAvatar size="sm" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    ) : (
                      <Skeleton
                        className={cn(
                          'h-4',
                          colIndex === columns - 1 ? 'w-16' : 'w-24'
                        )}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================================
// SKELETON LIST ITEM
// ============================================================================

interface SkeletonListItemProps {
  hasAvatar?: boolean
  hasAction?: boolean
  className?: string
}

export function SkeletonListItem({
  hasAvatar = true,
  hasAction = false,
  className,
}: SkeletonListItemProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 px-4 py-3 border-b border-[rgb(var(--border-secondary))] last:border-0',
        className
      )}
    >
      {hasAvatar && <SkeletonAvatar size="md" />}
      <div className="flex-1 min-w-0 space-y-1.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      {hasAction && <Skeleton className="h-8 w-8 rounded-lg" />}
    </div>
  )
}

interface SkeletonListProps {
  items?: number
  hasAvatar?: boolean
  hasAction?: boolean
  className?: string
}

/**
 * List layout skeleton
 */
export function SkeletonList({
  items = 5,
  hasAvatar = true,
  hasAction = false,
  className,
}: SkeletonListProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] overflow-hidden',
        className
      )}
    >
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonListItem key={i} hasAvatar={hasAvatar} hasAction={hasAction} />
      ))}
    </div>
  )
}

// ============================================================================
// SKELETON STATS CARD
// ============================================================================

interface SkeletonStatsCardProps {
  className?: string
}

/**
 * Stats/metric card skeleton
 */
export function SkeletonStatsCard({ className }: SkeletonStatsCardProps) {
  return (
    <div
      className={cn(
        'p-6 rounded-2xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))]',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="w-12 h-12 rounded-xl" />
      </div>
    </div>
  )
}

// ============================================================================
// SKELETON PAGE HEADER
// ============================================================================

interface SkeletonPageHeaderProps {
  hasActions?: boolean
  className?: string
}

/**
 * Page header skeleton with title and optional actions
 */
export function SkeletonPageHeader({
  hasActions = true,
  className,
}: SkeletonPageHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-6', className)}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      {hasActions && (
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      )}
    </div>
  )
}

// ============================================================================
// SKELETON MODULE OVERVIEW
// ============================================================================

interface SkeletonModuleOverviewProps {
  statsCount?: number
  cardsCount?: number
  className?: string
}

/**
 * Full module overview page skeleton (stats + action cards)
 */
export function SkeletonModuleOverview({
  statsCount = 4,
  cardsCount = 6,
  className,
}: SkeletonModuleOverviewProps) {
  return (
    <div className={cn('space-y-8', className)}>
      {/* Page Header */}
      <SkeletonPageHeader />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: statsCount }).map((_, i) => (
          <SkeletonStatsCard key={i} />
        ))}
      </div>

      {/* Action Cards */}
      <div>
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: cardsCount }).map((_, i) => (
            <SkeletonCard key={i} hasHeader={false} hasFooter={false} lines={2} />
          ))}
        </div>
      </div>
    </div>
  )
}

