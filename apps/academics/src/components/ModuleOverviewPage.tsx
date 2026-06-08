/**
 * ModuleOverviewPage - Local Implementation for Academics MFE
 *
 * Provides a Notion-inspired module landing page with:
 * - Header with module title + "Overview" label
 * - Optional calendar bar slot (rendered between header and stats)
 * - Stats carousel with loading skeleton support
 * - Custom widget children slot (rendered between stats and quick access)
 * - Quick action cards linking to sub-routes
 * - Widget visibility persisted via Zustand store
 */

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState, useRef, useCallback, useEffect } from 'react'
import {
    ChartNoAxesColumnDecreasing,
    GalleryVerticalEnd,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    TrendingDown,
    Minus,
    MoreHorizontal,
    Eye,
    RotateCcw,
    Check,
    BarChart3,
    RefreshCw,
} from 'lucide-react'
import { useOverviewWidgetStore } from '../stores/overview-widgets.store'

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
    loading?: boolean
    error?: boolean
    onRetry?: () => void
}

export interface ModuleOverviewPageProps {
    moduleId?: string
    title: string
    description: string
    icon: LucideIcon
    stats: ModuleStat[]
    calendarLabel?: ReactNode
    children?: ReactNode
    lastUpdated?: Date | null
    onRefresh?: () => void
}

// ============================================================================
// WIDGET VISIBILITY MENU
// ============================================================================

interface WidgetVisibilityMenuProps {
    widgets: { id: string; label: string; visible: boolean }[]
    onToggle: (id: string) => void
    onReset: () => void
}

