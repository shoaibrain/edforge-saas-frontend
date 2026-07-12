import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from '@tanstack/react-router'
import { useThrottledScroll } from './hooks/useThrottledScroll'
import {
  Building2,
  GraduationCap,
  UserCircle,
  BookOpen,
  LifeBuoy,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  Activity,
  Wallet,
  Shield,
  FileText,
  Mail,
  Info,
} from 'lucide-react'
import type React from 'react'

// --- Types & Data ---

type NavItemType = 'link' | 'mega_menu'

interface MegaMenuItem {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  title: string
  description: string
  href: string
}

interface MegaMenuConfig {
  layout?: 'grid' | 'featured'
  header?: { title: string; description: string }
  items: MegaMenuItem[]
  footerItems?: { title: string; href: string; icon: React.ElementType }[]
}

interface NavItem {
  label: string
  type: NavItemType
  href?: string
  dropdown?: MegaMenuConfig
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Product',
    type: 'mega_menu',
    dropdown: {
      layout: 'featured',
      items: [
        {
          icon: Activity, iconBg: '#FFF7ED', iconColor: '#EA580C', title: 'EdForge Core',
          description: 'Student records, enrollment, and attendance in one place.', href: '/#platform',
        },
        {
          icon: GraduationCap, iconBg: '#ECFDF5', iconColor: '#059669', title: 'Academics',
          description: 'Classrooms, curriculum, exams, and at-risk alerts.', href: '/#platform',
        },
        {
          icon: Wallet, iconBg: '#FFFBEB', iconColor: '#D97706', title: 'Finance',
          description: 'Fee structures, invoicing, payments, and family billing.', href: '/#platform',
        },
      ],
      footerItems: [
        { title: 'Security', href: '/security', icon: Shield },
        { title: 'Contact Us', href: '/contact', icon: Mail },
        { title: 'About', href: '/about', icon: Info },
      ],
    },
  },
  {
    label: 'Solutions',
    type: 'mega_menu',
    dropdown: {
      layout: 'grid',
      header: { title: 'Built for the people running schools', description: 'See how EdForge works for each role' },
      items: [
        { icon: Building2, iconBg: '#FFF7ED', iconColor: '#EA580C', title: 'School Leaders', description: 'The whole school on one calm dashboard', href: '/#use-cases' },
        { icon: GraduationCap, iconBg: '#ECFDF5', iconColor: '#059669', title: 'Teachers & Families', description: 'Classrooms, child records, and guardians', href: '/#teachers-parents' },
        { icon: UserCircle, iconBg: '#F5F3FF', iconColor: '#7C3AED', title: 'Students', description: 'Every student, fully seen', href: '/#students' },
      ],
    },
  },
  {
    label: 'Resources',
    type: 'mega_menu',
    dropdown: {
      layout: 'grid',
      header: { title: 'Learn & Explore', description: 'How EdForge handles data, privacy, and terms' },
      items: [
        { icon: Shield, iconBg: '#FFF7ED', iconColor: '#EA580C', title: 'Security', description: 'How we protect student data', href: '/security' },
        { icon: FileText, iconBg: '#FFFBEB', iconColor: '#D97706', title: 'Privacy Policy', description: 'Our data privacy commitment', href: '/privacy' },
        { icon: BookOpen, iconBg: '#ECFDF5', iconColor: '#059669', title: 'Terms', description: 'Terms of service', href: '/terms' },
        { icon: LifeBuoy, iconBg: '#F5F3FF', iconColor: '#7C3AED', title: 'Contact', description: 'Questions, feedback, and demo access', href: '/contact' },
      ],
    },
  },
  // Company menu hidden for now (About/Contact/Security/Legal remain reachable
  // via the Product/Resources menus and the footer). Uncomment to restore.
  // {
  //   label: 'Company',
  //   type: 'mega_menu',
  //   dropdown: {
  //     layout: 'grid',
  //     header: { title: 'About EdForge', description: 'Learn about our mission and values' },
  //     items: [
  //       { icon: Info, iconBg: '#ECFDF5', iconColor: '#059669', title: 'About Us', description: 'Our mission and story', href: '/about' },
  //       { icon: Mail, iconBg: '#FFF7ED', iconColor: '#EA580C', title: 'Contact', description: 'Get in touch', href: '/contact' },
  //       { icon: Shield, iconBg: '#FFFBEB', iconColor: '#D97706', title: 'Security', description: 'How we protect your data', href: '/security' },
  //       { icon: FileText, iconBg: '#F5F3FF', iconColor: '#7C3AED', title: 'Legal', description: 'Privacy & Terms', href: '/privacy' },
  //     ],
  //   },
  // },
]

