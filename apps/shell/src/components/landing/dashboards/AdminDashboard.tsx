import { memo, useState, useEffect, useRef } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { useReducedMotion } from '../hooks/useReducedMotion'
import {
  Building2,
  GraduationCap,
  Users,
  TrendingUp,
  UserCheck,
  AlertCircle,
  School,
  ArrowRight,
  BrainCircuit,
} from 'lucide-react'

type AdminDashboardState = 'overview' | 'multi-campus' | 'hr' | 'analytics'

interface AdminDashboardProps {
  activeState: AdminDashboardState
}

const overviewData = [
  { name: 'Jan', budget: 4000, actual: 2400 },
  { name: 'Feb', budget: 3000, actual: 1398 },
  { name: 'Mar', budget: 2000, actual: 9800 },
  { name: 'Apr', budget: 2780, actual: 3908 },
  { name: 'May', budget: 1890, actual: 4800 },
  { name: 'Jun', budget: 2390, actual: 3800 },
  { name: 'Jul', budget: 3490, actual: 4300 },
]

const campusData = [
  { name: 'Lincoln High', type: 'High School', students: 1240, staff: 85, health: 98, status: 'Optimal', icon: Building2 },
  { name: 'Washington MS', type: 'Middle School', students: 850, staff: 62, health: 92, status: 'Good', icon: School },
  { name: 'Jefferson Elem', type: 'Elementary', students: 600, staff: 45, health: 88, status: 'Attention', icon: School },
]

const hrData = [
  { name: 'Teaching', value: 65, color: '#F97316' },
  { name: 'Admin', value: 15, color: '#2A9D8F' },
  { name: 'Support', value: 20, color: '#8B5CF6' },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="p-3"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(226,232,240,0.8)',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          minWidth: '140px'
        }}
      >
        {label && <p className="mb-2 pb-2 border-b border-slate-100 font-semibold" style={{ fontSize: '12px', color: 'rgb(var(--text-primary))' }}>{label}</p>}
        {payload.map((entry: any, index: number) => {
          let formattedValue = entry.value
          if (entry.dataKey === 'actual' || entry.dataKey === 'budget') {
            formattedValue = `$${entry.value.toLocaleString()}`
          } else if (entry.name !== 'value') {
            formattedValue = `${entry.value}%`
          }

          const displayName = entry.name === 'actual' ? 'Actual' : entry.name === 'budget' ? 'Budget' : entry.name
          const dotColor = entry.color || entry.payload?.fill || entry.stroke || '#000'

          return (
            <div key={index} className="flex items-center justify-between gap-4 mb-1.5 last:mb-0" style={{ fontSize: '12px' }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
                <span style={{ color: 'rgb(var(--text-secondary))', fontWeight: '500' }}>{displayName}</span>
              </div>
              <span className="font-bold tabular-nums" style={{ color: 'rgb(var(--text-primary))' }}>
                {formattedValue}
              </span>
            </div>
          )
        })}
      </div>
    )
  }
  return null
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const staggerChild = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const staggerNone = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0, transition: { duration: 0 } },
}

