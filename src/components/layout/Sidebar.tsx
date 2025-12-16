/**
 * Dynamic Sidebar Component
 * 
 * A context-aware sidebar that changes navigation items based on the current route/module.
 * Features ABAC permission filtering and smooth spring-based animations.
 */

import { useState, useEffect } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { useSpring, animated, config } from '@react-spring/web'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  ChevronLeft,
  Building2,
  Command,
  ArrowLeft,
  type LucideIcon,
} from 'lucide-react'
import { useAppStore } from '@/stores/app.store'
import { useSidebarStore } from '@/stores/sidebar.store'
import { 
  SIDEBAR_NAV_ICON_SIZE, 
  SIDEBAR_HEADER_ICON_SIZE, 
  SIDEBAR_TOGGLE_ICON_SIZE,
  SIDEBAR_BADGE_ICON_SIZE 
} from '@/config/ui-constants'
import { useSidebarModule, useActiveNavItem } from '@/hooks/useSidebarModule'
import { useSecureNavGroups } from '@/hooks/useSecureNavItems'
import type { NavItem, NavItemGroup } from '@/config/sidebar-modules'
import { Tooltip } from '@/components/ui/Tooltip'
import { cn } from '@/lib/utils'

// ============================================================================
// ANIMATED NAV ICON WITH REACT-SPRING
// ============================================================================

function AnimatedNavIcon({ 
  icon: Icon, 
  isActive, 
  isHovered,
  isDanger,
}: { 
  icon: LucideIcon
  isActive: boolean
  isHovered: boolean
  isDanger?: boolean
}) {
  const spring = useSpring({
    scale: isHovered && !isActive ? 1.15 : 1,
    rotate: isHovered && !isActive ? 6 : 0,
    config: { tension: 400, friction: 17 },
  })

  const glowSpring = useSpring({
    opacity: isHovered && !isActive ? 0.8 : 0,
    scale: isHovered && !isActive ? 1.4 : 0.8,
    config: config.gentle,
  })

  return (
    <animated.div
      style={{
        transform: spring.scale.to(s => `scale(${s}) rotate(${spring.rotate.get()}deg)`),
      }}
      className="relative flex items-center justify-center flex-shrink-0"
    >
      <Icon 
        size={SIDEBAR_NAV_ICON_SIZE}
        className={cn(
          'transition-colors duration-200 relative z-10',
          isActive && !isDanger && 'text-teal-600 dark:text-cyan-400',
          isActive && isDanger && 'text-rust-500',
          !isActive && 'text-[rgb(var(--icon-inactive))] hover:text-[rgb(var(--icon-inactive-hover))]'
        )} 
      />
      {/* Glow effect */}
      <animated.div
        style={{
          opacity: glowSpring.opacity,
          transform: glowSpring.scale.to(s => `scale(${s})`),
        }}
        className={cn(
          'absolute inset-0 rounded-full blur-md',
          isDanger ? 'bg-rust-500/25' : 'bg-teal-500/25 dark:bg-cyan-500/25'
        )}
      />
    </animated.div>
  )
}

// ============================================================================
// NAV ITEM LINK
// ============================================================================

function NavItemLink({ 
  item, 
  collapsed, 
  isActive,
  index,
}: { 
  item: NavItem
  collapsed: boolean
  isActive: boolean
  index: number
}) {
  const [isHovered, setIsHovered] = useState(false)
  const isDanger = item.variant === 'danger'

  const hoverSpring = useSpring({
    backgroundColor: isHovered && !isActive 
      ? 'rgba(100, 116, 139, 0.06)' 
      : 'rgba(0, 0, 0, 0)',
    config: { tension: 300, friction: 30 },
  })

  const linkContent = (
    <Link
      to={item.href || '#'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="block relative"
    >
      <animated.div
        style={hoverSpring}
        className={cn(
          'relative flex items-center rounded-xl transition-colors duration-200',
          collapsed ? 'justify-center px-3 py-2.5' : 'gap-3 px-3 py-2.5'
        )}
      >
        {/* Active background pill */}
        {isActive && (
          <motion.div
            layoutId="activeNavBg"
            className={cn(
              'absolute inset-0 rounded-xl',
              isDanger
                ? 'bg-rust-500/10'
                : 'bg-gradient-to-r from-teal-500/12 to-cyan-500/8 dark:from-teal-500/15 dark:to-cyan-500/10'
            )}
            initial={false}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 35,
            }}
          />
        )}

        {/* Active indicator line */}
        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            className={cn(
              'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full',
              isDanger ? 'bg-rust-500' : 'bg-gradient-to-b from-teal-500 to-cyan-500'
            )}
            initial={false}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 35,
            }}
          />
        )}
        
        {/* Icon */}
        <AnimatedNavIcon 
          icon={item.icon} 
          isActive={isActive} 
          isHovered={isHovered}
          isDanger={isDanger}
        />

        {/* Label - animated visibility */}
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'text-sm font-medium whitespace-nowrap overflow-hidden relative z-10',
                isActive && !isDanger && 'text-teal-700 dark:text-cyan-300',
                isActive && isDanger && 'text-rust-600 dark:text-rust-400',
                !isActive && !isDanger && 'text-[rgb(var(--text-secondary))]',
                !isActive && isDanger && 'text-rust-500/80'
              )}
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Badge */}
        <AnimatePresence>
          {item.badge && !collapsed && (
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="ml-auto px-2 py-0.5 text-[10px] font-semibold rounded-full bg-golden-400/20 text-golden-600 dark:text-golden-400 relative z-10"
            >
              {item.badge}
            </motion.span>
          )}
        </AnimatePresence>
      </animated.div>
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip content={item.label} side="right" sideOffset={12}>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.03, type: 'spring', stiffness: 400, damping: 25 }}
        >
          {linkContent}
        </motion.div>
      </Tooltip>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, type: 'spring', stiffness: 400, damping: 25 }}
    >
      {linkContent}
    </motion.div>
  )
}

