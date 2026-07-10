/**
 * Landing V2 copy catalog — single source of truth.
 *
 * Every user-visible string on the landing surface lives here. Sections import
 * from this file; no hardcoded copy in JSX from Sprint 1 onward.
 *
 * Strings are lifted verbatim from the Claude Design bundle at
 * `temp/edforge-landing-page/project/components/*.jsx`. Marketing editorial
 * sign-off is a Sprint 7 gate (S7-T15); until then this is the ship copy.
 */

export const HERO = {
  headingSerif1: 'Well-run',
  headingMid: ' schools teach better.\nWe built Edforge around ',
  headingSerif2: 'that idea',
  headingTail: '.',
  lede: "One modern, secure platform for student records, school operations, finance, and analytics — so the people running schools can spend their energy on the people they're running them for.",
  scrollHint: 'See Edforge',
  ctaPrimary: 'See Edforge',
  ctaPrimaryHref: '#use-cases',
  trustBadges: [
    'FERPA & COPPA by design',
    'Built with educators',
    'Migrates your legacy SIS',
  ],
} as const

export type UseCaseFeature = {
  id: string
  title: string
  highlight: string
  titleSuffix?: string
  description: string
  /** Chapter start time in seconds within the video. */
  start: number
}

export const USE_CASE_DISTRICT = {
  id: 'use-cases',
  eyebrow: 'FOR SCHOOL LEADERS',
  headingLead: 'Lead from',
  headingSerif: 'what matters',
  headingTail: ",\nnot what's loudest.",
  lede: "Effective school systems share three traits: a single source of truth, real-time visibility, and data that reaches the people making decisions. Edforge is built on all three — because operational clarity is how learning outcomes compound, year after year.",
  mediaLength: '0:21',
  accent: 'var(--lp-primary)',
  features: [
    {
      id: 'truth',
      title: 'A single source of truth.',
      highlight: 'single source of truth',
      titleSuffix: 'A .',
      description:
        'Student records, attendance, academics, staffing, and finance — one system, one schema, one login. The end of reconciling three tools that disagree with each other.',
      // Chapter starts match the spliced district.mp4 (see scripts/record-landing.mjs)
      start: 0,
    },
    {
      id: 'visibility',
      title: 'Real-time visibility.',
      highlight: 'Real-time',
      titleSuffix: ' visibility.',
      description:
        "Trends visible while they're still addressable, not in next quarter's report. Leaders see a full-week attendance drop on Wednesday, not in a Friday summary email.",
      start: 7,
    },
    {
      id: 'decisions',
      title: 'Decisions that reach the classroom.',
      highlight: 'Decisions',
      titleSuffix: ' that reach the classroom.',
      description:
        'Insights that prompt a next step — a call, a meeting, a policy review. Clarity is only useful when it leads to action.',
      start: 14,
    },
  ] satisfies UseCaseFeature[],
} as const

export const USE_CASE_TEACHERS = {
  id: 'teachers-parents',
  eyebrow: 'FOR TEACHERS & FAMILIES',
  headingLead: 'Between a teacher and a family,\nonly the',
  headingSerif: 'student',
  headingTail: ' should be in the way.',
  lede: "Teachers shouldn't need five tools to know their classrooms — and families shouldn't be strangers to the record. Edforge keeps sections, attendance, and every child's history in one place, with guardians attached to every student from day one.",
  mediaLength: '0:17',
  accent: 'var(--lp-teal)',
  features: [
    {
      id: 'classrooms',
      title: 'Classrooms at a glance.',
      highlight: 'Classrooms',
      titleSuffix: ' at a glance.',
      description:
        'Every section a teacher runs — subject, roster, and seat utilization — in one view. No spreadsheets, no guessing.',
      start: 0,
    },
    {
      id: 'progress',
      title: "A record of a child's progress.",
      highlight: 'record',
      titleSuffix: "A  of a child's progress.",
      description:
        'Attendance trends, classes, and academic history in one profile — so a conversation about a student starts from the full picture, not a guess.',
      start: 8,
    },
    {
      id: 'family',
      title: 'Families, part of the record.',
      highlight: 'Families',
      titleSuffix: ', part of the record.',
      description:
        'Guardians, relationships, and pickup authorization attached to every student — who to reach is never a mystery.',
      start: 14,
    },
  ] satisfies UseCaseFeature[],
} as const