function UITooltip({ children, content }: { children: React.ReactNode; content: React.ReactNode }) {
  const [isHovered, setIsHovered] = useState(false)

  // If the user prefers reduced motion, we can still show it but without animation
  const prefersReducedMotion = useReducedMotion()

  return (
    <div
      className="relative flex items-center justify-center cursor-help"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 5 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 z-50 whitespace-nowrap rounded-md bg-slate-800 px-3 py-2 text-xs font-medium text-white shadow-xl pointer-events-none"
          >
            {content}
            <div className="absolute left-1/2 top-full -mt-[1px] -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function AdminDashboard({ activeState }: AdminDashboardProps) {
  const prefersReducedMotion = useReducedMotion()
  const childVariant = prefersReducedMotion ? staggerNone : staggerChild

  return (
    <div
      role="img"
      aria-label="Administrative dashboard demonstration showing school management features"
      className="relative overflow-hidden transition-all duration-500 flex flex-col h-[min(480px,65vh)] md:h-[min(560px,70vh)]"
      style={{
        borderRadius: 'var(--lp-radius-xl)',
      }}
    >
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: 'url(/classroom-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.15,
          mixBlendMode: 'multiply'
        }}
      />
      <div className="flex-1 overflow-hidden p-5 relative z-10" style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)' }}>
        <AnimatePresence mode="wait">
          {activeState === 'overview' && (
            <motion.div
              key="overview"
              className="h-full overflow-hidden lp-dashboard-state"
              initial={prefersReducedMotion ? 'visible' : 'hidden'}
              animate="visible"
              exit={{ opacity: 0 }}
              variants={staggerContainer}
              transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <motion.div variants={childVariant} className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="tracking-tight" style={{ fontSize: 'var(--lp-font-dashboard-title)', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>District Overview</h2>
                  <p style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-tertiary))' }}>Real-time performance metrics.</p>
                </div>
              </motion.div>

              <motion.div variants={childVariant} className="grid gap-3 grid-cols-2 lg:grid-cols-3">
                <UITooltip content="Compared to last month">
                  <MetricCard title="Total Students" value="45,231" trend="+2.5%" trendUp icon={GraduationCap} color="#F97316" bgColor="#FFF7ED" reduced={prefersReducedMotion} />
                </UITooltip>
                <UITooltip content="Compared to last month">
                  <MetricCard title="Total Staff" value="3,402" trend="+1.2%" trendUp icon={Users} color="#2A9D8F" bgColor="#ECFDF5" reduced={prefersReducedMotion} />
                </UITooltip>
                <UITooltip content="Compared to last month">
                  <MetricCard title="Avg Attendance" value="94.2%" trend="+0.8%" trendUp icon={UserCheck} color="#8B5CF6" bgColor="#F5F3FF" reduced={prefersReducedMotion} />
                </UITooltip>
              </motion.div>

              <motion.div variants={childVariant} className="mt-5 grid gap-5 md:grid-cols-7">
                <div
                  className="col-span-4 lp-dashboard-card"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid rgba(226,232,240,0.8)',
                    borderRadius: 'var(--lp-radius-md)',
                    padding: 'var(--lp-card-padding)',
                    boxShadow: 'var(--lp-shadow-card)',
                  }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 style={{ fontSize: '0.8125rem', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Financial Performance</h3>
                    <select
                      className="px-2 py-0.5 outline-none"
                      style={{ fontSize: '10px', backgroundColor: 'rgb(var(--surface-primary))', border: '1px solid rgba(226,232,240,0.8)', borderRadius: '8px', color: 'rgb(var(--text-primary))' }}
                    >
                      <option>This Year</option>
                      <option>Last Year</option>
                    </select>
                  </div>
                  <div className="h-[160px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={overviewData}>
                        <defs>
                          <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F97316" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226,232,240,0.6)" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} dx={-10} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(226,232,240,0.4)' }} />
                        <Area type="monotone" dataKey="actual" stroke="#F97316" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBudget)" activeDot={{ r: 6, stroke: '#FFFFFF', strokeWidth: 2 }} isAnimationActive={!prefersReducedMotion} animationDuration={1200} animationEasing="ease-out" animationBegin={300} />
                        <Area type="monotone" dataKey="budget" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" fill="none" activeDot={{ r: 5, stroke: '#FFFFFF', strokeWidth: 2 }} isAnimationActive={!prefersReducedMotion} animationDuration={1200} animationEasing="ease-out" animationBegin={500} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div
                  className="col-span-3 lp-dashboard-card"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid rgba(226,232,240,0.8)',
                    borderRadius: 'var(--lp-radius-md)',
                    padding: 'var(--lp-card-padding)',
                    boxShadow: 'var(--lp-shadow-card)',
                  }}
                >
                  <h3 className="mb-3" style={{ fontSize: '0.8125rem', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Action Items</h3>
                  <div className="space-y-2.5">
                    {[
                      { title: 'Budget Review', desc: 'Q3 allocation pending', color: '#EF4444' },
                      { title: 'Staff Hiring', desc: '3 Science positions', color: '#F59E0B' },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-2.5 transition-colors"
                        style={{
                          backgroundColor: 'rgb(var(--surface-primary))',
                          border: '1px solid rgba(226,232,240,0.8)',
                          borderRadius: 'var(--lp-radius-sm)',
                        }}
                      >
                        <div className="mt-1 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <div>
                          <div style={{ fontSize: 'var(--lp-font-label)', fontWeight: 'var(--lp-weight-label)', color: 'rgb(var(--text-primary))' }}>{item.title}</div>
                          <div style={{ fontSize: '10px', color: 'rgb(var(--text-tertiary))' }}>{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeState === 'multi-campus' && (
            <motion.div
              key="multi-campus"
              className="h-full overflow-hidden lp-dashboard-state"
              initial={prefersReducedMotion ? 'visible' : 'hidden'}
              animate="visible"
              exit={{ opacity: 0 }}
              variants={staggerContainer}
              transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <motion.div variants={childVariant} className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="tracking-tight" style={{ fontSize: 'var(--lp-font-dashboard-title)', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Campus Operations</h2>
                  <p style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-tertiary))' }}>Live status of all educational facilities.</p>
                </div>
                <button
                  className="lp-btn-dashboard px-3 py-1.5 font-medium"
                  style={{ fontSize: 'var(--lp-font-label)', backgroundColor: '#FFFFFF', border: '1px solid rgba(226,232,240,0.8)', borderRadius: 'var(--lp-radius-sm)', color: 'rgb(var(--text-primary))' }}
                >
                  Filter
                </button>
              </motion.div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {campusData.map((campus, i) => (
                  <motion.div
                    key={i}
                    variants={childVariant}
                    className="group relative flex flex-col overflow-hidden lp-dashboard-card"
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid rgba(226,232,240,0.8)',
                      borderRadius: 'var(--lp-radius-md)',
                      boxShadow: 'var(--lp-shadow-card)',
                    }}
                  >
                    <div className="h-20 w-full relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--lp-bento-peach), var(--lp-bento-blue))' }}>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <div
                        className="absolute top-14 left-4 z-20 flex h-10 w-10 items-center justify-center"
                        style={{ backgroundColor: '#FFFFFF', border: '3px solid rgb(var(--surface-primary))', borderRadius: 'var(--lp-radius-md)', boxShadow: 'var(--lp-shadow-card)' }}
                      >
                        <campus.icon className="h-5 w-5" style={{ color: 'rgb(var(--text-primary))' }} />
                      </div>
                      <div className="mt-6 flex flex-1 flex-col">
                        <div className="flex items-start justify-between">
                          <div className="pr-2">
                            <h3 className="font-bold text-base leading-tight truncate max-w-[120px]" title={campus.name} style={{ color: 'rgb(var(--text-primary))' }}>{campus.name}</h3>
                            <p className="mt-0.5 truncate" style={{ fontSize: '10px', color: 'rgb(var(--text-tertiary))' }}>{campus.type}</p>
                          </div>
                          <span
                            className="shrink-0 inline-flex items-center px-2 py-0.5 text-[10px] font-medium"
                            style={{
                              borderRadius: 'var(--lp-radius-pill)',
                              backgroundColor: campus.status === 'Optimal' ? '#ECFDF5' : campus.status === 'Good' ? '#EFF6FF' : '#FFFBEB',
                              color: campus.status === 'Optimal' ? '#059669' : campus.status === 'Good' ? '#2563EB' : '#D97706',
                            }}
                          >
                            {campus.status}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="p-2.5" style={{ backgroundColor: 'rgb(var(--surface-primary))', borderRadius: 'var(--lp-radius-sm)' }}>
                            <div className="flex items-center gap-1.5 mb-0.5" style={{ color: 'rgb(var(--text-tertiary))' }}>
                              <GraduationCap className="h-3 w-3" />
                              <span style={{ fontSize: '10px', fontWeight: 'var(--lp-weight-label)' }}>Students</span>
                            </div>
                            <div style={{ fontSize: 'var(--lp-font-dashboard-value)', fontWeight: 'var(--lp-weight-heading)', color: 'rgb(var(--text-primary))' }}>{campus.students}</div>
                          </div>
                          <div className="p-2.5" style={{ backgroundColor: 'rgb(var(--surface-primary))', borderRadius: 'var(--lp-radius-sm)' }}>
                            <div className="flex items-center gap-1.5 mb-0.5" style={{ color: 'rgb(var(--text-tertiary))' }}>
                              <Users className="h-3 w-3" />
                              <span style={{ fontSize: '10px', fontWeight: 'var(--lp-weight-label)' }}>Staff</span>
                            </div>
                            <div style={{ fontSize: 'var(--lp-font-dashboard-value)', fontWeight: 'var(--lp-weight-heading)', color: 'rgb(var(--text-primary))' }}>{campus.staff}</div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1" style={{ fontSize: '10px' }}>
                            <span style={{ fontWeight: 'var(--lp-weight-label)', color: 'rgb(var(--text-tertiary))' }}>Health Score</span>
                            <span style={{ fontWeight: 'var(--lp-weight-heading)', color: 'rgb(var(--text-primary))' }}>{campus.health}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden" style={{ backgroundColor: 'rgba(226,232,240,0.6)', borderRadius: 'var(--lp-radius-pill)' }}>
                            <div
                              className="h-full lp-progress-bar"
                              style={{ width: `${campus.health}%`, backgroundColor: campus.health > 90 ? '#22C55E' : '#F59E0B', borderRadius: 'var(--lp-radius-pill)' }}
                            />
                          </div>
                        </div>
                        <button
                          className="lp-btn-dashboard group/btn mt-auto pt-4 flex w-full items-center justify-center gap-2 py-1.5 font-medium"
                          style={{ fontSize: 'var(--lp-font-label)', backgroundColor: 'rgb(var(--surface-primary))', border: '1px solid rgba(226,232,240,0.8)', borderRadius: 'var(--lp-radius-sm)', color: 'rgb(var(--text-primary))' }}
                        >
                          View Dashboard
                          <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeState === 'hr' && (
            <motion.div
              key="hr"
              className="h-full overflow-hidden lp-dashboard-state"
              initial={prefersReducedMotion ? 'visible' : 'hidden'}
              animate="visible"
              exit={{ opacity: 0 }}
              variants={staggerContainer}
              transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <motion.div variants={childVariant} className="mb-5">
                <h2 className="tracking-tight" style={{ fontSize: 'var(--lp-font-dashboard-title)', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Workforce Analytics</h2>
                <p style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-tertiary))' }}>Staff distribution and retention metrics.</p>
              </motion.div>

              <div className="grid gap-5 md:grid-cols-2">
                <motion.div variants={childVariant} className="lp-dashboard-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(226,232,240,0.8)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding-lg)', boxShadow: 'var(--lp-shadow-card)' }}>
                  <h3 className="mb-4" style={{ fontSize: '0.8125rem', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Role Distribution</h3>
                  <div className="flex items-center justify-center">
                    <div className="h-[200px] w-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={hrData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" isAnimationActive={!prefersReducedMotion} animationDuration={1000} animationBegin={200}>
                            {hrData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-center gap-4">
                    {hrData.map((entry, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span style={{ fontSize: '11px', fontWeight: 'var(--lp-weight-label)', color: 'rgb(var(--text-secondary))' }}>{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <div className="space-y-4">
                  <motion.div variants={childVariant} className="lp-dashboard-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(226,232,240,0.8)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding-lg)', boxShadow: 'var(--lp-shadow-card)' }}>
                    <UITooltip content="Up 2.1% from last year">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 style={{ fontSize: '0.8125rem', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Retention Rate</h3>
                        <span style={{ color: '#22C55E', fontWeight: 'var(--lp-weight-heading)', fontSize: 'var(--lp-font-dashboard-value)' }}>96.5%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden" style={{ backgroundColor: 'rgba(226,232,240,0.6)', borderRadius: 'var(--lp-radius-pill)' }}>
                        <div className="h-full lp-progress-bar" style={{ width: '96.5%', backgroundColor: '#22C55E', borderRadius: 'var(--lp-radius-pill)' }} />
                      </div>
                    </UITooltip>
                    <p className="mt-2" style={{ fontSize: '10px', color: 'rgb(var(--text-tertiary))' }}>Top 5% of districts in the state</p>
                  </motion.div>

                  <motion.div variants={childVariant} className="lp-dashboard-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(226,232,240,0.8)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding-lg)', boxShadow: 'var(--lp-shadow-card)' }}>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 style={{ fontSize: '0.8125rem', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Professional Development</h3>
                      <span style={{ color: '#2A9D8F', fontWeight: 'var(--lp-weight-heading)', fontSize: 'var(--lp-font-dashboard-value)' }}>842 hrs</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { name: 'Advanced Pedagogy', progress: 75, tooltip: 'Highest engagement course' },
                        { name: 'Digital Literacy', progress: 45, tooltip: 'Required for new hires' },
                      ].map((course, i) => (
                        <UITooltip key={i} content={course.tooltip}>
                          <div className="w-full text-left">
                            <div className="mb-1 flex justify-between w-full" style={{ fontSize: '10px', fontWeight: 'var(--lp-weight-label)', color: 'rgb(var(--text-primary))' }}>
                              <span>{course.name}</span>
                              <span>{course.progress}%</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden" style={{ backgroundColor: 'rgba(226,232,240,0.6)', borderRadius: 'var(--lp-radius-pill)' }}>
                              <div className="h-full lp-progress-bar" style={{ width: `${course.progress}%`, backgroundColor: '#F97316', borderRadius: 'var(--lp-radius-pill)' }} />
                            </div>
                          </div>
                        </UITooltip>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {activeState === 'analytics' && (
            <motion.div
              key="analytics"
              className="h-full overflow-hidden lp-dashboard-state"
              initial={prefersReducedMotion ? 'visible' : 'hidden'}
              animate="visible"
              exit={{ opacity: 0 }}
              variants={staggerContainer}
              transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <motion.div variants={childVariant} className="mb-5">
                <h2 className="tracking-tight" style={{ fontSize: 'var(--lp-font-dashboard-title)', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Predictive Insights</h2>
                <p style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-tertiary))' }}>AI-driven analysis for future planning.</p>
              </motion.div>

              <div className="grid gap-5 md:grid-cols-3">
                <motion.div
                  variants={childVariant}
                  className="col-span-2 lp-dashboard-card"
                  style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(226,232,240,0.8)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding-lg)', boxShadow: 'var(--lp-shadow-card)' }}
                >
                  <h3 className="mb-4" style={{ fontSize: '0.8125rem', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Student Performance Forecast</h3>
                  <div className="h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={overviewData}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} dy={10} interval={Math.ceil(overviewData.length / 3)} />
                        <YAxis axisLine={false} tickLine={false} tick={false} width={0} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(226,232,240,0.4)' }} />
                        <Line type="monotone" dataKey="actual" stroke="#F97316" strokeWidth={2.5} dot={{ r: 3, fill: '#F97316', strokeWidth: 0 }} activeDot={{ r: 6, stroke: '#FFFFFF', strokeWidth: 2 }} isAnimationActive={!prefersReducedMotion} animationDuration={1200} animationEasing="ease-out" animationBegin={400} />
                        <Line type="monotone" dataKey="budget" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 5, stroke: '#FFFFFF', strokeWidth: 2 }} isAnimationActive={!prefersReducedMotion} animationDuration={1200} animationEasing="ease-out" animationBegin={600} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                <div className="space-y-4">
                  <motion.div
                    variants={childVariant}
                    className="lp-dashboard-card"
                    style={{
                      background: 'linear-gradient(135deg, var(--lp-bento-peach), #FFFFFF)',
                      border: '1px solid rgba(249,115,22,0.15)',
                      borderRadius: 'var(--lp-radius-md)',
                      padding: 'var(--lp-card-padding-lg)',
                    }}
                  >
                    <div className="mb-3 flex items-center gap-2" style={{ color: '#F97316' }}>
                      <BrainCircuit className="h-5 w-5" />
                      <h3 style={{ fontSize: '0.8125rem', fontWeight: 'var(--lp-weight-subheading)' }}>Intelligent Insight</h3>
                    </div>
                    <p className="leading-relaxed text-pretty" style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-secondary))' }}>
                      Enrollment projection models indicate a <strong>12% surge in STEM demand</strong> for Q3.
                    </p>
                    <div
                      className="mt-2 p-2"
                      style={{ fontSize: '10px', backgroundColor: '#FFFFFF', border: '1px solid rgba(226,232,240,0.8)', borderRadius: 'var(--lp-radius-sm)', color: 'rgb(var(--text-primary))' }}
                    >
                      <span style={{ fontWeight: 'var(--lp-weight-subheading)', color: '#F97316' }}>Recommended Action:</span> Reallocate <strong>$45k</strong> from surplus to secure 3 adjunct lab instructors.
                    </div>
                    <button
                      className="lp-btn-dashboard mt-4 w-full px-3 py-2"
                      style={{ fontSize: 'var(--lp-font-label)', fontWeight: 'var(--lp-weight-label)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 'var(--lp-radius-pill)', color: '#F97316', backgroundColor: 'transparent' }}
                    >
                      Execute Allocation
                    </button>
                  </motion.div>

                  <motion.div variants={childVariant} className="lp-dashboard-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(226,232,240,0.8)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding-lg)', boxShadow: 'var(--lp-shadow-card)' }}>
                    <h3 className="mb-3" style={{ fontSize: '0.8125rem', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Risk Assessment</h3>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between p-2.5" style={{ backgroundColor: '#FEF2F2', borderRadius: 'var(--lp-radius-sm)', color: '#EF4444' }}>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span style={{ fontSize: 'var(--lp-font-label)', fontWeight: 'var(--lp-weight-label)' }}>Budget Variance</span>
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 'var(--lp-weight-heading)', backgroundColor: 'rgba(239,68,68,0.15)', padding: '2px 6px', borderRadius: '4px' }}>HIGH</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5" style={{ backgroundColor: '#FFFBEB', borderRadius: 'var(--lp-radius-sm)', color: '#D97706' }}>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span style={{ fontSize: 'var(--lp-font-label)', fontWeight: 'var(--lp-weight-label)' }}>Staff Turnover</span>
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 'var(--lp-weight-heading)', backgroundColor: 'rgba(217,119,6,0.15)', padding: '2px 6px', borderRadius: '4px' }}>MED</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function AnimatedNumber({ value, reduced }: { value: string; reduced: boolean }) {
  const numericPart = parseFloat(value.replace(/[^0-9.]/g, ''))
  const prefix = value.match(/^[^0-9]*/)?.[0] || ''
  const suffix = value.match(/[^0-9.]*$/)?.[0] || ''
  const hasComma = value.includes(',')
  const isPercent = value.includes('%')

  const motionVal = useMotionValue(0)
  const springVal = useSpring(motionVal, { stiffness: 50, damping: 20 })
  const [display, setDisplay] = useState(reduced ? value : `${prefix}0${suffix}`)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (reduced || hasAnimated.current) return
    hasAnimated.current = true
    motionVal.set(numericPart)
  }, [reduced, motionVal, numericPart])

  useEffect(() => {
    if (reduced) {
      setDisplay(value)
      return
    }
    const unsubscribe = springVal.on('change', (v: number) => {
      let formatted: string
      if (isPercent) {
        formatted = `${v.toFixed(1)}%`
      } else if (hasComma) {
        formatted = `${prefix}${Math.round(v).toLocaleString()}${suffix.replace('%', '')}`
      } else {
        formatted = `${prefix}${Math.round(v)}${suffix}`
      }
      setDisplay(formatted)
    })
    return unsubscribe
  }, [springVal, reduced, value, prefix, suffix, hasComma, isPercent])

  return <>{display}</>
}

const MetricCard = memo(function MetricCard({
  title,
  value,
  trend,
  trendUp,
  icon: Icon,
  color,
  bgColor,
  reduced,
}: {
  title: string
  value: string
  trend: string
  trendUp: boolean
  icon: React.ElementType
  color: string
  bgColor: string
  reduced: boolean
}) {
  return (
    <motion.div
      className="lp-dashboard-card"
      initial={reduced ? {} : { scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.3 }}
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid rgba(226,232,240,0.8)',
        borderRadius: 'var(--lp-radius-md)',
        padding: 'var(--lp-card-padding)',
        boxShadow: 'var(--lp-shadow-card)',
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="p-2" style={{ borderRadius: 'var(--lp-radius-sm)', backgroundColor: bgColor }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <span className="flex items-center" style={{ fontSize: '10px', fontWeight: 'var(--lp-weight-label)', color: trendUp ? '#22C55E' : '#EF4444' }}>
          {trendUp ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingUp className="mr-1 h-3 w-3 rotate-180" />}
          {trend}
        </span>
      </div>
      <div>
        <div className="tracking-tight" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 'var(--lp-weight-heading)', color: 'rgb(var(--text-primary))' }}>
          <AnimatedNumber value={value} reduced={reduced} />
        </div>
        <div className="mt-0.5" style={{ fontSize: '10px', color: 'rgb(var(--text-tertiary))' }}>{title}</div>
      </div>
    </motion.div>
  )
})
