/**
 * ModuleOverviewPage - Shared Component for EdForge MFE
 * 
 * Provides a Notion-inspired module landing page with:
 * - Header with module title + "Overview" label
 * - Stats carousel with horizontal scrolling
 * - Quick action cards linking to sub-routes
 * - Widget visibility controls (three-dot menu)
 * 
 * This component matches the visual design of the legacy monolith app
 * and provides a consistent experience across all federated modules.
 */

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useSpring, animated } from '@react-spring/web'
import { useState, useRef, useCallback, useEffect } from 'react'
import { 
    ArrowRight, 
    ChartNoAxesColumnDecreasing, 
    CloudLightning, 
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
} from 'lucide-react'
import { Card } from '@edforge/ui'

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
}

export interface ModuleOverviewPageProps {
    /** Module identifier for widget preferences */
    moduleId?: string
    /** Module title displayed in header */
    title: string
    /** Module description displayed under title */
    description: string
    /** Module icon (used for visual identification) */
    icon: LucideIcon
    /** Stats to display in the carousel */
    stats: ModuleStat[]
    /** Quick action cards linking to sub-routes */
    actionCards: ModuleActionCard[]
    /** Additional content to render below action cards */
    children?: ReactNode
    /** Theme color for accents (defaults to brand/teal) */
    accentColor?: 'teal' | 'amber' | 'indigo' | 'purple' | 'emerald'
}

// ============================================================================
// COLOR THEME MAPPING
// ============================================================================

