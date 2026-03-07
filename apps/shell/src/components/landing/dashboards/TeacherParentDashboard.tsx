import { MessageCircle, MessageSquare, Users, CheckCircle, Award } from 'lucide-react'
import { getUserAvatar, getStudentAvatar } from '../../../lib/avatar'
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '../hooks/useReducedMotion'

type TeacherParentState = 'classroom' | 'communication' | 'progress' | 'collaboration'

interface TeacherParentDashboardProps {
  activeState: TeacherParentState
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

export function TeacherParentDashboard({ activeState }: TeacherParentDashboardProps) {
  const prefersReducedMotion = useReducedMotion()
  const childVariant = prefersReducedMotion ? staggerNone : staggerChild

  return (
    <div
      role="img"
      aria-label="Teacher and parent dashboard demonstration showing classroom management and communication features"
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
          {activeState === 'classroom' && (
            <motion.div
              key="classroom"
              className="h-full overflow-hidden lp-dashboard-state"
              initial={prefersReducedMotion ? 'visible' : 'hidden'}
              animate="visible"
              exit={{ opacity: 0 }}
              variants={staggerContainer}
              transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <motion.div variants={childVariant}>
                <h3 className="mb-4" style={{ fontSize: 'var(--lp-font-dashboard-title)', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Today's Schedule - Grade 5A</h3>
              </motion.div>
              <div className="space-y-3">
                {[
                  { time: '08:30 AM', subject: 'Mathematics', topic: 'Fractions & Decimals', status: 'completed' },
                  { time: '09:45 AM', subject: 'English Literature', topic: 'Creative Writing Workshop', status: 'in-progress' },
                  { time: '11:00 AM', subject: 'Science', topic: 'Ecosystem & Food Chains', status: 'upcoming' },
                ].map((lesson, i) => (
                  <motion.div
                    key={i}
                    variants={childVariant}
                    className="lp-dashboard-card"
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid rgba(226,232,240,0.8)',
                      borderRadius: 'var(--lp-radius-md)',
                      padding: 'var(--lp-card-padding)',
                      boxShadow: lesson.status === 'in-progress' ? '0 0 0 2px #F97316' : 'var(--lp-shadow-card)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div style={{ fontSize: 'var(--lp-font-label)', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>{lesson.time.split(' ')[0]}</div>
                          <div style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-tertiary))' }}>{lesson.time.split(' ')[1]}</div>
                        </div>
                        <div className="h-12 w-1 rounded-full" style={{ backgroundColor: '#F97316' }} />
                        <div>
                          <div style={{ fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>{lesson.subject}</div>
                          <div style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-tertiary))' }}>{lesson.topic}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {lesson.status === 'completed' && <CheckCircle className="h-5 w-5" style={{ color: '#22C55E' }} />}
                        {lesson.status === 'in-progress' && <div className="h-2 w-2 animate-pulse rounded-full" style={{ backgroundColor: '#F97316' }} />}
                        {lesson.status === 'upcoming' && <div style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-tertiary))' }}>Upcoming</div>}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeState === 'communication' && (
            <motion.div
              key="communication"
              className="h-full overflow-hidden lp-dashboard-state"
              initial={prefersReducedMotion ? 'visible' : 'hidden'}
              animate="visible"
              exit={{ opacity: 0 }}
              variants={staggerContainer}
              transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <motion.div variants={childVariant}>
                <h3 className="mb-4" style={{ fontSize: 'var(--lp-font-dashboard-title)', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Recent Messages</h3>
              </motion.div>
              <div className="space-y-3">
                {[
                  { from: 'Mrs. Johnson (Parent)', message: 'Thank you for the progress report. Could we schedule a meeting?', time: '10 min ago', unread: true },
                  { from: 'Mr. Thompson (Principal)', message: 'Faculty meeting moved to Wednesday 3 PM', time: '1 hour ago', unread: true },
                  { from: 'Mrs. Garcia (Parent)', message: "Emma will be absent tomorrow due to doctor's appointment", time: '2 hours ago', unread: false },
                ].map((msg, i) => (
                  <motion.div
                    key={i}
                    variants={childVariant}
                    className="lp-dashboard-card"
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid rgba(226,232,240,0.8)',
                      borderRadius: 'var(--lp-radius-md)',
                      padding: 'var(--lp-card-padding)',
                      boxShadow: msg.unread ? '0 0 0 1px #F97316' : 'var(--lp-shadow-card)',
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <img src={getUserAvatar(msg.from)} alt={msg.from} className="h-10 w-10 rounded-full" style={{ border: '2px solid rgba(226,232,240,0.8)' }} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span style={{ fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>{msg.from}</span>
                            {msg.unread && <div className="h-2 w-2 rounded-full" style={{ backgroundColor: '#F97316' }} />}
                          </div>
                          <p className="mt-1" style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-secondary))' }}>{msg.message}</p>
                          <span className="mt-2 inline-block" style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-tertiary))' }}>{msg.time}</span>
                        </div>
                      </div>
                      <MessageCircle className="h-5 w-5" style={{ color: 'rgb(var(--text-tertiary))' }} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeState === 'progress' && (
            <motion.div
              key="progress"
              className="h-full overflow-hidden lp-dashboard-state"
              initial={prefersReducedMotion ? 'visible' : 'hidden'}
              animate="visible"
              exit={{ opacity: 0 }}
              variants={staggerContainer}
              transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <motion.div variants={childVariant}>
                <h3 className="mb-4" style={{ fontSize: 'var(--lp-font-dashboard-title)', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Student Performance Insights</h3>
              </motion.div>
              <div className="grid grid-cols-2 gap-4">
                <motion.div variants={childVariant} className="lp-dashboard-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(226,232,240,0.8)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding-lg)', boxShadow: 'var(--lp-shadow-card)' }}>
                  <h4 className="mb-4" style={{ fontSize: '0.8125rem', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Subject Mastery</h4>
                  <div className="mt-4">
                    {[
                      { subject: 'Math', score: 92, trend: '+4%', color: '#F97316', tooltip: 'Consistent A average since Q1' },
                      { subject: 'Science', score: 88, trend: '+2%', color: '#2A9D8F', tooltip: 'Recent improved test scores' },
                      { subject: 'Language Arts', score: 95, trend: '+5%', color: '#8B5CF6', tooltip: 'Top performer in class' },
                    ].map((item, i) => (
                      <UITooltip key={i} content={item.tooltip}>
                        <div className="mb-3 last:mb-0 w-full">
                          <div className="mb-1 flex items-center justify-between" style={{ fontSize: 'var(--lp-font-label)', fontWeight: 'var(--lp-weight-medium)', color: 'rgb(var(--text-secondary))' }}>
                            <span>{item.subject}</span>
                            <div className="flex items-center gap-2">
                              <span style={{ fontSize: '10px', color: '#22C55E' }}>{item.trend}</span>
                              <span style={{ fontWeight: 'var(--lp-weight-bold)', color: 'rgb(var(--text-primary))' }}>{item.score}%</span>
                            </div>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden" style={{ backgroundColor: 'rgba(226,232,240,0.6)', borderRadius: 'var(--lp-radius-pill)' }}>
                            <div className="h-full lp-progress-bar" style={{ width: `${item.score}%`, backgroundColor: item.color, borderRadius: 'var(--lp-radius-pill)' }} />
                          </div>
                        </div>
                      </UITooltip>
                    ))}
                  </div>
                </motion.div>
                <motion.div variants={childVariant} className="lp-dashboard-card flex flex-col items-center justify-center p-4 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(226,232,240,0.8)', borderRadius: 'var(--lp-radius-md)', boxShadow: 'var(--lp-shadow-card)' }}>
                  <UITooltip content="Up 5% from last semester">
                    <div className="flex flex-col items-center">
                      <h3 style={{ fontSize: '0.8125rem', fontWeight: 'var(--lp-weight-subheading)' }}>Parent Participation</h3>
                      <div className="relative mt-2 h-16 w-16 flex items-center justify-center rounded-full" style={{ border: '4px solid #E2E8F0', borderTopColor: '#F97316' }}>
                        <span style={{ fontSize: 'var(--lp-font-label)', fontWeight: 'var(--lp-weight-heading)' }}>92%</span>
                      </div>
                      <p className="mt-2 text-[10px]" style={{ color: 'rgb(var(--text-tertiary))' }}>Active this week</p>
                    </div>
                  </UITooltip>
                </motion.div>
                <motion.div variants={childVariant} className="col-span-2 lp-dashboard-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(226,232,240,0.8)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding-lg)', boxShadow: 'var(--lp-shadow-card)' }}>
                  <h4 className="mb-4" style={{ fontSize: '0.8125rem', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Top Performers This Week</h4>
                  <div className="space-y-3">
                    {[
                      { name: 'Emma Thompson', achievement: 'Perfect score on Math quiz', score: 100 },
                      { name: 'Liam Chen', achievement: 'Outstanding essay submission', score: 98 },
                      { name: 'Sophia Martinez', achievement: 'Science project excellence', score: 96 },
                    ].map((student, i) => (
                      <div key={i} className="flex items-center justify-between p-3" style={{ backgroundColor: 'var(--lp-bento-peach)', borderRadius: 'var(--lp-radius-sm)' }}>
                        <div className="flex items-center gap-3">
                          <img src={getStudentAvatar(student.name)} alt={student.name} className="h-10 w-10 rounded-full" style={{ border: '2px solid rgba(226,232,240,0.8)' }} />
                          <div>
                            <div style={{ fontSize: 'var(--lp-font-label)', fontWeight: 'var(--lp-weight-label)', color: 'rgb(var(--text-primary))' }}>{student.name}</div>
                            <div style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-secondary))' }}>{student.achievement}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4" style={{ color: '#F97316' }} />
                          <span style={{ fontSize: 'var(--lp-font-dashboard-value)', fontWeight: 'var(--lp-weight-heading)', color: '#F97316', fontVariantNumeric: 'tabular-nums' }}>{student.score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeState === 'collaboration' && (
            <motion.div
              key="collaboration"
              className="h-full overflow-hidden lp-dashboard-state"
              initial={prefersReducedMotion ? 'visible' : 'hidden'}
              animate="visible"
              exit={{ opacity: 0 }}
              variants={staggerContainer}
              transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <motion.div variants={childVariant}>
                <h3 className="mb-4" style={{ fontSize: 'var(--lp-font-dashboard-title)', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Parent Engagement Dashboard</h3>
              </motion.div>
              <div className="grid grid-cols-2 gap-4">
                <motion.div variants={childVariant} className="lp-dashboard-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(226,232,240,0.8)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding-lg)', boxShadow: 'var(--lp-shadow-card)' }}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="p-2" style={{ backgroundColor: 'var(--lp-bento-mint)', borderRadius: 'var(--lp-radius-sm)' }}>
                      <Users className="h-5 w-5" style={{ color: '#059669' }} />
                    </div>
                    <div style={{ fontSize: 'var(--lp-font-label)', fontWeight: 'var(--lp-weight-label)', color: 'rgb(var(--text-primary))' }}>Parent Participation</div>
                  </div>
                  <div className="mb-3" style={{ fontSize: 'var(--lp-font-dashboard-value)', fontWeight: 'var(--lp-weight-heading)', color: '#059669' }}>92%</div>
                  <div style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-tertiary))' }}>24 of 26 parents actively engaged</div>
                </motion.div>
                <motion.div variants={childVariant} className="lp-dashboard-card p-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(226,232,240,0.8)', borderRadius: 'var(--lp-radius-md)', boxShadow: 'var(--lp-shadow-card)' }}>
                  <UITooltip content="-1.5h improvement this month">
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: '#ECFDF5', color: '#059669' }}>
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '0.8125rem', fontWeight: 'var(--lp-weight-subheading)' }}>Response Rate</h3>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span style={{ fontSize: 'var(--lp-font-dashboard-value)', fontWeight: 'var(--lp-weight-heading)' }}>4.2</span>
                          <span style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-tertiary))' }}>hrs</span>
                        </div>
                      </div>
                    </div>
                  </UITooltip>
                </motion.div>
                <motion.div variants={childVariant} className="col-span-2 lp-dashboard-card" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(226,232,240,0.8)', borderRadius: 'var(--lp-radius-md)', padding: 'var(--lp-card-padding-lg)', boxShadow: 'var(--lp-shadow-card)' }}>
                  <h4 className="mb-4" style={{ fontSize: '0.8125rem', fontWeight: 'var(--lp-weight-subheading)', color: 'rgb(var(--text-primary))' }}>Upcoming Parent Conferences</h4>
                  <div className="space-y-3">
                    {[
                      { parent: 'Mr. & Mrs. Johnson', student: 'Emma Johnson', date: 'Tomorrow, 3:30 PM' },
                      { parent: 'Mrs. Rodriguez', student: 'Carlos Rodriguez', date: 'Thu, 4:00 PM' },
                      { parent: 'Mr. Chen', student: 'Liam Chen', date: 'Fri, 2:30 PM' },
                    ].map((conf, i) => (
                      <div key={i} className="flex items-center justify-between p-3" style={{ backgroundColor: 'rgb(var(--surface-primary))', borderRadius: 'var(--lp-radius-sm)' }}>
                        <div className="flex items-center gap-3">
                          <img src={getUserAvatar(conf.parent)} alt={conf.parent} className="h-10 w-10 rounded-full" style={{ border: '2px solid rgba(226,232,240,0.8)' }} />
                          <div>
                            <div style={{ fontSize: 'var(--lp-font-label)', fontWeight: 'var(--lp-weight-label)', color: 'rgb(var(--text-primary))' }}>{conf.parent}</div>
                            <div style={{ fontSize: 'var(--lp-font-label)', color: 'rgb(var(--text-tertiary))' }}>Re: {conf.student}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div style={{ fontSize: 'var(--lp-font-label)', fontWeight: 'var(--lp-weight-label)', color: '#F97316' }}>{conf.date}</div>
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
