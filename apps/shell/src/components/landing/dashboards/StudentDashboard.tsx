import { BookOpen, Trophy, Target, Zap } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '../hooks/useReducedMotion'

type StudentState = 'learning' | 'engagement' | 'achievements' | 'personalized'

interface StudentDashboardProps {
  activeState: StudentState
}

const weeklyData = [
  { name: 'Mon', value: 40 },
  { name: 'Tue', value: 60 },
  { name: 'Wed', value: 45 },
  { name: 'Thu', value: 80 },
  { name: 'Fri', value: 70 },
  { name: 'Sat', value: 90 },
  { name: 'Sun', value: 85 },
]

const tooltipStyle = {
  backgroundColor: '#FFFFFF',
  borderColor: 'rgba(226,232,240,0.8)',
  borderRadius: '12px',
  fontSize: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
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
  const prefersReducedMotion = useReducedMotion()

  return (
    <div
      className="relative flex items-center justify-center cursor-help w-full"
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

export function StudentDashboard({ activeState }: StudentDashboardProps) {
  const prefersReducedMotion = useReducedMotion()
  const childVariant = prefersReducedMotion ? staggerNone : staggerChild

  return (
    <div
      role="img"
      aria-label="Student learning dashboard demonstration showing courses, achievements, and progress"
      className="relative overflow-hidden transition-all duration-800 h-[min(480px,65vh)] md:h-[min(560px,70vh)]"
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
      <div className="h-full overflow-hidden p-6 relative z-10" style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)' }}>
        <AnimatePresence mode="wait">
          {activeState === 'learning' && (
            <motion.div
              key="learning"
              className="h-full overflow-hidden lp-dashboard-state"
              initial={prefersReducedMotion ? 'visible' : 'hidden'}
              animate="visible"
              exit={{ opacity: 0 }}
              variants={staggerContainer}
              transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <motion.div variants={childVariant}>
                <h3 className="mb-4" style={{ fontSize: 'var(--lp-font-dashboard-title)', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Continue Learning</h3>
              </motion.div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { subject: 'Mathematics', progress: 78, lesson: 'Algebra: Solving Equations', color: '#F97316', bg: 'var(--lp-bento-peach)' },
                  { subject: 'Science', progress: 65, lesson: 'Chemistry: Periodic Table', color: '#2A9D8F', bg: 'var(--lp-bento-mint)' },
                ].map((course, i) => (
                  <motion.div
                    key={i}
                    variants={childVariant}
                    className="lp-dashboard-card"
                    style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(226,232,240,0.8)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding)', boxShadow: 'var(--lp-shadow-card)' }}
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center" style={{ backgroundColor: course.bg, borderRadius: 'var(--lp-radius-md)' }}>
                        <BookOpen className="h-6 w-6" style={{ color: course.color }} />
                      </div>
                      <div className="flex-1">
                        <div style={{ fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>{course.subject}</div>
                        <div style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-tertiary))' }}>{course.lesson}</div>
                      </div>
                    </div>
                    <UITooltip content={course.subject === 'Mathematics' ? 'Next milestone: Chapter Test on Friday' : 'Review previous quiz before proceeding'}>
                      <div className="mb-2 w-full overflow-hidden" style={{ height: '6px', backgroundColor: 'rgba(226,232,240,0.6)', borderRadius: 'var(--lp-radius-pill)' }}>
                        <div className="h-full lp-progress-bar" style={{ width: `${course.progress}%`, backgroundColor: course.color, borderRadius: 'var(--lp-radius-pill)' }} />
                      </div>
                    </UITooltip>
                    <div className="flex items-center justify-between" style={{ fontSize: 'var(--lp-font-label)' }}>
                      <span style={{ color: 'rgb(var(--text-tertiary))' }}>{course.progress}% Complete</span>
                      <span style={{ fontWeight: 'var(--lp-weight-label)', color: course.color }}>Continue &rarr;</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeState === 'engagement' && (
            <motion.div
              key="engagement"
              className="h-full overflow-hidden lp-dashboard-state"
              initial={prefersReducedMotion ? 'visible' : 'hidden'}
              animate="visible"
              exit={{ opacity: 0 }}
              variants={staggerContainer}
              transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="grid h-full grid-cols-2 gap-4">
                <motion.div variants={childVariant} className="lp-dashboard-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(226,232,240,0.8)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding)', boxShadow: 'var(--lp-shadow-card)' }}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="p-2" style={{ backgroundColor: 'var(--lp-bento-mustard)', borderRadius: 'var(--lp-radius-sm)' }}>
                      <Trophy className="h-6 w-6" style={{ color: '#D97706' }} />
                    </div>
                    <div style={{ fontSize: 'var(--lp-font-label)', fontWeight: 'var(--lp-weight-label)', color: 'rgb(var(--text-primary))' }}>Your Achievements</div>
                  </div>
                  <UITooltip content="Earned 45 points this week">
                    <div className="mb-4 w-min text-center" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 'var(--lp-weight-heading)', color: '#F97316' }}>247</div>
                  </UITooltip>
                  <div className="mb-4" style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-tertiary))' }}>Total Points This Month</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between" style={{ fontSize: 'var(--lp-font-label)' }}>
                      <span style={{ color: 'rgb(var(--text-secondary))' }}>Weekly Rank</span>
                      <span style={{ fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>#3 in Class</span>
                    </div>
                    <div className="flex items-center justify-between" style={{ fontSize: 'var(--lp-font-label)' }}>
                      <span style={{ color: 'rgb(var(--text-secondary))' }}>Streak</span>
                      <span style={{ fontWeight: 'var(--lp-weight-subheading)', color: '#F59E0B' }}>12 Days</span>
                    </div>
                  </div>
                </motion.div>
                <motion.div variants={childVariant} className="lp-dashboard-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(226,232,240,0.8)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding)', boxShadow: 'var(--lp-shadow-card)' }}>
                  <h4 className="mb-4" style={{ fontSize: '0.8125rem', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Recent Badges</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Trophy, name: 'Math Master', bg: 'var(--lp-bento-mustard)', color: '#D97706' },
                      { icon: Zap, name: 'Speed Reader', bg: 'var(--lp-bento-mint)', color: '#059669' },
                      { icon: Target, name: 'Perfect Score', bg: 'var(--lp-bento-peach)', color: '#EA580C' },
                      { icon: Target, name: 'On Target', bg: 'var(--lp-bento-blue)', color: '#2563EB' },
                    ].map((badge, i) => (
                      <div
                        key={i}
                        className="p-3 text-center lp-dashboard-card"
                        style={{ backgroundColor: badge.bg, borderRadius: 'var(--lp-radius-md)' }}
                      >
                        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: '#FFFFFF', boxShadow: 'var(--lp-shadow-card)' }}>
                          <badge.icon className="h-6 w-6" style={{ color: badge.color }} />
                        </div>
                        <div style={{ fontSize: 'var(--lp-font-label)', fontWeight: 'var(--lp-weight-label)', color: 'rgb(var(--text-primary))' }}>{badge.name}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeState === 'achievements' && (
            <motion.div
              key="achievements"
              className="h-full overflow-hidden lp-dashboard-state"
              initial={prefersReducedMotion ? 'visible' : 'hidden'}
              animate="visible"
              exit={{ opacity: 0 }}
              variants={staggerContainer}
              transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <motion.div variants={childVariant}>
                <h3 className="mb-4" style={{ fontSize: 'var(--lp-font-dashboard-title)', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Your Progress Journey</h3>
              </motion.div>
              <div className="grid grid-cols-2 gap-4">
                <motion.div variants={childVariant} className="lp-dashboard-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(226,232,240,0.8)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding)', boxShadow: 'var(--lp-shadow-card)' }}>
                  <h4 className="mb-4" style={{ fontSize: '0.8125rem', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Overall Grade</h4>
                  <div className="mb-4 flex items-center justify-center">
                    <UITooltip content="Top 15% of class">
                      <div className="relative h-32 w-32">
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(226,232,240,0.6)" strokeWidth="8" />
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#F97316" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset="28.9" strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div style={{ fontSize: 'var(--lp-font-dashboard-value)', fontWeight: 'var(--lp-weight-heading)', color: 'rgb(var(--text-primary))' }}>A-</div>
                          <div style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-tertiary))' }}>88.5%</div>
                        </div>
                      </div>
                    </UITooltip>
                  </div>
                  <div className="text-center" style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-tertiary))' }}>Keep up the great work!</div>
                </motion.div>
                <motion.div variants={childVariant} className="lp-dashboard-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(226,232,240,0.8)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding)', boxShadow: 'var(--lp-shadow-card)' }}>
                  <h4 className="mb-4" style={{ fontSize: '0.8125rem', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Subject Breakdown</h4>
                  <div className="space-y-3">
                    {[
                      { subject: 'Math', grade: 'A', color: '#F97316' },
                      { subject: 'Science', grade: 'A-', color: '#2A9D8F' },
                      { subject: 'English', grade: 'B+', color: '#8B5CF6' },
                      { subject: 'History', grade: 'A', color: '#F59E0B' },
                    ].map((subj, i) => (
                      <div key={i} className="flex items-center justify-between p-2" style={{ backgroundColor: 'rgb(var(--surface-primary))', borderRadius: 'var(--lp-radius-sm)' }}>
                        <span style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-primary))' }}>{subj.subject}</span>
                        <span style={{ fontSize: 'var(--lp-font-dashboard-value)', fontWeight: 'var(--lp-weight-heading)', color: subj.color }}>{subj.grade}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeState === 'personalized' && (
            <motion.div
              key="personalized"
              className="h-full overflow-hidden lp-dashboard-state"
              initial={prefersReducedMotion ? 'visible' : 'hidden'}
              animate="visible"
              exit={{ opacity: 0 }}
              variants={staggerContainer}
              transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <motion.div variants={childVariant}>
                <h3 className="mb-4" style={{ fontSize: 'var(--lp-font-dashboard-title)', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Recommended For You</h3>
              </motion.div>
              <div className="space-y-4">
                <motion.div variants={childVariant} className="lp-dashboard-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(226,232,240,0.8)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding)', boxShadow: 'var(--lp-shadow-card)' }}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="p-2" style={{ backgroundColor: 'var(--lp-bento-peach)', borderRadius: 'var(--lp-radius-sm)' }}>
                      <Target className="h-5 w-5" style={{ color: '#F97316' }} />
                    </div>
                    <div style={{ fontSize: 'var(--lp-font-label)', fontWeight: 'var(--lp-weight-label)', color: 'rgb(var(--text-primary))' }}>Today's Focus Areas</div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-[150px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={weeklyData}>
                          <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#1E293B' }} />
                          <Line type="monotone" dataKey="value" stroke="#F97316" strokeWidth={3} dot={{ fill: '#F97316', strokeWidth: 2, stroke: '#FFFFFF' }} activeDot={{ r: 6, fill: '#F97316' }} isAnimationActive={!prefersReducedMotion} animationDuration={1200} animationEasing="ease-out" animationBegin={300} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    {[
                      { topic: 'Practice algebra word problems', reason: "You're close to mastering this!", priority: 'high' },
                      { topic: 'Review periodic table elements', reason: 'Quiz coming up on Friday', priority: 'medium' },
                    ].map((focus, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 lp-dashboard-card" style={{ backgroundColor: 'rgb(var(--surface-primary))', borderRadius: 'var(--lp-radius-sm)' }}>
                        <div
                          className="mt-1 h-3 w-3 rounded-full"
                          style={{ backgroundColor: focus.priority === 'high' ? '#EF4444' : '#F59E0B' }}
                        />
                        <div className="flex-1">
                          <div style={{ fontWeight: 'var(--lp-weight-label)', color: 'rgb(var(--text-primary))' }}>{focus.topic}</div>
                          <div style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-tertiary))' }}>{focus.reason}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