// ============================================================================
// NAV GROUP
// ============================================================================

function NavGroup({
  group,
  collapsed,
  activeItemId,
  startIndex,
}: {
  group: NavItemGroup
  collapsed: boolean
  activeItemId: string | null
  startIndex: number
}) {
  return (
    <div className="space-y-0.5">
      {/* Group header */}
      {group.label && !collapsed && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-3 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--text-tertiary))]"
        >
          {group.label}
        </motion.p>
      )}
      
      {/* Group items */}
      {group.items.map((item, idx) => (
        <NavItemLink
          key={item.id}
          item={item}
          collapsed={collapsed}
          isActive={activeItemId === item.id}
          index={startIndex + idx}
        />
      ))}
    </div>
  )
}

// ============================================================================
// UNIFIED HOME NAV BUTTON
// Consolidates Home and Back to Home into a single smart component
// ============================================================================

function HomeNavButton({ 
  collapsed, 
  isSubModule 
}: { 
  collapsed: boolean
  isSubModule: boolean 
}) {
  const location = useLocation()
  const [hovered, setHovered] = useState(false)
  
  // Determine state based on context
  const isAtHome = location.pathname === '/home' || location.pathname === '/'
  const isActive = !isSubModule && isAtHome
  const showBackMode = isSubModule
  
  // Dynamic icon and label
  const CurrentIcon = showBackMode ? ArrowLeft : Home
  const label = showBackMode ? 'Back to Home' : 'Home'
  
  // Hover animation - arrow moves left when in back mode
  const hoverSpring = useSpring({
    x: showBackMode && hovered ? -4 : 0,
    backgroundColor: hovered && !isActive ? 'rgba(100, 116, 139, 0.08)' : 'rgba(0, 0, 0, 0)',
    config: { tension: 400, friction: 25 },
  })

  const linkContent = (
    <Link
      to="/home"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="block relative"
    >
      <animated.div
        style={{ backgroundColor: hoverSpring.backgroundColor }}
        className={cn(
          'relative flex items-center rounded-xl transition-colors duration-200',
          collapsed ? 'justify-center px-3 py-2.5' : 'gap-3 px-3 py-2.5'
        )}
      >
        {/* Active indicator - only show when on Home module at Home page */}
        {isActive && (
          <motion.div
            layoutId="homeActiveIndicator"
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-500/12 to-cyan-500/8 dark:from-teal-500/15 dark:to-cyan-500/10"
          />
        )}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-teal-500 to-cyan-500" />
        )}
        
        {/* Animated icon container */}
        <animated.div
          style={{ transform: hoverSpring.x.to(x => `translateX(${x}px)`) }}
          className="relative z-10 flex-shrink-0"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={showBackMode ? 'back' : 'home'}
              initial={{ opacity: 0, scale: 0.8, rotate: showBackMode ? 90 : -90 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotate: showBackMode ? -90 : 90 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <CurrentIcon 
                size={SIDEBAR_NAV_ICON_SIZE}
                className={cn(
                  'transition-colors duration-200',
                  isActive && 'text-teal-600 dark:text-cyan-400',
                  !isActive && showBackMode && 'text-[rgb(var(--text-secondary))]',
                  !isActive && !showBackMode && 'text-[rgb(var(--icon-inactive))] hover:text-[rgb(var(--icon-inactive-hover))]'
                )} 
              />
            </motion.div>
          </AnimatePresence>
        </animated.div>
        
        {/* Label */}
        {!collapsed && (
          <AnimatePresence mode="wait">
            <motion.span
              key={label}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'text-sm font-medium relative z-10 whitespace-nowrap',
                isActive && 'text-teal-700 dark:text-cyan-300',
                !isActive && 'text-[rgb(var(--text-secondary))]'
              )}
            >
              {label}
            </motion.span>
          </AnimatePresence>
        )}
      </animated.div>
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip content={label} side="right" sideOffset={12}>
        {linkContent}
      </Tooltip>
    )
  }

  return linkContent
}