const MEGA_MENU_LABELS = NAV_ITEMS.filter((i) => i.type === 'mega_menu').map((i) => i.label)

// Helper: is this an internal route or a hash link?
function isInternalRoute(href: string): boolean {
  return href.startsWith('/') && !href.includes('#')
}

function NavLink({ href, className, style, children, onClick }: { href: string; className?: string; style?: React.CSSProperties; children: React.ReactNode; onClick?: () => void }) {
  const baseClasses = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F97316]"
  const finalClass = className ? `${className} ${baseClasses}` : baseClasses;

  if (isInternalRoute(href)) {
    return <Link to={href} className={finalClass} style={style} onClick={onClick} activeProps={{ 'aria-current': 'page' } as Record<string, string>}>{children}</Link>
  }
  return <a href={href} className={finalClass} style={style} onClick={onClick}>{children}</a>
}

// --- Main Component ---

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<Record<string, HTMLDivElement | null>>({})
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 })

  // Scroll detection (throttled to rAF)
  useThrottledScroll(useCallback(() => {
    setIsScrolled(window.scrollY > 20)
  }, []))

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Lock body scroll when mobile menu open + Escape to close
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false)
        setActiveDropdown(null)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleEscape)
    }
  }, [mobileMenuOpen])

  // Hover indicator
  useEffect(() => {
    if (hoveredItem && itemsRef.current[hoveredItem]) {
      const element = itemsRef.current[hoveredItem]
      if (element) {
        setIndicatorStyle({ left: element.offsetLeft, width: element.offsetWidth, opacity: 1 })
      }
    } else {
      setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }))
    }
  }, [hoveredItem])

  const activeIndex = activeDropdown ? MEGA_MENU_LABELS.indexOf(activeDropdown) : -1
  const showDropdown = activeIndex !== -1

  const navbarHeight = isScrolled ? 64 : 80

  return (
    <>
    <nav
      ref={navRef}
      aria-label="Main navigation"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
          ? 'h-16 backdrop-blur-2xl bg-[rgb(var(--background-elevated)/0.80)] border-b shadow-sm'
          : 'h-20 bg-transparent border-b border-transparent'
        }`}
      style={isScrolled ? {
        borderColor: 'rgba(226, 232, 240, 0.6)',
      } : undefined}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8 h-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group z-50 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F97316] p-1 -ml-1">
          <div className="relative w-10 h-10 flex items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 overflow-hidden">
            <img src="/logo.svg" alt="EdForge Logo" className="w-full h-full object-contain" />
          </div>
          <span
            className="text-xl font-bold tracking-tight text-[rgb(var(--text-primary))]"
          >
            EdForge
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-center absolute left-1/2 -translate-x-1/2">
          <div className="relative flex items-center gap-1">
            {/* Sliding Hover Indicator */}
            <div
              // allow-presentation-style: dynamic indicator position/size with decorative rgba fill
              className="absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-out"
              style={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
                opacity: indicatorStyle.opacity,
                backgroundColor: 'rgba(249, 115, 22, 0.08)',
              }}
            />

            {NAV_ITEMS.map((item) => (
              <div
                key={item.label}
                ref={(el) => { itemsRef.current[item.label] = el }}
                className="relative z-10"
                onMouseEnter={() => {
                  setHoveredItem(item.label)
                  if (item.type === 'mega_menu') setActiveDropdown(item.label)
                  else setActiveDropdown(null)
                }}
              >
                <button
                  // allow-presentation-style: color toggles on active/hover state
                  aria-haspopup={item.type === 'mega_menu' ? 'true' : undefined}
                  aria-expanded={item.type === 'mega_menu' ? activeDropdown === item.label : undefined}
                  aria-controls={item.type === 'mega_menu' ? `dropdown-${item.label}` : undefined}
                  onKeyDown={(e) => {
                    if (item.type !== 'mega_menu') return
                    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                      e.preventDefault()
                      setActiveDropdown(activeDropdown === item.label ? null : item.label)
                      setHoveredItem(item.label)
                    }
                    if (e.key === 'Escape') {
                      setActiveDropdown(null)
                      setHoveredItem(null)
                    }
                  }}
                  className="px-4 py-2 flex items-center gap-1.5 text-sm font-medium transition-colors duration-200 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F97316]"
                  style={{
                    color: activeDropdown === item.label || hoveredItem === item.label
                      ? 'rgb(var(--text-primary))'
                      : 'rgb(var(--text-secondary))',
                  }}
                >
                  {item.label}
                  {item.type === 'mega_menu' && (
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-300 ${activeDropdown === item.label ? 'rotate-180' : ''}`}
                    />
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Unified Dropdown Container */}
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 pt-4"
            onMouseLeave={() => { setActiveDropdown(null); setHoveredItem(null) }}
          >
            <div
              className={`relative backdrop-blur-xl border overflow-hidden transition-all duration-300 ease-out origin-top bg-[rgba(255,255,255,0.95)] border-[rgba(226,232,240,0.8)] shadow-[var(--lp-shadow-elevated)] ${showDropdown ? 'opacity-100 translate-y-0 scale-100 visible' : 'opacity-0 -translate-y-4 scale-95 invisible'
                }`}
              style={{
                width: 'min(900px, calc(100vw - 3rem))',
                height: '420px',
                borderRadius: 'var(--lp-radius-lg)',
              }}
            >
              {/* Carousel Wrapper */}
              <div
                className="flex h-full transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
                style={{ width: `calc(${MEGA_MENU_LABELS.length} * min(900px, calc(100vw - 3rem)))`, transform: `translateX(calc(-${activeIndex} * min(900px, calc(100vw - 3rem))))` }}
              >
                {NAV_ITEMS.filter((item) => item.type === 'mega_menu').map((item) => (
                  <div key={item.label} className="h-full flex-shrink-0" style={{ width: 'min(900px, calc(100vw - 3rem))' }}>
                    {item.dropdown?.layout === 'featured' ? (
                      <div className="flex flex-col h-full">
                        <div className="grid grid-cols-3 gap-4 p-6 flex-1">
                          {item.dropdown.items.map((subItem, idx) => (
                            <NavLink
                              key={idx}
                              href={subItem.href}
                              className="group flex flex-col p-5 transition-all duration-200 hover:shadow-md bg-[rgb(var(--background-primary))]"
                              style={{
                                borderRadius: 'var(--lp-radius-md)',
                                border: '1px solid rgba(226, 232, 240, 0.8)',
                              }}
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <div
                                  // allow-presentation-style: per-item data-driven icon background
                                  className="p-2.5 transition-all group-hover:scale-110"
                                  style={{
                                    borderRadius: 'var(--lp-radius-sm)',
                                    backgroundColor: subItem.iconBg,
                                  }}
                                >
                                  <subItem.icon
                                    // allow-presentation-style: per-item data-driven icon color
                                    className="w-5 h-5"
                                    style={{ color: subItem.iconColor }}
                                  />
                                </div>
                                <span className="font-semibold text-[rgb(var(--text-primary))]">{subItem.title}</span>
                              </div>
                              <p className="text-sm leading-snug text-[rgb(var(--text-secondary))]">{subItem.description}</p>
                            </NavLink>
                          ))}
                        </div>
                        {item.dropdown.footerItems && (
                          <div
                            className="p-4 grid grid-cols-3 gap-4 bg-[rgb(var(--background-primary))]"
                            style={{
                              borderTop: '1px solid rgba(226, 232, 240, 0.8)',
                            }}
                          >
                            {item.dropdown.footerItems.map((footerItem, idx) => (
                              <NavLink key={idx} href={footerItem.href} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[rgb(var(--background-secondary))] transition-colors group">
                                <div
                                  className="p-1.5 rounded-lg transition-colors bg-[rgba(249,115,22,0.06)] text-[rgb(var(--text-secondary))]"
                                >
                                  <footerItem.icon className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-[rgb(var(--text-secondary))]">{footerItem.title}</span>
                              </NavLink>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col h-full">
                        {item.dropdown?.header && (
                          <div className="p-8 border-b border-[rgba(226,232,240,0.8)]">
                            <h3 className="text-xl font-bold text-[rgb(var(--text-primary))]">{item.dropdown.header.title}</h3>
                            <p className="text-base mt-2 text-[rgb(var(--text-secondary))]">{item.dropdown.header.description}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 p-6 flex-1">
                          {item.dropdown?.items.map((subItem, idx) => (
                            <NavLink
                              key={idx}
                              href={subItem.href}
                              className="group flex items-start gap-4 p-4 transition-all duration-200 hover:shadow-md bg-[rgb(var(--background-primary))]"
                              style={{
                                borderRadius: 'var(--lp-radius-md)',
                                border: '1px solid rgba(226, 232, 240, 0.8)',
                              }}
                            >
                              <div
                                // allow-presentation-style: per-item data-driven icon background
                                className="flex-shrink-0 w-12 h-12 flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                                style={{
                                  borderRadius: 'var(--lp-radius-sm)',
                                  backgroundColor: subItem.iconBg,
                                }}
                              >
                                <subItem.icon
                                  // allow-presentation-style: per-item data-driven icon color
                                  className="w-6 h-6 transition-transform duration-300"
                                  style={{ color: subItem.iconColor }}
                                />
                              </div>
                              <div>
                                <div className="font-semibold flex items-center gap-2 text-base text-[rgb(var(--text-primary))]">
                                  {subItem.title}
                                  <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-[rgb(var(--text-tertiary))]" />
                                </div>
                                <p className="text-sm mt-1 leading-relaxed text-[rgb(var(--text-secondary))]">{subItem.description}</p>
                              </div>
                            </NavLink>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="hidden md:inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold transition-all hover:shadow-md hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F97316] bg-[#F97316] text-[#FFFFFF]"
            style={{
              borderRadius: 'var(--lp-radius-pill)',
            }}
          >
            Sign In
          </Link>
          {/* Mobile Toggle — 44x44px min touch target */}
          <button
            // allow-presentation-style: background toggles on mobileMenuOpen state
            className="md:hidden min-w-11 min-h-11 flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F97316] text-[rgb(var(--text-primary))]"
            style={{
              backgroundColor: mobileMenuOpen ? 'rgba(249, 115, 22, 0.08)' : 'transparent',
            }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

    </nav>

    {/* Mobile Menu — OUTSIDE <nav> to avoid backdrop-filter containing block issue.
        When the nav has backdrop-blur (scrolled state), backdrop-filter makes the nav
        the containing block for position:fixed children, breaking the menu dimensions. */}
    <div
      className={`md:hidden transition-opacity duration-300 bg-[#FAF9F6] ${mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
      style={{
        position: 'fixed',
        top: navbarHeight,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 40,
      }}
    >
      <div className="flex flex-col" style={{ height: '100%' }}>
        {/* Scrollable nav links */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {NAV_ITEMS.filter((item) => item.type === 'mega_menu').map((item) => (
              <div key={item.label}>
                <div
                  className="mb-2 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-tertiary))]"
                >
                  {item.label}
                </div>
                <div className="space-y-0.5">
                  {item.dropdown?.items.map((subItem, idx) => (
                    <NavLink
                      key={idx}
                      href={subItem.href}
                      className="flex items-center gap-3 rounded-xl px-2 py-2.5 min-h-11 transition-colors touch-manipulation hover:bg-[rgb(var(--background-secondary))]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <subItem.icon
                        // allow-presentation-style: per-item data-driven icon color
                        className="w-4 h-4 shrink-0"
                        style={{ color: subItem.iconColor }}
                      />
                      <span className="text-sm font-medium text-[rgb(var(--text-primary))]">{subItem.title}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sign In CTA — pinned at bottom, always visible */}
        <div className="p-4" style={{ borderTop: '1px solid rgba(226, 232, 240, 0.8)' }}>
          <Link
            to="/login"
            className="lp-nav-signin flex items-center justify-center w-full min-h-12 py-3 font-semibold transition-all hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F97316] bg-[#F97316] text-[#FFFFFF]"
            style={{
              borderRadius: 'var(--lp-radius-pill)',
            }}
            onClick={() => setMobileMenuOpen(false)}
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
    </>
  )
}
