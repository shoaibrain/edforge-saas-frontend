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
  School,
  BarChart3,
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
  iconColor: string
  title: string
  description: string
  href: string
  visual?: React.ReactNode
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
          icon: Activity, iconColor: '#e76f51', title: 'EdForge Core',
          description: 'Central nervous system for school ops.', href: '/about',
          visual: (
            <div className="w-full h-24 mt-3 rounded-md bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/10 flex items-center justify-center overflow-hidden relative">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px]" />
              <div className="w-3/4 h-3/4 bg-[#0f172a] rounded border border-white/5 flex flex-col p-2 gap-2 shadow-2xl">
                <div className="w-full h-1.5 bg-orange-500/40 rounded-full" />
                <div className="w-2/3 h-1.5 bg-orange-500/20 rounded-full" />
                <div className="w-full h-1.5 bg-orange-500/10 rounded-full mt-auto" />
              </div>
            </div>
          ),
        },
        {
          icon: BarChart3, iconColor: '#2a9d8f', title: 'Analytics',
          description: 'Real-time student performance insights.', href: '/about',
          visual: (
            <div className="w-full h-24 mt-3 rounded-md bg-gradient-to-br from-teal-500/10 to-teal-500/5 border border-teal-500/10 flex items-center justify-center overflow-hidden relative">
              <div className="absolute bottom-0 left-0 right-0 h-12 flex items-end justify-around px-4 pb-2 gap-1">
                <div className="w-3 h-6 bg-teal-500/40 rounded-t-[2px]" />
                <div className="w-3 h-10 bg-teal-500/60 rounded-t-[2px]" />
                <div className="w-3 h-4 bg-teal-500/30 rounded-t-[2px]" />
                <div className="w-3 h-8 bg-teal-500/50 rounded-t-[2px]" />
              </div>
            </div>
          ),
        },
        {
          icon: Wallet, iconColor: '#e9c46a', title: 'Finance',
          description: 'Automated payroll and fee management.', href: '/about',
          visual: (
            <div className="w-full h-24 mt-3 rounded-md bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/10 flex items-center justify-center overflow-hidden relative">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                <span className="text-yellow-500 font-bold">$</span>
              </div>
            </div>
          ),
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
      header: { title: 'Tailored for every stakeholder', description: 'Tools designed for the entire education ecosystem' },
      items: [
        { icon: School, iconColor: '#e76f51', title: 'For Schools', description: 'Enterprise-grade EMIS for K-12', href: '/about' },
        { icon: Building2, iconColor: '#2a9d8f', title: 'For Districts', description: 'Multi-school management at scale', href: '/about' },
        { icon: GraduationCap, iconColor: '#e9c46a', title: 'For Teachers', description: 'Streamline classroom operations', href: '/about' },
        { icon: UserCircle, iconColor: '#f4a261', title: 'For Parents', description: 'Stay connected with student progress', href: '/about' },
      ],
    },
  },
  {
    label: 'Resources',
    type: 'mega_menu',
    dropdown: {
      layout: 'grid',
      header: { title: 'Learn & Explore', description: 'Resources to help you get the most out of EdForge' },
      items: [
        { icon: BookOpen, iconColor: '#2a9d8f', title: 'Documentation', description: 'Complete guides and docs', href: '/about' },
        { icon: Shield, iconColor: '#e76f51', title: 'Security', description: 'How we protect student data', href: '/security' },
        { icon: FileText, iconColor: '#e9c46a', title: 'Privacy Policy', description: 'Our data privacy commitment', href: '/privacy' },
        { icon: LifeBuoy, iconColor: '#f4a261', title: 'Support Center', description: 'Get expert help', href: '/contact' },
      ],
    },
  },
  {
    label: 'Company',
    type: 'mega_menu',
    dropdown: {
      layout: 'grid',
      header: { title: 'About EdForge', description: 'Learn about our mission and values' },
      items: [
        { icon: Info, iconColor: '#2a9d8f', title: 'About Us', description: 'Our mission and story', href: '/about' },
        { icon: Mail, iconColor: '#e76f51', title: 'Contact', description: 'Get in touch with our team', href: '/contact' },
        { icon: Shield, iconColor: '#e9c46a', title: 'Security', description: 'How we protect your data', href: '/security' },
        { icon: FileText, iconColor: '#f4a261', title: 'Legal', description: 'Privacy & Terms', href: '/privacy' },
      ],
    },
  },
]

const MEGA_MENU_LABELS = NAV_ITEMS.filter((i) => i.type === 'mega_menu').map((i) => i.label)

// Helper: is this an internal route or a hash link?
function isInternalRoute(href: string): boolean {
  return href.startsWith('/') && !href.includes('#')
}