export const USE_CASE_STUDENTS = {
  id: 'students',
  eyebrow: 'FOR STUDENTS',
  headingLead: 'Every student,',
  headingSerif: 'fully seen',
  headingTail: '.',
  lede: "Behind every student is a record that tells their story — enrollment, attendance patterns, classes, and the people who care for them. Edforge keeps that story complete, current, and ready for the moment it's needed, from a parent meeting to a government report.",
  mediaLength: '0:18',
  accent: 'var(--lp-blue)',
  features: [
    {
      id: 'trend',
      title: 'Attendance, as a story.',
      highlight: 'Attendance',
      titleSuffix: ', as a story.',
      description:
        "Per-student sparklines on the roster and day-by-day history on the profile — patterns surface while there's still time to act.",
      start: 0,
    },
    {
      id: 'record',
      title: 'One complete record.',
      highlight: 'complete record',
      titleSuffix: 'One .',
      description:
        'Enrollment, demographics, classes, and guardians in one profile — IEMIS-ready for government reporting.',
      start: 9,
    },
    {
      id: 'curriculum',
      title: 'A curriculum, mapped.',
      highlight: 'curriculum',
      titleSuffix: 'A , mapped.',
      description:
        'Courses tied to grade levels with clear credit structure — what every student is learning, organized and visible.',
      start: 13,
    },
  ] satisfies UseCaseFeature[],
} as const

export const PLATFORM_PILLARS = {
  eyebrow: 'HOW IT ALL CONNECTS',
  headingLead: 'One data model.\nEvery decision',
  headingSerif: 'traceable to a student',
  headingTail: '.',
  lede: "Edforge is built on the Ed-Fi data standard — the same open specification used across the world's most data-mature education systems. Every module shares one schema, which means every question you ask connects cleanly back to the student it's about.",
  cards: [
    {
      id: 'core',
      title: 'Edforge Core',
      description:
        'Enrollment, attendance, guardians, and demographics. The foundational record of every student, built to open standards.',
      colSpan: 7,
      visual: 'core',
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description:
        "Early-warning indicators drawn from education research. See patterns forming while there's still time to act.",
      colSpan: 5,
      visual: 'analytics',
    },
    {
      id: 'finance',
      title: 'Finance',
      description:
        "Fee structures, invoices, payments, and family billing. Every payment traceable to the student it's for.",
      colSpan: 5,
      visual: 'finance',
    },
    {
      id: 'chat',
      title: 'Communications',
      description:
        'Family and staff communication built around the shared student record — announcements, notices, and delivery preferences, now in development.',
      colSpan: 7,
      visual: 'chat',
    },
    {
      id: 'calendar',
      title: 'Scheduling',
      description:
        'Academic years, class sections, bell schedules, and school calendars — with Bikram Sambat and Gregorian dates side by side.',
      colSpan: 6,
      visual: 'calendar',
    },
    {
      id: 'api',
      title: 'Platform & API',
      description:
        'Built on the open Ed-Fi data model, so your data is never locked in — enrollment and finance records export to CSV today. A public API, GraphQL, and SSO are on the roadmap.',
      colSpan: 6,
      visual: 'api',
    },
  ],
} as const

export const SECURITY_STRIP = {
  tag: 'Trust, built-in',
  headingLead: 'Student data is',
  headingSerif: 'sacred',
  headingTail: '.\nWe treat it that way.',
  lede: "Parents, teachers, and school leaders shouldn't need a legal team to understand how a platform handles a child's records. Here's ours, in plain language.",
  promises: [
    {
      icon: 'lock',
      title: 'Encrypted, always.',
      description:
        'AES-256 at rest, TLS in transit. Data is protected by design, not by exception.',
    },
    {
      icon: 'users',
      title: 'Least-privilege access.',
      description:
        'Every teacher, staff member, and administrator sees only what their role requires — with a full audit trail behind every record.',
    },
    {
      icon: 'privacy',
      title: 'Your data stays yours.',
      description:
        "We don't sell it. We don't share it. We don't train AI on it. And your data is never locked in — it lives in the open Ed-Fi format, and we'll hand it all back whenever you ask.",
    },
  ],
  frameworksLabel: 'Built to the standards that matter',
  frameworks: ['FERPA', 'COPPA', 'GDPR'],
  cta: 'Read our privacy promise',
  ctaHref: '/privacy',
} as const