function WidgetVisibilityMenu({ widgets, onToggle, onReset }: WidgetVisibilityMenuProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [showWidgets, setShowWidgets] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
                setShowWidgets(false)
            }
        }
        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsOpen(false)
                setShowWidgets(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [])

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    p-1.5 rounded-md
                    text-[rgb(var(--text-tertiary))]
                    hover:bg-[rgb(var(--background-tertiary))]
                    transition-colors
                    ${isOpen ? 'bg-[rgb(var(--background-tertiary))]' : ''}
                `}
                title="Page options"
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <MoreHorizontal className="w-5 h-5" />
            </button>

            {isOpen && !showWidgets && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute right-0 top-full mt-1 z-50 w-52 py-1 bg-[rgb(var(--background-primary))] border border-[rgb(var(--border-primary))] rounded-lg shadow-xl"
                    role="menu"
                >
                    <button
                        onClick={() => setShowWidgets(true)}
                        className="w-full px-3 py-2 flex items-center gap-3 hover:bg-[rgb(var(--background-tertiary))] text-left text-sm text-[rgb(var(--text-primary))]"
                        role="menuitem"
                    >
                        <Eye className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                        <span>Show/hide widgets</span>
                        <span className="ml-auto text-[rgb(var(--text-tertiary))]">›</span>
                    </button>
                    <div className="my-1 border-t border-[rgb(var(--border-secondary))]" />
                    <button
                        onClick={() => { onReset(); setIsOpen(false) }}
                        className="w-full px-3 py-2 flex items-center gap-3 text-left text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-tertiary))]"
                        role="menuitem"
                    >
                        <RotateCcw className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                        <span>Reset to default</span>
                    </button>
                </motion.div>
            )}

            {isOpen && showWidgets && (
                <motion.div
                    initial={{ opacity: 0, x: 4 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute right-0 top-full mt-1 z-50 w-52 py-1 bg-[rgb(var(--background-primary))] border border-[rgb(var(--border-primary))] rounded-lg shadow-xl"
                    role="menu"
                >
                    <button
                        onClick={() => setShowWidgets(false)}
                        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-[rgb(var(--background-tertiary))] text-left text-sm text-[rgb(var(--text-tertiary))] border-b border-[rgb(var(--border-secondary))] mb-1"
                        role="menuitem"
                    >
                        <span>‹</span>
                        <span>Back</span>
                    </button>
                    {widgets.map((widget) => (
                        <button
                            key={widget.id}
                            onClick={() => onToggle(widget.id)}
                            className="w-full px-3 py-2 flex items-center gap-3 hover:bg-[rgb(var(--background-tertiary))] text-left text-sm"
                            role="menuitemcheckbox"
                            aria-checked={widget.visible}
                        >
                            <div className="w-4 h-4 flex items-center justify-center">
                                {widget.visible && <Check className="w-4 h-4 text-[rgb(var(--text-primary))]" />}
                            </div>
                            <span className="text-[rgb(var(--text-primary))]">{widget.label}</span>
                        </button>
                    ))}
                </motion.div>
            )}
        </div>
    )
}

// ============================================================================
// STAT CARD COMPONENT (with loading skeleton)
// ============================================================================

interface StatCardProps {
    stat: ModuleStat
    index: number
}

function StatCard({ stat, index }: StatCardProps) {
    const TrendIcon = stat.changeType === 'positive' ? TrendingUp
        : stat.changeType === 'negative' ? TrendingDown
            : Minus

    return (
        <motion.div
            className="flex-shrink-0"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.3 }}
        >
            <div className="group relative flex flex-col w-52 h-36 p-5 rounded-2xl bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-primary)/0.6)] shadow-sm transition-all duration-200 overflow-hidden">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[rgb(var(--background-elevated)/0.10)] to-transparent pointer-events-none" />
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.iconBg}`}>
                    <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                <div className="mt-auto relative z-10">
                    <p className="text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wide mb-1 truncate">{stat.label}</p>
                    {stat.loading ? (
                        <div className="space-y-1.5">
                            <div className="h-8 w-16 bg-[rgb(var(--background-tertiary))] rounded motion-safe:animate-pulse" />
                            <div className="h-3.5 w-12 bg-[rgb(var(--background-tertiary))] rounded motion-safe:animate-pulse" />
                        </div>
                    ) : stat.error ? (
                        <div className="flex items-center gap-1.5">
                            <span className="text-3xl font-semibold text-[rgb(var(--text-tertiary))]">—</span>
                            {stat.onRetry && (
                                <button
                                    onClick={stat.onRetry}
                                    className="flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded bg-[rgb(var(--state-warning-fg))]/10 text-[rgb(var(--state-warning-fg))] hover:bg-[rgb(var(--state-warning-fg))]/20 transition-colors"
                                    title="Retry loading"
                                >
                                    <RotateCcw className="w-2.5 h-2.5" />
                                    Retry
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-semibold text-[rgb(var(--text-primary))]">{stat.value}</span>
                            {stat.change && (
                                <div className={`flex items-center gap-0.5 text-xs ${
                                    stat.changeType === 'positive' ? 'text-[rgb(var(--state-success-fg))]' :
                                    stat.changeType === 'negative' ? 'text-[rgb(var(--state-danger-fg))]' :
                                    'text-[rgb(var(--text-tertiary))]'
                                }`}>
                                    <TrendIcon className="w-3 h-3" />
                                    <span>{stat.change}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

// ============================================================================
// STATS CAROUSEL (keyboard-navigable)
// ============================================================================

interface StatsCarouselProps {
    stats: ModuleStat[]
}

function StatsCarousel({ stats }: StatsCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [isHovered, setIsHovered] = useState(false)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(true)

    const checkScrollPosition = useCallback(() => {
        if (!scrollRef.current) return
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
        setCanScrollLeft(scrollLeft > 0)
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }, [])

    useEffect(() => {
        checkScrollPosition()
    }, [checkScrollPosition, stats])

    const smoothScroll = useCallback((direction: 'left' | 'right') => {
        if (!scrollRef.current) return
        const scrollAmount = direction === 'left' ? -360 : 360
        scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }, [])

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowLeft') {
            e.preventDefault()
            smoothScroll('left')
        } else if (e.key === 'ArrowRight') {
            e.preventDefault()
            smoothScroll('right')
        }
    }, [smoothScroll])

    return (
        <div
            className="relative group/carousel px-4"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {(isHovered) && canScrollLeft && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => smoothScroll('left')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-primary))] shadow-lg text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))]"
                    aria-label="Scroll stats left"
                >
                    <ChevronLeft className="w-5 h-5" />
                </motion.button>
            )}
            {(isHovered) && canScrollRight && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => smoothScroll('right')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-primary))] shadow-lg text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))]"
                    aria-label="Scroll stats right"
                >
                    <ChevronRight className="w-5 h-5" />
                </motion.button>
            )}
            <div
                ref={scrollRef}
                onScroll={checkScrollPosition}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                role="region"
                aria-label="Key performance indicators"
                className="flex gap-3 overflow-x-auto scrollbar-none scroll-smooth py-2 -my-2 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] rounded-xl"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {stats.map((stat, index) => (
                    <StatCard key={stat.label} stat={stat} index={index} />
                ))}
            </div>
        </div>
    )
}