function NavLink({ href, className, children, onClick }: { href: string; className?: string; children: React.ReactNode; onClick?: () => void }) {
  if (isInternalRoute(href)) {
    return <Link to={href} className={className} onClick={onClick}>{children}</Link>
  }
  return <a href={href} className={className} onClick={onClick}>{children}</a>
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

  return (
    <nav
      ref={navRef}
      aria-label="Main navigation"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'h-20 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/10 shadow-lg'
          : 'h-24 bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8 h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group z-50">
          <div className="relative w-10 h-10 flex items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 overflow-hidden">
            <img src="/logo-white.svg" alt="EdForge Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white via-white to-[#95bece] bg-clip-text text-transparent tracking-tight">
            EdForge
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-center absolute left-1/2 -translate-x-1/2">
          <div className="relative flex items-center gap-1">
            {/* Sliding Hover Indicator */}
            <div
              className="absolute top-1 bottom-1 rounded-full bg-white/10 transition-all duration-300 ease-out"
              style={{ left: indicatorStyle.left, width: indicatorStyle.width, opacity: indicatorStyle.opacity }}
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
                  className={`px-4 py-2 flex items-center gap-1.5 text-sm font-medium transition-colors duration-200 rounded-full ${
                    activeDropdown === item.label || hoveredItem === item.label
                      ? 'text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
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
            className="absolute top-full left-1/2 -translate-x-1/2 pt-6"
            onMouseLeave={() => { setActiveDropdown(null); setHoveredItem(null) }}
          >
            <div
              className={`relative bg-[#0f172a]/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ease-out origin-top ${
                showDropdown ? 'opacity-100 translate-y-0 scale-100 visible' : 'opacity-0 -translate-y-4 scale-95 invisible'
              }`}
              style={{ width: 'min(900px, calc(100vw - 3rem))', height: '420px' }}
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
                              className="group flex flex-col p-4 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] border border-white/10 transition-all duration-200"
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-all">
                                  <subItem.icon className="w-5 h-5" style={{ color: subItem.iconColor }} />
                                </div>
                                <span className="font-semibold text-white">{subItem.title}</span>
                              </div>
                              <p className="text-sm text-slate-400 leading-snug mb-2">{subItem.description}</p>
                              {subItem.visual}
                            </NavLink>
                          ))}
                        </div>
                        {item.dropdown.footerItems && (
                          <div className="bg-white/5 border-t border-white/5 p-4 grid grid-cols-3 gap-4">
                            {item.dropdown.footerItems.map((footerItem, idx) => (
                              <NavLink key={idx} href={footerItem.href} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group">
                                <div className="p-1.5 bg-white/5 rounded-md border border-white/5 text-slate-400 group-hover:text-white transition-colors">
                                  <footerItem.icon className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium text-slate-400 group-hover:text-white">{footerItem.title}</span>
                              </NavLink>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col h-full">
                        {item.dropdown?.header && (
                          <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                            <h3 className="text-xl font-bold text-white">{item.dropdown.header.title}</h3>
                            <p className="text-base text-slate-400 mt-2">{item.dropdown.header.description}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 p-6 flex-1">
                          {item.dropdown?.items.map((subItem, idx) => (
                            <NavLink
                              key={idx}
                              href={subItem.href}
                              className="group flex items-start gap-4 p-4 rounded-xl bg-[#1e293b] hover:bg-[#334155] border border-white/10 transition-colors duration-200"
                            >
                              <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center bg-white/5 border border-white/5 group-hover:border-white/10 transition-all duration-300 group-hover:scale-110">
                                <subItem.icon className="w-6 h-6 transition-transform duration-300" style={{ color: subItem.iconColor }} />
                              </div>
                              <div>
                                <div className="font-semibold text-white flex items-center gap-2 text-base">
                                  {subItem.title}
                                  <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-white/50" />
                                </div>
                                <p className="text-sm text-slate-400 mt-1 leading-relaxed">{subItem.description}</p>
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
            className="hidden md:inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/20 text-sm font-medium text-white hover:bg-white/10 transition-colors"
          >
            Sign In
          </Link>
          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu — two-column categorized layout */}
      <div
        className={`md:hidden fixed inset-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-xl transition-all duration-300 ${
          mobileMenuOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-4 invisible pointer-events-none'
        }`}
        style={{ top: '80px' }}
      >
        <div className="flex flex-col h-[calc(100vh-80px)] overflow-y-auto p-4 pt-4">
          {/* Sign In CTA — immediately visible at top */}
          <div className="pb-4 mb-4 border-b border-white/10">
            <Link
              to="/login"
              className="flex items-center justify-center w-full min-h-[44px] py-3 rounded-full bg-gradient-to-r from-[#e76f51] to-[#f4a261] text-white font-semibold transition-all hover:shadow-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Link>
          </div>

          {/* Two-column categorized grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {NAV_ITEMS.filter((item) => item.type === 'mega_menu').map((item) => (
              <div key={item.label}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                  {item.label}
                </div>
                <div className="space-y-0.5">
                  {item.dropdown?.items.map((subItem, idx) => (
                    <NavLink
                      key={idx}
                      href={subItem.href}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 min-h-[44px] text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <subItem.icon className="w-4 h-4 shrink-0" style={{ color: subItem.iconColor }} />
                      <span className="text-sm font-medium">{subItem.title}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