export const MIGRATION = {
  eyebrow: 'THE EDFORGE SWITCH',
  headingLead: 'Ripping out legacy software',
  headingSerif: "shouldn't",
  headingTail: '\nfeel like ripping off a bandage.',
  lede: 'Our white-glove migration crew does the heavy lifting — from the SQL joins nobody documented to the "how do we actually run report cards" institutional knowledge. You keep teaching. We\'ll handle the wiring.',
  steps: [
    {
      week: 'Week 1',
      title: 'Listen first',
      description:
        'We sit with your team, map the real workflows, and find the skeletons in your SIS.',
      emoji: '\uD83D\uDC42',
    },
    {
      week: 'Week 2',
      title: 'Move the mountain',
      description:
        'Our engineers migrate every student record, roster, grade, and audit trail. No data left behind.',
      emoji: '\u26F0\uFE0F',
    },
    {
      week: 'Week 3',
      title: 'Train the crew',
      description:
        "Role-based training that respects your staff's time — and makes them actually excited to log in.",
      emoji: '\uD83C\uDF93',
    },
    {
      week: 'Week 4',
      title: 'Flip the switch',
      description:
        'Parallel run, cutover weekend, and a human on Slack at 2am if your principal needs us.',
      emoji: '\uD83D\uDE80',
    },
  ],
  days: '30',
  daysHeadline: 'Days, start to finish.',
  daysSub: 'Not 30 months. Not 30 meetings. Thirty days.',
  sampleLink: 'See a sample migration plan',
  sampleHref: 'mailto:shoaib@edforge.app?subject=Migration%20plan%20sample',
} as const

export const FAQ = {
  eyebrow: 'FAQS',
  headingLead: 'Have questions?',
  headingSerif: "We've got answers.",
  items: [
    {
      q: 'What exactly is Edforge?',
      a: 'A modern school management platform that brings student records, academics (enrollment, attendance, exams), finance, and analytics into one system — with family communications on the roadmap. Designed for schools and school networks that want a single source of truth instead of a patchwork of disconnected tools.',
    },
    {
      q: 'Who built Edforge? What stage is it at?',
      a: "Edforge is an early-stage platform, designed and engineered by a small, focused team drawing on research from the World Bank's SABER framework, the EdTech Hub, the U.S. Department of Education, and the Ed-Fi standards community. We're building in the open, with a live pilot in Nepal leading the way.",
    },
    {
      q: 'Is Edforge ready to replace what we have today?',
      a: "For the right schools, yes. We're live with our first pilot school and building alongside them — and we're looking for our next early partners. If you're curious whether that describes your school, we'd love a conversation.",
    },
    {
      q: 'How does Edforge handle student data privacy?',
      a: 'Encrypted at rest and in transit. Role-based access with full audit logs. Built to FERPA, COPPA, and GDPR standards. We never sell, share, or train AI on student data.',
    },
    {
      q: 'Does Edforge work with Google Workspace or Microsoft 365?',
      a: 'Not yet. Single sign-on with Google Workspace and Microsoft 365, plus calendar and assignment sync, are on our near-term roadmap. Today Edforge runs as a standalone, secure platform.',
    },
    {
      q: 'What languages does Edforge support?',
      a: 'The interface is available in English and Nepali today, with more languages planned.',
    },
  ],
} as const

export const FINAL_CTA = {
  headingLead: 'A platform this important should be',
  headingSerif: 'built with you',
  headingTail: ',\nnot sold to you.',
  lede: "We're at the early stage — where the people who use Edforge also help decide what it becomes. If your school is ready for a modern system and an unusual partnership, we'd like to talk.",
  cta: 'Start the conversation',
  ctaHref: 'mailto:shoaib@edforge.app',
  ctaMicro: 'No slide deck. No pressure. A 30-minute working session.',
} as const

export const FOOTER = {
  tagline:
    'The modern EMIS platform for schools. Built with educators and school operators.',
  legalEntity: 'Edforge Technologies',
  copyright: '\u00A9 2026 Edforge Technologies. All rights reserved.',
  columns: [
    {
      heading: 'Product',
      items: [
        { label: 'Edforge Core', href: '#platform' },
        { label: 'Academics', href: '#platform' },
        { label: 'Finance', href: '#platform' },
        { label: 'Analytics', href: '#platform' },
      ],
    },
    {
      heading: 'Solutions',
      items: [
        { label: 'School Leaders', href: '#use-cases' },
        { label: 'Teachers & Families', href: '#teachers-parents' },
        { label: 'Students', href: '#students' },
      ],
    },
    {
      heading: 'Resources',
      items: [
        { label: 'Security', href: '/security' },
        { label: 'Privacy', href: '/privacy' },
        { label: 'Terms', href: '/terms' },
      ],
    },
    {
      heading: 'Company',
      items: [
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ],
    },
  ],
  legalLinks: [
    { label: 'Terms', href: '/terms' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Security', href: '/security' },
    { label: 'Accessibility', href: '/legal/accessibility' },
  ],
} as const