// ============================================================================
// COLLAPSE TOGGLE BUTTON
// ============================================================================

function CollapseToggle({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const [hovered, setHovered] = useState(false)
  
  const spring = useSpring({
    scale: hovered ? 1.05 : 1,
    config: config.wobbly,
  })

  const rotateSpring = useSpring({
    rotate: collapsed ? 180 : 0,
    config: { tension: 300, friction: 25 },
  })

  const buttonContent = (
    <animated.button
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform: spring.scale.to(s => `scale(${s})`),
      }}
      className={cn(
        'flex items-center justify-center gap-2 rounded-xl',
        'bg-[rgb(var(--surface-tertiary))] hover:bg-[rgb(var(--interactive-active))]',
        'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]',
        'border border-[rgb(var(--border-primary))]',
        'transition-colors duration-200',
        collapsed ? 'w-9 h-9' : 'px-2 py-1.5'
      )}
    >
      <animated.div
        style={{
          transform: rotateSpring.rotate.to(r => `rotate(${r}deg)`),
        }}
      >
        <ChevronLeft size={SIDEBAR_TOGGLE_ICON_SIZE} />
      </animated.div>
      {!collapsed && (
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] rounded text-[rgb(var(--text-tertiary))]">
          <Command size={SIDEBAR_BADGE_ICON_SIZE} />
          <span>B</span>
        </kbd>
      )}
    </animated.button>
  )

  if (collapsed) {
    return (
      <Tooltip content="Expand sidebar (⌘B)" side="right" sideOffset={12}>
        {buttonContent}
      </Tooltip>
    )
  }

  return buttonContent
}

// ============================================================================
// LOGO ICON
// ============================================================================

function LogoIcon() {
  const [hovered, setHovered] = useState(false)
  
  const spring = useSpring({
    scale: hovered ? 1.08 : 1,
    rotate: hovered ? 5 : 0,
    config: config.wobbly,
  })

  return (
    <animated.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform: spring.scale.to(s => `scale(${s}) rotate(${spring.rotate.get()}deg)`),
      }}
      className="w-9 h-9 rounded-xl brand-gradient flex items-center justify-center shadow-lg shadow-teal-500/20 flex-shrink-0"
    >
      <Building2 size={SIDEBAR_HEADER_ICON_SIZE} className="text-white" />
    </animated.div>
  )
}

// ============================================================================
// MAIN SIDEBAR COMPONENT
// ============================================================================

export function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const setModule = useSidebarStore((s) => s.setModule)
  
  // Get current module based on route
  const { moduleId, config, isSubModule } = useSidebarModule()
  const activeItemId = useActiveNavItem()
  
  // Filter groups based on permissions
  const filteredGroups = useSecureNavGroups(config.groups)

  // Update sidebar store when module changes
  useEffect(() => {
    setModule(moduleId)
  }, [moduleId, setModule])

  // React-spring for sidebar width
  const sidebarSpring = useSpring({
    width: collapsed ? 72 : 260,
    config: { tension: 280, friction: 32 },
  })

  // Keyboard shortcut for collapse/expand
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar])

  // Calculate cumulative index for stagger animation
  let itemIndex = 0

  return (
    <animated.aside
      style={{ width: sidebarSpring.width }}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-[rgb(var(--surface-secondary))] border-r border-[rgb(var(--border-primary))]"
    >
      {/* Header */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-[rgb(var(--border-secondary))]',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        <Link to="/home" className={cn('flex items-center', collapsed ? '' : 'gap-3')}>
          <LogoIcon />
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <span className="font-bold text-lg text-[rgb(var(--text-primary))]">Edforge</span>
                <p className="text-[10px] text-[rgb(var(--text-tertiary))] font-medium tracking-wide">EMIS Platform</p>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <CollapseToggle collapsed={collapsed} onToggle={toggleSidebar} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={moduleId}
            initial={{ opacity: 0, x: isSubModule ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isSubModule ? -20 : 20 }}
            transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 30 }}
            className="space-y-1"
          >
            {/* Unified Home/Back button - Always visible, adapts to context */}
            <div className="mb-3 pb-2 border-b border-[rgb(var(--border-secondary))]">
              <HomeNavButton collapsed={collapsed} isSubModule={isSubModule} />
            </div>

            {/* Module navigation groups */}
            {filteredGroups.map((group) => {
              const groupStartIndex = itemIndex
              itemIndex += group.items.length
              
              return (
                <NavGroup
                  key={group.id}
                  group={group}
                  collapsed={collapsed}
                  activeItemId={activeItemId}
                  startIndex={groupStartIndex}
                />
              )
            })}
          </motion.div>
        </AnimatePresence>
      </nav>

      {/* Footer - Collapse toggle when collapsed */}
      {collapsed && (
        <div className="border-t border-[rgb(var(--border-secondary))] p-2.5 flex justify-center">
          <CollapseToggle collapsed={collapsed} onToggle={toggleSidebar} />
        </div>
      )}
    </animated.aside>
  )
}