// ============================================================================
// WIDGET SECTION
// ============================================================================

interface WidgetSectionProps {
    label: string
    icon: LucideIcon
    visible: boolean
    children: ReactNode
}

function WidgetSection({ label, icon: Icon, visible, children }: WidgetSectionProps) {
    if (!visible) return null

    return (
        <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-center gap-2 mb-4">
                    <Icon className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                    <h2 className="text-sm font-medium text-[rgb(var(--text-secondary))]">{label}</h2>
                </div>
                {children}
            </motion.div>
        </motion.section>
    )
}

// ============================================================================
// LAST UPDATED INDICATOR
// ============================================================================

function LastUpdatedIndicator({ date, onRefresh }: { date: Date | null; onRefresh?: () => void }) {
    if (!date) return null

    const diffMs = Date.now() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    let label = 'Updated just now'
    if (diffMin >= 1 && diffMin < 60) label = `Updated ${diffMin}m ago`
    else if (diffMin >= 60) label = `Updated ${Math.floor(diffMin / 60)}h ago`

    return (
        <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] transition-colors"
            title="Click to refresh"
        >
            <RefreshCw className="w-3 h-3" />
            {label}
        </button>
    )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ModuleOverviewPage({
    title,
    description,
    stats,
    calendarLabel,
    children,
    lastUpdated,
    onRefresh,
}: ModuleOverviewPageProps) {
    // Widget visibility from Zustand store (persisted in localStorage)
    const { visibleWidgets, toggleWidget, resetToDefaults } = useOverviewWidgetStore()

    const widgets = [
        { id: 'quick-stats', label: 'Quick stats', visible: visibleWidgets['quick-stats'] ?? true },
        { id: 'insights', label: 'Insights & Charts', visible: visibleWidgets['insights'] ?? true },
        { id: 'activity-alerts', label: 'Activity & Alerts', visible: visibleWidgets['activity-alerts'] ?? true },
    ]

    const isWidgetVisible = (id: string) => visibleWidgets[id] ?? true

    return (
        <div className="space-y-10 max-w-6xl mx-auto pb-12 relative">
            {/* Top-right controls: calendar label, last updated, menu */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="absolute top-4 right-0 z-10 flex items-center gap-3"
            >
                {calendarLabel}
                {calendarLabel && (
                    <span className="w-px h-3 bg-[rgb(var(--border-secondary))]" />
                )}
                <LastUpdatedIndicator date={lastUpdated ?? null} onRefresh={onRefresh} />
                <WidgetVisibilityMenu
                    widgets={widgets}
                    onToggle={toggleWidget}
                    onReset={resetToDefaults}
                />
            </motion.div>

            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-4 pr-12"
            >
                <div className="flex items-start gap-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="p-3 rounded-xl bg-gradient-to-br from-[rgb(var(--state-info-bg)/0.18)] to-[rgb(var(--state-info-bg)/0.10)] dark:from-[rgb(var(--state-info-bg)/0.18)] dark:to-[rgb(var(--state-info-bg)/0.10)] border border-[rgb(var(--border-focus)/0.35)]  flex-shrink-0"
                    >
                        <GalleryVerticalEnd className="w-5 h-5 text-[rgb(var(--action-secondary-fg))] " />
                    </motion.div>
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
                <WidgetSection
                    label="Quick stats"
                    icon={ChartNoAxesColumnDecreasing}
                    visible={isWidgetVisible('quick-stats')}
                >
                    <StatsCarousel stats={stats} />
                </WidgetSection>
            )}

            {/* Insights / Charts children slot */}
            {children && isWidgetVisible('insights') && (
                <WidgetSection
                    label="Insights"
                    icon={BarChart3}
                    visible={isWidgetVisible('insights')}
                >
                    {children}
                </WidgetSection>
            )}

        </div>
    )
}