const accentColorClasses = {
    teal: {
        iconBg: 'from-teal-500/15 to-cyan-500/15 dark:from-teal-400/20 dark:to-cyan-500/20',
        iconBorder: 'border-teal-500/20 dark:border-cyan-400/25',
        iconText: 'text-teal-600 dark:text-cyan-400',
        cardHover: 'hover:border-teal-500/30 dark:hover:border-cyan-500/30',
        titleHover: 'group-hover:text-teal-600 dark:group-hover:text-cyan-400',
    },
    amber: {
        iconBg: 'from-amber-500/15 to-orange-500/15 dark:from-amber-400/20 dark:to-orange-500/20',
        iconBorder: 'border-amber-500/20 dark:border-amber-400/25',
        iconText: 'text-amber-600 dark:text-amber-400',
        cardHover: 'hover:border-amber-500/30 dark:hover:border-amber-400/30',
        titleHover: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
    },
    indigo: {
        iconBg: 'from-indigo-500/15 to-purple-500/15 dark:from-indigo-400/20 dark:to-purple-500/20',
        iconBorder: 'border-indigo-500/20 dark:border-indigo-400/25',
        iconText: 'text-indigo-600 dark:text-indigo-400',
        cardHover: 'hover:border-indigo-500/30 dark:hover:border-indigo-400/30',
        titleHover: 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
    },
    purple: {
        iconBg: 'from-purple-500/15 to-pink-500/15 dark:from-purple-400/20 dark:to-pink-500/20',
        iconBorder: 'border-purple-500/20 dark:border-purple-400/25',
        iconText: 'text-purple-600 dark:text-purple-400',
        cardHover: 'hover:border-purple-500/30 dark:hover:border-purple-400/30',
        titleHover: 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
    },
    emerald: {
        iconBg: 'from-emerald-500/15 to-teal-500/15 dark:from-emerald-400/20 dark:to-teal-500/20',
        iconBorder: 'border-emerald-500/20 dark:border-emerald-400/25',
        iconText: 'text-emerald-600 dark:text-emerald-400',
        cardHover: 'hover:border-emerald-500/30 dark:hover:border-emerald-400/30',
        titleHover: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
    },
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
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                if (showWidgets) setShowWidgets(false)
                else setIsOpen(false)
            }
        }
        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [showWidgets])

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    p-1.5 rounded-md
                    text-[rgb(var(--text-tertiary))]
                    hover:bg-[rgb(var(--surface-tertiary))]
                    transition-colors
                    ${isOpen ? 'bg-[rgb(var(--surface-tertiary))]' : ''}
                `}
                title="Page options"
                aria-label="Page options"
                aria-expanded={isOpen}
            >
                <MoreHorizontal className="w-5 h-5" />
            </button>

            {isOpen && !showWidgets && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 top-full mt-1 z-50 w-52 py-1 bg-[rgb(var(--surface-primary))] border border-[rgb(var(--border-primary))] rounded-lg shadow-xl"
                    role="menu"
                >
                    <button
                        onClick={() => setShowWidgets(true)}
                        className="w-full px-3 py-2 flex items-center gap-3 hover:bg-[rgb(var(--interactive-hover))] transition-colors text-left text-sm text-[rgb(var(--text-primary))]"
                    >
                        <Eye className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                        <span>Show/hide widgets</span>
                        <span className="ml-auto text-[rgb(var(--text-tertiary))]">›</span>
                    </button>
                    <div className="my-1 border-t border-[rgb(var(--border-secondary))]" />
                    <button
                        onClick={() => { onReset(); setIsOpen(false) }}
                        className="w-full px-3 py-2 flex items-center gap-3 text-left text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--interactive-hover))] transition-colors"
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
                    exit={{ opacity: 0, x: 4 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 top-full mt-1 z-50 w-52 py-1 bg-[rgb(var(--surface-primary))] border border-[rgb(var(--border-primary))] rounded-lg shadow-xl"
                    role="menu"
                >
                    <button
                        onClick={() => setShowWidgets(false)}
                        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-[rgb(var(--interactive-hover))] transition-colors text-left text-sm text-[rgb(var(--text-tertiary))] border-b border-[rgb(var(--border-secondary))] mb-1"
                    >
                        <span>‹</span>
                        <span>Back</span>
                    </button>
                    {widgets.map((widget) => (
                        <button
                            key={widget.id}
                            onClick={() => onToggle(widget.id)}
                            className="w-full px-3 py-2 flex items-center gap-3 hover:bg-[rgb(var(--interactive-hover))] transition-colors text-left text-sm"
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
// STAT CARD COMPONENT
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
            <div className="group relative flex flex-col w-[180px] h-[140px] p-4 rounded-2xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] shadow-sm transition-all duration-200 overflow-hidden">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
                    <stat.icon className={`w-4.5 h-4.5 ${stat.iconColor}`} />
                </div>
                <div className="mt-auto relative z-10">
                    <p className="text-xs text-[rgb(var(--text-tertiary))] mb-0.5 truncate">{stat.label}</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-[rgb(var(--text-primary))]">{stat.value}</span>
                        {stat.change && (
                            <div className={`flex items-center gap-0.5 text-xs ${
                                stat.changeType === 'positive' ? 'text-emerald-600' :
                                stat.changeType === 'negative' ? 'text-rose-600' :
                                'text-[rgb(var(--text-tertiary))]'
                            }`}>
                                <TrendIcon className="w-3 h-3" />
                                <span>{stat.change}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// ============================================================================
// STATS CAROUSEL
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

    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (!scrollRef.current) return
        const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY)
        if (isHorizontal || Math.abs(e.deltaY) > 0) {
            const scrollDelta = e.deltaX !== 0 ? e.deltaX : e.deltaY
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
            const atStart = scrollLeft <= 0
            const atEnd = scrollLeft >= scrollWidth - clientWidth
            if ((scrollDelta < 0 && !atStart) || (scrollDelta > 0 && !atEnd)) {
                e.preventDefault()
                scrollRef.current.scrollLeft += scrollDelta
            }
        }
    }, [])

    return (
        <div
            className="relative group/carousel px-4"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {isHovered && canScrollLeft && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => smoothScroll('left')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] shadow-lg text-[rgb(var(--text-tertiary))] hover:bg-[rgb(var(--interactive-hover))] hover:text-[rgb(var(--text-primary))] transition-all"
                    aria-label="Scroll left"
                >
                    <ChevronLeft className="w-5 h-5" />
                </motion.button>
            )}
            {isHovered && canScrollRight && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => smoothScroll('right')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] shadow-lg text-[rgb(var(--text-tertiary))] hover:bg-[rgb(var(--interactive-hover))] hover:text-[rgb(var(--text-primary))] transition-all"
                    aria-label="Scroll right"
                >
                    <ChevronRight className="w-5 h-5" />
                </motion.button>
            )}
            <div
                ref={scrollRef}
                onScroll={checkScrollPosition}
                onWheel={handleWheel}
                className="flex gap-3 overflow-x-auto scrollbar-none scroll-smooth py-2 -my-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {stats.map((stat, index) => (
                    <StatCard key={stat.label} stat={stat} index={index} />
                ))}
            </div>
            {/* Edge fade gradients */}
            <div
                className={`pointer-events-none absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[rgb(var(--surface-primary))] via-[rgb(var(--surface-primary))]/80 to-transparent transition-opacity duration-300 ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`}
            />
            <div
                className={`pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[rgb(var(--surface-primary))] via-[rgb(var(--surface-primary))]/80 to-transparent transition-opacity duration-300 ${canScrollRight ? 'opacity-100' : 'opacity-0'}`}
            />
        </div>
    )
}

// ============================================================================
// ACTION CARD COMPONENT
// ============================================================================

interface ActionCardInternalProps {
    card: ModuleActionCard
    delay?: number
    accentClasses: typeof accentColorClasses.teal
}

function ActionCard({ card, delay = 0, accentClasses }: ActionCardInternalProps) {
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

    return (
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
                    <Card className={`p-6 h-full hover:shadow-lg transition-shadow duration-300 cursor-pointer group border-[rgb(var(--border-primary))] ${accentClasses.cardHover}`}>
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
                        <h3 className={`font-semibold text-[rgb(var(--text-primary))] mb-1 ${accentClasses.titleHover} transition-colors`}>
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
// MAIN COMPONENT
// ============================================================================

export function ModuleOverviewPage({
    title,
    description,
    stats,
    actionCards,
    children,
    accentColor = 'teal',
}: ModuleOverviewPageProps) {
    // Local widget visibility state
    const [widgetVisibility, setWidgetVisibility] = useState({
        'quick-stats': true,
        'quick-access': true,
    })

    const widgets = [
        { id: 'quick-stats', label: 'Quick stats', visible: widgetVisibility['quick-stats'] },
        { id: 'quick-access', label: 'Quick access', visible: widgetVisibility['quick-access'] },
    ]

    const toggleWidget = (id: string) => {
        setWidgetVisibility(prev => ({ ...prev, [id]: !prev[id as keyof typeof prev] }))
    }

    const resetWidgets = () => {
        setWidgetVisibility({ 'quick-stats': true, 'quick-access': true })
    }

    const accentClasses = accentColorClasses[accentColor]

    return (
        <div className="space-y-10 max-w-6xl mx-auto pb-12 relative">
            {/* Three-dot menu in top right corner */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="absolute top-4 right-0 z-10"
            >
                <WidgetVisibilityMenu
                    widgets={widgets}
                    onToggle={toggleWidget}
                    onReset={resetWidgets}
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
                        className={`p-3 rounded-xl bg-gradient-to-br ${accentClasses.iconBg} border ${accentClasses.iconBorder} flex-shrink-0`}
                    >
                        <GalleryVerticalEnd className={`w-5 h-5 ${accentClasses.iconText}`} />
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
                    visible={widgetVisibility['quick-stats']}
                >
                    <StatsCarousel stats={stats} />
                </WidgetSection>
            )}

            {/* Quick Access Cards */}
            {actionCards.length > 0 && (
                <WidgetSection
                    label="Quick access"
                    icon={CloudLightning}
                    visible={widgetVisibility['quick-access']}
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {actionCards.map((card, index) => (
                            <ActionCard
                                key={card.id}
                                card={card}
                                delay={0.35 + index * 0.05}
                                accentClasses={accentClasses}
                            />
                        ))}
                    </div>
                </WidgetSection>
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

